import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, topic, lessonContent } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    const body: any = {
      model: "google/gemini-3-flash-preview",
      messages: [],
    };

    if (type === "explain") {
      systemPrompt = "You are a patient, encouraging tutor. The student is confused about a topic. Generate exactly 3 simplified bullet-point explanations. Each should start with an emoji, be concise (1-2 sentences), and use simple analogies. Return ONLY the tool call.";
      body.tools = [{
        type: "function",
        function: {
          name: "provide_explanations",
          description: "Return 3 simplified explanations for confused students",
          parameters: {
            type: "object",
            properties: {
              explanations: {
                type: "array",
                items: { type: "string" },
                description: "Array of 3 emoji-prefixed simplified explanations"
              }
            },
            required: ["explanations"],
            additionalProperties: false
          }
        }
      }];
      body.tool_choice = { type: "function", function: { name: "provide_explanations" } };
    } else if (type === "quiz") {
      systemPrompt = "You are a fun quiz master. Generate exactly 3 multiple-choice questions about the topic to re-engage a bored student. Make them interesting and challenging but fair. Return ONLY the tool call.";
      body.tools = [{
        type: "function",
        function: {
          name: "generate_quiz",
          description: "Return 3 quiz questions with options and correct answer index",
          parameters: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    options: { type: "array", items: { type: "string" } },
                    correct: { type: "number", description: "0-indexed correct answer" }
                  },
                  required: ["question", "options", "correct"],
                  additionalProperties: false
                }
              }
            },
            required: ["questions"],
            additionalProperties: false
          }
        }
      }];
      body.tool_choice = { type: "function", function: { name: "generate_quiz" } };
    } else {
      throw new Error("Invalid type. Use 'explain' or 'quiz'.");
    }

    body.messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Topic: "${topic}"\n\nLesson content:\n${lessonContent || topic}` },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");
    
    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("adaptive-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
