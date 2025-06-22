import { supabase } from '../config/database.js';
import { logActivity } from './crmService.js';

export class StudentService {
  // Create or update student
  static async upsertStudent(telegramId, studentData) {
    try {
      const { data, error } = await supabase
        .from('students')
        .upsert({
          telegram_id: telegramId,
          ...studentData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'telegram_id'
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await logActivity(data.id, 'registration', 'Student profile updated', {
        telegram_id: telegramId,
        ...studentData
      });

      return { success: true, student: data };
    } catch (error) {
      console.error('Error upserting student:', error);
      return { success: false, error: error.message };
    }
  }

  // Get student by Telegram ID
  static async getStudentByTelegramId(telegramId) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('telegram_id', telegramId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return { success: true, student: data };
    } catch (error) {
      console.error('Error getting student:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all students (for CRM)
  static async getAllStudents(limit = 50, offset = 0) {
    try {
      const { data, error, count } = await supabase
        .from('students')
        .select('*, enrollments(*, courses(name))', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return { success: true, students: data, total: count };
    } catch (error) {
      console.error('Error getting all students:', error);
      return { success: false, error: error.message };
    }
  }

  // Get student statistics
  static async getStudentStats() {
    try {
      const { data: totalStudents, error: error1 } = await supabase
        .from('students')
        .select('id', { count: 'exact' });

      const { data: activeEnrollments, error: error2 } = await supabase
        .from('enrollments')
        .select('id', { count: 'exact' })
        .eq('status', 'confirmed');

      const { data: pendingPayments, error: error3 } = await supabase
        .from('enrollments')
        .select('id', { count: 'exact' })
        .eq('payment_status', 'pending');

      if (error1 || error2 || error3) {
        throw error1 || error2 || error3;
      }

      return {
        success: true,
        stats: {
          totalStudents: totalStudents?.length || 0,
          activeEnrollments: activeEnrollments?.length || 0,
          pendingPayments: pendingPayments?.length || 0
        }
      };
    } catch (error) {
      console.error('Error getting student stats:', error);
      return { success: false, error: error.message };
    }
  }
}