const express = require("express");
const router = express.Router({ mergeParams: true });
const { ObjectId } = require("mongodb");
const getTenantDB = require("../databaseConnectins/tenantDb");

/* ---------------- CUSTOMER CACHE ---------------- */
const customerCache = {};
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

/* ----------- MIDDLEWARE: Load Customers Collection ----------- */
const loadCustomersCollection = async (req, res, next) => {
  try {
    const clientCode = req.params.clientCode;

    if (!clientCode)
      return res.status(400).json({ error: "Client code missing" });

    const tenantDB = await getTenantDB(clientCode);
    req.clientCode = clientCode;
    req.customersCollection = tenantDB.collection("customers");

    next();
  } catch (err) {
    console.error("Middleware error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

router.use(loadCustomersCollection);

/* ----------------------- GET ALL CUSTOMERS (pagination + cache) ----------------------- */
router.get("/", async (req, res) => {
  const clientCode = req.clientCode;

  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 20;
  let skip = (page - 1) * limit;



  console.log("⏳ CUSTOMER CACHE MISS");

  const allCustomers = await req.customersCollection.find({ status: "active" }).toArray();

  customerCache[clientCode] = {
    allCustomers,
    timestamp: Date.now()
  };

  const paged = allCustomers.slice(skip, skip + limit);

  res.json({
    data: paged,
    total: allCustomers.length,
    page,
    limit
  });
});

/* ----------------------- GET ONE CUSTOMER ----------------------- */
router.get("/:id", async (req, res) => {
  const clientCode = req.clientCode;
  const id = req.params.id;

  if (
    customerCache[clientCode] &&
    Date.now() - customerCache[clientCode].timestamp < CACHE_TTL
  ) {
    const customer = customerCache[clientCode].allCustomers.find(
      (c) => c._id.toString() === id
    );

    if (customer) return res.json(customer);
  }

  const customer = await req.customersCollection.findOne({
    _id: new ObjectId(id),
    status: "active"
  });

  if (!customer) return res.status(404).json({ error: "Customer not found" });

  res.json(customer);
});

/* ----------------------- ADD CUSTOMER ----------------------- */
router.post("/", async (req, res) => {
  try {
    const { name, mobile, password, address, points } = req.body;

    // STEP 1: Check if mobile exists
    const existingCustomer = await req.customersCollection.findOne({ mobile });

    if (existingCustomer) {
      return res.status(400).json({
        error: "Mobile number already exists. Please use another number."
      });
    }

    // STEP 2: Fetch latest customerId
    const lastCustomer = await req.customersCollection
      .find({})
      .sort({ customerId: -1 })
      .limit(1)
      .toArray();

    let newCustomerId = 1001; // start number
    if (lastCustomer.length > 0) {
      newCustomerId = lastCustomer[0].customerId + 1;
    }

    // STEP 3: Create customer data
    const customer = {
      customerId: newCustomerId,
      name,
      mobile,
      password,
      address: address || "",
      status: "active",
      points: points || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // STEP 4: Save to DB
    const result = await req.customersCollection.insertOne(customer);

    // STEP 5: Clear cache
    delete customerCache[req.clientCode];

    // STEP 6: Return response
    res.status(201).json({
      message: "Customer added successfully",
      id: result.insertedId,
      customerId: newCustomerId
    });

  } catch (err) {
    console.error("Error adding customer:", err);
    res.status(500).json({ error: "Failed to add customer" });
  }
});



/* ----------------------- UPDATE CUSTOMER ----------------------- */
router.put("/:id", async (req, res) => {
  try {
    const update = {
      ...req.body,
      updatedAt: new Date()
    };

    const result = await req.customersCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: update }
    );

    delete customerCache[req.clientCode];

    if (result.matchedCount === 0)
      return res.status(404).json({ error: "Customer not found" });

    res.json({ message: "Customer updated" });
  } catch (err) {
    console.error("Error updating customer:", err);
    res.status(500).json({ error: "Failed to update customer" });
  }
});

/* ----------------------- DELETE CUSTOMER ----------------------- */
router.delete("/:id", async (req, res) => {
  try {
    const result = await req.customersCollection.deleteOne({
      _id: new ObjectId(req.params.id)
    });

    delete customerCache[req.clientCode];

    if (result.deletedCount === 0)
      return res.status(404).json({ error: "Customer not found" });

    res.json({ message: "Customer deleted" });
  } catch (err) {
    console.error("Error deleting customer:", err);
    res.status(500).json({ error: "Failed to delete customer" });
  }
});

/* ----------------------- LOGIN USING MOBILE + PASSWORD ----------------------- */
router.post("/login", async (req, res) => {
  try {
    const { mobile, password } = req.body;

    const customer = await req.customersCollection.findOne({ mobile });

    if (!customer)
      return res.status(401).json({ error: "Invalid mobile or password" });

    if (password !== customer.password)
      return res.status(401).json({ error: "Invalid mobile or password" });

    res.json({
      message: "Login successful",
      customerId: customer.customerId,
      name: customer.name
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});
/* ----------------------- FORGOT PASSWORD (Plain Password Reset) ----------------------- */
router.post("/forgot-password", async (req, res) => {
  try {
    const { mobile, newPassword } = req.body;

    if (!mobile || !newPassword) {
      return res.status(400).json({ error: "Mobile and newPassword required" });
    }

    // Check if customer exists
    const customer = await req.customersCollection.findOne({ mobile });

    if (!customer) {
      return res.status(404).json({ error: "Mobile number not found" });
    }

    // Update password
    await req.customersCollection.updateOne(
      { mobile },
      { $set: { password: newPassword, updatedAt: new Date() } }
    );

    // Clear cache
    delete customerCache[req.clientCode];

    res.json({ message: "Password updated successfully" });

  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ error: "Failed to reset password" });
  }
});


module.exports = router;
