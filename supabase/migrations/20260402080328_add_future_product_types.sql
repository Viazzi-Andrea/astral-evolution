/*
  # Add Support for Future Product Types

  ## Overview
  This migration prepares the database structure to support future product types:
  - 'Guía de Crecimiento para Recién Nacidos' (Baby Growth Guide)
  - 'Tarjetas de Regalo' (Gift Cards)

  ## Changes

  1. Product Types
    - Add `product_type` column to products table
    - Types: 'astrological_reading' (default), 'baby_guide', 'gift_card'
    - This allows different fulfillment workflows for different product types

  2. Gift Cards Table (structure ready for future use)
    - `id` (uuid, primary key) - Gift card identifier
    - `code` (text, unique) - Redemption code
    - `product_id` (uuid, foreign key) - Product this gift card is for
    - `purchased_by_user_id` (uuid, foreign key) - Who bought the gift card
    - `redeemed_by_user_id` (uuid, foreign key, nullable) - Who redeemed it
    - `amount` (numeric) - Value in USD
    - `recipient_email` (text) - Email of gift recipient
    - `recipient_name` (text) - Name of gift recipient
    - `personal_message` (text) - Custom message from buyer
    - `status` (text) - Status: active, redeemed, expired, refunded
    - `expires_at` (timestamptz) - Expiration date
    - `redeemed_at` (timestamptz) - When it was redeemed
    - `created_at` (timestamptz) - Creation timestamp

  3. Baby Birth Data (for future Baby Growth Guide product)
    - Add `is_baby` column to birth_data table
    - Add `parent_user_id` column to birth_data table
    - This allows tracking baby charts separate from adult charts

  ## Security
  - All new tables have RLS enabled with restrictive policies
  - Users can only access their own gift cards
  - Gift card codes are only visible to owner and redeemer
*/

-- Add product type to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'product_type'
  ) THEN
    ALTER TABLE products ADD COLUMN product_type text DEFAULT 'astrological_reading' NOT NULL;
    ALTER TABLE products ADD CONSTRAINT product_type_check
      CHECK (product_type IN ('astrological_reading', 'baby_guide', 'gift_card'));
  END IF;
END $$;

-- Add baby-related columns to birth_data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'birth_data' AND column_name = 'is_baby'
  ) THEN
    ALTER TABLE birth_data ADD COLUMN is_baby boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'birth_data' AND column_name = 'parent_user_id'
  ) THEN
    ALTER TABLE birth_data ADD COLUMN parent_user_id uuid REFERENCES users(id);
  END IF;
END $$;

-- Create gift_cards table (ready for future use)
CREATE TABLE IF NOT EXISTS gift_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  product_id uuid REFERENCES products(id) NOT NULL,
  purchased_by_user_id uuid REFERENCES users(id) NOT NULL,
  redeemed_by_user_id uuid REFERENCES users(id),
  amount numeric NOT NULL CHECK (amount > 0),
  recipient_email text NOT NULL,
  recipient_name text NOT NULL,
  personal_message text,
  status text DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'redeemed', 'expired', 'refunded')),
  expires_at timestamptz DEFAULT (now() + interval '1 year') NOT NULL,
  redeemed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on gift_cards
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;

-- Gift card policies: purchaser can view their purchased cards
CREATE POLICY "Users can view gift cards they purchased"
  ON gift_cards FOR SELECT
  TO authenticated
  USING (auth.uid() = purchased_by_user_id);

-- Gift card policies: redeemer can view redeemed cards
CREATE POLICY "Users can view gift cards they redeemed"
  ON gift_cards FOR SELECT
  TO authenticated
  USING (auth.uid() = redeemed_by_user_id);

-- Create index for quick gift card code lookups
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status);
CREATE INDEX IF NOT EXISTS idx_gift_cards_expires_at ON gift_cards(expires_at);

-- Add comment to document the structure
COMMENT ON TABLE gift_cards IS 'Gift cards for astrological readings - supports future gift card product type';
COMMENT ON COLUMN products.product_type IS 'Type of product: astrological_reading (default), baby_guide, or gift_card';
COMMENT ON COLUMN birth_data.is_baby IS 'Whether this birth data is for a baby (used in Baby Growth Guide)';
COMMENT ON COLUMN birth_data.parent_user_id IS 'Parent user ID if this is a baby chart';
