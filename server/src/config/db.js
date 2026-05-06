const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

async function connectDb() {
  if (!MONGO_URI) {
    throw new Error('Thieu MONGO_URI trong file .env');
  }

  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected');
}

module.exports = connectDb;
