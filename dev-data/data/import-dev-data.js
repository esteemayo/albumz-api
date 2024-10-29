/* eslint-disable */

import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

import 'colors';

// models
import Review from '../../models/Review.js';
import User from '../../models/User.js';
import History from '../../models/History.js';
import Album from '../../models/Album.js';
import Bookmark from '../../models/Bookmark.js';
import Genre from '../../models/Genre.js';

import connectDB from '../../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: './config.env' });

// database connection
connectDB();

// read JSON file
const albums = JSON.parse(fs.readFileSync(`${__dirname}/albums.json`, 'utf-8'));
const genres = JSON.parse(fs.readFileSync(`${__dirname}/genres.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));

// import data into DB
const importData = async () => {
  try {
    await Album.create(albums);
    await Genre.create(genres);
    await Review.create(reviews);
    await User.create(users, { validateBeforeSave: false });
    console.log(
      '👍👍👍👍👍👍👍👍 Data successfully loaded! 👍👍👍👍👍👍👍👍'.green.bold
    );
    process.exit();
  } catch (err) {
    console.log(err);
    process.exit();
  }
};

// remove all data from DB
const deleteData = async () => {
  try {
    console.log('😢😢 Goodbye Data...');
    await Album.deleteMany();
    await Genre.deleteMany();
    await Review.deleteMany();
    await User.deleteMany();
    await History.deleteMany();
    await Bookmark.deleteMany();
    console.log(
      'Data successfully deleted! To load sample data, run\n\n\t npm run sample\n\n'
        .blue.bold
    );
    process.exit();
  } catch (err) {
    console.log(
      '\n👎👎👎👎👎👎👎👎 Error! The Error info is below but if you are importing sample data make sure to drop the existing database first with.\n\n\t npm run blowitallaway\n\n\n'
        .red.bold
    );
    console.log(err);
    process.exit();
  }
};

if (process.argv[2] === '--remove') {
  deleteData();
} else if (process.argv[2] === '--import') {
  importData();
}
