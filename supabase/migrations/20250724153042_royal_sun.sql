/*
  # Add Premium and High-Value Vouchers

  1. New Tables
    - `exclusive_vouchers` - Premium vouchers requiring Platinum subscription
    - `premium_subscriptions` - Track user premium subscriptions
    - `points_purchases` - Track point purchases

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users

  3. Data
    - Add exclusive Platinum vouchers
    - Add high-value 2,700 point vouchers
    - Add premium subscription tiers
*/

-- Create premium subscriptions table
CREATE TABLE IF NOT EXISTS premium_subscriptions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_name text NOT NULL,
  monthly_fee numeric(10,2) NOT NULL,
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  auto_renew boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
  ON premium_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
  ON premium_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON premium_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create exclusive vouchers table
CREATE TABLE IF NOT EXISTS exclusive_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  points_cost integer NOT NULL,
  value text NOT NULL,
  category text NOT NULL,
  required_tier text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE exclusive_vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active exclusive vouchers"
  ON exclusive_vouchers
  FOR SELECT
  TO public
  USING (is_active = true);

-- Create points purchases table
CREATE TABLE IF NOT EXISTS points_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_purchased integer NOT NULL,
  bonus_points integer DEFAULT 0,
  amount_paid numeric(10,2) NOT NULL,
  payment_method text NOT NULL,
  transaction_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE points_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own purchases"
  ON points_purchases
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases"
  ON points_purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_user_status ON premium_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_exclusive_vouchers_tier_active ON exclusive_vouchers(required_tier, is_active);
CREATE INDEX IF NOT EXISTS idx_points_purchases_user_date ON points_purchases(user_id, created_at);

-- Insert exclusive Platinum vouchers
INSERT INTO exclusive_vouchers (title, description, points_cost, value, category, required_tier) VALUES
('🏆 Platinum VIP Experience Package', 'Private shopping session + Personal tech consultant + Premium device setup service', 0, '$500 Value', 'VIP Services', 'Platinum'),
('💎 Ultimate Tech Bundle', 'MacBook Pro + iPhone 15 Pro + AirPods Pro + Apple Watch Ultra + Premium accessories', 0, '$3,500 Value', 'Premium Tech', 'Platinum'),
('🎬 Lifetime Entertainment Suite', 'Netflix + Disney+ + HBO Max + Apple TV+ + Spotify + YouTube Premium for LIFE', 0, '$2,000 Value', 'Entertainment', 'Platinum'),
('🛡️ Enterprise Security Package', 'McAfee Total Protection + VPN + Identity Monitoring + Cyber Insurance for 5 years', 0, '$800 Value', 'Security', 'Platinum'),
('🏠 Smart Home Transformation', 'Complete smart home setup: Lights + Security + Automation + Professional installation', 0, '$1,200 Value', 'Smart Home', 'Platinum'),
('🎮 Gaming Master Setup', 'Gaming PC + 4K Monitor + Premium peripherals + Gaming chair + Setup service', 0, '$4,000 Value', 'Gaming', 'Platinum'),
('✈️ Global Roaming Unlimited', 'Unlimited data roaming in 150+ countries for 2 years + Priority network access', 0, '$1,500 Value', 'Travel', 'Platinum'),
('🎵 Professional Audio Studio', 'Professional recording equipment + Studio monitors + Audio interface + Training', 0, '$2,500 Value', 'Audio Pro', 'Platinum');

-- Insert high-value 2,700 point vouchers
INSERT INTO accessory_vouchers (title, description, discount_percentage, category, subcategory, keywords, points_cost, value, expiry_date) VALUES
('🎧 Audiophile Master Collection', 'Sony WH-1000XM5 + Sennheiser HD800S + Audio-Technica ATH-M50x + Premium DAC/Amp', 25, 'Audio', 'Premium Headphones', ARRAY['headphones', 'audiophile', 'premium', 'sony', 'sennheiser', 'audio-technica', 'dac', 'amp'], 2700, '$1,200 Value', '2025-06-30'),
('📱 Ultimate Mobile Ecosystem', 'iPhone 15 Pro Max + MagSafe accessories + Premium case + Wireless chargers + Car kit', 30, 'Mobile', 'iPhone Bundle', ARRAY['iphone', 'magsafe', 'wireless', 'charger', 'case', 'car', 'premium', 'ecosystem'], 2700, '$1,500 Value', '2025-05-31'),
('🎮 Pro Gaming Arsenal', 'Gaming laptop + Mechanical keyboard + Gaming mouse + Headset + Monitor + Chair', 20, 'Gaming', 'Complete Setup', ARRAY['gaming', 'laptop', 'keyboard', 'mouse', 'headset', 'monitor', 'chair', 'setup'], 2700, '$2,000 Value', '2025-07-15'),
('💻 Productivity Powerhouse', 'MacBook Pro + External monitor + Dock + Keyboard + Mouse + Webcam + Software bundle', 25, 'Computer', 'Workstation', ARRAY['macbook', 'monitor', 'dock', 'keyboard', 'mouse', 'webcam', 'productivity', 'workstation'], 2700, '$1,800 Value', '2025-04-30'),
('🏠 Smart Home Premium Package', 'Smart displays + Security cameras + Smart locks + Lighting + Automation hub + Installation', 35, 'Smart Home', 'Complete System', ARRAY['smart', 'home', 'security', 'camera', 'lock', 'lighting', 'automation', 'installation'], 2700, '$1,600 Value', '2025-08-31'),
('🎬 Content Creator Studio', 'Professional camera + Lighting kit + Microphone + Editing software + Storage + Training', 30, 'Content Creation', 'Studio Setup', ARRAY['camera', 'lighting', 'microphone', 'editing', 'content', 'creator', 'studio', 'professional'], 2700, '$2,200 Value', '2025-06-15');

-- Update user loyalty points to include premium tier tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_loyalty_points' AND column_name = 'is_premium_member'
  ) THEN
    ALTER TABLE user_loyalty_points ADD COLUMN is_premium_member boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_loyalty_points' AND column_name = 'premium_tier'
  ) THEN
    ALTER TABLE user_loyalty_points ADD COLUMN premium_tier text;
  END IF;
END $$;