import { supabase } from '../config/database.js';

export class CRMService {
  // Get CRM dashboard data
  static async getDashboardData() {
    try {
      // Get recent activities
      const { data: activities, error: activitiesError } = await supabase
        .from('crm_activities')
        .select('*, students(name, telegram_id)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (activitiesError) throw activitiesError;

      // Get enrollment statistics
      const { data: enrollmentStats, error: statsError } = await supabase
        .from('enrollments')
        .select('status, payment_status, courses(name)')
        .order('enrolled_at', { ascending: false });

      if (statsError) throw statsError;

      // Process statistics
      const stats = {
        totalEnrollments: enrollmentStats.length,
        confirmedEnrollments: enrollmentStats.filter(e => e.status === 'confirmed').length,
        pendingPayments: enrollmentStats.filter(e => e.payment_status === 'pending').length,
        paidEnrollments: enrollmentStats.filter(e => e.payment_status === 'paid').length,
        courseBreakdown: {}
      };

      // Course breakdown
      enrollmentStats.forEach(enrollment => {
        const courseName = enrollment.courses.name;
        if (!stats.courseBreakdown[courseName]) {
          stats.courseBreakdown[courseName] = 0;
        }
        stats.courseBreakdown[courseName]++;
      });

      return {
        success: true,
        data: {
          activities,
          stats
        }
      };
    } catch (error) {
      console.error('Error getting CRM dashboard data:', error);
      return { success: false, error: error.message };
    }
  }

  // Get student details with full history
  static async getStudentDetails(studentId) {
    try {
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select(`
          *,
          enrollments(*, courses(*), payments(*)),
          crm_activities(*)
        `)
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      return { success: true, student };
    } catch (error) {
      console.error('Error getting student details:', error);
      return { success: false, error: error.message };
    }
  }
}

// Log CRM activity
export async function logActivity(studentId, activityType, description, metadata = {}) {
  try {
    const { error } = await supabase
      .from('crm_activities')
      .insert({
        student_id: studentId,
        activity_type: activityType,
        description,
        metadata
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error logging activity:', error);
    return { success: false, error: error.message };
  }
}