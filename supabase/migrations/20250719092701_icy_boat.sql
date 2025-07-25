/*
  # Enhanced Loyalty System with Referrals and Daily Rewards

  1. New Tables
    - `user_daily_rewards`
      - `user_id` (uuid, references auth.users)
      - `last_claim_date` (date)
      - `current_streak` (integer)
      - `total_claims` (integer)
    
    - `user_referrals`
      - `id` (uuid, primary key)
      - `referrer_id` (uuid, references auth.users)
      - `referred_id` (uuid, references auth.users)
      - `referral_code` (text)
      - `status` (text) - 'pending', 'completed', 'rewarded'
      - `points_awarded` (integer)
      - `created_at` (timestamp)

    - `referral_codes`
      - `user_id` (uuid, references auth.users)
      - `code` (text, unique)
      - `created_at` (timestamp)
      - `is_active` (boolean)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create user_daily_rewards table
CREATE TABLE IF NOT EXISTS user_daily_rewards (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_claim_date date,
  current_streak integer DEFAULT 0 NOT NULL,
  total_claims integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create referral_codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  is_active boolean DEFAULT true NOT NULL
);

-- Create user_referrals table
CREATE TABLE IF NOT EXISTS user_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referred_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'rewarded')),
  points_awarded integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz
);

-- Enable RLS
ALTER TABLE user_daily_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_referrals ENABLE ROW LEVEL SECURITY;

-- Policies for user_daily_rewards
CREATE POLICY "Users can view their own daily rewards"
  ON user_daily_rewards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily rewards"
  ON user_daily_rewards
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily rewards"
  ON user_daily_rewards
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for referral_codes
CREATE POLICY "Users can view their own referral code"
  ON referral_codes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referral code"
  ON referral_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view active referral codes for validation"
  ON referral_codes
  FOR SELECT
  TO public
  USING (is_active = true);

-- Policies for user_referrals
CREATE POLICY "Users can view referrals they made or received"
  ON user_referrals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can insert referrals"
  ON user_referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update referrals they made"
  ON user_referrals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = referrer_id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(user_email text)
RETURNS text AS $$
DECLARE
  base_code text;
  final_code text;
  counter integer := 0;
BEGIN
  -- Extract first part of email and add year
  base_code := UPPER(SUBSTRING(user_email FROM 1 FOR 4)) || '2025';
  final_code := base_code;
  
  -- Check if code exists and increment if needed
  WHILE EXISTS (SELECT 1 FROM referral_codes WHERE code = final_code) LOOP
    counter := counter + 1;
    final_code := base_code || counter::text;
  END LOOP;
  
  RETURN final_code;
END;
$$ LANGUAGE plpgsql;

-- Function to handle daily reward claims
CREATE OR REPLACE FUNCTION claim_daily_reward(claiming_user_id uuid)
RETURNS json AS $$
DECLARE
  user_record user_daily_rewards%ROWTYPE;
  base_reward integer := 50;
  streak_bonus integer;
  total_reward integer;
  today_date date := CURRENT_DATE;
BEGIN
  -- Get or create user daily rewards record
  SELECT * INTO user_record FROM user_daily_rewards WHERE user_id = claiming_user_id;
  
  IF NOT FOUND THEN
    -- First time claiming
    INSERT INTO user_daily_rewards (user_id, last_claim_date, current_streak, total_claims)
    VALUES (claiming_user_id, today_date, 1, 1);
    
    total_reward := base_reward;
  ELSE
    -- Check if already claimed today
    IF user_record.last_claim_date = today_date THEN
      RETURN json_build_object('success', false, 'message', 'Already claimed today');
    END IF;
    
    -- Check if streak continues (claimed yesterday)
    IF user_record.last_claim_date = today_date - INTERVAL '1 day' THEN
      -- Continue streak
      user_record.current_streak := user_record.current_streak + 1;
    ELSE
      -- Reset streak
      user_record.current_streak := 1;
    END IF;
    
    -- Calculate reward with streak bonus (max 50 bonus points)
    streak_bonus := LEAST(user_record.current_streak * 5, 50);
    total_reward := base_reward + streak_bonus;
    
    -- Update record
    UPDATE user_daily_rewards 
    SET last_claim_date = today_date,
        current_streak = user_record.current_streak,
        total_claims = total_claims + 1
    WHERE user_id = claiming_user_id;
  END IF;
  
  -- Add points to user loyalty points
  INSERT INTO user_loyalty_points (user_id, total_points)
  VALUES (claiming_user_id, total_reward)
  ON CONFLICT (user_id)
  DO UPDATE SET total_points = user_loyalty_points.total_points + total_reward;
  
  -- Record transaction
  INSERT INTO loyalty_transactions (user_id, transaction_type, points, description)
  VALUES (claiming_user_id, 'earned', total_reward, 'Daily login reward');
  
  RETURN json_build_object(
    'success', true, 
    'points_earned', total_reward,
    'streak', user_record.current_streak,
    'base_reward', base_reward,
    'streak_bonus', COALESCE(streak_bonus, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process referral
CREATE OR REPLACE FUNCTION process_referral(referral_code_input text, new_user_id uuid)
RETURNS json AS $$
DECLARE
  referrer_user_id uuid;
  referral_points integer := 500;
BEGIN
  -- Find the referrer
  SELECT user_id INTO referrer_user_id 
  FROM referral_codes 
  WHERE code = referral_code_input AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Invalid referral code');
  END IF;
  
  -- Check if user is trying to refer themselves
  IF referrer_user_id = new_user_id THEN
    RETURN json_build_object('success', false, 'message', 'Cannot refer yourself');
  END IF;
  
  -- Check if this user was already referred
  IF EXISTS (SELECT 1 FROM user_referrals WHERE referred_id = new_user_id) THEN
    RETURN json_build_object('success', false, 'message', 'User already referred');
  END IF;
  
  -- Create referral record
  INSERT INTO user_referrals (referrer_id, referred_id, referral_code, status, points_awarded)
  VALUES (referrer_user_id, new_user_id, referral_code_input, 'completed', referral_points);
  
  -- Award points to referrer
  INSERT INTO user_loyalty_points (user_id, total_points)
  VALUES (referrer_user_id, referral_points)
  ON CONFLICT (user_id)
  DO UPDATE SET total_points = user_loyalty_points.total_points + referral_points;
  
  -- Record transaction
  INSERT INTO loyalty_transactions (user_id, transaction_type, points, description, reference_id)
  VALUES (referrer_user_id, 'earned', referral_points, 'Friend referral bonus', new_user_id::text);
  
  RETURN json_build_object(
    'success', true,
    'points_awarded', referral_points,
    'referrer_id', referrer_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;