import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { Eye, Clock, TrendingUp, RefreshCw, Smartphone, Gift, DollarSign, Zap, Star, Tag, Moon, Sun } from 'lucide-react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface RecentView {
  id: string;
  category_name: string;
  clicked_item_name: string;
  clicked_at: string;
  category_id: string;
  user_id?: string;
}

interface iPhoneRecommendation {
  id: number;
  title: string;
  price_sgd: number;
  trigger_condition: string;
  benefits: string;
  plan_name: string;
  type: string;
  boolean: boolean;
}

interface SIMRecommendation {
  "Type": string;
  "Title": string;
  "Plan Name": string;
  "Price (S$)": number;
  "Benefits": string;
  "Trigger Condition": string;
  boolean: boolean;
}

interface PersonalizedRecommendationsProps {
  userId?: string;
}

export default function PersonalizedRecommendations({ userId }: PersonalizedRecommendationsProps) {
  const [recentViews, setRecentViews] = useState<RecentView[]>([]);
  const [iPhoneRecommendations, setIPhoneRecommendations] = useState<iPhoneRecommendation[]>([]);
  const [simRecommendations, setSimRecommendations] = useState<SIMRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiveUpdate, setIsLiveUpdate] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [showingIPhoneDeals, setShowingIPhoneDeals] = useState(false);
  const [showingSIMDeals, setShowingSIMDeals] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    console.log('PersonalizedRecommendations: Setting up component for userId:', userId);
    fetchRecentViews();
    checkForDealsAvailability();
    
    // Set up real-time subscription with enhanced logging
    const channel = supabase
      .channel('personalized_recommendations_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_interactions',
        },
        (payload) => {
          console.log('PersonalizedRecommendations: Real-time update received:', payload);
          setIsLiveUpdate(true);
          setLastUpdateTime(new Date());
          
          // Check if user viewed iPhone-related content
          const newInteraction = payload.new;
          if (newInteraction?.clicked_item_name?.toLowerCase().includes('apple iphone')) {
            console.log('Apple iPhone click detected, showing iPhone deals');
            setShowingIPhoneDeals(true);
            fetchIPhoneRecommendations();
          }
          
          // Check if user viewed SIM-related content
          const itemName = newInteraction?.clicked_item_name?.toLowerCase() || '';
          if (itemName.includes('lite') || 
              itemName.includes('core') || 
              itemName.includes('priority plus') || 
              itemName.includes('priority ultra')) {
            console.log('SIM plan click detected, showing SIM deals');
            setShowingSIMDeals(true);
            fetchSIMRecommendations();
          }
          
          // Fetch fresh data immediately
          fetchRecentViews();
          
          // Reset live indicator after 3 seconds
          setTimeout(() => setIsLiveUpdate(false), 3000);
        }
      )
      .subscribe((status) => {
        console.log('PersonalizedRecommendations: Subscription status:', status);
      });

    return () => {
      console.log('PersonalizedRecommendations: Cleaning up subscription');
      channel.unsubscribe();
    };
  }, [userId]);

  const fetchIPhoneRecommendations = async () => {
    try {
      console.log('PersonalizedRecommendations: Fetching iPhone recommendations');
      
      const { data, error } = await supabase
        .from('trigger_condition_recommendation_iphone')
        .select('*')
        .eq('boolean', true)
        .order('price_sgd', { ascending: true });

      if (error) {
        console.error('iPhone recommendations error:', error);
        throw error;
      }

      console.log('PersonalizedRecommendations: iPhone recommendations fetched:', data?.length || 0);
      setIPhoneRecommendations(data || []);
    } catch (err) {
      console.error('PersonalizedRecommendations: Error fetching iPhone recommendations:', err);
    }
  };

  const fetchSIMRecommendations = async () => {
    try {
      console.log('PersonalizedRecommendations: Fetching SIM recommendations');
      
      const { data, error } = await supabase
        .from('trigger_condition_recommendations_sim')
        .select('*')
        .eq('boolean', true)
        .order('"Price (S$)"', { ascending: true });

      if (error) {
        console.error('SIM recommendations error:', error);
        throw error;
      }

      console.log('PersonalizedRecommendations: SIM recommendations fetched:', data?.length || 0, data);
      setSimRecommendations(data || []);
    } catch (err) {
      console.error('PersonalizedRecommendations: Error fetching SIM recommendations:', err);
    }
  };

  const fetchRecentViews = async () => {
    try {
      console.log('PersonalizedRecommendations: Fetching recent views for userId:', userId);
      
      let query = supabase
        .from('user_interactions')
        .select('id, category_name, clicked_item_name, clicked_at, category_id, user_id')
        .not('clicked_item_name', 'is', null)
        .order('clicked_at', { ascending: false })
        .limit(20);

      // Get all interactions to check for iPhone and SIM plan clicks
      const { data: allInteractions } = await supabase
        .from('user_interactions')
        .select('clicked_item_name')
        .not('clicked_item_name', 'is', null);

      // Check if any interaction has "Apple iPhone" in the clicked_item_name
      const hasIPhoneViews = allInteractions?.some(interaction =>
        interaction.clicked_item_name?.toLowerCase().includes('apple iphone')
      );

      if (hasIPhoneViews) {
        console.log('Found iPhone views, enabling iPhone deals');
        setShowingIPhoneDeals(true);
        fetchIPhoneRecommendations();
      }

      // Check if any interaction has SIM plan names in the clicked_item_name
      const hasSIMViews = allInteractions?.some(interaction => {
        const itemName = interaction.clicked_item_name?.toLowerCase() || '';
        return itemName.includes('lite') || 
               itemName.includes('core') || 
               itemName.includes('priority plus') || 
               itemName.includes('priority ultra');
      });

      if (hasSIMViews) {
        console.log('Found SIM plan views, enabling SIM deals');
        setShowingSIMDeals(true);
        fetchSIMRecommendations();
      }

      // Get recent views for display
      const { data: allViews } = await query;

      // If userId is provided, prioritize user's views but also include some general views
      if (userId) {
        // Get user's specific views
        const { data: userViews } = await query.eq('user_id', userId);
        
        // Get some general recent views to fill gaps
        const { data: generalViews } = await supabase
          .from('user_interactions')
          .select('id, category_name, clicked_item_name, clicked_at, category_id, user_id')
          .not('clicked_item_name', 'is', null)
          .order('clicked_at', { ascending: false })
          .limit(10);

        // Combine and deduplicate
        const allViews = [...(userViews || []), ...(generalViews || [])];
        
        // Remove duplicates based on item name and category, keeping most recent
        const uniqueViews = allViews.reduce((acc: RecentView[], current: RecentView) => {
          const existingIndex = acc.findIndex(item => 
            item.clicked_item_name === current.clicked_item_name && 
            item.category_id === current.category_id
          );
          
          if (existingIndex === -1) {
            acc.push(current);
          } else if (new Date(current.clicked_at) > new Date(acc[existingIndex].clicked_at)) {
            acc[existingIndex] = current;
          }
          
          return acc;
        }, []);

        setRecentViews(uniqueViews.slice(0, 8));
      } else {
        // For anonymous users, show general recent activity
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }

        // Remove duplicates
        const uniqueViews = data?.reduce((acc: RecentView[], current: RecentView) => {
          const existingIndex = acc.findIndex(item => 
            item.clicked_item_name === current.clicked_item_name && 
            item.category_id === current.category_id
          );
          
          if (existingIndex === -1) {
            acc.push(current);
          } else if (new Date(current.clicked_at) > new Date(acc[existingIndex].clicked_at)) {
            acc[existingIndex] = current;
          }
          
          return acc;
        }, []) || [];

        setRecentViews(uniqueViews.slice(0, 8));
      }

      console.log('PersonalizedRecommendations: Fetched views count:', recentViews.length);
    } catch (err) {
      console.error('PersonalizedRecommendations: Error fetching recent views:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkForDealsAvailability = async () => {
    try {
      // Check all user interactions for iPhone and SIM plan clicks
      const { data: allInteractions } = await supabase
        .from('user_interactions')
        .select('clicked_item_name')
        .not('clicked_item_name', 'is', null);

      // Check for Apple iPhone clicks
      const hasIPhoneClicks = allInteractions?.some(interaction =>
        interaction.clicked_item_name?.toLowerCase().includes('apple iphone')
      );

      if (hasIPhoneClicks && !showingIPhoneDeals) {
        console.log('Found Apple iPhone clicks, fetching iPhone recommendations');
      }

      // Check for SIM plan clicks
      const hasSIMClicks = allInteractions?.some(interaction => {
        const itemName = interaction.clicked_item_name?.toLowerCase() || '';
        return itemName.includes('lite') || 
               itemName.includes('core') || 
               itemName.includes('priority plus') || 
               itemName.includes('priority ultra');
      });

      if (hasSIMClicks && !showingSIMDeals) {
        console.log('Found SIM plan clicks, fetching SIM recommendations');
        fetchSIMRecommendations();
      }
    } catch (err) {
      console.error('PersonalizedRecommendations: Error checking for deals availability:', err);
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'mobile':
        return '📱';
      case 'sim':
        return '📋';
      case 'broadband':
        return '🌐';
      case 'accessories':
        return '🎧';
      case 'tv':
        return '📺';
      case 'addons':
        return '✈️';
      case 'insurance':
        return '🛡️';
      default:
        return '📦';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const clickedAt = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - clickedAt.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const extractSavings = (benefits: string) => {
    // Extract savings amount from benefits text
    const savingsMatch = benefits?.match(/\$(\d+)/);
    return savingsMatch ? parseInt(savingsMatch[1]) : null;
  };

  const getPlanTier = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('lite')) return { tier: 'Lite', color: '#4CAF50', bgColor: '#E8F5E8' };
    if (name.includes('core')) return { tier: 'Core', color: '#FF6B35', bgColor: '#FFF3E0' };
    if (name.includes('priority plus')) return { tier: 'Priority Plus', color: '#9C27B0', bgColor: '#F3E5F5' };
    if (name.includes('priority ultra')) return { tier: 'Priority Ultra', color: '#E60012', bgColor: '#FFEBEE' };
    return { tier: 'Standard', color: '#666', bgColor: '#f8f9fa' };
  };

  const getThemeStyles = () => {
    return isDarkMode ? darkStyles : lightStyles;
  };

  const renderIPhoneRecommendation = (recommendation: iPhoneRecommendation, index: number) => {
    const savings = extractSavings(recommendation.benefits);
    const isHotDeal = savings && savings > 200;
    const themeStyles = getThemeStyles();

    return (
      <TouchableOpacity key={recommendation.id} style={[
        styles.iPhoneCard,
        themeStyles.card,
        isHotDeal && styles.hotDealCard
      ]}>
        {isHotDeal && (
          <View style={styles.hotDealBadge}>
            <Zap size={12} color="white" />
            <Text style={styles.hotDealText}>HOT DEAL</Text>
          </View>
        )}
        
        <View style={styles.iPhoneHeader}>
          <View style={styles.iPhoneIconContainer}>
            <Smartphone size={24} color="#E60012" />
          </View>
          <View style={styles.iPhoneInfo}>
            <Text style={[styles.iPhoneTitle, themeStyles.text]} numberOfLines={2}>
              {recommendation.title}
            </Text>
            <Text style={styles.iPhoneType}>{recommendation.type}</Text>
          </View>
        </View>

        <View style={[styles.iPricingSection, themeStyles.section]}>
          <View style={styles.priceContainer}>
            <Text style={styles.currency}>S$</Text>
            <Text style={styles.price}>{recommendation.price_sgd}</Text>
            <Text style={styles.priceLabel}>SGD</Text>
          </View>
          
          {savings && (
            <View style={styles.savingsContainer}>
              <Gift size={16} color="#4CAF50" />
              <Text style={styles.savingsText}>Save S${savings}</Text>
            </View>
          )}
        </View>

        <View style={styles.planSection}>
          <Tag size={14} color="#666" />
          <Text style={styles.planName}>{recommendation.plan_name}</Text>
        </View>

        <View style={styles.benefitsSection}>
          <Text style={[styles.benefitsTitle, themeStyles.secondaryText]}>Benefits:</Text>
          <Text style={[styles.benefitsText, themeStyles.text]} numberOfLines={2}>
            {recommendation.benefits}
          </Text>
        </View>

        <View style={styles.triggerSection}>
          <Text style={styles.triggerText}>
            💡 {recommendation.trigger_condition}
          </Text>
        </View>

        <TouchableOpacity style={styles.viewDealButton}>
          <DollarSign size={16} color="white" />
          <Text style={styles.viewDealText}>View Deal</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderSIMRecommendation = (recommendation: SIMRecommendation, index: number) => {
    const savings = extractSavings(recommendation["Benefits"]);
    const planTier = getPlanTier(recommendation["Plan Name"]);
    const isHotDeal = savings && savings > 50;
    const themeStyles = getThemeStyles();

    return (
      <TouchableOpacity key={`${recommendation["Plan Name"]}-${index}`} style={[
        styles.simCard,
        themeStyles.card,
        isHotDeal && styles.hotDealCard
      ]}>
        {isHotDeal && (
          <View style={styles.hotDealBadge}>
            <Zap size={12} color="white" />
            <Text style={styles.hotDealText}>HOT DEAL</Text>
          </View>
        )}
        
        <View style={styles.simHeader}>
          <View style={[styles.simIconContainer, { backgroundColor: planTier.bgColor }]}>
            <Text style={styles.simIcon}>📋</Text>
          </View>
          <View style={styles.simInfo}>
            <Text style={[styles.simTitle, themeStyles.text]} numberOfLines={2}>
              {recommendation["Title"] || recommendation["Plan Name"]}
            </Text>
            <Text style={[styles.simType, { color: planTier.color }]}>
              {recommendation["Type"] || 'SIM Plan'}
            </Text>
          </View>
        </View>

        <View style={[styles.simPricingSection, themeStyles.section]}>
          <View style={styles.priceContainer}>
            <Text style={styles.currency}>S$</Text>
            <Text style={styles.price}>{recommendation["Price (S$)"]}</Text>
            <Text style={styles.priceLabel}>SGD</Text>
          </View>
          
          {savings && (
            <View style={styles.savingsContainer}>
              <Gift size={16} color="#4CAF50" />
              <Text style={styles.savingsText}>Save S${savings}</Text>
            </View>
          )}
        </View>

        <View style={[styles.planTierSection, { backgroundColor: planTier.bgColor }]}>
          <View style={[styles.tierBadge, { backgroundColor: planTier.color }]}>
            <Text style={styles.tierText}>{planTier.tier}</Text>
          </View>
          <Text style={[styles.planNameText, { color: planTier.color }]}>
            {recommendation["Plan Name"]}
          </Text>
        </View>

        <View style={styles.benefitsSection}>
          <Text style={[styles.benefitsTitle, themeStyles.secondaryText]}>Benefits:</Text>
          <Text style={[styles.benefitsText, themeStyles.text]} numberOfLines={3}>
            {recommendation["Benefits"]}
          </Text>
        </View>

        <View style={styles.triggerSection}>
          <Text style={styles.triggerText}>
            💡 {recommendation["Trigger Condition"]}
          </Text>
        </View>

        <TouchableOpacity style={[styles.viewDealButton, { backgroundColor: planTier.color }]}>
          <DollarSign size={16} color="white" />
          <Text style={styles.viewDealText}>View Plan</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    const themeStyles = getThemeStyles();
    return (
      <View style={[styles.container, themeStyles.container]}>
        <View style={styles.header}>
          <TrendingUp size={20} color="#E60012" />
          <Text style={[styles.title, themeStyles.text]}>🤖 AI Recommendations</Text>
          <TouchableOpacity onPress={() => setIsDarkMode(!isDarkMode)} style={styles.themeToggle}>
            {isDarkMode ? <Sun size={16} color="#FFA500" /> : <Moon size={16} color="#666" />}
          </TouchableOpacity>
          {isLiveUpdate && <View style={styles.liveIndicator} />}
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#E60012" />
          <Text style={[styles.loadingText, themeStyles.secondaryText]}>Loading recommendations...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    const themeStyles = getThemeStyles();
    return (
      <View style={[styles.container, themeStyles.container]}>
        <View style={styles.header}>
          <TrendingUp size={20} color="#E60012" />
          <Text style={[styles.title, themeStyles.text]}>🤖 AI Recommendations</Text>
          <TouchableOpacity onPress={() => setIsDarkMode(!isDarkMode)} style={styles.themeToggle}>
            {isDarkMode ? <Sun size={16} color="#FFA500" /> : <Moon size={16} color="#666" />}
          </TouchableOpacity>
        </View>
        <Text style={styles.errorText}>Unable to load recommendations</Text>
        <TouchableOpacity onPress={() => {
          fetchRecentViews();
          fetchIPhoneRecommendations();
          fetchSIMRecommendations();
        }} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const themeStyles = getThemeStyles();

  // Show SIM deals if user has viewed SIM content
  if (showingSIMDeals && simRecommendations.length > 0) {
    return (
      <View style={[styles.container, themeStyles.container]}>
        <View style={styles.header}>
          <Text style={styles.simHeaderIcon}>📋</Text>
          <Text style={[styles.title, themeStyles.text]}>🤖 AI SIM Recommendations</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => setIsDarkMode(!isDarkMode)} style={styles.themeToggle}>
              {isDarkMode ? <Sun size={16} color="#FFA500" /> : <Moon size={16} color="#666" />}
            </TouchableOpacity>
            {isLiveUpdate && (
              <View style={styles.liveUpdateContainer}>
                <View style={styles.liveIndicator} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            )}
            <TouchableOpacity onPress={() => {
              fetchRecentViews();
              fetchSIMRecommendations();
            }} style={styles.refreshButton}>
              <RefreshCw size={16} color="#E60012" />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={[styles.subtitle, themeStyles.secondaryText]}>
          🎯 Personalized for your SIM interests • {simRecommendations.length} smart recommendations
        </Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {simRecommendations.map((recommendation, index) => 
            renderSIMRecommendation(recommendation, index)
          )}
        </ScrollView>
        
        <View style={styles.toggleContainer}>
          <TouchableOpacity onPress={checkForDealsAvailability} style={styles.checkDealsButton}>
            <Text style={styles.checkDealsText}>Check for Available Deals</Text>
          </TouchableOpacity>
          
          {iPhoneRecommendations.length > 0 && showingIPhoneDeals && (
            <TouchableOpacity 
              style={styles.iPhoneDealsToggle} 
              onPress={() => {
                setShowingSIMDeals(false);
                setShowingIPhoneDeals(true);
              }}
            >
              <Text style={styles.iPhoneDealsText}>View iPhone Deals</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.viewRecentButton, themeStyles.toggleButton]} 
            onPress={() => setShowingSIMDeals(false)}
          >
            <Text style={[styles.viewRecentText, themeStyles.toggleText]}>View Recent Activity</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show iPhone deals if user has viewed iPhone content or mobile category
  if (showingIPhoneDeals && iPhoneRecommendations.length > 0) {
    return (
      <View style={[styles.container, themeStyles.container]}>
        <View style={styles.header}>
          <Smartphone size={20} color="#E60012" />
          <Text style={[styles.title, themeStyles.text]}>🤖 AI iPhone Recommendations</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => setIsDarkMode(!isDarkMode)} style={styles.themeToggle}>
              {isDarkMode ? <Sun size={16} color="#FFA500" /> : <Moon size={16} color="#666" />}
            </TouchableOpacity>
            {isLiveUpdate && (
              <View style={styles.liveUpdateContainer}>
                <View style={styles.liveIndicator} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            )}
            <TouchableOpacity onPress={() => {
              fetchRecentViews();
              fetchIPhoneRecommendations();
            }} style={styles.refreshButton}>
              <RefreshCw size={16} color="#E60012" />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={[styles.subtitle, themeStyles.secondaryText]}>
          🎯 Curated based on your iPhone interest • {iPhoneRecommendations.length} smart recommendations
        </Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {iPhoneRecommendations.map((recommendation, index) => 
            renderIPhoneRecommendation(recommendation, index)
          )}
        </ScrollView>
        
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleButton, themeStyles.toggleButton]} 
            onPress={() => setShowingIPhoneDeals(false)}
          >
            <Text style={[styles.toggleText, themeStyles.toggleText]}>View Recent Activity</Text>
          </TouchableOpacity>
          
          {simRecommendations.length > 0 && showingSIMDeals && (
            <TouchableOpacity 
              style={[styles.toggleButton, themeStyles.toggleButton]} 
              onPress={() => {
                setShowingIPhoneDeals(false);
                setShowingSIMDeals(true);
              }}
            >
              <Text style={[styles.toggleText, themeStyles.toggleText]}>View SIM Deals</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Show regular recommendations if no iPhone deals or user hasn't viewed mobile content
  if (recentViews.length === 0) {
    return (
      <View style={[styles.container, themeStyles.container]}>
        <View style={styles.header}>
          <TrendingUp size={20} color="#E60012" />
          <Text style={[styles.title, themeStyles.text]}>🤖 AI Recommendations</Text>
          <TouchableOpacity onPress={() => setIsDarkMode(!isDarkMode)} style={styles.themeToggle}>
            {isDarkMode ? <Sun size={16} color="#FFA500" /> : <Moon size={16} color="#666" />}
          </TouchableOpacity>
          {isLiveUpdate && <View style={styles.liveIndicator} />}
        </View>
        <View style={styles.emptyState}>
          <Eye size={40} color="#ccc" />
          <Text style={[styles.emptyText, themeStyles.text]}>Start browsing to see personalized recommendations</Text>
          <Text style={[styles.emptySubtext, themeStyles.secondaryText]}>🛍️ Click on iPhone or SIM plans in Shop to get AI recommendations</Text>
          
          <View style={styles.dealsButtonContainer}>
            {iPhoneRecommendations.length > 0 && (
              <TouchableOpacity 
                style={styles.iPhoneDealsButton}
                onPress={() => setShowingIPhoneDeals(true)}
              >
                <Smartphone size={16} color="white" />
                <Text style={styles.iPhoneDealsButtonText}>View iPhone Deals</Text>
              </TouchableOpacity>
            )}
            
            {simRecommendations.length > 0 && (
              <TouchableOpacity 
                style={styles.simDealsButton}
                onPress={() => setShowingSIMDeals(true)}
              >
                <Text style={styles.simDealsIcon}>📋</Text>
                <Text style={styles.simDealsButtonText}>View SIM Deals</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, themeStyles.container]}>
      <View style={styles.header}>
        <View style={styles.headerIconContainer}>
          <Text style={styles.simHeaderIcon}>📋</Text>
        </View>
        <Text style={[styles.title, themeStyles.text]}>AI SIM Recommendations</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setIsDarkMode(!isDarkMode)} style={styles.themeToggle}>
            {isDarkMode ? <Sun size={16} color="#FFA500" /> : <Moon size={16} color="#666" />}
          </TouchableOpacity>
          {isLiveUpdate && (
            <View style={styles.liveUpdateContainer}>
              <View style={styles.liveIndicator} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          )}
          <TouchableOpacity onPress={() => {
            fetchRecentViews();
            fetchIPhoneRecommendations();
            fetchSIMRecommendations();
          }} style={styles.refreshButton}>
            <RefreshCw size={16} color="#E60012" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.subtitleContainer}>
        <View style={styles.personalizedBadge}>
          <Text style={styles.personalizedText}>Personalized for your SIM interests</Text>
        </View>
        <Text style={[styles.recommendationCount, themeStyles.secondaryText]}>
          {simRecommendations.length} recommendations
        </Text>
      </View>
      
      <View style={styles.dealsPromptsContainer}>
        {iPhoneRecommendations.length > 0 && showingIPhoneDeals && (
          <TouchableOpacity 
            style={[styles.iPhoneDealsPrompt, themeStyles.prompt]}
            onPress={() => setShowingIPhoneDeals(true)}
          >
            <Smartphone size={16} color="#E60012" />
            <Text style={styles.iPhoneDealsPromptText}>
              🤖 {iPhoneRecommendations.length} AI iPhone recommendations
            </Text>
            <Text style={styles.viewDealsText}>View Deals</Text>
          </TouchableOpacity>
        )}
        
        {simRecommendations.length > 0 && showingSIMDeals && (
          <TouchableOpacity 
            style={[styles.simDealsPrompt, themeStyles.prompt]}
            onPress={() => setShowingSIMDeals(true)}
          >
            <Text style={styles.simPromptIcon}>📋</Text>
            <Text style={styles.simDealsPromptText}>
              🤖 {simRecommendations.length} AI SIM recommendations
            </Text>
            <Text style={styles.viewDealsText}>View Deals</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {recentViews.map((item, index) => (
          <TouchableOpacity key={`${item.id}-${index}`} style={[styles.recommendationCard, themeStyles.card]}>
            <View style={styles.cardHeader}>
              <Text style={styles.categoryIcon}>{getCategoryIcon(item.category_id)}</Text>
              <View style={styles.timeContainer}>
                <Clock size={12} color="#666" />
                <Text style={styles.timeText}>{formatTimeAgo(item.clicked_at)}</Text>
              </View>
            </View>
            
            <View style={styles.cardContent}>
              <Text style={[styles.itemName, themeStyles.text]} numberOfLines={2}>
                {item.clicked_item_name}
              </Text>
              <Text style={[styles.categoryName, themeStyles.secondaryText]}>{item.category_name}</Text>
              {item.user_id === userId && (
                <View style={styles.personalBadge}>
                  <Text style={styles.personalText}>Your View</Text>
                </View>
              )}
            </View>
            
            <View style={styles.cardFooter}>
              <Text style={styles.viewAgainText}>View Again</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <TouchableOpacity style={[styles.viewAllButton, themeStyles.button]} onPress={() => {
        fetchRecentViews();
        fetchIPhoneRecommendations();
        fetchSIMRecommendations();
      }}>
        <Text style={[styles.viewAllText, themeStyles.buttonText]}>Refresh Recommendations</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 20,
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
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 10,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  themeToggle: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  liveUpdateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  liveIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginRight: 6,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  liveText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  refreshButton: {
    padding: 6,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 18,
    fontWeight: '500',
    lineHeight: 20,
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
    fontWeight: '500',
  },
  errorText: {
    color: '#E60012',
    textAlign: 'center',
    paddingVertical: 24,
    fontSize: 15,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#E60012',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'center',
    shadowColor: '#E60012',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  retryText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  emptySubtext: {
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 20,
  },
  dealsButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  iPhoneDealsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E60012',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#E60012',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  iPhoneDealsButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  simDealsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  simDealsIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  simDealsButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  dealsPromptsContainer: {
    gap: 12,
    marginBottom: 18,
  },
  iPhoneDealsPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFE0B2',
    backgroundColor: '#FFFBF8',
  },
  iPhoneDealsPromptText: {
    flex: 1,
    fontSize: 15,
    color: '#E65100',
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: -0.2,
  },
  simDealsPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFCC80',
    backgroundColor: '#FFFBF8',
  },
  simPromptIcon: {
    fontSize: 18,
  },
  simDealsPromptText: {
    flex: 1,
    fontSize: 15,
    color: '#E65100',
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: -0.2,
  },
  viewDealsText: {
    fontSize: 13,
    color: '#E60012',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  scrollContainer: {
    paddingRight: 24,
  },
  recommendationCard: {
    width: 180,
    borderRadius: 12,
    padding: 16,
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryIcon: {
    fontSize: 22,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 3,
    fontWeight: '500',
  },
  cardContent: {
    flex: 1,
    marginBottom: 10,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  categoryName: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
  },
  personalBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  personalText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
  },
  viewAgainText: {
    fontSize: 13,
    color: '#E60012',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  viewAllButton: {
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  // iPhone Recommendation Styles
  iPhoneCard: {
    width: 320,
    borderRadius: 16,
    padding: 20,
    marginRight: 18,
    borderWidth: 3,
    borderColor: '#FFE0B2',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    backgroundColor: '#FFFBF8',
  },
  // SIM Recommendation Styles
  simCard: {
    width: 300,
    borderRadius: 20,
    padding: 24,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E8F4FD',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    backgroundColor: '#FFFFFF',
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  simHeaderIcon: {
    fontSize: 20,
  },
  simHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  simIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  simIcon: {
    fontSize: 22,
  },
  simInfo: {
    flex: 1,
  },
  simTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    lineHeight: 20,
    letterSpacing: -0.3,
  },
  simType: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  simPricingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingVertical: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  planTierSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tierText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  planNameText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  personalizedBadge: {
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#B3D9F2',
  },
  personalizedText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  recommendationCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  checkDealsButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  checkDealsText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  iPhoneDealsToggle: {
    backgroundColor: '#E60012',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#E60012',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  iPhoneDealsText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  viewRecentButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  viewRecentText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  hotDealCard: {
    borderColor: '#FFF3E0',
    backgroundColor: '#FFFEF7',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  hotDealBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  hotDealText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  iPhoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iPhoneIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#E60012',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  iPhoneInfo: {
    flex: 1,
  },
  iPhoneTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  iPhoneType: {
    fontSize: 13,
    color: '#E60012',
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  iPricingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    fontSize: 16,
    color: '#666',
    marginRight: 3,
    fontWeight: '600',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E60012',
    letterSpacing: -0.5,
  },
  priceLabel: {
    fontSize: 13,
    color: '#666',
    marginLeft: 3,
    fontWeight: '600',
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  savingsText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginLeft: 6,
    letterSpacing: 0.2,
  },
  planSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#F3E5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1BEE7',
  },
  planName: {
    fontSize: 14,
    color: '#7B1FA2',
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: -0.2,
  },
  benefitsSection: {
    marginBottom: 16,
  },
  benefitsTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  benefitsText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  triggerSection: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  triggerText: {
    fontSize: 13,
    color: '#1976D2',
    fontStyle: 'italic',
    fontWeight: '500',
    lineHeight: 16,
  },
  viewDealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E60012',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#E60012',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  viewDealText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  checkDealsButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  checkDealsText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

const lightStyles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
  },
  card: {
    backgroundColor: '#ffffff',
  },
  text: {
    color: '#333',
  },
  secondaryText: {
    color: '#666',
  },
  section: {
    backgroundColor: '#F8F9FA',
  },
  button: {
    backgroundColor: '#F8F9FA',
  },
  buttonText: {
    color: '#E60012',
  },
  toggleButton: {
    backgroundColor: '#F8F9FA',
  },
  toggleText: {
    color: '#E60012',
  },
  prompt: {
    backgroundColor: '#FFFBF8',
  },
});

const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
  },
  card: {
    backgroundColor: '#2D2D2D',
  },
  text: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#CCCCCC',
  },
  section: {
    backgroundColor: '#3D3D3D',
  },
  button: {
    backgroundColor: '#3D3D3D',
  },
  buttonText: {
    color: '#FF6B35',
  },
  toggleButton: {
    backgroundColor: '#3D3D3D',
  },
  toggleText: {
    color: '#FF6B35',
  },
  prompt: {
    backgroundColor: '#2D2D2D',
  },
});