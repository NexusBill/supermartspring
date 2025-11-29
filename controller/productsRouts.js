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
        return res.json(pagedData);
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
    res.json(pagedData);
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

/* ----------------------- ADD PRODUCT ----------------------- */
router.post("/", async (req, res) => {
    const result = await req.productsCollection.insertOne(req.body);

    delete productCache[req.clientCode]; // invalidate cache

    res.status(201).json({ message: "Product added", id: result.insertedId });
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
