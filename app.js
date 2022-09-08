const express = require('express');
const morgan = require('morgan');

// requiring routes

const app = express();

if (app.get('env') === 'development') {
  app.use(morgan('dev'));
}

// test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// api routes
app.use('/api/v1/albums', require('./routes/albums'));

module.exports = app;
