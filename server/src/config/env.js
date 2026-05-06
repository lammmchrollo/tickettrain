require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  DATA_ENCRYPTION_KEY: process.env.DATA_ENCRYPTION_KEY,
  APP_ORIGIN: process.env.APP_ORIGIN || 'http://localhost:5173,http://localhost,capacitor://localhost'
};
