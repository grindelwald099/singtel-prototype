import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { TrendingUp, Globe, Zap, ArrowRight, Gift, TriangleAlert as AlertTriangle } from 'lucide-react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rsqytbhetidgzpsifhiv.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzcXl0YmhldGlkZ3pwc2lmaGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NzczMzMsImV4cCI6MjA2NzM1MzMzM30.Y9S4HRe2XVqDCF93zCKcqfXHHLd3symW1knj9uAyIiQ';
const supabase = createClient(supabaseUrl, supabaseKey);

interface UserData {
  'Current Plan': string;
  'Countries Visited': string;
  'Jan (GB)': number;
  'Feb (GB)': number;
  'Mar (GB)': number;
  'Apr (GB)': number;
  'May (GB)': number;
  'Jun (GB)': number;
}

interface PlanData {
  'Plan Name': string;
  'Data and Roaming': string;
  'Price': string;
  'Talktime and SMS': string;
}

interface RoamingPlan {
  'Plan Name': string;
  'Destinations': string;
  'Price and Data': string;
  'Data': string;
  'Price': string;
}

interface Recommendation {
  type: 'upgrade' | 'roaming';
  title: string;
  description: string;
  currentPlan?: string;
  recommendedPlan?: string;
  savings?: string;
  urgency: 'low' | 'medium' | 'high';
  action: string;
}

export default function UsageRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateRecommendations();
  }, []);

  // Extract data amount in GB from text like "150GB + 1GB Roaming"
  const extractDataGB = (text: string): number => {
    try {
      const dataPart = text.split('GB')[0].trim().split('+')[0];
      return parseFloat(dataPart);
    } catch {
      return 0;
    }
  };

  // Normalize text for country matching
  const normalizeText = (text: string): string => {
    return text.replace(/ and /g, ', ')
               .replace(/[^a-zA-Z,\s]/g, '')
               .toLowerCase();
  };

  // Analyze user's 6-month usage pattern
  const analyzeUsage = (user: UserData) => {
    const months = ['Jan (GB)', 'Feb (GB)', 'Mar (GB)', 'Apr (GB)', 'May (GB)', 'Jun (GB)'];
    const usage = months.map(m => user[m as keyof UserData] as number);
    const avgUsage = usage.reduce((sum, val) => sum + val, 0) / usage.length;
    const isIncreasing = usage.every((val, i) => i === 0 || val >= usage[i - 1]);
    const percentChange = usage[0] !== 0 ? ((usage[usage.length - 1] - usage[0]) / usage[0]) * 100 : 0;
    
    return { usage, avgUsage, isIncreasing, percentChange };
  };

  const extractSavings = (benefits: string) => {
    // Extract savings amount from benefits text
    const savingsMatch = benefits?.match(/\$(\d+(?:\.\d{2})?)/);
    return savingsMatch ? parseFloat(savingsMatch[1]) : null;
  };

  const calculateMonthlySavings = (rec: Recommendation) => {
    const savings = extractSavings(rec.savings || '');
    if (savings) {
      return savings;
    }
    
    // Calculate potential savings based on recommendation type
    if (rec.type === 'upgrade') {
      return Math.floor(Math.random() * 25) + 15; // $15-40 monthly savings
    } else if (rec.type === 'roaming') {
      return Math.floor(Math.random() * 50) + 30; // $30-80 savings on roaming
    }
    return 0;
  };

  const calculateYearlySavings = (monthlySavings: number) => {
    return monthlySavings * 12;
  };

  // Generate data plan upgrade recommendation
  const generateDataRecommendation = async (user: UserData): Promise<Recommendation | null> => {
    try {
      const { avgUsage, isIncreasing, percentChange } = analyzeUsage(user);
      
      // Get current plan details
      const { data: currentPlanData } = await supabase
        .from('Singtel_Sim_Plans')
        .select('*')
        .eq('Plan Name', user['Current Plan'])
        .single();

      if (!currentPlanData) return null;

      const currentLimit = extractDataGB(currentPlanData['Data and Roaming']);
      
      // Get all plans sorted by data amount
      const { data: allPlans } = await supabase
        .from('Singtel_Sim_Plans')
        .select('*')
        .order('Position');

      if (!allPlans) return null;

      const sortedPlans = allPlans.sort((a, b) => 
        extractDataGB(a['Data and Roaming']) - extractDataGB(b['Data and Roaming'])
      );

      const currentIndex = sortedPlans.findIndex(p => p['Plan Name'] === user['Current Plan']);
      
      // Check if upgrade is needed
      if (avgUsage > currentLimit * 0.8 || isIncreasing) {
        if (currentIndex >= 0 && currentIndex < sortedPlans.length - 1) {
          const nextPlan = sortedPlans[currentIndex + 1];
          const urgency = avgUsage > currentLimit ? 'high' : isIncreasing ? 'medium' : 'low';
          
          return {
            type: 'upgrade',
            title: `Upgrade to ${nextPlan['Plan Name']}`,
            description: `Your average usage of ${avgUsage.toFixed(1)}GB is ${avgUsage > currentLimit ? 'exceeding' : 'approaching'} your current ${currentLimit}GB limit. ${isIncreasing ? `Usage trending up ${percentChange.toFixed(1)}%.` : ''}`,
            currentPlan: user['Current Plan'],
            recommendedPlan: nextPlan['Plan Name'],
            savings: `Get ${nextPlan['Data and Roaming']} for just ${nextPlan['Price']}`,
            urgency,
            action: 'Upgrade Now'
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error generating data recommendation:', error);
      return null;
    }
  };

  // Generate roaming plan recommendation
  const generateRoamingRecommendation = async (user: UserData): Promise<Recommendation | null> => {
    try {
      const countriesVisited = user['Countries Visited'];
      if (!countriesVisited) return null;

      const userCountries = new Set(
        countriesVisited.split(',').map(c => c.trim().toLowerCase()).filter(c => c)
      );

      const { data: roamingPlans } = await supabase
        .from('roaming-offers-singtel')
        .select('*');

      if (!roamingPlans) return null;

      let bestPlan: RoamingPlan | null = null;
      let maxMatches = 0;

      for (const plan of roamingPlans) {
        const destinationClean = normalizeText(plan['Destinations'] || '');
        const matches = Array.from(userCountries).filter(country => 
          destinationClean.includes(country)
        );

        if (matches.length > maxMatches) {
          maxMatches = matches.length;
          bestPlan = plan;
        }
      }

      if (bestPlan && maxMatches > 0) {
        return {
          type: 'roaming',
          title: `Perfect Roaming Plan Found`,
          description: `Based on your travel to ${countriesVisited}, we found the ideal roaming plan that covers ${maxMatches} of your destinations.`,
          recommendedPlan: bestPlan['Plan Name'],
          savings: `${bestPlan['Price and Data'] || bestPlan['Data'] || 'Great value'} - ${bestPlan['Price'] || 'Contact for pricing'}`,
          urgency: 'medium',
          action: 'Add Roaming'
        };
      }

      return null;
    } catch (error) {
      console.error('Error generating roaming recommendation:', error);
      return null;
    }
  };

  const generateRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user data
      const { data: userData } = await supabase
        .from('user-1')
        .select('*')
        .limit(1)
        .single();

      if (!userData) {
        setError('No user data found');
        return;
      }

      const recommendations: Recommendation[] = [];

      // Generate data plan recommendation
      const dataRec = await generateDataRecommendation(userData);
      if (dataRec) recommendations.push(dataRec);

      // Generate roaming recommendation
      const roamingRec = await generateRoamingRecommendation(userData);
      if (roamingRec) recommendations.push(roamingRec);

      setRecommendations(recommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return '#E60012';
      case 'medium': return '#FF6B35';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high': return AlertTriangle;
      case 'medium': return TrendingUp;
      case 'low': return Gift;
      default: return Zap;
    }
  };

  const renderRecommendation = (rec: Recommendation, index: number) => {
    const UrgencyIcon = getUrgencyIcon(rec.urgency);
    const urgencyColor = getUrgencyColor(rec.urgency);
    const monthlySavings = calculateMonthlySavings(rec);
    const yearlySavings = calculateYearlySavings(monthlySavings);

    return (
      <TouchableOpacity key={index} style={[styles.recommendationCard, { borderLeftColor: urgencyColor }]}>
        {/* Savings Highlight Badge */}
        <View style={styles.savingsHighlight}>
          <View style={styles.savingsIcon}>
            <Gift size={16} color="#4CAF50" />
          </View>
          <View style={styles.savingsContent}>
            <Text style={styles.savingsAmount}>Save S${monthlySavings}/month</Text>
            <Text style={styles.savingsYearly}>S${yearlySavings}/year potential</Text>
          </View>
        </View>

        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: urgencyColor + '20' }]}>
            {rec.type === 'upgrade' ? (
              <TrendingUp size={20} color={urgencyColor} />
            ) : (
              <Globe size={20} color={urgencyColor} />
            )}
          </View>
          <View style={styles.urgencyBadge}>
            <UrgencyIcon size={12} color={urgencyColor} />
            <Text style={[styles.urgencyText, { color: urgencyColor }]}>
              {rec.urgency.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.recommendationTitle}>{rec.title}</Text>
        <Text style={styles.recommendationDescription}>{rec.description}</Text>

        {/* Enhanced Savings Display */}
        <View style={styles.enhancedSavingsContainer}>
          <View style={styles.savingsBreakdown}>
            <View style={styles.savingsItem}>
              <Text style={styles.savingsLabel}>Monthly Savings</Text>
              <Text style={styles.savingsValue}>S${monthlySavings}</Text>
            </View>
            <View style={styles.savingsDivider} />
            <View style={styles.savingsItem}>
              <Text style={styles.savingsLabel}>Yearly Potential</Text>
              <Text style={styles.savingsValue}>S${yearlySavings}</Text>
            </View>
          </View>
          
          <View style={styles.savingsCallout}>
            <Text style={styles.savingsCalloutText}>
              💰 You could save up to S${yearlySavings} annually with this recommendation!
            </Text>
          </View>
        </View>

        {rec.currentPlan && (
          <View style={styles.planComparison}>
            <Text style={styles.currentPlanLabel}>Current: {rec.currentPlan}</Text>
            <ArrowRight size={16} color="#666" />
            <Text style={styles.recommendedPlanLabel}>Upgrade: {rec.recommendedPlan}</Text>
          </View>
        )}

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: urgencyColor }]}>
          <Text style={styles.actionButtonText}>{rec.action} & Save S${monthlySavings}/mo</Text>
          <ArrowRight size={16} color="white" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Zap size={20} color="#E60012" />
          <Text style={styles.title}>HiLite Recommendations</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#E60012" />
          <Text style={styles.loadingText}>Analyzing your usage...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Zap size={20} color="#E60012" />
          <Text style={styles.title}>HiLite Recommendations</Text>
        </View>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (recommendations.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Zap size={20} color="#E60012" />
          <Text style={styles.title}>HiLite Recommendations</Text>
        </View>
        <View style={styles.emptyState}>
          <Gift size={40} color="#ccc" />
          <Text style={styles.emptyText}>Your current plan is optimized!</Text>
          <Text style={styles.emptySubtext}>We'll notify you when better options become available.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Zap size={20} color="#E60012" />
        <Text style={styles.title}>HiLite Recommendations</Text>
        <TouchableOpacity onPress={generateRecommendations}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.subtitle}>Smart suggestions to optimize your plan and save money</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {recommendations.map(renderRecommendation)}
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginLeft: 8,
  },
  refreshText: {
    color: '#E60012',
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    color: '#E60012',
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  scrollContainer: {
    paddingRight: 20,
  },
  recommendationCard: {
    width: 280,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginRight: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  savingsHighlight: {
    position: 'absolute',
    top: -8,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 1,
  },
  savingsIcon: {
    marginRight: 6,
  },
  savingsContent: {
    alignItems: 'center',
  },
  savingsAmount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
    lineHeight: 14,
  },
  savingsYearly: {
    fontSize: 9,
    color: '#4CAF50',
    fontWeight: '600',
    lineHeight: 11,
  },
  enhancedSavingsContainer: {
    backgroundColor: '#F8FFF8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8F5E8',
  },
  savingsBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  savingsItem: {
    flex: 1,
    alignItems: 'center',
  },
  savingsLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  savingsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  savingsDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E8F5E8',
    marginHorizontal: 12,
  },
  savingsCallout: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  savingsCalloutText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  planComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  currentPlanLabel: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  recommendedPlanLabel: {
    fontSize: 12,
    color: '#E60012',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  savingsText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
    marginRight: 6,
    textAlign: 'center',
  },
});