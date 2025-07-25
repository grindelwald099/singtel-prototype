import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Phone, Wifi, MessageCircle, Settings, Plus, ArrowRight, Gift } from 'lucide-react-native';
import PersonalizedRecommendations from '@/components/PersonalizedRecommendations';
import RealtimeActivityMonitor from '@/components/RealtimeActivityMonitor';
import SupportChatbot from '@/components/SupportChatbot';
import UsageRecommendations from '@/components/UsageRecommendations';
import { createClient } from '@supabase/supabase-js';
import SmartVoucherRecommendations from '@/components/SmartVoucherRecommendations';
import UserBehaviorTracker from '@/components/UserBehaviorTracker';
import VoucherCarousel from '@/components/VoucherCarousel';
import RecommendedVouchers from '@/components/RecommendedVouchers';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

// Initialize Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default function DashboardScreen() {
  const { theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showChatbot, setShowChatbot] = useState(false);
  const router = useRouter();

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

  const handleQuickAction = (actionId: number) => {
    if (actionId === 3) { // Support action
      setShowChatbot(true);
    }
    // Handle other actions as needed
  };

  if (showChatbot) {
    return <SupportChatbot onClose={() => setShowChatbot(false)} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.greeting, { color: theme.textSecondary }]}>Good morning,</Text>
              <Text style={[styles.username, { color: theme.text }]}>John Doe</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <View style={styles.notificationDot} />
              <Text style={styles.notificationText}>3</Text>
            </TouchableOpacity>
          </View>

          {/* Data Usage Card */}
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Data Usage</Text>
              <TouchableOpacity>
                <Text style={[styles.viewDetails, { color: theme.primary }]}>View Details</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.usageContainer}>
              <View style={[styles.usageCircle, { backgroundColor: theme.surface }]}>
                <Text style={[styles.usagePercentage, { color: theme.primary }]}>{dataUsage.percentage}%</Text>
                <Text style={[styles.usageLabel, { color: theme.textSecondary }]}>Used</Text>
              </View>
              <View style={styles.usageDetails}>
                <View style={styles.usageRow}>
                  <Text style={[styles.usageText, { color: theme.textSecondary }]}>Used: {dataUsage.used} GB</Text>
                  <Text style={[styles.usageText, { color: theme.textSecondary }]}>Remaining: {dataUsage.total - dataUsage.used} GB</Text>
                </View>
                <View style={[styles.progressBar, { backgroundColor: theme.surface }]}>
                  <View style={[styles.progressFill, { width: `${dataUsage.percentage}%`, backgroundColor: theme.primary }]} />
                </View>
                <Text style={[styles.planText, { color: theme.textSecondary }]}>Unlimited Plan • Renews on 5 Feb</Text>
              </View>
            </View>
          </View>

          {/* Recommendations Section */}
          <View style={styles.recommendationsSection}>
            <View style={styles.recommendationsHeader}>
              <Text style={[styles.recommendationsTitle, { color: theme.text }]}>🤖 Smart Recommendations</Text>
              <Text style={[styles.recommendationsSubtitle, { color: theme.textSecondary }]}>Personalized just for you</Text>
            </View>

            {/* HiLite Recommendations */}
            <UsageRecommendations />

            {/* Featured Vouchers Carousel */}
            <View style={styles.featuredVouchersSection}>
              <View style={styles.featuredHeader}>
                <View style={styles.featuredTitleRow}>
                  <View style={styles.featuredIconWrapper}>
                    <Gift size={24} color="#E60012" />
                    <View style={styles.sparkleIcon}>
                      <Text style={styles.sparkleEmoji}>✨</Text>
                    </View>
                  </View>
                  <View style={styles.featuredTitleContent}>
                    <Text style={[styles.featuredTitle, { color: theme.text }]}>Suggested for You</Text>
                    <Text style={[styles.featuredSubtitle, { color: theme.textSecondary }]}>
                      AI-curated vouchers based on your activity and preferences
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.featuredViewMoreButton} 
                  onPress={() => router.push('/(tabs)/loyalty')}
                >
                  <Text style={[styles.featuredViewMoreText, { color: theme.primary }]}>View More</Text>
                  <ArrowRight size={14} color="#E60012" />
                </TouchableOpacity>
              </View>
            </View>
            
            <VoucherCarousel 
              userId={user?.id} 
              onViewMore={() => router.push('/(tabs)/loyalty')}
            />

            {/* Personalized Recommendations (AI SIM and Phone) */}
            <PersonalizedRecommendations key={refreshKey} userId={user?.id} />
          </View>
          
          {/* Current Bill Card */}
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            {/* Recommended Vouchers */}
            <RecommendedVouchers userId={user?.id} />
          </View>

          {/* Quick Actions */}
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity 
                  key={action.id} 
                  style={styles.quickAction}
                  onPress={() => handleQuickAction(action.id)}
                >
                  <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                    <action.icon size={24} color="white" />
                  </View>
                  <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Track user behavior on dashboard view */}
          <UserBehaviorTracker 
            userId={user?.id}
            action="view"
            category="dashboard"
            itemName="Dashboard Screen"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
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
  },
  viewDetails: {
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  usagePercentage: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  usageLabel: {
    fontSize: 12,
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
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  planText: {
    fontSize: 12,
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
    marginRight: 2,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  billDetails: {
    flex: 1,
  },
  dueDate: {
    fontSize: 14,
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
    textAlign: 'center',
    fontWeight: '500',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  recommendationsSection: {
    marginBottom: 20,
  },
  recommendationsHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  recommendationsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  recommendationsSubtitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  suggestedVouchersSection: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  featuredVouchersSection: {
    // Add styles as needed
  },
  featuredHeader: {
    // Add styles as needed
  },
  featuredTitleRow: {
    // Add styles as needed
  },
  featuredIconWrapper: {
    // Add styles as needed
  },
  sparkleIcon: {
    // Add styles as needed
  },
  sparkleEmoji: {
    // Add styles as needed
  },
  featuredTitleContent: {
    // Add styles as needed
  },
  featuredTitle: {
    // Add styles as needed
  },
  featuredSubtitle: {
    // Add styles as needed
  },
  featuredViewMoreButton: {
    // Add styles as needed
  },
  featuredViewMoreText: {
    // Add styles as needed
  },
});