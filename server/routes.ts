import type { Express } from "express";
import { createServer, type Server } from "http";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  app.post("/api/analyze", async (req, res) => {
    try {
      const { audioBlob, screenBlob } = req.body;

      // Analyze audio and screen content in parallel
      const [audioResult, screenResult] = await Promise.allSettled([
        model.generateContent({
          contents: [{
            parts: [{ text: `Analyze this customer service audio recording for tone, clarity, and professionalism: ${audioBlob}` }]
          }]
        }),
        model.generateContent({
          contents: [{
            parts: [{ text: `Analyze this customer service screen recording for UI navigation and visual presentation: ${screenBlob}` }]
          }]
        })
      ]);

      const feedback = {
        audioFeedback: audioResult.status === 'fulfilled' ? 
          (await audioResult.value.response.text()) : "Failed to analyze audio",
        screenFeedback: screenResult.status === 'fulfilled' ? 
          (await screenResult.value.response.text()) : "Failed to analyze screen recording"
      };

      res.json(feedback);
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ 
        message: "Failed to analyze recording",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  return httpServer;
}