const express = require("express");
const router = express.Router({ mergeParams: true });
const { ObjectId } = require("mongodb");
const getTenantDB = require("../databaseConnectins/tenantDb");

/* ---------------- GLOBAL CACHE ---------------- */
const productCache = {}; // { clientCode: { allProducts: [...], timestamp: 123 } }
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes cache lifetime

/* ----------- MIDDLEWARE: SET THE RIGHT DB ----------- */
const loadProductsCollection = async (req, res, next) => {
    try {
        const clientCode = req.params.clientCode;
        if (!clientCode) {
            return res.status(400).json({ error: "Client code missing" });
        }

        const tenantDB = await getTenantDB(clientCode);
        req.clientCode = clientCode;
        req.productsCollection = tenantDB.collection("products");

        next();
    } catch (err) {
        console.error("Middleware error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

router.use(loadProductsCollection);

/* ----------------------- GET PRODUCTS (with pagination + cache) ----------------------- */
router.get("/", async (req, res) => {
    const clientCode = req.clientCode;

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 50;
    let skip = (page - 1) * limit;

    // If cache exists and still valid → return cached paginated data
    if (
        productCache[clientCode] &&
        Date.now() - productCache[clientCode].timestamp < CACHE_TTL
    ) {
        console.log("⚡ CACHE HIT:", clientCode);

        const pagedData = productCache[clientCode].allProducts.slice(
            skip,
            skip + limit
        );
        return res.json({data:pagedData,  total: productCache[clientCode].allProducts.length, page, limit});
    }

    console.log("⏳ CACHE MISS → Querying MongoDB:", clientCode);

    // Fetch once from DB
    const allProducts = await req.productsCollection.find().toArray();

    // Store in cache
    productCache[clientCode] = {
        allProducts,
        timestamp: Date.now(),
    };

    const pagedData = allProducts.slice(skip, skip + limit);
    res.json({data:pagedData,  total: allProducts.length, page, limit});
});

/* ----------------------- GET SINGLE PRODUCT (FAST + CACHE) ----------------------- */
router.get("/:id", async (req, res) => {
    const clientCode = req.clientCode;
    const productId = req.params.id;

    // If cached → pull item from cache (super fast)
    if (
        productCache[clientCode] &&
        Date.now() - productCache[clientCode].timestamp < CACHE_TTL
    ) {
        console.log("⚡ CACHE HIT (single product)");

        const cachedProduct = productCache[clientCode].allProducts.find(
            (p) => p._id.toString() === productId
        );

        if (cachedProduct) return res.json(cachedProduct);
    }

    // If not in cache → fetch from DB
    const product = await req.productsCollection.findOne({
        _id: new ObjectId(productId),
    });

    if (!product) return res.status(404).json({ error: "Not found" });

    res.json(product);
});
/* ----------------------- SEARCH PRODUCTS ----------------------- */
router.get("/search", async (req, res) => {
  try {
    const clientCode = req.clientCode;
    const { q } = req.query; // search term

    if (!q) {
      return res.status(400).json({ error: "Search query missing" });
    }

    // Clean search string
    const searchText = q.trim();

    // Build search query
    const searchQuery = {
      $or: [
        { _id: ObjectId.isValid(searchText) ? new ObjectId(searchText) : null },
        { qrcode: searchText },
        { name: { $regex: searchText, $options: "i" } },
        { category: { $regex: searchText, $options: "i" } }
      ]
    };

    // Remove null _id match if searchText isn't ObjectId
    if (!ObjectId.isValid(searchText)) {
      delete searchQuery.$or[0]; // remove _id condition
    }

    // Remove empty conditions
    searchQuery.$or = searchQuery.$or.filter(Boolean);

    // Perform DB search
    const results = await req.productsCollection.find(searchQuery).toArray();

    res.json(results);

  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Failed to search products" });
  }
});

/* ----------------------- ADD PRODUCT ----------------------- */
router.post("/", async (req, res) => {
  try {
    const { qrcode } = req.body.qrcode;

    // 🔍 STEP 1: If qrcode present → validate uniqueness
    if (qrcode) {
      const existing = await req.productsCollection.findOne({ qrcode });

      if (existing) {
        return res.status(400).json({
          error: "QR Code already exists. Choose another."
        });
      }
    }

    // 🔍 STEP 2: Insert product
    const result = await req.productsCollection.insertOne(req.body);

    // Clear cache
    delete productCache[req.clientCode];

    res.status(201).json({
      message: "Product added",
      id: result.insertedId
    });

  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).json({ error: "Failed to add product" });
  }
});


/* ----------------------- UPDATE PRODUCT ----------------------- */
router.put("/:id", async (req, res) => {
    const result = await req.productsCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: req.body }
    );

    delete productCache[req.clientCode]; // invalidate cache

    if (result.matchedCount === 0)
        return res.status(404).json({ error: "Not found" });

    res.json({ message: "Updated" });
});

router.put("/products/images/bulk", async (req, res) => {
  try {
    const products  = req.body.products; // Expecting { products: [ {_id, imageName}, ... ] }
    const name = req.body.name;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Products list required" });
    }

    const bulkOps = products.map(p => ({
      updateOne: {
        filter: { _id: new ObjectId(p._id) },
        update: {
          $set: {
            isImageUploaded: true,
            imageName: name || p.imageName
          }
        }
      }
    }));

    const result = await req.productsCollection.bulkWrite(bulkOps);

    res.json({
      message: "Bulk image update successful",
      matched: result.matchedCount,
      modified: result.modifiedCount
    });

  } catch (err) {
    console.error("Bulk update error:", err);
    res.status(500).json({ error: "Bulk update failed" });
  }
});

/* ----------------------- DELETE PRODUCT ----------------------- */
router.delete("/:id", async (req, res) => {
    const result = await req.productsCollection.deleteOne({
        _id: new ObjectId(req.params.id),
    });

    delete productCache[req.clientCode]; // clear cache

    if (result.deletedCount === 0)
        return res.status(404).json({ error: "Not found" });

    res.json({ message: "Deleted" });
});

module.exports = router;
