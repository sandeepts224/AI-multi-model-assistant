from google import genai
from google.genai.types import LiveConnectConfig, HttpOptions, Modality
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

PROJECT_ID = "[your-project-id]" 
if not PROJECT_ID or PROJECT_ID == "[your-project-id]":
    PROJECT_ID = str(os.environ.get("GOOGLE_CLOUD_PROJECT"))

LOCATION = os.environ.get("GOOGLE_CLOUD_REGION", "us-central1")
client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)
MODEL_ID = "gemini-2.0-flash-exp"

async def test():
    async with client.aio.live.connect(
        model=MODEL_ID,
        config=LiveConnectConfig(response_modalities=[Modality.TEXT]),
    ) as session:
        text_input = "Hello? Gemini, are you there?"
        print("> ", text_input, "\n")
        await session.send(input=text_input, end_of_turn=True)

        response = []

        async for message in session.receive():
            if message.text:
                response.append(message.text)

        print("".join(response))
# Example output:
# >  Hello? Gemini, are you there?

# Yes, I'm here. What would you like to talk about?

asyncio.run(test())