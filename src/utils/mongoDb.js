import { MongoClient } from 'mongodb';
import { MONGODB_CONFIG } from '../config/dataConfig';

let cachedClient = null;

export async function connectToMongo() {
  if (cachedClient) {
    return cachedClient;
  }

  try {
    const client = await MongoClient.connect(MONGODB_CONFIG.uri);
    cachedClient = client;
    return client;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export async function getCollection(collectionName) {
  const client = await connectToMongo();
  const db = client.db(MONGODB_CONFIG.dbName);
  return db.collection(collectionName);
}
