import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  startRecording, 
  stopRecording, 
  type RecordingState, 
  stopAudioRecording, 
  startAudioRecording 
} from "@/lib/recording";
import { Mic, MicOff, Circle } from "lucide-react";

interface RecordingControlsProps {
  onFeedbackReceived: (a: any) => void;
}

export function RecordingControls({ onFeedbackReceived }: RecordingControlsProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    audioStream: null,
    screenStream: null,
    audioRecorder: null,
    screenRecorder: null,
  });

  const { toast } = useToast();

  const handleRecordingToggle = useCallback(async () => {
    try {
      if (!recordingState.isRecording) {
        const newState = await startRecording(recordingState);
        setRecordingState(prev => ({ ...prev, ...newState, isRecording: true }));
        toast({
          title: "Recording started",
          description: "Your screen is now being recorded.",
        });
      } else {
        const newState = stopRecording(recordingState);
        setRecordingState(prev => ({ ...prev, ...newState, isRecording: false }));
        toast({
          title: "Analyzing recording...",
          description: "Your screen recording has stopped.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Recording error",
        description: error?.message || "An error occurred while toggling the recording.",
        variant: "destructive",
      });
    }
  }, [recordingState, toast]);
  
  const handleMicToggle = async () => {
    try {
      if (!recordingState.audioRecorder || recordingState.audioRecorder.state !== "recording") {
        const newState = await startAudioRecording(recordingState);
        setRecordingState(newState);
        toast({
          title: "Audio recording started",
          description: "Your microphone is now being recorded.",
        });
      } else {
        const newState = stopAudioRecording(recordingState);
        setRecordingState(newState);
        toast({
          title: "Analyzing audio recording...",
          description: "Your microphone recording has stopped.",
        });
        
      }
    } catch (error: any) {
      toast({
        title: "Recording error",
        description: error?.message || "An error occurred while toggling the microphone recording.",
      });
    }
  };

  return (
    <div className="flex gap-4">
      <Button
        variant="outline"
        size="lg"
        className="w-12 h-12 p-0"
        onClick={handleMicToggle}
      >
        {recordingState.audioRecorder && recordingState.audioRecorder.state === "recording" ? <Mic className="h-6 w-6" color="#ff2600"/> : <MicOff className="h-6 w-6"/>}
      </Button>

      <Button
        size="lg"
        className={`w-12 h-12 p-0 rounded-full transition-colors ${
          recordingState.isRecording ? "bg-red-500 hover:bg-red-600" : "bg-black hover:bg-gray-900"
        }`}
        onClick={handleRecordingToggle}
      >
        <Circle className="h-6 w-6" fill={recordingState.isRecording ? "currentColor" : "none"} />
      </Button>
    </div>
  );
}