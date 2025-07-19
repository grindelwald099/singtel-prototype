import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, CreditCard, Download, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Clock } from 'lucide-react-native';

export default function BillsScreen() {
  const currentBill = {
    amount: 68.50,
    dueDate: '25 Jan 2025',
    status: 'due',
    period: 'Dec 2024',
    breakdown: [
      { item: 'Mobile Plan', amount: 45.00 },
      { item: 'Extra Data', amount: 15.00 },
      { item: 'International Calls', amount: 8.50 },
    ]
  };

  const billHistory = [
    { id: 1, month: 'Nov 2024', amount: 62.30, status: 'paid', dueDate: '25 Nov 2024' },
    { id: 2, month: 'Oct 2024', amount: 58.75, status: 'paid', dueDate: '25 Oct 2024' },
    { id: 3, month: 'Sep 2024', amount: 71.20, status: 'paid', dueDate: '25 Sep 2024' },
    { id: 4, month: 'Aug 2024', amount: 55.90, status: 'paid', dueDate: '25 Aug 2024' },
    { id: 5, month: 'Jul 2024', amount: 63.40, status: 'paid', dueDate: '25 Jul 2024' },
  ];

  const paymentMethods = [
    { id: 1, type: 'Credit Card', number: '•••• 4567', isDefault: true },
    { id: 2, type: 'Bank Account', number: '•••• 8901', isDefault: false },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle size={20} color="#4CAF50" />;
      case 'due':
        return <AlertCircle size={20} color="#FF6B35" />;
      case 'overdue':
        return <AlertCircle size={20} color="#E60012" />;
      default:
        return <Clock size={20} color="#666" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#4CAF50';
      case 'due':
        return '#FF6B35';
      case 'overdue':
        return '#E60012';
      default:
        return '#666';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Bills & Payments</Text>
          <TouchableOpacity style={styles.downloadButton}>
            <Download size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Current Bill */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Current Bill</Text>
            <View style={styles.statusBadge}>
              {getStatusIcon(currentBill.status)}
              <Text style={[styles.statusText, { color: getStatusColor(currentBill.status) }]}>
                Payment Due
              </Text>
            </View>
          </View>

          <View style={styles.billSummary}>
            <View style={styles.billAmount}>
              <Text style={styles.currency}>S$</Text>
              <Text style={styles.amount}>{currentBill.amount}</Text>
            </View>
            <View style={styles.billInfo}>
              <View style={styles.billDetail}>
                <Calendar size={16} color="#666" />
                <Text style={styles.billDetailText}>Due: {currentBill.dueDate}</Text>
              </View>
              <Text style={styles.billPeriod}>Bill Period: {currentBill.period}</Text>
            </View>
          </View>

          <View style={styles.billBreakdown}>
            <Text style={styles.breakdownTitle}>Bill Breakdown</Text>
            {currentBill.breakdown.map((item, index) => (
              <View key={index} style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>{item.item}</Text>
                <Text style={styles.breakdownAmount}>S${item.amount.toFixed(2)}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.payButton}>
            <LinearGradient
              colors={['#E60012', '#FF6B35']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.payButtonGradient}
            >
              <CreditCard size={20} color="white" />
              <Text style={styles.payButtonText}>Pay S${currentBill.amount}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Payment Methods */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Payment Methods</Text>
            <TouchableOpacity>
              <Text style={styles.addNew}>Add New</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.paymentMethodsList}>
            {paymentMethods.map((method) => (
              <View key={method.id} style={styles.paymentMethod}>
                <View style={styles.paymentMethodIcon}>
                  <CreditCard size={20} color="#E60012" />
                </View>
                <View style={styles.paymentMethodInfo}>
                  <Text style={styles.paymentMethodType}>{method.type}</Text>
                  <Text style={styles.paymentMethodNumber}>{method.number}</Text>
                </View>
                {method.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Bill History */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Bill History</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.historyList}>
            {billHistory.map((bill) => (
              <TouchableOpacity key={bill.id} style={styles.historyItem}>
                <View style={styles.historyIcon}>
                  {getStatusIcon(bill.status)}
                </View>
                <View style={styles.historyContent}>
                  <Text style={styles.historyMonth}>{bill.month}</Text>
                  <Text style={styles.historyDate}>Due: {bill.dueDate}</Text>
                </View>
                <View style={styles.historyAmount}>
                  <Text style={styles.historyPrice}>S${bill.amount}</Text>
                  <Text style={[styles.historyStatus, { color: getStatusColor(bill.status) }]}>
                    {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Auto-Pay Settings */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Auto-Pay Settings</Text>
            <TouchableOpacity style={styles.toggleButton}>
              <Text style={styles.toggleText}>Enable</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.autoPayDescription}>
            Set up automatic payments to avoid late fees. Your bill will be paid automatically using your default payment method.
          </Text>

          <View style={styles.autoPayBenefits}>
            <View style={styles.benefitItem}>
              <CheckCircle size={16} color="#4CAF50" />
              <Text style={styles.benefitText}>Never miss a payment</Text>
            </View>
            <View style={styles.benefitItem}>
              <CheckCircle size={16} color="#4CAF50" />
              <Text style={styles.benefitText}>Avoid late fees</Text>
            </View>
            <View style={styles.benefitItem}>
              <CheckCircle size={16} color="#4CAF50" />
              <Text style={styles.benefitText}>Peace of mind</Text>
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
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  billSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  billAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: 20,
  },
  currency: {
    fontSize: 16,
    color: '#666',
    marginRight: 2,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  billInfo: {
    flex: 1,
  },
  billDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  billDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  billPeriod: {
    fontSize: 12,
    color: '#999',
  },
  billBreakdown: {
    marginBottom: 20,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  payButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  payButtonGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  addNew: {
    color: '#E60012',
    fontSize: 14,
    fontWeight: '600',
  },
  paymentMethodsList: {
    marginTop: 10,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  paymentMethodNumber: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  viewAll: {
    color: '#E60012',
    fontSize: 14,
    fontWeight: '600',
  },
  historyList: {
    marginTop: 10,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyMonth: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  historyAmount: {
    alignItems: 'flex-end',
  },
  historyPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  historyStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  toggleButton: {
    backgroundColor: '#E60012',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  toggleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  autoPayDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  autoPayBenefits: {
    marginTop: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
});