import { supabase } from '../config/database.js';
import { createPaymentIntent, retrievePaymentIntent } from '../config/stripe.js';
import { logActivity } from './crmService.js';

export class PaymentService {
  // Create payment for enrollment
  static async createPayment(enrollmentId, amount, currency = 'kzt') {
    try {
      // Get enrollment details
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('*, students(*), courses(*)')
        .eq('id', enrollmentId)
        .single();

      if (enrollmentError) throw enrollmentError;

      // Create Stripe payment intent
      const stripeResult = await createPaymentIntent(amount, currency, {
        enrollment_id: enrollmentId,
        student_name: enrollment.students.name,
        course_name: enrollment.courses.name
      });

      if (!stripeResult.success) {
        throw new Error(stripeResult.error);
      }

      // Save payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          enrollment_id: enrollmentId,
          stripe_payment_id: stripeResult.paymentIntent.id,
          amount,
          currency,
          status: 'pending'
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Update enrollment with payment ID
      await supabase
        .from('enrollments')
        .update({ payment_id: stripeResult.paymentIntent.id })
        .eq('id', enrollmentId);

      // Log activity
      await logActivity(enrollment.student_id, 'payment_created', 
        `Payment created for ${enrollment.courses.name}`, {
          amount,
          currency,
          payment_id: stripeResult.paymentIntent.id
        });

      return {
        success: true,
        payment,
        clientSecret: stripeResult.clientSecret,
        paymentIntentId: stripeResult.paymentIntent.id
      };
    } catch (error) {
      console.error('Error creating payment:', error);
      return { success: false, error: error.message };
    }
  }

  // Update payment status
  static async updatePaymentStatus(paymentIntentId, status) {
    try {
      // Update payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_payment_id', paymentIntentId)
        .select('*, enrollments(*, students(*), courses(*))')
        .single();

      if (paymentError) throw paymentError;

      // Update enrollment status
      const enrollmentStatus = status === 'succeeded' ? 'confirmed' : 'pending';
      const paymentStatus = status === 'succeeded' ? 'paid' : 
                           status === 'failed' ? 'failed' : 'pending';

      await supabase
        .from('enrollments')
        .update({ 
          status: enrollmentStatus,
          payment_status: paymentStatus
        })
        .eq('id', payment.enrollment_id);

      // Log activity
      await logActivity(payment.enrollments.student_id, 'payment_updated', 
        `Payment ${status} for ${payment.enrollments.courses.name}`, {
          payment_id: paymentIntentId,
          status,
          amount: payment.amount
        });

      return { success: true, payment };
    } catch (error) {
      console.error('Error updating payment status:', error);
      return { success: false, error: error.message };
    }
  }

  // Get payment by Stripe ID
  static async getPaymentByStripeId(stripePaymentId) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*, enrollments(*, students(*), courses(*))')
        .eq('stripe_payment_id', stripePaymentId)
        .single();

      if (error) throw error;

      return { success: true, payment: data };
    } catch (error) {
      console.error('Error getting payment by Stripe ID:', error);
      return { success: false, error: error.message };
    }
  }
}