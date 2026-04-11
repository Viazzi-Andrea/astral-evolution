-- Sistema de Perfiles de Nacimiento Guardados
-- Permite a los usuarios guardar múltiples perfiles para autocompletar formularios

CREATE TABLE IF NOT EXISTS birth_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  nickname text,
  birth_date date NOT NULL,
  birth_time time NOT NULL,
  birth_city text NOT NULL,
  birth_country text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE birth_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own birth profiles"
  ON birth_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own birth profiles"
  ON birth_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own birth profiles"
  ON birth_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own birth profiles"
  ON birth_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS birth_profiles_user_id_idx ON birth_profiles(user_id);
CREATE INDEX IF NOT EXISTS birth_profiles_is_primary_idx ON birth_profiles(user_id, is_primary);