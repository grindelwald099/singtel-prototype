import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatRequest {
  message: string;
  conversationHistory: any[];
  emotion?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, conversationHistory, emotion }: ChatRequest = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch plan data
    const [singtelData, starhubData, simbaData, mobileData, circlesData] = await Promise.all([
      supabaseClient.from('Singtel_Sim_Plans').select('*').limit(15),
      supabaseClient.from('Starhub_Sim_Plans').select('*').limit(10),
      supabaseClient.from('Simba_Sim_Plans').select('*').limit(10),
      supabaseClient.from('Mobile_with_SIM').select('*').limit(15),
      supabaseClient.from('CirclesLife_Sim_Plans').select('*').limit(10),
    ])

    // Enhanced response generation logic with multi-provider support
    const generateResponse = (userMessage: string, emotion: string, planData: any): string => {
      const lowerMessage = userMessage.toLowerCase()

      // Emotion-based response adjustments
      const emotionResponses = {
        frustrated: "I understand your frustration, and I'm here to help resolve this quickly. ",
        confused: "No worries! Let me break this down for you step by step. ",
        urgent: "I'll help you find what you need right away. ",
        'price-sensitive': "I'll show you our most cost-effective options. ",
        happy: "Great to hear! I'm excited to help you find the perfect solution. ",
        neutral: "I'm happy to help you with that. "
      }

      let response = emotionResponses[emotion as keyof typeof emotionResponses] || emotionResponses.neutral

      // Specific plan comparison requests (e.g., "compare star plan m with singtel")
      if (lowerMessage.includes('star plan m') || (lowerMessage.includes('starhub') && lowerMessage.includes('singtel') && lowerMessage.includes('compare'))) {
        // Find StarHub Star Plan M
        const starPlanM = planData.starhub.find((plan: any) => 
          plan['Plan Name']?.toLowerCase().includes('star plan m') || 
          (plan['Data Allowance']?.includes('150') && plan['Price per Month']?.includes('22'))
        )
        
        // Find comparable Singtel plan
        const comparableSingtelPlan = planData.singtel.find((plan: any) => 
          plan['Data and Roaming']?.toLowerCase().includes('150gb') ||
          plan['Plan Name']?.toLowerCase().includes('core')
        )

        if (starPlanM && comparableSingtelPlan) {
          response += "Here's a precise comparison between StarHub Star Plan M and the closest Singtel plan:\n\n"
          response += "📊 **PLAN COMPARISON TABLE**\n\n"
          response += "| Feature | StarHub Star Plan M | Singtel Core |\n"
          response += "|---------|-------------------|-------------|\n"
          response += `| **Price** | ${starPlanM['Price per Month'] || 'S$22/mth'} | ${comparableSingtelPlan['Price'] || 'S$40/mth'} |\n`
          response += `| **Data** | ${starPlanM['Data Allowance'] || '150GB'} | ${comparableSingtelPlan['Data and Roaming'] || '150GB + 1GB Asia Roaming'} |\n`
          response += `| **Network** | ${starPlanM['Network Type'] || '5G'} | 5G + Priority Network Access |\n`
          response += `| **Calls/SMS** | ${starPlanM['Local Calls'] || 'Basic'} | ${comparableSingtelPlan['Talktime and SMS'] || '700 mins + 700 SMS'} |\n`
          response += `| **Entertainment** | None | ${comparableSingtelPlan['Disney+ Offer'] || '6 mths Disney+ Premium'} |\n`
          response += `| **Security** | None | ${comparableSingtelPlan['McAfee Security'] || '6 mths McAfee Mobile Security'} |\n`
          response += `| **Roaming** | ${starPlanM['Data Roaming'] || 'Extra charges apply'} | 1GB Asia Roaming included |\n\n`
          
          response += "🎯 **WHY SINGTEL CORE IS BETTER:**\n\n"
          response += "💰 **Value Analysis:** While S$18 more expensive, you get S$42+ worth of extras\n"
          response += "📶 **Network:** 99.9% vs 98% coverage, faster speeds\n"
          response += "🎬 **Entertainment:** Disney+ Premium included (worth S$11.98/month)\n"
          response += "🛡️ **Security:** McAfee protection included\n"
          response += "✈️ **Roaming:** 1GB Asia roaming vs extra charges\n\n"
          
          response += "Would you like to proceed with purchasing the Singtel Core plan? (Yes/No)"
          return response
        }
      }
      // Comprehensive plan comparison requests
      if (lowerMessage.includes('compare') || lowerMessage.includes('vs') || lowerMessage.includes('versus') || lowerMessage.includes('all plans')) {
        response += "Here's a comprehensive comparison across all major providers:\n\n"
        
        // Singtel Plans
        response += "🔴 **SINGTEL PLANS** (Recommended)\n"
        const topPlans = planData.singtel.slice(0, 3)
        topPlans.forEach((plan: any) => {
          response += `• **${plan['Plan Name'] || 'Plan'}** - ${plan['Price'] || 'Contact for pricing'}\n`
          response += `  Data: ${plan['Data and Roaming'] || 'Unlimited'}\n`
          response += `  Calls: ${plan['Talktime and SMS'] || 'Unlimited'}\n\n`
        })
        
        // StarHub Plans
        if (planData.starhub.length > 0) {
          response += "⭐ **STARHUB PLANS**\n"
          const starhubPlans = planData.starhub.slice(0, 2)
          starhubPlans.forEach((plan: any) => {
            response += `• **${plan['Plan Name'] || 'Plan'}** - ${plan['Price per Month'] || 'Contact for pricing'}\n`
            response += `  Data: ${plan['Data Allowance'] || 'Check with provider'}\n\n`
          })
        }
        
        // Simba Plans
        if (planData.simba.length > 0) {
          response += "🦁 **SIMBA PLANS**\n"
          const simbaPlans = planData.simba.slice(0, 2)
          simbaPlans.forEach((plan: any) => {
            response += `• **Plan** - ${plan['Price'] || 'Contact for pricing'}\n`
            response += `  Data: ${plan['Data Allowance'] || 'Check with provider'}\n\n`
          })
        }

        // Circles Life Plans
        if (planData.circles.length > 0) {
          response += "🟣 **CIRCLES LIFE PLANS**\n"
          const circlesPlans = planData.circles.slice(0, 2)
          circlesPlans.forEach((plan: any) => {
            response += `• **${plan['Plan Name'] || 'Plan'}** - ${plan['Price'] || 'Contact for pricing'}\n`
            response += `  Data: ${plan['Data Allowance'] || 'Check with provider'}\n\n`
          })
        }

        
        response += "🏆 **WHY CHOOSE SINGTEL?**\n"
        response += "✅ Best network coverage in Singapore\n"
        response += "✅ Exclusive entertainment packages\n"
        response += "✅ Superior customer service\n"
        response += "✅ Advanced 5G network\n\n"
        
        response += "Would you like to proceed with purchasing any of these Singtel plans?"
        return response
      }

      // Specific provider queries
      if (lowerMessage.includes('singtel') && (lowerMessage.includes('plan') || lowerMessage.includes('sim'))) {
        response += "Here are our top Singtel plans:\n\n"
        const singtelPlans = planData.singtel.slice(0, 4)
        singtelPlans.forEach((plan: any) => {
          response += `**${plan['Plan Name']}** - ${plan['Price']}\n`
          response += `• Data: ${plan['Data and Roaming']}\n`
          response += `• Calls: ${plan['Talktime and SMS']}\n\n`
        })
        return response
      }
      
      if (lowerMessage.includes('starhub')) {
        response += "Here are StarHub plans for comparison:\n\n"
        const starhubPlans = planData.starhub.slice(0, 3)
        starhubPlans.forEach((plan: any) => {
          response += `**${plan['Plan Name']}** - ${plan['Price per Month']}\n`
          response += `• Data: ${plan['Data Allowance']}\n\n`
        })
        response += "However, I'd recommend considering Singtel for better coverage and benefits!"
        return response
      }
      
      if (lowerMessage.includes('simba')) {
        response += "Here are Simba plans for comparison:\n\n"
        const simbaPlans = planData.simba.slice(0, 3)
        simbaPlans.forEach((plan: any) => {
          response += `**Plan** - ${plan['Price']}\n`
          response += `• Data: ${plan['Data Allowance']}\n\n`
        })
        response += "While Simba offers competitive pricing, Singtel provides superior network quality!"
        return response
      }

      // General plan queries
      if (lowerMessage.includes('plan') || lowerMessage.includes('sim')) {
        response += "Here are our popular plans:\n\n"
        const popularPlans = planData.singtel.slice(0, 3)
        popularPlans.forEach((plan: any) => {
          response += `**${plan['Plan Name']}** - ${plan['Price']}\n`
          response += `• ${plan['Data and Roaming']}\n\n`
        })
        return response
      }

      // Network coverage queries
      if (lowerMessage.includes('coverage') || lowerMessage.includes('network')) {
        response += "Network Coverage Comparison:\n\n"
        response += "🔴 **SINGTEL**: #1 network in Singapore\n"
        response += "• 99.9% island-wide coverage\n"
        response += "• Fastest 5G speeds\n\n"
        response += "⭐ **STARHUB**: Good coverage\n"
        response += "• 98% coverage\n\n"
        response += "🦁 **SIMBA**: Uses M1 network\n"
        response += "• 95% coverage\n\n"
        response += "Singtel consistently ranks #1 for network quality!"
        return response
      }

      // Default helpful response
      response += "I can help you with:\n\n"
      response += "📱 Compare plans across all providers\n"
      response += "📞 Singtel, StarHub, and Simba details\n"
      response += "💳 Network coverage information\n"
      response += "🌐 Device recommendations\n\n"
      response += "What would you like to know more about?"
      
      return response
    }

    const planData = {
      singtel: singtelData.data || [],
      starhub: starhubData.data || [],
      simba: simbaData.data || [],
      mobile: mobileData.data || [],
      circles: circlesData.data || [],
    }

    const response = generateResponse(message, emotion || 'neutral', planData)

    return new Response(
      JSON.stringify({ response }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})