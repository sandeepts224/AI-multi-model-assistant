from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Optional
import os
import base64
from google import genai
from google.genai.types import LiveConnectConfig, Modality
from dotenv import load_dotenv

load_dotenv()

PROJECT_ID = "[your-project-id]" 
if not PROJECT_ID or PROJECT_ID == "[your-project-id]":
    PROJECT_ID = str(os.environ.get("GOOGLE_CLOUD_PROJECT"))

LOCATION = os.environ.get("GOOGLE_CLOUD_REGION", "us-central1")
client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)
MODEL_ID = "gemini-2.0-flash-exp"

app = FastAPI()

class AnalyzeRequest(BaseModel):
    audioBlob: Optional[str] = None
    screenBlob: Optional[str] = None
    previousAnalysis: Optional[str] = None

@app.post("/api/analyze")
async def analyze_media(data: AnalyzeRequest):
    if not data.audioBlob and not data.screenBlob:
        raise HTTPException(status_code=400, detail="No audioBlob or screenBlob provided.")
    try:
        # Determine media type and decode file bytes
        if data.audioBlob:
            file_bytes = base64.b64decode(data.audioBlob)
            temp_filename = "temp_audiofile.mp3"
            media_type = "audio"
        else:
            file_bytes = base64.b64decode(data.screenBlob)
            temp_filename = "temp_videofile.mp4"
            media_type = "video"

        with open(temp_filename, "wb") as f:
            f.write(file_bytes)

        prompt = (
            f"Describe this {media_type} file.\n\n"
            f"Previous analysis: {data.previousAnalysis}\n\n"
            f"File: {temp_filename}"
        )

        async with client.aio.live.connect(
            model=MODEL_ID,
            config=LiveConnectConfig(response_modalities=[Modality.TEXT]),
        ) as session:
            await session.send(input=prompt, end_of_turn=True)
            response_lines = []
            async for message in session.receive():
                if message.text:
                    response_lines.append(message.text)
            final_response = "".join(response_lines)

        return {
            "success": True,
            "geminiAnalysis": final_response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/analyze")
async def analyze_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        async with client.aio.live.connect(
            model=MODEL_ID,
            config=LiveConnectConfig(response_modalities=[Modality.TEXT]),
        ) as session:
            while True:
                data = await websocket.receive_json()
                await websocket.send_json({"test": "response received"})
                
                # Expected data: { "mediaType": "audio" | "video", "chunk": "<base64_chunk>", "previousAnalysis": "..." }
                media_type = data.get("mediaType")
                previous_analysis = data.get("previousAnalysis", "")
                chunk_base64 = data.get("chunk")

                if not media_type or not chunk_base64:
                    await websocket.send_json({"error": "Invalid data"})
                    continue
                
                # Determine the subdirectory based on media type
                sub_dir = "audio" if media_type == "audio" else "video"
                file_dir = os.path.join("temp_files", sub_dir)

                # Create the directory if it doesn't exist
                if not os.path.exists(file_dir):
                    os.makedirs(file_dir)

                filename = "temp_audio_chunk.mp3" if media_type == "audio" else "temp_video_chunk.mp4"
                filepath = os.path.join(file_dir, filename)
                file_bytes = base64.b64decode(chunk_base64)
                with open(filepath, "wb") as f:
                    f.write(file_bytes)

                prompt = (
                    f"Summarize the content of this {media_type} recording. "
                    "Return only a brief, clear summary and nothing else. "
                    "Do not include any greetings, instructions, or commentary—only the summary is needed. "
                    f"Previous analysis: {previous_analysis}\n\n"
                    f"File: {filename}\n"
                    "chunk: " + chunk_base64 + f"\n\n"
                )

                await session.send(input=prompt, end_of_turn=True)
                response_lines = []
                async for message in session.receive():
                    if message.text:
                        response_lines.append(message.text)
                final_response = "".join(response_lines)
                await websocket.send_json({
                   "geminiAnalysis": final_response,
                    "mediaType": media_type
                })
    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        await websocket.send_json({"error": str(e)})