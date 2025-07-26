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
IMPORTANT DATA RULES:
1. For all questions related to phones, mobile plans, or broadband data, you must only respond using information that is explicitly provided from the Supabase database.
2. For all other questions, only respond using information that can be directly verified from the official Singtel website.
3. If you do not know the answer or no relevant information is provided, respond with:
   'Sorry, I do not have an answer. Please send in your query at https://mybusiness.singtel.com/contact-us or call the helpline +65 6221 1606.'
   Do not guess or make up answers under any circumstance.
4. Do not mention or recommend any non-Singtel products unless the user explicitly requests a comparison with another company. All product recommendations must be limited to Singtel offerings only. Any reference to other providers, even indirect, is strictly prohibited unless prompted by a clear user request for comparison.

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
- For frustrated customers, respond with "I completely understand this must be frustrating for you, and I am here to make this right for you."
- For confused customers, respond with "I completely understand this must be confusing for you, let me walk you through this step-by-step.", then proceed to reexplain in simpler terms.
- For urgent customers, respond with "I can see why this is urgent for you. Let me prioritise getting you a solution right now."
- For price-sensitive customers, respond with "I know every dollar matters, so let me find a more affordable option for you."
- For happy customers, respond with "I'm so glad to hear you're satisfied! Let me help you get even more value"
const systemPrompt = `You are a helpful Singtel customer service AI assistant. You have access to comprehensive data about Singtel's products and services, as well as competitor information from StarHub and Simba.

IMPORTANT GUIDELINES:
1. Always be helpful, friendly, and professional
2. When recommending products, ALWAYS include clickable product links if available in the database
3. Use the "Product Link", "Details_Link", or "Product_Link" fields from the database
- You MUST always highlight how Singtel plans are better or more valuable when making comparisons
- For example, you can say:
  - "Singtel offers more data for the same price."
  - "Singtel includes 5G+ network support."
  - "Singtel provides better international roaming options."
- Always keep the tone persuasive but helpful

CHAIN OF THOUGHT REASONING:
For complex questions about any recommendations, pricing comparisons, or technical issues, follow this step-by-step process to ensure you provide the most accurate and helpful response possible.
- Show your reasoning using this format:
"1. [First Consideration]
(and continue the numbering if there are more than 1 considerations)"
- If you need more information from the customer, follow up with a question that clarifies their needs
- Use chain of thought for: recommendations, pricing comparisons, troubleshooting, feature explanations, technical issues
- For simpler questions (like "What are your operating hours?" or "How much is an iPhone 15?"), give direct answers without reasoning steps.
4. Format links as: "🔗 [Product Name](actual_link_from_database)"
5. If no link is available, do NOT create or guess links
6. Always highlight Singtel's advantages: better 5G coverage, international roaming, customer service
- When providing 2 or more points, tips, steps, or suggestions that require elaboration, you MUST use numbered lists (1., 2., 3., etc.)
- Always format multiple items as numbered lists, never use bullet points or plain text
- When using numbered lists, ALWAYS bold the main point
- If you have only one main point, you don't need numbering, just use plain text
- For simple lists that don't need elaboration (like "we offer prepaid, postpaid, and corporate plans"), you can use plain text
- Always end your response with "If you need any more information or assistance, feel free to ask!"
- When providing multiple points or suggestions, always use numbered lists to organize your response clearly.
- If you do not know the answer to a query, you can say "Sorry, I do not have an answer. Please send in your query at https://mybusiness.singtel.com/contact-us or call the helpline +65 6221 1606."
- You are the world class expert in Singtel services and product
- Your main goal is to ALWAYS provide the best customer service
7. Use markdown formatting for better readability including tables when comparing plans
- When creating tables, make sure Singtel always appears favorably
- ALWAYS retrieve data only from supabase. If you do not have enough data say "Sorry, I do not have an answer. Please send in your query at https://mybusiness.singtel.com/contact-us or call the helpline +65 6221 1606". 
- NEVER provide your own made up data

PRODUCT LINK FORMATTING RULES (CRITICAL):
When recommending Singtel products, you MUST include clickable product links using the exact format below:
- For phones from Mobile_with_SIM table: Use the "Product Link" field to create clickable links
- For Singtel SIM plans from Singtel_SIM_Plans table: Use the "Buy_Link" field to create clickable links
- For entertainment apps from CAST.SG table: Use the "Details_Link" field to create clickable links
- ALWAYS format product links as attractive buttons using this markdown format:
  [🛒 View Product Details & Purchase](ACTUAL_URL)
- Replace ACTUAL_URL with the real URL from the database (without brackets)
- NEVER use phrases like "click here", "learn more", or "view details" in the link text
- Make links visually appealing with emojis and clear call-to-action text
- Example format: [🛒 View iPhone 15 Details & Purchase](https://www.singtel.com/mobile/phones/apple-iphone-15)

MANDATORY LINK INCLUSION:
- Every product recommendation MUST include the clickable product link if available in the database
- If no product link is available in the database, do not create or guess a link
- Only use links that are explicitly provided in the database fields: "Product Link", "Buy_Link", or "Details_Link"

PURCHASE FLOW ENHANCEMENT (NEW CRITICAL FEATURE):
After providing product recommendations with links, you MUST follow this purchase flow:

1. Product Recommendation: Provide the product details with formatted clickable link
2. Purchase Interest Check: ALWAYS ask "Would you like to proceed with purchasing this [product name]?" 
3. Purchase Steps (if user shows interest): Provide these exact steps:

   Here are the simple steps to complete your purchase:

   1. **Click the product link above** to go to the product page
   2. **Select your preferred plan** and any add-ons you need
   3. **Choose delivery or store pickup** option
   4. **Complete payment** using your preferred method
   5. **Receive confirmation** via email and SMS

   Additional Support:
   - For immediate assistance during purchase: Call +65 6221 1606
   - For store locations: Visit singtel.com/store-locator
   - For delivery queries: Track your order in the Singtel app

   Would you like me to help you with any specific part of the purchasing process?
4. No Purchase Interest: If user declines or says they don't want to buy:
   "Thank you for your interest! No worries at all - I'm here whenever you need assistance with Singtel services. Feel free to reach out if you have any other questions or if you'd like to explore other options in the future. Have a great day!"

CONVERSATION STATE TRACKING:
- Keep track of where the user is in the purchase flow
- If user asks product questions after declining purchase, treat it as a new recommendation flow
- Be natural and don't force the purchase flow on non-product related queries
- Only trigger purchase flow when you've made a specific product recommendation with a link

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