/*
  # Smart Voucher Recommendations System

  1. New Tables
    - `smart_voucher_recommendations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `voucher_data` (jsonb) - stores voucher details
      - `recommendation_score` (integer)
      - `recommendation_reason` (text)
      - `confidence_level` (text)
      - `based_on_interactions` (jsonb) - stores interaction IDs used for recommendation
      - `created_at` (timestamp)
      - `expires_at` (timestamp)
      - `is_active` (boolean)

    - `user_behavior_patterns`
      - `user_id` (uuid, references auth.users)
      - `category_preferences` (jsonb)
      - `item_preferences` (jsonb)
      - `time_patterns` (jsonb)
      - `engagement_level` (text)
      - `last_analyzed` (timestamp)
      - `total_interactions` (integer)

    - `voucher_performance_metrics`
      - `voucher_id` (text)
      - `total_views` (integer)
      - `total_redemptions` (integer)
      - `conversion_rate` (decimal)
      - `user_satisfaction_score` (decimal)
      - `last_updated` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create smart_voucher_recommendations table
CREATE TABLE IF NOT EXISTS smart_voucher_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  voucher_data jsonb NOT NULL,
  recommendation_score integer NOT NULL DEFAULT 0,
  recommendation_reason text NOT NULL,
  confidence_level text NOT NULL CHECK (confidence_level IN ('high', 'medium', 'low')),
  based_on_interactions jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz DEFAULT (now() + INTERVAL '7 days') NOT NULL,
  is_active boolean DEFAULT true NOT NULL
);

-- Create user_behavior_patterns table
CREATE TABLE IF NOT EXISTS user_behavior_patterns (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  category_preferences jsonb DEFAULT '{}' NOT NULL,
  item_preferences jsonb DEFAULT '{}' NOT NULL,
  time_patterns jsonb DEFAULT '{}' NOT NULL,
  engagement_level text DEFAULT 'low' NOT NULL CHECK (engagement_level IN ('high', 'medium', 'low')),
  last_analyzed timestamptz DEFAULT now() NOT NULL,
  total_interactions integer DEFAULT 0 NOT NULL
);

-- Create voucher_performance_metrics table
CREATE TABLE IF NOT EXISTS voucher_performance_metrics (
  voucher_id text PRIMARY KEY,
  total_views integer DEFAULT 0 NOT NULL,
  total_redemptions integer DEFAULT 0 NOT NULL,
  conversion_rate decimal(5,4) DEFAULT 0.0000 NOT NULL,
  user_satisfaction_score decimal(3,2) DEFAULT 0.00 NOT NULL,
  last_updated timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE smart_voucher_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for smart_voucher_recommendations
CREATE POLICY "Users can view their own recommendations"
  ON smart_voucher_recommendations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert recommendations"
  ON smart_voucher_recommendations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own recommendations"
  ON smart_voucher_recommendations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for user_behavior_patterns
CREATE POLICY "Users can view their own behavior patterns"
  ON user_behavior_patterns
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage behavior patterns"
  ON user_behavior_patterns
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for voucher_performance_metrics (public read for analytics)
CREATE POLICY "Anyone can view voucher metrics"
  ON voucher_performance_metrics
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "System can update voucher metrics"
  ON voucher_performance_metrics
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to analyze user behavior and generate recommendations
CREATE OR REPLACE FUNCTION analyze_user_behavior_and_recommend(target_user_id uuid)
RETURNS json AS $$
DECLARE
  user_interactions RECORD;
  behavior_analysis jsonb;
  recommendations jsonb[];
  recommendation_record jsonb;
BEGIN
  -- Get user interactions from last 30 days
  SELECT 
    json_agg(
      json_build_object(
        'category_id', category_id,
        'category_name', category_name,
        'clicked_item_name', clicked_item_name,
        'clicked_at', clicked_at
      )
    ) as interactions
  INTO user_interactions
  FROM user_interactions 
  WHERE (user_id = target_user_id OR user_id IS NULL)
    AND clicked_at > now() - INTERVAL '30 days'
    AND clicked_item_name IS NOT NULL
  ORDER BY clicked_at DESC
  LIMIT 100;

  -- Analyze behavior patterns
  behavior_analysis := json_build_object(
    'mobile_interest', (
      SELECT COUNT(*) FROM user_interactions 
      WHERE (user_id = target_user_id OR user_id IS NULL)
        AND (category_id = 'mobile' OR clicked_item_name ILIKE '%iphone%' OR clicked_item_name ILIKE '%samsung%')
        AND clicked_at > now() - INTERVAL '30 days'
    ),
    'accessories_interest', (
      SELECT COUNT(*) FROM user_interactions 
      WHERE (user_id = target_user_id OR user_id IS NULL)
        AND (category_id = 'accessories' OR clicked_item_name ILIKE '%headphone%' OR clicked_item_name ILIKE '%case%')
        AND clicked_at > now() - INTERVAL '30 days'
    ),
    'entertainment_interest', (
      SELECT COUNT(*) FROM user_interactions 
      WHERE (user_id = target_user_id OR user_id IS NULL)
        AND (category_id = 'tv' OR clicked_item_name ILIKE '%netflix%' OR clicked_item_name ILIKE '%disney%')
        AND clicked_at > now() - INTERVAL '30 days'
    ),
    'broadband_interest', (
      SELECT COUNT(*) FROM user_interactions 
      WHERE (user_id = target_user_id OR user_id IS NULL)
        AND (category_id = 'broadband' OR clicked_item_name ILIKE '%wifi%' OR clicked_item_name ILIKE '%internet%')
        AND clicked_at > now() - INTERVAL '30 days'
    )
  );

  -- Generate recommendations based on behavior
  recommendations := ARRAY[]::jsonb[];

  -- Mobile accessories recommendation
  IF (behavior_analysis->>'mobile_interest')::int > 2 THEN
    recommendation_record := json_build_object(
      'id', 'mobile-acc-' || extract(epoch from now())::text,
      'title', 'Premium Mobile Accessories Bundle',
      'description', 'Wireless charger + Premium case + Screen protector based on your mobile interests',
      'points_cost', 800,
      'value', '$120 Value',
      'category', 'Accessories',
      'recommendation_score', (behavior_analysis->>'mobile_interest')::int * 25,
      'recommendation_reason', 'You''ve shown strong interest in mobile devices (' || (behavior_analysis->>'mobile_interest') || ' clicks)',
      'confidence_level', CASE WHEN (behavior_analysis->>'mobile_interest')::int > 5 THEN 'high' ELSE 'medium' END
    );
    recommendations := recommendations || recommendation_record;
  END IF;

  -- Entertainment bundle recommendation
  IF (behavior_analysis->>'entertainment_interest')::int > 1 THEN
    recommendation_record := json_build_object(
      'id', 'entertainment-' || extract(epoch from now())::text,
      'title', 'Streaming Entertainment Bundle',
      'description', 'Netflix Premium + Disney+ + HBO Max for 6 months',
      'points_cost', 1500,
      'value', '$150 Value',
      'category', 'Entertainment',
      'recommendation_score', (behavior_analysis->>'entertainment_interest')::int * 30,
      'recommendation_reason', 'Perfect for your entertainment preferences',
      'confidence_level', 'high'
    );
    recommendations := recommendations || recommendation_record;
  END IF;

  -- Broadband upgrade recommendation
  IF (behavior_analysis->>'broadband_interest')::int > 1 THEN
    recommendation_record := json_build_object(
      'id', 'broadband-' || extract(epoch from now())::text,
      'title', 'Home Network Upgrade Package',
      'description', 'Mesh WiFi system + Speed boost + Priority support',
      'points_cost', 1200,
      'value', '$200 Value',
      'category', 'Broadband',
      'recommendation_score', (behavior_analysis->>'broadband_interest')::int * 20,
      'recommendation_reason', 'Enhance your home connectivity experience',
      'confidence_level', 'medium'
    );
    recommendations := recommendations || recommendation_record;
  END IF;

  -- Audio accessories for accessory enthusiasts
  IF (behavior_analysis->>'accessories_interest')::int > 2 THEN
    recommendation_record := json_build_object(
      'id', 'audio-' || extract(epoch from now())::text,
      'title', 'Premium Audio Experience',
      'description', 'Sony WH-1000XM5 headphones + Portable speaker combo',
      'points_cost', 1800,
      'value', '$300 Value',
      'category', 'Accessories',
      'recommendation_score', (behavior_analysis->>'accessories_interest')::int * 35,
      'recommendation_reason', 'Curated for audio enthusiasts like you',
      'confidence_level', 'high'
    );
    recommendations := recommendations || recommendation_record;
  END IF;

  -- Update user behavior patterns
  INSERT INTO user_behavior_patterns (
    user_id,
    category_preferences,
    item_preferences,
    engagement_level,
    total_interactions
  )
  VALUES (
    target_user_id,
    behavior_analysis,
    '{}',
    CASE 
      WHEN (behavior_analysis->>'mobile_interest')::int + 
           (behavior_analysis->>'accessories_interest')::int + 
           (behavior_analysis->>'entertainment_interest')::int + 
           (behavior_analysis->>'broadband_interest')::int > 10 THEN 'high'
      WHEN (behavior_analysis->>'mobile_interest')::int + 
           (behavior_analysis->>'accessories_interest')::int + 
           (behavior_analysis->>'entertainment_interest')::int + 
           (behavior_analysis->>'broadband_interest')::int > 5 THEN 'medium'
      ELSE 'low'
    END,
    (behavior_analysis->>'mobile_interest')::int + 
    (behavior_analysis->>'accessories_interest')::int + 
    (behavior_analysis->>'entertainment_interest')::int + 
    (behavior_analysis->>'broadband_interest')::int
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    category_preferences = behavior_analysis,
    last_analyzed = now(),
    total_interactions = EXCLUDED.total_interactions,
    engagement_level = EXCLUDED.engagement_level;

  -- Clear old recommendations
  DELETE FROM smart_voucher_recommendations 
  WHERE user_id = target_user_id AND created_at < now() - INTERVAL '7 days';

  -- Insert new recommendations
  FOR i IN 1..array_length(recommendations, 1) LOOP
    INSERT INTO smart_voucher_recommendations (
      user_id,
      voucher_data,
      recommendation_score,
      recommendation_reason,
      confidence_level,
      based_on_interactions
    )
    VALUES (
      target_user_id,
      recommendations[i],
      (recommendations[i]->>'recommendation_score')::int,
      recommendations[i]->>'recommendation_reason',
      recommendations[i]->>'confidence_level',
      user_interactions.interactions
    );
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'recommendations_generated', array_length(recommendations, 1),
    'behavior_analysis', behavior_analysis,
    'recommendations', recommendations
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track voucher interactions
CREATE OR REPLACE FUNCTION track_voucher_interaction(
  voucher_id_input text,
  interaction_type text, -- 'view', 'redeem', 'click'
  user_id_input uuid DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Update or insert voucher metrics
  INSERT INTO voucher_performance_metrics (voucher_id, total_views, total_redemptions)
  VALUES (
    voucher_id_input,
    CASE WHEN interaction_type = 'view' THEN 1 ELSE 0 END,
    CASE WHEN interaction_type = 'redeem' THEN 1 ELSE 0 END
  )
  ON CONFLICT (voucher_id)
  DO UPDATE SET
    total_views = voucher_performance_metrics.total_views + 
      CASE WHEN interaction_type = 'view' THEN 1 ELSE 0 END,
    total_redemptions = voucher_performance_metrics.total_redemptions + 
      CASE WHEN interaction_type = 'redeem' THEN 1 ELSE 0 END,
    conversion_rate = CASE 
      WHEN voucher_performance_metrics.total_views + 
           CASE WHEN interaction_type = 'view' THEN 1 ELSE 0 END > 0 
      THEN (voucher_performance_metrics.total_redemptions + 
            CASE WHEN interaction_type = 'redeem' THEN 1 ELSE 0 END)::decimal / 
           (voucher_performance_metrics.total_views + 
            CASE WHEN interaction_type = 'view' THEN 1 ELSE 0 END)::decimal
      ELSE 0.0000
    END,
    last_updated = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_smart_recommendations_user_active ON smart_voucher_recommendations(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_smart_recommendations_score ON smart_voucher_recommendations(recommendation_score DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_patterns_engagement ON user_behavior_patterns(engagement_level, last_analyzed);
CREATE INDEX IF NOT EXISTS idx_voucher_metrics_conversion ON voucher_performance_metrics(conversion_rate DESC);