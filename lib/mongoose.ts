import mongoose, { Mongoose, ConnectOptions } from "mongoose";

// Extend NodeJS global to cache the mongoose connection
declare global {
    // eslint-disable-next-line no-var
    var mongooseCache: {
        conn: Mongoose | null;
        promise: Promise<Mongoose> | null;
    };
}

// Initialize cache on the global object to survive hot reloads in development
const cached = global.mongooseCache ?? (global.mongooseCache = { conn: null, promise: null });

// Default connection options with sensible production defaults
const MONGOOSE_OPTIONS: ConnectOptions = {
    bufferCommands: false, // Fail immediately if connection is not ready
};

/**
 * Connects to MongoDB using the MONGODB_URI environment variable.
 * Returns a cached connection in development to avoid exhausting
 * database connections during hot module replacement.
 */
export async function connectToDatabase(uri?: string): Promise<Mongoose> {
    // Return existing connection if already established
    if (cached.conn) {
        return cached.conn;
    }

    // Throw early if no connection string is provided or found
    const mongoUri = uri ?? process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error(
            "MONGODB_URI is not defined. Set it in your .env file or pass a URI directly."
        );
    }

    // Reuse the in-flight promise if a connection attempt is already running
    if (!cached.promise) {
        cached.promise = mongoose.connect(mongoUri, MONGOOSE_OPTIONS);
    }

    cached.conn = await cached.promise;
    return cached.conn;
}

export default connectToDatabase;
