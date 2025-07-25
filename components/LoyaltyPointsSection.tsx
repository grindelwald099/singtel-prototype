import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { Gift, Star, TrendingUp, Calendar, Users, ShoppingBag, Crown, Zap, Award, ArrowUp, Sparkles, CircleCheck as CheckCircle, Lock, Target } from 'lucide-react-native';

interface UserLoyalty {
  total_points: number;
  current_tier: string;
  points_earned_this_month: number;
  is_premium_member: boolean;
  premium_tier?: string;
}


interface LoyaltyPointsSectionProps {
  userId?: string;
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tier thresholds and benefits
const TIER_THRESHOLDS = {
  Bronze: { min: 0, max: 999, color: '#CD7F32', bgColor: '#FFF8E1' },
  Silver: { min: 1000, max: 2499, color: '#C0C0C0', bgColor: '#F5F5F5' },
  Gold: { min: 2500, max: 4999, color: '#FFD700', bgColor: '#FFFDE7' },
  Platinum: { min: 5000, max: Infinity, color: '#8A2BE2', bgColor: '#F3E5F5' }
};

export default function LoyaltyPointsSection({ userId }: LoyaltyPointsSectionProps) {
  const [userLoyalty, setUserLoyalty] = useState<UserLoyalty | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUserLoyalty();
  }, [userId]);

  const fetchUserLoyalty = async () => {
    if (!userId) {
      // Set demo data for non-authenticated users
      setUserLoyalty({
        total_points: 2400,
        current_tier: 'Silver',
        points_earned_this_month: 450,
        is_premium_member: false
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_loyalty_points')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user loyalty:', error);
        // Set demo data on error
        setUserLoyalty({
          total_points: 2400,
          current_tier: 'Bronze',
          points_earned_this_month: 450,
          is_premium_member: false
        });
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
          setUserLoyalty({
            total_points: 2400,
            current_tier: 'Silver',
            points_earned_this_month: 450,
            is_premium_member: false
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user loyalty:', error);
      setUserLoyalty({
        total_points: 2400,
        current_tier: 'Silver',
        points_earned_this_month: 450,
        is_premium_member: false
      });
    } finally {
      setLoading(false);
    }
  };


  const calculateTierProgress = () => {
    if (!userLoyalty) return { progress: 0, pointsToNext: 0, nextTier: 'Silver' };

    const currentPoints = userLoyalty.total_points;
    const currentTier = userLoyalty.current_tier;

    // Find next tier
    const tiers = Object.keys(TIER_THRESHOLDS);
    const currentTierIndex = tiers.indexOf(currentTier);
    const nextTier = currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : currentTier;

    if (nextTier === currentTier) {
      // Already at highest tier
      return { progress: 100, pointsToNext: 0, nextTier: currentTier };
    }

    const currentTierMin = TIER_THRESHOLDS[currentTier as keyof typeof TIER_THRESHOLDS].min;
    const nextTierMin = TIER_THRESHOLDS[nextTier as keyof typeof TIER_THRESHOLDS].min;

    const pointsInCurrentTier = currentPoints - currentTierMin;
    const pointsNeededForNextTier = nextTierMin - currentTierMin;
    
    // Calculate progress with proper guards against invalid values
    let progress = 0;
    if (pointsNeededForNextTier > 0 && Number.isFinite(pointsInCurrentTier) && Number.isFinite(pointsNeededForNextTier)) {
      progress = Math.min((pointsInCurrentTier / pointsNeededForNextTier) * 100, 100);
      // Ensure progress is a valid finite number
      if (!Number.isFinite(progress) || progress < 0) {
        progress = 0;
      }
    }
    
    const pointsToNext = Math.max(nextTierMin - currentPoints, 0);

    return { progress, pointsToNext, nextTier };
  };

  const getTierInfo = (tier: string) => {
    return TIER_THRESHOLDS[tier as keyof typeof TIER_THRESHOLDS] || TIER_THRESHOLDS.Bronze;
  };

  const claimDailyReward = async () => {
    if (!userId) {
      Alert.alert('Sign In Required', 'Please sign in to claim daily rewards');
      return;
    }

    try {
      setRefreshing(true);

      // Check if user has already claimed today
      const { data: dailyReward } = await supabase
        .from('user_daily_rewards')
        .select('*')
        .eq('user_id', userId)
        .single();

      const today = new Date().toISOString().split('T')[0];
      const lastClaimDate = dailyReward?.last_claim_date;

      if (lastClaimDate === today) {
        Alert.alert('Already Claimed', 'You have already claimed your daily reward today!');
        return;
      }

      // Calculate streak and points
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = 1;
      if (lastClaimDate === yesterdayStr) {
        newStreak = (dailyReward?.current_streak || 0) + 1;
      }

      // Calculate points based on streak
      let pointsToAward = 50; // Base daily reward
      if (newStreak >= 7) pointsToAward += 50; // Weekly bonus
      if (newStreak >= 30) pointsToAward += 100; // Monthly bonus

      // Premium member bonus
      if (userLoyalty?.is_premium_member) {
        pointsToAward *= 2;
      }

      // Update daily rewards
      await supabase
        .from('user_daily_rewards')
        .upsert({
          user_id: userId,
          last_claim_date: today,
          current_streak: newStreak,
          total_claims: (dailyReward?.total_claims || 0) + 1
        });

      // Add points to user account
      await supabase
        .from('user_loyalty_points')
        .update({
          total_points: (userLoyalty?.total_points || 0) + pointsToAward,
          points_earned_this_month: (userLoyalty?.points_earned_this_month || 0) + pointsToAward
        })
        .eq('user_id', userId);

      // Record transaction
      await supabase
        .from('loyalty_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'earned',
          points: pointsToAward,
          description: `Daily reward (${newStreak} day streak)`,
          reference_id: `daily_${today}`
        });

      Alert.alert(
        'Daily Reward Claimed! 🎉',
        `You earned ${pointsToAward} points!\n${newStreak > 1 ? `Streak: ${newStreak} days` : ''}`
      );

      // Refresh data
      fetchUserLoyalty();
    } catch (error) {
      console.error('Error claiming daily reward:', error);
      Alert.alert('Error', 'Failed to claim daily reward. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E60012" />
        <Text style={styles.loadingText}>Loading your loyalty points...</Text>
      </View>
    );
  }

  if (!userLoyalty) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load loyalty points</Text>
        <TouchableOpacity onPress={fetchUserLoyalty} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tierInfo = getTierInfo(userLoyalty.current_tier);
  const { progress, pointsToNext, nextTier } = calculateTierProgress();
  const nextTierInfo = getTierInfo(nextTier);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Points Overview Card */}
      <View style={[styles.pointsCard, { backgroundColor: tierInfo.bgColor, borderColor: tierInfo.color }]}>
        <View style={styles.pointsHeader}>
          <View style={styles.tierBadge}>
            <Crown size={20} color={tierInfo.color} />
            <Text style={[styles.tierText, { color: tierInfo.color }]}>{userLoyalty.current_tier}</Text>
          </View>
          {userLoyalty.is_premium_member && (
            <View style={styles.premiumBadge}>
              <Star size={14} color="white" />
              <Text style={styles.premiumText}>PREMIUM</Text>
            </View>
          )}
        </View>

        <View style={styles.pointsDisplay}>
          <Text style={styles.pointsValue}>{userLoyalty.total_points.toLocaleString()}</Text>
          <Text style={styles.pointsLabel}>Total Points</Text>
        </View>

        {/* Tier Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progress to {nextTier}</Text>
            <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { backgroundColor: tierInfo.color + '20' }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${progress}%`, 
                    backgroundColor: nextTierInfo.color 
                  }
                ]} 
              />
            </View>
          </View>
          
          <View style={styles.progressLabels}>
            <Text style={[styles.currentTierLabel, { color: tierInfo.color }]}>
              {userLoyalty.current_tier}
            </Text>
            <Text style={styles.pointsToNextText}>
              {pointsToNext > 0 ? `${pointsToNext} points to go` : 'Max tier reached!'}
            </Text>
            <Text style={[styles.nextTierLabel, { color: nextTierInfo.color }]}>
              {nextTier}
            </Text>
          </View>
        </View>

        {/* Monthly Progress */}
        <View style={styles.monthlyProgress}>
          <View style={styles.monthlyHeader}>
            <Calendar size={16} color="#666" />
            <Text style={styles.monthlyTitle}>This Month</Text>
            <Text style={styles.monthlyPoints}>{userLoyalty.points_earned_this_month} pts</Text>
          </View>
          
          <View style={styles.monthlyBarContainer}>
            <View style={styles.monthlyBar}>
              <View 
                style={[
                  styles.monthlyFill, 
                  { 
                    width: `${Math.min((userLoyalty.points_earned_this_month / 500) * 100, 100)}%`,
                    backgroundColor: tierInfo.color
                  }
                ]} 
              />
            </View>
          </View>
          
          <Text style={styles.monthlyTarget}>Target: 500 points/month</Text>
        </View>
      </View>

      {/* AI Recommended Vouchers */}
      <View style={styles.recommendedVouchersSection}>
      </View>

      {/* Tier Benefits */}
      <View style={styles.benefitsCard}>
        <Text style={styles.cardTitle}>Your {userLoyalty.current_tier} Benefits</Text>
        <View style={styles.benefitsList}>
          {userLoyalty.current_tier === 'Bronze' && (
            <>
              <View style={styles.benefitItem}>
                <Gift size={16} color="#CD7F32" />
                <Text style={styles.benefitText}>Basic voucher access</Text>
              </View>
              <View style={styles.benefitItem}>
                <Star size={16} color="#CD7F32" />
                <Text style={styles.benefitText}>Monthly newsletter</Text>
              </View>
            </>
          )}
          
          {userLoyalty.current_tier === 'Silver' && (
            <>
              <View style={styles.benefitItem}>
                <Gift size={16} color="#C0C0C0" />
                <Text style={styles.benefitText}>5% discount on vouchers</Text>
              </View>
              <View style={styles.benefitItem}>
                <Star size={16} color="#C0C0C0" />
                <Text style={styles.benefitText}>Priority customer support</Text>
              </View>
              <View style={styles.benefitItem}>
                <TrendingUp size={16} color="#C0C0C0" />
                <Text style={styles.benefitText}>Exclusive Silver vouchers</Text>
              </View>
            </>
          )}
          
          {userLoyalty.current_tier === 'Gold' && (
            <>
              <View style={styles.benefitItem}>
                <Gift size={16} color="#FFD700" />
                <Text style={styles.benefitText}>10% discount on vouchers</Text>
              </View>
              <View style={styles.benefitItem}>
                <Star size={16} color="#FFD700" />
                <Text style={styles.benefitText}>VIP customer support</Text>
              </View>
              <View style={styles.benefitItem}>
                <Crown size={16} color="#FFD700" />
                <Text style={styles.benefitText}>Exclusive Gold vouchers</Text>
              </View>
              <View style={styles.benefitItem}>
                <Zap size={16} color="#FFD700" />
                <Text style={styles.benefitText}>1.5x points on purchases</Text>
              </View>
            </>
          )}
          
          {userLoyalty.current_tier === 'Platinum' && (
            <>
              <View style={styles.benefitItem}>
                <Gift size={16} color="#8A2BE2" />
                <Text style={styles.benefitText}>15% discount on vouchers</Text>
              </View>
              <View style={styles.benefitItem}>
                <Star size={16} color="#8A2BE2" />
                <Text style={styles.benefitText}>Dedicated account manager</Text>
              </View>
              <View style={styles.benefitItem}>
                <Crown size={16} color="#8A2BE2" />
                <Text style={styles.benefitText}>Exclusive Platinum vouchers</Text>
              </View>
              <View style={styles.benefitItem}>
                <Zap size={16} color="#8A2BE2" />
                <Text style={styles.benefitText}>2x points on everything</Text>
              </View>
              <View style={styles.benefitItem}>
                <Award size={16} color="#8A2BE2" />
                <Text style={styles.benefitText}>Early access to new products</Text>
              </View>
            </>
          )}
        </View>

        {/* Next Tier Preview */}
        {nextTier !== userLoyalty.current_tier && (
          <View style={styles.nextTierPreview}>
            <View style={styles.nextTierHeader}>
              <ArrowUp size={16} color={nextTierInfo.color} />
              <Text style={[styles.nextTierTitle, { color: nextTierInfo.color }]}>
                Unlock {nextTier} Benefits
              </Text>
            </View>
            <Text style={styles.nextTierDescription}>
              Just {pointsToNext} more points to unlock exclusive {nextTier} benefits!
            </Text>
          </View>
        )}
      </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    fontSize: 16,
    color: '#E60012',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#E60012',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
  },
  pointsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 24,
    borderRadius: 20,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tierText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8A2BE2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  premiumText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  pointsDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: -1,
  },
  pointsLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
    marginTop: 4,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentTierLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  pointsToNextText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  nextTierLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  monthlyProgress: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  monthlyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  monthlyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  monthlyPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E60012',
  },
  monthlyBarContainer: {
    marginBottom: 8,
  },
  monthlyBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  monthlyFill: {
    height: '100%',
    borderRadius: 4,
  },
  monthlyTarget: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  recommendedVouchersSection: {
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  benefitsCard: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  perkText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
    lineHeight: 14,
  },
  nextTierPreview: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#E9ECEF',
  },
  nextTierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nextTierTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  nextTierDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});