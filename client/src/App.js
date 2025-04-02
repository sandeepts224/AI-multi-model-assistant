import React, { useState } from "react";
import Recorder from "./components/Recorder";
import FeedbackDisplay from "./components/FeedbackDisplay";

function App() {
  const [analysis, setAnalysis] = useState("");

  const handleAnalysisReceived = (newAnalysis) => {
    setAnalysis(newAnalysis);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <h1 className="text-4xl font-extrabold mb-10 border-b-2 border-blue-500 pb-2">
        AI Assistant
      </h1>
      <div className="w-full max-w-3xl space-y-8">
        <Recorder onAnalysisReceived={handleAnalysisReceived} />
        <FeedbackDisplay analysis={analysis} />
      </div>
    </div>
  );
}

export default App;