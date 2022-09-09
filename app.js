const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

// requiring routes
const NotFoundError = require('./errors/notFound');
const globalErrorHandler = require('./middlewares/errorHandler');

const app = express();

if (app.get('env') === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

app.use(cookieParser(process.env.COOKIE_SECRET));

// test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// api routes
app.use('/api/v1/albums', require('./routes/albums'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/genres', require('./routes/genre'));
app.use('/api/v1/reviews', require('./routes/reviews'));

app.all('*', (req, res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server`));
});

app.use(globalErrorHandler);

module.exports = app;
