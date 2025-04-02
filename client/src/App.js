import React, { useState } from "react";
import Recorder from "./Recorder";
import FeedbackDisplay from "./FeedbackDisplay";

function App() {
  const [analysis, setAnalysis] = useState("");

  const handleAnalysisReceived = (newAnalysis) => {
    setAnalysis(newAnalysis);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-center mb-8">
        Gemini Audio & Screen Analysis
      </h1>
      <Recorder onAnalysisReceived={handleAnalysisReceived} />
      <FeedbackDisplay analysis={analysis} />
    </div>
  );
}

export default App;