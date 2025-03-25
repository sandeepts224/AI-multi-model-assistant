import { useState } from "react";
import { RecordingControls } from "@/components/recording-controls";
import { FeedbackDisplay } from "@/components/feedback-display";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const [audioAnalysis, setAudioAnalysis] = useState("");
  const [screenAnalysis, setScreenAnalysis] = useState("");

  const handleFeedbackReceived = (feedback: { audio?: string; screen?: string }) => {
    if (feedback.audio) {
      setAudioAnalysis(feedback.audio);
    }
    if (feedback.screen) {
      setScreenAnalysis(feedback.screen);
    }
  };
  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-8">
      <h1 className="text-4xl font-bold mb-8">Customer Service Assistant</h1>

      <Card className="w-full max-w-4xl mb-8">
        <CardContent className="flex justify-center py-8">
          <RecordingControls onFeedbackReceived={handleFeedbackReceived} />
        </CardContent>
      </Card>

      <FeedbackDisplay 
        audioAnalysis={audioAnalysis}
        screenAnalysis={screenAnalysis}
      />
    </div>
  );
}