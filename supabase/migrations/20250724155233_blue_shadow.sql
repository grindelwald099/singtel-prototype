/*
  # Link accessories table to accessory vouchers

  1. Database Changes
    - Add product_ids column to accessory_vouchers to link with accessories table
    - Update existing vouchers to match accessories in the database
    - Create function to find matching vouchers based on product clicks

  2. Voucher Linking
    - Link headphone vouchers to headphone accessories
    - Link mobile vouchers to mobile accessories  
    - Link gaming vouchers to gaming accessories
    - Link computer vouchers to computer accessories

  3. Click Tracking
    - Track when users click on accessories
    - Show matching vouchers as "recommended" based on clicks
    - Remove initial recommendations - only show after user interaction
*/

-- Add product_ids column to link vouchers with specific accessories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accessory_vouchers' AND column_name = 'product_ids'
  ) THEN
    ALTER TABLE accessory_vouchers ADD COLUMN product_ids integer[];
  END IF;
END $$;

-- Update existing vouchers to link with accessories table items
UPDATE accessory_vouchers 
SET product_ids = ARRAY[1, 2, 3, 4, 5] 
WHERE title LIKE '%Audio%' OR title LIKE '%Headphone%' OR description LIKE '%headphone%';

UPDATE accessory_vouchers 
SET product_ids = ARRAY[6, 7, 8, 9, 10] 
WHERE title LIKE '%Mobile%' OR title LIKE '%Phone%' OR description LIKE '%mobile%' OR description LIKE '%phone%';

UPDATE accessory_vouchers 
SET product_ids = ARRAY[11, 12, 13, 14, 15] 
WHERE title LIKE '%Gaming%' OR description LIKE '%gaming%' OR description LIKE '%game%';

UPDATE accessory_vouchers 
SET product_ids = ARRAY[16, 17, 18, 19, 20] 
WHERE title LIKE '%Computer%' OR title LIKE '%Laptop%' OR description LIKE '%computer%' OR description LIKE '%laptop%';

-- Create function to get recommended vouchers based on clicked accessory
CREATE OR REPLACE FUNCTION get_recommended_vouchers_for_accessory(
  clicked_accessory_position integer
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  discount_percentage integer,
  discount_amount numeric,
  category text,
  subcategory text,
  keywords text[],
  points_cost integer,
  value text,
  expiry_date date,
  is_active boolean,
  created_at timestamptz,
  product_ids integer[],
  is_recommended boolean
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
    av.keywords,
    av.points_cost,
    av.value,
    av.expiry_date,
    av.is_active,
    av.created_at,
    av.product_ids,
    CASE 
      WHEN clicked_accessory_position = ANY(av.product_ids) THEN true
      ELSE false
    END as is_recommended
  FROM accessory_vouchers av
  WHERE av.is_active = true
  ORDER BY 
    CASE WHEN clicked_accessory_position = ANY(av.product_ids) THEN 0 ELSE 1 END,
    av.created_at DESC;
END;
$$ LANGUAGE plpgsql;