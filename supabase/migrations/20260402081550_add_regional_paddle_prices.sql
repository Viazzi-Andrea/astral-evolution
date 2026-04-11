/*
  # Add Regional Paddle Price Support

  1. Changes to Tables
    - `products`
      - Add `paddle_price_id_latam` column for LATAM pricing
      - Add `paddle_price_id_intl` column for International pricing
      - Keep existing `paddle_price_id` for backward compatibility (can be deprecated later)
  
  2. Notes
    - Allows products to have different Paddle price IDs based on region
    - LATAM countries use `paddle_price_id_latam`
    - International countries use `paddle_price_id_intl`
    - Migration is safe and non-destructive
*/

-- Add regional Paddle price ID fields to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'paddle_price_id_latam'
  ) THEN
    ALTER TABLE products ADD COLUMN paddle_price_id_latam text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'paddle_price_id_intl'
  ) THEN
    ALTER TABLE products ADD COLUMN paddle_price_id_intl text;
  END IF;
END $$;

-- Update existing products with regional Paddle price IDs
UPDATE products
SET 
  paddle_price_id_intl = 'pri_01kn6jp6bayjc1eajpfxpm0g2j',
  paddle_price_id_latam = 'pri_01kn6jwctng2ahgrmahn0x9smb'
WHERE slug = 'lectura-esencial';

UPDATE products
SET 
  paddle_price_id_intl = 'pri_01kn6jm2jfmqqsw8dxsjvhnsy6',
  paddle_price_id_latam = 'pri_01kn6jsen19sbmq4t5pdca5prn'
WHERE slug = 'consulta-evolutiva';

UPDATE products
SET 
  paddle_price_id_intl = 'pri_01kn6jhn26fg0z1pveg2vrwwj9',
  paddle_price_id_latam = 'pri_01kn6jqxfw0xhx6a5xa5zj9qxb'
WHERE slug = 'especial-parejas';
