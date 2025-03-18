import type { Express } from "express";
import { createServer, type Server } from "http";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";

// Initialize Gemini
const API_KEY = process.env.GOOGLE_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
const fileManager = new GoogleAIFileManager(API_KEY);

// Function definition for screen analysis
const screenAnalysisFunctions = [
  {
    name: "analyzeScreenRecording",
    description: "Analyzes a screen recording for UI navigation and visual elements",
    parameters: {
      type: "object",
      properties: {
        navigationFlow: {
          type: "string",
          description: "Description of the UI navigation flow"
        },
        visualElements: {
          type: "string",
          description: "Analysis of visual elements and their effectiveness"
        },
        userExperience: {
          type: "string",
          description: "Overall user experience assessment"
        }
      },
      required: ["navigationFlow", "visualElements", "userExperience"]
    }
  }
];

async function waitForFileProcessing(file: any) {
  while (file.state === FileState.PROCESSING) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    file = await fileManager.getFile(file.name);
  }
  return file;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  app.post("/api/analyze", async (req, res) => {
    try {
      const { audioBlob, screenBlob } = req.body;

      // Convert base64 to Buffer for audio
      const audioBuffer = Buffer.from(audioBlob, 'base64');

      // Upload and process audio file
      const audioFile = await fileManager.uploadFile(audioBuffer, {
        mimeType: "audio/webm"
      });
      const processedAudioFile = await waitForFileProcessing(audioFile.file);

      if (processedAudioFile.state === FileState.FAILED) {
        throw new Error("Audio processing failed");
      }

      // Upload and process screen recording
      const screenBuffer = Buffer.from(screenBlob, 'base64');
      const screenFile = await fileManager.uploadFile(screenBuffer, {
        mimeType: "video/webm"
      });
      const processedScreenFile = await waitForFileProcessing(screenFile.file);

      if (processedScreenFile.state === FileState.FAILED) {
        throw new Error("Screen recording processing failed");
      }

      // Combined analysis with both audio and video
      const result = await model.generateContent([
        "You are a helpful assistant analyzing a conversation from both audio and screen recording. First, analyze the audio to understand the user's query. Then, analyze the screen recording to identify relevant UI elements and actions.  Provide a combined analysis summarizing the user's intent and the corresponding on-screen activity.",
        {
          fileData: {
            fileUri: processedAudioFile.uri,
            mimeType: processedAudioFile.mimeType
          }
        },
        {
          fileData: {
            fileUri: processedScreenFile.uri,
            mimeType: processedScreenFile.mimeType
          }
        }
      ]);

      const response = await result.response;
      const combinedAnalysis = response.text();

      res.json({
        combinedAnalysis
      });
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