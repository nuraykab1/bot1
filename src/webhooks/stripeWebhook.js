import express from 'express';
import { stripe } from '../config/stripe.js';
import { PaymentService } from '../services/paymentService.js';

export function setupStripeWebhook(app) {
  // Stripe webhook endpoint
  app.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentSucceeded(event.data.object);
          break;
          
        case 'payment_intent.payment_failed':
          await handlePaymentFailed(event.data.object);
          break;
          
        case 'payment_intent.canceled':
          await handlePaymentCanceled(event.data.object);
          break;
          
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook handler error:', error);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  });
}

async function handlePaymentSucceeded(paymentIntent) {
  console.log('💰 Payment succeeded:', paymentIntent.id);
  
  const result = await PaymentService.updatePaymentStatus(paymentIntent.id, 'succeeded');
  if (result.success) {
    console.log('✅ Payment status updated successfully');
    
    // Here you could send a confirmation message to the user via Telegram
    // or trigger other business logic
  } else {
    console.error('❌ Failed to update payment status:', result.error);
  }
}

async function handlePaymentFailed(paymentIntent) {
  console.log('❌ Payment failed:', paymentIntent.id);
  
  const result = await PaymentService.updatePaymentStatus(paymentIntent.id, 'failed');
  if (result.success) {
    console.log('✅ Payment failure status updated');
  } else {
    console.error('❌ Failed to update payment failure status:', result.error);
  }
}

async function handlePaymentCanceled(paymentIntent) {
  console.log('🚫 Payment canceled:', paymentIntent.id);
  
  const result = await PaymentService.updatePaymentStatus(paymentIntent.id, 'cancelled');
  if (result.success) {
    console.log('✅ Payment cancellation status updated');
  } else {
    console.error('❌ Failed to update payment cancellation status:', result.error);
  }
}