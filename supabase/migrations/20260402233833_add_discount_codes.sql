/*
  # Add Discount Codes System

  1. New Tables
    - `discount_codes`
      - `id` (uuid, primary key)
      - `code` (text, unique) - The discount code itself
      - `discount_percent` (integer) - Percentage discount (0-100)
      - `max_uses` (integer, nullable) - Maximum number of uses (null = unlimited)
      - `current_uses` (integer) - Current number of uses
      - `valid_from` (timestamptz) - When the code becomes valid
      - `valid_until` (timestamptz, nullable) - When the code expires (null = never)
      - `active` (boolean) - Whether the code is active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `transaction_discount_codes`
      - Junction table to track which transactions used which discount codes
      - `id` (uuid, primary key)
      - `transaction_id` (uuid, references transactions)
      - `discount_code_id` (uuid, references discount_codes)
      - `discount_amount` (decimal) - Amount discounted
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Anyone can read active discount codes (to validate them)
    - Only authenticated users can use discount codes
    - Policies for tracking usage

  3. Initial Data
    - Create TEST100 code with 100% discount for testing
*/

-- Create discount_codes table
CREATE TABLE IF NOT EXISTS discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_percent integer NOT NULL CHECK (discount_percent >= 0 AND discount_percent <= 100),
  max_uses integer CHECK (max_uses IS NULL OR max_uses > 0),
  current_uses integer DEFAULT 0 NOT NULL,
  valid_from timestamptz DEFAULT now() NOT NULL,
  valid_until timestamptz,
  active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create transaction_discount_codes junction table
CREATE TABLE IF NOT EXISTS transaction_discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
  discount_code_id uuid REFERENCES discount_codes(id) ON DELETE CASCADE NOT NULL,
  discount_amount decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(transaction_id, discount_code_id)
);

-- Enable RLS
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_discount_codes ENABLE ROW LEVEL SECURITY;

-- Policies for discount_codes
CREATE POLICY "Anyone can read active discount codes"
  ON discount_codes
  FOR SELECT
  USING (active = true);

-- Policies for transaction_discount_codes
CREATE POLICY "Users can read their own transaction discounts"
  ON transaction_discount_codes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = transaction_discount_codes.transaction_id
      AND transactions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own transaction discounts"
  ON transaction_discount_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = transaction_discount_codes.transaction_id
      AND transactions.user_id = auth.uid()
    )
  );

-- Insert the 100% test discount code
INSERT INTO discount_codes (code, discount_percent, max_uses, active)
VALUES ('TEST100', 100, NULL, true)
ON CONFLICT (code) DO NOTHING;

-- Create function to validate and apply discount code
CREATE OR REPLACE FUNCTION validate_discount_code(
  p_code text,
  OUT is_valid boolean,
  OUT discount_percent integer,
  OUT error_message text
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_discount_code discount_codes%ROWTYPE;
BEGIN
  -- Get the discount code
  SELECT * INTO v_discount_code
  FROM discount_codes
  WHERE code = p_code AND active = true;

  -- Check if code exists
  IF NOT FOUND THEN
    is_valid := false;
    discount_percent := 0;
    error_message := 'Código de descuento no válido';
    RETURN;
  END IF;

  -- Check if code has started
  IF v_discount_code.valid_from > now() THEN
    is_valid := false;
    discount_percent := 0;
    error_message := 'Este código aún no es válido';
    RETURN;
  END IF;

  -- Check if code has expired
  IF v_discount_code.valid_until IS NOT NULL AND v_discount_code.valid_until < now() THEN
    is_valid := false;
    discount_percent := 0;
    error_message := 'Este código ha expirado';
    RETURN;
  END IF;

  -- Check if code has reached max uses
  IF v_discount_code.max_uses IS NOT NULL AND v_discount_code.current_uses >= v_discount_code.max_uses THEN
    is_valid := false;
    discount_percent := 0;
    error_message := 'Este código ha alcanzado el límite de usos';
    RETURN;
  END IF;

  -- Code is valid
  is_valid := true;
  discount_percent := v_discount_code.discount_percent;
  error_message := NULL;
END;
$$;
