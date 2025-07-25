import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { Gift, Headphones, Star, Clock, Tag } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

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
  discount_percentage?: number;
  discount_amount?: number;
  points_cost: number;
  value: string;
  category: string;
  subcategory?: string;
  expiry_date: string;
  is_active: boolean;
}

interface RecommendedVouchersProps {
  userId?: string;
}

export default function RecommendedVouchers({ userId }: RecommendedVouchersProps) {
  const { theme } = useTheme();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeadphoneVouchers();
  }, []);

  const fetchHeadphoneVouchers = async () => {
    try {
      setLoading(true);
      
      // Get headphone/audio related vouchers from accessory_vouchers table
      const { data, error } = await supabase
        .from('accessory_vouchers')
        .select('*')
        .eq('is_active', true)
        .or('category.ilike.%audio%,subcategory.ilike.%audio%,title.ilike.%headphone%,title.ilike.%speaker%,title.ilike.%earbuds%,keywords.cs.{audio,headphones,speakers}')
        .order('points_cost', { ascending: true })
        .limit(6);

      if (error) {
        console.error('Error fetching headphone vouchers:', error);
        return;
      }

      setVouchers(data || []);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <View style={styles.header}>
          <Headphones size={20} color="#E60012" />
          <Text style={[styles.cardTitle, { color: theme.text }]}>Recommended Vouchers</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#E60012" />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading vouchers...</Text>
        </View>
      </View>
    );
  }

  if (vouchers.length === 0) {
    return (
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <View style={styles.header}>
          <Headphones size={20} color="#E60012" />
          <Text style={[styles.cardTitle, { color: theme.text }]}>Recommended Vouchers</Text>
        </View>
        <View style={styles.emptyState}>
          <Gift size={40} color="#ccc" />
          <Text style={[styles.emptyText, { color: theme.text }]}>No vouchers available</Text>
          <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>Check back later for new deals</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <View style={styles.header}>
        <Headphones size={20} color="#E60012" />
        <Text style={[styles.cardTitle, { color: theme.text }]}>🎧 Audio Vouchers</Text>
        <TouchableOpacity>
          <Text style={[styles.viewAll, { color: theme.primary }]}>View All</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Special deals on headphones, speakers & audio accessories
      </Text>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.vouchersContainer}
      >
        {vouchers.map((voucher) => (
          <TouchableOpacity
            key={voucher.id}
            style={[
              styles.voucherCard,
              isExpiringSoon(voucher.expiry_date) && styles.urgentCard
            ]}
          >
            {isExpiringSoon(voucher.expiry_date) && (
              <View style={styles.urgentBadge}>
                <Clock size={12} color="white" />
                <Text style={styles.urgentText}>EXPIRES SOON</Text>
              </View>
            )}

            <View style={styles.voucherHeader}>
              <View style={styles.iconContainer}>
                <Headphones size={20} color="#E60012" />
              </View>
              <View style={styles.discountContainer}>
                <Text style={styles.discountText}>
                  {getDiscountDisplay(voucher)}
                </Text>
              </View>
            </View>

            <Text style={[styles.voucherTitle, { color: theme.text }]} numberOfLines={2}>
              {voucher.title}
            </Text>

            <Text style={[styles.voucherDescription, { color: theme.textSecondary }]} numberOfLines={2}>
              {voucher.description}
            </Text>

            <View style={styles.categorySection}>
              <Tag size={12} color="#666" />
              <Text style={styles.categoryText}>
                {voucher.subcategory || voucher.category}
              </Text>
            </View>

            <View style={styles.voucherFooter}>
              <View style={styles.pointsSection}>
                <Text style={styles.pointsCost}>{voucher.points_cost}</Text>
                <Text style={styles.pointsLabel}>pts</Text>
              </View>
              <Text style={styles.valueText}>{voucher.value}</Text>
            </View>

            <View style={styles.redeemButton}>
              <Star size={14} color="white" />
              <Text style={styles.redeemText}>Redeem Now</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 8,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
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
    marginLeft: 8,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 10,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 5,
  },
  vouchersContainer: {
    paddingRight: 20,
  },
  voucherCard: {
    width: 200,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  urgentCard: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF8F5',
  },
  urgentBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 1,
  },
  urgentText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountContainer: {
    backgroundColor: '#E60012',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  voucherTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    lineHeight: 18,
  },
  voucherDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  categorySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
    marginLeft: 4,
  },
  voucherFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pointsSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pointsCost: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E60012',
  },
  pointsLabel: {
    fontSize: 10,
    color: '#666',
    marginLeft: 2,
    fontWeight: '600',
  },
  valueText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  redeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E60012',
    paddingVertical: 10,
    borderRadius: 8,
  },
  redeemText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
});