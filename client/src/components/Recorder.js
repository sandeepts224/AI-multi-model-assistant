import React, { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { initPip, enterPip as pipEnter } from "./pip";

const Recorder = ({ onAnalysisReceived }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [prevAnalysis, setPrevAnalysis] = useState("");
  const recordingActiveRef = useRef(false);
  let session = false;

  const enterPip = useCallback(async () => {
    await pipEnter();
  }, []);

  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);
      toast.dismiss("screenShare");
      toast.success("Screen sharing started.", { toastId: "screenShareStarted" });
    } catch (error) {
      console.error("Error starting screen sharing:", error);
      toast.error("Error starting screen sharing: " + error.message);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
      toast.info("Screen sharing stopped.", { toastId: "screenShareStopped" });
      session = false;
    }
  };

  const startRecording = async () => {
    try {
      if (!isScreenSharing) {
        toast.error("Please start screen sharing first.");
        return;
      }
      // Request microphone access
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = audioStream;

      // Combine audio stream with the already active screen share stream
      const combinedStream = new MediaStream([
        ...audioStream.getTracks(),
        ...screenStreamRef.current.getTracks(),
      ]);

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
      recordingActiveRef.current = true;
      toast.dismiss(["micAccess", "screenShare"]);
      toast.success("Recording started.", { toastId: "recordingStarted" });

      if(!session){
        session = true;
        enterPip();
      }
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Error starting recording: " + error.message);
    }
  };

  const stopRecording = useCallback(() => {
    recordingActiveRef.current = false;
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }
      toast.info("Recording stopped.", { toastId: "recordingStopped" });
    }
  }, [isRecording]);

  useEffect(() => {
    initPip();
  }, []);

  const uploadChunk = async (chunkBlob) => {
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
        const updated = prev ? prev + "\n" + data.analysis : data.analysis;
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
      <div className="flex justify-center mb-6 space-x-4">
        {isScreenSharing ? (
          <button
            id="stopScreenShareButton"
            onClick={stopScreenShare}
            className="h-14 w-14 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-all duration-300 shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
            </svg>
          </button>
        ) : (
          <button
            id="startScreenShareButton"
            onClick={startScreenShare}
            className="h-14 w-14 bg-gray-600 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-all duration-300 shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
            </svg>
          </button>
        )}

        {isRecording ? (
          <button
            id="stopRecordingButton"
            onClick={stopRecording}
            className="h-14 w-14 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-all duration-300 shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </button>
        ) : (
          <button
            id="startRecordingButton"
            onClick={startRecording}
            className="h-14 w-14 bg-gray-600 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-all duration-300 shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
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