/*
  # Search Tracking and Voucher Recommendations System

  1. New Tables
    - `user_searches`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `search_query` (text)
      - `search_category` (text)
      - `search_type` (text) - 'accessory', 'mobile', 'plan', etc.
      - `created_at` (timestamp)

    - `accessory_vouchers`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `discount_percentage` (integer)
      - `discount_amount` (decimal)
      - `category` (text)
      - `subcategory` (text)
      - `keywords` (text[]) - for matching searches
      - `points_cost` (integer)
      - `value` (text)
      - `expiry_date` (date)
      - `is_active` (boolean)
      - `created_at` (timestamp)

    - `user_voucher_views`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `voucher_id` (uuid, references accessory_vouchers)
      - `search_query` (text)
      - `viewed_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (for search functionality)
*/

-- Create user_searches table
CREATE TABLE IF NOT EXISTS user_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  search_query text NOT NULL,
  search_category text,
  search_type text DEFAULT 'general' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create accessory_vouchers table
CREATE TABLE IF NOT EXISTS accessory_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  discount_percentage integer,
  discount_amount decimal(10,2),
  category text NOT NULL,
  subcategory text,
  keywords text[] NOT NULL,
  points_cost integer NOT NULL,
  value text NOT NULL,
  expiry_date date NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create user_voucher_views table
CREATE TABLE IF NOT EXISTS user_voucher_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  voucher_id uuid REFERENCES accessory_vouchers(id) ON DELETE CASCADE NOT NULL,
  search_query text,
  viewed_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE user_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessory_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_voucher_views ENABLE ROW LEVEL SECURITY;

-- Policies for user_searches
CREATE POLICY "Allow public insert on user_searches"
  ON user_searches
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public select on user_searches"
  ON user_searches
  FOR SELECT
  TO public
  USING (true);

-- Policies for accessory_vouchers (public read for active vouchers)
CREATE POLICY "Anyone can view active accessory vouchers"
  ON accessory_vouchers
  FOR SELECT
  TO public
  USING (is_active = true);

-- Policies for user_voucher_views
CREATE POLICY "Allow public insert on user_voucher_views"
  ON user_voucher_views
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public select on user_voucher_views"
  ON user_voucher_views
  FOR SELECT
  TO public
  USING (true);

-- Insert dummy accessory vouchers with comprehensive keywords
INSERT INTO accessory_vouchers (title, description, discount_percentage, discount_amount, category, subcategory, keywords, points_cost, value, expiry_date) VALUES

-- Audio Accessories
('Premium Headphones 25% Off', 'Get 25% off on all premium headphones including Sony, Bose, and Apple AirPods', 25, NULL, 'Audio', 'Headphones', ARRAY['headphones', 'headphone', 'earphones', 'earphone', 'airpods', 'sony', 'bose', 'audio', 'wireless', 'bluetooth'], 800, '25% Off', '2025-04-30'),

('Wireless Earbuds Bundle Deal', 'Buy any wireless earbuds and get a free charging case + cable', NULL, 50.00, 'Audio', 'Earbuds', ARRAY['earbuds', 'wireless earbuds', 'airpods', 'galaxy buds', 'true wireless', 'tws'], 600, '$50 Value', '2025-03-31'),

('Audio Accessories Mega Sale', 'Up to 40% off on speakers, headphones, and audio cables', 40, NULL, 'Audio', 'General', ARRAY['speaker', 'speakers', 'audio cable', 'aux cable', '3.5mm', 'bluetooth speaker', 'portable speaker'], 500, '40% Off', '2025-05-15'),

-- Mobile Accessories
('Phone Case Protection Bundle', '30% off premium phone cases + free screen protector', 30, NULL, 'Mobile', 'Cases', ARRAY['phone case', 'case', 'cover', 'protection', 'screen protector', 'tempered glass', 'iphone case', 'samsung case'], 400, '30% Off', '2025-03-15'),

('Charging Accessories Deal', 'Buy 2 chargers get 1 free + 20% off power banks', 20, NULL, 'Mobile', 'Charging', ARRAY['charger', 'charging cable', 'usb cable', 'lightning cable', 'usb-c', 'power bank', 'portable charger', 'wireless charger', 'magsafe'], 350, '20% Off + BOGO', '2025-04-01'),

('Mobile Stand & Mount Sale', '35% off all phone stands, car mounts, and desk accessories', 35, NULL, 'Mobile', 'Mounts', ARRAY['phone stand', 'car mount', 'desk stand', 'holder', 'grip', 'ring holder', 'magnetic mount'], 300, '35% Off', '2025-03-20'),

-- Gaming Accessories
('Gaming Gear Bonanza', 'Special discount on gaming headsets, controllers, and accessories', 30, NULL, 'Gaming', 'General', ARRAY['gaming headset', 'controller', 'gaming mouse', 'gaming keyboard', 'joystick', 'gamepad'], 700, '30% Off', '2025-04-10'),

('Mobile Gaming Bundle', 'Gaming triggers + cooling fan + screen protector combo deal', NULL, 80.00, 'Gaming', 'Mobile Gaming', ARRAY['gaming trigger', 'mobile gaming', 'cooling fan', 'game controller', 'mobile gamepad'], 900, '$80 Value', '2025-03-25'),

-- Smart Home Accessories
('Smart Home Starter Pack', 'Smart plugs, lights, and sensors bundle with setup service', NULL, 120.00, 'Smart Home', 'Automation', ARRAY['smart plug', 'smart light', 'smart bulb', 'sensor', 'smart switch', 'home automation', 'iot'], 1200, '$120 Value', '2025-05-01'),

('Security Camera Bundle', '25% off security cameras + free cloud storage for 6 months', 25, NULL, 'Smart Home', 'Security', ARRAY['security camera', 'webcam', 'surveillance', 'cctv', 'ip camera', 'doorbell camera'], 1000, '25% Off + 6mo Free', '2025-04-20'),

-- Computer Accessories
('Laptop Accessories Sale', 'Laptop bags, stands, and peripherals up to 35% off', 35, NULL, 'Computer', 'Laptop', ARRAY['laptop bag', 'laptop stand', 'laptop sleeve', 'mouse pad', 'usb hub', 'docking station'], 600, '35% Off', '2025-03-30'),

('Keyboard & Mouse Combo', 'Wireless keyboard + mouse bundle with extended warranty', NULL, 60.00, 'Computer', 'Peripherals', ARRAY['keyboard', 'mouse', 'wireless keyboard', 'mechanical keyboard', 'gaming keyboard', 'bluetooth mouse'], 500, '$60 Value', '2025-04-05'),

-- Tablet Accessories
('Tablet Essentials Bundle', 'Tablet case + stylus + screen protector combo deal', NULL, 75.00, 'Tablet', 'General', ARRAY['tablet case', 'ipad case', 'stylus', 'apple pencil', 'tablet stand', 'tablet keyboard'], 650, '$75 Value', '2025-03-28'),

-- Watch Accessories
('Smartwatch Accessories', '20% off smartwatch bands, chargers, and protective cases', 20, NULL, 'Wearables', 'Smartwatch', ARRAY['watch band', 'smartwatch band', 'apple watch band', 'watch case', 'watch charger', 'fitness tracker'], 400, '20% Off', '2025-04-12'),

-- Cable & Connectivity
('Cable & Adapter Clearance', 'All cables and adapters 30% off - USB, HDMI, Lightning, USB-C', 30, NULL, 'Connectivity', 'Cables', ARRAY['cable', 'usb cable', 'hdmi cable', 'lightning cable', 'usb-c cable', 'adapter', 'converter', 'dongle'], 250, '30% Off', '2025-03-18'),

-- Premium Bundles
('Ultimate Tech Bundle', 'Premium accessories bundle: Headphones + Case + Charger + Stand', NULL, 200.00, 'Bundle', 'Premium', ARRAY['bundle', 'premium bundle', 'tech bundle', 'accessory bundle', 'complete set'], 1800, '$200 Value', '2025-05-10'),

('Travel Tech Kit', 'Perfect for travelers: Portable charger + Travel adapter + Cable organizer', NULL, 90.00, 'Bundle', 'Travel', ARRAY['travel kit', 'travel adapter', 'portable charger', 'cable organizer', 'travel accessories'], 750, '$90 Value', '2025-04-25');

-- Function to find matching vouchers based on search query
CREATE OR REPLACE FUNCTION find_matching_vouchers(search_text text)
RETURNS TABLE(
  voucher_id uuid,
  title text,
  description text,
  discount_percentage integer,
  discount_amount decimal,
  category text,
  subcategory text,
  points_cost integer,
  value text,
  expiry_date date,
  match_score integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    av.id,
    av.title,
    av.description,
    av.discount_percentage,
    av.discount_amount,
    av.category,
    av.subcategory,
    av.points_cost,
    av.value,
    av.expiry_date,
    -- Calculate match score based on keyword matches
    (
      SELECT COUNT(*)::integer
      FROM unnest(av.keywords) AS keyword
      WHERE LOWER(search_text) LIKE '%' || LOWER(keyword) || '%'
    ) AS match_score
  FROM accessory_vouchers av
  WHERE av.is_active = true
    AND EXISTS (
      SELECT 1 
      FROM unnest(av.keywords) AS keyword
      WHERE LOWER(search_text) LIKE '%' || LOWER(keyword) || '%'
    )
  ORDER BY match_score DESC, av.created_at DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log search and return matching vouchers
CREATE OR REPLACE FUNCTION log_search_and_get_vouchers(
  searching_user_id uuid,
  search_query_input text,
  search_category_input text DEFAULT 'accessories'
)
RETURNS json AS $$
DECLARE
  matching_vouchers json;
  search_id uuid;
BEGIN
  -- Log the search
  INSERT INTO user_searches (user_id, search_query, search_category, search_type)
  VALUES (searching_user_id, search_query_input, search_category_input, 'accessory')
  RETURNING id INTO search_id;
  
  -- Get matching vouchers
  SELECT json_agg(
    json_build_object(
      'id', voucher_id,
      'title', title,
      'description', description,
      'discount_percentage', discount_percentage,
      'discount_amount', discount_amount,
      'category', category,
      'subcategory', subcategory,
      'points_cost', points_cost,
      'value', value,
      'expiry_date', expiry_date,
      'match_score', match_score
    )
  )
  INTO matching_vouchers
  FROM find_matching_vouchers(search_query_input);
  
  RETURN json_build_object(
    'search_id', search_id,
    'vouchers', COALESCE(matching_vouchers, '[]'::json),
    'search_query', search_query_input
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_searches_user_date ON user_searches(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_searches_query ON user_searches USING gin(to_tsvector('english', search_query));
CREATE INDEX IF NOT EXISTS idx_accessory_vouchers_keywords ON accessory_vouchers USING gin(keywords);
CREATE INDEX IF NOT EXISTS idx_accessory_vouchers_active ON accessory_vouchers(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_voucher_views_user ON user_voucher_views(user_id, viewed_at DESC);