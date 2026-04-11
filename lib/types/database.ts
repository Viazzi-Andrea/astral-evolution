export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  language: 'es' | 'en' | 'pt';
  country_code?: string;
}

export interface BirthData {
  id: string;
  user_id: string;
  name: string;
  birth_date: string;
  birth_time: string;
  birth_city: string;
  birth_country: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  personal_context?: string;
  created_at: string;
}

export interface Product {
  id: string;
  slug: string;
  name_es: string;
  name_en: string;
  name_pt: string;
  description_es: string;
  description_en: string;
  description_pt: string;
  base_price_usd: number;
  prompt_template: string;
  requires_partner_data: boolean;
  active: boolean;
  created_at: string;
  paddle_price_id?: string;
  paddle_price_id_latam?: string;
  paddle_price_id_intl?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  product_id: string;
  birth_data_id: string;
  partner_birth_data_id?: string;
  stripe_payment_intent_id?: string;
  stripe_checkout_session_id?: string;
  paddle_transaction_id?: string;
  paddle_checkout_url?: string;
  amount: number;
  currency: string;
  country_code?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
  completed_at?: string;
}

export interface Report {
  id: string;
  transaction_id: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  ai_response?: string;
  pdf_url?: string;
  error_message?: string;
  created_at: string;
  generated_at?: string;
  sent_at?: string;
}
