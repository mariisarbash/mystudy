const mongoose = require('mongoose');
require('dotenv').config();

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/mystudy';

/**
 * Resolved at call time, not at import time.
 *
 * Reading process.env when the module is first required freezes the value, so
 * whatever dotenv happened to load wins for the life of the process — which
 * makes the target impossible to change afterwards and is easy to get wrong in
 * tests. Serverless platforms inject environment variables before invocation,
 * so reading them lazily is also the safer order there.
 */
const resolveUri = () => process.env.MONGODB_URI || DEFAULT_URI;

/**
 * Connects to MongoDB, reusing the connection across calls.
 *
 * The cache matters in a serverless environment: each warm invocation re-runs
 * module code, and opening a new connection every time exhausts the database's
 * connection limit. Caching on globalThis survives between invocations in the
 * same container.
 */
let cached = globalThis.__mystudyMongoose;
if (!cached) {
  cached = globalThis.__mystudyMongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(resolveUri(), {
        // Fail fast instead of hanging a request for 30s when the database
        // is unreachable.
        serverSelectionTimeoutMS: 10000,
      })
      .then((m) => {
        // Log the database name only — never the URI, which may carry credentials.
        console.log(`MongoDB connected (db: ${m.connection.name})`);
        return m;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
};

module.exports = connectDB;
