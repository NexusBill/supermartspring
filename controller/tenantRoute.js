const express = require("express");
const { readTenants, writeTenants } = require("../Util/jsonStore");
const router = express.Router();

/* ---------------- TENANTS  ---------------- */

// Create / Update Tenant
router.post("/tenant", (req, res) => {
  const { tenantName, cluster } = req.body;

  if (!tenantName || !cluster)
    return res.status(400).json({ error: "tenantName & cluster required" });

  const tenants = readTenants();

  tenants[tenantName] = tenants[tenantName] || { users: [] };
  tenants[tenantName].cluster = cluster;

  writeTenants(tenants);
  res.json({ message: "Tenant created / updated", tenant: tenants[tenantName] });
});

// Get all tenants
router.get("/tenants", (req, res) => {
  res.json(readTenants());
});

// Get specific tenant
router.get("/tenant/:tenant", (req, res) => {
  const tenants = readTenants();
  const tenant = tenants[req.params.tenant];

  if (!tenant)
    return res.status(404).json({ error: "Tenant not found" });

  res.json(tenant);
});

// Delete tenant
router.delete("/tenant/:tenant", (req, res) => {
  const tenants = readTenants();
  const name = req.params.tenant;

  if (!tenants[name])
    return res.status(404).json({ error: "Tenant does not exist" });

  delete tenants[name];
  writeTenants(tenants);

  res.json({ message: "Tenant deleted successfully" });
});


/* ---------------- USERS  ---------------- */

// Add user to tenant
router.post("/tenant/:tenant/users", (req, res) => {
  const { id, pass, role } = req.body;

  const tenants = readTenants();
  const tenant = tenants[req.params.tenant];

  if (!tenant)
    return res.status(404).json({ error: "Tenant not found" });

  tenant.users.push({ id, pass, role });
  writeTenants(tenants);

  res.json({ message: "User added", users: tenant.users });
});

// Get all users of specific tenant
router.get("/tenant/:tenant/users", (req, res) => {
  const tenants = readTenants();
  const tenant = tenants[req.params.tenant];

  if (!tenant)
    return res.status(404).json({ error: "Tenant not found" });

  res.json(tenant.users);
});

// Update user
router.put("/tenant/:tenant/users/:id", (req, res) => {
  const { pass, role } = req.body;

  const tenants = readTenants();
  const tenant = tenants[req.params.tenant];

  if (!tenant)
    return res.status(404).json({ error: "Tenant not found" });

  const user = tenant.users.find(u => u.id === req.params.id);

  if (!user)
    return res.status(404).json({ error: "User not found" });

  if (pass) user.pass = pass;
  if (role) user.role = role;

  writeTenants(tenants);
  res.json({ message: "User updated", user });
});

// Delete user
router.delete("/tenant/:tenant/users/:id", (req, res) => {
  const tenants = readTenants();
  const tenant = tenants[req.params.tenant];

  if (!tenant)
    return res.status(404).json({ error: "Tenant not found" });

  tenant.users = tenant.users.filter(u => u.id !== req.params.id);

  writeTenants(tenants);
  res.json({ message: "User deleted", users: tenant.users });
});


/* ---------------- LOGIN  ---------------- */

// Login API
router.post("/tenant/login", (req, res) => {
  const { id, pass } = req.body;

  const tenants = readTenants();
  const tenant = tenants[id];

  if (!tenant)
    return res.status(404).json({ error: "Tenant not found" });


  if (tenant.password !== pass)
    return res.status(401).json({ error: "Invalid credentials" });

  res.json({
    message: "Login successful",
    tenant: id,
    name: tenant.name
  });
});

module.exports = router;
