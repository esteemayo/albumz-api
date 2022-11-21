/* eslint-disable */
const dotenv = require('dotenv');
const mongoose = require('mongoose');
require('colors');

dotenv.config({ path: './config.env' });

const devEnv = process.env.NODE_ENV !== 'production';
const { DATABASE, DATABASE_LOCAL, DATABASE_PASSWORD } = process.env;

const dbLocal = DATABASE_LOCAL;
const mongoURI = DATABASE.replace('<PASSWORD>', DATABASE_PASSWORD);

const db = devEnv ? dbLocal : mongoURI;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(db);
    console.log(`Connected to MongoDB → ${conn.connection.port}`.gray.bold);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected'.red.bold);
});

module.exports = connectDB;
