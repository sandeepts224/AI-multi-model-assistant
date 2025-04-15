import React, { useState } from "react";
import Recorder from "./components/Recorder";
import FeedbackDisplay from "./components/FeedbackDisplay";

function App() {
  const [sessions, setSessions] = useState([]); // Store analysis results for each session

  const handleAnalysisReceived = (newAnalysis) => {
    // Add the new analysis to the top of the sessions list
    setSessions((prevSessions) => [newAnalysis, ...prevSessions]);

    // Send the new analysis to the PiP window if available
    if (window.pipWindow) {
      window.pipWindow.postMessage({ analysis: newAnalysis }, "*");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <h1 className="text-4xl font-extrabold mb-10 border-b-2 border-blue-500 pb-2">
        AI Assistant
      </h1>
      <div className="w-full max-w-3xl space-y-8">
        <Recorder onAnalysisReceived={handleAnalysisReceived} />
        <FeedbackDisplay sessions={sessions} />
      </div>
    </div>
  );
}

export default App;