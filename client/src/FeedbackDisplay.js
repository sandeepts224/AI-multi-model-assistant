import React from "react";

const FeedbackDisplay = ({ analysis }) => {
  return (
    <div className="max-w-4xl mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Analysis Result</h2>
      <p className="whitespace-pre-wrap">
        {analysis || "No analysis available yet."}
      </p>
    </div>
  );
};

export default FeedbackDisplay;