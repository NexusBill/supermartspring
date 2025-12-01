const express = require("express");
const router = express.Router({ mergeParams: true });
const { ObjectId } = require("mongodb");
const getTenantDB = require("../databaseConnectins/tenantDb");
const fs = require("fs");
const path = require("path");
const sendEmail = require("./emailService");
const { readTenants } = require("../Util/jsonStore");

/* ---------------- ORDER CACHE ---------------- */
const orderCache = {}; 
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

/* ----------- MIDDLEWARE: Load Orders Collection ----------- */
const loadOrdersCollection = async (req, res, next) => {
  try {
    const clientCode = req.params.clientCode;

    if (!clientCode)
      return res.status(400).json({ error: "Client code missing" });

    const tenantDB = await getTenantDB(clientCode);
    req.clientCode = clientCode;
    req.ordersCollection = tenantDB.collection("orders");

    next();
  } catch (err) {
    console.error("Middleware error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

router.use(loadOrdersCollection);

router.post("/send-email", async (req, res) => {
  try {
    const {
      to,
      subject,
      message
    } = req.body;

    // Read HTML template
    let html = fs.readFileSync(
      path.join(__dirname, "templates/dynamicMessage.html"),
      "utf8"
    );

   

    // Replace placeholders
    html = html
      .replace("{{message}}", message)

    // Admin email

    // Send email
    await sendEmail(to,subject, html);

    res.json({ success: true, message: "Email sent successfully" });
  } catch (err) {
    console.error("Email sending error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});


/* ----------------------- GET ALL ORDERS (pagination + cache) ----------------------- */
router.get("/", async (req, res) => {
  const clientCode = req.clientCode;

  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 20;
  let skip = (page - 1) * limit;

  // Cache hit
  if (
    orderCache[clientCode] &&
    Date.now() - orderCache[clientCode].timestamp < CACHE_TTL
  ) {
    console.log("⚡ ORDER CACHE HIT:", clientCode);

    const paged = orderCache[clientCode].allOrders.slice(skip, skip + limit);

    return res.json({
      data: paged,
      total: orderCache[clientCode].allOrders.length,
      page,
      limit
    });
  }

  console.log("⏳ ORDER CACHE MISS → Querying DB");

  const allOrders = await req.ordersCollection.find().toArray();

  orderCache[clientCode] = {
    allOrders,
    timestamp: Date.now()
  };

  const paged = allOrders.slice(skip, skip + limit);

  res.json({
    data: paged,
    total: allOrders.length,
    page,
    limit
  });
});


router.get("/order-by-id/:id", async (req, res) => {
  const clientCode = req.clientCode;
  const id = (req.params.id);

  // Cache
  if (
    orderCache[clientCode] &&
    Date.now() - orderCache[clientCode].timestamp < CACHE_TTL
  ) {
    const order = orderCache[clientCode].allOrders.find(
      (o) => o.orderId === id
    );
    if (order) return res.json(order);
  }

  const order = await req.ordersCollection.findOne({ orderId: id });

  if (!order) return res.status(404).json({ error: "Order not found" });

  res.json(order);
});

/* ----------------------- GET ONE ORDER ----------------------- */
router.get("/order-by-customers/:id", async (req, res) => {
  const clientCode = req.clientCode;
  const id = Number(req.params.id); // Convert to NUMBER

  // Cache check
  if (
    orderCache[clientCode] &&
    Date.now() - orderCache[clientCode].timestamp < CACHE_TTL
  ) {
    const order = orderCache[clientCode].allOrders.find(
      (o) => o.customerId === id
    );

    if (order) return res.json(order);
  }

  // DB fetch for ALL orders of that customer
  const orders = await req.ordersCollection
    .find({ customerId: id })
    .toArray();

  if (!orders || orders.length === 0) {
    return res.status(404).json({ error: "Orders not found for this customerId" });
  }

  res.json(orders);
});



/* ----------------------- ADD ORDER ----------------------- */
/* ----------------------- ADD ORDER (with auto orderId) ----------------------- */
router.post("/", async (req, res) => {
  try {
    // Generate order ID
    const orderId = await generateOrderId(req.ordersCollection);
        const clientCode = req.params.clientCode;

  const tenants = readTenants();
  const tenant = tenants[clientCode];
  const adminEmail = tenant ? tenant.email : "";

    const order = {
      orderId,    // 🔥 Auto generated
      invoice: req.body.invoice || "",
      customerId: req.body.customerId || "",
      customer: req.body.customer,
      mobile: req.body.mobile,
      amount: req.body.amount,
      discount: req.body.discount,
      savings: req.body.savings || 0,
      date: req.body.date,
      amountPaid: req.body.amountPaid,
      paymentMode: req.body.paymentMode,
      orderBy: req.body.orderBy,
      deliveryAddress: req.body.deliveryAddress,
      products: req.body.products || [],
      status: "pending",          // default
      createdAt: new Date(),      // auto timestamp
      updatedAt: new Date()
    };

     try{  // Read HTML template
    let html = fs.readFileSync(
      path.join(__dirname, "templates/orderEmail.html"),
      "utf8"
    );

    // Convert items to HTML rows
    const rows = req.body.products
      .map(
        (i) => `
        <tr>
          <td>${i.name}</td>
          <td>${i.qty}</td>
          <td>₹${i.price}</td>
        </tr>
      `
      )
      .join("");

    // Replace placeholders
    html = html
      .replace("{{orderId}}", orderId)
      .replace("{{customerName}}",  req.body.customer)
      .replace("{{customerPhone}}",  req.body.mobile)
      .replace("{{customerAddress}}",  req.body.deliveryAddress)
      .replace("{{orderItems}}", rows)
      .replace("{{total}}", req.body.amount);

        const adminEmaill = "nexusbills.official@gmail.com";

    // Send email
    await sendEmail(adminEmaill, `🛒 New Order #${orderId}`, html);

  } catch (err) {
    console.error("Email sending error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
    const result = await req.ordersCollection.insertOne(order);

    delete orderCache[req.clientCode];

    res.status(201).json({
      message: "Order added",
      id: result.insertedId,
      orderId: orderId  // 🟢 Returning generated orderId
    });
  } catch (err) {
    console.error("Error adding order:", err);
    res.status(500).json({ error: "Failed to add order" });
  }
});
async function generateOrderId(collection) {
  const year = new Date().getFullYear();

  // Find last order of this year
  const lastOrder = await collection
    .find({ orderId: { $regex: `^ORD${year}` } })
    .sort({ _id: -1 })
    .limit(1)
    .toArray();

  let lastNumber = 0;

  if (lastOrder.length > 0) {
    lastNumber = parseInt(lastOrder[0].orderId.substring(7)); 
    // ORD202501 → substring(7) = 01
  }

  const newNumber = lastNumber + 1;
  const padded = String(newNumber).padStart(2, "0"); // 01, 02, 03

  return `ORD${year}${padded}`;
}

router.put("/status-update/:id", async (req, res) => {
  try {
    const update = req.body.status
   

    const result = await req.ordersCollection.updateOne(
      { orderId: req.params.id },
      { $set:{status:update}  }
    );

    delete orderCache[req.clientCode]; // invalidate cache

    if (result.matchedCount === 0)
      return res.status(404).json({ error: "Order not found" });

    res.json({ message: "Order updated" });
  } catch (err) {
    console.error("Error updating order:", err);
    res.status(500).json({ error: "Failed to update order" });
  }
});
/* ----------------------- UPDATE ORDER ----------------------- */
router.put("/:id", async (req, res) => {
  try {
    const update = {
      ...req.body
    };

    const result = await req.ordersCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: update }
    );

    delete orderCache[req.clientCode]; // invalidate cache

    if (result.matchedCount === 0)
      return res.status(404).json({ error: "Order not found" });

    res.json({ message: "Order updated" });
  } catch (err) {
    console.error("Error updating order:", err);
    res.status(500).json({ error: "Failed to update order" });
  }
});

/* ----------------------- DELETE ORDER ----------------------- */
router.delete("/:id", async (req, res) => {
  try {
    const result = await req.ordersCollection.deleteOne({
      _id: new ObjectId(req.params.id)
    });

    delete orderCache[req.clientCode]; // invalidate cache

    if (result.deletedCount === 0)
      return res.status(404).json({ error: "Order not found" });

    res.json({ message: "Order deleted" });
  } catch (err) {
    console.error("Error deleting order:", err);
    res.status(500).json({ error: "Failed to delete order" });
  }
});


module.exports = router;
