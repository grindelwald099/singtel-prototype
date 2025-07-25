import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rsqytbhetidgzpsifhiv.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzcXl0YmhldGlkZ3pwc2lmaGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NzczMzMsImV4cCI6MjA2NzM1MzMzM30.Y9S4HRe2XVqDCF93zCKcqfXHHLd3symW1knj9uAyIiQ';
const supabase = createClient(supabaseUrl, supabaseKey);

interface ProductViewTrackerProps {
  productId: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  userId?: string;
}

export default function ProductViewTracker({ 
  productId, 
  productName, 
  categoryId, 
  categoryName, 
  userId 
}: ProductViewTrackerProps) {
  
  useEffect(() => {
    const trackProductView = async () => {
      try {
        const deviceInfo = {
          os: Platform.OS,
          platform: Platform.OS,
          version: Platform.Version,
          timestamp: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('user_interactions')
          .insert({
            user_id: userId || null,
            category_id: categoryId,
            category_name: categoryName,
            clicked_item_id: productId,
            clicked_item_name: productName,
            device_info: JSON.stringify(deviceInfo),
            clicked_at: new Date().toISOString(),
          })
          .select();

        if (error) {
          console.log('Error tracking product view:', error);
          return;
        }

        console.log('Product view tracked successfully:', data);
      } catch (err) {
        console.log('Failed to track product view:', err);
      }
    };

    // Track the view when component mounts
    trackProductView();
  }, [productId, productName, categoryId, categoryName, userId]);

  // This component doesn't render anything
  return null;
}