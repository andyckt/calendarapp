// Script to check MongoDB collections
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkCollections() {
  const uri = process.env.DATABASE_URL;
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    
    const db = client.db('calendardb');
    const collections = await db.listCollections().toArray();
    
    console.log('Collections in MongoDB Atlas:');
    collections.forEach((collection, i) => {
      console.log(`${i+1}. ${collection.name}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB Atlas');
  }
}

checkCollections(); 