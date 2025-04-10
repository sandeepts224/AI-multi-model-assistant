# Use the official lightweight Python image.
FROM python:3.9-slim

# Set the working directory to /app.
WORKDIR /app

# Copy only requirements.txt first for caching purposes.
COPY requirements.txt .

# Upgrade pip and install Python dependencies.
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copy the .env file if you want to include your environment variables.
# WARNING: Only do this if you’re sure that your .env file isn’t exposing sensitive credentials.
COPY .env .

# Copy the rest of the FastAPI application code.
COPY . .

# Expose port 8000 (or the port from the environment variable).
EXPOSE 8000

# Start the FastAPI application using uvicorn.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]