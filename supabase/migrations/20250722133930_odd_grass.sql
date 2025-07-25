/*
  # First Purchase Bonus and Referral System

  1. New Tables
    - `first_purchase_tracking`
      - `user_id` (uuid, references auth.users)
      - `has_made_first_purchase` (boolean)
      - `first_purchase_date` (timestamp)
      - `bonus_awarded` (boolean)
      - `created_at` (timestamp)

    - `app_referrals`
      - `id` (uuid, primary key)
      - `referrer_id` (uuid, references auth.users)
      - `referred_user_email` (text)
      - `referral_code` (text)
      - `download_confirmed` (boolean)
      - `points_awarded` (integer)
      - `created_at` (timestamp)

  2. Functions
    - Function to award first purchase bonus
    - Function to process app referrals

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create first_purchase_tracking table
CREATE TABLE IF NOT EXISTS first_purchase_tracking (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  has_made_first_purchase boolean DEFAULT false NOT NULL,
  first_purchase_date timestamptz,
  bonus_awarded boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create app_referrals table
CREATE TABLE IF NOT EXISTS app_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referred_user_email text NOT NULL,
  referral_code text NOT NULL,
  download_confirmed boolean DEFAULT false NOT NULL,
  points_awarded integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  confirmed_at timestamptz
);

-- Enable RLS
ALTER TABLE first_purchase_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_referrals ENABLE ROW LEVEL SECURITY;

-- Policies for first_purchase_tracking
CREATE POLICY "Users can view their own purchase tracking"
  ON first_purchase_tracking
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchase tracking"
  ON first_purchase_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase tracking"
  ON first_purchase_tracking
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for app_referrals
CREATE POLICY "Users can view their own referrals"
  ON app_referrals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can insert their own referrals"
  ON app_referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Users can update their own referrals"
  ON app_referrals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = referrer_id);

-- Function to award first purchase bonus
CREATE OR REPLACE FUNCTION award_first_purchase_bonus(purchasing_user_id uuid)
RETURNS json AS $$
DECLARE
  bonus_points integer := 500;
  already_awarded boolean;
BEGIN
  -- Check if user has already received the bonus
  SELECT bonus_awarded INTO already_awarded
  FROM first_purchase_tracking
  WHERE user_id = purchasing_user_id;

  -- If no record exists or bonus not awarded yet
  IF already_awarded IS NULL OR already_awarded = false THEN
    -- Create or update tracking record
    INSERT INTO first_purchase_tracking (
      user_id,
      has_made_first_purchase,
      first_purchase_date,
      bonus_awarded
    )
    VALUES (
      purchasing_user_id,
      true,
      now(),
      true
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      has_made_first_purchase = true,
      first_purchase_date = COALESCE(first_purchase_tracking.first_purchase_date, now()),
      bonus_awarded = true;

    -- Award bonus points
    INSERT INTO user_loyalty_points (user_id, total_points)
    VALUES (purchasing_user_id, bonus_points)
    ON CONFLICT (user_id)
    DO UPDATE SET total_points = user_loyalty_points.total_points + bonus_points;

    -- Record transaction
    INSERT INTO loyalty_transactions (user_id, transaction_type, points, description)
    VALUES (
      purchasing_user_id,
      'earned',
      bonus_points,
      'First purchase bonus - Welcome to Singtel!'
    );

    RETURN json_build_object(
      'success', true,
      'bonus_awarded', bonus_points,
      'message', 'Congratulations! You earned 500 bonus points for your first purchase!'
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'message', 'First purchase bonus already awarded'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process app referral
CREATE OR REPLACE FUNCTION process_app_referral(
  referrer_user_id uuid,
  referred_email text,
  referral_code_input text
)
RETURNS json AS $$
DECLARE
  referral_points integer := 500;
  existing_referral_id uuid;
BEGIN
  -- Check if this email was already referred by this user
  SELECT id INTO existing_referral_id
  FROM app_referrals
  WHERE referrer_id = referrer_user_id 
    AND referred_user_email = referred_email;

  IF existing_referral_id IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'This email has already been referred by you'
    );
  END IF;

  -- Create referral record
  INSERT INTO app_referrals (
    referrer_id,
    referred_user_email,
    referral_code,
    download_confirmed,
    points_awarded
  )
  VALUES (
    referrer_user_id,
    referred_email,
    referral_code_input,
    true, -- Assume download is confirmed for demo
    referral_points
  );

  -- Award points to referrer
  INSERT INTO user_loyalty_points (user_id, total_points)
  VALUES (referrer_user_id, referral_points)
  ON CONFLICT (user_id)
  DO UPDATE SET total_points = user_loyalty_points.total_points + referral_points;

  -- Record transaction
  INSERT INTO loyalty_transactions (user_id, transaction_type, points, description, reference_id)
  VALUES (
    referrer_user_id,
    'earned',
    referral_points,
    'App referral bonus - Friend downloaded Singtel app',
    referred_email
  );

  RETURN json_build_object(
    'success', true,
    'points_awarded', referral_points,
    'message', 'Great! You earned 500 points for referring a friend!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to simulate first purchase (for testing)
CREATE OR REPLACE FUNCTION simulate_first_purchase(user_id_input uuid)
RETURNS json AS $$
BEGIN
  RETURN award_first_purchase_bonus(user_id_input);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_first_purchase_tracking_user ON first_purchase_tracking(user_id, bonus_awarded);
CREATE INDEX IF NOT EXISTS idx_app_referrals_referrer ON app_referrals(referrer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_app_referrals_email ON app_referrals(referred_user_email);