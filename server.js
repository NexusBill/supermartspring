// const express = require("express");
// const bodyParser = require("body-parser");
// const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");

// const uri = "mongodb+srv://SuperMart123:Askavi123@cluster0.iqiqbhm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
// const dbName = "nexus_supermart";
// const productsCollectionName = "products";
// const customersCollectionName = "customers";
// const ordersCollectionName = "orders";
// const suppliersCollection = "suppliers";
// const categoriesCollection = "categories";

// const app = express();
// app.use(bodyParser.json());

// // CORS Middleware
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept"
//   );
//   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
//   next();
// });

// // Globals for DB and collections
// let client;
// let db;
// let productsCollection;
// let customersCollection;
// let ordersCollection;
// let suppliersCollections;
// let categoriesCollectionObject;



// // Connect to DB and set up collections
// async function connectDB() {
//   if (db) return;
//   client = new MongoClient(uri, {
//     serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
//   });
//   await client.connect();
//   db = client.db(dbName);
//   //productsCollection = db.collection(productsCollectionName);
//   customersCollection = db.collection(customersCollectionName);
//   ordersCollection = db.collection(ordersCollectionName);
//   suppliersCollections = db.collection(suppliersCollection);
//   categoriesCollectionObject = db.collection(categoriesCollection);

//   // // Insert sample data if empty
//   // if ((await productsCollection.countDocuments()) === 0) {
//   //   await productsCollection.insertMany(sampleProducts);
//   // }

// const sampleCustomers = [
//   {
//     name: "Fresh Farms Ltd.",
//     phoneNumber: "9876543210",
//     address: "123 Market Street",
//     city: "Delhi",
//     pincode: "110001",
//     description: "Supplier of fresh fruits and vegetables"
//   },
//   {
//     name: "Daily Dairy Co.",
//     phoneNumber: "9123456780",
//     address: "45 Dairy Road",
//     city: "Mumbai",
//     pincode: "400001",
//     description: "Supplier of dairy products"
//   },
//   {
//     name: "Spice World",
//     phoneNumber: "9988776655",
//     address: "88 Spice Bazaar",
//     city: "Chennai",
//     pincode: "600001",
//     description: "Supplier of spices and condiments"
//   }
// ]

// const categories =[
//   { "name": "Stationary", "code": "STA001" },
//   { "name": "plastic", "code": "PLA001" },
//   { "name": "Rice", "code": "RIC001" },
//   { "name": "snacks", "code": "SNA001" },
//   { "name": "Food", "code": "FOO001" },
//   { "name": "Balm", "code": "BAL001" },
//   { "name": "Pooja Items", "code": "POO001" },
//   { "name": "Mob", "code": "MOB001" },
//   { "name": "Cleaning", "code": "CLE001" },
//   { "name": "Health item", "code": "HEA001" },
//   { "name": "Mosquito", "code": "MOS001" },
//   { "name": "oil", "code": "OIL001" },
//   { "name": "soap", "code": "SOA001" },
//   { "name": "Ice Cream", "code": "ICE001" },
//   { "name": "Naga", "code": "NAG001" },
//   { "name": "tea", "code": "TEA001" },
//   { "name": "washing", "code": "WAS001" },
//   { "name": "Face Cream", "code": "FAC001" },
//   { "name": "Battery", "code": "BAT001" },
//   { "name": "Vegtebles", "code": "VEG001" },
//   { "name": "Jawin", "code": "JAW001" },
//   { "name": "Talc Power", "code": "TAL001" },
//   { "name": "Cosmetics", "code": "COS001" },
//   { "name": "Shaving", "code": "SHA001" },
//   { "name": "Tooth paste", "code": "TOO001" },
//   { "name": "Tooth Brush", "code": "TOO002" },
//   { "name": "Milk Item", "code": "MIL001" },
//   { "name": "Hair Dye", "code": "HAI001" },
//   { "name": "agarbattis", "code": "AGA001" },
//   { "name": "Playing Items", "code": "PLA002" },
//   { "name": "Baby Item", "code": "BAB001" },
//   { "name": "Spray", "code": "SPR001" },
//   { "name": "Choclate", "code": "CHO001" },
//   { "name": "Own packing", "code": "OWN001" },
//   { "name": "Scissors", "code": "SCI001" },
//   { "name": "Surfe", "code": "SUR001" },
//   { "name": "Cooldrings", "code": "COO001" },
//   { "name": "Fiama", "code": "FIA001" },
//   { "name": "Annai brand", "code": "ANN001" },
//   { "name": "Fire Sick", "code": "FIR001" },
//   { "name": "Vicks", "code": "VIC001" },
//   { "name": "Udhayam", "code": "UDH001" },
//   { "name": "Bread", "code": "BRE001" },
//   { "name": "Sunfeast", "code": "SUN001" },
//   { "name": "Nestle", "code": "NES001" },
//   { "name": "paste", "code": "PAS001" },
//   { "name": "Birthday", "code": "BIR001" }
// ]
//   if ((await categoriesCollectionObject.countDocuments()) === 0) {
//     await categoriesCollectionObject.insertMany(categories);
//   }
//   if ((await suppliersCollections.countDocuments()) === 0) {
//     await suppliersCollections.insertMany(sampleCustomers);
//   }

//   console.log("Connected to MongoDB");
// }

// // Middleware to ensure DB is connected
// app.use(async (req, res, next) => {
//   try {
//     await connectDB();
//     next();
//   } catch (err) {
//     res.status(500).json({ error: "DB connection failed", details: err.message });
//   }
// });

// /* ---------------- PRODUCT ROUTES ---------------- */
// // app.get("/products", async (req, res) => {
// //   const products = await productsCollection.find().toArray();
// //   res.json(products);
// // });

// // app.post("/products", async (req, res) => {
// //   const result = await productsCollection.insertOne(req.body);
// //   res.status(201).json({ message: "Product added", id: result.insertedId });
// // });

// // app.get("/products/:id", async (req, res) => {
// //   const product = await productsCollection.findOne({ _id: new ObjectId(req.params.id) });
// //   if (!product) return res.status(404).json({ error: "Not found" });
// //   res.json(product);
// // });

// // app.put("/products/:id", async (req, res) => {
// //   const result = await productsCollection.updateOne(
// //     { id: new ObjectId(req.params.id) },
// //     { $set: req.body }
// //   );
// //   if (result.matchedCount === 0) return res.status(404).json({ error: "Not found" });
// //   res.json({ message: "Updated" });
// // });

// // app.delete("/products/:id", async (req, res) => {
// //   const result = await productsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
// //   if (result.deletedCount === 0) return res.status(404).json({ error: "Not found" });
// //   res.json({ message: "Deleted" });
// // });

// /* ---------------- CUSTOMER ROUTES ---------------- */
// app.get("/customers", async (req, res) => {
//   const customers = await customersCollection.find().toArray();
//   res.json(customers);
// });

// app.post("/customers", async (req, res) => {
//   const result = await customersCollection.insertOne(req.body);
//   res.status(201).json({ message: "Customer added", id: result.insertedId });
// });

// app.get("/customers/:id", async (req, res) => {
//   const customer = await customersCollection.findOne({ _id: new ObjectId(req.params.id) });
//   if (!customer) return res.status(404).json({ error: "Not found" });
//   res.json(customer);
// });

// app.put("/customers/:id", async (req, res) => {
//   const result = await customersCollection.updateOne(
//     { _id: new ObjectId(req.params.id) },
//     { $set: req.body }
//   );
//   if (result.matchedCount === 0) return res.status(404).json({ error: "Not found" });
//   res.json({ message: "Updated" });
// });

// app.delete("/customers/:id", async (req, res) => {
//   const result = await customersCollection.deleteOne({ _id: new ObjectId(req.params.id) });
//   if (result.deletedCount === 0) return res.status(404).json({ error: "Not found" });
//   res.json({ message: "Deleted" });
// });

// /* ---------------- ORDER ROUTES ---------------- */
// app.post("/api/orders", async (req, res) => {
//   try {
//     const order = req.body;
//     const result = await ordersCollection.insertOne(order);
//     res.status(201).json({ message: "Order created successfully", id: result.insertedId });
//   } catch (err) {
//     console.error("Error creating order:", err);
//     res.status(500).json({ error: "Failed to create order" });
//   }
// });


// app.get("/api/orders", async (req, res) => {
//   try {
//     const orders = await ordersCollection
//       .find({})
//       .sort({ _id: -1 })   // sort by newest first
//       .limit(50)           // only last 50 records
//       .toArray();

//     res.json(orders);
//   } catch (err) {
//     console.error("Error fetching orders:", err);
//     res.status(500).json({ error: "Failed to fetch orders" });
//   }
// });


// app.get("/api/last-orders", async (req, res) => {
//   try {
//     const now = new Date();

//     // First day of current month
//     const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

//     // First day of next month
//     const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

//     const orders = await ordersCollection.find({
//       Date: { $gte: startOfMonth, $lt: endOfMonth }
//     }).toArray();

//     res.json(orders);
//   } catch (err) {
//     console.error("Error fetching orders:", err);
//     res.status(500).json({ error: "Failed to fetch orders" });
//   }
// });


// // Get Orders by Date Range
// app.get("/api/orders/date-range", async (req, res) => {
//   try {
//     const { start, end } = req.query;
//     if (!start || !end) {
//       return res.status(400).json({ error: "Please provide start and end dates" });
//     }

//     const orders = await ordersCollection.find({
//       date: { $gte: start, $lte: end }
//     }).toArray();

//     res.json(orders);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Get Orders for a Specific Date
// app.get("/api/orders/by-date", async (req, res) => {
//   try {
//     const { date } = req.query;
//     if (!date) {
//       return res.status(400).json({ error: "Please provide a date" });
//     }
//     const startDate = new Date(date);
//     const endDate = new Date(date);
//     endDate.setHours(23, 59, 59, 999);

//     const orders = await ordersCollection.find({
//       date: { $gte: startDate, $lte: endDate }
//     }).toArray();

//     res.json(orders);
//   } catch (error) {
//     console.error("Error fetching orders by specific date:", error);
//     res.status(500).json({ error: error.message });
//   }
// });

// /* ---------------- SUPPLIER ROUTES ---------------- */

// app.get("/suppliers", async (req, res) => {
//   try {
//     const suppliers = await suppliersCollections.find().toArray();
//     res.json(suppliers);
//   } catch (err) {
//     console.error("Error fetching suppliers:", err);
//     res.status(500).json({ error: "Failed to fetch suppliers" });
//   }
// });

// // if ((await suppliersCollections.countDocuments()) === 0) {
// //   await suppliersCollections.insertMany();
// //   console.log("Inserted sample suppliers");
// // }




// app.post("/suppliers", async (req, res) => {
//   try {
//     const supplierData = {
//       name: req.body.name,
//       phoneNumber: req.body.phoneNumber,
//       contactPerson: req.body.contactPerson,
//       state: req.body.state,
//       address: req.body.address,
//       city: req.body.city,
//       pincode: req.body.pincode,
//       items: req.body.items,
//     };

//     const result = await suppliersCollections.insertOne(supplierData);
//     res.status(201).json({ message: "Supplier added", id: result.insertedId });
//   } catch (err) {
//     console.error("Error adding supplier:", err);
//     res.status(500).json({ error: "Failed to add supplier" });
//   }
// });

// app.get("/suppliers/:id", async (req, res) => {
//   try {
//     const supplier = await suppliersCollections.findOne({
//       _id: new ObjectId(req.params.id),
//     });

//     if (!supplier) return res.status(404).json({ error: "Supplier not found" });
//     res.json(supplier);
//   } catch (err) {
//     console.error("Error fetching supplier:", err);
//     res.status(500).json({ error: "Failed to fetch supplier" });
//   }
// });

// app.get("/api/categories", async (req, res) => {
//   try {
//     const categories = await categoriesCollectionObject.find().toArray();
//     res.json(categories);
//   } catch (err) {
//     console.error("Error fetching categories:", err);
//     res.status(500).json({ error: "Failed to fetch categories" });
//   }
// });

// app.post("/api/categories", async (req, res) => {
//   try {
//     const categoryData = {
//       name: req.body.name,
//       code: req.body.code,
//     };
//     const result = await categoriesCollectionObject.insertOne(categoryData);
//     res.status(201).json({ message: "Category added", id: result.insertedId });
//   } catch (err) { 
//     console.error("Error adding category:", err);
//     res.status(500).json({ error: "Failed to add category" });
//   }

// });

// app.put("/api/categories/:code", async (req, res) => {
//   try {
//     const updatedData = {
//       name: req.body.name,
//       code: req.body.code, // you may allow updating code too
//     };

//     const result = await categoriesCollectionObject.updateOne(
//       { code: req.params.code },   // match on code
//       { $set: updatedData }
//     );

//     if (result.matchedCount === 0)
//       return res.status(404).json({ error: "Category not found" });

//     res.json({ message: "Category updated" });
//   } catch (err) {
//     console.error("Error updating category:", err);
//     res.status(500).json({ error: "Failed to update category" });
//   }
// });


// app.delete("/api/categories/:code", async (req, res) => {
//   try {
//     const result = await categoriesCollectionObject.deleteOne({
//       code: req.params.code,   // match on code
//     });

//     if (result.deletedCount === 0)
//       return res.status(404).json({ error: "Category not found" });

//     res.json({ message: "Category deleted" });
//   } catch (err) {
//     console.error("Error deleting category:", err);
//     res.status(500).json({ error: "Failed to delete category" });
//   }
// });


// app.put("/suppliers/:id", async (req, res) => {
//   try {
//     const updatedData = {
//       name: req.body.name,
//       phoneNumber: req.body.phoneNumber,
//       address: req.body.address,
//       city: req.body.city,
//       pincode: req.body.pincode,
//       description: req.body.description,
//     };

//     const result = await suppliersCollections.updateOne(
//       { _id: new ObjectId(req.params.id) },
//       { $set: updatedData }
//     );

//     if (result.matchedCount === 0)
//       return res.status(404).json({ error: "Supplier not found" });

//     res.json({ message: "Supplier updated" });
//   } catch (err) {
//     console.error("Error updating supplier:", err);
//     res.status(500).json({ error: "Failed to update supplier" });
//   }
// });

// app.delete("/suppliers/:id", async (req, res) => {
//   try {
//     const result = await suppliersCollections.deleteOne({
//       _id: new ObjectId(req.params.id),
//     });

//     if (result.deletedCount === 0)
//       return res.status(404).json({ error: "Supplier not found" });

//     res.json({ message: "Supplier deleted" });
//   } catch (err) {
//     console.error("Error deleting supplier:", err);
//     res.status(500).json({ error: "Failed to delete supplier" });
//   }
// });








// /* ---------------- EXPORT FOR VERCEL ---------------- */
// module.exports = app;

// // If running locally
// if (require.main === module) {
//   const PORT = process.env.PORT || 3000;
//   app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// }
const express = require("express");
const app = express();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const productRoutes = require("./controller/productsRouts");
const categoryRoute = require("./controller/categoryRoute");
const tenantRoutes = require("./controller/tenantRoute");
const ordersRoutes = require("./controller/orderRoutes");
const customerRoutes = require("./controller/customerRoutes");


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
app.use(express.json());
app.use("/api", tenantRoutes);
// multitenant path route
app.use("/api/:clientCode/products", productRoutes);
app.use("/api/:clientCode/categories", categoryRoute);
app.use("/api/:clientCode/orders", ordersRoutes);
app.use("/api/:clientCode/customers", customerRoutes);
// YOUR KEYS (TEST MODE)
const razorpay = new Razorpay({
  key_id: "rzp_test_Rhe1D8p5Mgfh6G",
  key_secret: "XlyA4AZelos2A4T00U1Gd3CL"
});


app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    const order = await razorpay.orders.create({
      amount: amount, // IN PAISE
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    });

    res.send(order);

  } catch (err) {
    res.status(500).send({ error: "Order creation failed", details: err });
  }
});

app.post("/time-sheet", (req, res) => {
  // Handle time sheet creation logic here
});

app.post("/verify-payment", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSign = crypto
    .createHmac("sha256", razorpay.key_secret)
    .update(sign)
    .digest("hex");

  if (expectedSign === razorpay_signature) {
    console.log("Payment Verified:", razorpay_payment_id);

    res.json({
      success: true,
      message: "Payment verified successfully"
    });
  } else {
    res.status(400).json({
      success: false,
      message: "Payment verification failed"
    });
  }
});
app.listen(3000, () => console.log("Server running on port 3000"));
