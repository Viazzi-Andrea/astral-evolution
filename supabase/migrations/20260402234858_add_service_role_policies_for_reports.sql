/*
  # Add Service Role Policies for Reports Table

  1. Changes
    - Add service role policy to reports table to allow full access
    - This enables the test generation API to create and update reports

  2. Security
    - Service role has full access for backend operations
    - Existing authenticated user policies remain unchanged
*/

-- Add service role policy for reports
CREATE POLICY "Service role has full access to reports"
  ON reports
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anon and authenticated to insert reports
CREATE POLICY "Allow users to create reports"
  ON reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
