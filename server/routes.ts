import type { Express } from "express";
import { createServer, type Server } from "node:http";
import "dotenv/config";
import OpenAI from "openai";
import axios from "axios";

const openRouterClient = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const geminiClient = process.env.GEMINI_API_KEY ? new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
}) : null;

const DEFAULT_OPENROUTER_MODEL = "stepfun/step-3.5-flash:free";
const DEFAULT_GEMINI_MODEL = "gemini-1.5-flash";
const DEFAULT_NVIDIA_MODEL = "qwen/qwen3.5-122b-a10b";

const getAIClient = () => {
  if (process.env.NVIDIA_API_KEY) {
    return { client: "nvidia" as const, model: DEFAULT_NVIDIA_MODEL };
  }
  if (geminiClient && process.env.GEMINI_API_KEY) {
    return { client: geminiClient, model: DEFAULT_GEMINI_MODEL };
  }
  return { client: openRouterClient, model: DEFAULT_OPENROUTER_MODEL };
};

async function generateCompletion(messages: any[], maxTokens: number = 1000) {
  const { client, model } = getAIClient();

  if (client === "nvidia") {
    const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
    const payload = {
      model: model,
      messages: messages,
      max_tokens: maxTokens,
      temperature: 0.60,
      top_p: 0.95,
      stream: false,
      chat_template_kwargs: { enable_thinking: true },
    };

    const headers = {
      Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
      Accept: "application/json",
    };

    const response = await axios.post(invokeUrl, payload, { headers });
    return response.data.choices?.[0]?.message?.content || "{}";
  } else {
    const response = await client.chat.completions.create({
      model: model,
      messages: messages,
      response_format: { type: "json_object" },
      max_tokens: maxTokens,
      temperature: 0.9,
    });
    return response.choices[0]?.message?.content || "{}";
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/test-ai", (req, res) => {
    res.json({
      status: "Ok",
      hasNvidiaKey: !!process.env.NVIDIA_API_KEY,
      hasOpenRouterKey: !!process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      activeClient: process.env.NVIDIA_API_KEY ? "Nvidia" : (process.env.GEMINI_API_KEY ? "Gemini" : "OpenRouter"),
      host: process.env.EXPO_PUBLIC_DOMAIN,
    });
  });

  app.post("/api/generate-caption", async (req, res) => {
    try {
      if (!process.env.NVIDIA_API_KEY && !process.env.AI_INTEGRATIONS_OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "AI API keys are missing on the server" });
      }

      const { topic, styles } = req.body as {
        topic: string;
        styles: string[];
      };

      if (!topic || !styles || styles.length === 0) {
        return res.status(400).json({ error: "topic and styles are required" });
      }

      const styleDescriptions: Record<string, string> = {
        funny: "humorous and witty, with a lighthearted joke or pun",
        motivational: "inspiring, uplifting, empowering and energetic",
        romantic: "sweet, loving, poetic and emotional",
        business: "professional, formal and value-oriented",
        aesthetic: "beautiful, poetic, minimalist and dreamy",
        sarcastic: "ironic with dry humor and tongue-in-cheek wit",
      };

      const styleList = styles
        .map((s) => `- ${s}: ${styleDescriptions[s] || "creative and engaging"}`)
        .join("\n");

      const prompt = `Generate ${styles.length} WhatsApp status caption(s) about: "${topic}"

Create one caption per style listed below:
${styleList}

Rules:
- Each caption is 1-3 sentences maximum
- Include 1-3 relevant emojis naturally
- Sound authentic and casual, not generic
- Suitable for WhatsApp status

Return a JSON object with this exact structure:
{
  "captions": [
    {"style": "funny", "text": "Your funny caption here 😂"},
    {"style": "motivational", "text": "Your motivational caption here 💪"}
  ]
}`;

      const content = await generateCompletion([{ role: "user", content: prompt }], 1000);
      const cleanedContent = content.replace(/```json\n/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanedContent);

      return res.json(parsed);
    } catch (error) {
      console.error("Error generating captions:", error);
      return res.status(500).json({ error: "Failed to generate captions" });
    }
  });

  app.post("/api/generate-sticker", async (req, res) => {
    try {
      if (!process.env.NVIDIA_API_KEY && !process.env.AI_INTEGRATIONS_OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "AI API keys are missing on the server" });
      }

      const { prompt } = req.body as { prompt: string };

      if (!prompt) {
        return res.status(400).json({ error: "prompt is required" });
      }

      const systemPrompt = `You are a creative WhatsApp sticker designer. Generate fun, expressive sticker pack content based on a user's idea.

Return a JSON object with this exact structure:
{
  "title": "Short catchy sticker pack title (2-4 words)",
  "text": "Main sticker text or catchphrase (max 8 words, punchy)",
  "emojis": "3-5 relevant emojis that match the theme",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"]
}

Rules for tags: short 1-3 word phrases that would make great mini stickers for this pack theme (funny reactions, expressions, moods).`;

      const content = await generateCompletion([
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create a WhatsApp sticker pack for: ${prompt}` },
      ], 400);

      const cleanedContent = content.replace(/```json\n/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanedContent);

      return res.json(parsed);
    } catch (error) {
      console.error("Error generating sticker:", error);
      return res.status(500).json({ error: "Failed to generate sticker" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
