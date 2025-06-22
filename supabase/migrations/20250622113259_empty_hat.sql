/*
  # Initial Schema for TechLab Bot

  1. New Tables
    - `students` - Student information and profiles
      - `id` (uuid, primary key)
      - `telegram_id` (bigint, unique) - Telegram user ID
      - `name` (text) - Student name
      - `age` (integer) - Student age
      - `phone` (text) - Contact phone
      - `language` (text) - Preferred language (ru/kz)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `courses` - Available courses
      - `id` (uuid, primary key)
      - `name` (text) - Course name
      - `description` (text) - Course description
      - `price` (integer) - Price in tenge
      - `duration_weeks` (integer) - Course duration
      - `max_students` (integer) - Maximum students per group
      - `is_active` (boolean) - Course availability
      - `created_at` (timestamp)
    
    - `enrollments` - Student course enrollments
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `course_id` (uuid, foreign key)
      - `status` (text) - pending, confirmed, completed, cancelled
      - `payment_status` (text) - pending, paid, failed, refunded
      - `payment_id` (text) - Stripe payment intent ID
      - `enrolled_at` (timestamp)
      - `starts_at` (timestamp)
      - `ends_at` (timestamp)
    
    - `payments` - Payment records
      - `id` (uuid, primary key)
      - `enrollment_id` (uuid, foreign key)
      - `stripe_payment_id` (text) - Stripe payment intent ID
      - `amount` (integer) - Amount in tenge
      - `currency` (text) - Currency code
      - `status` (text) - pending, succeeded, failed, cancelled
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `crm_activities` - CRM activity log
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `activity_type` (text) - registration, payment, message, etc.
      - `description` (text) - Activity description
      - `metadata` (jsonb) - Additional data
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
    - Service role access for bot operations

  3. Indexes
    - Add indexes for frequently queried columns
    - Optimize for bot performance
*/

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint UNIQUE NOT NULL,
  name text NOT NULL,
  age integer,
  phone text,
  language text DEFAULT 'ru' CHECK (language IN ('ru', 'kz')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price integer NOT NULL DEFAULT 18000,
  duration_weeks integer DEFAULT 4,
  max_students integer DEFAULT 5,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_id text,
  enrolled_at timestamptz DEFAULT now(),
  starts_at timestamptz,
  ends_at timestamptz
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE,
  stripe_payment_id text UNIQUE,
  amount integer NOT NULL,
  currency text DEFAULT 'kzt',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- CRM Activities table
CREATE TABLE IF NOT EXISTS crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Service role has full access)
CREATE POLICY "Service role full access on students"
  ON students FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on courses"
  ON courses FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on enrollments"
  ON enrollments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on payments"
  ON payments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on crm_activities"
  ON crm_activities FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_telegram_id ON students(telegram_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_payments_enrollment_id ON payments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_id ON payments(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_student_id ON crm_activities(student_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_type ON crm_activities(activity_type);

-- Insert initial courses
INSERT INTO courses (name, description, price, duration_weeks) VALUES
  ('Python', 'Программирование на языке Python для детей', 18000, 8),
  ('LEGO WeDo', 'Робототехника для младших школьников', 20000, 6),
  ('MINDSTORMS', 'Продвинутая робототехника', 25000, 10),
  ('Arduino', 'Программирование микроконтроллеров', 22000, 8)
ON CONFLICT DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();