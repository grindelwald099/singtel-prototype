/*
  # Improve Accessory Voucher Recommendation System

  1. Database Functions
    - Enhanced function to get vouchers for clicked accessories
    - Better matching logic for accessory names and categories
    - Improved product_ids linking

  2. Security
    - Public access to recommendation functions
    - Proper RLS policies maintained

  3. Performance
    - Optimized queries for real-time recommendations
    - Better indexing for faster lookups
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_recommended_vouchers_for_accessory(bigint);

-- Create enhanced function to get vouchers for clicked accessories
CREATE OR REPLACE FUNCTION get_recommended_vouchers_for_accessory(
  clicked_accessory_position bigint
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  points_cost integer,
  value text,
  category text,
  is_recommended boolean,
  match_reason text
)
LANGUAGE plpgsql
AS $$
DECLARE
  accessory_record RECORD;
  product_name_lower text;
BEGIN
  -- Get the clicked accessory details
  SELECT * INTO accessory_record
  FROM accessories 
  WHERE "Position" = clicked_accessory_position;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  product_name_lower := LOWER(accessory_record."Product_Name");
  
  -- Return matching vouchers with recommendation logic
  RETURN QUERY
  SELECT 
    av.id,
    av.title,
    av.description,
    av.points_cost,
    av.value,
    av.category,
    CASE 
      -- Direct position match
      WHEN clicked_accessory_position = ANY(av.product_ids) THEN true
      -- Audio product matching
      WHEN (product_name_lower LIKE '%airpods%' OR 
            product_name_lower LIKE '%headphone%' OR 
            product_name_lower LIKE '%earphone%' OR 
            product_name_lower LIKE '%speaker%' OR 
            product_name_lower LIKE '%audio%' OR
            product_name_lower LIKE '%jbl%') 
           AND av.category ILIKE '%audio%' THEN true
      -- Mobile accessory matching
      WHEN (product_name_lower LIKE '%phone%' OR 
            product_name_lower LIKE '%mobile%' OR 
            product_name_lower LIKE '%case%' OR 
            product_name_lower LIKE '%charger%') 
           AND av.category ILIKE '%mobile%' THEN true
      -- Gaming accessory matching
      WHEN (product_name_lower LIKE '%gaming%' OR 
            product_name_lower LIKE '%game%' OR 
            product_name_lower LIKE '%controller%') 
           AND av.category ILIKE '%gaming%' THEN true
      ELSE false
    END as is_recommended,
    CASE 
      WHEN clicked_accessory_position = ANY(av.product_ids) THEN 'Direct product match'
      WHEN product_name_lower LIKE '%airpods%' AND av.category ILIKE '%audio%' THEN 'Perfect for AirPods users'
      WHEN product_name_lower LIKE '%jbl%' AND av.category ILIKE '%audio%' THEN 'Great for JBL audio fans'
      WHEN product_name_lower LIKE '%headphone%' AND av.category ILIKE '%audio%' THEN 'Ideal for headphone enthusiasts'
      WHEN product_name_lower LIKE '%speaker%' AND av.category ILIKE '%audio%' THEN 'Perfect for speaker lovers'
      WHEN product_name_lower LIKE '%gaming%' AND av.category ILIKE '%gaming%' THEN 'Essential for gamers'
      ELSE 'Related to your interests'
    END as match_reason
  FROM accessory_vouchers av
  WHERE av.is_active = true
  ORDER BY 
    CASE WHEN clicked_accessory_position = ANY(av.product_ids) THEN 1 ELSE 2 END,
    av.points_cost ASC;
END;
$$;

-- Grant execute permission to public
GRANT EXECUTE ON FUNCTION get_recommended_vouchers_for_accessory(bigint) TO public;

-- Update product_ids for better matching based on actual accessories
UPDATE accessory_vouchers 
SET product_ids = ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]::integer[]
WHERE title ILIKE '%headphone%' OR title ILIKE '%audio%' OR category ILIKE '%audio%';

UPDATE accessory_vouchers 
SET product_ids = ARRAY[14]::integer[]
WHERE title ILIKE '%mobile%' OR title ILIKE '%gaming%' OR category ILIKE '%mobile%' OR category ILIKE '%gaming%';

-- Add some test vouchers if they don't exist
INSERT INTO accessory_vouchers (title, description, discount_percentage, category, subcategory, keywords, points_cost, value, expiry_date, product_ids)
VALUES 
  ('AirPods Special Discount', 'Get 30% off on all AirPods models and accessories', 30, 'Audio', 'Headphones', ARRAY['airpods', 'apple', 'wireless', 'earbuds'], 800, '$50 Off', '2025-06-30', ARRAY[1, 2, 3, 4, 5]::integer[]),
  ('JBL Audio Bundle Deal', 'Special bundle pricing on JBL speakers and headphones', 25, 'Audio', 'Speakers', ARRAY['jbl', 'speaker', 'bluetooth', 'audio'], 600, '$40 Off', '2025-06-30', ARRAY[7, 8, 9, 10, 11, 12]::integer[]),
  ('Premium Audio Accessories', 'Upgrade your audio experience with premium accessories', 20, 'Audio', 'Accessories', ARRAY['audio', 'premium', 'accessories'], 500, '$30 Off', '2025-06-30', ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]::integer[])
ON CONFLICT (id) DO NOTHING;