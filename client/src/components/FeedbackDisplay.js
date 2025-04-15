import React from "react";

const FeedbackDisplay = ({ sessions }) => {
  return (
    <div className="max-w-4xl mx-auto my-8 p-6 bg-gray-800 rounded-lg shadow-xl">
      <div className="bg-gray-700 p-4 rounded-t-lg">
        <h2 className="text-2xl font-bold text-white">Analysis Results</h2>
      </div>
      <div className="p-4 space-y-4">
        {sessions.length > 0 ? (
          sessions.map((session, index) => (
            <div
              key={index}
              className="p-4 bg-gray-700 rounded-lg shadow-md text-gray-200 whitespace-pre-wrap"
            >
              {session}
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic">No analysis available yet.</p>
        )}
      </div>
    </div>
  );
};

export default FeedbackDisplay;