import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Bot, User, Phone, MessageCircle, Clock, ShoppingBag } from 'lucide-react-native';
import { detectEmotion, logMessage, analyzeUserInterests, generateSessionId } from '@/lib/chatbot';

const { width } = Dimensions.get('window');

// Flask API URL
const FLASK_API_URL = 'https://d0f37a99-c037-479b-a511-f82414e21fcd-00-1fn62vy32m8ox.pike.replit.dev:5000';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  emotion?: string;
}

interface EnhancedChatSupportProps {
  onClose: () => void;
}

export default function EnhancedChatSupport({ onClose }: EnhancedChatSupportProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your Singtel AI assistant. How can I help you today? I can help you with plans, devices, billing, and more!",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const messagesEndRef = useRef<ScrollView>(null);

  useEffect(() => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const quickActions = [
    { label: 'Check Bill', action: 'I want to check my current bill' },
    { label: 'Plan Upgrade', action: "I'm interested in upgrading my plan" },
    { label: 'Technical Support', action: "I'm having technical issues" },
    { label: 'New Connection', action: 'I want to apply for a new connection' },
    { label: 'Cancel Service', action: 'I want to cancel my service' },
  ];

  // Enhanced quick purchase actions
  const purchaseActions = [
    { label: '📱 Browse Phones', action: 'Show me the latest phones available with Singtel plans' },
    { label: '🌐 Broadband Plans', action: "I'm looking for broadband internet plans" },
    { label: '📡 Mobile Plans', action: 'Show me mobile data plans available' },
    { label: '🎬 Entertainment Apps', action: 'What entertainment apps do you offer?' },
  ];

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    const emotion = detectEmotion(messageText);
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
      emotion,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Log user message
    await logMessage({
      content: messageText,
      role: 'user',
      session_id: sessionId,
      emotion: emotion,
    });

    try {
      const response = await fetch(`${FLASK_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: messageText, 
          emotion: emotion,
          session_id: sessionId 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Log AI message
      await logMessage({
        content: data.response,
        role: 'assistant',
        session_id: sessionId,
      });

      // Update user interests
      const interests = await analyzeUserInterests(sessionId);
      setUserInterests(interests.interests);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble connecting right now. Please try again in a moment or contact our support hotline at +65 6221 1606.",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    sendMessage(action);
  };

  const getEmotionColor = (emotion?: string) => {
    switch (emotion) {
      case 'urgent':
        return '#E60012';
      case 'happy':
        return '#4CAF50';
      case 'frustrated':
        return '#FF6B35';
      case 'confused':
        return '#FFA500';
      case 'price-sensitive':
        return '#9C27B0';
      default:
        return '#666';
    }
  };

  // Enhanced message formatting with improved table support and link handling
  const formatMessage = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let currentTable: string[] = [];
    let inTable = false;

    lines.forEach((line, index) => {
      // Detect table rows
      if (line.includes('|') && line.trim().length > 0) {
        currentTable.push(line);
        inTable = true;
        return;
      }

      // If we were in a table and now we're not, render the table
      if (inTable && currentTable.length > 0) {
        elements.push(renderTable(currentTable, elements.length));
        currentTable = [];
        inTable = false;
      }

      // Handle product links with enhanced styling
      if (line.includes('[🛒') || line.includes('[📱') || line.includes('[🌐')) {
        const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          const [, linkText, url] = linkMatch;
          elements.push(
            <TouchableOpacity
              key={`${index}-${elements.length}`}
              style={styles.productLinkButton}
              onPress={() => handleProductLink(url)}
            >
              <ShoppingBag size={16} color="white" />
              <Text style={styles.productLinkText}>{linkText}</Text>
            </TouchableOpacity>
          );
          return;
        }
      }

      // Handle numbered lists
      if (line.match(/^\d+\.\s/)) {
        const parts = line.split(/^(\d+\.\s)/);
        elements.push(
          <Text key={`${index}-${elements.length}`} style={styles.listItem}>
            <Text style={styles.listNumber}>{parts[1]}</Text>
            <Text style={styles.listContent}>{parts[2]}</Text>
          </Text>
        );
        return;
      }
      
      // Handle bold text
      if (line.includes('**')) {
        const parts = line.split('**');
        elements.push(
          <Text key={`${index}-${elements.length}`} style={styles.messageText}>
            {parts.map((part, i) => 
              i % 2 === 1 ? 
                <Text key={i} style={styles.boldText}>{part}</Text> : 
                <Text key={i}>{part}</Text>
            )}
          </Text>
        );
        return;
      }
      
      // Handle headers
      if (line.startsWith('### ')) {
        elements.push(
          <Text key={`${index}-${elements.length}`} style={styles.headerText}>
            {line.replace('### ', '')}
          </Text>
        );
        return;
      }
      
      // Regular text
      if (line.trim()) {
        elements.push(
          <Text key={`${index}-${elements.length}`} style={styles.messageText}>
            {line}
          </Text>
        );
      }
    });

    // Handle any remaining table
    if (inTable && currentTable.length > 0) {
      elements.push(renderTable(currentTable, elements.length));
    }

    return elements;
  };

  // Enhanced table rendering function with Singtel branding
  const renderTable = (tableLines: string[], key: number) => {
    if (tableLines.length < 2) return null;

    // Parse table data
    const rows = tableLines
      .filter(line => line.trim() && !line.includes('---'))
      .map(line => 
        line.split('|')
          .map(cell => cell.trim())
          .filter(cell => cell.length > 0)
      );

    if (rows.length === 0) return null;

    const headers = rows[0];
    const dataRows = rows.slice(1);

    // Mobile-friendly card layout for comparison tables
    const renderMobileCards = () => {
      return (
        <View key={`mobile-table-${key}`} style={styles.mobileTableContainer}>
          <Text style={styles.mobileTableTitle}>Plan Comparison</Text>
          {dataRows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.mobileComparisonCard}>
              {headers.map((header, cellIndex) => {
                if (cellIndex >= row.length) return null;
                const cellValue = row[cellIndex].replace(/\*\*/g, '');
                const isSingtel = cellValue.toLowerCase().includes('singtel');
                const isPrice = header.toLowerCase().includes('price');
                
                return (
                  <View key={cellIndex} style={styles.mobileTableRow}>
                    <Text style={styles.mobileTableHeader}>{header}</Text>
                    <View style={[
                      styles.mobileTableCell,
                      isSingtel && styles.singtelMobileCell,
                      isPrice && styles.priceMobileCell
                    ]}>
                      <Text style={[
                        styles.mobileTableCellText,
                        isSingtel && styles.singtelMobileCellText,
                        isPrice && styles.priceMobileCellText
                      ]}>
                        {cellValue}
                      </Text>
                      {isSingtel && (
                        <View style={styles.recommendedBadge}>
                          <Text style={styles.recommendedBadgeText}>RECOMMENDED</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
              
              {/* Add separator between comparison items */}
              {rowIndex < dataRows.length - 1 && (
                <View style={styles.mobileCardSeparator} />
              )}
            </View>
          ))}
          
          {/* Summary section for mobile */}
          <View style={styles.mobileSummarySection}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>💡 Quick Summary</Text>
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryText}>
                ✅ Singtel offers the best overall value with premium features
              </Text>
              <Text style={styles.summaryText}>
                📶 Superior network coverage and faster speeds
              </Text>
              <Text style={styles.summaryText}>
                🎁 Exclusive entertainment and security benefits included
              </Text>
            </View>
          </View>
        </View>
      );
    };

    // Desktop table layout (existing)
    const renderDesktopTable = () => {
      return (
        <View key={`table-${key}`} style={styles.tableContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.table}>
              {/* Enhanced Table Header with Singtel branding */}
              <View style={styles.tableHeader}>
                {headers.map((header, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.tableHeaderCell, 
                      index === 0 && styles.firstHeaderCell,
                      header.toLowerCase().includes('singtel') && styles.singtelHeaderCell,
                      { minWidth: index === 0 ? 140 : 120 }
                    ]}
                  >
                    <Text style={styles.tableHeaderText}>{header}</Text>
                  </View>
                ))}
              </View>

              {/* Enhanced Table Rows */}
              {dataRows.map((row, rowIndex) => (
                <View key={rowIndex} style={[styles.tableRow, rowIndex % 2 === 0 && styles.evenTableRow]}>
                  {row.map((cell, cellIndex) => (
                    <View 
                      key={cellIndex} 
                      style={[
                        styles.tableCell, 
                        cellIndex === 0 && styles.firstTableCell,
                        cell.toLowerCase().includes('singtel') && styles.singtelTableCell,
                        { minWidth: cellIndex === 0 ? 140 : 120 }
                      ]}
                    >
                      <Text style={[
                        styles.tableCellText, 
                        cellIndex === 0 && styles.firstCellText,
                        cell.toLowerCase().includes('singtel') && styles.singtelCellText
                      ]}>
                        {cell.replace(/\*\*/g, '')}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      );
    };

    // Return mobile layout for small screens, desktop for larger screens
    return (
      <>
        {/* Show mobile layout on smaller screens */}
        <View style={styles.mobileOnlyContainer}>
          {renderMobileCards()}
        </View>
        
        {/* Show desktop layout on larger screens */}
        <View style={styles.desktopOnlyContainer}>
          {renderDesktopTable()}
        </View>
      </>
    );
  };

  const handleProductLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open this link');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open link');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.chatContainer}>
        {/* Enhanced Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.botIcon}>
              <Bot size={24} color="white" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Singtel AI Assistant</Text>
              <Text style={styles.headerSubtitle}>Online • Ready to help with purchases & support</Text>
            </View>
          </View>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* User Interests Display */}
        {userInterests.length > 0 && (
          <View style={styles.interestsContainer}>
            <Text style={styles.interestsTitle}>Your interests: </Text>
            {userInterests.map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Messages with Enhanced Formatting */}
        <ScrollView 
          ref={messagesEndRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View key={message.id} style={[
              styles.messageWrapper,
              message.sender === 'user' ? styles.userMessageWrapper : styles.aiMessageWrapper
            ]}>
              {message.sender === 'ai' && (
                <View style={styles.messageIcon}>
                  <Bot size={16} color="#E60012" />
                </View>
              )}
              
              <View style={[
                styles.messageBubble,
                message.sender === 'user' ? styles.userMessage : styles.aiMessage
              ]}>
                <View style={styles.messageHeader}>
                  {message.emotion && (
                    <View style={[styles.emotionBadge, { backgroundColor: getEmotionColor(message.emotion) + '20' }]}>
                      <Text style={[styles.emotionText, { color: getEmotionColor(message.emotion) }]}>
                        {message.emotion}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.timestamp}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                
                <View style={styles.messageContent}>
                  {message.sender === 'user' ? (
                    <Text style={styles.userMessageText}>{message.text}</Text>
                  ) : (
                    formatMessage(message.text)
                  )}
                </View>
              </View>

              {message.sender === 'user' && (
                <View style={[styles.messageIcon, styles.userIcon]}>
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

        {/* Enhanced Quick Actions with Shopping Section */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.quickActionsTitle}>Quick Shopping</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActionsScroll}>
            {purchaseActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.purchaseActionButton}
                onPress={() => handleQuickAction(action.action)}
              >
                <Text style={styles.purchaseActionText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <Text style={styles.quickActionsTitle}>Support Actions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActionButton}
                onPress={() => handleQuickAction(action.action)}
              >
                <Text style={styles.quickActionText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Enhanced Contact Info */}
        <View style={styles.contactInfo}>
          <View style={styles.contactItem}>
            <Phone size={16} color="#E60012" />
            <Text style={styles.contactText}>+65 6221 1606 (24/7)</Text>
          </View>
          <View style={styles.contactItem}>
            <MessageCircle size={16} color="#E60012" />
            <Text style={styles.contactText}>Live Chat Available</Text>
          </View>
          <View style={styles.contactItem}>
            <Clock size={16} color="#E60012" />
            <Text style={styles.contactText}>Store: 10AM-10PM</Text>
          </View>
        </View>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Type your message..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            onSubmitEditing={() => sendMessage(inputMessage)}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputMessage.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={() => sendMessage(inputMessage)}
            disabled={!inputMessage.trim() || isLoading}
          >
            <Send size={20} color={(!inputMessage.trim() || isLoading) ? '#ccc' : 'white'} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  chatContainer: {
    flex: 1,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  interestsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#E8F5E8',
    flexWrap: 'wrap',
  },
  interestsTitle: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginRight: 8,
  },
  interestTag: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  interestText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
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
  aiMessageWrapper: {
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
  userIcon: {
    backgroundColor: '#E60012',
  },
  messageBubble: {
    maxWidth: width * 0.75,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userMessage: {
    backgroundColor: '#E60012',
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  emotionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  emotionText: {
    fontSize: 10,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
  },
  messageContent: {
    flex: 1,
  },
  userMessageText: {
    fontSize: 16,
    lineHeight: 22,
    color: 'white',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
    marginBottom: 2,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E60012',
    marginBottom: 8,
    marginTop: 4,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  listNumber: {
    fontWeight: 'bold',
    color: '#E60012',
    marginRight: 4,
  },
  listContent: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#333',
  },
  // Enhanced Product Link Button Styles
  productLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E60012',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    marginVertical: 8,
    shadowColor: '#E60012',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    alignSelf: 'flex-start',
  },
  productLinkText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  // Enhanced Table Styles with Singtel Branding
  tableContainer: {
    marginVertical: 12,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
    maxWidth: width - 40,
    borderWidth: 2,
    borderColor: '#E60012',
  },
  table: {
    flexDirection: 'column',
    minWidth: width * 0.9,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E60012',
    minHeight: 50,
  },
  tableHeaderCell: {
    flex: 1,
    minWidth: 120,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  firstHeaderCell: {
    minWidth: 140,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderTopLeftRadius: 16,
  },
  singtelHeaderCell: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tableHeaderText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    lineHeight: 18,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    minHeight: 48,
  },
  evenTableRow: {
    backgroundColor: '#F8F9FA',
  },
  tableCell: {
    flex: 1,
    minWidth: 120,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  firstTableCell: {
    minWidth: 140,
    backgroundColor: '#FFF8F0',
    borderLeftWidth: 0,
  },
  singtelTableCell: {
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#FFE4CC',
    shadowColor: '#E60012',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tableCellText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  firstCellText: {
    fontWeight: 'bold',
    color: '#E60012',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  singtelCellText: {
    fontWeight: 'bold',
    color: '#E60012',
    fontSize: 15,
    letterSpacing: 0.2,
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
    paddingVertical: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  quickActionsScroll: {
    marginBottom: 15,
  },
  purchaseActionButton: {
    backgroundColor: '#E60012',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    shadowColor: '#E60012',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  purchaseActionText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  quickActionButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickActionText: {
    fontSize: 12,
    color: '#E60012',
    fontWeight: '600',
  },
  contactInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    marginLeft: 6,
    fontSize: 11,
    color: '#666',
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
  
  // Mobile-friendly table styles
  mobileOnlyContainer: {
    display: 'flex',
  },
  desktopOnlyContainer: {
    display: 'none',
  },
  mobileTableContainer: {
    marginVertical: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E60012',
  },
  mobileTableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#E60012',
    paddingVertical: 16,
    paddingHorizontal: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  mobileComparisonCard: {
    backgroundColor: 'white',
  },
  mobileTableRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  mobileTableHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mobileTableCell: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    position: 'relative',
  },
  singtelMobileCell: {
    backgroundColor: '#FFF8F0',
    borderWidth: 2,
    borderColor: '#FFE4CC',
    shadowColor: '#E60012',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  priceMobileCell: {
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  mobileTableCellText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    lineHeight: 20,
  },
  singtelMobileCellText: {
    color: '#E60012',
    fontWeight: 'bold',
    fontSize: 16,
  },
  priceMobileCellText: {
    color: '#1976D2',
    fontWeight: 'bold',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendedBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  mobileCardSeparator: {
    height: 8,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
  },
  mobileSummarySection: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderTopWidth: 3,
    borderTopColor: '#E60012',
  },
  summaryHeader: {
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  summaryContent: {
    gap: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    fontWeight: '500',
  },
});