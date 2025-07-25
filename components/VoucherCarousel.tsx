import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { Gift, Star, Clock, ArrowRight, Sparkles } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rsqytbhetidgzpsifhiv.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzcXl0YmhldGlkZ3pwc2lmaGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NzczMzMsImV4cCI6MjA2NzM1MzMzM30.Y9S4HRe2XVqDCF93zCKcqfXHHLd3symW1knj9uAyIiQ';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Voucher {
  id: string;
  title: string;
  description: string;
  points_cost: number;
  value: string;
  category: string;
  expiry_date: string;
  is_new?: boolean;
  expires_soon?: boolean;
}

interface VoucherCarouselProps {
  userId?: string;
  onViewMore: () => void;
}

export default function VoucherCarousel({ userId, onViewMore }: VoucherCarouselProps) {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(0);
  const [platinumVouchers, setPlatinumVouchers] = useState<Voucher[]>([]);
  const [recommendedVouchers, setRecommendedVouchers] = useState<Voucher[]>([]);

  useEffect(() => {
    fetchVouchers();
    generatePlatinumVouchers();
    if (userId) {
      fetchUserPoints();
    }
  }, [userId]);

  const fetchUserPoints = async () => {
    if (!userId) return;
    
    try {
      const { data } = await supabase
        .from('user_loyalty_points')
        .select('total_points')
        .eq('user_id', userId)
        .single();
      
      setUserPoints(data?.total_points || 0);
    } catch (error) {
      console.error('Error fetching user points:', error);
    }
  };

  const generatePlatinumVouchers = () => {
    const platinumVouchers: Voucher[] = [
      {
        id: 'platinum-audio-master',
        title: '🎧 Premium Audio Master Collection',
        description: 'Sony WH-1000XM5 + AirPods Pro 2 + Bose QuietComfort + Premium audio cables',
        points_cost: 0,
        value: '$800 Value',
        category: 'Platinum Audio',
        expiry_date: '2025-12-31',
        is_new: true
      },
      {
        id: 'platinum-iphone-pro',
        title: '📱 Ultimate iPhone Pro Package',
        description: 'iPhone 15 Pro Max + MagSafe accessories + Premium case + AppleCare+',
        points_cost: 0,
        value: '$1,200 Value',
        category: 'Platinum Mobile',
        expiry_date: '2025-12-31',
        is_new: true
      },
      {
        id: 'platinum-gaming-elite',
        title: '🎮 Gaming Elite Setup',
        description: 'Gaming chair + Mechanical keyboard + Gaming mouse + 4K monitor + Headset',
        points_cost: 0,
        value: '$2,500 Value',
        category: 'Platinum Gaming',
        expiry_date: '2025-12-31',
        is_new: true
      }
    ];
    
    setPlatinumVouchers(platinumVouchers);
  };

  const isPlatinumVoucher = (voucher: Voucher) => {
    return voucher.category?.includes('Platinum') || 
           voucher.category?.includes('VIP') || 
           voucher.category?.includes('Premium Tech') || 
           voucher.category?.includes('Audio Pro') ||
           voucher.id?.startsWith('platinum-');
  };

  const handlePlatinumVoucher = (voucher: Voucher) => {
    // Handle platinum voucher click with upgrade prompt
    console.log('Platinum voucher clicked:', voucher.title);
  };

  const fetchVouchers = async () => {
    try {
      // Get user interactions and chat messages for comprehensive analysis
      const { data: interactions } = await supabase
        .from('user_interactions')
        .select('category_id, clicked_item_name')
        .not('clicked_item_name', 'is', null)
        .order('clicked_at', { ascending: false })
        .limit(100);

      // Get chat messages for additional context
      const { data: chatMessages } = await supabase
        .from('chat_messages')
        .select('content, role')
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(50);

      // Analyze user preferences from both sources
      const userPreferences = analyzeUserPreferences(interactions || [], chatMessages || []);

      // Get all active vouchers
      const { data: allVouchers } = await supabase
        .from('loyalty_vouchers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!allVouchers) return;

      // Add smart vouchers based on user behavior
      const smartVouchers = generateSmartVouchers(userPreferences, chatMessages || []);
      
      // Combine and score vouchers
      const combinedVouchers = [...platinumVouchers, ...smartVouchers, ...allVouchers];
      const scoredVouchers = scoreVouchersForUser(combinedVouchers, userPreferences);

      // Mark new and expiring soon vouchers
      const enhancedVouchers = scoredVouchers.map(voucher => ({
        ...voucher,
        is_new: isNewVoucher(voucher.created_at || new Date().toISOString()),
        expires_soon: isExpiringSoon(voucher.expiry_date)
      }));

      // Sort by relevance and take top 8
      setVouchers(enhancedVouchers.slice(0, 8));
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeUserPreferences = (interactions: any[], chatMessages: any[]) => {
    const preferences: { [key: string]: number } = {};
    const chatKeywords: { [key: string]: number } = {};
    
    interactions.forEach(interaction => {
      const category = interaction.category_id?.toLowerCase() || '';
      const item = interaction.clicked_item_name?.toLowerCase() || '';
      
      // Category preferences
      if (category) {
        preferences[category] = (preferences[category] || 0) + 1;
      }
      
      // Item-based preferences
      if (item.includes('iphone') || item.includes('apple')) {
        preferences['premium_mobile'] = (preferences['premium_mobile'] || 0) + 2;
      }
      if (item.includes('headphone') || item.includes('audio')) {
        preferences['audio'] = (preferences['audio'] || 0) + 2;
      }
      if (item.includes('netflix') || item.includes('disney') || item.includes('streaming')) {
        preferences['entertainment'] = (preferences['entertainment'] || 0) + 2;
      }
      if (item.includes('security') || item.includes('protection')) {
        preferences['security'] = (preferences['security'] || 0) + 2;
      }
      if (item.includes('broadband') || item.includes('wifi')) {
        preferences['connectivity'] = (preferences['connectivity'] || 0) + 2;
      }
    });

    // Analyze chat messages for subscription and accessory interests
    chatMessages.forEach(message => {
      const content = message.content?.toLowerCase() || '';
      
      // Subscription keywords
      if (content.includes('netflix') || content.includes('streaming') || content.includes('disney')) {
        chatKeywords['entertainment_subscription'] = (chatKeywords['entertainment_subscription'] || 0) + 1;
      }
      if (content.includes('music') || content.includes('spotify') || content.includes('apple music')) {
        chatKeywords['music_subscription'] = (chatKeywords['music_subscription'] || 0) + 1;
      }
      if (content.includes('security') || content.includes('antivirus') || content.includes('protection')) {
        chatKeywords['security_subscription'] = (chatKeywords['security_subscription'] || 0) + 1;
      }
      
      // Accessory keywords
      if (content.includes('headphone') || content.includes('earphone') || content.includes('audio')) {
        chatKeywords['audio_accessories'] = (chatKeywords['audio_accessories'] || 0) + 1;
      }
      if (content.includes('case') || content.includes('charger') || content.includes('cable')) {
        chatKeywords['mobile_accessories'] = (chatKeywords['mobile_accessories'] || 0) + 1;
      }
    });

    return { ...preferences, ...chatKeywords };
  };

  const generateSmartVouchers = (userPreferences: any, chatMessages: any[]): Voucher[] => {
    const smartVouchers: Voucher[] = [];

    // SUBSCRIPTION BUNDLES
    
    // Entertainment Subscription Bundle
    if (userPreferences['entertainment_subscription'] > 0 || userPreferences['entertainment'] > 1) {
      smartVouchers.push({
        id: 'smart-entertainment-subscription',
        title: '🎬 Ultimate Streaming Bundle',
        description: 'Netflix Premium + Disney+ + HBO Max + Apple TV+ for 12 months',
        points_cost: 2500,
        value: '$240 Value',
        category: 'Entertainment Subscription',
        expiry_date: '2025-03-31',
        is_new: true
      });
    }

    // Music Subscription Bundle
    if (userPreferences['music_subscription'] > 0 || userPreferences['audio'] > 2) {
      smartVouchers.push({
        id: 'smart-music-subscription',
        title: '🎵 Premium Music Bundle',
        description: 'Spotify Premium + Apple Music + YouTube Music for 12 months',
        points_cost: 1800,
        value: '$180 Value',
        category: 'Music Subscription',
        expiry_date: '2025-04-15',
        is_new: true
      });
    }

    // Security Subscription Bundle
    if (userPreferences['security_subscription'] > 0 || userPreferences['security'] > 1) {
      smartVouchers.push({
        id: 'smart-security-subscription',
        title: '🛡️ Complete Security Suite',
        description: 'McAfee Total Protection + VPN + Identity Monitoring for 24 months',
        points_cost: 2200,
        value: '$300 Value',
        category: 'Security Subscription',
        expiry_date: '2025-03-20',
        is_new: true
      });
    }

    // ACCESSORIES BUNDLES
    
    // Audio Accessories Kit
    if (userPreferences['audio_accessories'] > 0 || userPreferences['audio'] > 2) {
      smartVouchers.push({
        id: 'smart-audio-accessories',
        title: '🎧 Premium Audio Accessories Kit',
        description: 'Sony WH-1000XM5 + AirPods Pro + Portable speaker + Audio cables',
        points_cost: 3200,
        value: '$450 Value',
        category: 'Audio Accessories',
        expiry_date: '2025-05-01',
        is_new: true
      });
    }

    // Mobile Accessories Kit
    if (userPreferences['mobile_accessories'] > 0 || userPreferences['premium_mobile'] > 2) {
      smartVouchers.push({
        id: 'smart-mobile-accessories',
        title: '📱 Ultimate Mobile Accessories Bundle',
        description: 'MagSafe charger + Premium case + Screen protector + Car mount + Power bank',
        points_cost: 2400,
        value: '$320 Value',
        category: 'Mobile Accessories',
        expiry_date: '2025-03-15',
        is_new: true
      });
    }

    // Smart Home Accessories Kit
    if (userPreferences['connectivity'] > 1 || userPreferences['broadband'] > 1) {
      smartVouchers.push({
        id: 'smart-home-accessories',
        title: '🏠 Smart Home Starter Kit',
        description: 'Smart speakers + Smart plugs + Security camera + Smart lights',
        points_cost: 3500,
        value: '$480 Value',
        category: 'Smart Home Accessories',
        expiry_date: '2025-04-30',
        is_new: true
      });
    }

    return smartVouchers;
  };

  const scoreVouchersForUser = (vouchers: Voucher[], preferences: any) => {
    return vouchers.map(voucher => {
      let score = 0;
      const category = voucher.category.toLowerCase();
      
      // Score based on user preferences
      if (preferences[category]) {
        score += preferences[category] * 10;
      }
      
      // Boost score for expiring soon vouchers
      if (isExpiringSoon(voucher.expiry_date)) {
        score += 20;
      }
      
      // Boost score for new vouchers
      if (voucher.is_new) {
        score += 15;
      }
      
      return { ...voucher, score };
    }).sort((a, b) => (b.score || 0) - (a.score || 0));
  };

  const isNewVoucher = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const daysDiff = (now.getTime() - created.getTime()) / (1000 * 3600 * 24);
    return daysDiff <= 7;
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysDiff = (expiry.getTime() - now.getTime()) / (1000 * 3600 * 24);
    return daysDiff <= 14 && daysDiff > 0;
  };

  const canAffordVoucher = (pointsCost: number) => {
    return userPoints >= pointsCost;
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'audio': return '🎧';
      case 'entertainment': return '🎬';
      case 'mobile': return '📱';
      case 'accessories': return '🔌';
      case 'broadband': return '🌐';
      case 'security': return '🛡️';
      default: return '🎁';
    }
  };

  const renderVoucherCard = (voucher: Voucher) => {
    const canAfford = canAffordVoucher(voucher.points_cost);
    const isSubscription = voucher.category?.toLowerCase().includes('subscription');
    const isPlatinum = isPlatinumVoucher(voucher);
    
    return (
      <TouchableOpacity
        key={voucher.id}
        style={[
          styles.voucherCard,
          isSubscription && styles.subscriptionVoucherCard,
          isPlatinum && styles.platinumVoucherCard,
          !canAfford && styles.disabledCard
        ]}
        onPress={() => isPlatinum ? handlePlatinumVoucher(voucher) : undefined}
      >
        {voucher.is_new && (
          <View style={styles.newBadge}>
            <Sparkles size={12} color="white" />
            <Text style={styles.newText}>NEW</Text>
          </View>
        )}
        
        {isPlatinum && (
          <View style={styles.platinumBadge}>
            <Star size={10} color="white" />
            <Text style={styles.platinumText}>PLATINUM EXCLUSIVE</Text>
          </View>
        )}
        
        {isSubscription && (
          <View style={styles.subscriptionIndicator}>
            <Star size={10} color="white" />
            <Text style={styles.subscriptionIndicatorText}>SUBSCRIPTION</Text>
          </View>
        )}
        
        {voucher.expires_soon && (
          <View style={styles.urgentBadge}>
            <Clock size={12} color="white" />
            <Text style={styles.urgentText}>EXPIRES SOON</Text>
          </View>
        )}

        <View style={styles.cardHeader}>
          <Text style={styles.categoryIcon}>{getCategoryIcon(voucher.category)}</Text>
          <View style={styles.pointsContainer}>
            <Text style={[styles.pointsText, !canAfford && styles.disabledText]}>
              {isPlatinum ? 'PLATINUM' : voucher.points_cost}
            </Text>
            <Text style={styles.pointsLabel}>{isPlatinum ? 'ONLY' : 'pts'}</Text>
          </View>
        </View>

        <Text style={[styles.voucherTitle, !canAfford && styles.disabledText]} numberOfLines={2}>
          {voucher.title}
        </Text>
        
        <Text style={styles.voucherDescription} numberOfLines={2}>
          {voucher.description}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.valueText}>{voucher.value}</Text>
          <Text style={styles.categoryText}>{voucher.category}</Text>
        </View>

        <View style={[styles.affordabilityIndicator, canAfford && styles.affordableIndicator]}>
          <Text style={[styles.affordabilityText, canAfford && styles.affordableText]}>
            {isPlatinum ? '👑 Upgrade to Platinum' : canAfford ? (isSubscription ? '✓ Can Subscribe' : '✓ Can Redeem') : 'Need More Points'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Gift size={20} color="#E60012" />
          <Text style={styles.title}>Featured Vouchers</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#E60012" />
          <Text style={styles.loadingText}>Loading personalized vouchers...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.carouselContainer}>
      {userId && (
        <View style={styles.pointsInfo}>
          <Star size={16} color="#FFD700" />
          <Text style={styles.pointsInfoText}>You have {userPoints} points</Text>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {vouchers.map(renderVoucherCard)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  carouselContainer: {
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  pointsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE4CC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  pointsInfoText: {
    fontSize: 15,
    color: '#E65100',
    fontWeight: '700',
    marginLeft: 6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  scrollContainer: {
    paddingRight: 24,
  },
  voucherCard: {
    width: 240,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  subscriptionVoucherCard: {
    borderColor: '#8A2BE2',
    backgroundColor: '#FAFBFF',
    shadowColor: '#8A2BE2',
  },
  platinumVoucherCard: {
    borderColor: '#8A2BE2',
    backgroundColor: 'linear-gradient(135deg, #F8F0FF 0%, #FFF8F0 100%)',
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  platinumBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#8A2BE2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  platinumText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
    marginLeft: 2,
    letterSpacing: 0.3,
  },
  disabledCard: {
    opacity: 0.7,
    backgroundColor: '#F8F9FA',
  },
  newBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    zIndex: 1,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  newText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  subscriptionIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#8A2BE2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  subscriptionIndicatorText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
    marginLeft: 3,
    letterSpacing: 0.5,
  },
  urgentBadge: {
    position: 'absolute',
    top: 50,
    right: 12,
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    zIndex: 1,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  urgentText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 12,
  },
  categoryIcon: {
    fontSize: 26,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E60012',
    letterSpacing: -0.3,
  },
  pointsLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  disabledText: {
    color: '#999',
  },
  voucherTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  voucherDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 14,
    fontWeight: '400',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  valueText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4CAF50',
    letterSpacing: -0.1,
  },
  categoryText: {
    fontSize: 10,
    color: '#999',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  affordabilityIndicator: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  affordableIndicator: {
    backgroundColor: '#E8F5E8',
    borderColor: '#C8E6C9',
  },
  affordabilityText: {
    fontSize: 12,
    color: '#E60012',
    fontWeight: '500',
    lineHeight: 14,
  },
  affordableText: {
    color: '#4CAF50',
  },
});