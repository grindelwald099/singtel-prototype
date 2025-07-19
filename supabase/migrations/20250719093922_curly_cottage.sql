/*
  # Premium Loyalty System with Subscriptions and Points Boosters

  1. New Tables
    - `premium_subscriptions`
      - `user_id` (uuid, references auth.users)
      - `tier_name` (text) - 'Gold+', etc.
      - `monthly_fee` (decimal)
      - `started_at` (timestamp)
      - `expires_at` (timestamp)
      - `status` (text) - 'active', 'cancelled', 'expired'
      - `auto_renew` (boolean)
    
    - `points_purchases`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `points_purchased` (integer)
      - `bonus_points` (integer)
      - `amount_paid` (decimal)
      - `payment_method` (text)
      - `transaction_id` (text)
      - `created_at` (timestamp)

    - `exclusive_vouchers`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `points_cost` (integer)
      - `value` (text)
      - `category` (text)
      - `required_tier` (text) - 'Gold+', 'Platinum', etc.
      - `is_active` (boolean)
      - `created_at` (timestamp)

  2. Enhanced Tables
    - Update `user_loyalty_points` to include premium multipliers
    - Add premium tier tracking

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create premium_subscriptions table
CREATE TABLE IF NOT EXISTS premium_subscriptions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_name text NOT NULL,
  monthly_fee decimal(10,2) NOT NULL,
  started_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz NOT NULL,
  status text DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
  auto_renew boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create points_purchases table
CREATE TABLE IF NOT EXISTS points_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  points_purchased integer NOT NULL,
  bonus_points integer DEFAULT 0 NOT NULL,
  amount_paid decimal(10,2) NOT NULL,
  payment_method text NOT NULL,
  transaction_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create exclusive_vouchers table
CREATE TABLE IF NOT EXISTS exclusive_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  points_cost integer NOT NULL,
  value text NOT NULL,
  category text NOT NULL,
  required_tier text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Add premium tracking to user_loyalty_points
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_loyalty_points' AND column_name = 'is_premium_member'
  ) THEN
    ALTER TABLE user_loyalty_points ADD COLUMN is_premium_member boolean DEFAULT false NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_loyalty_points' AND column_name = 'premium_tier'
  ) THEN
    ALTER TABLE user_loyalty_points ADD COLUMN premium_tier text;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE exclusive_vouchers ENABLE ROW LEVEL SECURITY;

-- Policies for premium_subscriptions
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

-- Policies for points_purchases
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

-- Policies for exclusive_vouchers (public read for active vouchers)
CREATE POLICY "Anyone can view active exclusive vouchers"
  ON exclusive_vouchers
  FOR SELECT
  TO public
  USING (is_active = true);

-- Function to process points purchase
CREATE OR REPLACE FUNCTION process_points_purchase(
  purchasing_user_id uuid,
  points_amount integer,
  bonus_amount integer,
  paid_amount decimal,
  payment_method_input text,
  transaction_id_input text
)
RETURNS json AS $$
DECLARE
  total_points integer;
BEGIN
  total_points := points_amount + bonus_amount;
  
  -- Record the purchase
  INSERT INTO points_purchases (
    user_id, 
    points_purchased, 
    bonus_points, 
    amount_paid, 
    payment_method, 
    transaction_id
  )
  VALUES (
    purchasing_user_id,
    points_amount,
    bonus_amount,
    paid_amount,
    payment_method_input,
    transaction_id_input
  );
  
  -- Add points to user account
  INSERT INTO user_loyalty_points (user_id, total_points)
  VALUES (purchasing_user_id, total_points)
  ON CONFLICT (user_id)
  DO UPDATE SET total_points = user_loyalty_points.total_points + total_points;
  
  -- Record transaction
  INSERT INTO loyalty_transactions (user_id, transaction_type, points, description, reference_id)
  VALUES (
    purchasing_user_id, 
    'earned', 
    total_points, 
    'Points purchase: ' || points_amount || ' + ' || bonus_amount || ' bonus',
    transaction_id_input
  );
  
  RETURN json_build_object(
    'success', true,
    'points_added', total_points,
    'base_points', points_amount,
    'bonus_points', bonus_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to activate premium subscription
CREATE OR REPLACE FUNCTION activate_premium_subscription(
  subscribing_user_id uuid,
  tier_name_input text,
  monthly_fee_input decimal
)
RETURNS json AS $$
DECLARE
  expires_date timestamptz;
BEGIN
  expires_date := now() + INTERVAL '1 month';
  
  -- Insert or update subscription
  INSERT INTO premium_subscriptions (
    user_id,
    tier_name,
    monthly_fee,
    expires_at
  )
  VALUES (
    subscribing_user_id,
    tier_name_input,
    monthly_fee_input,
    expires_date
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    tier_name = tier_name_input,
    monthly_fee = monthly_fee_input,
    expires_at = expires_date,
    status = 'active',
    auto_renew = true;
  
  -- Update user loyalty points to reflect premium status
  UPDATE user_loyalty_points
  SET 
    is_premium_member = true,
    premium_tier = tier_name_input
  WHERE user_id = subscribing_user_id;
  
  -- Award welcome bonus points for premium upgrade
  INSERT INTO loyalty_transactions (user_id, transaction_type, points, description)
  VALUES (
    subscribing_user_id,
    'earned',
    500,
    'Premium subscription welcome bonus'
  );
  
  -- Add welcome bonus to total points
  UPDATE user_loyalty_points
  SET total_points = total_points + 500
  WHERE user_id = subscribing_user_id;
  
  RETURN json_build_object(
    'success', true,
    'tier', tier_name_input,
    'expires_at', expires_date,
    'welcome_bonus', 500
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and update subscription status
CREATE OR REPLACE FUNCTION check_subscription_status()
RETURNS void AS $$
BEGIN
  -- Mark expired subscriptions
  UPDATE premium_subscriptions
  SET status = 'expired'
  WHERE expires_at < now() AND status = 'active';
  
  -- Update user loyalty points for expired subscriptions
  UPDATE user_loyalty_points
  SET 
    is_premium_member = false,
    premium_tier = null
  WHERE user_id IN (
    SELECT user_id 
    FROM premium_subscriptions 
    WHERE status = 'expired'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample exclusive vouchers
INSERT INTO exclusive_vouchers (title, description, points_cost, value, category, required_tier) VALUES
('Premium Concierge Service', 'Personal shopping assistant for all your tech needs', 2000, '$100 Value', 'Premium Services', 'Gold+'),
('VIP Event Access', 'Exclusive access to Singtel VIP tech events and product launches', 1500, 'Priceless', 'Events', 'Gold+'),
('Priority Support Hotline', '24/7 dedicated premium support line with zero wait time', 1000, '$50 Value', 'Support', 'Gold+'),
('Exclusive Product Preview', 'First access to new products before public release', 2500, '$200 Value', 'Products', 'Platinum');

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_user_status ON premium_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_points_purchases_user_date ON points_purchases(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_exclusive_vouchers_tier_active ON exclusive_vouchers(required_tier, is_active);