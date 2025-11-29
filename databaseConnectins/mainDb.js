//const mongoose = require("mongoose");

const uri = "mongodb+srv://SuperMart123:Askavi123@cluster0.iqiqbhm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const mongoose = require("mongoose");

mongoose.connect(uri)
  .then(() => console.log("🌐 Main DB connected"))
  .catch(err => console.log("❌ Main DB error:", err));

module.exports = mongoose;
