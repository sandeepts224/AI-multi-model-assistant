import React, { useRef, useState, useEffect } from "react";
import { FeedbackDisplay } from "@/components/feedback-display";
import { Card, CardContent } from "@/components/ui/card";
import { RecordingControls } from "@/components/recording-controls";
import { setAnalysisCallback, AnalysisCallback } from "@/lib/recording";

export default function Home() {
  const [audioAnalysis, setAudioAnalysis] = useState("");
  const [screenAnalysis, setScreenAnalysis] = useState("");

  useEffect(() => {
    const callback: AnalysisCallback = (analysis, mediaType) => {
      if (mediaType === "audio") {
        setAudioAnalysis(analysis);
      } else {
        setScreenAnalysis(analysis);
      }
    };
    setAnalysisCallback(callback);
  }, []);


  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-8">
      <h1 className="text-4xl font-bold mb-8">Customer Service Assistant</h1>

      <Card className="w-full max-w-4xl mb-8">
        <CardContent className="flex justify-center py-8">
          <RecordingControls/>
        </CardContent>
      </Card>

      <FeedbackDisplay 
        audioAnalysis={audioAnalysis}
        screenAnalysis={screenAnalysis}
      />
    </div>
  );
}