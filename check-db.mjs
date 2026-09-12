// Temporary diagnostic script: lists databases + collections and sample docs
import mongoose from "mongoose";
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf8");
const uri = env.match(/MONGODB_URI=(.+)/)?.[1]?.trim();
if (!uri) { console.error("No MONGODB_URI found in .env.local"); process.exit(1); }
console.log("Using URI host:", uri.replace(/\/\/[^@]*@/, "//<credentials>@").split("/")[2]);

await mongoose.connect(uri);
console.log("✅ Connected to cluster");

const admin = mongoose.connection.db.admin();
const { databases } = await admin.listDatabases();
console.log("\n📁 Databases on this cluster:");
for (const d of databases) console.log("  -", d.name);

for (const d of databases) {
  if (["admin", "local", "config"].includes(d.name)) continue;
  const conn = mongoose.connection.useDb(d.name);
  const cols = await conn.db.listCollections().toArray();
  console.log(`\n🗂  Database "${d.name}" collections:`);
  if (!cols.length) console.log("   (empty)");
  for (const c of cols) {
    const count = await conn.db.collection(c.name).countDocuments();
    console.log(`   - ${c.name} (${count} docs)`);
    const sample = await conn.db.collection(c.name).findOne();
    if (sample) console.log("     sample:", JSON.stringify(sample).slice(0, 200));
  }
}

await mongoose.disconnect();
