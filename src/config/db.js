const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { 
            family: 4,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        });
        console.log("✅ Database Connected");
    } catch (err) {
        console.error("❌ Connection Error:", err.message);
        process.exit(1);
    }
};

module.exports = connectDB;