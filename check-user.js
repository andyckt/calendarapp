// Script to check if user exists in MongoDB Atlas
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkUser() {
  // Get the connection string from .env
  const uri = process.env.DATABASE_URL;
  
  if (!uri) {
    console.error('No DATABASE_URL found in .env file');
    return;
  }
  
  const client = new MongoClient(uri);
  
  try {
    // Connect to the MongoDB cluster
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    
    // Get the database and collection
    const db = client.db('calendardb');
    const usersCollection = db.collection('users');
    
    // Find the user by email
    const user = await usersCollection.findOne({ email: 'chrislouis1104@gmail.com' });
    
    if (user) {
      console.log('User found:');
      // Remove sensitive info before printing
      const { password, ...safeUserData } = user;
      console.log(JSON.stringify(safeUserData, null, 2));
    } else {
      console.log('No user found with email chrislouis1104@gmail.com');
      
      // List all users to see what's there
      console.log('\nListing all users:');
      const allUsers = await usersCollection.find({}).toArray();
      console.log(`Found ${allUsers.length} users in the database`);
      
      if (allUsers.length > 0) {
        allUsers.forEach((user, index) => {
          const { password, ...safeUser } = user;
          console.log(`\nUser ${index + 1}:`);
          console.log(JSON.stringify(safeUser, null, 2));
        });
      }
    }
  } catch (error) {
    console.error('Error connecting to MongoDB Atlas:', error);
  } finally {
    // Close the connection
    await client.close();
    console.log('Disconnected from MongoDB Atlas');
  }
}

// Run the function
checkUser(); 