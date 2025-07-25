import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { Search, Gift, Star, Clock, Tag, Zap, TrendingUp } from 'lucide-react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rsqytbhetidgzpsifhiv.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzcXl0YmhldGlkZ3pwc2lmaGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NzczMzMsImV4cCI6MjA2NzM1MzMzM30.Y9S4HRe2XVqDCF93zCKcqfXHHLd3symW1knj9uAyIiQ';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Voucher {
  id: string;
  title: string;
  description: string;
  discount_percentage?: number;
  discount_amount?: number;
  category: string;
  subcategory?: string;
  points_cost: number;
  value: string;
  expiry_date: string;
  match_score: number;
}

interface SearchBasedVouchersProps {
  userId?: string;
  searchQuery?: string;
  onVoucherSelect?: (voucher: Voucher) => void;
}

export default function SearchBasedVouchers({ 
  userId, 
  searchQuery, 
  onVoucherSelect 
}: SearchBasedVouchersProps) {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchRecentSearches();
  }, [userId]);

  useEffect(() => {
    if (searchQuery && searchQuery !== lastSearchQuery) {
      handleNewSearch(searchQuery);
      setLastSearchQuery(searchQuery);
    }
  }, [searchQuery, lastSearchQuery]);

  const fetchRecentSearches = async () => {
    try {
      const { data, error } = await supabase
        .from('user_searches')
        .select('search_query')
        .eq('search_type', 'accessory')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching recent searches:', error);
        return;
      }

      // Get unique search queries
      const uniqueSearches = [...new Set(data?.map(item => item.search_query) || [])];
      setRecentSearches(uniqueSearches.slice(0, 5));

      // If we have recent searches, show vouchers for the most recent one
      if (uniqueSearches.length > 0 && !searchQuery) {
        findVouchersForSearch(uniqueSearches[0]);
      }
    } catch (error) {
      console.error('Error fetching recent searches:', error);
    }
  };

  const handleNewSearch = async (query: string) => {
    setLoading(true);
    try {
      // Log search and get matching vouchers
      const { data, error } = await supabase.rpc('log_search_and_get_vouchers', {
        searching_user_id: userId || null,
        search_query_input: query.trim(),
        search_category_input: 'accessories'
      });

      if (error) {
        console.error('Error logging search:', error);
        return;
      }

      if (data?.vouchers) {
        setVouchers(data.vouchers);
        
        // Update recent searches
        setRecentSearches(prev => {
          const updated = [query, ...prev.filter(s => s !== query)];
          return updated.slice(0, 5);
        });
      }
    } catch (error) {
      console.error('Error handling search:', error);
    } finally {
      setLoading(false);
    }
  };

  const findVouchersForSearch = async (query: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('find_matching_vouchers', {
        search_text: query
      });

      if (error) {
        console.error('Error finding vouchers:', error);
        return;
      }

      setVouchers(data || []);
    } catch (error) {
      console.error('Error finding vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackVoucherView = async (voucher: Voucher) => {
    try {
      await supabase
        .from('user_voucher_views')
        .insert({
          user_id: userId || null,
          voucher_id: voucher.id,
          search_query: searchQuery || lastSearchQuery
        });

      onVoucherSelect?.(voucher);
    } catch (error) {
      console.error('Error tracking voucher view:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'audio': return '🎧';
      case 'mobile': return '📱';
      case 'gaming': return '🎮';
      case 'smart home': return '🏠';
      case 'computer': return '💻';
      case 'tablet': return '📱';
      case 'wearables': return '⌚';
      case 'connectivity': return '🔌';
      case 'bundle': return '📦';
      default: return '🎁';
    }
  };

  const getDiscountDisplay = (voucher: Voucher) => {
    if (voucher.discount_percentage) {
      return `${voucher.discount_percentage}% OFF`;
    }
    if (voucher.discount_amount) {
      return `$${voucher.discount_amount} OFF`;
    }
    return voucher.value;
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysDiff = (expiry.getTime() - now.getTime()) / (1000 * 3600 * 24);
    return daysDiff <= 7 && daysDiff > 0;
  };

  if (vouchers.length === 0 && !loading) {
    return null; // Don't show anything if no vouchers
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Search size={20} color="#E60012" />
          <Text style={styles.title}>
            {searchQuery ? `Vouchers for "${searchQuery}"` : 'Search-Based Vouchers'}
          </Text>
        </View>
        {vouchers.length > 0 && (
          <View style={styles.voucherCount}>
            <Text style={styles.countText}>{vouchers.length}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#E60012" />
          <Text style={styles.loadingText}>Finding matching vouchers...</Text>
        </View>
      ) : (
        <>
          {vouchers.length > 0 && (
            <Text style={styles.subtitle}>
              🎯 Found {vouchers.length} vouchers matching your search
            </Text>
          )}

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
            {vouchers.map((voucher) => (
              <TouchableOpacity
                key={voucher.id}
                style={[
                  styles.voucherCard,
                  isExpiringSoon(voucher.expiry_date) && styles.urgentCard
                ]}
                onPress={() => trackVoucherView(voucher)}
              >
                {isExpiringSoon(voucher.expiry_date) && (
                  <View style={styles.urgentBadge}>
                    <Clock size={12} color="white" />
                    <Text style={styles.urgentText}>EXPIRES SOON</Text>
                  </View>
                )}

                {voucher.match_score > 2 && (
                  <View style={styles.perfectMatchBadge}>
                    <Star size={12} color="white" />
                    <Text style={styles.perfectMatchText}>PERFECT MATCH</Text>
                  </View>
                )}

                <View style={styles.cardHeader}>
                  <Text style={styles.categoryIcon}>
                    {getCategoryIcon(voucher.category)}
                  </Text>
                  <View style={styles.discountContainer}>
                    <Text style={styles.discountText}>
                      {getDiscountDisplay(voucher)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.voucherTitle} numberOfLines={2}>
                  {voucher.title}
                </Text>

                <Text style={styles.voucherDescription} numberOfLines={3}>
                  {voucher.description}
                </Text>

                <View style={styles.categorySection}>
                  <Tag size={14} color="#666" />
                  <Text style={styles.categoryText}>
                    {voucher.subcategory || voucher.category}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.pointsSection}>
                    <Text style={styles.pointsCost}>{voucher.points_cost}</Text>
                    <Text style={styles.pointsLabel}>pts</Text>
                  </View>
                  <Text style={styles.valueText}>{voucher.value}</Text>
                </View>

                <View style={styles.matchScore}>
                  <TrendingUp size={12} color="#4CAF50" />
                  <Text style={styles.matchScoreText}>
                    {voucher.match_score} keyword matches
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {recentSearches.length > 0 && (
            <View style={styles.recentSearches}>
              <Text style={styles.recentTitle}>Recent Searches:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {recentSearches.map((search, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.recentSearchTag}
                    onPress={() => findVouchersForSearch(search)}
                  >
                    <Text style={styles.recentSearchText}>{search}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </>
      )}
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  voucherCount: {
    backgroundColor: '#E60012',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  scrollContainer: {
    paddingRight: 20,
  },
  voucherCard: {
    width: 260,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 18,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  urgentCard: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF8F5',
  },
  urgentBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  urgentText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  perfectMatchBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  perfectMatchText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 8,
  },
  categoryIcon: {
    fontSize: 28,
  },
  discountContainer: {
    backgroundColor: '#E60012',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  discountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  voucherTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  voucherDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  categorySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginLeft: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pointsSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pointsCost: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E60012',
  },
  pointsLabel: {
    fontSize: 11,
    color: '#666',
    marginLeft: 2,
    fontWeight: '600',
  },
  valueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  matchScore: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  matchScoreText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
  recentSearches: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  recentSearchTag: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  recentSearchText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});