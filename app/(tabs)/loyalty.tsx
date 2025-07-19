import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Gift, Star, Trophy, Crown, Zap, Tag, ShoppingBag, Clock, TrendingUp, Award, Coins } from 'lucide-react-native';
import { createClient } from '@supabase/supabase-js';

const { width } = Dimensions.get('window');

// Initialize Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rsqytbhetidgzpsifhiv.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzcXl0YmhldGlkZ3pwc2lmaGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NzczMzMsImV4cCI6MjA2NzM1MzMzM30.Y9S4HRe2XVqDCF93zCKcqfXHHLd3symW1knj9uAyIiQ';
const supabase = createClient(supabaseUrl, supabaseKey);

interface UserTier {
  name: string;
  minPoints: number;
  multiplier: number;
  color: string;
  bgColor: string;
  icon: any;
  benefits: string[];
}

interface Voucher {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  value: string;
  expiryDate: string;
  category: string;
  image: string;
}

interface PersonalizedDiscount {
  id: string;
  productName: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  pointsRequired: number;
  category: string;
  image: string;
  reason: string;
}

export default function LoyaltyScreen() {
  const [activeTab, setActiveTab] = useState('overview');
  const [userPoints, setUserPoints] = useState(2450);
  const [userTier, setUserTier] = useState('Gold');
  const [loading, setLoading] = useState(false);
  const [personalizedDiscounts, setPersonalizedDiscounts] = useState<PersonalizedDiscount[]>([]);
  const [user, setUser] = useState<any>(null);

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
    generatePersonalizedDiscounts();
  }, []);

  const tiers: UserTier[] = [
    {
      name: 'Bronze',
      minPoints: 0,
      multiplier: 1.0,
      color: '#CD7F32',
      bgColor: '#FFF8E1',
      icon: Award,
      benefits: ['1x points on purchases', 'Basic customer support', 'Monthly newsletter']
    },
    {
      name: 'Silver',
      minPoints: 1000,
      multiplier: 1.2,
      color: '#C0C0C0',
      bgColor: '#F5F5F5',
      icon: Star,
      benefits: ['1.2x points on purchases', 'Priority customer support', 'Exclusive offers', 'Free shipping on orders >$50']
    },
    {
      name: 'Gold',
      minPoints: 2500,
      multiplier: 1.5,
      color: '#FFD700',
      bgColor: '#FFFDE7',
      icon: Trophy,
      benefits: ['1.5x points on purchases', 'VIP customer support', 'Early access to sales', 'Free shipping on all orders', 'Birthday bonus points']
    },
    {
      name: 'Platinum',
      minPoints: 5000,
      multiplier: 2.0,
      color: '#E5E4E2',
      bgColor: '#FAFAFA',
      icon: Crown,
      benefits: ['2x points on purchases', 'Dedicated account manager', 'Exclusive events access', 'Free premium shipping', 'Quarterly bonus rewards']
    }
  ];

  const vouchers: Voucher[] = [
    {
      id: '1',
      title: '$10 Off Mobile Accessories',
      description: 'Valid on any mobile accessory purchase above $30',
      pointsCost: 500,
      value: '$10',
      expiryDate: '2025-03-31',
      category: 'Mobile',
      image: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: '2',
      title: '20% Off SIM Plan Upgrade',
      description: 'Upgrade to any higher tier SIM plan',
      pointsCost: 800,
      value: '20%',
      expiryDate: '2025-02-28',
      category: 'SIM',
      image: 'https://images.pexels.com/photos/6214479/pexels-photo-6214479.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: '3',
      title: 'Free Broadband Installation',
      description: 'Waive installation fees for new broadband connections',
      pointsCost: 1200,
      value: '$80',
      expiryDate: '2025-04-15',
      category: 'Broadband',
      image: 'https://images.pexels.com/photos/4219654/pexels-photo-4219654.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: '4',
      title: '$50 Off Premium Headphones',
      description: 'Valid on selected premium audio accessories',
      pointsCost: 1500,
      value: '$50',
      expiryDate: '2025-03-15',
      category: 'Accessories',
      image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  const generatePersonalizedDiscounts = async () => {
    setLoading(true);
    try {
      // Fetch user interaction history to generate personalized recommendations
      const { data: interactions } = await supabase
        .from('user_interactions')
        .select('category_name, clicked_item_name')
        .not('clicked_item_name', 'is', null)
        .order('clicked_at', { ascending: false })
        .limit(50);

      // Analyze user preferences based on interaction history
      const categoryPreferences: { [key: string]: number } = {};
      const itemPreferences: { [key: string]: number } = {};

      interactions?.forEach(interaction => {
        const category = interaction.category_name?.toLowerCase() || '';
        const item = interaction.clicked_item_name?.toLowerCase() || '';
        
        categoryPreferences[category] = (categoryPreferences[category] || 0) + 1;
        itemPreferences[item] = (itemPreferences[item] || 0) + 1;
      });

      // Generate personalized discounts based on preferences
      const discounts: PersonalizedDiscount[] = [];

      // Mobile accessories recommendations
      if (categoryPreferences['mobile'] > 0 || Object.keys(itemPreferences).some(item => item.includes('iphone') || item.includes('samsung'))) {
        discounts.push({
          id: 'mobile-1',
          productName: 'Wireless Charging Pad',
          originalPrice: 89.90,
          discountedPrice: 67.43,
          discountPercentage: 25,
          pointsRequired: 300,
          category: 'Mobile Accessories',
          image: 'https://images.pexels.com/photos/4526414/pexels-photo-4526414.jpeg?auto=compress&cs=tinysrgb&w=400',
          reason: 'Based on your mobile device interests'
        });

        discounts.push({
          id: 'mobile-2',
          productName: 'Premium Phone Case',
          originalPrice: 49.90,
          discountedPrice: 34.93,
          discountPercentage: 30,
          pointsRequired: 200,
          category: 'Mobile Accessories',
          image: 'https://images.pexels.com/photos/1275229/pexels-photo-1275229.jpeg?auto=compress&cs=tinysrgb&w=400',
          reason: 'Perfect for your device protection needs'
        });
      }

      // Audio accessories for users interested in entertainment
      if (categoryPreferences['accessories'] > 0 || Object.keys(itemPreferences).some(item => item.includes('headphone') || item.includes('speaker'))) {
        discounts.push({
          id: 'audio-1',
          productName: 'Noise-Cancelling Headphones',
          originalPrice: 299.90,
          discountedPrice: 209.93,
          discountPercentage: 30,
          pointsRequired: 800,
          category: 'Audio',
          image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400',
          reason: 'Based on your audio accessory browsing'
        });
      }

      // Smart home accessories for broadband users
      if (categoryPreferences['broadband'] > 0 || categoryPreferences['fibre broadband'] > 0) {
        discounts.push({
          id: 'smart-1',
          productName: 'Smart WiFi Router',
          originalPrice: 199.90,
          discountedPrice: 139.93,
          discountPercentage: 30,
          pointsRequired: 600,
          category: 'Smart Home',
          image: 'https://images.pexels.com/photos/4219654/pexels-photo-4219654.jpeg?auto=compress&cs=tinysrgb&w=400',
          reason: 'Enhance your broadband experience'
        });
      }

      // TV accessories for entertainment enthusiasts
      if (categoryPreferences['tv'] > 0) {
        discounts.push({
          id: 'tv-1',
          productName: 'Streaming Device',
          originalPrice: 79.90,
          discountedPrice: 55.93,
          discountPercentage: 30,
          pointsRequired: 400,
          category: 'Entertainment',
          image: 'https://images.pexels.com/photos/1201996/pexels-photo-1201996.jpeg?auto=compress&cs=tinysrgb&w=400',
          reason: 'Perfect for your TV entertainment setup'
        });
      }

      // Default recommendations if no specific preferences
      if (discounts.length === 0) {
        discounts.push(
          {
            id: 'default-1',
            productName: 'Universal Phone Stand',
            originalPrice: 29.90,
            discountedPrice: 20.93,
            discountPercentage: 30,
            pointsRequired: 150,
            category: 'Accessories',
            image: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=400',
            reason: 'Popular choice among users'
          },
          {
            id: 'default-2',
            productName: 'Portable Power Bank',
            originalPrice: 59.90,
            discountedPrice: 41.93,
            discountPercentage: 30,
            pointsRequired: 250,
            category: 'Mobile Accessories',
            image: 'https://images.pexels.com/photos/4526414/pexels-photo-4526414.jpeg?auto=compress&cs=tinysrgb&w=400',
            reason: 'Essential for mobile users'
          }
        );
      }

      setPersonalizedDiscounts(discounts);
    } catch (error) {
      console.error('Error generating personalized discounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTier = () => {
    return tiers.find(tier => 
      userPoints >= tier.minPoints && 
      (tiers.indexOf(tier) === tiers.length - 1 || userPoints < tiers[tiers.indexOf(tier) + 1].minPoints)
    ) || tiers[0];
  };

  const getNextTier = () => {
    const currentTierIndex = tiers.findIndex(tier => tier.name === getCurrentTier().name);
    return currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null;
  };

  const getProgressToNextTier = () => {
    const nextTier = getNextTier();
    if (!nextTier) return 100;
    
    const currentTier = getCurrentTier();
    const progress = ((userPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100;
    return Math.min(progress, 100);
  };

  const renderOverview = () => {
    const currentTier = getCurrentTier();
    const nextTier = getNextTier();
    const progress = getProgressToNextTier();

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Points Balance Card */}
        <View style={styles.card}>
          <LinearGradient
            colors={[currentTier.color, currentTier.color + '80']}
            style={styles.pointsGradient}
          >
            <View style={styles.pointsHeader}>
              <View style={styles.pointsInfo}>
                <Text style={styles.pointsLabel}>Your Points Balance</Text>
                <View style={styles.pointsAmount}>
                  <Coins size={24} color="white" />
                  <Text style={styles.pointsValue}>{userPoints.toLocaleString()}</Text>
                </View>
              </View>
              <View style={styles.tierBadge}>
                <currentTier.icon size={20} color={currentTier.color} />
                <Text style={[styles.tierText, { color: currentTier.color }]}>{currentTier.name}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Tier Progress */}
        {nextTier && (
          <View style={styles.card}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Progress to {nextTier.name}</Text>
              <Text style={styles.progressPoints}>
                {nextTier.minPoints - userPoints} points to go
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: nextTier.color }]} />
            </View>
            <Text style={styles.progressText}>
              {Math.round(progress)}% complete • Earn {nextTier.multiplier}x points at {nextTier.name} tier
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction} onPress={() => setActiveTab('vouchers')}>
              <Gift size={24} color="#E60012" />
              <Text style={styles.quickActionText}>Redeem Vouchers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => setActiveTab('discounts')}>
              <Tag size={24} color="#FF6B35" />
              <Text style={styles.quickActionText}>View Discounts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => setActiveTab('tiers')}>
              <Trophy size={24} color="#4CAF50" />
              <Text style={styles.quickActionText}>View Tiers</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recent Points Activity</Text>
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <ShoppingBag size={16} color="#4CAF50" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Purchase Reward</Text>
                <Text style={styles.activityDate}>Today, 2:30 PM</Text>
              </View>
              <Text style={styles.activityPoints}>+150 pts</Text>
            </View>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Gift size={16} color="#E60012" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Voucher Redeemed</Text>
                <Text style={styles.activityDate}>Yesterday, 4:15 PM</Text>
              </View>
              <Text style={[styles.activityPoints, { color: '#E60012' }]}>-500 pts</Text>
            </View>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Star size={16} color="#FFD700" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Tier Bonus</Text>
                <Text style={styles.activityDate}>3 days ago</Text>
              </View>
              <Text style={styles.activityPoints}>+200 pts</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderVouchers = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Available Vouchers</Text>
        <Text style={styles.sectionSubtitle}>Redeem your points for exclusive rewards</Text>
      </View>

      {vouchers.map((voucher) => (
        <View key={voucher.id} style={styles.voucherCard}>
          <Image source={{ uri: voucher.image }} style={styles.voucherImage} />
          <View style={styles.voucherContent}>
            <View style={styles.voucherHeader}>
              <Text style={styles.voucherTitle}>{voucher.title}</Text>
              <View style={styles.voucherValue}>
                <Text style={styles.voucherValueText}>{voucher.value}</Text>
              </View>
            </View>
            <Text style={styles.voucherDescription}>{voucher.description}</Text>
            <View style={styles.voucherFooter}>
              <View style={styles.voucherInfo}>
                <Text style={styles.voucherCategory}>{voucher.category}</Text>
                <Text style={styles.voucherExpiry}>Expires: {voucher.expiryDate}</Text>
              </View>
              <TouchableOpacity 
                style={[
                  styles.redeemButton,
                  userPoints < voucher.pointsCost && styles.redeemButtonDisabled
                ]}
                disabled={userPoints < voucher.pointsCost}
              >
                <Coins size={16} color="white" />
                <Text style={styles.redeemButtonText}>{voucher.pointsCost} pts</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderDiscounts = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🤖 Personalized Discounts</Text>
        <Text style={styles.sectionSubtitle}>AI-curated deals based on your interests</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E60012" />
          <Text style={styles.loadingText}>Generating personalized recommendations...</Text>
        </View>
      ) : (
        personalizedDiscounts.map((discount) => (
          <View key={discount.id} style={styles.discountCard}>
            <Image source={{ uri: discount.image }} style={styles.discountImage} />
            <View style={styles.discountContent}>
              <View style={styles.discountHeader}>
                <Text style={styles.discountTitle}>{discount.productName}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountPercentage}>{discount.discountPercentage}% OFF</Text>
                </View>
              </View>
              
              <View style={styles.priceContainer}>
                <Text style={styles.originalPrice}>S${discount.originalPrice}</Text>
                <Text style={styles.discountedPrice}>S${discount.discountedPrice}</Text>
              </View>
              
              <View style={styles.reasonContainer}>
                <TrendingUp size={14} color="#4CAF50" />
                <Text style={styles.reasonText}>{discount.reason}</Text>
              </View>
              
              <View style={styles.discountFooter}>
                <Text style={styles.discountCategory}>{discount.category}</Text>
                <TouchableOpacity 
                  style={[
                    styles.claimButton,
                    userPoints < discount.pointsRequired && styles.claimButtonDisabled
                  ]}
                  disabled={userPoints < discount.pointsRequired}
                >
                  <Zap size={16} color="white" />
                  <Text style={styles.claimButtonText}>{discount.pointsRequired} pts</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      )}

      <TouchableOpacity style={styles.refreshButton} onPress={generatePersonalizedDiscounts}>
        <Text style={styles.refreshButtonText}>🔄 Refresh Recommendations</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderTiers = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Loyalty Tiers</Text>
        <Text style={styles.sectionSubtitle}>Unlock better rewards as you earn more points</Text>
      </View>

      {tiers.map((tier, index) => {
        const isCurrentTier = tier.name === getCurrentTier().name;
        const isUnlocked = userPoints >= tier.minPoints;
        
        return (
          <View key={tier.name} style={[
            styles.tierCard,
            isCurrentTier && styles.currentTierCard,
            { borderColor: tier.color }
          ]}>
            <View style={styles.tierHeader}>
              <View style={[styles.tierIconContainer, { backgroundColor: tier.bgColor }]}>
                <tier.icon size={24} color={tier.color} />
              </View>
              <View style={styles.tierInfo}>
                <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
                <Text style={styles.tierRequirement}>
                  {tier.minPoints === 0 ? 'Starting tier' : `${tier.minPoints}+ points`}
                </Text>
              </View>
              <View style={styles.tierMultiplier}>
                <Text style={styles.multiplierText}>{tier.multiplier}x</Text>
                <Text style={styles.multiplierLabel}>Points</Text>
              </View>
            </View>

            {isCurrentTier && (
              <View style={styles.currentTierBadge}>
                <Text style={styles.currentTierText}>CURRENT TIER</Text>
              </View>
            )}

            <View style={styles.tierBenefits}>
              {tier.benefits.map((benefit, benefitIndex) => (
                <View key={benefitIndex} style={styles.benefitItem}>
                  <View style={[styles.benefitDot, { backgroundColor: tier.color }]} />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>

            {!isUnlocked && (
              <View style={styles.lockedOverlay}>
                <Text style={styles.lockedText}>
                  {tier.minPoints - userPoints} points to unlock
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'vouchers', label: 'Vouchers', icon: Gift },
    { id: 'discounts', label: 'Discounts', icon: Tag },
    { id: 'tiers', label: 'Tiers', icon: Trophy },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Loyalty Points</Text>
        <TouchableOpacity style={styles.historyButton}>
          <Clock size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.activeTab]}
              onPress={() => setActiveTab(tab.id)}
            >
              <tab.icon size={16} color={activeTab === tab.id ? '#E60012' : '#666'} />
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'vouchers' && renderVouchers()}
        {activeTab === 'discounts' && renderDiscounts()}
        {activeTab === 'tiers' && renderTiers()}
      </View>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeTab: {
    backgroundColor: '#FFF3E0',
    borderColor: '#E60012',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#E60012',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  pointsGradient: {
    padding: 20,
  },
  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsInfo: {
    flex: 1,
  },
  pointsLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  pointsAmount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tierText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
    color: 'white',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressPoints: {
    fontSize: 14,
    color: '#666',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 20,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  activityList: {
    padding: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
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
  activityPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  voucherCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  voucherImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  voucherContent: {
    padding: 16,
  },
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  voucherTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  voucherValue: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  voucherValueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  voucherDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  voucherFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voucherInfo: {
    flex: 1,
  },
  voucherCategory: {
    fontSize: 12,
    color: '#E60012',
    fontWeight: '600',
  },
  voucherExpiry: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  redeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E60012',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  redeemButtonDisabled: {
    backgroundColor: '#ccc',
  },
  redeemButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  discountCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  discountImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  discountContent: {
    padding: 16,
  },
  discountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  discountTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  discountBadge: {
    backgroundColor: '#FFE0B2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountPercentage: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E65100',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountedPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E60012',
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  reasonText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  discountFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discountCategory: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  claimButtonDisabled: {
    backgroundColor: '#ccc',
  },
  claimButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  refreshButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#E60012',
    fontWeight: '600',
  },
  tierCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 15,
    padding: 20,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  currentTierCard: {
    backgroundColor: '#FFF8E1',
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  tierIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tierRequirement: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  tierMultiplier: {
    alignItems: 'center',
  },
  multiplierText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  multiplierLabel: {
    fontSize: 12,
    color: '#666',
  },
  currentTierBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentTierText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  tierBenefits: {
    marginTop: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  benefitText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  lockedText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
});