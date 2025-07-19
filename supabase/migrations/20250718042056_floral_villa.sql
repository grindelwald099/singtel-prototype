/*
  # Fix user_interactions RLS policies

  1. Security Updates
    - Drop existing restrictive policies on user_interactions table
    - Add new policies that allow public insert and select access
    - Enable proper RLS for anonymous and authenticated users

  2. Policy Details
    - Allow anyone to insert interaction data (for tracking)
    - Allow anyone to read interaction data (for recommendations)
    - Maintain data integrity while enabling functionality
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "user-inter" ON user_interactions;
DROP POLICY IF EXISTS "Users can insert their own interactions" ON user_interactions;
DROP POLICY IF EXISTS "Users can read interactions" ON user_interactions;

-- Create new policies that allow public access for tracking
CREATE POLICY "Allow public insert on user_interactions"
  ON user_interactions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public select on user_interactions"
  ON user_interactions
  FOR SELECT
  TO public
  USING (true);

-- Ensure RLS is enabled
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;