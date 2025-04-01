import { blobToBase64 } from "./utils";

/************************************************
 * GLOBAL VARIABLES
 ***********************************************/
let previousAudioAnalysis = "";
let previousScreenAnalysis = "";

// Define the type for the analysis callback
export type AnalysisCallback = (analysis: string, mediaType: "audio" | "video") => void;

// Global variable to hold the callback
let analysisCallback: AnalysisCallback | undefined;

// External function to set the callback
export function setAnalysisCallback(cb: AnalysisCallback): void {
  analysisCallback = cb;
}

// Modified onAnalysisReceived to call the external callback
function onAnalysisReceived(analysis: string, mediaType: "audio" | "video") {
  console.log(`Received analysis for ${mediaType}:`, analysis);
  if (analysisCallback) {
    analysisCallback(analysis, mediaType);
  }
}

/************************************************
 * INTERFACE
 ***********************************************/
export interface RecordingState {
  isRecording: boolean;
  audioStream: MediaStream | null;
  screenStream: MediaStream | null;
  timeoutId?: number | null; // We'll track a session timeout ID if any
  audioRecorder: MediaRecorder | null;
  screenRecorder: MediaRecorder | null;
}

/************************************************
 * UPLOAD FUNCTION VIA WEBSOCKET
 ***********************************************/
let ws: WebSocket | null = null;

function connectWebSocket(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      resolve();
    } else {
      ws = new WebSocket("ws://127.0.0.1:8000/ws/analyze");
      ws.onopen = () => {
        console.log("WebSocket connection opened");
        resolve();
      };
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        reject(error);
      };
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.geminiAnalysis) {
          console.log("Received live analysis for", message.mediaType, ":", message.geminiAnalysis);
          onAnalysisReceived(message.geminiAnalysis, message.mediaType || "audio");
        }
      };
    }
  });
}

async function uploadChunkToGemini(
  blob: Blob,
  mediaType: "audio" | "video",
  previousAnalysis: string
) {
  await connectWebSocket();
  const base64Data = await blobToBase64(blob);
  const chunk = base64Data.split(",")[1];
  const message = {
    mediaType,
    chunk,
    previousAnalysis
  };
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  } else {
    console.error("WebSocket is not open");
  }
}

/************************************************
 * UTILITY: SET A TIMER TO AUTO-STOP
 ***********************************************/
function setStopTimer(
  state: RecordingState,
  durationMs: number,
  stopFn: (s: RecordingState) => RecordingState
) {
  // Clear any existing timer
  if (state.timeoutId) {
    clearTimeout(state.timeoutId);
  }
  const timerId = window.setTimeout(() => {
    stopFn(state);
  }, durationMs);
  state.timeoutId = timerId;
}

/************************************************
 * START SCREEN + AUDIO RECORDING (15-SECOND CHUNKS)
 ***********************************************/
export async function startRecording(state: RecordingState): Promise<RecordingState> {
  let { audioStream, audioRecorder } = state;
  let { screenStream, screenRecorder } = state;

  const MAX_DURATION_MS = 120_000;

  if (!audioStream) {
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  }

  if (!audioRecorder || audioRecorder.state === "inactive") {
    audioRecorder = new MediaRecorder(audioStream);
  }

  let audioChunks: Blob[] = [];
  let audioSeconds = 0;

  audioRecorder.start(1000);

  audioRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      audioChunks.push(event.data);
      audioSeconds += 1;
    }

    if (audioSeconds >= 15) {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      uploadChunkToGemini(
        audioBlob,
        "audio",
        previousAudioAnalysis
      );
      audioChunks = [];
      audioSeconds = 0;
    }
  };

  audioRecorder.onstop = () => {
    if (audioChunks.length) {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      uploadChunkToGemini(
        audioBlob,
        "audio",
        previousAudioAnalysis
      );
      audioChunks = [];
      audioSeconds = 0;
    }
  };

  if (!screenStream) {
    screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
  }

  if (!screenRecorder || screenRecorder.state === "inactive") {
    screenRecorder = new MediaRecorder(screenStream);
  }

  let screenChunks: Blob[] = [];
  let screenSeconds = 0;

  screenRecorder.start(1000);

  screenRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      screenChunks.push(event.data);
      screenSeconds += 1;
    }

    if (screenSeconds >= 15) {
      const screenBlob = new Blob(screenChunks, { type: "video/webm" });
      uploadChunkToGemini(
        screenBlob,
        "video",
        previousScreenAnalysis
      );
      screenChunks = [];
      screenSeconds = 0;
    }
  };

  screenRecorder.onstop = () => {
    if (screenChunks.length) {
      const screenBlob = new Blob(screenChunks, { type: "video/webm" });
      uploadChunkToGemini(
        screenBlob,
        "video",
        previousScreenAnalysis
      );
      screenChunks = [];
      screenSeconds = 0;
    }
  };

  // Set a timer to auto-stop after 2 minutes if not manually stopped
  const newState: RecordingState = {
    isRecording: true,
    audioStream,
    screenStream,
    audioRecorder,
    screenRecorder,
    timeoutId: null
  };

  setStopTimer(newState, MAX_DURATION_MS, stopRecording);

  return newState;
}

/************************************************
 * STOP SCREEN + AUDIO RECORDING
 ***********************************************/
export function stopRecording(state: RecordingState): RecordingState {
  state.audioRecorder?.stop();
  state.screenRecorder?.stop();
  // Clear any session timer
  if (state.timeoutId) {
    clearTimeout(state.timeoutId);
    state.timeoutId = null;
  }

  return {
    ...state,
    isRecording: false
  };
}

/************************************************
 * START AUDIO-ONLY RECORDING (15-SECOND CHUNKS)
 ***********************************************/
export async function startAudioRecording(state: RecordingState): Promise<RecordingState> {
  let { audioStream, audioRecorder } = state;

  // For audio-only, 15 minutes = 900_000 ms
  const MAX_DURATION_MS = 900_000; // 15 minutes

  if (!audioStream) {
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  }
  if (!audioRecorder || audioRecorder.state === "inactive") {
    audioRecorder = new MediaRecorder(audioStream);
  }

  let audioChunks: Blob[] = [];
  let audioSeconds = 0;

  audioRecorder.start(1000);

  audioRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      audioChunks.push(event.data);
      audioSeconds += 1;
    }

    if (audioSeconds >= 15) {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      uploadChunkToGemini(
        audioBlob,
        "audio",
        previousAudioAnalysis
      );
      audioChunks = [];
      audioSeconds = 0;
    }
  };

  audioRecorder.onstop = () => {
    if (audioChunks.length) {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      uploadChunkToGemini(
        audioBlob,
        "audio",
        previousAudioAnalysis
      );
      audioChunks = [];
      audioSeconds = 0;
    }
  };

  // Return a new state with a timer that will auto-stop after 15 minutes
  const newState: RecordingState = {
    ...state,
    isRecording: true,
    audioStream,
    audioRecorder,
    timeoutId: null
  };

  setStopTimer(newState, MAX_DURATION_MS, stopAudioRecording);

  return newState;
}

/************************************************
 * STOP AUDIO-ONLY RECORDING
 ***********************************************/
export function stopAudioRecording(state: RecordingState): RecordingState {
  const { audioRecorder } = state;
  if (audioRecorder && audioRecorder.state === "recording") {
    audioRecorder.stop();
  }

  // Clear any session timer
  if (state.timeoutId) {
    clearTimeout(state.timeoutId);
    state.timeoutId = null;
  }

  return {
    ...state,
    isRecording: false,
    audioRecorder: null
  };
}