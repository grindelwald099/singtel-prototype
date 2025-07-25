import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { Gift, Star, Sparkles, TrendingUp, Calendar, ShoppingBag, Headphones, Tv, Shield, Wifi, Smartphone, CircleCheck as CheckCircle } from 'lucide-react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface Voucher {
  id: string;
  title: string;
  description: string;
  points_cost: number;
  value: string;
  category: string;
  expiry_date: string;
  is_active: boolean;
  created_at?: string;
  recommendation_score?: number;
  recommendation_reason?: string;
}

interface RewardsSectionProps {
  userId?: string;
  userPoints?: number;
}

export default function RewardsSection({ userId, userPoints = 2400 }: RewardsSectionProps) {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [recommendedVoucherIds, setRecommendedVoucherIds] = useState<Set<string>>(new Set());
  const [platinumVouchers, setPlatinumVouchers] = useState<Voucher[]>([]);

  useEffect(() => {
    fetchVouchers();
    generatePlatinumVouchers();
  }, [userId]);

  useEffect(() => {
    const checkForAccessoryClicks = async () => {
      try {
        console.log('RewardsSection: Checking for accessory clicks...');
        
        // Get recent accessory clicks
        const { data: recentClicks } = await supabase
          .from('user_interactions')
          .select('clicked_item_id, clicked_item_name, clicked_at, device_info')
          .eq('category_id', 'accessories')
          .not('clicked_item_id', 'is', null)
          .order('clicked_at', { ascending: false })
          .limit(10);

        console.log('RewardsSection: Found accessory clicks:', recentClicks?.length || 0);
        
        if (recentClicks && recentClicks.length > 0) {
          const allRecommendedIds = new Set<string>();
          
          // Process each recent click to find matching vouchers using direct queries
          for (const click of recentClicks) {
            const accessoryPosition = parseInt(click.clicked_item_id);
            const itemName = click.clicked_item_name?.toLowerCase() || '';
            
            console.log('RewardsSection: Processing click:', {
              position: accessoryPosition,
              name: click.clicked_item_name,
              clickedAt: click.clicked_at
            });
            
            // Find matching vouchers based on keywords and position
            if (!isNaN(accessoryPosition) || itemName) {
              try {
                // Get vouchers that match the clicked accessory
                let query = supabase
                  .from('accessory_vouchers')
                  .select('*')
                  .eq('is_active', true);

                // Build keyword matching conditions
                const keywords: string[] = [];
                
                // Extract keywords from item name
                if (itemName.includes('airpods') || itemName.includes('apple')) {
                  keywords.push('airpods', 'apple', 'audio');
                }
                if (itemName.includes('headphone') || itemName.includes('headset')) {
                  keywords.push('headphones', 'audio');
                }
                if (itemName.includes('speaker')) {
                  keywords.push('speakers', 'audio');
                }
                if (itemName.includes('jbl')) {
                  keywords.push('jbl', 'audio');
                }
                if (itemName.includes('gaming') || itemName.includes('game')) {
                  keywords.push('gaming');
                }
                if (itemName.includes('charger') || itemName.includes('cable')) {
                  keywords.push('charging', 'mobile');
                }
                if (itemName.includes('case') || itemName.includes('cover')) {
                  keywords.push('cases', 'mobile');
                }

                // Add position-based keywords for specific accessories
                if (!isNaN(accessoryPosition)) {
                  if (accessoryPosition >= 1 && accessoryPosition <= 5) {
                    keywords.push('audio', 'headphones');
                  } else if (accessoryPosition >= 6 && accessoryPosition <= 10) {
                    keywords.push('mobile', 'charging');
                  } else if (accessoryPosition >= 11 && accessoryPosition <= 15) {
                    keywords.push('gaming', 'accessories');
                  }
                }

                // If we have keywords, search for matching vouchers
                if (keywords.length > 0) {
                  const { data: matchingVouchers, error } = await supabase
                    .from('accessory_vouchers')
                    .select('*')
                    .eq('is_active', true)
                    .or(`keywords.cs.{${keywords.join(',')}},title.ilike.%${keywords[0]}%,category.ilike.%${keywords[0]}%`);

                  if (error) {
                    console.error('RewardsSection: Error querying vouchers:', error);
                    continue;
                  }

                  console.log('RewardsSection: Found matching vouchers:', matchingVouchers?.length || 0);
                  
                  if (matchingVouchers && matchingVouchers.length > 0) {
                    matchingVouchers.forEach((voucher: any) => {
                      allRecommendedIds.add(voucher.id);
                      console.log('RewardsSection: Adding recommended voucher:', voucher.title);
                    });
                  }
                } else {
                  // Fallback: get general audio vouchers for any accessory click
                  const { data: fallbackVouchers, error } = await supabase
                    .from('accessory_vouchers')
                    .select('*')
                    .eq('is_active', true)
                    .or('category.ilike.%audio%,keywords.cs.{audio}')
                    .limit(3);

                  if (!error && fallbackVouchers) {
                    fallbackVouchers.forEach((voucher: any) => {
                      allRecommendedIds.add(voucher.id);
                    });
                  }
                }

              } catch (queryError) {
                console.error('RewardsSection: Query failed for position', accessoryPosition, ':', queryError);
              }
            }
          }
          
          console.log('RewardsSection: Final recommended voucher IDs:', allRecommendedIds);
          setRecommendedVoucherIds(allRecommendedIds);
        } else {
          console.log('RewardsSection: No accessory clicks found, clearing recommendations');
          setRecommendedVoucherIds(new Set());
        }
      } catch (error) {
        console.error('RewardsSection: Error checking for accessory clicks:', error);
        setRecommendedVoucherIds(new Set());
      }
    };

    checkForAccessoryClicks();

    const subscription = supabase
      .channel('accessory_clicks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_interactions',
          filter: 'category_id=eq.accessories'
        },
        (payload) => {
          console.log('New accessory click detected:', payload);
          // Delay to ensure the insert is committed
          setTimeout(() => {
            checkForAccessoryClicks();
          }, 1000);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  const fetchVouchers = async () => {
    try {
      setLoading(true);
      // Get user interactions and chat messages for comprehensive analysis
      const { data: interactions, error: interactionsError } = await supabase
        .from('user_interactions')
        .select('category_id, clicked_item_name')
        .not('clicked_item_name', 'is', null)
        .order('clicked_at', { ascending: false })
        .limit(100);

      if (interactionsError) {
        console.error('Error fetching interactions:', interactionsError);
      }

      // Get chat messages for additional context
      const { data: chatMessages, error: chatError } = await supabase
        .from('chat_messages')
        .select('content, role')
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(50);

      if (chatError) {
        console.error('Error fetching chat messages:', chatError);
      }

      // Get all active loyalty vouchers
      const { data: allVouchers, error: vouchersError } = await supabase
        .from('loyalty_vouchers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (vouchersError) {
        console.error('Error fetching vouchers:', vouchersError);
      }

      // Get all active accessory vouchers
      const { data: accessoryVouchers, error: accessoryError } = await supabase
        .from('accessory_vouchers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (accessoryError) {
        console.error('Error fetching accessory vouchers:', accessoryError);
      }

      // Get all exclusive vouchers (Platinum-only)
      const { data: exclusiveVouchers, error: exclusiveError } = await supabase
        .from('exclusive_vouchers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (exclusiveError) {
        console.error('Error fetching exclusive vouchers:', exclusiveError);
      }

      // Generate smart vouchers based on user behavior
      // No smart vouchers - only show recommendations based on actual accessory clicks
      const smartVouchers: Voucher[] = [];
      
      // Combine all vouchers (loyalty + accessory + exclusive)
      const combinedVouchers = [...smartVouchers, ...(allVouchers || []), ...(accessoryVouchers || []), ...(exclusiveVouchers || [])];
      
      // Don't score vouchers based on general behavior - only show them in order
      const sortedVouchers = combinedVouchers.sort((a, b) => {
        // Sort by points cost (ascending) for better UX
        return a.points_cost - b.points_cost;
      });

      setVouchers(sortedVouchers);
      
      // Generate and add platinum vouchers to the main vouchers list
      generatePlatinumVouchers();
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      // Set some demo vouchers on error
      setVouchers([
        {
          id: 'demo-1',
          title: '$10 Off Mobile Accessories',
          description: 'Valid on any mobile accessory purchase above $30',
          points_cost: 500,
          value: '$10',
          category: 'Mobile',
          expiry_date: '2025-03-31',
          is_active: true
        },
        {
          id: 'demo-2',
          title: '20% Off SIM Plan Upgrade',
          description: 'Upgrade to any higher tier SIM plan',
          points_cost: 800,
          value: '20%',
          category: 'SIM',
          expiry_date: '2025-02-28',
          is_active: true
        }
      ]);
    } finally {
      setLoading(false);
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
        is_active: true
      },
      {
        id: 'platinum-iphone-pro',
        title: '📱 Ultimate iPhone Pro Package',
        description: 'iPhone 15 Pro Max + MagSafe accessories + Premium case + AppleCare+',
        points_cost: 0,
        value: '$1,200 Value',
        category: 'Platinum Mobile',
        expiry_date: '2025-12-31',
        is_active: true
      },
      {
        id: 'platinum-gaming-elite',
        title: '🎮 Gaming Elite Setup',
        description: 'Gaming chair + Mechanical keyboard + Gaming mouse + 4K monitor + Headset',
        points_cost: 0,
        value: '$2,500 Value',
        category: 'Platinum Gaming',
        expiry_date: '2025-12-31',
        is_active: true
      },
      {
        id: 'platinum-smart-home',
        title: '🏠 Smart Home Premium Suite',
        description: 'Smart speakers + Security cameras + Smart lights + Home automation hub',
        points_cost: 0,
        value: '$1,500 Value',
        category: 'Platinum Smart Home',
        expiry_date: '2025-12-31',
        is_active: true
      },
      {
        id: 'platinum-entertainment',
        title: '🎬 Entertainment Platinum Bundle',
        description: 'Netflix Premium + Disney+ + HBO Max + Apple TV+ + Spotify Premium (24 months)',
        points_cost: 0,
        value: '$600 Value',
        category: 'Platinum Entertainment',
        expiry_date: '2025-12-31',
        is_active: true
      },
      {
        id: 'platinum-tech-pro',
        title: '💻 Professional Tech Package',
        description: 'MacBook Pro 16" + iPad Pro + Apple Pencil + Magic Keyboard + AirPods Max',
        points_cost: 0,
        value: '$3,000 Value',
        category: 'Platinum Tech',
        expiry_date: '2025-12-31',
        is_active: true
      }
    ];
    
    // Add platinum vouchers to the main vouchers list
    setVouchers(prevVouchers => {
      const combinedVouchers = [...platinumVouchers, ...prevVouchers];
      
      // Sort to prioritize platinum vouchers, then headphone vouchers, then by points cost
      return combinedVouchers.sort((a, b) => {
        const aIsPlatinum = isPlatinumVoucher(a);
        const bIsPlatinum = isPlatinumVoucher(b);
        const aIsHeadphone = isHeadphoneVoucher(a);
        const bIsHeadphone = isHeadphoneVoucher(b);
        
        // Platinum vouchers first
        if (aIsPlatinum && !bIsPlatinum) return -1;
        if (!aIsPlatinum && bIsPlatinum) return 1;
        
        // Then headphone vouchers (if both are not platinum)
        if (!aIsPlatinum && !bIsPlatinum) {
          if (aIsHeadphone && !bIsHeadphone) return -1;
          if (!aIsHeadphone && bIsHeadphone) return 1;
        }
        
        // Finally sort by points cost
        return a.points_cost - b.points_cost;
      });
    });
  };

  const handlePlatinumVoucher = (voucher: Voucher) => {
    Alert.alert(
      '👑 Platinum Exclusive',
      `This premium voucher (${voucher.value}) is exclusively available to Singtel Platinum subscribers.\n\nUpgrade to Platinum for just $5.99/month and unlock:\n\n✨ $500+ worth of exclusive vouchers monthly\n🎁 2x points on all activities\n⭐ VIP customer support\n🚀 Priority network access\n\nWould you like to upgrade to Platinum?`,
      [
        { text: 'Maybe Later', style: 'cancel' },
        { 
          text: 'Upgrade to Platinum', 
          style: 'default',
          onPress: () => {
            Alert.alert('Upgrade Started', 'Redirecting to Platinum subscription...');
          }
        }
      ]
    );
  };

  const generateSmartVouchers = (interactions: any[], chatMessages: any[]): Voucher[] => {
    // No longer generate smart vouchers - only show recommendations based on actual accessory clicks
    return [];
  };

  const scoreVouchersForUser = (vouchers: Voucher[], interactions: any[], chatMessages: any[]) => {
    // No longer score vouchers based on general behavior
    // Only show recommendations based on specific accessory clicks
    return vouchers.sort((a, b) => a.points_cost - b.points_cost);
  };

  const redeemVoucher = async (voucher: Voucher) => {
    if (!userId) {
      Alert.alert('Sign In Required', 'Please sign in to redeem vouchers');
      return;
    }

    if (userPoints < voucher.points_cost) {
      Alert.alert('Insufficient Points', `You need ${voucher.points_cost} points to redeem this voucher.`);
      return;
    }

    Alert.alert(
      'Redeem Voucher',
      `Redeem "${voucher.title}" for ${voucher.points_cost} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          style: 'default',
          onPress: async () => {
            try {
              // Deduct points
              const { error: updateError } = await supabase
                .from('user_loyalty_points')
                .update({ total_points: userPoints - voucher.points_cost })
                .eq('user_id', userId);

              if (updateError) throw updateError;

              // Record redemption
              await supabase
                .from('loyalty_transactions')
                .insert({
                  user_id: userId,
                  transaction_type: 'redeemed',
                  points: -voucher.points_cost,
                  description: `Redeemed: ${voucher.title}`,
                  reference_id: voucher.id
                });

              Alert.alert('Success! 🎉', 'Voucher redeemed successfully!');
            } catch (error) {
              console.error('Error redeeming voucher:', error);
              Alert.alert('Error', 'Failed to redeem voucher. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'entertainment subscription':
      case 'music subscription':
        return Tv;
      case 'security subscription':
        return Shield;
      case 'audio': return Headphones;
      case 'audio accessories': return Headphones;
      case 'entertainment': return Tv;
      case 'mobile': return Smartphone;
      case 'mobile accessories': return Smartphone;
      case 'security': return Shield;
      case 'broadband': return Wifi;
      case 'gaming': return ShoppingBag;
      case 'computer': return ShoppingBag;
      case 'tablet': return Smartphone;
      case 'wearables': return Star;
      case 'connectivity': return Wifi;
      case 'bundle': return Gift;
      case 'smart home accessories': return Star;
      case 'gaming accessories': return ShoppingBag;
      case 'accessories': return ShoppingBag;
      default: return Gift;
    }
  };

  const categories = ['All', 'Audio', 'Entertainment', 'Mobile', 'Security', 'Broadband', 'Accessories', 'Gaming', 'Computer', 'Smart Home'];
  
  const canAffordVoucher = (pointsCost: number) => userPoints >= pointsCost;
  
  const isPlatinumVoucher = (voucher: Voucher) => {
    return voucher.category?.includes('Platinum') || 
           voucher.category?.includes('VIP') || 
           voucher.category?.includes('Premium Tech') || 
           voucher.category?.includes('Audio Pro') ||
           voucher.id?.startsWith('platinum-');
  };

  const isHeadphoneVoucher = (voucher: Voucher) => {
    const title = voucher.title?.toLowerCase() || '';
    const description = voucher.description?.toLowerCase() || '';
    const category = voucher.category?.toLowerCase() || '';
    const subcategory = voucher.subcategory?.toLowerCase() || '';
    
    return (
      title.includes('headphone') ||
      title.includes('headset') ||
      title.includes('earphone') ||
      title.includes('earbuds') ||
      title.includes('airpods') ||
      title.includes('audio') ||
      description.includes('headphone') ||
      description.includes('audio') ||
      category.includes('audio') ||
      subcategory?.includes('audio') ||
      category.includes('headphone')
    );
  };

  const filteredVouchers = selectedCategory === 'All' 
    ? vouchers 
    : vouchers.filter(v => v.category === selectedCategory || v.category?.toLowerCase().includes(selectedCategory.toLowerCase()));

  // Sort vouchers to prioritize headphone/audio vouchers at the top
  const sortedVouchers = filteredVouchers.sort((a, b) => {
    const aIsHeadphone = isHeadphoneVoucher(a);
    const bIsHeadphone = isHeadphoneVoucher(b);
    
    // Headphone vouchers first
    if (aIsHeadphone && !bIsHeadphone) return -1;
    if (!aIsHeadphone && bIsHeadphone) return 1;
    
    // Then sort by points cost within each group
    return a.points_cost - b.points_cost;
  });

  const isHighValueVoucher = (pointsCost: number) => pointsCost >= 2700;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E60012" />
        <Text style={styles.loadingText}>Loading rewards...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* How to Earn Points */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 How to Earn Points</Text>
        <View style={styles.earnPointsContainer}>
          <View style={styles.savingsOverview}>
            <Text style={styles.savingsTitle}>💰 Total Savings Potential</Text>
            
            {/* User's Current Savings */}
            <View style={styles.currentSavingsCard}>
              <View style={styles.currentSavingsHeader}>
                <View style={styles.savingsIconContainer}>
                  <Gift size={20} color="#4CAF50" />
                </View>
                <View style={styles.currentSavingsContent}>
                  <Text style={styles.currentSavingsTitle}>Your Total Savings</Text>
                  <Text style={styles.currentSavingsAmount}>$247.50</Text>
                  <Text style={styles.currentSavingsLabel}>saved this year through loyalty rewards</Text>
                </View>
              </View>
              <View style={styles.savingsBreakdown}>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownLabel}>Vouchers Redeemed</Text>
                  <Text style={styles.breakdownValue}>$180.00</Text>
                </View>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownLabel}>Tier Benefits</Text>
                  <Text style={styles.breakdownValue}>$67.50</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.savingsGrid}>
              <View style={styles.savingsTierCard}>
                <Text style={styles.tierName}>Bronze</Text>
                <Text style={styles.savingsAmount}>$50-100</Text>
                <Text style={styles.savingsLabel}>per year</Text>
              </View>
              <View style={styles.savingsTierCard}>
                <Text style={styles.tierName}>Silver</Text>
                <Text style={styles.savingsAmount}>$120-200</Text>
                <Text style={styles.savingsLabel}>per year</Text>
              </View>
              <View style={styles.savingsTierCard}>
                <Text style={styles.tierName}>Gold</Text>
                <Text style={styles.savingsAmount}>$250-400</Text>
                <Text style={styles.savingsLabel}>per year</Text>
              </View>
              <View style={[styles.savingsTierCard, styles.platinumCard]}>
                <View style={styles.platinumBadge}>
                  <Text style={styles.platinumBadgeText}>PREMIUM</Text>
                </View>
                <Text style={[styles.tierName, styles.platinumTierName]}>Platinum</Text>
                <Text style={[styles.savingsAmount, styles.platinumAmount]}>$500-800</Text>
                <Text style={styles.savingsLabel}>per year</Text>
                <Text style={styles.platinumBonus}>+ 2x points on everything!</Text>
              </View>
            </View>
            <View style={styles.savingsNote}>
              <Text style={styles.savingsNoteText}>
                💡 Platinum members save the most with exclusive vouchers, 2x points, and premium benefits worth $5.99/month
              </Text>
            </View>
          </View>

          <View style={styles.earnPointsGrid}>
            <View style={styles.earnPointItem}>
              <ShoppingBag size={20} color="#E60012" />
              <Text style={styles.earnPointTitle}>Browse Products</Text>
              <Text style={styles.earnPointValue}>10 pts</Text>
              <Text style={styles.earnPointDesc}>Per product click</Text>
            </View>
            
            <View style={styles.earnPointItem}>
              <Calendar size={20} color="#FF6B35" />
              <Text style={styles.earnPointTitle}>Daily Login</Text>
              <Text style={styles.earnPointValue}>50+ pts</Text>
              <Text style={styles.earnPointDesc}>With streak bonus</Text>
            </View>
            
            <View style={styles.earnPointItem}>
              <Gift size={20} color="#4CAF50" />
              <Text style={styles.earnPointTitle}>Refer Friends</Text>
              <Text style={styles.earnPointValue}>500 pts</Text>
              <Text style={styles.earnPointDesc}>Per successful referral</Text>
            </View>
            
            <View style={styles.earnPointItem}>
              <Star size={20} color="#FFD700" />
              <Text style={styles.earnPointTitle}>Premium Member</Text>
              <Text style={styles.earnPointValue}>2x pts</Text>
              <Text style={styles.earnPointDesc}>On all activities</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Category Filter */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎁 All Vouchers ({filteredVouchers.length})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.activeCategoryButton
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.activeCategoryButtonText
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Vouchers Grid */}
      <View style={styles.vouchersContainer}>
        {sortedVouchers.map((voucher, index) => {
          const CategoryIcon = getCategoryIcon(voucher.category);
          const canAfford = canAffordVoucher(voucher.points_cost);
          const isRecommended = recommendedVoucherIds.has(voucher.id) || isHeadphoneVoucher(voucher);
          const isSubscription = voucher.category?.toLowerCase().includes('subscription');
          const isPlatinum = isPlatinumVoucher(voucher);
          const isHighValue = isHighValueVoucher(voucher.points_cost);

          return (
            <TouchableOpacity
              key={voucher.id}
              style={[
                styles.voucherCard,
                isRecommended && styles.recommendedCard,
                isSubscription && styles.subscriptionVoucherCard,
                isPlatinum && styles.platinumVoucherCard,
                isHighValue && styles.highValueVoucherCard,
                !canAfford && styles.disabledCard
              ]}
              onPress={() => isPlatinum ? handlePlatinumVoucher(voucher) : redeemVoucher(voucher)}
              disabled={!canAfford && !isPlatinum}
            >
              {isRecommended && (
                <View style={styles.recommendedBadge}>
                  <Sparkles size={10} color="white" />
                  <Text style={styles.recommendedText}>
                    {isHeadphoneVoucher(voucher) ? 'RECOMMENDED' : 'RECOMMENDED'}
                  </Text>
                </View>
              )}

              {isPlatinum && (
                <View style={styles.platinumBadge}>
                  <Star size={10} color="white" />
                  <Text style={styles.platinumText}>PLATINUM EXCLUSIVE</Text>
                </View>
              )}

              {isHighValue && !isPlatinum && (
                <View style={styles.highValueBadge}>
                  <Sparkles size={10} color="white" />
                  <Text style={styles.highValueText}>PREMIUM REWARD</Text>
                </View>
              )}
              <View style={styles.voucherHeader}>
                <View style={[styles.categoryIconContainer, { backgroundColor: isPlatinum ? '#8A2BE2' : (isRecommended ? '#FF6B35' : '#f0f0f0') }]}>
                  <CategoryIcon size={18} color={isPlatinum || isRecommended ? 'white' : '#666'} />
                </View>
                <View style={styles.pointsCostContainer}>
                  <Text style={[
                    styles.pointsCost, 
                    isPlatinum && styles.platinumPointsCost,
                    !canAfford && !isPlatinum && styles.disabledText
                  ]}>
                    {isPlatinum ? 'PLATINUM' : voucher.points_cost}
                  </Text>
                  <Text style={styles.pointsCostLabel}>{isPlatinum ? 'ONLY' : 'pts'}</Text>
                </View>
              </View>

              <Text style={[
                styles.voucherTitle, 
                isPlatinum && styles.platinumTitle,
                !canAfford && !isPlatinum && styles.disabledText
              ]} numberOfLines={2}>
                {voucher.title}
              </Text>
              
              <Text style={styles.voucherDescription} numberOfLines={2}>
                {voucher.description}
              </Text>

              {isRecommended && voucher.recommendation_reason && (
                <View style={styles.recommendationReason}>
                  <TrendingUp size={10} color="#FF6B35" />
                  <Text style={styles.reasonText}>{voucher.recommendation_reason}</Text>
                </View>
              )}

              <View style={styles.voucherFooter}>
                <Text style={styles.voucherValue}>{voucher.value}</Text>
                <Text style={styles.voucherCategory}>{voucher.category}</Text>
              </View>

              <View style={[styles.affordabilityStatus, canAfford && styles.affordableStatus]}>
                {isPlatinum ? (
                  <View style={styles.platinumStatus}>
                    <Star size={12} color="#8A2BE2" />
                    <Text style={styles.platinumStatusText}>Upgrade to Platinum</Text>
                  </View>
                ) : canAfford ? (
                  <>
                    <CheckCircle size={12} color="#4CAF50" />
                    <Text style={styles.affordableText}>Can Redeem</Text>
                  </>
                ) : (
                  <Text style={styles.unaffordableText}>Need {voucher.points_cost - userPoints} more points</Text>
                )}
              </View>
              
              {isSubscription && (
                <View style={styles.subscriptionVoucherBadge}>
                  <Star size={10} color="white" />
                  <Text style={styles.subscriptionVoucherText}>SUBSCRIPTION</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {sortedVouchers.length === 0 && (
        <View style={styles.emptyState}>
          <Gift size={40} color="#ccc" />
          <Text style={styles.emptyText}>No vouchers found</Text>
          <Text style={styles.emptySubtext}>Try selecting a different category</Text>
        </View>
      )}
    </ScrollView>
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
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  earnPointsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  savingsOverview: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E9ECEF',
  },
  savingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  currentSavingsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 3,
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  currentSavingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  savingsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  currentSavingsContent: {
    flex: 1,
  },
  currentSavingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  currentSavingsAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  currentSavingsLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  savingsBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8F5E8',
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  savingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  savingsTierCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  platinumCard: {
    width: '100%',
    backgroundColor: 'linear-gradient(135deg, #F8F0FF 0%, #FFF8F0 100%)',
    borderWidth: 2,
    borderColor: '#8A2BE2',
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
  },
  platinumBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#8A2BE2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  platinumBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  tierName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  platinumTierName: {
    color: '#8A2BE2',
    marginTop: 16,
    fontSize: 18,
  },
  savingsAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
    letterSpacing: -0.3,
  },
  platinumAmount: {
    fontSize: 28,
    color: '#8A2BE2',
    letterSpacing: -0.5,
  },
  savingsLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
    fontWeight: '500',
  },
  platinumBonus: {
    fontSize: 12,
    color: '#8A2BE2',
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  savingsNote: {
    backgroundColor: '#FFF8F0',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFE4CC',
    marginTop: 8,
  },
  savingsNoteText: {
    fontSize: 14,
    color: '#E65100',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
  },
  earnPointsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  earnPointItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
  },
  earnPointTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  earnPointValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E60012',
    marginTop: 4,
  },
  earnPointDesc: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  categoryFilter: {
    marginBottom: 16,
  },
  categoryButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeCategoryButton: {
    backgroundColor: '#E60012',
    borderColor: '#E60012',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeCategoryButtonText: {
    color: 'white',
  },
  vouchersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  voucherCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  recommendedCard: {
    borderWidth: 2,
    borderColor: '#FF6B35',
    backgroundColor: '#FFFBF8',
  },
  subscriptionVoucherCard: {
    borderWidth: 2,
    borderColor: '#8A2BE2',
    backgroundColor: '#FAFBFF',
  },
  platinumVoucherCard: {
    borderWidth: 3,
    borderColor: '#8A2BE2',
    backgroundColor: 'linear-gradient(135deg, #F8F0FF 0%, #FFF8F0 100%)',
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  highValueVoucherCard: {
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: '#FFFEF7',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  disabledCard: {
    opacity: 0.5,
  },
  recommendedBadge: {
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
  recommendedText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  recommendationIndicator: {
    backgroundColor: '#FFF8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFE4CC',
  },
  recommendationIndicatorText: {
    fontSize: 10,
    color: '#E65100',
    fontWeight: '600',
    textAlign: 'center',
  },
  platinumBadge: {
    position: 'absolute',
    top: -1,
    right: 8,
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
  highValueBadge: {
    position: 'absolute',
    top: -1,
    right: 8,
    backgroundColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  highValueText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
    marginLeft: 2,
    letterSpacing: 0.3,
  },
  subscriptionVoucherBadge: {
    position: 'absolute',
    top: -1,
    left: 8,
    backgroundColor: '#8A2BE2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 1,
  },
  subscriptionVoucherText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointsCostContainer: {
    alignItems: 'flex-end',
  },
  pointsCost: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E60012',
  },
  platinumPointsCost: {
    color: '#8A2BE2',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  pointsCostLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
  },
  disabledText: {
    color: '#999',
  },
  voucherTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 18,
  },
  platinumTitle: {
    color: '#8A2BE2',
    fontSize: 15,
    letterSpacing: -0.2,
  },
  voucherDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 12,
  },
  recommendationReason: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  reasonText: {
    fontSize: 9,
    color: '#FF6B35',
    fontWeight: '600',
    marginLeft: 4,
    flex: 1,
  },
  voucherFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  voucherValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  voucherCategory: {
    fontSize: 10,
    color: '#999',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  affordabilityStatus: {
    backgroundColor: '#FFE0E0',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  affordableStatus: {
    backgroundColor: '#E8F5E8',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  affordableText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
  platinumStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F0FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E1BEE7',
  },
  platinumStatusText: {
    fontSize: 11,
    color: '#8A2BE2',
    fontWeight: 'bold',
    marginLeft: 4,
    letterSpacing: 0.2,
  },
  unaffordableText: {
    fontSize: 10,
    color: '#E60012',
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    marginHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#333',
    marginTop: 10,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
});