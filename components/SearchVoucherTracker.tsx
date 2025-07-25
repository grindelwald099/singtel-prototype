import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rsqytbhetidgzpsifhiv.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzcXl0YmhldGlkZ3pwc2lmaGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NzczMzMsImV4cCI6MjA2NzM1MzMzM30.Y9S4HRe2XVqDCF93zCKcqfXHHLd3symW1knj9uAyIiQ';
const supabase = createClient(supabaseUrl, supabaseKey);

interface SearchVoucherTrackerProps {
  searchQuery: string;
  userId?: string;
  onVouchersFound?: (vouchers: any[]) => void;
}

export default function SearchVoucherTracker({ 
  searchQuery, 
  userId, 
  onVouchersFound 
}: SearchVoucherTrackerProps) {
  
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const trackSearchAndFindVouchers = async () => {
      try {
        console.log('Tracking search:', searchQuery);

        // Call the database function to log search and get matching vouchers
        const { data, error } = await supabase.rpc('log_search_and_get_vouchers', {
          searching_user_id: userId || null,
          search_query_input: searchQuery.trim(),
          search_category_input: 'accessories'
        });

        if (error) {
          console.error('Error tracking search:', error);
          return;
        }

        console.log('Search tracked, vouchers found:', data);

        // If vouchers were found, notify parent component
        if (data?.vouchers && data.vouchers.length > 0) {
          onVouchersFound?.(data.vouchers);
        }

        // Also track the search as a user interaction for existing recommendation system
        await supabase
          .from('user_interactions')
          .insert({
            user_id: userId || null,
            category_id: 'search',
            category_name: 'Search',
            clicked_item_name: `Search: ${searchQuery}`,
            device_info: JSON.stringify({
              search_type: 'accessory',
              search_query: searchQuery,
              timestamp: new Date().toISOString()
            }),
            clicked_at: new Date().toISOString()
          });

      } catch (err) {
        console.error('Failed to track search:', err);
      }
    };

    // Debounce search tracking to avoid too many calls
    const timeoutId = setTimeout(trackSearchAndFindVouchers, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, userId, onVouchersFound]);

  // This component doesn't render anything
  return null;
}