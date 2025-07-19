import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Phone, Wifi, MessageCircle, Settings, Plus, ArrowRight } from 'lucide-react-native';
import PersonalizedRecommendations from '@/components/PersonalizedRecommendations';
import RealtimeActivityMonitor from '@/components/RealtimeActivityMonitor';
import { createClient } from '@supabase/supabase-js';

const { width } = Dimensions.get('window');

// Initialize Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rsqytbhetidgzpsifhiv.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzcXl0YmhldGlkZ3pwc2lmaGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NzczMzMsImV4cCI6MjA2NzM1MzMzM30.Y9S4HRe2XVqDCF93zCKcqfXHHLd3symW1knj9uAyIiQ';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function DashboardScreen() {
  const [user, setUser] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (err) {
        console.log('Failed to get session:', err);
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  // Force refresh recommendations when user changes
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [user]);

  const dataUsage = {
    used: 12.5,
    total: 20,
    percentage: 62.5
  };

  const currentBill = {
    amount: 68.50,
    dueDate: '25 Jan 2025',
    status: 'due'
  };

  const quickActions = [
    { id: 1, icon: Phone, label: 'Top Up', color: '#E60012' },
    { id: 2, icon: Wifi, label: 'Add Data', color: '#FF6B35' },
    { id: 3, icon: MessageCircle, label: 'Support', color: '#4CAF50' },
    { id: 4, icon: Settings, label: 'Settings', color: '#2196F3' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.username}>John Doe</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <View style={styles.notificationDot} />
            <Text style={styles.notificationText}>3</Text>
          </TouchableOpacity>
        </View>

        {/* Data Usage Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Data Usage</Text>
            <TouchableOpacity>
              <Text style={styles.viewDetails}>View Details</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.usageContainer}>
            <View style={styles.usageCircle}>
              <Text style={styles.usagePercentage}>{dataUsage.percentage}%</Text>
              <Text style={styles.usageLabel}>Used</Text>
            </View>
            <View style={styles.usageDetails}>
              <View style={styles.usageRow}>
                <Text style={styles.usageText}>Used: {dataUsage.used} GB</Text>
                <Text style={styles.usageText}>Remaining: {dataUsage.total - dataUsage.used} GB</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${dataUsage.percentage}%` }]} />
              </View>
              <Text style={styles.planText}>Unlimited Plan • Renews on 5 Feb</Text>
            </View>
          </View>
        </View>

        {/* Current Bill Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Current Bill</Text>
            <TouchableOpacity>
              <ArrowRight size={20} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.billContainer}>
            <View style={styles.billAmount}>
              <Text style={styles.currency}>S$</Text>
              <Text style={styles.amount}>{currentBill.amount}</Text>
            </View>
            <View style={styles.billDetails}>
              <Text style={styles.dueDate}>Due: {currentBill.dueDate}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Payment Due</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.payButton}>
            <LinearGradient
              colors={['#E60012', '#FF6B35']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.payButtonGradient}
            >
              <Text style={styles.payButtonText}>Pay Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity key={action.id} style={styles.quickAction}>
                <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                  <action.icon size={24} color="white" />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Personalized Recommendations */}
        <PersonalizedRecommendations key={refreshKey} userId={user?.id} />

        {/* Real-time Activity Monitor */}
        <RealtimeActivityMonitor />

        {/* Recent Activity */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Phone size={20} color="#E60012" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Top-up successful</Text>
                <Text style={styles.activityDate}>Today, 2:30 PM</Text>
              </View>
              <Text style={styles.activityAmount}>+S$20</Text>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Wifi size={20} color="#FF6B35" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Data add-on purchased</Text>
                <Text style={styles.activityDate}>Yesterday, 6:15 PM</Text>
              </View>
              <Text style={styles.activityAmount}>S$15</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  notificationButton: {
    backgroundColor: '#E60012',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
  },
  notificationText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewDetails: {
    color: '#E60012',
    fontSize: 14,
    fontWeight: '600',
  },
  usageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usageCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  usagePercentage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E60012',
  },
  usageLabel: {
    fontSize: 12,
    color: '#666',
  },
  usageDetails: {
    flex: 1,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  usageText: {
    fontSize: 14,
    color: '#666',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E60012',
    borderRadius: 3,
  },
  planText: {
    fontSize: 12,
    color: '#999',
  },
  billContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  billAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: 20,
  },
  currency: {
    fontSize: 16,
    color: '#666',
    marginRight: 2,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  billDetails: {
    flex: 1,
  },
  dueDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statusBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
  },
  payButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  payButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  quickAction: {
    alignItems: 'center',
    width: (width - 80) / 4,
    marginBottom: 20,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  viewAll: {
    color: '#E60012',
    fontSize: 14,
    fontWeight: '600',
  },
  activityList: {
    marginTop: 10,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  activityDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E60012',
  },
});