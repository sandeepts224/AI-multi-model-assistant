import React from "react";

const FeedbackDisplay = ({ analysis }) => {
  return (
    <div className="max-w-4xl mx-auto my-8 p-6 bg-gray-800 rounded-lg shadow-xl">
      <div className="bg-gray-700 p-4 rounded-t-lg">
        <h2 className="text-2xl font-bold text-white">Analysis Result</h2>
      </div>
      <div className="p-4">
        {analysis ? (
          <p className="text-gray-200 whitespace-pre-wrap">{analysis}</p>
        ) : (
          <p className="text-gray-500 italic">No analysis available yet.</p>
        )}
      </div>
    </div>
  );
};

export default FeedbackDisplay;