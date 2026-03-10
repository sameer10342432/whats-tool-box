import type { Express } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/generate-caption", async (req, res) => {
    try {
      const { topic, styles } = req.body as {
        topic: string;
        styles: string[];
      };

      if (!topic || !styles || styles.length === 0) {
        return res.status(400).json({ error: "topic and styles are required" });
      }

      const styleDescriptions: Record<string, string> = {
        funny: "humorous, witty, with a lighthearted joke or pun",
        motivational: "inspiring, uplifting, empowering, energetic",
        romantic: "sweet, loving, poetic, emotional",
        business: "professional, formal, value-oriented",
        aesthetic: "beautiful, poetic, minimalist, dreamy",
        sarcastic: "ironic, dry humor, tongue-in-cheek",
      };

      const stylePrompts = styles
        .map((s) => `- ${s}: ${styleDescriptions[s] || "creative"}`)
        .join("\n");

      const prompt = `Generate ${styles.length} unique WhatsApp status captions for: "${topic}"

Generate one caption for each of these styles:
${stylePrompts}

Rules:
- Each caption should be 1-3 sentences
- Include relevant emojis
- Make them sound natural and authentic
- WhatsApp-friendly tone

Return ONLY a JSON object like this:
{
  "captions": [
    {"style": "funny", "text": "..."},
    {"style": "motivational", "text": "..."}
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5-nano",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_completion_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(content);

      return res.json(parsed);
    } catch (error) {
      console.error("Error generating captions:", error);
      return res.status(500).json({ error: "Failed to generate captions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
