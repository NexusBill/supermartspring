const express = require("express");
const router = express.Router({ mergeParams: true });
const getTenantDB = require("../databaseConnectins/tenantDb");

/* ---------------- GLOBAL CACHE ---------------- */
const categoryCache = {}; // { clientCode: { allCategories: [...], timestamp: 123 } }
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

/* ----------- MIDDLEWARE TO LOAD CATEGORIES COLLECTION ----------- */
const loadCategoryCollection = async (req, res, next) => {
    try {
        const clientCode = req.params.clientCode;

        if (!clientCode) {
            return res.status(400).json({ error: "Client code missing" });
        }

        const tenantDB = await getTenantDB(clientCode);
        req.clientCode = clientCode;
        req.categoriesCollection = tenantDB.collection("categories");

        next();
    } catch (err) {
        console.error("Middleware error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

router.use(loadCategoryCollection);

/* ----------------------- GET CATEGORIES (Pagination + Cache) ----------------------- */
router.get("/", async (req, res) => {
    const clientCode = req.clientCode;

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 20;
    let skip = (page - 1) * limit;

    // If cache exists and valid → return cached data
    if (
        categoryCache[clientCode] &&
        Date.now() - categoryCache[clientCode].timestamp < CACHE_TTL
    ) {
        console.log("⚡ CATEGORY CACHE HIT:", clientCode);

        const pagedData = categoryCache[clientCode].allCategories.slice(
            skip,
            skip + limit
        );

        return res.json({
            data: pagedData,
            total: categoryCache[clientCode].allCategories.length,
            page,
            limit
        });
    }

    console.log("⏳ CATEGORY CACHE MISS → Querying MongoDB:", clientCode);

    // Fetch once from DB
    const allCategories = await req.categoriesCollection.find().toArray();

    // Save in cache
    categoryCache[clientCode] = {
        allCategories,
        timestamp: Date.now(),
    };

    const pagedData = allCategories.slice(skip, skip + limit);

    res.json({
        data: pagedData,
        total: allCategories.length,
        page,
        limit
    });
});

/* ----------------------- ADD CATEGORY ----------------------- */
router.post("/", async (req, res) => {
    try {
        const categoryData = {
            name: req.body.name,
          
        };

        const result = await req.categoriesCollection.insertOne(categoryData);

        delete categoryCache[req.clientCode]; // CLEAR CACHE

        res.status(201).json({ message: "Category added", id: result.insertedId });
    } catch (err) {
        console.error("Error adding category:", err);
        res.status(500).json({ error: "Failed to add category" });
    }
});

/* ----------------------- UPDATE CATEGORY ----------------------- */
router.put("/:code", async (req, res) => {
    try {
        const updatedData = {
            name: req.body.name,
        };

        const result = await req.categoriesCollection.updateOne(
            { code: req.params.code },
            { $set: updatedData }
        );

        delete categoryCache[req.clientCode]; // CLEAR CACHE

        if (result.matchedCount === 0)
            return res.status(404).json({ error: "Category not found" });

        res.json({ message: "Category updated" });
    } catch (err) {
        console.error("Error updating category:", err);
        res.status(500).json({ error: "Failed to update category" });
    }
});

/* ----------------------- DELETE CATEGORY ----------------------- */
router.delete("/:code", async (req, res) => {
    try {
        const result = await req.categoriesCollection.deleteOne({
            code: req.params.code,
        });

        delete categoryCache[req.clientCode]; // CLEAR CACHE

        if (result.deletedCount === 0)
            return res.status(404).json({ error: "Category not found" });

        res.json({ message: "Category deleted" });
    } catch (err) {
        console.error("Error deleting category:", err);
        res.status(500).json({ error: "Failed to delete category" });
    }
});

module.exports = router;
