import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { startRecording, stopRecording, type RecordingState } from "@/lib/recording";
import { apiRequest } from "@/lib/queryClient";
import { Monitor, Circle } from "lucide-react";

export function RecordingControls() {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    audioStream: null,
    screenStream: null,
    audioRecorder: null,
    screenRecorder: null
  });

  const { toast } = useToast();

  const handleStartRecording = useCallback(async () => {
    try {
      const newState = await startRecording();

      let audioChunks: Blob[] = [];
      let screenChunks: Blob[] = [];

      newState.audioRecorder!.ondataavailable = (e) => audioChunks.push(e.data);
      newState.screenRecorder!.ondataavailable = (e) => screenChunks.push(e.data);

      // Request data every 1 second to keep chunks small
      newState.audioRecorder!.start(1000);
      newState.screenRecorder!.start(1000);

      newState.audioRecorder!.onstop = async () => {
        try {
          // Process audio and screen data
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const screenBlob = new Blob(screenChunks, { type: 'video/webm' });

          // Convert blobs to base64 strings in chunks
          const audioBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(audioBlob);
          });

          const screenBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(screenBlob);
          });

          const recording = {
            audioBlob: audioBase64.split(',')[1], // Remove data URL prefix
            screenBlob: screenBase64.split(',')[1]
          };

          const response = await apiRequest('POST', '/api/recordings', recording);
          const data = await response.json();

          // Trigger analysis
          await apiRequest('POST', `/api/recordings/${data.id}/analyze`);

          toast({
            title: "Recording saved",
            description: "Your recording has been saved and is being analyzed"
          });
        } catch (error) {
          console.error('Error saving recording:', error);
          toast({
            title: "Error saving recording",
            description: error instanceof Error ? error.message : "Failed to save and analyze the recording",
            variant: "destructive"
          });
        }
      };

      setRecordingState(newState);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording failed",
        description: error instanceof Error ? error.message : "Failed to start recording",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleStopRecording = useCallback(() => {
    setRecordingState(prev => stopRecording(prev));
  }, []);

  return (
    <div className="flex gap-4">
      <Button
        variant="outline"
        size="lg"
        className="w-12 h-12 p-0"
        onClick={handleStartRecording}
        disabled={recordingState.isRecording}
      >
        <Monitor className="h-6 w-6" />
      </Button>

      <Button
        size="lg"
        className={`w-12 h-12 p-0 rounded-full transition-colors ${
          recordingState.isRecording ? "bg-red-500 hover:bg-red-600" : "bg-black hover:bg-gray-900"
        }`}
        onClick={recordingState.isRecording ? handleStopRecording : handleStartRecording}
      >
        <Circle className="h-6 w-6" fill={recordingState.isRecording ? "currentColor" : "none"} />
      </Button>
    </div>
  );
}