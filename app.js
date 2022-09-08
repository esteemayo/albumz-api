const express = require('express');
const morgan = require('morgan');

// requiring routes

const app = express();

if (app.get('env') === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// api routes
app.use('/api/v1/albums', require('./routes/albums'));
app.use('/api/v1/users', require('./routes/users'));

module.exports = app;
