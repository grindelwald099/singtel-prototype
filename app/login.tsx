import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import EnhancedChatSupport from '@/components/EnhancedChatSupport';
import { 
  CreditCard, 
  Plane, 
  Gift, 
  ShoppingBag, 
  Receipt, 
  Truck,
  MessageCircle,
  Sparkles
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  const quickActions = [
    { icon: CreditCard, label: 'Activate SIM', color: 'rgba(255, 255, 255, 0.9)' },
    { icon: Plane, label: 'Roaming', color: 'rgba(255, 255, 255, 0.9)' },
    { icon: Gift, label: 'Rewards', color: 'rgba(255, 255, 255, 0.9)' },
    { icon: ShoppingBag, label: 'Shop', color: 'rgba(255, 255, 255, 0.9)' },
    { icon: Receipt, label: 'Pay bill', color: 'rgba(255, 255, 255, 0.9)' },
    { icon: Truck, label: 'Track order', color: 'rgba(255, 255, 255, 0.9)' },
  ];

  const handleLogin = () => {
    // Navigate to the main app (tabs)
    router.replace('/(tabs)');
  };

  const handleDiscoveryChat = () => {
    setShowSupport(true);
  };

  if (showSupport) {
    return <EnhancedChatSupport onClose={() => setShowSupport(false)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#E60012" />
      
      <LinearGradient
        colors={['#E60012', '#FF4444']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Background Pattern */}
        <View style={styles.backgroundPattern}>
          {Array.from({ length: 120 }).map((_, index) => (
            <View key={index} style={styles.dot} />
          ))}
        </View>

        {/* Diagonal Lines */}
        <View style={styles.diagonalLines}>
          {Array.from({ length: 8 }).map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.diagonalLine, 
                { 
                  transform: [{ rotate: '45deg' }],
                  left: width * 0.6 + (index * 20),
                  top: height * 0.6 + (index * 30)
                }
              ]} 
            />
          ))}
        </View>

        {/* Profile Avatar */}
        <TouchableOpacity style={styles.profileContainer}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileText}>👤</Text>
          </View>
        </TouchableOpacity>

        {/* Discovery Chatbot Icon */}
        <TouchableOpacity 
          style={styles.discoveryContainer}
          onPress={handleDiscoveryChat}
        >
          <View style={styles.discoveryIcon}>
            <MessageCircle size={24} color="#E60012" />
            <View style={styles.sparkleContainer}>
              <Sparkles size={12} color="#FFD700" />
            </View>
          </View>
          <Text style={styles.discoveryLabel}>Discovery</Text>
          {showDiscovery && (
            <View style={styles.discoveryTooltip}>
              <Text style={styles.tooltipText}>Hi! I'm Discovery, your AI assistant. I can help with plans, comparisons, and more!</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Singtel Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoDotsContainer}>
              <View style={[styles.logoDot, styles.dot1]} />
              <View style={[styles.logoDot, styles.dot2]} />
              <View style={[styles.logoDot, styles.dot3]} />
              <View style={[styles.logoDot, styles.dot4]} />
            </View>
            <Text style={styles.logoText}>Singtel</Text>
          </View>

          {/* Welcome Text */}
          <Text style={styles.welcomeText}>Welcome back</Text>

          {/* Quick Actions Grid */}
          <View style={styles.quickActionsContainer}>
            {quickActions.map((action, index) => (
              <TouchableOpacity key={index} style={styles.quickActionItem}>
                <View style={styles.quickActionIcon}>
                  <action.icon size={24} color={action.color} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Login Button */}
        <View style={styles.loginContainer}>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Log in</Text>
          </TouchableOpacity>
          
          {/* Home Indicator */}
          <View style={styles.homeIndicator} />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    position: 'relative',
  },
  backgroundPattern: {
    position: 'absolute',
    left: 20,
    top: 100,
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 120,
    height: 600,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    margin: 4,
  },
  diagonalLines: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  diagonalLine: {
    position: 'absolute',
    width: 4,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileText: {
    fontSize: 20,
    color: 'white',
  },
  discoveryContainer: {
    position: 'absolute',
    top: 120,
    right: 20,
    alignItems: 'center',
    zIndex: 10,
  },
  discoveryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  sparkleContainer: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#E60012',
    borderRadius: 10,
    padding: 2,
  },
  discoveryLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  discoveryTooltip: {
    position: 'absolute',
    top: -50,
    right: -20,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    maxWidth: 200,
  },
  tooltipText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoDotsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    position: 'relative',
  },
  logoDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'white',
    marginHorizontal: 4,
  },
  dot1: {
    opacity: 0.6,
  },
  dot2: {
    opacity: 0.8,
  },
  dot3: {
    opacity: 1,
  },
  dot4: {
    opacity: 0.9,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  welcomeText: {
    fontSize: 28,
    color: 'white',
    fontWeight: '300',
    marginBottom: 60,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 300,
  },
  quickActionItem: {
    alignItems: 'center',
    margin: 20,
    width: 80,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  quickActionLabel: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  loginContainer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  loginButton: {
    backgroundColor: 'white',
    borderRadius: 25,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 20,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E60012',
    letterSpacing: 0.5,
  },
  homeIndicator: {
    width: 134,
    height: 5,
    backgroundColor: 'white',
    borderRadius: 3,
    alignSelf: 'center',
    opacity: 0.8,
  },
});