import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rsqytbhetidgzpsifhiv.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzcXl0YmhldGlkZ3pwc2lmaGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NzczMzMsImV4cCI6MjA2NzM1MzMzM30.Y9S4HRe2XVqDCF93zCKcqfXHHLd3symW1knj9uAyIiQ';
const supabase = createClient(supabaseUrl, supabaseKey);

// Enhanced emotion detection (matching Next.js implementation)
export function detectEmotion(text: string): string {
  const lowerText = text.toLowerCase();

  const urgentKeywords = [
    "urgently", "urgent", "hurry", "quick", "faster", "as soon as possible",
    "soon", "short time", "asap", "immediately", "deadline", "no time", "rush"
  ];

  const priceKeywords = [
    "cheap", "affordable", "inexpensive", "not expensive", "budget friendly",
    "cheaper", "cheapest", "save", "budget", "too expensive", "cost", "money"
  ];

  const confusionKeywords = [
    "confused", "confusing", "confuse", "unsure", "don't understand", "help",
    "help me", "lost", "complicated", "difficult", "challenging", "don't know",
    "unclear", "puzzled"
  ];

  // Check for specific emotion keywords first
  if (urgentKeywords.some(word => lowerText.includes(word))) {
    return "urgent";
  } else if (priceKeywords.some(word => lowerText.includes(word))) {
    return "price-sensitive";
  } else if (confusionKeywords.some(word => lowerText.includes(word))) {
    return "confused";
  }

  // Simple sentiment analysis based on positive/negative words
  const positiveWords = [
    "good", "great", "excellent", "amazing", "wonderful", "fantastic",
    "love", "like", "happy", "satisfied"
  ];
  const negativeWords = [
    "bad", "terrible", "awful", "hate", "dislike", "angry",
    "frustrated", "annoyed", "upset", "disappointed"
  ];

  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

  if (positiveCount > negativeCount) {
    return "happy";
  } else if (negativeCount > positiveCount) {
    return "frustrated";
  } else {
    return "neutral";
  }
}

// Topic Detection (matching Next.js implementation)
export function detectTopic(message: string): string | null {
  const lower = message.toLowerCase();
  
  if (
    lower.includes("sim") ||
    lower.includes("mobile plan") ||
    lower.includes("data plan") ||
    lower.includes("data plans") ||
    lower.includes("mobile plans") ||
    lower.includes("circles life") ||
    lower.includes("simba") ||
    lower.includes("starhub")
  ) return "sim";
  
  if (lower.includes("broadband") || lower.includes("wifi")) return "broadband";
  
  if (
    lower.includes("iphone") ||
    lower.includes("samsung") ||
    lower.includes("phone") ||
    lower.includes("iphones") ||
    lower.includes("samsungs") ||
    lower.includes("phones") ||
    lower.includes("android") ||
    lower.includes("huawei") ||
    lower.includes("oppo") ||
    lower.includes("ipad") ||
    lower.includes("lenovo") ||
    lower.includes("computer") ||
    lower.includes("tablets") ||
    lower.includes("tablet")
  ) return "phones";
  
  if (lower.includes("promotion") || lower.includes("discount")) return "promotions";
  
  return null;
}

// Log message to Supabase
export async function logMessage(messageData: {
  content: string;
  role: 'user' | 'assistant';
  session_id: string;
  emotion?: string;
}) {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        content: messageData.content,
        role: messageData.role,
        session_id: messageData.session_id,
        emotion: messageData.emotion,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging message:', error);
    }
  } catch (err) {
    console.error('Failed to log message:', err);
  }
}

// Analyze user interests (matching Next.js implementation)
export async function analyzeUserInterests(sessionId: string) {
  try {
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('content, role')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(20);

    const interests: string[] = [];
    const keywords: string[] = [];
    const recommendedProducts: string[] = [];

    if (messages) {
      const userMessages = messages.filter((m: any) => m.role === 'user');
      const allText = userMessages.map((m: any) => m.content).join(' ').toLowerCase();

      // Detect interests
      if (allText.includes('iphone') || allText.includes('apple')) {
        interests.push('Premium Mobile Devices');
        recommendedProducts.push('iPhone accessories', 'Premium mobile plans');
      }
      if (allText.includes('data') || allText.includes('internet')) {
        interests.push('Data Plans');
        recommendedProducts.push('High-data plans', 'Unlimited data');
      }
      if (allText.includes('broadband') || allText.includes('wifi')) {
        interests.push('Home Internet');
        recommendedProducts.push('Fiber broadband', 'Mesh WiFi systems');
      }

      // Extract keywords
      const commonWords = ['plan', 'data', 'phone', 'broadband', 'price', 'cheap', 'fast'];
      commonWords.forEach(word => {
        if (allText.includes(word)) keywords.push(word);
      });
    }

    return { interests, keywords, recommendedProducts };
  } catch (error) {
    console.error('Error analyzing user interests:', error);
    return { interests: [], keywords: [], recommendedProducts: [] };
  }
}

// Generate session ID
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get emotion color for UI
export function getEmotionColor(emotion?: string): string {
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
}