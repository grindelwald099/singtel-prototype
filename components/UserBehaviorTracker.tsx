import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rsqytbhetidgzpsifhiv.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzcXl0YmhldGlkZ3pwc2lmaGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NzczMzMsImV4cCI6MjA2NzM1MzMzM30.Y9S4HRe2XVqDCF93zCKcqfXHHLd3symW1knj9uAyIiQ';
const supabase = createClient(supabaseUrl, supabaseKey);

interface UserBehaviorTrackerProps {
  userId?: string;
  action: 'view' | 'click' | 'search' | 'chat';
  category?: string;
  itemName?: string;
  chatMessage?: string;
  metadata?: any;
}

export default function UserBehaviorTracker({ 
  userId, 
  action, 
  category, 
  itemName, 
  chatMessage,
  metadata 
}: UserBehaviorTrackerProps) {
  
  useEffect(() => {
    const trackBehavior = async () => {
      try {
        const deviceInfo = {
          os: Platform.OS,
          platform: Platform.OS,
          version: Platform.Version,
          timestamp: new Date().toISOString(),
        };

        // Enhanced tracking data
        const trackingData = {
          user_id: userId || null,
          category_id: category?.toLowerCase() || null,
          category_name: category || null,
          clicked_item_name: itemName || null,
          device_info: JSON.stringify({
            ...deviceInfo,
            action_type: action,
            chat_message: chatMessage || null,
            metadata: metadata || null
          }),
          clicked_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('user_interactions')
          .insert(trackingData)
          .select();

        if (error) {
          console.log('Error tracking behavior:', error);
          return;
        }

        console.log('Behavior tracked successfully:', data);

        // Award points for engagement and trigger voucher recommendations for accessories
        if (userId && action === 'click' && category === 'accessories') {
          await awardEngagementPoints(userId, action, category);
          
          console.log('UserBehaviorTracker: Accessory click tracked, voucher recommendations will update via real-time subscription');
        } else if (userId && action === 'click') {
          await awardEngagementPoints(userId, action, category);
        }
      } catch (err) {
        console.log('Failed to track behavior:', err);
      }
    };

    trackBehavior();
  }, [userId, action, category, itemName, chatMessage, metadata]);

  const awardEngagementPoints = async (userId: string, action: string, category?: string) => {
    try {
      let points = 0;
      let description = '';

      switch (action) {
        case 'click':
          points = 10;
          description = `Product click: ${category || 'General'}`;
          break;
        case 'view':
          points = 5;
          description = `Page view: ${category || 'General'}`;
          break;
        case 'search':
          points = 15;
          description = 'Search activity';
          break;
        case 'chat':
          points = 20;
          description = 'Chat interaction';
          break;
        default:
          points = 5;
          description = 'General engagement';
      }

      // Add points to user account
      await supabase
        .from('user_loyalty_points')
        .upsert({
          user_id: userId,
          total_points: points,
          points_earned_this_month: points
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      // Record transaction
      await supabase
        .from('loyalty_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'earned',
          points: points,
          description: description,
          reference_id: `${action}_${Date.now()}`
        });

      console.log(`Awarded ${points} points for ${action}`);
    } catch (error) {
      console.error('Error awarding engagement points:', error);
    }
  };

  // This component doesn't render anything
  return null;
}