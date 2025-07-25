import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../hooks/useAuth';

const PersonalizedRecommendations = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('Just now');

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      const supabase = createClient(supabaseUrl!, supabaseKey!);

      // Get recommendations
      const { data, error } = await supabase
        .from('trigger_condition_recommendation_iphone')
        .select('*')
        .eq('boolean', true)
        .limit(3);

      if (error) throw error;

      setRecommendations(data || []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchRecommendations();
    }
  }, [user?.id]);

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color="#E60012" />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>iPhone Recommendations</Text>
        <Text style={styles.updatedText}>Updated {lastUpdated}</Text>
      </View>

      {recommendations.length > 0 ? (
        <>
          <Text style={styles.activityText}>Based on your recent activity</Text>
          {recommendations.map((rec) => (
            <View key={rec.id} style={styles.recommendationItem}>
              <Text style={styles.title}>{rec.title || 'iPhone'}</Text>
              <Text style={styles.subtitle}>{rec.type || 'Mobile'}</Text>
              {rec.plan_name && <Text style={styles.category}>{rec.plan_name}</Text>}
              {rec.price_sgd && (
                <Text style={styles.price}>${rec.price_sgd.toFixed(2)} SGD</Text>
              )}
              <TouchableOpacity style={styles.viewAgainButton}>
                <Text style={styles.viewAgainText}>View Again</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      ) : (
        <Text style={styles.noRecommendations}>No recommendations available</Text>
      )}

      <TouchableOpacity onPress={fetchRecommendations} style={styles.refreshButton}>
        <Text style={styles.refreshText}>Refresh Recommendations</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  activityText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  updatedText: {
    fontSize: 12,
    color: '#666',
  },
  recommendationItem: {
    marginVertical: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#E60012',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  viewAgainButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  viewAgainText: {
    color: '#E60012',
    fontWeight: '600',
  },
  refreshButton: {
    marginTop: 16,
    padding: 8,
    alignItems: 'center',
  },
  refreshText: {
    color: '#E60012',
    fontWeight: '600',
  },
  noRecommendations: {
    textAlign: 'center',
    paddingVertical: 16,
    color: '#666',
  },
});

export default PersonalizedRecommendations;