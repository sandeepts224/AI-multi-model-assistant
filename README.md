# Multi-Model Assistant

Multi-Model Assistant is a full-stack application that combines a React-based frontend with a FastAPI backend. The app allows users to share their screen, record sessions with picture-in-picture (PiP) functionality, and analyze data using the backend.

## Features

- **Screen Sharing & Recording:**  
  Start and stop screen sharing separately from recording. Recording is only enabled when screen sharing is active.
- **Picture-in-Picture Support:**  
  The app uses Picture-in-Picture mode to display controls on a separate window that remains in sync with the main application.
- **Real-time Analysis:**  
  Chunks of recorded data are periodically uploaded to a FastAPI backend for analysis.
- **Automated Deployment:**  
  The React frontend can be deployed to GitHub Pages. The entire application can be containerized and deployed using Docker.
