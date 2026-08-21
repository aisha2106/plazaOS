import mongoose from 'mongoose'

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// Cached on the global object so hot-reloading / repeated route invocations
// in dev don't each open a new connection.
declare global {
  var _mongooseCache: MongooseCache | undefined
}

const cache: MongooseCache = globalThis._mongooseCache ?? { conn: null, promise: null }
globalThis._mongooseCache = cache

export async function dbConnect(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn

  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not configured')

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri)
  }
  cache.conn = await cache.promise
  return cache.conn
}
