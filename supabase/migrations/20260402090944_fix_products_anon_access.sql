/*
  # Fix Products Access for Anonymous Users

  1. Changes
    - Add policy to allow anonymous users to read active products
    - This is needed for the checkout flow where users haven't authenticated yet
  
  2. Security
    - Only allows SELECT (read) operations
    - Only for active products
    - No data modification possible
*/

-- Drop existing policy if exists and recreate with anon access
DROP POLICY IF EXISTS "Products are readable by all authenticated users" ON products;

-- Allow both anonymous and authenticated users to view active products
CREATE POLICY "Products are readable by all users"
  ON products
  FOR SELECT
  TO anon, authenticated
  USING (active = true);
