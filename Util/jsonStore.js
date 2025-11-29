const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../tenantclusters.json");

// Read JSON file
function readTenants() {
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
}

// Write JSON file
function writeTenants(jsonData) {
  fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), "utf-8");
}

module.exports = { readTenants, writeTenants };
