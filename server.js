/* eslint-disable */
const dotenv = require('dotenv');
require('colors');

dotenv.config({ path: './config.env' });
const app = require('./app');
const connectDB = require('./config/db');

// MongoDB connction
connectDB();

app.set('port', process.env.PORT || 9797);

const server = app.listen(app.get('port'), () =>
  console.log(`Server listening at port → ${server.address().port}`.cyan.bold)
);
