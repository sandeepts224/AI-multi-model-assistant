import express from 'express';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';

const router = express.Router();

// Initialize the model
const genAI = new GoogleGenerativeAI(process.env.API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const fileManager = new GoogleAIFileManager(process.env.API_KEY || '');

async function waitForFileProcessing(file: any) {
  while (file.state === FileState.PROCESSING) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    file = await fileManager.getFile(file.name);
  }
  return file;
}

export function registerRoutes(app: express.Express) {
  app.post('/api/analyze', async (req, res) => {
    try {
      const { audioBlob, screenBlob } = req.body;

      // Process audio file
      const audioUploadResult = await fileManager.uploadFile(Buffer.from(audioBlob, 'base64'), {
        mimeType: 'audio/webm'
      });
      const processedAudioFile = await waitForFileProcessing(audioUploadResult.file);

      // Process video file
      const videoUploadResult = await fileManager.uploadFile(Buffer.from(screenBlob, 'base64'), {
        mimeType: 'video/webm'
      });
      const processedVideoFile = await waitForFileProcessing(videoUploadResult.file);

      // Combined analysis with both audio and video
      const result = await model.generateContent([
        "You are a helpful assistant analyzing a conversation from both audio and screen recording. First, analyze the audio to understand the user's query. Then, analyze the screen recording to identify relevant UI elements and actions. Provide a combined analysis summarizing the user's intent and the corresponding on-screen activity.",
        {
          fileData: {
            fileUri: processedAudioFile.uri,
            mimeType: processedAudioFile.mimeType,
          },
        },
        {
          fileData: {
            fileUri: processedVideoFile.uri,
            mimeType: processedVideoFile.mimeType,
          },
        }
      ]);

      const combinedAnalysis = await result.response.text();
      res.json({ combinedAnalysis });
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'An error occurred during analysis'
      });
    }
  });

  return router;
}