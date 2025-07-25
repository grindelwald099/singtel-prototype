import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { 
  Sparkles, 
  TrendingUp, 
  Headphones, 
  Tv, 
  Shield, 
  Wifi, 
  Smartphone,
  Gift,
  Star
} from 'lucide-react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rsqytbhetidgzpsifhiv.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzcXl0YmhldGlkZ3pwc2lmaGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NzczMzMsImV4cCI6MjA2NzM1MzMzM30.Y9S4HRe2XVqDCF93zCKcqfXHHLd3symW1knj9uAyIiQ';
const supabase = createClient(supabaseUrl, supabaseKey);

interface SmartRecommendation {
  id: string;
  title: string;
  description: string;
  points_cost: number;
  value: string;
  category: string;
  recommendation_score: number;
  recommendation_reason: string;
  confidence_level: 'high' | 'medium' | 'low';
}

interface SmartVoucherRecommendationsProps {
  userId?: string;
  onVoucherSelect?: (voucher: SmartRecommendation) => void;
}

export default function SmartVoucherRecommendations({ userId, onVoucherSelect }: SmartVoucherRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userBehavior, setUserBehavior] = useState<any>(null);

  useEffect(() => {
    generateSmartRecommendations();
  }, [userId]);

  const generateSmartRecommendations = async () => {
    try {
      setLoading(true);

      // Fetch user interactions
      const { data: interactions } = await supabase
        .from('user_interactions')
        .select('category_id, category_name, clicked_item_name, clicked_at')
        .not('clicked_item_name', 'is', null)
        .order('clicked_at', { ascending: false })
        .limit(100);

      // Analyze user behavior patterns
      const behaviorAnalysis = analyzeAdvancedUserBehavior(interactions || []);
      setUserBehavior(behaviorAnalysis);

      // Generate smart recommendations
      const smartRecommendations = generateAdvancedRecommendations(behaviorAnalysis);
      
      setRecommendations(smartRecommendations);
    } catch (error) {
      console.error('Error generating smart recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeAdvancedUserBehavior = (interactions: any[]) => {
    const categoryFrequency: { [key: string]: number } = {};
    const itemPatterns: { [key: string]: number } = {};
    const timePatterns: { [key: string]: number } = {};
    const recentInteractions = interactions.slice(0, 20);

    interactions.forEach((interaction, index) => {
      const category = interaction.category_id || interaction.category_name?.toLowerCase();
      const item = interaction.clicked_item_name?.toLowerCase() || '';
      const hour = new Date(interaction.clicked_at).getHours();
      
      // Weight recent interactions more heavily
      const weight = Math.max(1, 5 - Math.floor(index / 20));

      // Category analysis
      if (category) {
        categoryFrequency[category] = (categoryFrequency[category] || 0) + weight;
      }

      // Advanced item pattern analysis
      if (item.includes('iphone') || item.includes('apple')) {
        itemPatterns['premium_mobile'] = (itemPatterns['premium_mobile'] || 0) + weight;
      }
      if (item.includes('samsung') || item.includes('galaxy')) {
        itemPatterns['android_premium'] = (itemPatterns['android_premium'] || 0) + weight;
      }
      if (item.includes('headphone') || item.includes('audio') || item.includes('earphone') || item.includes('speaker')) {
        itemPatterns['audio_enthusiast'] = (itemPatterns['audio_enthusiast'] || 0) + weight;
      }
      if (item.includes('netflix') || item.includes('disney') || item.includes('streaming') || item.includes('entertainment')) {
        itemPatterns['entertainment_lover'] = (itemPatterns['entertainment_lover'] || 0) + weight;
      }
      if (item.includes('security') || item.includes('protection') || item.includes('antivirus') || item.includes('mcafee')) {
        itemPatterns['security_conscious'] = (itemPatterns['security_conscious'] || 0) + weight;
      }
      if (item.includes('broadband') || item.includes('wifi') || item.includes('internet') || item.includes('fibre')) {
        itemPatterns['connectivity_focused'] = (itemPatterns['connectivity_focused'] || 0) + weight;
      }
      if (item.includes('gaming') || item.includes('game') || item.includes('console')) {
        itemPatterns['gaming_enthusiast'] = (itemPatterns['gaming_enthusiast'] || 0) + weight;
      }

      // Time pattern analysis
      if (hour >= 18 && hour <= 23) {
        timePatterns['evening_user'] = (timePatterns['evening_user'] || 0) + 1;
      }
      if (hour >= 9 && hour <= 17) {
        timePatterns['business_hours'] = (timePatterns['business_hours'] || 0) + 1;
      }
    });

    // Calculate user profile
    const totalInteractions = interactions.length;
    const engagementLevel = totalInteractions > 50 ? 'high' : totalInteractions > 20 ? 'medium' : 'low';
    
    return {
      categoryFrequency,
      itemPatterns,
      timePatterns,
      totalInteractions,
      engagementLevel,
      recentInteractions
    };
  };

  const generateAdvancedRecommendations = (behavior: any): SmartRecommendation[] => {
    const recommendations: SmartRecommendation[] = [];

    // Premium Audio Accessories (for audio enthusiasts)
    if (behavior.itemPatterns['audio_enthusiast'] > 3) {
      recommendations.push({
        id: 'audio-premium-1',
        title: '40% Off Premium Audio Bundle',
        description: 'Sony WH-1000XM5 + Portable Speaker combo based on your audio interests',
        points_cost: 1200,
        value: '$200 Value',
        category: 'Accessories',
        recommendation_score: behavior.itemPatterns['audio_enthusiast'] * 25,
        recommendation_reason: `You've shown strong interest in audio products (${behavior.itemPatterns['audio_enthusiast']} interactions)`,
        confidence_level: 'high'
      });
    }

    // Entertainment Bundles (for streaming enthusiasts)
    if (behavior.itemPatterns['entertainment_lover'] > 2 || behavior.categoryFrequency['tv'] > 2) {
      recommendations.push({
        id: 'entertainment-bundle-1',
        title: 'Ultimate Streaming Bundle',
        description: 'Netflix Premium + Disney+ + HBO Max for 6 months',
        points_cost: 1800,
        value: '$150 Value',
        category: 'Entertainment',
        recommendation_score: (behavior.itemPatterns['entertainment_lover'] || 0) * 20 + (behavior.categoryFrequency['tv'] || 0) * 15,
        recommendation_reason: 'Perfect match for your entertainment browsing patterns',
        confidence_level: 'high'
      });
    }

    // Security Suite (for security-conscious users)
    if (behavior.itemPatterns['security_conscious'] > 1 || behavior.itemPatterns['premium_mobile'] > 2) {
      recommendations.push({
        id: 'security-suite-1',
        title: 'Complete Digital Security Package',
        description: 'McAfee Total Protection + VPN + Identity Theft Protection',
        points_cost: 1000,
        value: '$120 Value',
        category: 'Security',
        recommendation_score: (behavior.itemPatterns['security_conscious'] || 0) * 30 + (behavior.itemPatterns['premium_mobile'] || 0) * 10,
        recommendation_reason: 'Essential protection for your digital lifestyle',
        confidence_level: behavior.itemPatterns['security_conscious'] > 2 ? 'high' : 'medium'
      });
    }

    // Premium Mobile Accessories (for premium mobile users)
    if (behavior.itemPatterns['premium_mobile'] > 3) {
      recommendations.push({
        id: 'mobile-premium-1',
        title: 'Premium iPhone Accessories Kit',
        description: 'MagSafe charger + Premium case + Screen protector + AirPods case',
        points_cost: 1500,
        value: '$180 Value',
        category: 'Accessories',
        recommendation_score: behavior.itemPatterns['premium_mobile'] * 20,
        recommendation_reason: `Curated for your premium mobile preferences (${behavior.itemPatterns['premium_mobile']} iPhone clicks)`,
        confidence_level: 'high'
      });
    }

    // Connectivity Upgrades (for broadband/wifi users)
    if (behavior.itemPatterns['connectivity_focused'] > 2 || behavior.categoryFrequency['broadband'] > 1) {
      recommendations.push({
        id: 'connectivity-upgrade-1',
        title: 'Home Network Upgrade Package',
        description: 'Mesh WiFi 6 system + 6 months speed boost + Priority support',
        points_cost: 2000,
        value: '$250 Value',
        category: 'Broadband',
        recommendation_score: (behavior.itemPatterns['connectivity_focused'] || 0) * 25 + (behavior.categoryFrequency['broadband'] || 0) * 20,
        recommendation_reason: 'Optimize your home network based on your connectivity interests',
        confidence_level: 'medium'
      });
    }

    // Gaming Bundle (for gaming enthusiasts)
    if (behavior.itemPatterns['gaming_enthusiast'] > 1) {
      recommendations.push({
        id: 'gaming-bundle-1',
        title: 'Gaming Performance Package',
        description: 'Gaming router + Low-latency plan + Gaming headset',
        points_cost: 1600,
        value: '$200 Value',
        category: 'Gaming',
        recommendation_score: behavior.itemPatterns['gaming_enthusiast'] * 35,
        recommendation_reason: 'Enhance your gaming experience with pro-level gear',
        confidence_level: 'high'
      });
    }

    // Smart Home Bundle (for tech enthusiasts)
    if (behavior.engagementLevel === 'high' && behavior.totalInteractions > 30) {
      recommendations.push({
        id: 'smart-home-1',
        title: 'Smart Home Starter Kit',
        description: 'Smart speakers + Smart plugs + Home security camera + Setup service',
        points_cost: 2200,
        value: '$300 Value',
        category: 'Smart Home',
        recommendation_score: behavior.totalInteractions * 2,
        recommendation_reason: 'Perfect for tech enthusiasts like you',
        confidence_level: 'medium'
      });
    }

    // Business User Bundle (for business hours users)
    if (behavior.timePatterns['business_hours'] > behavior.timePatterns['evening_user']) {
      recommendations.push({
        id: 'business-bundle-1',
        title: 'Business Productivity Package',
        description: 'Mobile hotspot + Business plan upgrade + Priority support',
        points_cost: 1400,
        value: '$170 Value',
        category: 'Business',
        recommendation_score: behavior.timePatterns['business_hours'] * 5,
        recommendation_reason: 'Tailored for your business usage patterns',
        confidence_level: 'medium'
      });
    }

    // Sort by recommendation score and confidence
    return recommendations
      .sort((a, b) => {
        if (a.confidence_level !== b.confidence_level) {
          const confidenceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          return confidenceOrder[b.confidence_level] - confidenceOrder[a.confidence_level];
        }
        return b.recommendation_score - a.recommendation_score;
      })
      .slice(0, 6);
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'accessories': return Headphones;
      case 'entertainment': return Tv;
      case 'security': return Shield;
      case 'broadband': return Wifi;
      case 'gaming': return Smartphone;
      case 'smart home': return Star;
      case 'business': return TrendingUp;
      default: return Gift;
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return '#4CAF50';
      case 'medium': return '#FF6B35';
      case 'low': return '#FFC107';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Sparkles size={20} color="#E60012" />
          <Text style={styles.title}>Smart Recommendations</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#E60012" />
          <Text style={styles.loadingText}>Analyzing your preferences...</Text>
        </View>
      </View>
    );
  }

  if (recommendations.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Sparkles size={20} color="#E60012" />
          <Text style={styles.title}>Smart Recommendations</Text>
        </View>
        <View style={styles.emptyState}>
          <TrendingUp size={40} color="#ccc" />
          <Text style={styles.emptyText}>Start exploring to unlock smart recommendations!</Text>
          <Text style={styles.emptySubtext}>Browse products in the Shop to get personalized voucher suggestions.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Sparkles size={20} color="#E60012" />
        <Text style={styles.title}>Featured Vouchers</Text>
        <TouchableOpacity onPress={generateSmartRecommendations}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
      
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {recommendations.map((recommendation) => {
          const CategoryIcon = getCategoryIcon(recommendation.category);
          const confidenceColor = getConfidenceColor(recommendation.confidence_level);

          return (
            <TouchableOpacity
              key={recommendation.id}
              style={styles.recommendationCard}
              onPress={() => onVoucherSelect?.(recommendation)}
            >
              <View style={styles.confidenceBadge}>
                <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
                <Text style={[styles.confidenceText, { color: confidenceColor }]}>
                  {recommendation.confidence_level.toUpperCase()}
                </Text>
              </View>

              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <CategoryIcon size={24} color="#E60012" />
                </View>
                <View style={styles.pointsContainer}>
                  <Text style={styles.pointsValue}>{recommendation.points_cost}</Text>
                  <Text style={styles.pointsLabel}>pts</Text>
                </View>
              </View>

              <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
              <Text style={styles.recommendationDescription}>{recommendation.description}</Text>

              <View style={styles.reasonContainer}>
                <TrendingUp size={12} color="#FF6B35" />
                <Text style={styles.reasonText}>{recommendation.recommendation_reason}</Text>
              </View>

              <View style={styles.valueContainer}>
                <Text style={styles.valueText}>{recommendation.value}</Text>
                <Text style={styles.categoryText}>{recommendation.category}</Text>
              </View>

              <View style={styles.scoreContainer}>
                <Text style={styles.scoreText}>Match Score: {Math.round(recommendation.recommendation_score)}%</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginLeft: 10,
    letterSpacing: -0.3,
  },
  refreshText: {
    color: '#E60012',
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 20,
  },
  scrollContainer: {
    paddingRight: 24,
  },
  recommendationCard: {
    width: 280,
    backgroundColor: '#FAFBFC',
    borderRadius: 16,
    padding: 18,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  confidenceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  confidenceText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 24,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF8F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E60012',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E60012',
    letterSpacing: -0.4,
  },
  pointsLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  recommendationTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
    fontWeight: '400',
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 12,
  },
  reasonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },
  valueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  valueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    letterSpacing: -0.2,
  },
  categoryText: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  scoreContainer: {
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  scoreText: {
    fontSize: 12,
    color: '#E60012',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});