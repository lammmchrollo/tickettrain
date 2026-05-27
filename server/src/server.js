const http = require('http');
const app = require('./app');
const connectDb = require('./config/db');
const { init } = require('./socket');
const { PORT } = require('./config/env');
const { startCleaner } = require('./holdCleaner');

async function bootstrap() {
  try {
    await connectDb();

    const server = http.createServer(app);

    // initialize socket.io
    init(server);

    // start background hold cleaner
    try {
      startCleaner();
    } catch (err) {
      console.warn('Could not start hold cleaner:', err.message);
    }

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running at http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Bootstrap error:', error.message);
    process.exit(1);
  }
}

bootstrap();
