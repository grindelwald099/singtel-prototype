import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { Activity, Users, Eye, TrendingUp, Clock } from 'lucide-react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rsqytbhetidgzpsifhiv.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzcXl0YmhldGlkZ3pwc2lmaGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NzczMzMsImV4cCI6MjA2NzM1MzMzM30.Y9S4HRe2XVqDCF93zCKcqfXHHLd3symW1knj9uAyIiQ';
const supabase = createClient(supabaseUrl, supabaseKey);

interface ActivityData {
  totalViews: number;
  uniqueUsers: number;
  topCategories: { category: string; count: number }[];
  recentActivity: {
    id: string;
    category_name: string;
    clicked_item_name: string;
    clicked_at: string;
    user_id: string;
  }[];
}

export default function RealtimeActivityMonitor() {
  const [activityData, setActivityData] = useState<ActivityData>({
    totalViews: 0,
    uniqueUsers: 0,
    topCategories: [],
    recentActivity: []
  });
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    fetchActivityData();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('activity_monitor')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_interactions',
        },
        (payload) => {
          console.log('New activity detected:', payload);
          setIsLive(true);
          fetchActivityData();
          
          // Reset live indicator after 2 seconds
          setTimeout(() => setIsLive(false), 2000);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchActivityData = async () => {
    try {
      // Get total views count
      const { count: totalViews } = await supabase
        .from('user_interactions')
        .select('*', { count: 'exact', head: true });

      // Get unique users count
      const { data: uniqueUsersData } = await supabase
        .from('user_interactions')
        .select('user_id')
        .not('user_id', 'is', null);
      
      const uniqueUsers = new Set(uniqueUsersData?.map(item => item.user_id)).size;

      // Get top categories
      const { data: categoryData } = await supabase
        .from('user_interactions')
        .select('category_name')
        .not('category_name', 'is', null);

      const categoryCounts = categoryData?.reduce((acc: any, item) => {
        acc[item.category_name] = (acc[item.category_name] || 0) + 1;
        return acc;
      }, {}) || {};

      const topCategories = Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Get recent activity
      const { data: recentActivity } = await supabase
        .from('user_interactions')
        .select('id, category_name, clicked_item_name, clicked_at, user_id')
        .not('clicked_item_name', 'is', null)
        .order('clicked_at', { ascending: false })
        .limit(10);

      setActivityData({
        totalViews: totalViews || 0,
        uniqueUsers,
        topCategories,
        recentActivity: recentActivity || []
      });
    } catch (error) {
      console.error('Error fetching activity data:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const clickedAt = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - clickedAt.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getCategoryIcon = (categoryName: string) => {
    if (categoryName.toLowerCase().includes('mobile')) return '📱';
    if (categoryName.toLowerCase().includes('sim')) return '📋';
    if (categoryName.toLowerCase().includes('broadband') || categoryName.toLowerCase().includes('fibre')) return '🌐';
    if (categoryName.toLowerCase().includes('accessories') || categoryName.toLowerCase().includes('devices')) return '🎧';
    if (categoryName.toLowerCase().includes('tv')) return '📺';
    if (categoryName.toLowerCase().includes('add-ons')) return '✈️';
    return '📦';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Activity size={20} color="#E60012" />
          <Text style={styles.title}>Live Activity Monitor</Text>
          {isLive && <View style={styles.liveIndicator} />}
        </View>
        <TouchableOpacity onPress={fetchActivityData}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Eye size={16} color="#E60012" />
          <Text style={styles.statValue}>{activityData.totalViews}</Text>
          <Text style={styles.statLabel}>Total Views</Text>
        </View>
        
        <View style={styles.statCard}>
          <Users size={16} color="#FF6B35" />
          <Text style={styles.statValue}>{activityData.uniqueUsers}</Text>
          <Text style={styles.statLabel}>Unique Users</Text>
        </View>
        
        <View style={styles.statCard}>
          <TrendingUp size={16} color="#4CAF50" />
          <Text style={styles.statValue}>{activityData.topCategories.length}</Text>
          <Text style={styles.statLabel}>Categories</Text>
        </View>
      </View>

      {/* Top Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Categories</Text>
        <View style={styles.categoriesList}>
          {activityData.topCategories.map((category, index) => (
            <View key={index} style={styles.categoryItem}>
              <Text style={styles.categoryIcon}>{getCategoryIcon(category.category)}</Text>
              <View style={styles.categoryContent}>
                <Text style={styles.categoryName}>{category.category}</Text>
                <Text style={styles.categoryCount}>{category.count} views</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <ScrollView style={styles.activityList} showsVerticalScrollIndicator={false}>
          {activityData.recentActivity.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Text style={styles.activityEmoji}>{getCategoryIcon(activity.category_name)}</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle} numberOfLines={1}>
                  {activity.clicked_item_name}
                </Text>
                <Text style={styles.activityCategory}>{activity.category_name}</Text>
              </View>
              <View style={styles.activityTime}>
                <Clock size={12} color="#666" />
                <Text style={styles.timeText}>{formatTimeAgo(activity.clicked_at)}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginLeft: 8,
  },
  refreshText: {
    color: '#E60012',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  categoriesList: {
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  categoryCount: {
    fontSize: 12,
    color: '#666',
  },
  activityList: {
    maxHeight: 200,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  activityEmoji: {
    fontSize: 14,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  activityCategory: {
    fontSize: 12,
    color: '#666',
  },
  activityTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 2,
  },
});