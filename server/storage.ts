import { recordings, type Recording, type InsertRecording } from "@shared/schema";

export interface IStorage {
  createRecording(recording: InsertRecording): Promise<Recording>;
  getRecording(id: number): Promise<Recording | undefined>;
  updateFeedback(id: number, feedback: { audioFeedback?: string; screenFeedback?: string }): Promise<Recording>;
}

export class MemStorage implements IStorage {
  private recordings: Map<number, Recording>;
  private currentId: number;

  constructor() {
    this.recordings = new Map();
    this.currentId = 1;
  }

  async createRecording(insertRecording: InsertRecording): Promise<Recording> {
    const id = this.currentId++;
    const recording: Recording = {
      ...insertRecording,
      id,
      feedback: {},
      createdAt: new Date(),
    };
    this.recordings.set(id, recording);
    return recording;
  }

  async getRecording(id: number): Promise<Recording | undefined> {
    return this.recordings.get(id);
  }

  async updateFeedback(
    id: number,
    feedback: { audioFeedback?: string; screenFeedback?: string }
  ): Promise<Recording> {
    const recording = await this.getRecording(id);
    if (!recording) {
      throw new Error("Recording not found");
    }
    
    const updated = {
      ...recording,
      feedback: {
        ...recording.feedback,
        ...feedback
      }
    };
    this.recordings.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
