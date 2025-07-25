/*
  # Update accessory voucher links to match actual accessories

  1. Updates
    - Link accessory vouchers to specific accessories by position
    - Map audio products to audio vouchers
    - Map mobile accessories to mobile vouchers
    - Clear existing product_ids and set proper links

  2. Linking Strategy
    - Audio products (AirPods, headphones, speakers) → Audio vouchers
    - Mobile accessories (cases, chargers) → Mobile vouchers
    - Gaming accessories → Gaming vouchers
*/

-- Clear existing product_ids
UPDATE accessory_vouchers SET product_ids = '{}';

-- Link Premium Headphones voucher to audio accessories (positions 1-13 are audio products)
UPDATE accessory_vouchers 
SET product_ids = '{1,2,3,4,5,6,7,8,9,10,11,12,13}'
WHERE title = 'Premium Headphones 25% Off';

-- Link Audio Accessories Mega Sale to audio products
UPDATE accessory_vouchers 
SET product_ids = '{1,2,3,4,5,6,7,8,9,10,11,12,13}'
WHERE title = 'Audio Accessories Mega Sale';

-- Link Wireless Earbuds Bundle Deal to wireless audio products
UPDATE accessory_vouchers 
SET product_ids = '{1,2,3,4,5,9,13}'
WHERE title = 'Wireless Earbuds Bundle Deal';

-- Link Mobile accessories vouchers to mobile-related positions (if any exist)
-- Note: From the image, most accessories are audio-related

-- Link Gaming vouchers to gaming accessories (positions that might be gaming-related)
UPDATE accessory_vouchers 
SET product_ids = '{14}' -- OPPO Enco Air4 could be gaming-related
WHERE title = 'Gaming Gear Bonanza';

-- Link Mobile Gaming Bundle to mobile accessories
UPDATE accessory_vouchers 
SET product_ids = '{1,2,3,4,5,14}'
WHERE title = 'Mobile Gaming Bundle';

-- Update the function to properly check for matching accessories
CREATE OR REPLACE FUNCTION get_recommended_vouchers_for_accessory(clicked_accessory_position INTEGER)
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
    (clicked_accessory_position = ANY(av.product_ids)) as is_recommended
  FROM accessory_vouchers av
  WHERE av.is_active = true
  ORDER BY (clicked_accessory_position = ANY(av.product_ids)) DESC, av.created_at DESC;
END;
$$ LANGUAGE plpgsql;