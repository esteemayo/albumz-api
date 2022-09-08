const express = require('express');
const morgan = require('morgan');

const app = express();

if (app.get('env') === 'development') {
  app.use(morgan('dev'));
}

module.exports = app;
