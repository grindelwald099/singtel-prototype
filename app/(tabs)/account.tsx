import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Settings, Shield, Bell, CircleHelp as HelpCircle, LogOut, ChevronRight, Smartphone, CreditCard, Globe, Lock, Moon, Wifi } from 'lucide-react-native';

export default function AccountScreen() {
  const userProfile = {
    name: 'John Doe',
    phone: '+65 9123 4567',
    email: 'john.doe@email.com',
    plan: 'Lite',
    memberSince: 'March 2020'
  };

  const accountSettings = [
    {
      title: 'Personal Information',
      items: [
        { icon: User, label: 'Profile Details', hasSwitch: false },
        { icon: Smartphone, label: 'Phone Number', hasSwitch: false },
        { icon: Globe, label: 'Language & Region', hasSwitch: false },
      ]
    },
    {
      title: 'Security',
      items: [
        { icon: Lock, label: 'Change Password', hasSwitch: false },
        { icon: Shield, label: 'Two-Factor Authentication', hasSwitch: true, switchValue: true },
        { icon: Bell, label: 'Login Alerts', hasSwitch: true, switchValue: false },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Notifications', hasSwitch: false },
        { icon: Moon, label: 'Dark Mode', hasSwitch: true, switchValue: false },
        { icon: Wifi, label: 'Data Saver', hasSwitch: true, switchValue: true },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', hasSwitch: false },
        { icon: Settings, label: 'App Settings', hasSwitch: false },
        { icon: LogOut, label: 'Sign Out', hasSwitch: false, isDestructive: true },
      ]
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitials}>JD</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userProfile.name}</Text>
              <Text style={styles.profilePhone}>{userProfile.phone}</Text>
              <Text style={styles.profileEmail}>{userProfile.email}</Text>
            </View>
          </View>

          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Current Plan</Text>
              <Text style={styles.statValue}>{userProfile.plan}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Member Since</Text>
              <Text style={styles.statValue}>{userProfile.memberSince}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <CreditCard size={20} color="#E60012" />
            </View>
            <Text style={styles.quickActionLabel}>Manage Plan</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Settings size={20} color="#FF6B35" />
            </View>
            <Text style={styles.quickActionLabel}>Preferences</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <HelpCircle size={20} color="#4CAF50" />
            </View>
            <Text style={styles.quickActionLabel}>Get Help</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Sections */}
        {accountSettings.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.settingsCard}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingsItem,
                    itemIndex === section.items.length - 1 && styles.lastItem
                  ]}
                >
                  <View style={styles.settingsItemLeft}>
                    <View style={[
                      styles.settingsIcon,
                      item.isDestructive && styles.destructiveIcon
                    ]}>
                      <item.icon 
                        size={20} 
                        color={item.isDestructive ? '#E60012' : '#666'} 
                      />
                    </View>
                    <Text style={[
                      styles.settingsLabel,
                      item.isDestructive && styles.destructiveLabel
                    ]}>
                      {item.label}
                    </Text>
                  </View>
                  
                  {item.hasSwitch ? (
                    <Switch
                      value={item.switchValue}
                      onValueChange={() => {}}
                      trackColor={{ false: '#e0e0e0', true: '#E60012' }}
                      thumbColor={item.switchValue ? 'white' : '#f4f3f4'}
                    />
                  ) : (
                    <ChevronRight size={16} color="#ccc" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Singtel Mobile App</Text>
          <Text style={styles.appVersion}>Version 2.1.0</Text>
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
  editButton: {
    backgroundColor: '#E60012',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  profileCard: {
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E60012',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInitials: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickAction: {
    backgroundColor: 'white',
    flex: 1,
    marginHorizontal: 5,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
  settingsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  settingsCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  destructiveIcon: {
    backgroundColor: '#FFF5F5',
  },
  settingsLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  destructiveLabel: {
    color: '#E60012',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  appVersion: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
});