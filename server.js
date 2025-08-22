const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");

const uri = "mongodb+srv://SuperMart123:Askavi123@cluster0.iqiqbhm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbName = "nexus_supermart";
const productsCollectionName = "products";
const customersCollectionName = "customers";
const ordersCollectionName = "orders";
const suppliersCollection = "suppliers";

const app = express();
app.use(bodyParser.json());

// CORS Middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

// Globals for DB and collections
let client;
let db;
let productsCollection;
let customersCollection;
let ordersCollection;
let suppliersCollections;



// Connect to DB and set up collections
async function connectDB() {
  if (db) return;
  client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  });
  await client.connect();
  db = client.db(dbName);
  productsCollection = db.collection(productsCollectionName);
  customersCollection = db.collection(customersCollectionName);
  ordersCollection = db.collection(ordersCollectionName);
  suppliersCollections = db.collection(suppliersCollection);

  // Insert sample data if empty
  if ((await productsCollection.countDocuments()) === 0) {
    await productsCollection.insertMany(sampleProducts);
  }
  if ((await customersCollection.countDocuments()) === 0) {
    await customersCollection.insertMany(sampleCustomers);
  }

  console.log("Connected to MongoDB");
}

// Middleware to ensure DB is connected
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: "DB connection failed", details: err.message });
  }
});

/* ---------------- PRODUCT ROUTES ---------------- */
app.get("/products", async (req, res) => {
  const products = await productsCollection.find().toArray();
  res.json(products);
});

app.post("/products", async (req, res) => {
  const result = await productsCollection.insertOne(req.body);
  res.status(201).json({ message: "Product added", id: result.insertedId });
});

app.get("/products/:id", async (req, res) => {
  const product = await productsCollection.findOne({ _id: new ObjectId(req.params.id) });
  if (!product) return res.status(404).json({ error: "Not found" });
  res.json(product);
});

app.put("/products/:id", async (req, res) => {
  const result = await productsCollection.updateOne(
    { id: new ObjectId(req.params.id) },
    { $set: req.body }
  );
  if (result.matchedCount === 0) return res.status(404).json({ error: "Not found" });
  res.json({ message: "Updated" });
});

app.delete("/products/:id", async (req, res) => {
  const result = await productsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
  if (result.deletedCount === 0) return res.status(404).json({ error: "Not found" });
  res.json({ message: "Deleted" });
});

/* ---------------- CUSTOMER ROUTES ---------------- */
app.get("/customers", async (req, res) => {
  const customers = await customersCollection.find().toArray();
  res.json(customers);
});

app.post("/customers", async (req, res) => {
  const result = await customersCollection.insertOne(req.body);
  res.status(201).json({ message: "Customer added", id: result.insertedId });
});

app.get("/customers/:id", async (req, res) => {
  const customer = await customersCollection.findOne({ _id: new ObjectId(req.params.id) });
  if (!customer) return res.status(404).json({ error: "Not found" });
  res.json(customer);
});

app.put("/customers/:id", async (req, res) => {
  const result = await customersCollection.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: req.body }
  );
  if (result.matchedCount === 0) return res.status(404).json({ error: "Not found" });
  res.json({ message: "Updated" });
});

app.delete("/customers/:id", async (req, res) => {
  const result = await customersCollection.deleteOne({ _id: new ObjectId(req.params.id) });
  if (result.deletedCount === 0) return res.status(404).json({ error: "Not found" });
  res.json({ message: "Deleted" });
});

/* ---------------- ORDER ROUTES ---------------- */
app.post("/api/orders", async (req, res) => {
  try {
    const order = req.body;
    const result = await ordersCollection.insertOne(order);
    res.status(201).json({ message: "Order created successfully", id: result.insertedId });
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

app.get("/api/orders", async (req, res) => {
  try {
    const orders = await ordersCollection
      .find({})
      .sort({ _id: -1 })   // sort by newest first
      .limit(50)           // only last 50 records
      .toArray();

    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});


app.get("/api/last-orders", async (req, res) => {
  try {
    const now = new Date();

    // First day of current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // First day of next month
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const orders = await ordersCollection.find({
      Date: { $gte: startOfMonth, $lt: endOfMonth }
    }).toArray();

    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});


// Get Orders by Date Range
app.get("/api/orders/date-range", async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: "Please provide start and end dates" });
    }

    const orders = await ordersCollection.find({
      date: { $gte: start, $lte: end }
    }).toArray();

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Orders for a Specific Date
app.get("/api/orders/by-date", async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: "Please provide a date" });
    }
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const orders = await ordersCollection.find({
      date: { $gte: startDate, $lte: endDate }
    }).toArray();

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders by specific date:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ---------------- SUPPLIER ROUTES ---------------- */

app.get("/suppliers", async (req, res) => {
  try {
    const suppliers = await suppliersCollections.find().toArray();
    res.json(suppliers);
  } catch (err) {
    console.error("Error fetching suppliers:", err);
    res.status(500).json({ error: "Failed to fetch suppliers" });
  }
});

app.post("/suppliers", async (req, res) => {
  try {
    const supplierData = {
      name: req.body.name,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
      city: req.body.city,
      pincode: req.body.pincode,
      description: req.body.description,
    };

    const result = await suppliersCollections.insertOne(supplierData);
    res.status(201).json({ message: "Supplier added", id: result.insertedId });
  } catch (err) {
    console.error("Error adding supplier:", err);
    res.status(500).json({ error: "Failed to add supplier" });
  }
});

app.get("/suppliers/:id", async (req, res) => {
  try {
    const supplier = await suppliersCollections.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!supplier) return res.status(404).json({ error: "Supplier not found" });
    res.json(supplier);
  } catch (err) {
    console.error("Error fetching supplier:", err);
    res.status(500).json({ error: "Failed to fetch supplier" });
  }
});

app.put("/suppliers/:id", async (req, res) => {
  try {
    const updatedData = {
      name: req.body.name,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
      city: req.body.city,
      pincode: req.body.pincode,
      description: req.body.description,
    };

    const result = await suppliersCollections.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedData }
    );

    if (result.matchedCount === 0)
      return res.status(404).json({ error: "Supplier not found" });

    res.json({ message: "Supplier updated" });
  } catch (err) {
    console.error("Error updating supplier:", err);
    res.status(500).json({ error: "Failed to update supplier" });
  }
});

app.delete("/suppliers/:id", async (req, res) => {
  try {
    const result = await suppliersCollections.deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0)
      return res.status(404).json({ error: "Supplier not found" });

    res.json({ message: "Supplier deleted" });
  } catch (err) {
    console.error("Error deleting supplier:", err);
    res.status(500).json({ error: "Failed to delete supplier" });
  }
});


/* ---------------- EXPORT FOR VERCEL ---------------- */
module.exports = app;

// If running locally
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
