const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

// Get MongoDB URI from environment variables
const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('ERROR: MONGO_URI environment variable is not defined!');
  process.exit(1);
}

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db;

async function connectToDatabase() {
  try {
    // Connect the client to the server
    await client.connect();
    
    // Get reference to the database (you can change 'discord-bot' to your preferred database name)
    db = client.db('discord-bot');
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");
    
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized! Call connectToDatabase() first.');
  }
  return db;
}

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await client.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    process.exit(1);
  }
});

module.exports = {
  connectToDatabase,
  getDatabase,
  client
};
