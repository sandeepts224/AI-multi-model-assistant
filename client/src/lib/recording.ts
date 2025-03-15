export interface RecordingState {
  isRecording: boolean;
  audioStream: MediaStream | null;
  screenStream: MediaStream | null;
  audioRecorder: MediaRecorder | null;
  screenRecorder: MediaRecorder | null;
}

export async function startRecording(): Promise<RecordingState> {
  try {
    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    
    const audioRecorder = new MediaRecorder(audioStream);
    const screenRecorder = new MediaRecorder(screenStream);
    
    return {
      isRecording: true,
      audioStream,
      screenStream,
      audioRecorder,
      screenRecorder
    };
  } catch (error) {
    throw new Error("Failed to start recording: " + error);
  }
}

export function stopRecording(state: RecordingState) {
  state.audioStream?.getTracks().forEach(track => track.stop());
  state.screenStream?.getTracks().forEach(track => track.stop());
  
  state.audioRecorder?.stop();
  state.screenRecorder?.stop();
  
  return {
    isRecording: false,
    audioStream: null,
    screenStream: null,
    audioRecorder: null,
    screenRecorder: null
  };
}
