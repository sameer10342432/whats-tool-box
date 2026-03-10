import type { Express } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 1000,
        temperature: 0.9,
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
