import { supabase } from '../config/database.js';

export class CourseService {
  // Get all active courses
  static async getActiveCourses() {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      return { success: true, courses: data };
    } catch (error) {
      console.error('Error getting courses:', error);
      return { success: false, error: error.message };
    }
  }

  // Get course by name
  static async getCourseByName(name) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('name', name)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      return { success: true, course: data };
    } catch (error) {
      console.error('Error getting course by name:', error);
      return { success: false, error: error.message };
    }
  }

  // Create enrollment
  static async createEnrollment(studentId, courseId, paymentId = null) {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .insert({
          student_id: studentId,
          course_id: courseId,
          payment_id: paymentId,
          status: 'pending',
          payment_status: paymentId ? 'pending' : 'pending'
        })
        .select('*, courses(*)')
        .single();

      if (error) throw error;

      return { success: true, enrollment: data };
    } catch (error) {
      console.error('Error creating enrollment:', error);
      return { success: false, error: error.message };
    }
  }

  // Get student enrollments
  static async getStudentEnrollments(studentId) {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*, courses(*)')
        .eq('student_id', studentId)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;

      return { success: true, enrollments: data };
    } catch (error) {
      console.error('Error getting student enrollments:', error);
      return { success: false, error: error.message };
    }
  }
}