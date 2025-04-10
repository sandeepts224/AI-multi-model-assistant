# Use the official lightweight Python image.
FROM python:3.13.3-slim

# Set the working directory to /app.
WORKDIR /app

# Copy only requirements.txt first for caching purposes.
COPY requirements.txt .

# Upgrade pip and install Python dependencies.
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copy the rest of the FastAPI application code.
COPY gen-lang-client-0669243690-4211d9c8bdd8.json .
COPY . .

# Expose port 8000 (or use the environment variable)
EXPOSE 8000

# Start the FastAPI application using uvicorn.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]