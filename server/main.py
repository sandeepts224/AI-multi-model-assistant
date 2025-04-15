import os
import base64
import asyncio
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File, Form
from fastapi.responses import JSONResponse
from google import genai
from google.genai import types
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
MODEL_ID = "gemini-2.0-flash-lite"

def generate_response(prompt: str) -> str:
    """Synchronous function that generates a response using the Gemini API."""
    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=prompt)]
        )
    ]
    generate_content_config = types.GenerateContentConfig(
        response_mime_type="text/plain",
    )
    response_text = ""
    for chunk in client.models.generate_content_stream(
        model=MODEL_ID,
        contents=contents,
        config=generate_content_config,
    ):
        response_text += chunk.text
    return response_text


@app.post("/analyze")
async def analyze_combined(
    file: UploadFile = File(...),
    previous_analysis: str = Form("")
):
    """
    Accepts a combined screen recording (video) with audio from the browser.
    The recording is expected in WebM format and is processed in memory.
    The file is base64-encoded and sent entirely in a single API call.
    """
    try:
        if not file.content_type.startswith("video/") and not file.content_type.startswith("audio/"):
            raise HTTPException(status_code=400, detail="Invalid file type. A combined recording is required.")
    
        # Read the entire file
        file_bytes = await file.read()
        file_base64 = base64.b64encode(file_bytes).decode("utf-8")

        # Define system and user messages
        system_message = (
            "You are an AI troubleshoot assistant. Your task is to analyze the provided screen and audio recording "
            "and listen to what the user is saying and refer to the video content."
        )

        user_message = (
            f"I need help on something I am working on. Refer to the video content and listen to the audio and help me. "
            "Return only a clear, concise answer. "
            f"Recording (base64, truncated): {file_base64}..."
        )

        # Generate the response
        response_text = generate_response(system_message + user_message)

        return JSONResponse(content={"success": True, "analysis": response_text})
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))