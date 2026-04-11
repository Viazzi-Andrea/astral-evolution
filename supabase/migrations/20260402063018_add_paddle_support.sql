/*
  # Add Paddle Payment Support

  1. Changes to Tables
    - `products`
      - Add `paddle_price_id` column to store Paddle price IDs
    - `transactions`
      - Add `paddle_transaction_id` column
      - Add `paddle_checkout_url` column
      - Remove dependency on Stripe-specific fields (keep for backward compatibility)
  
  2. Notes
    - Existing Stripe fields remain for backward compatibility
    - Migration is safe and non-destructive
*/

-- Add Paddle fields to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'paddle_price_id'
  ) THEN
    ALTER TABLE products ADD COLUMN paddle_price_id text;
  END IF;
END $$;

-- Add Paddle fields to transactions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'paddle_transaction_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN paddle_transaction_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'paddle_checkout_url'
  ) THEN
    ALTER TABLE transactions ADD COLUMN paddle_checkout_url text;
  END IF;
END $$;

-- Add index for faster Paddle transaction lookups
CREATE INDEX IF NOT EXISTS idx_transactions_paddle_transaction_id 
  ON transactions(paddle_transaction_id);
