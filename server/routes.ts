import type { Express } from "express";
import { createServer, type Server } from "http";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";

// Initialize Gemini
const API_KEY = process.env.GOOGLE_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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

      // Enhanced audio analysis prompt
      const audioPrompt = `
        Analyze this customer service audio recording. Focus on:
        1. Identify any specific queries or questions asked
        2. Evaluate tone and professionalism
        3. Check for clarity and articulation
        4. Note any action items or follow-ups mentioned

        Provide a structured analysis addressing these points.
      `;

      // Analyze audio and screen content in parallel
      const [audioResult, screenResult] = await Promise.allSettled([
        model.generateContent([
          audioPrompt,
          {
            fileData: {
              fileUri: uploadResult.file.uri,
              mimeType: uploadResult.file.mimeType,
            },
          },
        ]),
        model.generateContent([
          "Analyze this screen recording focusing on UI navigation patterns, visual clarity, and user experience. Use the analyzeScreenRecording function to structure your response.",
          screenBlob
        ], {
          tools: [{ functionDeclarations: screenAnalysisFunctions }]
        })
      ]);

      // Process audio feedback
      let audioFeedback = "Failed to analyze audio";
      if (audioResult.status === 'fulfilled') {
        audioFeedback = await audioResult.value.response.text();
      }

      // Process screen feedback with function calling
      let screenFeedback = "Failed to analyze screen recording";
      if (screenResult.status === 'fulfilled') {
        const response = await screenResult.value.response.text();
        try {
          const parsedResponse = JSON.parse(response);
          screenFeedback = `
Navigation Flow: ${parsedResponse.navigationFlow}

Visual Elements: ${parsedResponse.visualElements}

User Experience: ${parsedResponse.userExperience}
          `.trim();
        } catch (e) {
          screenFeedback = response;
        }
      }

      res.json({
        audioFeedback,
        screenFeedback
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