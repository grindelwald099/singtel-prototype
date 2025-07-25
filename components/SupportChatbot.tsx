import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Bot, User, X, MessageCircle, Smartphone, CreditCard } from 'lucide-react-native';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rsqytbhetidgzpsifhiv.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzcXl0YmhldGlkZ3pwc2lmaGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NzczMzMsImV4cCI6MjA2NzM1MzMzM30.Y9S4HRe2XVqDCF93zCKcqfXHHLd3symW1knj9uAyIiQ';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  emotion?: string;
}

interface SupportChatbotProps {
  onClose: () => void;
}

export default function SupportChatbot({ onClose }: SupportChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "📱 Hello! I'm your Singtel Assistant. How can I help you today? I can help you with plans, devices, billing, and more!",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Emotion detection function
  const detectEmotion = (text: string): string => {
    const urgentKeywords = ['urgent', 'asap', 'hurry', 'immediately', 'now', 'quick', 'faster', 'rush'];
    const priceKeywords = ['cheap', 'affordable', 'inexpensive', 'budget', 'save', 'expensive', 'money'];
    const confusionKeywords = ['confused', 'confusing', 'help', 'lost', "don't understand", 'unclear'];
    const frustratedKeywords = ['angry', 'frustrated', 'annoyed', 'terrible', 'awful', 'hate'];
    const happyKeywords = ['great', 'awesome', 'excellent', 'love', 'perfect', 'amazing'];

    const lowerText = text.toLowerCase();

    if (urgentKeywords.some(word => lowerText.includes(word))) return 'urgent';
    if (priceKeywords.some(word => lowerText.includes(word))) return 'price-sensitive';
    if (confusionKeywords.some(word => lowerText.includes(word))) return 'confused';
    if (frustratedKeywords.some(word => lowerText.includes(word))) return 'frustrated';
    if (happyKeywords.some(word => lowerText.includes(word))) return 'happy';

    return 'neutral';
  };

  // Fetch data from Supabase
  const fetchPlanData = async () => {
    try {
      const [singtelData, starhubData, simbaData, mobileData] = await Promise.all([
        supabase.from('Singtel_Sim_Plans').select('*').limit(15),
        supabase.from('Starhub_Sim_Plans').select('*').limit(10),
        supabase.from('Simba_Sim_Plans').select('*').limit(10),
        supabase.from('Mobile_with_SIM').select('*').limit(15),
      ]);

      return {
        singtel: singtelData.data || [],
        starhub: starhubData.data || [],
        simba: simbaData.data || [],
        mobile: mobileData.data || [],
      };
    } catch (error) {
      console.error('Error fetching plan data:', error);
      return { singtel: [], starhub: [], simba: [], mobile: [] };
    }
  };

  // Generate AI response
  const generateResponse = async (userMessage: string, emotion: string): Promise<string> => {
    const planData = await fetchPlanData();
    
    // Check for purchase intent
    const lastBotMessage = messages[messages.length - 1];
    if (!lastBotMessage.isUser && lastBotMessage.text.includes('Would you like to proceed with purchasing')) {
      if (userMessage.toLowerCase().includes('yes')) {
        // Find matching plan and return purchase link
        const singtelPlan = planData.singtel.find(plan => 
          lastBotMessage.text.toLowerCase().includes(plan['Plan Name']?.toLowerCase() || '')
        );
        if (singtelPlan && singtelPlan['Buy_Link']) {
          return `Great choice! 🎉 You can purchase the ${singtelPlan['Plan Name']} here: ${singtelPlan['Buy_Link']}\n\nIs there anything else I can help you with?`;
        }
        return "I'll help you find the right plan. Please visit singtel.com or contact our sales team for assistance with your purchase.";
      } else {
        return "No problem! Is there anything else I can help you with? I'm here to assist with any questions about our plans, devices, or services.";
      }
    }

    // Generate contextual response based on user input and emotion
    return generateContextualResponse(userMessage, emotion, planData);
  };

  const generateContextualResponse = (userMessage: string, emotion: string, planData: any): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Emotion-based response adjustments
    const emotionResponses = {
      frustrated: "I understand your frustration, and I'm here to help resolve this quickly. ",
      confused: "No worries! Let me break this down for you step by step. ",
      urgent: "I'll help you find what you need right away. ",
      'price-sensitive': "I'll show you our most cost-effective options. ",
      happy: "Great to hear! I'm excited to help you find the perfect solution. ",
      neutral: "I'm happy to help you with that. "
    };

    let response = emotionResponses[emotion as keyof typeof emotionResponses] || emotionResponses.neutral;

    // Specific plan comparison requests (e.g., "compare star plan m with singtel")
    if (lowerMessage.includes('star plan m') || (lowerMessage.includes('starhub') && lowerMessage.includes('singtel') && lowerMessage.includes('compare'))) {
      // Find StarHub Star Plan M
      const starPlanM = planData.starhub.find((plan: any) => 
        plan['Plan Name']?.toLowerCase().includes('star plan m') || 
        (plan['Data Allowance']?.includes('150') && plan['Price per Month']?.includes('22'))
      );
      
      // Find comparable Singtel plan (similar data allowance)
      const comparableSingtelPlan = planData.singtel.find((plan: any) => 
        plan['Data and Roaming']?.toLowerCase().includes('150gb') ||
        plan['Plan Name']?.toLowerCase().includes('core')
      );

      if (starPlanM && comparableSingtelPlan) {
        response += "Here's a precise comparison between StarHub Star Plan M and the closest Singtel plan:\n\n";
        response += "📊 **PLAN COMPARISON TABLE**\n\n";
        response += "| Feature | StarHub Star Plan M | Singtel Core |\n";
        response += "|---------|-------------------|-------------|\n";
        response += `| **Price** | ${starPlanM['Price per Month'] || 'S$22/mth'} | ${comparableSingtelPlan['Price'] || 'S$40/mth'} |\n`;
        response += `| **Data** | ${starPlanM['Data Allowance'] || '150GB'} | ${comparableSingtelPlan['Data and Roaming'] || '150GB + 1GB Asia Roaming'} |\n`;
        response += `| **Network** | ${starPlanM['Network Type'] || '5G'} | 5G + Priority Network Access |\n`;
        response += `| **Calls/SMS** | ${starPlanM['Local Calls'] || 'Basic'} | ${comparableSingtelPlan['Talktime and SMS'] || '700 mins + 700 SMS'} |\n`;
        response += `| **Entertainment** | None | ${comparableSingtelPlan['Disney+ Offer'] || '6 mths Disney+ Premium'} |\n`;
        response += `| **Security** | None | ${comparableSingtelPlan['McAfee Security'] || '6 mths McAfee Mobile Security'} |\n`;
        response += `| **Roaming** | ${starPlanM['Data Roaming'] || 'Extra charges apply'} | 1GB Asia Roaming included |\n\n`;
        
        response += "🎯 **WHY SINGTEL CORE IS BETTER DESPITE HIGHER PRICE:**\n\n";
        response += "💰 **Better Value Analysis:**\n";
        response += "• StarHub: S$22/mth = S$0.147 per GB (150GB only)\n";
        response += "• Singtel: S$40/mth = S$0.267 per GB BUT includes:\n";
        response += "  - Asia roaming (worth S$15+/month)\n";
        response += "  - Disney+ Premium (worth S$11.98/month)\n";
        response += "  - McAfee Security (worth S$5/month)\n";
        response += "  - 700 mins calls + 700 SMS (worth S$10+/month)\n\n";
        
        response += "📶 **Network Quality:**\n";
        response += "• Singtel: 99.9% coverage, fastest 5G speeds\n";
        response += "• StarHub: 98% coverage, slower network speeds\n\n";
        
        response += "🎬 **Entertainment Value:**\n";
        response += "• Singtel: Disney+ Premium included (Marvel, Star Wars, Disney)\n";
        response += "• StarHub: No entertainment included\n\n";
        
        response += "🛡️ **Security & Support:**\n";
        response += "• Singtel: McAfee protection + 24/7 priority support\n";
        response += "• StarHub: Basic support only\n\n";
        
        response += "💡 **RECOMMENDATION:**\n";
        response += "While StarHub Star Plan M is cheaper upfront, Singtel Core offers **S$42+ worth of extras** for just S$18 more per month. You're actually saving money while getting premium services!\n\n";
        
        response += "Would you like to proceed with purchasing the Singtel Core plan? (Yes/No)";
        return response;
      }
    }

    // Similar specific comparisons for other plans
    if (lowerMessage.includes('star plan l') || (lowerMessage.includes('starhub') && lowerMessage.includes('200gb'))) {
      const starPlanL = planData.starhub.find((plan: any) => 
        plan['Plan Name']?.toLowerCase().includes('star plan l') || 
        plan['Data Allowance']?.includes('200')
      );
      
      const comparableSingtelPlan = planData.singtel.find((plan: any) => 
        plan['Plan Name']?.toLowerCase().includes('priority plus') ||
        plan['Data and Roaming']?.toLowerCase().includes('priority')
      );

      if (starPlanL && comparableSingtelPlan) {
        response += "Here's a precise comparison between StarHub Star Plan L and Singtel Priority Plus:\n\n";
        response += "📊 **PLAN COMPARISON TABLE**\n\n";
        response += "| Feature | StarHub Star Plan L | Singtel Priority Plus |\n";
        response += "|---------|-------------------|---------------------|\n";
        response += `| **Price** | ${starPlanL['Price per Month'] || 'S$32/mth'} | ${comparableSingtelPlan['Price'] || 'S$55/mth'} |\n`;
        response += `| **Data** | ${starPlanL['Data Allowance'] || '200GB'} | Priority Network Lane (4X Faster) |\n`;
        response += `| **Network Priority** | Standard | Priority Network Access |\n`;
        response += `| **Customer Support** | Standard | Priority Care (shops, hotline, chat) |\n`;
        response += `| **Calls/SMS** | Basic | ${comparableSingtelPlan['Talktime and SMS'] || '1000 mins + 1000 SMS'} |\n`;
        response += `| **Caller ID** | Extra charge | ${comparableSingtelPlan['Caller ID'] || 'Included'} |\n\n`;
        
        response += "🚀 **WHY SINGTEL PRIORITY PLUS IS SUPERIOR:**\n\n";
        response += "⚡ **Network Performance:**\n";
        response += "• Singtel: 4X faster speeds during peak hours\n";
        response += "• StarHub: Standard network speeds (can slow during peak)\n\n";
        
        response += "🎯 **Priority Benefits:**\n";
        response += "• Singtel: Jump the queue for support, faster service\n";
        response += "• StarHub: Standard support wait times\n\n";
        
        response += "💡 **VALUE ANALYSIS:**\n";
        response += "For S$23 more, you get guaranteed faster speeds, priority support, and premium features that ensure consistent performance.\n\n";
        
        response += "Would you like to proceed with purchasing the Singtel Priority Plus plan? (Yes/No)";
        return response;
      }
    }
    // Comprehensive plan comparison requests
    if (lowerMessage.includes('compare') || lowerMessage.includes('vs') || lowerMessage.includes('versus') || lowerMessage.includes('difference') || lowerMessage.includes('all plans') || lowerMessage.includes('providers')) {
      response += "Here's a comprehensive comparison across all major providers:\n\n";
      
      // Singtel Plans
      response += "🔴 **SINGTEL PLANS** (Recommended)\n";
      const topSingtelPlans = planData.singtel.slice(0, 3);
      topSingtelPlans.forEach((plan: any) => {
        response += `• **${plan['Plan Name'] || 'Plan'}** - ${plan['Price'] || 'Contact for pricing'}\n`;
        response += `  Data: ${plan['Data and Roaming'] || 'Unlimited'}\n`;
        response += `  Calls: ${plan['Talktime and SMS'] || 'Unlimited'}\n`;
        if (plan['Disney+ Offer']) response += `  Entertainment: ${plan['Disney+ Offer']}\n`;
        if (plan['McAfee Security']) response += `  Security: ${plan['McAfee Security']}\n`;
        response += '\n';
      });
      
      // StarHub Plans
      if (planData.starhub.length > 0) {
        response += "⭐ **STARHUB PLANS**\n";
        const topStarhubPlans = planData.starhub.slice(0, 2);
        topStarhubPlans.forEach((plan: any) => {
          response += `• **${plan['Plan Name'] || 'Plan'}** - ${plan['Price per Month'] || 'Contact for pricing'}\n`;
          response += `  Data: ${plan['Data Allowance'] || 'Check with provider'}\n`;
          response += `  Network: ${plan['Network Type'] || '4G/5G'}\n\n`;
        });
      }
      
      // Simba Plans
      if (planData.simba.length > 0) {
        response += "🦁 **SIMBA PLANS**\n";
        const topSimbaPlans = planData.simba.slice(0, 2);
        topSimbaPlans.forEach((plan: any) => {
          response += `• **Plan** - ${plan['Price'] || 'Contact for pricing'}\n`;
          response += `  Data: ${plan['Data Allowance'] || 'Check with provider'}\n`;
          response += `  Duration: ${plan['Duration'] || 'Monthly'}\n\n`;
        });
      }
      
      response += "🏆 **WHY CHOOSE SINGTEL?**\n";
      response += "✅ Best network coverage in Singapore\n";
      response += "✅ Exclusive entertainment packages (Disney+, Max)\n";
      response += "✅ Superior customer service\n";
      response += "✅ Advanced 5G network\n";
      response += "✅ Comprehensive security features\n\n";
      
      response += "Would you like to proceed with purchasing any of these Singtel plans? (Yes/No)";
      return response;
    }

    // Specific provider queries
    if (lowerMessage.includes('singtel') && (lowerMessage.includes('plan') || lowerMessage.includes('sim'))) {
      response += "Here are our top Singtel plans:\n\n";
      const singtelPlans = planData.singtel.slice(0, 4);
      singtelPlans.forEach((plan: any) => {
        response += `**${plan['Plan Name']}** - ${plan['Price']}\n`;
        response += `• Data: ${plan['Data and Roaming']}\n`;
        response += `• Calls: ${plan['Talktime and SMS']}\n`;
        if (plan['Entertainment Package']) response += `• Entertainment: ${plan['Entertainment Package']}\n`;
        response += '\n';
      });
      return response;
    }
    
    if (lowerMessage.includes('starhub')) {
      response += "Here are StarHub plans for comparison:\n\n";
      const starhubPlans = planData.starhub.slice(0, 3);
      starhubPlans.forEach((plan: any) => {
        response += `**${plan['Plan Name']}** - ${plan['Price per Month']}\n`;
        response += `• Data: ${plan['Data Allowance']}\n`;
        response += `• Network: ${plan['Network Type']}\n\n`;
      });
      response += "However, I'd recommend considering Singtel for better coverage and exclusive benefits!";
      return response;
    }
    
    if (lowerMessage.includes('simba')) {
      response += "Here are Simba plans for comparison:\n\n";
      const simbaPlans = planData.simba.slice(0, 3);
      simbaPlans.forEach((plan: any) => {
        response += `**Plan** - ${plan['Price']}\n`;
        response += `• Data: ${plan['Data Allowance']}\n`;
        response += `• Duration: ${plan['Duration']}\n\n`;
      });
      response += "While Simba offers competitive pricing, Singtel provides superior network quality and customer support!";
      return response;
    }

    // General plan queries
    if (lowerMessage.includes('plan') || lowerMessage.includes('sim')) {
      if (lowerMessage.includes('unlimited') || lowerMessage.includes('data')) {
        const unlimitedPlans = planData.singtel.filter((plan: any) => 
          plan['Data and Roaming']?.toLowerCase().includes('unlimited') || 
          plan['Plan Name']?.toLowerCase().includes('unlimited')
        );
        
        if (unlimitedPlans.length > 0) {
          response += "Here are our unlimited data plans:\n\n";
          unlimitedPlans.slice(0, 2).forEach((plan: any) => {
            response += `**${plan['Plan Name']}** - ${plan['Price']}\n`;
            response += `• ${plan['Data and Roaming']}\n`;
            response += `• ${plan['Talktime and SMS']}\n\n`;
          });
        } else {
          response += "Here are our high-data plans:\n\n";
          const highDataPlans = planData.singtel.slice(0, 3);
          highDataPlans.forEach((plan: any) => {
            response += `**${plan['Plan Name']}** - ${plan['Price']}\n`;
            response += `• ${plan['Data and Roaming']}\n\n`;
          });
        }
      } else if (lowerMessage.includes('cheap') || lowerMessage.includes('budget') || lowerMessage.includes('affordable')) {
        response += "Here are our most affordable plans:\n\n";
        const affordablePlans = planData.singtel.slice(0, 2);
        affordablePlans.forEach((plan: any) => {
          response += `**${plan['Plan Name']}** - ${plan['Price']}\n`;
          response += `• Great value with ${plan['Data and Roaming']}\n`;
          response += `• ${plan['Talktime and SMS']}\n\n`;
        });
        
        // Show competitor budget options for comparison
        if (planData.simba.length > 0) {
          response += "For comparison, budget options from other providers:\n";
          response += `• Simba: ${planData.simba[0]?.['Price'] || 'Check pricing'}\n`;
        }
        response += "\nSingtel offers better value with superior network quality!";
      } else {
        response += "Here are our popular plans:\n\n";
        const popularPlans = planData.singtel.slice(0, 3);
        popularPlans.forEach((plan: any) => {
          response += `**${plan['Plan Name']}** - ${plan['Price']}\n`;
          response += `• ${plan['Data and Roaming']}\n\n`;
        });
      }
      return response;
    }

    // Device queries
    if (lowerMessage.includes('phone') || lowerMessage.includes('device') || lowerMessage.includes('mobile')) {
      response += "We have great mobile devices available:\n\n";
      const devices = planData.mobile.slice(0, 3);
      devices.forEach((device: any) => {
        response += `**${device['Phone Name']}**\n`;
        if (device['Discount Offer']) response += `• Special offer: ${device['Discount Offer']}\n`;
        if (device['Product_Link']) response += `• More info: Available\n`;
        response += '\n';
      });
      response += "Would you like to see more devices or learn about our mobile plans?";
      return response;
    }

    // Network coverage queries
    if (lowerMessage.includes('coverage') || lowerMessage.includes('network quality') || lowerMessage.includes('signal')) {
      response += "Network Coverage Comparison:\n\n";
      response += "🔴 **SINGTEL**: #1 network in Singapore\n";
      response += "• 99.9% island-wide coverage\n";
      response += "• Fastest 5G speeds\n";
      response += "• Best indoor coverage\n\n";
      response += "⭐ **STARHUB**: Good coverage\n";
      response += "• 98% coverage\n";
      response += "• Decent 5G network\n\n";
      response += "🦁 **SIMBA**: Uses M1 network\n";
      response += "• 95% coverage\n";
      response += "• Limited 5G areas\n\n";
      response += "Singtel consistently ranks #1 for network quality and coverage!";
      return response;
    }

    // Billing queries
    if (lowerMessage.includes('bill') || lowerMessage.includes('payment') || lowerMessage.includes('charge')) {
      response += "For billing inquiries:\n\n";
      response += "• Check your bill online at MySingtel app\n";
      response += "• Set up auto-payment to avoid late fees\n";
      response += "• Contact billing support: 1688\n\n";
      response += "Is there a specific billing issue I can help you with?";
      return response;
    }

    // Technical support
    if (lowerMessage.includes('network') || lowerMessage.includes('signal') || lowerMessage.includes('internet') || lowerMessage.includes('slow')) {
      response += "For network issues, try these steps:\n\n";
      response += "1. Restart your device\n";
      response += "2. Check if you're in a coverage area\n";
      response += "3. Update your device settings\n";
      response += "4. Contact technical support: 1688\n\n";
      response += "Are you experiencing issues in a specific location?";
      return response;
    }

    // General help
    if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      response += "I can help you with:\n\n";
      response += "📱 Mobile plans and pricing\n";
      response += "📞 Device recommendations\n";
      response += "💳 Billing and payments\n";
      response += "🌐 Network and technical support\n";
      response += "🎯 Plan comparisons\n\n";
      response += "What would you like to know more about?";
      return response;
    }

    // Default response
    response += "I'd be happy to help you with that! Here are some things I can assist with:\n\n";
    response += "• Compare plans across all providers\n";
    response += "• Singtel, StarHub, and Simba plan details\n";
    response += "• Mobile device recommendations\n";
    response += "• Network coverage information\n";
    response += "• Billing and technical support\n\n";
    response += "Could you tell me more about what you're looking for?";
    
    return response;
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const emotion = detectEmotion(userMessage.text);
      const response = await generateResponse(userMessage.text, emotion);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
        emotion,
      };

      setMessages(prev => [...prev, botMessage]);

      // Update conversation history (keep last 6 messages)
      setConversationHistory(prev => {
        const newHistory = [
          ...prev,
          { role: 'user', content: userMessage.text },
          { role: 'assistant', content: response }
        ];
        return newHistory.slice(-6);
      });

    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble responding right now. Please try again or contact our support team at 1688.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { text: "Compare All Plans", icon: CreditCard },
    { text: "Singtel Plans", icon: MessageCircle },
    { text: "Check Devices", icon: Smartphone },
    { text: "Network Coverage", icon: User },
  ];

  const handleQuickAction = (actionText: string) => {
    setInputText(actionText);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.botIcon}>
              <Bot size={24} color="white" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Singtel Assistant</Text>
              <Text style={styles.headerSubtitle}>AI-powered support</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageWrapper,
                message.isUser ? styles.userMessageWrapper : styles.botMessageWrapper
              ]}
            >
              {!message.isUser && (
                <View style={styles.messageIcon}>
                  <Bot size={16} color="#E60012" />
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  message.isUser ? styles.userMessage : styles.botMessage
                ]}
              >
                <Text style={[
                  styles.messageText,
                  message.isUser ? styles.userMessageText : styles.botMessageText
                ]}>
                  {message.text}
                </Text>
                <Text style={[
                  styles.timestamp,
                  message.isUser ? styles.userTimestamp : styles.botTimestamp
                ]}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              {message.isUser && (
                <View style={styles.messageIcon}>
                  <User size={16} color="white" />
                </View>
              )}
            </View>
          ))}
          
          {isLoading && (
            <View style={styles.loadingWrapper}>
              <View style={styles.messageIcon}>
                <Bot size={16} color="#E60012" />
              </View>
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color="#E60012" />
                <Text style={styles.loadingText}>Typing...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActionButton}
                onPress={() => handleQuickAction(action.text)}
              >
                <action.icon size={16} color="#E60012" />
                <Text style={styles.quickActionText}>{action.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Send size={20} color={(!inputText.trim() || isLoading) ? '#ccc' : 'white'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E60012',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  closeButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  botMessageWrapper: {
    justifyContent: 'flex-start',
  },
  messageIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userMessage: {
    backgroundColor: '#E60012',
    borderBottomRightRadius: 4,
  },
  botMessage: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  botMessageText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  botTimestamp: {
    color: '#999',
  },
  loadingWrapper: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickActionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#E60012',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#f8f9fa',
    marginRight: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E60012',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});
