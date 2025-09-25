import mongoose from "mongoose";

mongoose.set("strictQuery", false);

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable...");
}

const uri = MONGODB_URI as string;

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // Avoid TS errors when using `global` in development
  var mongoose: MongooseCache | undefined;
}

const globalWithMongoose = global as typeof globalThis & {
  mongoose?: MongooseCache;
};

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = { conn: null, promise: null };
}

const cached = globalWithMongoose.mongoose;

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    console.log("Using existing MongoDB connection from cache.");
    return cached.conn;
  }

  // useUnifiedTopology and useNewUrlParser are true by default in Mongoose v6+
  if (!cached.promise) {
    console.log("No cached connection found. Connecting to MongoDB...");
    const opts = { bufferCommands: false };
    cached.promise = mongoose.connect(uri, opts);
  }

  try {
    cached.conn = await cached.promise;
    console.log("MongoDB connection established successfully.");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default dbConnect;
