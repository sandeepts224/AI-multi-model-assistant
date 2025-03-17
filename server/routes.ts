import type { Express } from "express";
import { createServer, type Server } from "http";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";

// Initialize Gemini
const API_KEY = process.env.GOOGLE_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const fileManager = new GoogleAIFileManager(API_KEY);

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  app.post("/api/analyze", async (req, res) => {
    try {
      const { audioBlob, screenBlob } = req.body;

      // Convert base64 to Buffer for audio
      const audioBuffer = Buffer.from(audioBlob, 'base64');

      // Upload audio file
      const uploadResult = await fileManager.uploadFile(audioBuffer, {
        mimeType: "audio/webm",
        displayName: "customer_service_audio.webm",
      });

      // Wait for processing
      let file = await fileManager.getFile(uploadResult.file.name);
      while (file.state === FileState.PROCESSING) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        file = await fileManager.getFile(uploadResult.file.name);
      }

      if (file.state === FileState.FAILED) {
        throw new Error("Audio processing failed");
      }

      // Analyze audio and screen content in parallel
      const [audioResult, screenResult] = await Promise.allSettled([
        model.generateContent([
          "Analyze this customer service audio recording for tone, clarity, and professionalism.",
          {
            fileData: {
              fileUri: uploadResult.file.uri,
              mimeType: uploadResult.file.mimeType,
            },
          },
        ]),
        model.generateContent([
          "Analyze this customer service screen recording for UI navigation and visual presentation.",
          screenBlob
        ])
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