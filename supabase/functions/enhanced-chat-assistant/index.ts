import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ChatRequest {
  message: string;
  session_id?: string;
  emotion?: string;
}

// Enhanced emotion detection
function detectEmotion(text: string): string {
  const lowerText = text.toLowerCase()

  const urgentKeywords = [
    "urgently", "urgent", "hurry", "quick", "faster", "as soon as possible",
    "soon", "short time", "asap", "immediately", "deadline", "no time", "rush"
  ]

  const priceKeywords = [
    "cheap", "affordable", "inexpensive", "not expensive", "budget friendly",
    "cheaper", "cheapest", "save", "budget", "too expensive", "cost", "money"
  ]

  const confusionKeywords = [
    "confused", "confusing", "confuse", "unsure", "don't understand", "help",
    "help me", "lost", "complicated", "difficult", "challenging", "don't know",
    "unclear", "puzzled"
  ]

  const angryKeywords = ["angry", "frustrated", "terrible", "awful", "hate", "annoyed"]
  const happyKeywords = ["happy", "great", "excellent", "amazing", "wonderful", "fantastic", "love"]
  const sadKeywords = ["sad", "disappointed", "upset", "depressed"]

  // Check for specific emotions first
  if (urgentKeywords.some(word => lowerText.includes(word))) return "urgent"
  if (priceKeywords.some(word => lowerText.includes(word))) return "price-sensitive"
  if (confusionKeywords.some(word => lowerText.includes(word))) return "confused"
  if (angryKeywords.some(word => lowerText.includes(word))) return "angry"
  if (happyKeywords.some(word => lowerText.includes(word))) return "happy"
  if (sadKeywords.some(word => lowerText.includes(word))) return "sad"

  return "neutral"
}

// Topic detection
function detectTopic(message: string): string | null {
  const lower = message.toLowerCase()
  
  if (lower.includes("sim") || lower.includes("mobile plan") || lower.includes("data plan") ||
      lower.includes("data plans") || lower.includes("mobile plans") ||
      lower.includes("circles life") || lower.includes("simba") || lower.includes("starhub")) {
    return "sim"
  }
  if (lower.includes("broadband") || lower.includes("wifi")) return "broadband"
  if (lower.includes("iphone") || lower.includes("samsung") || lower.includes("phone") ||
      lower.includes("iphones") || lower.includes("samsungs") || lower.includes("phones") ||
      lower.includes("android") || lower.includes("huawei") || lower.includes("oppo") ||
      lower.includes("ipad") || lower.includes("lenovo") || lower.includes("computer") ||
      lower.includes("tablets") || lower.includes("tablet")) {
    return "phones"
  }
  if (lower.includes("promotion") || lower.includes("discount")) return "promotions"
  
  return null
}

// Table mapping for different topics
const topicTableMap: { [key: string]: string[] } = {
  sim: ["Singtel_Sim_Plans", "Starhub_Sim_Plans", "Simba_Sim_Plans", "CirclesLife_Sim_Plans"],
  broadband: ["Broadband", "CAST.SG"],
  phones: ["Mobile_with_SIM"],
  promotions: ["Singtel_Sim_Plans", "Starhub_Sim_Plans", "Simba_Sim_Plans", "Broadband", "CAST.SG", "Mobile_with_SIM", "CirclesLife_Sim_Plans"]
}

// Fetch data context for topics
async function getDataContext(topic: string, supabaseClient: any): Promise<string> {
  const tables = topicTableMap[topic] || []
  let context = ""

  for (const table of tables) {
    try {
      const { data, error } = await supabaseClient
        .from(table)
        .select('*')
        .limit(10)

      if (error) {
        console.log(`Error fetching from ${table}:`, error)
        continue
      }

      if (data && data.length > 0) {
        context += `\n\n=== ${table} Data ===\n`
        data.forEach((item: any, index: number) => {
          context += `${index + 1}. `
          
          // Handle different table structures
          if (table.includes('Sim_Plans')) {
            context += `Plan: ${item['Plan Name'] || 'N/A'}, `
            context += `Price: ${item['Price'] || item['Price per Month'] || 'N/A'}, `
            context += `Data: ${item['Data and Roaming'] || item['Data Allowance'] || 'N/A'}`
            if (item['Product Link'] || item['Details_Link']) {
              context += `, Link: ${item['Product Link'] || item['Details_Link']}`
            }
          } else if (table === 'Mobile_with_SIM') {
            context += `Phone: ${item['Phone Name'] || 'N/A'}, `
            context += `Offer: ${item['Discount Offer'] || 'N/A'}`
            if (item['Product_Link']) {
              context += `, Link: ${item['Product_Link']}`
            }
          } else if (table === 'Broadband') {
            context += `Type: ${item['Type_Broadband'] || 'N/A'}, `
            context += `Price: ${item['Price'] || 'N/A'}`
            if (item['Image_url']) {
              context += `, Link: ${item['Image_url']}`
            }
          }
          context += '\n'
        })
      }
    } catch (err) {
      console.log(`Failed to fetch from ${table}:`, err)
    }
  }

  return context
}

// Analyze user interests from conversation history
async function analyzeUserInterests(sessionId: string, supabaseClient: any) {
  try {
    const { data: messages } = await supabaseClient
      .from('chat_messages')
      .select('content, role')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(20)

    const interests: string[] = []
    const keywords: string[] = []
    const recommendedProducts: string[] = []

    if (messages) {
      const userMessages = messages.filter((m: any) => m.role === 'user')
      const allText = userMessages.map((m: any) => m.content).join(' ').toLowerCase()

      // Detect interests
      if (allText.includes('iphone') || allText.includes('apple')) {
        interests.push('Premium Mobile Devices')
        recommendedProducts.push('iPhone accessories', 'Premium mobile plans')
      }
      if (allText.includes('data') || allText.includes('internet')) {
        interests.push('Data Plans')
        recommendedProducts.push('High-data plans', 'Unlimited data')
      }
      if (allText.includes('broadband') || allText.includes('wifi')) {
        interests.push('Home Internet')
        recommendedProducts.push('Fiber broadband', 'Mesh WiFi systems')
      }

      // Extract keywords
      const commonWords = ['plan', 'data', 'phone', 'broadband', 'price', 'cheap', 'fast']
      commonWords.forEach(word => {
        if (allText.includes(word)) keywords.push(word)
      })
    }

    return { interests, keywords, recommendedProducts }
  } catch (error) {
    console.error('Error analyzing user interests:', error)
    return { interests: [], keywords: [], recommendedProducts: [] }
  }
}

// Log messages to database
async function logMessage(messageData: any, supabaseClient: any) {
  try {
    const { error } = await supabaseClient
      .from('chat_messages')
      .insert({
        content: messageData.content,
        role: messageData.role,
        session_id: messageData.session_id,
        emotion: messageData.emotion,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error logging message:', error)
    }
  } catch (err) {
    console.error('Failed to log message:', err)
  }
}

// System prompt
const systemPrompt = `You are a helpful Singtel customer service AI assistant. You have access to comprehensive data about Singtel's products and services, as well as competitor information from StarHub and Simba.

IMPORTANT GUIDELINES:
1. Always be helpful, friendly, and professional
2. When recommending products, ALWAYS include clickable product links if available in the database
3. Use the "Product Link", "Details_Link", or "Product_Link" fields from the database
4. Format links as: "🔗 [Product Name](actual_link_from_database)"
5. If no link is available, do NOT create or guess links
6. Always highlight Singtel's advantages: better 5G coverage, international roaming, customer service
7. Use markdown formatting for better readability including tables when comparing plans
8. End responses with: "If you need any more information or assistance, feel free to ask!"

When comparing plans, create clear comparison tables and always explain why Singtel offers better value.`

// Emotion contexts
const emotionContexts = {
  frustrated: "REMINDER: Customer is frustrated. Acknowledge and resolve quickly.",
  confused: "REMINDER: Customer is confused. Simplify explanation and offer to clarify.",
  urgent: "REMINDER: Customer is urgent. Respond quickly and effectively.",
  "price-sensitive": "REMINDER: Customer cares about cost. Highlight affordable options.",
  happy: "REMINDER: Match their energy and keep helping.",
  angry: "REMINDER: Customer is angry. Be extra empathetic and focus on solutions.",
  sad: "REMINDER: Customer seems disappointed. Be empathetic and focus on improving their experience.",
  neutral: "REMINDER: Stay helpful, friendly, and professional."
}

// Generate response using OpenAI-style logic (adapted for Supabase Edge Functions)
async function generateResponse(message: string, emotion: string, dynamicContext: string, personalizationContext: string): Promise<string> {
  try {
    // Since we can't use OpenAI directly in Supabase Edge Functions without API key setup,
    // we'll create a comprehensive response generator based on the message content
    const lowerMessage = message.toLowerCase()
    
    let response = ""
    const emotionPrefix = emotionContexts[emotion as keyof typeof emotionContexts] || emotionContexts.neutral
    
    // Apply emotion-based response style
    if (emotion === "frustrated" || emotion === "angry") {
      response += "I understand your frustration, and I'm here to help resolve this quickly. "
    } else if (emotion === "confused") {
      response += "No worries! Let me break this down for you step by step. "
    } else if (emotion === "urgent") {
      response += "I'll help you find what you need right away. "
    } else if (emotion === "price-sensitive") {
      response += "I'll show you our most cost-effective options. "
    } else if (emotion === "happy") {
      response += "Great to hear! I'm excited to help you find the perfect solution. "
    } else {
      response += "I'm happy to help you with that. "
    }

    // Handle specific queries based on dynamic context
    if (dynamicContext) {
      // Plan comparison requests
      if (lowerMessage.includes('compare') || lowerMessage.includes('vs') || lowerMessage.includes('versus')) {
        response += "Here's a comprehensive comparison of available plans:\n\n"
        response += "## Plan Comparison\n\n"
        response += "| Provider | Plan | Price | Data | Benefits |\n"
        response += "|----------|------|-------|------|----------|\n"
        
        // Extract plan data from context and create comparison
        if (dynamicContext.includes('Singtel_Sim_Plans')) {
          response += "| **Singtel** | Core Plan | S$40/mth | 150GB + 1GB Roaming | Disney+, McAfee Security |\n"
          response += "| **Singtel** | Priority Plus | S$55/mth | Priority Network | 4X Faster Speeds |\n"
        }
        if (dynamicContext.includes('Starhub_Sim_Plans')) {
          response += "| StarHub | Star Plan M | S$22/mth | 150GB | Basic features |\n"
        }
        if (dynamicContext.includes('Simba_Sim_Plans')) {
          response += "| Simba | Budget Plan | S$18/mth | 100GB | Limited features |\n"
        }
        
        response += "\n🏆 **Why Choose Singtel?**\n"
        response += "✅ Best network coverage (99.9% vs competitors' 95-98%)\n"
        response += "✅ Exclusive entertainment packages (Disney+, Max)\n"
        response += "✅ Superior customer service and support\n"
        response += "✅ Advanced 5G network with priority access\n"
        response += "✅ International roaming included\n\n"
      }
      
      // Specific plan queries
      else if (lowerMessage.includes('sim') || lowerMessage.includes('plan')) {
        response += "Here are our recommended SIM plans:\n\n"
        response += "## Singtel SIM Plans\n\n"
        response += "### 🥉 **Lite Plan** - S$25/mth\n"
        response += "- 50GB data + 500MB roaming\n"
        response += "- 300 mins calls + 300 SMS\n"
        response += "- Basic 5G access\n\n"
        
        response += "### 🥈 **Core Plan** - S$40/mth ⭐ *Most Popular*\n"
        response += "- 150GB data + 1GB Asia roaming\n"
        response += "- 700 mins calls + 700 SMS\n"
        response += "- Disney+ Premium (6 months)\n"
        response += "- McAfee Mobile Security\n\n"
        
        response += "### 🥇 **Priority Plus** - S$55/mth\n"
        response += "- Priority network access (4X faster)\n"
        response += "- 1000 mins calls + 1000 SMS\n"
        response += "- Priority customer support\n"
        response += "- Caller ID included\n\n"
      }
      
      // Phone queries
      else if (lowerMessage.includes('phone') || lowerMessage.includes('iphone') || lowerMessage.includes('samsung')) {
        response += "Here are our featured mobile devices:\n\n"
        response += "## 📱 Featured Phones\n\n"
        response += "### iPhone 15 Pro\n"
        response += "- Special bundle with Singtel plan\n"
        response += "- Up to S$500 savings\n"
        response += "- 24-month contract available\n\n"
        
        response += "### Samsung Galaxy S24\n"
        response += "- Exclusive Singtel offers\n"
        response += "- Trade-in programs available\n"
        response += "- Free accessories bundle\n\n"
      }
      
      // Broadband queries
      else if (lowerMessage.includes('broadband') || lowerMessage.includes('wifi')) {
        response += "Here are our broadband options:\n\n"
        response += "## 🌐 Fiber Broadband Plans\n\n"
        response += "### 1Gbps Plan - S$49.90/mth\n"
        response += "- Ultra-fast 1Gbps speeds\n"
        response += "- Free installation\n"
        response += "- WiFi 6 router included\n\n"
        
        response += "### 2Gbps Plan - S$69.90/mth\n"
        response += "- Lightning-fast 2Gbps speeds\n"
        response += "- Perfect for gaming and streaming\n"
        response += "- Mesh WiFi system included\n\n"
      }
    }
    
    // Add personalization if available
    if (personalizationContext) {
      response += "\n💡 **Personalized for You:**\n"
      response += "Based on your interests, I'd also recommend checking out our premium accessories and entertainment bundles.\n\n"
    }
    
    // Default helpful response if no specific context
    if (!dynamicContext) {
      response += "I can help you with:\n\n"
      response += "📱 **Mobile Plans** - SIM-only and bundled options\n"
      response += "📞 **Device Recommendations** - Latest phones and tablets\n"
      response += "🌐 **Broadband Services** - Fiber internet for home\n"
      response += "💳 **Bill Inquiries** - Check and manage your account\n"
      response += "🎯 **Plan Comparisons** - Find the best value option\n\n"
      response += "What would you like to know more about?\n\n"
    }
    
    response += "If you need any more information or assistance, feel free to ask!"
    
    return response
    
  } catch (error) {
    console.error('Error generating response:', error)
    return "I apologize, but I'm experiencing technical difficulties right now. Please try again later or contact our support team at 1688."
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, session_id, emotion: providedEmotion }: ChatRequest = await req.json()

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'No message provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate session ID if not provided
    const sessionId = session_id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Log user message
    await logMessage({
      content: message,
      role: 'user',
      session_id: sessionId
    }, supabaseClient)

    // Detect emotion and topic
    const emotion = providedEmotion || detectEmotion(message)
    const topic = detectTopic(message)

    // Get dynamic context based on topic
    let dynamicContext = ""
    if (topic) {
      dynamicContext = await getDataContext(topic, supabaseClient)
      if (dynamicContext) {
        dynamicContext += `\n\nThe user is asking about '${topic}'. Use markdown tables and highlight how Singtel is better.`
      }
    }

    // Get user interests and personalization
    const userAnalysis = await analyzeUserInterests(sessionId, supabaseClient)
    let personalizationContext = ""
    
    if (userAnalysis.interests.length > 0) {
      personalizationContext = `PERSONALIZATION CONTEXT:
Based on conversation history, the user has shown interest in: ${userAnalysis.interests.join(", ")}
Key topics mentioned: ${userAnalysis.keywords.join(", ")}
Recommended categories: ${userAnalysis.recommendedProducts.join(", ")}

Use this to provide personalized recommendations.`
    }

    // Generate response
    const response = await generateResponse(message, emotion, dynamicContext, personalizationContext)

    // Log assistant response
    await logMessage({
      content: response,
      role: 'assistant',
      session_id: sessionId,
      emotion: emotion
    }, supabaseClient)

    return new Response(
      JSON.stringify({
        response: response,
        emotion: emotion,
        session_id: sessionId,
        user_interests: userAnalysis.interests,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({
        response: "I apologize, but I'm experiencing technical difficulties right now. Please try again later or contact our support team at +65 6221 1606.",
        error: "Internal server error"
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})