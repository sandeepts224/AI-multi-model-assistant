import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRecordingSchema } from "@shared/schema";
import { VertexAI } from "@google-cloud/vertexai";

const vertex_ai = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT || 'default-project',
  location: 'us-central1'
});

const model = 'gemini-2.0-flash-lite';

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

      // Initialize Gemini
      const generativeModel = vertex_ai.getGenerativeModel({
        model: model,
        generation_config: {
          max_output_tokens: 2048,
        },
      });

      // Analyze audio and screen content
      const [audioPromise, screenPromise] = await Promise.allSettled([
        generativeModel.generateContent({
          contents: [{ text: "Analyze this customer service audio recording: " + recording.audioBlob }],
        }),
        generativeModel.generateContent({
          contents: [{ text: "Analyze this customer service screen recording: " + recording.screenBlob }],
        })
      ]);

      const feedback = {
        audioFeedback: audioPromise.status === 'fulfilled' ? audioPromise.value.response.text() : undefined,
        screenFeedback: screenPromise.status === 'fulfilled' ? screenPromise.value.response.text() : undefined
      };

      const updated = await storage.updateFeedback(id, feedback);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze recording" });
    }
  });

  return httpServer;
}
