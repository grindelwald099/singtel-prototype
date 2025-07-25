/*
  # Create Loyalty System Tables

  1. New Tables
    - `user_loyalty_points`
      - `user_id` (uuid, references auth.users)
      - `total_points` (integer)
      - `current_tier` (text)
      - `points_earned_this_month` (integer)
      - `last_updated` (timestamp)
    
    - `loyalty_transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `transaction_type` (text) - 'earned' or 'redeemed'
      - `points` (integer)
      - `description` (text)
      - `reference_id` (text) - for linking to purchases/redemptions
      - `created_at` (timestamp)

    - `loyalty_vouchers`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `points_cost` (integer)
      - `value` (text)
      - `category` (text)
      - `expiry_date` (date)
      - `is_active` (boolean)
      - `created_at` (timestamp)

    - `user_voucher_redemptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `voucher_id` (uuid, references loyalty_vouchers)
      - `redeemed_at` (timestamp)
      - `used_at` (timestamp)
      - `status` (text) - 'redeemed', 'used', 'expired'

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create user_loyalty_points table
CREATE TABLE IF NOT EXISTS user_loyalty_points (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points integer DEFAULT 0 NOT NULL,
  current_tier text DEFAULT 'Bronze' NOT NULL,
  points_earned_this_month integer DEFAULT 0 NOT NULL,
  last_updated timestamptz DEFAULT now() NOT NULL
);

-- Create loyalty_transactions table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('earned', 'redeemed')),
  points integer NOT NULL,
  description text NOT NULL,
  reference_id text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create loyalty_vouchers table
CREATE TABLE IF NOT EXISTS loyalty_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  points_cost integer NOT NULL,
  value text NOT NULL,
  category text NOT NULL,
  expiry_date date NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create user_voucher_redemptions table
CREATE TABLE IF NOT EXISTS user_voucher_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  voucher_id uuid REFERENCES loyalty_vouchers(id) ON DELETE CASCADE NOT NULL,
  redeemed_at timestamptz DEFAULT now() NOT NULL,
  used_at timestamptz,
  status text DEFAULT 'redeemed' NOT NULL CHECK (status IN ('redeemed', 'used', 'expired'))
);

-- Enable RLS
ALTER TABLE user_loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_voucher_redemptions ENABLE ROW LEVEL SECURITY;

-- Policies for user_loyalty_points
CREATE POLICY "Users can view their own loyalty points"
  ON user_loyalty_points
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own loyalty points"
  ON user_loyalty_points
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own loyalty points"
  ON user_loyalty_points
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for loyalty_transactions
CREATE POLICY "Users can view their own transactions"
  ON loyalty_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON loyalty_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for loyalty_vouchers (public read for active vouchers)
CREATE POLICY "Anyone can view active vouchers"
  ON loyalty_vouchers
  FOR SELECT
  TO public
  USING (is_active = true);

-- Policies for user_voucher_redemptions
CREATE POLICY "Users can view their own redemptions"
  ON user_voucher_redemptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own redemptions"
  ON user_voucher_redemptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own redemptions"
  ON user_voucher_redemptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert sample vouchers
INSERT INTO loyalty_vouchers (title, description, points_cost, value, category, expiry_date) VALUES
('$10 Off Mobile Accessories', 'Valid on any mobile accessory purchase above $30', 500, '$10', 'Mobile', '2025-03-31'),
('20% Off SIM Plan Upgrade', 'Upgrade to any higher tier SIM plan', 800, '20%', 'SIM', '2025-02-28'),
('Free Broadband Installation', 'Waive installation fees for new broadband connections', 1200, '$80', 'Broadband', '2025-04-15'),
('$50 Off Premium Headphones', 'Valid on selected premium audio accessories', 1500, '$50', 'Accessories', '2025-03-15');

-- Function to update user tier based on points
CREATE OR REPLACE FUNCTION update_user_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- Update tier based on total points
  IF NEW.total_points >= 5000 THEN
    NEW.current_tier = 'Platinum';
  ELSIF NEW.total_points >= 2500 THEN
    NEW.current_tier = 'Gold';
  ELSIF NEW.total_points >= 1000 THEN
    NEW.current_tier = 'Silver';
  ELSE
    NEW.current_tier = 'Bronze';
  END IF;
  
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update tier when points change
CREATE TRIGGER update_tier_trigger
  BEFORE UPDATE OF total_points ON user_loyalty_points
  FOR EACH ROW
  EXECUTE FUNCTION update_user_tier();