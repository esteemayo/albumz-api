/* eslint-disable */
import dotenv from 'dotenv';
import 'colors';

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 🔥 Shutting down...'.bgRed.bold);
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');
const connectDB = require('./config/db');

app.set('port', process.env.PORT || 9797);

const server = app.listen(app.get('port'), async () => {
  await connectDB();
  console.log(`Server listening at port → ${server.address().port}`.cyan.bold)
});

process.on('SIGTERM', () => {
  console.log('👏 SIGTERM RECEIVED, Shutting down gracefully');
  server.close(() => {
    console.log('🔥 Process terminated');
  });
});
