import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Gift, Star, Trophy, Crown, Zap, Tag, ShoppingBag, Clock, TrendingUp, Award, Coins, Users, Calendar, Target, Share2, CircleCheck as CheckCircle, Sparkles, Plus, CreditCard, Gem, Flame, Rocket } from 'lucide-react-native';
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
  isPremium?: boolean;
  monthlyFee?: number;
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
  isExclusive?: boolean;
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

interface PointsBooster {
  id: string;
  points: number;
  price: number;
  bonus: number;
  popular?: boolean;
}

export default function LoyaltyScreen() {
  const [activeTab, setActiveTab] = useState('overview');
  const [userPoints, setUserPoints] = useState(2450);
  const [userTier, setUserTier] = useState('Gold');
  const [isPremiumMember, setIsPremiumMember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [personalizedDiscounts, setPersonalizedDiscounts] = useState<PersonalizedDiscount[]>([]);
  const [user, setUser] = useState<any>(null);
  const [dailyLoginStreak, setDailyLoginStreak] = useState(3);
  const [hasClaimedToday, setHasClaimedToday] = useState(false);
  const [referralCode, setReferralCode] = useState('JOHN2025');
  const [totalReferrals, setTotalReferrals] = useState(5);

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

  // Featured voucher for points-to-goal tracking
  const featuredVoucher = {
    id: 'airpods-pro',
    title: 'AirPods Pro (2nd Gen)',
    description: 'Premium wireless earbuds with active noise cancellation',
    pointsCost: 2650,
    value: '$329',
    category: 'Audio',
    image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400'
  };

  const pointsBoosters: PointsBooster[] = [
    {
      id: 'starter',
      points: 500,
      price: 5,
      bonus: 0,
    },
    {
      id: 'popular',
      points: 1200,
      price: 10,
      bonus: 200,
      popular: true,
    },
    {
      id: 'premium',
      points: 2500,
      price: 20,
      bonus: 500,
    },
    {
      id: 'mega',
      points: 5500,
      price: 40,
      bonus: 1500,
    }
  ];

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
      name: 'Gold+',
      minPoints: 2500,
      multiplier: 2.0,
      color: '#FF6B35',
      bgColor: '#FFF3E0',
      icon: Gem,
      isPremium: true,
      monthlyFee: 9.99,
      benefits: ['2x points on purchases', 'Exclusive premium vouchers', 'Concierge services', 'Priority everything', 'Monthly bonus points', 'VIP events access']
    },
    {
      name: 'Platinum',
      minPoints: 5000,
      multiplier: 2.5,
      color: '#E5E4E2',
      bgColor: '#FAFAFA',
      icon: Crown,
      benefits: ['2.5x points on purchases', 'Dedicated account manager', 'Exclusive events access', 'Free premium shipping', 'Quarterly bonus rewards']
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
      title: 'Premium Concierge Service',
      description: 'Personal shopping assistant for tech purchases',
      pointsCost: 2000,
      value: '$100',
      expiryDate: '2025-04-15',
      category: 'Premium',
      image: 'https://images.pexels.com/photos/4219654/pexels-photo-4219654.jpeg?auto=compress&cs=tinysrgb&w=400',
      isExclusive: true
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
      if (categoryPreferences['mobile'] > 0 || categoryPreferences['accessories'] > 0 || Object.keys(itemPreferences).some(item => item.includes('iphone') || item.includes('samsung') || item.includes('headphone') || item.includes('case'))) {
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
      if (categoryPreferences['accessories'] > 0 || categoryPreferences['devices & gadgets'] > 0 || Object.keys(itemPreferences).some(item => item.includes('headphone') || item.includes('speaker') || item.includes('audio'))) {
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

        discounts.push({
          id: 'audio-2',
          productName: 'Wireless Earbuds',
          originalPrice: 149.90,
          discountedPrice: 104.93,
          discountPercentage: 30,
          pointsRequired: 400,
          category: 'Audio',
          image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400',
          reason: 'Great for your audio needs'
        });
      }

      // Gaming and tech accessories
      if (categoryPreferences['accessories'] > 0 || Object.keys(itemPreferences).some(item => item.includes('gaming') || item.includes('tech'))) {
        discounts.push({
          id: 'gaming-1',
          productName: 'Gaming Mouse Pad',
          originalPrice: 39.90,
          discountedPrice: 27.93,
          discountPercentage: 30,
          pointsRequired: 180,
          category: 'Gaming',
          image: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=400',
          reason: 'Perfect for your tech setup'
        });
      }

      // Default recommendations if no specific preferences
      if (discounts.length === 0) {
        discounts.push(
          {
            id: 'default-1',
            productName: 'Phone Car Mount',
            originalPrice: 49.90,
            discountedPrice: 34.93,
            discountPercentage: 30,
            pointsRequired: 200,
            category: 'Accessories',
            image: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=400',
            reason: 'Essential mobile accessory'
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
    if (isPremiumMember) {
      return tiers.find(tier => tier.name === 'Gold+') || tiers[2];
    }
    return tiers.find(tier => 
      !tier.isPremium && userPoints >= tier.minPoints && 
      (tiers.indexOf(tier) === tiers.length - 1 || userPoints < tiers[tiers.indexOf(tier) + 1].minPoints)
    ) || tiers[0];
  };

  const getNextTier = () => {
    const currentTier = getCurrentTier();
    if (currentTier.name === 'Gold' && !isPremiumMember) {
      return tiers.find(tier => tier.name === 'Platinum');
    }
    const currentTierIndex = tiers.findIndex(tier => tier.name === currentTier.name);
    return currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null;
  };

  const getProgressToNextTier = () => {
    const nextTier = getNextTier();
    if (!nextTier) return 100;
    
    const currentTier = getCurrentTier();
    const progress = ((userPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100;
    return Math.min(progress, 100);
  };

  const claimDailyReward = () => {
    if (!hasClaimedToday) {
      const baseReward = 50;
      const streakBonus = Math.min(dailyLoginStreak * 5, 50);
      const premiumMultiplier = isPremiumMember ? 2 : 1;
      const totalReward = (baseReward + streakBonus) * premiumMultiplier;
      
      setUserPoints(prev => prev + totalReward);
      setHasClaimedToday(true);
      setDailyLoginStreak(prev => prev + 1);
    }
  };

  const shareReferralCode = () => {
    console.log('Sharing referral code:', referralCode);
  };

  const purchasePointsBooster = (booster: PointsBooster) => {
    console.log('Purchasing points booster:', booster);
    // In a real app, this would integrate with payment processing
    setUserPoints(prev => prev + booster.points + booster.bonus);
  };

  const upgradeToPremium = () => {
    console.log('Upgrading to Gold+ Premium');
    setIsPremiumMember(true);
  };

  const renderOverview = () => {
    const currentTier = getCurrentTier();
    const nextTier = getNextTier();
    const progress = getProgressToNextTier();
    const pointsToFeaturedVoucher = Math.max(0, featuredVoucher.pointsCost - userPoints);

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Premium Upgrade Banner */}
        {!isPremiumMember && (
          <TouchableOpacity style={styles.premiumBanner} onPress={upgradeToPremium}>
            <LinearGradient
              colors={['#FF6B35', '#E60012']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.premiumGradient}
            >
              <View style={styles.premiumContent}>
                <View style={styles.premiumLeft}>
                  <View style={styles.premiumIconContainer}>
                    <Gem size={24} color="white" />
                    <Sparkles size={16} color="#FFD700" style={styles.sparkleIcon} />
                  </View>
                  <View style={styles.premiumText}>
                    <Text style={styles.premiumTitle}>Upgrade to Gold+</Text>
                    <Text style={styles.premiumSubtitle}>2x points • Exclusive perks • $9.99/month</Text>
                  </View>
                </View>
                <View style={styles.premiumButton}>
                  <Text style={styles.premiumButtonText}>Upgrade</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Points Balance Card */}
        <View style={styles.card}>
          <LinearGradient
            colors={isPremiumMember ? ['#FF6B35', '#E60012'] : [currentTier.color, currentTier.color + '80']}
            style={styles.pointsGradient}
          >
            <View style={styles.pointsHeader}>
              <View style={styles.pointsInfo}>
                <Text style={styles.pointsLabel}>Your Points Balance</Text>
                <View style={styles.pointsAmount}>
                  <Coins size={28} color="white" />
                  <Text style={styles.pointsValue}>{userPoints.toLocaleString()}</Text>
                  {isPremiumMember && <Gem size={20} color="#FFD700" style={styles.premiumGem} />}
                </View>
              </View>
              <View style={[styles.tierBadge, isPremiumMember && styles.premiumTierBadge]}>
                <currentTier.icon size={20} color="white" />
                <Text style={styles.tierText}>{currentTier.name}</Text>
                {isPremiumMember && <Sparkles size={14} color="#FFD700" />}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Points Boosters */}
        <View style={styles.card}>
          <View style={styles.boosterHeader}>
            <Rocket size={20} color="#E60012" />
            <Text style={styles.boosterTitle}>🚀 Points Boosters</Text>
            <Text style={styles.boosterSubtitle}>Get points instantly!</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.boosterScroll}>
            {pointsBoosters.map((booster) => (
              <TouchableOpacity 
                key={booster.id} 
                style={[styles.boosterCard, booster.popular && styles.popularBooster]}
                onPress={() => purchasePointsBooster(booster)}
              >
                {booster.popular && (
                  <View style={styles.popularBadge}>
                    <Flame size={12} color="white" />
                    <Text style={styles.popularText}>POPULAR</Text>
                  </View>
                )}
                
                <View style={styles.boosterContent}>
                  <Text style={styles.boosterPoints}>{booster.points.toLocaleString()}</Text>
                  <Text style={styles.boosterPointsLabel}>Points</Text>
                  
                  {booster.bonus > 0 && (
                    <View style={styles.bonusContainer}>
                      <Text style={styles.bonusText}>+{booster.bonus} Bonus!</Text>
                    </View>
                  )}
                  
                  <View style={styles.boosterPrice}>
                    <Text style={styles.boosterPriceText}>S${booster.price}</Text>
                  </View>
                  
                  <View style={styles.boosterButton}>
                    <CreditCard size={14} color="white" />
                    <Text style={styles.boosterButtonText}>Buy Now</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
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

        {/* Points to Goal Tracker */}
        <View style={styles.card}>
          <View style={styles.goalHeader}>
            <Target size={20} color="#E60012" />
            <Text style={styles.goalTitle}>🎯 Featured Reward</Text>
          </View>
          
          <View style={styles.goalContent}>
            <Image source={{ uri: featuredVoucher.image }} style={styles.goalImage} />
            <View style={styles.goalInfo}>
              <Text style={styles.goalItemName}>{featuredVoucher.title}</Text>
              <Text style={styles.goalItemValue}>{featuredVoucher.value}</Text>
              
              {pointsToFeaturedVoucher > 0 ? (
                <View style={styles.goalProgress}>
                  <Text style={styles.goalProgressText}>
                    {pointsToFeaturedVoucher} more points to redeem
                  </Text>
                  <View style={styles.goalProgressBar}>
                    <View style={[
                      styles.goalProgressFill, 
                      { width: `${Math.min((userPoints / featuredVoucher.pointsCost) * 100, 100)}%` }
                    ]} />
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.goalRedeemButton}>
                  <CheckCircle size={16} color="white" />
                  <Text style={styles.goalRedeemText}>Ready to Redeem!</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
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

        {/* Earn More Points */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>💰 Earn More Points</Text>
          
          {/* Daily Login Reward */}
          <View style={styles.earnSection}>
            <View style={styles.earnItem}>
              <View style={styles.earnIcon}>
                <Calendar size={20} color="#4CAF50" />
              </View>
              <View style={styles.earnContent}>
                <Text style={styles.earnTitle}>Daily Login Reward</Text>
                <Text style={styles.earnDescription}>
                  {hasClaimedToday 
                    ? `Claimed today! Come back tomorrow for ${(50 + Math.min((dailyLoginStreak + 1) * 5, 50)) * (isPremiumMember ? 2 : 1)} points`
                    : `Earn ${(50 + Math.min(dailyLoginStreak * 5, 50)) * (isPremiumMember ? 2 : 1)} points (${dailyLoginStreak} day streak)`
                  }
                </Text>
                <View style={styles.streakContainer}>
                  <Text style={styles.streakText}>🔥 {dailyLoginStreak} day streak</Text>
                  {isPremiumMember && <Text style={styles.premiumMultiplier}>💎 2x Premium Bonus</Text>}
                </View>
              </View>
              <TouchableOpacity 
                style={[styles.earnButton, hasClaimedToday && styles.earnButtonDisabled]}
                onPress={claimDailyReward}
                disabled={hasClaimedToday}
              >
                <Text style={[styles.earnButtonText, hasClaimedToday && styles.earnButtonTextDisabled]}>
                  {hasClaimedToday ? 'Claimed' : 'Claim'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Friend Referrals */}
          <View style={styles.earnSection}>
            <View style={styles.earnItem}>
              <View style={styles.earnIcon}>
                <Users size={20} color="#FF6B35" />
              </View>
              <View style={styles.earnContent}>
                <Text style={styles.earnTitle}>Refer Friends</Text>
                <Text style={styles.earnDescription}>
                  Earn {isPremiumMember ? '1000' : '500'} points for each friend who signs up with your code
                </Text>
                <View style={styles.referralStats}>
                  <Text style={styles.referralCode}>Your code: {referralCode}</Text>
                  <Text style={styles.referralCount}>👥 {totalReferrals} friends referred</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.shareButton} onPress={shareReferralCode}>
                <Share2 size={16} color="white" />
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📊 Recent Points Activity</Text>
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <ShoppingBag size={16} color="#4CAF50" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Purchase Reward</Text>
                <Text style={styles.activityDate}>Today, 2:30 PM</Text>
              </View>
              <Text style={styles.activityPoints}>+{isPremiumMember ? '300' : '150'} pts</Text>
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
                <Text style={styles.activityTitle}>Daily Login Bonus</Text>
                <Text style={styles.activityDate}>3 days ago</Text>
              </View>
              <Text style={styles.activityPoints}>+{isPremiumMember ? '200' : '100'} pts</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderVouchers = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🎁 Available Vouchers</Text>
        <Text style={styles.sectionSubtitle}>Redeem your points for exclusive rewards</Text>
      </View>

      {vouchers.map((voucher) => (
        <View key={voucher.id} style={[styles.voucherCard, voucher.isExclusive && styles.exclusiveVoucher]}>
          {voucher.isExclusive && (
            <View style={styles.exclusiveBadge}>
              <Gem size={12} color="white" />
              <Text style={styles.exclusiveText}>PREMIUM EXCLUSIVE</Text>
            </View>
          )}
          
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
                  userPoints < voucher.pointsCost && styles.redeemButtonDisabled,
                  voucher.isExclusive && styles.exclusiveRedeemButton
                ]}
                disabled={userPoints < voucher.pointsCost || (voucher.isExclusive && !isPremiumMember)}
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
        <Text style={styles.sectionTitle}>🤖 Smart Accessory Deals</Text>
        <Text style={styles.sectionSubtitle}>AI-curated accessory discounts based on your interests</Text>
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
        <Text style={styles.sectionTitle}>🏆 Loyalty Tiers</Text>
        <Text style={styles.sectionSubtitle}>Unlock better rewards as you earn more points</Text>
      </View>

      {tiers.map((tier, index) => {
        const isCurrentTier = tier.name === getCurrentTier().name;
        const isUnlocked = userPoints >= tier.minPoints || (tier.isPremium && isPremiumMember);
        
        return (
          <View key={tier.name} style={[
            styles.tierCard,
            isCurrentTier && styles.currentTierCard,
            tier.isPremium && styles.premiumTierCard,
            { borderColor: tier.color }
          ]}>
            <View style={styles.tierHeader}>
              <View style={[styles.tierIconContainer, { backgroundColor: tier.bgColor }]}>
                <tier.icon size={24} color={tier.color} />
                {tier.isPremium && <Sparkles size={16} color="#FFD700" style={styles.tierSparkle} />}
              </View>
              <View style={styles.tierInfo}>
                <View style={styles.tierNameContainer}>
                  <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
                  {tier.isPremium && (
                    <View style={styles.premiumTierBadge}>
                      <Text style={styles.premiumTierText}>PREMIUM</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.tierRequirement}>
                  {tier.isPremium 
                    ? `$${tier.monthlyFee}/month subscription`
                    : tier.minPoints === 0 
                      ? 'Starting tier' 
                      : `${tier.minPoints}+ points`
                  }
                </Text>
              </View>
              <View style={styles.tierMultiplier}>
                <Text style={styles.multiplierText}>{tier.multiplier}x</Text>
                <Text style={styles.multiplierLabel}>Points</Text>
              </View>
            </View>

            {isCurrentTier && (
              <View style={[styles.currentTierBadge, tier.isPremium && styles.premiumCurrentBadge]}>
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

            {tier.isPremium && !isPremiumMember && (
              <TouchableOpacity style={styles.upgradePremiumButton} onPress={upgradeToPremium}>
                <Gem size={16} color="white" />
                <Text style={styles.upgradePremiumText}>Upgrade to Premium</Text>
              </TouchableOpacity>
            )}

            {!isUnlocked && !tier.isPremium && (
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
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>💎 Loyalty Points</Text>
          {isPremiumMember && (
            <View style={styles.premiumHeaderBadge}>
              <Gem size={12} color="#FFD700" />
              <Text style={styles.premiumHeaderText}>PREMIUM</Text>
            </View>
          )}
        </View>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  premiumHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  premiumHeaderText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 4,
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
  premiumBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  premiumGradient: {
    padding: 20,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  premiumIconContainer: {
    position: 'relative',
    marginRight: 15,
  },
  sparkleIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  premiumText: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  premiumSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  premiumButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  premiumButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
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
  premiumGem: {
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
  premiumTierBadge: {
    backgroundColor: 'rgba(255,215,0,0.2)',
  },
  tierText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
    color: 'white',
  },
  boosterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  boosterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  boosterSubtitle: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  boosterScroll: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  boosterCard: {
    width: 140,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  popularBooster: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF3E0',
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    right: 8,
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 1,
  },
  popularText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  boosterContent: {
    alignItems: 'center',
  },
  boosterPoints: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E60012',
  },
  boosterPointsLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  bonusContainer: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 8,
  },
  bonusText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  boosterPrice: {
    marginBottom: 10,
  },
  boosterPriceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  boosterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E60012',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  boosterButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
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
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  goalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  goalImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 15,
  },
  goalInfo: {
    flex: 1,
  },
  goalItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  goalItemValue: {
    fontSize: 14,
    color: '#E60012',
    fontWeight: '600',
    marginBottom: 8,
  },
  goalProgress: {
    marginTop: 8,
  },
  goalProgressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  goalProgressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: '#E60012',
    borderRadius: 3,
  },
  goalRedeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  goalRedeemText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  earnSection: {
    marginBottom: 20,
  },
  earnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  earnIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  earnContent: {
    flex: 1,
  },
  earnTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  earnDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakText: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
  },
  premiumMultiplier: {
    fontSize: 12,
    color: '#E60012',
    fontWeight: '600',
  },
  earnButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  earnButtonDisabled: {
    backgroundColor: '#ccc',
  },
  earnButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  earnButtonTextDisabled: {
    color: '#999',
  },
  referralStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  referralCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E60012',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  referralCount: {
    fontSize: 12,
    color: '#666',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
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
    position: 'relative',
  },
  exclusiveVoucher: {
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  exclusiveBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  exclusiveText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
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
  exclusiveRedeemButton: {
    backgroundColor: '#FF6B35',
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
  premiumTierCard: {
    backgroundColor: '#FFF3E0',
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
    position: 'relative',
  },
  tierSparkle: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  tierInfo: {
    flex: 1,
  },
  tierNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  premiumTierBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  premiumTierText: {
    fontSize: 10,
    color: 'white',
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
  premiumCurrentBadge: {
    backgroundColor: '#FF6B35',
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
  upgradePremiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 15,
  },
  upgradePremiumText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
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