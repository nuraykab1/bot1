import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './src/config/database.js';
import { bot } from './src/bot/bot.js';
import { setupPaymentRoutes } from './src/web/paymentPage.js';
import { setupCRMRoutes } from './src/web/crmDashboard.js';
import { setupStripeWebhook } from './src/webhooks/stripeWebhook.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());

// Stripe webhook needs raw body, so we set it up before express.json()
setupStripeWebhook(app);

// JSON middleware for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
setupPaymentRoutes(app);
setupCRMRoutes(app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'TechLab Bot Server'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'TechLab Digital Solutions Bot Server',
    version: '2.0.0',
    features: [
      'Telegram Bot Integration',
      'Database Storage (Supabase)',
      'Payment Processing (Stripe)',
      'CRM Dashboard',
      'Webhook Handling'
    ],
    endpoints: {
      health: '/health',
      payment: '/payment?client_secret=...',
      crm: '/crm',
      webhook: '/webhook/stripe'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    console.log('🔍 Testing database connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Database connection failed. Please check your Supabase configuration.');
      process.exit(1);
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 CRM Dashboard: http://localhost:${PORT}/crm`);
      console.log(`💳 Payment Page: http://localhost:${PORT}/payment`);
      console.log(`🤖 Telegram Bot: Active and listening`);
      console.log(`🔗 Webhook URL: http://localhost:${PORT}/webhook/stripe`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

// Start the server
startServer();