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
      
      newState.audioRecorder!.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const screenBlob = new Blob(screenChunks, { type: 'video/webm' });
        
        const recording = {
          audioBlob: await audioBlob.text(),
          screenBlob: await screenBlob.text()
        };
        
        try {
          const response = await apiRequest('POST', '/api/recordings', recording);
          const data = await response.json();
          
          // Trigger analysis
          await apiRequest('POST', `/api/recordings/${data.id}/analyze`);
          
          toast({
            title: "Recording saved",
            description: "Your recording has been saved and is being analyzed"
          });
        } catch (error) {
          toast({
            title: "Error saving recording",
            description: "Failed to save and analyze the recording",
            variant: "destructive"
          });
        }
      };
      
      newState.audioRecorder!.start();
      newState.screenRecorder!.start();
      
      setRecordingState(newState);
    } catch (error) {
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
