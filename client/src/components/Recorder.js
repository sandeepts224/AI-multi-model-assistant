import React, { useState, useRef } from "react";
import { toast } from "react-toastify";

const Recorder = ({ onAnalysisReceived }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [prevAnalysis, setPrevAnalysis] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const startRecording = async () => {
    try {
      // Request microphone access
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = audioStream;

      // Request screen sharing
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;

      // Combine audio and screen streams
      const combinedStream = new MediaStream([
        ...audioStream.getTracks(),
        ...screenStream.getTracks(),
      ]);

      // Create a MediaRecorder for the combined stream with a 5-second timeslice
      mediaRecorderRef.current = new MediaRecorder(combinedStream, {
        mimeType: "video/webm;codecs=vp8,opus",
      });

      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0) {
          await uploadChunk(event.data);
        }
      };

      mediaRecorderRef.current.start(5000); // 5-second timeslice
      setIsRecording(true);
      toast.dismiss(["micAccess", "screenShare"]);
      toast.success("Recording started.", { toastId: "recordingStarted" });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Error starting recording: " + error.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop all audio tracks
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      // Stop all screen share tracks
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      toast.info("Recording stopped.", { toastId: "recordingStopped" });
    }
  };

  const uploadChunk = async (chunkBlob) => {
    toast.info("Analysing...", { toastId: "uploadingChunk" });
    try {
      const formData = new FormData();
      formData.append("file", chunkBlob, "chunk.webm");
      formData.append("previous_analysis", prevAnalysis);

      const response = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Upload failed: " + response.statusText);
      }
      const data = await response.json();
      toast.success("Analysis updated!", { toastId: "chunkAnalysisComplete" });
      setPrevAnalysis((prev) => {
        const updated = prev + "\n" + data.analysis;
        onAnalysisReceived(updated);
        return updated;
      });
    } catch (error) {
      toast.error("Error uploading chunk: " + error.message, { toastId: "uploadError" });
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8 bg-gray-800 rounded-lg shadow-2xl">
      <h2 className="text-4xl font-extrabold text-center mb-6 text-white">Live Recorder</h2>
      <div className="flex justify-center mb-6">
        {isRecording ? (
          <button
            onClick={stopRecording}
            className="h-14 w-14 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-all duration-300 shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </button>
        ) : (
          <button
            onClick={startRecording}
            className="h-14 w-14 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-all duration-300 shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
            </svg>

          </button>
        )}
      </div>
      {isRecording && (
        <div className="text-center">
          <p className="text-sm text-gray-300">Recording in progress...</p>
        </div>
      )}
    </div>
  );
};

export default Recorder;