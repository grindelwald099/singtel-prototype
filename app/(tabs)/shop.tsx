import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image, FlatList, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Smartphone, CreditCard, Wifi, Monitor, Package, Shield } from 'lucide-react-native';
import { createClient } from '@supabase/supabase-js';
import AccessorySearchBar from '@/components/AccessorySearchBar';
import SearchBasedVouchers from '@/components/SearchBasedVouchers';

const { width } = Dimensions.get('window');

// Initialize Supabase with enhanced configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Helper function to sanitize text content
const sanitizeText = (text: any, defaultValue: string = ''): string => {
  if (text === null || text === undefined || text === '.' || text === '') {
    return defaultValue;
  }
  return String(text).trim();
};

export default function ShopScreen() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchVouchers, setSearchVouchers] = useState<any[]>([]);

  // Enhanced user session management
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.log('Session error:', error);
          setUser(null);
        } else {
          setUser(session?.user || null);
        }
      } catch (err) {
        console.log('Failed to get session:', err);
      } finally {
        setSessionLoaded(true);
      }
    };

    fetchSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const shopCategories = [
    {
      id: 'mobile',
      title: 'Mobile',
      subtitle: '',
      icon: Smartphone,
      backgroundColor: '#F5E6D3',
      textColor: '#8B4513',
      size: 'large',
      image: 'https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=400',
      table: 'Mobile_with_SIM'
    },
    {
      id: 'sim',
      title: 'SIM Only',
      subtitle: 'plan',
      icon: CreditCard,
      backgroundColor: '#E74C3C',
      textColor: '#FFFFFF',
      size: 'medium',
      image: 'https://images.pexels.com/photos/6214479/pexels-photo-6214479.jpeg?auto=compress&cs=tinysrgb&w=400',
      table: 'Singtel_Sim_Plans'
    },
    {
      id: 'broadband',
      title: 'Fibre',
      subtitle: 'Broadband',
      icon: Wifi,
      backgroundColor: '#D6E8F5',
      textColor: '#2C3E50',
      size: 'medium',
      image: 'https://images.pexels.com/photos/4219654/pexels-photo-4219654.jpeg?auto=compress&cs=tinysrgb&w=400',
      table: 'Broadband'
    },
    {
      id: 'accessories',
      title: 'Devices &',
      subtitle: 'Gadgets',
      icon: Package,
      backgroundColor: '#4A4A4A',
      textColor: '#FFFFFF',
      size: 'medium',
      image: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=400',
      table: 'accessories'
    },
    {
      id: 'tv',
      title: 'TV',
      subtitle: '',
      icon: Monitor,
      backgroundColor: '#B8C5D6',
      textColor: '#2C3E50',
      size: 'medium',
      image: 'https://images.pexels.com/photos/1201996/pexels-photo-1201996.jpeg?auto=compress&cs=tinysrgb&w=400',
      table: 'CAST.SG'
    },
    {
      id: 'addons',
      title: 'Add-ons',
      subtitle: '',
      icon: Package,
      backgroundColor: '#C8E6C9',
      textColor: '#2E7D32',
      size: 'medium',
      image: 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=400',
      table: 'roaming-offers-singtel'
    },
    {
      id: 'insurance',
      title: 'Insura',
      subtitle: 'nce',
      icon: Shield,
      backgroundColor: '#F0E6D2',
      textColor: '#8B4513',
      size: 'medium',
      image: 'https://images.pexels.com/photos/6863183/pexels-photo-6863183.jpeg?auto=compress&cs=tinysrgb&w=400',
      table: 'insurance_plans'
    }
  ];

  const hotDeals = [
    {
      id: 1,
      title: 'MORE SAVINGS of up to $1,557 on the new Samsung Galaxy Z Series.',
      subtitle: 'Let your Ultra unfold with Singtel 5G+.',
      backgroundColor: '#E74C3C',
      textColor: '#FFFFFF',
      image: 'https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    {
      id: 2,
      title: 'Extra $300 bonus. Best value this SG60.',
      subtitle: 'Save $725 & more with a new sign-up plan. Or, save $600',
      backgroundColor: '#2C3E50',
      textColor: '#FFFFFF',
      image: 'https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=800'
    }
  ];

  // Enhanced click tracking function
  const trackClick = async (categoryId: string, categoryName: string, itemId?: string, itemName?: string) => {
    console.log('Shop: Tracking click for:', { categoryId, categoryName, itemId, itemName, userId: user?.id });
    
    if (!sessionLoaded) {
      console.log('Session not loaded yet, will retry tracking');
      return;
    }

    try {
      const deviceInfo = {
        os: Platform.OS,
        platform: Platform.OS,
        version: Platform.Version,
        timestamp: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('user_interactions')
        .insert({
          user_id: user?.id || null,
          category_id: categoryId,
          category_name: categoryName,
          clicked_item_id: itemId || null,
          clicked_item_name: itemName || null,
          device_info: JSON.stringify(deviceInfo),
          clicked_at: new Date().toISOString(),
        })
        .select();

      if (error) {
        console.error('Shop: Supabase insert error:', error);
        return;
      }

      console.log('Shop: Successfully tracked click:', data);
      
      // Force a small delay to ensure the database update is processed
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (err) {
      console.error('Shop: Failed to track click:', err);
    }
  };

  const fetchCategoryData = async (category: any) => {
    setLoading(true);
    setError(null);
    try {
      // Track the category click
      await trackClick(category.id, `${category.title} ${category.subtitle || ''}`);
      
      const { data, error } = await supabase
        .from(category.table)
        .select('*')
        .order('Position');
      
      if (error) throw error;
      setCategoryData(data || []);
      setActiveCategory(category.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = async (item: any) => {
    const category = shopCategories.find(c => c.id === activeCategory);
    if (category) {
      const itemName = item['Phone Name'] || item['Plan Name'] || item['Product_Name'] || item['App Name'] || 'Unknown Item';
      const itemId = item.Position?.toString() || item.id || 'unknown';
      
      console.log('Shop: Item clicked:', { item, category, itemName, itemId });
      
      await trackClick(
        category.id, 
        `${category.title} ${category.subtitle || ''}`,
        itemId,
        itemName
      );
      
      // Special handling for accessories to trigger voucher recommendations
      if (category.id === 'accessories' && item.Position) {
        console.log('Shop: Accessory clicked, triggering voucher recommendations for position:', item.Position);
        
        // Additional tracking specifically for voucher recommendations
        try {
          const { data: trackingResult, error: trackingError } = await supabase
            .from('user_interactions')
            .insert({
              user_id: user?.id || null,
              category_id: 'accessories',
              category_name: 'Accessories',
              clicked_item_id: item.Position.toString(),
              clicked_item_name: item['Product_Name'] || 'Unknown Product',
              device_info: JSON.stringify({
                action_type: 'accessory_click',
                position: item.Position,
                product_name: item['Product_Name'],
                price: item['Price'],
                offer: item['Offer'],
                timestamp: new Date().toISOString()
              }),
              clicked_at: new Date().toISOString()
            })
            .select();
          
          if (trackingError) {
            console.error('Shop: Error tracking accessory click:', trackingError);
          } else {
            console.log('Shop: Accessory click tracked successfully:', trackingResult);
          }
        } catch (error) {
          console.error('Shop: Error tracking accessory click:', error);
        }
      }
      
      console.log('Shop: Item click tracking completed');
    }
  };

  // Rest of your component code remains exactly the same...
  const renderCategoryCard = (category: any) => {
    const isLarge = category.size === 'large';
    const cardStyle = isLarge 
      ? [styles.categoryCard, styles.largeCategoryCard, { backgroundColor: category.backgroundColor }]
      : [styles.categoryCard, { backgroundColor: category.backgroundColor }];

    return (
      <TouchableOpacity 
        key={category.id}
        style={cardStyle}
        onPress={() => fetchCategoryData(category)}
      >
        <View style={styles.categoryContent}>
          <Text style={[styles.categoryTitle, { color: category.textColor }]}>
            {category.title}
          </Text>
          {category.subtitle ? (
            <Text style={[styles.categorySubtitle, { color: category.textColor }]}>
              {category.subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.categoryImageContainer}>
          <Image 
            source={{ uri: category.image }} 
            style={styles.categoryImage}
            resizeMode="cover"
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    let itemName = '';
    let itemId = item.Position?.toString() || item.id || '';
    
    switch (activeCategory) {
      case 'mobile':
        itemName = sanitizeText(item['Phone Name'], 'Unknown Phone');
        break;
      case 'sim':
        itemName = sanitizeText(item['Plan Name'], 'Unknown Plan');
        break;
      case 'accessories':
        itemName = sanitizeText(item['Product_Name'], 'Unknown Product');
        break;
      case 'tv':
        itemName = sanitizeText(item['App Name'], 'Unknown App');
        break;
      case 'addons':
        itemName = sanitizeText(item['Plan Name'], 'Unknown Plan');
        break;
      default:
        itemName = 'Unknown Item';
    }

    return (
      <TouchableOpacity 
        style={styles.itemCard}
        onPress={() => handleItemClick(item)}
      >
        {renderItemContent(item)}
      </TouchableOpacity>
    );
  };

  const renderItemContent = (item: any) => {
    switch (activeCategory) {
      case 'mobile':
        return (
          <>
            <Image 
              source={{ uri: sanitizeText(item['Image URL'], 'https://via.placeholder.com/150') }} 
              style={styles.itemImage}
            />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{sanitizeText(item['Phone Name'], 'Unknown Phone')}</Text>
              {sanitizeText(item['Discount Offer']) && (
                <Text style={styles.itemDiscount}>{sanitizeText(item['Discount Offer'])}</Text>
              )}
            </View>
          </>
        );
      
      case 'sim':
        return (
          <>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>{sanitizeText(item['Plan Name'], 'Unknown Plan')}</Text>
              {sanitizeText(item['Price']) && <Text style={styles.itemPrice}>{sanitizeText(item['Price'])}</Text>}
            </View>
            <View style={styles.itemContent}>
              {sanitizeText(item['Network Type']) && (
                <Text style={styles.itemText}>Network: {sanitizeText(item['Network Type'])}</Text>
              )}
              {sanitizeText(item['Data and Roaming']) && (
                <Text style={styles.itemText}>Data: {sanitizeText(item['Data and Roaming'])}</Text>
              )}
            </View>
          </>
        );
      
      case 'broadband':
        return (
          <>
            {sanitizeText(item['Image_url']) && (
              <Image 
                source={{ uri: sanitizeText(item['Image_url']) }} 
                style={styles.itemImage}
              />
            )}
            <View style={styles.itemDetails}>
              <Text style={styles.itemTitle}>{sanitizeText(item['Type_Broadband'], 'Unknown Broadband')}</Text>
              {sanitizeText(item['Price']) && <Text style={styles.itemPrice}>{sanitizeText(item['Price'])}</Text>}
            </View>
          </>
        );
      
      case 'accessories':
        return (
          <>
            {sanitizeText(item['Image_Url']) && (
              <Image 
                source={{ uri: sanitizeText(item['Image_Url']) }} 
                style={styles.itemImage}
              />
            )}
            <View style={styles.itemDetails}>
              <Text style={styles.itemTitle}>{sanitizeText(item['Product_Name'], 'Unknown Product')}</Text>
              {sanitizeText(item['Price']) && <Text style={styles.itemPrice}>{sanitizeText(item['Price'])}</Text>}
            </View>
          </>
        );
      
      case 'tv':
        return (
          <>
            {sanitizeText(item['Image']) && (
              <Image 
                source={{ uri: sanitizeText(item['Image']) }} 
                style={styles.itemImage}
              />
            )}
            <View style={styles.itemDetails}>
              <Text style={styles.itemTitle}>{sanitizeText(item['App Name'], 'Unknown App')}</Text>
              {sanitizeText(item['Price']) && <Text style={styles.itemPrice}>{sanitizeText(item['Price'])}</Text>}
            </View>
          </>
        );
      
      case 'addons':
        return (
          <>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>{sanitizeText(item['Plan Name'], 'Unknown Plan')}</Text>
              <Text style={styles.itemDestination}>{sanitizeText(item['Destinations'])}</Text>
            </View>
            {sanitizeText(item['Image']) && (
              <Image 
                source={{ uri: sanitizeText(item['Image']) }} 
                style={styles.itemImage}
              />
            )}
            <View style={styles.itemContent}>
              {sanitizeText(item['Price and Data']) && (
                <Text style={styles.itemText}>{sanitizeText(item['Price and Data'])}</Text>
              )}
            </View>
          </>
        );
      
      default:
        return null;
    }
  };

  const getCategoryTitle = () => {
    const category = shopCategories.find(c => c.id === activeCategory);
    return category ? `${category.title} ${category.subtitle || ''}` : '';
  };

  if (activeCategory) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setActiveCategory(null)}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{getCategoryTitle()}</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <FlatList
              data={categoryData}
              renderItem={renderItem}
              keyExtractor={(item) => item.Position?.toString() || item.id || Math.random().toString()}
              contentContainerStyle={styles.itemsContainer}
              numColumns={activeCategory === 'mobile' || activeCategory === 'accessories' ? 2 : 1}
              columnWrapperStyle={activeCategory === 'mobile' || activeCategory === 'accessories' ? styles.itemsRow : undefined}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shop</Text>
        </View>

        {/* Search Bar */}
        <AccessorySearchBar 
          onSearch={setSearchQuery}
          placeholder="Search for accessories, headphones, cases..."
        />

        {/* Search-Based Vouchers */}
        {(searchQuery || searchVouchers.length > 0) && (
          <SearchBasedVouchers 
            userId={user?.id}
            searchQuery={searchQuery}
            onVoucherSelect={(voucher) => {
              console.log('Voucher selected:', voucher);
              // Handle voucher selection (e.g., navigate to redemption)
            }}
          />
        )}

        <View style={styles.categoriesContainer}>
          <View style={styles.categoriesGrid}>
            <View style={styles.leftColumn}>
              {renderCategoryCard(shopCategories[0])}
            </View>
            <View style={styles.rightColumn}>
              {renderCategoryCard(shopCategories[1])}
              {renderCategoryCard(shopCategories[2])}
            </View>
          </View>

          <View style={styles.categoriesGrid}>
            <View style={styles.leftColumn}>
              {renderCategoryCard(shopCategories[3])}
            </View>
            <View style={styles.rightColumn}>
              {renderCategoryCard(shopCategories[4])}
            </View>
          </View>

          <View style={styles.categoriesGrid}>
            <View style={styles.leftColumn}>
              {renderCategoryCard(shopCategories[5])}
            </View>
            <View style={styles.rightColumn}>
              {renderCategoryCard(shopCategories[6])}
            </View>
          </View>
        </View>

        <View style={styles.hotDealsSection}>
          <Text style={styles.hotDealsTitle}>Hot deals</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hotDealsContainer}
          >
            {hotDeals.map((deal) => (
              <TouchableOpacity key={deal.id} style={styles.hotDealCard}>
                <LinearGradient
                  colors={[deal.backgroundColor, deal.backgroundColor]}
                  style={styles.hotDealGradient}
                >
                  <View style={styles.hotDealContent}>
                    <Text style={[styles.hotDealTitle, { color: deal.textColor }]}>
                      {deal.title}
                    </Text>
                    <Text style={[styles.hotDealSubtitle, { color: deal.textColor }]}>
                      {deal.subtitle}
                    </Text>
                  </View>
                  <View style={styles.hotDealImageContainer}>
                    <Image 
                      source={{ uri: deal.image }} 
                      style={styles.hotDealImage}
                      resizeMode="cover"
                    />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  backButton: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 10,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  categoriesGrid: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 15,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
    gap: 15,
  },
  categoryCard: {
    borderRadius: 20,
    padding: 20,
    minHeight: 120,
    position: 'relative',
    overflow: 'hidden',
  },
  largeCategoryCard: {
    minHeight: 250,
  },
  categoryContent: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 2,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  categorySubtitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  categoryImageContainer: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  hotDealsSection: {
    backgroundColor: '#F5F5F5',
    paddingTop: 30,
    paddingBottom: 100,
  },
  hotDealsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  hotDealsContainer: {
    paddingHorizontal: 20,
    gap: 15,
  },
  hotDealCard: {
    width: width * 0.85,
    borderRadius: 20,
    overflow: 'hidden',
  },
  hotDealGradient: {
    padding: 25,
    minHeight: 180,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hotDealContent: {
    flex: 1,
    paddingRight: 15,
  },
  hotDealTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 24,
    marginBottom: 8,
  },
  hotDealSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  hotDealImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  hotDealImage: {
    width: '100%',
    height: '100%',
  },
  itemsContainer: {
    padding: 15,
  },
  itemsRow: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  itemCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
  },
  itemImage: {
    width: '100%',
    height: 150,
    resizeMode: 'contain',
    backgroundColor: '#F5F5F5',
  },
  itemDetails: {
    padding: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  itemContent: {
    padding: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E74C3C',
  },
  itemDiscount: {
    fontSize: 12,
    color: '#E74C3C',
  },
  itemText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  itemDestination: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  errorText: {
    color: '#E74C3C',
    textAlign: 'center',
    padding: 20,
  },
});