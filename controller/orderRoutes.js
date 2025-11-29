const express = require("express");
const router = express.Router({ mergeParams: true });
const { ObjectId } = require("mongodb");
const getTenantDB = require("../databaseConnectins/tenantDb");

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

/* ----------------------- GET ONE ORDER ----------------------- */
router.get("/:id", async (req, res) => {
  const clientCode = req.clientCode;
  const id = req.params.id;

  // Check cache first
  if (
    orderCache[clientCode] &&
    Date.now() - orderCache[clientCode].timestamp < CACHE_TTL
  ) {
    const order = orderCache[clientCode].allOrders.find(
      (o) => o._id.toString() === id
    );

    if (order) return res.json(order);
  }

  const order = await req.ordersCollection.findOne({
    _id: new ObjectId(id)
  });

  if (!order) return res.status(404).json({ error: "Order not found" });

  res.json(order);
});

/* ----------------------- ADD ORDER ----------------------- */
router.post("/", async (req, res) => {
  try {
    const order = {
      invoice: req.body.invoice,
      customerId: req.body.customerId,
      customer: req.body.customer,
      mobile: req.body.mobile,
      amount: req.body.amount,
      discount: req.body.discount,
      savings: req.body.savings,
      date: req.body.date,
      amountPaid: req.body.amountPaid,
      paymentMode: req.body.paymentMode,
      orderBy: req.body.orderBy,
      deliveryAddress: req.body.deliveryAddress,
      products: req.body.products || []
    };

    const result = await req.ordersCollection.insertOne(order);

    delete orderCache[req.clientCode]; // invalidate cache

    res.status(201).json({ message: "Order added", id: result.insertedId });
  } catch (err) {
    console.error("Error adding order:", err);
    res.status(500).json({ error: "Failed to add order" });
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
