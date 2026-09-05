const mongoose = require("mongoose");
const { readTenants } = require("../Util/jsonStore");

const connections = {};

async function getTenantDB(clientCode) {
  if (!clientCode) throw new Error("Missing clientCode!");

  const tenants = readTenants();
  const tenant = tenants[clientCode];
  const uri = tenant ? tenant.cluster : null;

  if (!uri) throw new Error(`No cluster info found for tenant: ${clientCode}`);

  // If already connected → reuse instantly
  if (connections[clientCode] && connections[clientCode].readyState === 1) {
    return connections[clientCode];
  }

  console.log(`🔌 Connecting to DB for client: ${clientCode}`);

  // 1) Create + store in cache immediately
  if (!connections[clientCode]) {
    connections[clientCode] = mongoose.createConnection(uri, {
      maxPoolSize: 10,
    });

    // 2) Then wait for connection
    await new Promise((resolve, reject) => {
      connections[clientCode].once("connected", () => {
        console.log("✅ Tenant DB connected:", clientCode);
        resolve();
      });

      connections[clientCode].once("error", (err) => {
        console.log("❌ Tenant DB error:", err);
        reject(err);
      });
    });
  }

  // Return both the connection and a method to get native collection
  const connection = connections[clientCode];
  connection.getCollection = function(name) {
    return this.collection(name);
  };
  
  return connection;
}

module.exports = getTenantDB;
