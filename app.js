import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import compression from 'compression';

// requiring routes
import albumRoute from './routes/albums.js';
import userRoute from './routes/users.js';
import authRoute from './routes/auth.js';
import genreRoute from './routes/genres.js';
import reviewRoute from './routes/reviews.js';
import bookmarkRoute from './routes/bookmarks.js';
import historyRoute from './routes/histories.js';
import NotFoundError from './errors/notFound.js';
import globalErrorHandler from './middlewares/errorHandler.js';

// start express app
const app = express();

// global middlewares
app.set('trust proxy', 1);

// implement CORS
app.use(cors());

// Access-Control-Allow-Origin
app.options('*', cors());

// set security HTTP headers
app.use(helmet());

// development logging
if (app.get('env') === 'development') {
  app.use(morgan('dev'));
}

// limit request from same api
const limiter = rateLimit({
  max: 100,
  windowMs: 30 * 60 * 1000,
  message: 'Too many requests from this IP, Please try again in 30 minutes!',
});

app.use('/api', limiter);

// body Parser, reading data from body into req.body
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// cookie parser middleware
app.use(cookieParser(process.env.COOKIE_SECRET));

// data sanitization against NoSQL query injection
app.use(mongoSanitize());

// data sanitization against XSS
app.use(xss());

// prevent parameter pollution
app.use(hpp());

// compression middleware
app.use(compression());

// test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// api routes middleware
app.use('/api/v1/albums', albumRoute);
app.use('/api/v1/users', userRoute);
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/genres', genreRoute);
app.use('/api/v1/reviews', reviewRoute);
app.use('/api/v1/bookmarks', bookmarkRoute);
app.use('/api/v1/histories', historyRoute);

app.all('*', (req, res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server`));
});

app.use(globalErrorHandler);

export default app;
