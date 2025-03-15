import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRecordingSchema } from "@shared/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  app.post("/api/recordings", async (req, res) => {
    try {
      const data = insertRecordingSchema.parse(req.body);
      const recording = await storage.createRecording(data);
      res.json(recording);
    } catch (error) {
      res.status(400).json({ message: "Invalid recording data" });
    }
  });

  app.post("/api/recordings/:id/analyze", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const recording = await storage.getRecording(id);

      if (!recording) {
        return res.status(404).json({ message: "Recording not found" });
      }

      // Analyze audio and screen content
      const [audioResult, screenResult] = await Promise.allSettled([
        model.generateContent({
          contents: [{
            parts: [{ text: `Analyze this customer service audio recording: ${recording.audioBlob}` }]
          }]
        }),
        model.generateContent({
          contents: [{
            parts: [{ text: `Analyze this customer service screen recording: ${recording.screenBlob}` }]
          }]
        })
      ]);

      const feedback = {
        audioFeedback: audioResult.status === 'fulfilled' ? 
          (await audioResult.value.response.text()) : undefined,
        screenFeedback: screenResult.status === 'fulfilled' ? 
          (await screenResult.value.response.text()) : undefined
      };

      const updated = await storage.updateFeedback(id, feedback);
      res.json(updated);
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ message: "Failed to analyze recording" });
    }
  });

  return httpServer;
}