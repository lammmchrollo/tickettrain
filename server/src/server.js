const app = require('./app');
const connectDb = require('./config/db');
const { PORT } = require('./config/env');

async function bootstrap() {
  try {
    await connectDb();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running at http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Bootstrap error:', error.message);
    process.exit(1);
  }
}

bootstrap();
