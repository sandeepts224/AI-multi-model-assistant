import { useState } from "react";
import { RecordingControls } from "@/components/recording-controls";
import { FeedbackDisplay } from "@/components/feedback-display";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const [feedback, setFeedback] = useState<{
    combinedAnalysis?: string;
  }>({});

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-8">
      <h1 className="text-4xl font-bold mb-8">Customer Service Assistant</h1>

      <Card className="w-full max-w-4xl mb-8">
        <CardContent className="flex justify-center py-8">
          <RecordingControls onFeedbackReceived={setFeedback} />
        </CardContent>
      </Card>

      <FeedbackDisplay combinedAnalysis={feedback.combinedAnalysis} />
    </div>
  );
}