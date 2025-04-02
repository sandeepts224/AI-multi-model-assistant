import React, { useState, useRef } from "react";

const Recorder = ({ onAnalysisReceived }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("");
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const startRecording = async () => {
    setStatus("Requesting microphone access...");
    try {
      // Request microphone access
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStatus("Requesting screen share...");
      // Prompt the user for screen sharing
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      // Combine audio and screen streams into one MediaStream
      const combinedStream = new MediaStream([
        ...audioStream.getTracks(),
        ...screenStream.getTracks(),
      ]);

      // Create a MediaRecorder for the combined stream
      mediaRecorderRef.current = new MediaRecorder(combinedStream);
      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        setStatus("Recording stopped. Processing...");
        // Combine all chunks into one Blob (WebM format)
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        await uploadRecording(blob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setStatus("Recording started...");
    } catch (error) {
      console.error("Error starting recording:", error);
      setStatus("Error starting recording: " + error.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadRecording = async (blob) => {
    setStatus("Uploading recording for analysis...");
    try {
      const formData = new FormData();
      formData.append("file", blob, "recording.webm");
      formData.append("previous_analysis", "");

      const response = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Upload failed: " + response.statusText);
      }
      const data = await response.json();
      setStatus("Analysis complete.");
      if (onAnalysisReceived) {
        onAnalysisReceived(data.analysis);
      }
    } catch (error) {
      console.error("Error uploading recording:", error);
      setStatus("Error uploading recording: " + error.message);
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded shadow">
      <h2 className="text-2xl font-bold mb-2">Screen & Audio Recorder</h2>
      <p className="mb-4">{status}</p>
      {isRecording ? (
        <button
          className="px-4 py-2 bg-red-500 text-white rounded"
          onClick={stopRecording}
        >
          Stop Recording
        </button>
      ) : (
        <button
          className="px-4 py-2 bg-green-500 text-white rounded"
          onClick={startRecording}
        >
          Start Recording
        </button>
      )}
    </div>
  );
};

export default Recorder;