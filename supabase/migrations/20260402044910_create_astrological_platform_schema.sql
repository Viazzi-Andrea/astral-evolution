/*
  # Astrological Platform Database Schema

  ## Overview
  This migration creates the complete database structure for the Astrological SaaS platform,
  including tables for users, birth data, payments, and report generation tracking.

  ## New Tables
  
  ### `users`
  - `id` (uuid, primary key) - Unique user identifier
  - `email` (text, unique) - User email address
  - `name` (text) - Full name
  - `created_at` (timestamptz) - Account creation timestamp
  - `language` (text) - Preferred language (es, en, pt)
  - `country_code` (text) - ISO country code for pricing
  
  ### `birth_data`
  - `id` (uuid, primary key) - Unique birth data record
  - `user_id` (uuid, foreign key) - References users table
  - `name` (text) - Name for this birth chart
  - `birth_date` (date) - Date of birth
  - `birth_time` (time) - Time of birth
  - `birth_city` (text) - City of birth
  - `birth_country` (text) - Country of birth
  - `latitude` (numeric) - Birth location latitude
  - `longitude` (numeric) - Birth location longitude
  - `timezone` (text) - Timezone of birth location
  - `personal_context` (text) - User's personal context/questions
  - `created_at` (timestamptz) - Record creation timestamp
  
  ### `products`
  - `id` (uuid, primary key) - Product identifier
  - `slug` (text, unique) - URL-friendly product identifier
  - `name_es` (text) - Product name in Spanish
  - `name_en` (text) - Product name in English
  - `name_pt` (text) - Product name in Portuguese
  - `description_es` (text) - Description in Spanish
  - `description_en` (text) - Description in English
  - `description_pt` (text) - Description in Portuguese
  - `base_price_usd` (numeric) - Base price in USD
  - `prompt_template` (text) - AI prompt template key
  - `requires_partner_data` (boolean) - Whether product needs two sets of birth data
  - `active` (boolean) - Whether product is available
  - `created_at` (timestamptz) - Product creation timestamp
  
  ### `transactions`
  - `id` (uuid, primary key) - Transaction identifier
  - `user_id` (uuid, foreign key) - References users table
  - `product_id` (uuid, foreign key) - References products table
  - `birth_data_id` (uuid, foreign key) - Primary birth data
  - `partner_birth_data_id` (uuid, foreign key, nullable) - Partner birth data for couples reading
  - `stripe_payment_intent_id` (text, unique) - Stripe payment intent ID
  - `stripe_checkout_session_id` (text) - Stripe checkout session ID
  - `amount` (numeric) - Amount paid
  - `currency` (text) - Currency code
  - `country_code` (text) - Country where payment was made
  - `status` (text) - Payment status (pending, completed, failed, refunded)
  - `created_at` (timestamptz) - Transaction timestamp
  - `completed_at` (timestamptz) - Completion timestamp
  
  ### `reports`
  - `id` (uuid, primary key) - Report identifier
  - `transaction_id` (uuid, foreign key) - References transactions table
  - `status` (text) - Report status (pending, generating, completed, failed)
  - `ai_response` (text) - Raw AI-generated content
  - `pdf_url` (text) - URL to generated PDF
  - `error_message` (text) - Error message if generation failed
  - `created_at` (timestamptz) - Report creation timestamp
  - `generated_at` (timestamptz) - Generation completion timestamp
  - `sent_at` (timestamptz) - Email sent timestamp

  ## Security
  - All tables have RLS enabled
  - Users can only read their own data
  - Products table is readable by all authenticated users
  - Admin operations require service role
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  language text DEFAULT 'es',
  country_code text,
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Birth data table
CREATE TABLE IF NOT EXISTS birth_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  birth_date date NOT NULL,
  birth_time time NOT NULL,
  birth_city text NOT NULL,
  birth_country text NOT NULL,
  latitude numeric,
  longitude numeric,
  timezone text,
  personal_context text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE birth_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own birth data"
  ON birth_data FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own birth data"
  ON birth_data FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own birth data"
  ON birth_data FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name_es text NOT NULL,
  name_en text NOT NULL,
  name_pt text NOT NULL,
  description_es text NOT NULL,
  description_en text NOT NULL,
  description_pt text NOT NULL,
  base_price_usd numeric NOT NULL,
  prompt_template text NOT NULL,
  requires_partner_data boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are readable by all authenticated users"
  ON products FOR SELECT
  TO authenticated
  USING (active = true);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  birth_data_id uuid REFERENCES birth_data(id),
  partner_birth_data_id uuid REFERENCES birth_data(id),
  stripe_payment_intent_id text UNIQUE,
  stripe_checkout_session_id text,
  amount numeric NOT NULL,
  currency text NOT NULL,
  country_code text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT status_values CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  ai_response text,
  pdf_url text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  generated_at timestamptz,
  sent_at timestamptz,
  CONSTRAINT report_status_values CHECK (status IN ('pending', 'generating', 'completed', 'failed'))
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = reports.transaction_id
      AND transactions.user_id = auth.uid()
    )
  );

-- Insert initial products
INSERT INTO products (slug, name_es, name_en, name_pt, description_es, description_en, description_pt, base_price_usd, prompt_template, requires_partner_data)
VALUES 
  (
    'lectura-esencial',
    'Lectura Esencial',
    'Essential Reading',
    'Leitura Essencial',
    'Un análisis astrológico completo de tu Sol, Luna y Ascendente, junto con los tránsitos del mes actual.',
    'A complete astrological analysis of your Sun, Moon and Ascendant, along with the current month''s transits.',
    'Uma análise astrológica completa do seu Sol, Lua e Ascendente, junto com os trânsitos do mês atual.',
    15.00,
    'essential_reading',
    false
  ),
  (
    'consulta-evolutiva',
    'Consulta Evolutiva',
    'Evolutionary Consultation',
    'Consulta Evolutiva',
    'Un análisis profundo de tu carta natal completa, casas astrológicas, tránsitos anuales y tu camino de evolución personal.',
    'An in-depth analysis of your complete birth chart, astrological houses, annual transits and your path of personal evolution.',
    'Uma análise aprofundada do seu mapa natal completo, casas astrológicas, trânsitos anuais e seu caminho de evolução pessoal.',
    38.00,
    'evolutionary_consultation',
    false
  ),
  (
    'especial-parejas',
    'Especial Parejas',
    'Couples Special',
    'Especial Casais',
    'Un análisis completo de sinastría que revela la dinámica de vuestra relación, compatibilidad y propósito compartido.',
    'A complete synastry analysis revealing your relationship dynamics, compatibility and shared purpose.',
    'Uma análise completa de sinastria que revela a dinâmica do seu relacionamento, compatibilidade e propósito compartilhado.',
    55.00,
    'couples_special',
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_birth_data_user_id ON birth_data(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_reports_transaction_id ON reports(transaction_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);