import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gift, Star } from 'lucide-react-native';
import { createClient } from '@supabase/supabase-js';
import LoyaltyPointsSection from '@/components/LoyaltyPointsSection';
import RewardsSection from '@/components/RewardsSection';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface UserLoyalty {
  total_points: number;
  current_tier: string;
  points_earned_this_month: number;
  is_premium_member: boolean;
}

export default function LoyaltyScreen() {
  const [activeTab, setActiveTab] = useState<'points' | 'rewards'>('points');
  const [userLoyalty, setUserLoyalty] = useState<UserLoyalty | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        setSessionError(null);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          await fetchUserLoyalty(session.user.id);
        } else {
          // No authenticated user - create demo data
          setUser(null);
          setUserLoyalty({
            total_points: 2400,
            current_tier: 'Bronze',
            points_earned_this_month: 450,
            is_premium_member: false
          });
        }
      } catch (err) {
        console.error('Failed to get session:', err);
        setSessionError('Failed to load session');
        // Set demo data on error
        setUser(null);
        setUserLoyalty({
          total_points: 2400,
          current_tier: 'Bronze',
          points_earned_this_month: 450,
          is_premium_member: false
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchUserLoyalty(session.user.id);
      } else {
        setUser(null);
        setUserLoyalty({
          total_points: 2400,
          current_tier: 'Bronze',
          points_earned_this_month: 450,
          is_premium_member: false
        });
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const fetchUserLoyalty = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_loyalty_points')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user loyalty:', error);
        return;
      }

      if (data) {
        setUserLoyalty(data);
      } else {
        // Create initial loyalty record
        const { data: newRecord, error: insertError } = await supabase
          .from('user_loyalty_points')
          .insert({
            user_id: userId,
            total_points: 0,
            current_tier: 'Bronze',
            points_earned_this_month: 0
          })
          .select()
          .single();

        if (newRecord && !insertError) {
          setUserLoyalty(newRecord);
        } else {
          console.error('Error creating loyalty record:', insertError);
          // Set default data
          setUserLoyalty({
            total_points: 2400,
            current_tier: 'Bronze',
            points_earned_this_month: 450,
            is_premium_member: false
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user loyalty:', error);
      // Set default data on error
      setUserLoyalty({
        total_points: 2400,
        current_tier: 'Bronze',
        points_earned_this_month: 450,
        is_premium_member: false
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E60012" />
          <Text style={styles.loadingText}>
            {sessionError ? 'Setting up loyalty system...' : 'Loading your loyalty rewards...'}
          </Text>
          {sessionError && (
            <Text style={styles.errorText}>
              Note: Some features may be limited without sign-in
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Loyalty Rewards</Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'points' && styles.activeTab]}
            onPress={() => setActiveTab('points')}
          >
            <Gift size={16} color={activeTab === 'points' ? 'white' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'points' && styles.activeTabText]}>My Points</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'rewards' && styles.activeTab]}
            onPress={() => setActiveTab('rewards')}
          >
            <Star size={16} color={activeTab === 'rewards' ? 'white' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'rewards' && styles.activeTabText]}>Rewards</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'points' ? (
          <LoyaltyPointsSection userId={user?.id} />
        ) : (
          <RewardsSection userId={user?.id} userPoints={userLoyalty?.total_points || 2400} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 5,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#E60012',
    shadowColor: '#E60012',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
  },
  activeTabText: {
    color: 'white',
  },
});