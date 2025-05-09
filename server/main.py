import os
import asyncio
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
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

client = genai.Client(
    vertexai=True,
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location=os.getenv("GOOGLE_CLOUD_LOCATION")
)

MODEL_ID = "gemini-2.0-flash-lite"

def generate_response(
    system_message: str,
    user_message: str,
    audio_bytes: bytes = None,
    video_bytes: bytes = None
) -> str:
    """
    Synchronous function that generates a response using the Gemini API.
    Accepts both audio and video recordings as bytes, and includes them in the prompt.
    """
    if audio_bytes is None:
        return "Empty audio"
    if video_bytes is None:
        return "Empty video"
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=user_message),
                # Include audio recording
                types.Part(
                    inline_data=types.Blob(data=audio_bytes, mime_type='audio/webm')
                ),
                # Include video recording
                types.Part(
                    inline_data=types.Blob(data=video_bytes, mime_type='video/webm')
                )
            ]
        )
    ]
    generate_content_config = types.GenerateContentConfig(
        response_mime_type="text/plain",
        system_instruction=system_message
    )
    response_text = ""
    for chunk in client.models.generate_content_stream(
        model=MODEL_ID,
        contents=contents,
        config=generate_content_config
    ):
        response_text += chunk.text
    return response_text


@app.post("/analyze")
async def analyze_combined(
    audio_file: UploadFile = File(...),
    video_file: UploadFile = File(...),
    previous_analysis: str = Form("")
):
    """
    Accepts a combined screen recording (video) with audio from the browser.
    The recording is expected in WebM format and is processed in memory.
    The file is base64-encoded and sent entirely in a single API call.
    """
    try:
        # Read the entire file
        audio_bytes = await audio_file.read()
        video_bytes = await video_file.read()

        system_message = (
            "You are an AI assistant tasked with analyzing screen and audio recordings. "
            "You should carefully interpret both the visual content and spoken audio to generate a comprehensive understanding of the video. "
            "Provide a clear, structured summary, highlighting key points, insights, and any actions or suggestions based on the content. "
            "You may refer to both visual elements (like actions, gestures, or objects on screen) and auditory content (such as dialogue or sounds). "
            "Your response should be concise but cover the essential details that a user would need to understand the content of the recording."
        )

        user_message = (
            f"Please analyze the video recording and provide a detailed summary. "
            f"Include key points from both the visual and audio elements. If relevant, highlight any actions, objects, or spoken information that could provide context. "
            f"Ensure the response is structured and clear, focusing on important aspects like the content’s purpose, main activities, and any potential conclusions. "
            f"Previous analysis: {previous_analysis}\n\n"
        )

        # Validate audio and video
        if not audio_file.content_type.startswith("audio/webm"):
            raise HTTPException(status_code=400, detail="Audio must be 'webm' format.")
        if not video_file.content_type.startswith("video/webm") or len(video_bytes) >= 20 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Video must be 'webm' and under 20MB.")
        # Call generate_response with system_message, user_message, audio, then video
        response_text = await asyncio.get_running_loop().run_in_executor(
            None,
            generate_response,
            system_message,
            user_message,
            audio_bytes,
            video_bytes
        )

        return JSONResponse(content={"success": True, "analysis": response_text})
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))