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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Bot, User, Phone, MessageCircle, Clock } from 'lucide-react-native';
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

export default function EnhancedChatSupport() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your Singtel AI assistant. How can I help you today?",
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

  // Enhanced message formatting with table support
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

  // Enhanced table rendering function
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

    // Calculate optimal column widths based on content
    const calculateColumnWidths = () => {
      const columnWidths: number[] = [];
      
      // Initialize with header lengths
      headers.forEach((header, index) => {
        columnWidths[index] = Math.max(header.length, 8); // Minimum 8 characters
      });
      
      // Check data row lengths
      dataRows.forEach(row => {
        row.forEach((cell, index) => {
          if (columnWidths[index]) {
            const cellLength = cell.replace(/\*\*/g, '').length; // Remove markdown
            columnWidths[index] = Math.max(columnWidths[index], cellLength);
          }
        });
      });
      
      // Convert to flex basis percentages
      const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
      return columnWidths.map(width => Math.max((width / totalWidth) * 100, 15)); // Minimum 15%
    };

    const columnWidths = calculateColumnWidths();
    return (
      <View key={`table-${key}`} style={styles.tableContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              {headers.map((header, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.tableHeaderCell, 
                    index === 0 && styles.firstHeaderCell,
                    { minWidth: Math.max(columnWidths[index] * 2, 100) } // Dynamic width
                  ]}
                >
                  <Text style={styles.tableHeaderText}>{header}</Text>
                </View>
              ))}
            </View>

            {/* Table Rows */}
            {dataRows.map((row, rowIndex) => (
              <View key={rowIndex} style={[styles.tableRow, rowIndex % 2 === 0 && styles.evenTableRow]}>
                {row.map((cell, cellIndex) => (
                  <View 
                    key={cellIndex} 
                    style={[
                      styles.tableCell, 
                      cellIndex === 0 && styles.firstTableCell,
                      { minWidth: Math.max(columnWidths[cellIndex] * 2, 100) } // Dynamic width
                    ]}
                  >
                    <Text style={[styles.tableCellText, cellIndex === 0 && styles.firstCellText]}>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.chatContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.botIcon}>
              <Bot size={24} color="white" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Singtel AI Assistant</Text>
              <Text style={styles.headerSubtitle}>Online • Ready to help</Text>
            </View>
          </View>
        </View>

        {/* User Interests */}
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

        {/* Messages */}
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

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
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

        {/* Contact Info */}
        <View style={styles.contactInfo}>
          <View style={styles.contactItem}>
            <Phone size={16} color="#E60012" />
            <Text style={styles.contactText}>+65 6221 1606</Text>
          </View>
          <View style={styles.contactItem}>
            <Clock size={16} color="#E60012" />
            <Text style={styles.contactText}>24/7 Support</Text>
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
  // Enhanced Table Styles
  tableContainer: {
    marginVertical: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    maxWidth: width - 40, // Ensure it fits within screen bounds
  },
  table: {
    flexDirection: 'column',
    minWidth: width * 0.8, // Slightly wider for better content display
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E60012',
    minHeight: 44, // Consistent header height
  },
  tableHeaderCell: {
    flex: 1,
    minWidth: 100, // Fallback minimum width
    paddingHorizontal: 12,
    paddingVertical: 14, // Slightly more padding
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
  },
  firstHeaderCell: {
    minWidth: 130, // Slightly wider for feature names
    backgroundColor: '#C50010',
    borderTopLeftRadius: 12, // Match container border radius
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    lineHeight: 16, // Better line height for readability
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    minHeight: 40, // Consistent row height
  },
  evenTableRow: {
    backgroundColor: '#f8f9fa',
  },
  tableCell: {
    flex: 1,
    minWidth: 100, // Fallback minimum width
    paddingHorizontal: 12,
    paddingVertical: 12, // Consistent with header
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center', // Center content horizontally
  },
  firstTableCell: {
    minWidth: 130, // Match header width
    backgroundColor: '#FFF8F0',
    borderLeftWidth: 0, // Remove left border for cleaner look
  },
  tableCellText: {
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
    lineHeight: 18,
    flexWrap: 'wrap', // Allow text wrapping for long content
    textAlignVertical: 'center', // Center vertically on Android
  },
  firstCellText: {
    fontWeight: '600',
    color: '#E60012',
    fontSize: 14, // Slightly larger for feature names
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
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
    fontSize: 12,
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
});