import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rsqytbhetidgzpsifhiv.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzcXl0YmhldGlkZ3pwc2lmaGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NzczMzMsImV4cCI6MjA2NzM1MzMzM30.Y9S4HRe2XVqDCF93zCKcqfXHHLd3symW1knj9uAyIiQ';
const supabase = createClient(supabaseUrl, supabaseKey);

interface RealtimeData {
  totalViews: number;
  recentViews: any[];
  isConnected: boolean;
}

export function useRealtimeTracking(userId?: string) {
  const [data, setData] = useState<RealtimeData>({
    totalViews: 0,
    recentViews: [],
    isConnected: false
  });

  useEffect(() => {
    let subscription: any;

    const setupRealtimeSubscription = () => {
      subscription = supabase
        .channel('user_interactions_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_interactions',
          },
          (payload) => {
            console.log('Real-time update received:', payload);
            fetchLatestData();
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status);
          setData(prev => ({ ...prev, isConnected: status === 'SUBSCRIBED' }));
        });
    };

    const fetchLatestData = async () => {
      try {
        // Get total views
        const { count } = await supabase
          .from('user_interactions')
          .select('*', { count: 'exact', head: true });

        // Get recent views for user or all users
        let query = supabase
          .from('user_interactions')
          .select('*')
          .not('clicked_item_name', 'is', null)
          .order('clicked_at', { ascending: false })
          .limit(20);

        if (userId) {
          query = query.eq('user_id', userId);
        }

        const { data: recentViews } = await query;

        setData(prev => ({
          ...prev,
          totalViews: count || 0,
          recentViews: recentViews || []
        }));
      } catch (error) {
        console.error('Error fetching latest data:', error);
      }
    };

    fetchLatestData();
    setupRealtimeSubscription();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [userId]);

  return data;
}