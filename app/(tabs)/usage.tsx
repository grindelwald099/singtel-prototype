import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChartBar as BarChart3, Clock, Smartphone, Wifi, ArrowUp, ArrowDown } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function UsageScreen() {
  const usageData = [
    { day: 'Mon', usage: 1.2, maxUsage: 3 },
    { day: 'Tue', usage: 2.8, maxUsage: 3 },
    { day: 'Wed', usage: 1.5, maxUsage: 3 },
    { day: 'Thu', usage: 3.2, maxUsage: 3.5 },
    { day: 'Fri', usage: 2.1, maxUsage: 3 },
    { day: 'Sat', usage: 1.8, maxUsage: 3 },
    { day: 'Sun', usage: 0.9, maxUsage: 3 },
  ];

  const topApps = [
    { name: 'Instagram', usage: 2.8, percentage: 25, icon: '📷' },
    { name: 'YouTube', usage: 2.1, percentage: 19, icon: '📺' },
    { name: 'WhatsApp', usage: 1.5, percentage: 13, icon: '💬' },
    { name: 'Spotify', usage: 1.2, percentage: 11, icon: '🎵' },
    { name: 'Netflix', usage: 1.0, percentage: 9, icon: '🎬' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Usage Analytics</Text>
          <TouchableOpacity style={styles.periodSelector}>
            <Text style={styles.periodText}>This Month</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Smartphone size={20} color="#E60012" />
            </View>
            <Text style={styles.summaryValue}>12.5 GB</Text>
            <Text style={styles.summaryLabel}>Total Used</Text>
            <View style={styles.changeIndicator}>
              <ArrowUp size={12} color="#4CAF50" />
              <Text style={styles.changeText}>+15%</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Clock size={20} color="#FF6B35" />
            </View>
            <Text style={styles.summaryValue}>1.8 GB</Text>
            <Text style={styles.summaryLabel}>Daily Average</Text>
            <View style={styles.changeIndicator}>
              <ArrowDown size={12} color="#E60012" />
              <Text style={[styles.changeText, { color: '#E60012' }]}>-8%</Text>
            </View>
          </View>
        </View>

        {/* Weekly Usage Chart */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Weekly Usage</Text>
            <TouchableOpacity>
              <BarChart3 size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.chartContainer}>
            {usageData.map((item, index) => (
              <View key={index} style={styles.chartBar}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      { 
                        height: (item.usage / item.maxUsage) * 100,
                        backgroundColor: item.usage > 2.5 ? '#E60012' : '#FF6B35'
                      }
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.day}</Text>
                <Text style={styles.barValue}>{item.usage}GB</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Top Apps */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Top Apps</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.appsList}>
            {topApps.map((app, index) => (
              <View key={index} style={styles.appItem}>
                <View style={styles.appIcon}>
                  <Text style={styles.appEmoji}>{app.icon}</Text>
                </View>
                <View style={styles.appContent}>
                  <Text style={styles.appName}>{app.name}</Text>
                  <View style={styles.appUsageBar}>
                    <View style={[styles.appUsageFill, { width: `${app.percentage}%` }]} />
                  </View>
                </View>
                <View style={styles.appStats}>
                  <Text style={styles.appUsage}>{app.usage} GB</Text>
                  <Text style={styles.appPercentage}>{app.percentage}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Usage Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Usage Breakdown</Text>
          
          <View style={styles.breakdownList}>
            <View style={styles.breakdownItem}>
              <View style={styles.breakdownIcon}>
                <Wifi size={20} color="#4CAF50" />
              </View>
              <View style={styles.breakdownContent}>
                <Text style={styles.breakdownLabel}>Wi-Fi</Text>
                <Text style={styles.breakdownValue}>8.2 GB</Text>
              </View>
              <Text style={styles.breakdownPercentage}>66%</Text>
            </View>

            <View style={styles.breakdownItem}>
              <View style={styles.breakdownIcon}>
                <Smartphone size={20} color="#E60012" />
              </View>
              <View style={styles.breakdownContent}>
                <Text style={styles.breakdownLabel}>Mobile Data</Text>
                <Text style={styles.breakdownValue}>4.3 GB</Text>
              </View>
              <Text style={styles.breakdownPercentage}>34%</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  periodSelector: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  periodText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 15,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '600',
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAll: {
    color: '#E60012',
    fontSize: 14,
    fontWeight: '600',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'end',
    height: 120,
    marginTop: 10,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    height: 80,
    width: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderRadius: 10,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  barValue: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
  },
  appsList: {
    marginTop: 10,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appEmoji: {
    fontSize: 20,
  },
  appContent: {
    flex: 1,
    marginRight: 12,
  },
  appName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  appUsageBar: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
  },
  appUsageFill: {
    height: '100%',
    backgroundColor: '#E60012',
    borderRadius: 2,
  },
  appStats: {
    alignItems: 'flex-end',
  },
  appUsage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  appPercentage: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  breakdownList: {
    marginTop: 15,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  breakdownIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  breakdownContent: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  breakdownValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  breakdownPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E60012',
  },
});
