// Script to check database collections and their content
require('dotenv').config();
const mongoose = require('mongoose');

const checkDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/personal_finance');
        console.log('Connected to MongoDB');
        
        // List all collections
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        
        console.log('📊 Database collections:');
        collections.forEach((collection, index) => {
            console.log(`  ${index + 1}. ${collection.name}`);
        });
        
        // Check each collection for documents
        for (const collection of collections) {
            const count = await db.collection(collection.name).countDocuments();
            console.log(`\n📈 Collection '${collection.name}' has ${count} documents`);
            
            if (count > 0 && count < 10) {
                const docs = await db.collection(collection.name).find({}).limit(3).toArray();
                console.log('   Sample documents:');
                docs.forEach((doc, index) => {
                    console.log(`   ${index + 1}.`, JSON.stringify(doc, null, 2));
                });
            }
        }
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error checking database:', error.message);
    }
};

checkDatabase();
