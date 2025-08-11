const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");

const uri = "mongodb+srv://SuperMart123:Askavi123@cluster0.iqiqbhm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbName = "nexus_supermart";
const productsCollectionName = "products";
const customersCollectionName = "customers";

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

let db, productsCollection, customersCollection;

// Sample Products Data
const sampleProducts = [
  {
    id: "P001",
    name: "Milk 1L",
    Category: "Dairy",
    QuantityOnHand: 120,
    UnitDesc: "1 Litre Pack",
    RetailPrice: 55,
    SalePrice: 52,
    MRP: 55,
    UnitPrice: 52,
    EANCode: "8901234567890",
  },
  {
    id: "P002",
    name: "Rice 5kg",
    Category: "Grocery",
    QuantityOnHand: 50,
    UnitDesc: "5 Kilogram Bag",
    RetailPrice: 450,
    SalePrice: 420,
    MRP: 450,
    UnitPrice: 420,
    EANCode: "8901234567891",
  },
  {
    id: "P003",
    name: "Sugar 1kg",
    Category: "Grocery",
    QuantityOnHand: 200,
    UnitDesc: "1 Kilogram Pack",
    RetailPrice: 45,
    SalePrice: 42,
    MRP: 45,
    UnitPrice: 42,
    EANCode: "8901234567892",
  },
  {
    id: "P004",
    name: "Toothpaste 200g",
    Category: "Personal Care",
    QuantityOnHand: 75,
    UnitDesc: "200 Gram Tube",
    RetailPrice: 100,
    SalePrice: 95,
    MRP: 100,
    UnitPrice: 95,
    EANCode: "8901234567893",
  },
];

// Sample Customers Data
const sampleCustomers = [
  { name: "John Doe", email: "kvjdhfjkshf", phone: "123-456-7890" },
  { name: "Jane Smith", email: "fhgfgh", phone: "987-654-3210" },
  { name: "Alice Johnson", email: "ghfghfgh", phone: "555-555-5555" },
  { name: "Bob Brown", email: "ghfghfgh", phone: "444-444-4444" },
  { name: "Charlie White", email: "ghfghfgh", phone: "333-333-3333" },
];

// Ensure DB connection before handling request
async function connectDB() {
  if (db) return;
  client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  });
  await client.connect();
  db = client.db(dbName);
  productsCollection = db.collection("products");
  customersCollection = db.collection("customers");

  // Insert sample data if empty
  if ((await productsCollection.countDocuments()) === 0) {
    await productsCollection.insertMany(sampleProducts);
  }
  if ((await customersCollection.countDocuments()) === 0) {
    await customersCollection.insertMany(sampleCustomers);
  }

  console.log("Connected to MongoDB");
}

// Middleware to ensure DB is ready
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
    { _id: new ObjectId(req.params.id) },
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

/* ---------------- EXPORT FOR VERCEL ---------------- */
module.exports = app;

// If running locally, start server
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
