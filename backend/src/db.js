// db.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

let dbInstance = null;

async function connect() {
  if (dbInstance) return dbInstance; // trả về instance đã kết nối
  await client.connect();
  dbInstance = client.db(process.env.MONGO_DB || 'iotdb');
  console.log('MongoDB connected to', dbInstance.databaseName);
  return dbInstance;
}

module.exports = { connect, client };
