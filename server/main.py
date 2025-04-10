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
    allow_credentials=False,
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
    The file is base64-encoded and then split into chunks. For each chunk, a prompt
    is built instructing the model to analyze the events in that chunk, passing along
    previous analysis for context. The responses are combined into a final analysis.
    """
    try:
        if not file.content_type.startswith("video/") and not file.content_type.startswith("audio/"):
            raise HTTPException(status_code=400, detail="Invalid file type. A combined recording is required.")

        file_bytes = await file.read()
        file_base64 = base64.b64encode(file_bytes).decode("utf-8")
        
       # Define chunk size (number of characters)
        CHUNK_SIZE = 4100000
        chunks = [file_base64[i:i+CHUNK_SIZE] for i in range(0, len(file_base64), CHUNK_SIZE)]

        final_analysis = previous_analysis or ""

        for i, chunk in enumerate(chunks, start=1):
            print(f"Processing chunk {i}/{len(chunks)}")
            prompt = (
                f"Summarize the following combined screen and audio recording chunk. "
                "Return only a clear, concise summary of the events occurring in this chunk with no extra commentary. "
                f"Previous analysis: {final_analysis}\n\n"
                f"Chunk (base64, truncated): {chunk}..."
            )
            loop = asyncio.get_running_loop()
            response_text = await loop.run_in_executor(None, generate_response, prompt)
            final_analysis = response_text
        
        return JSONResponse(content={"success": True, "analysis": final_analysis})
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))