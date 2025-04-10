# Multi-Model Assistant

Multi-Model Assistant is a full-stack application that combines a React-based frontend with a FastAPI backend. The app allows users to share their screen, record sessions with picture-in-picture (PiP) functionality, and analyze data using the backend.

## Table of Contents

- [Features](#features)
- [Directory Structure](#directory-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Local Development](#local-development)
- [Deployment](#deployment)
  - [Deploying the React App to GitHub Pages](#deploying-the-react-app-to-github-pages)
  - [Container Deployment with Docker](#container-deployment-with-docker)
  - [Automated Deployment with GitHub Actions](#automated-deployment-with-github-actions)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Screen Sharing & Recording:**  
  Start and stop screen sharing separately from recording. Recording is only enabled when screen sharing is active.
- **Picture-in-Picture Support:**  
  The app uses Picture-in-Picture mode to display controls on a separate window that remains in sync with the main application.
- **Real-time Analysis:**  
  Chunks of recorded data are periodically uploaded to a FastAPI backend for analysis.
- **Automated Deployment:**  
  The React frontend can be deployed to GitHub Pages. The entire application can be containerized and deployed using Docker.

## Directory Structure

.
├── client               # React frontend application
│   ├── public
│   ├── src
│   │   ├── components
│   │   │   ├── Recorder.js
│   │   │   └── pip.js
│   │   └── …
│   ├── package.json
│   └── Dockerfile       # For containerizing the React app
├── server               # FastAPI backend application
│   ├── main.py          # FastAPI app entry point
│   ├── requirements.txt
│   └── Dockerfile       # For containerizing the backend server
├── docker-compose.yml   # Orchestrates both the client and server containers
└── .github
└── workflows
├── deploy-gh-pages.yml  # GitHub Actions workflow for deploying the React app to GitHub Pages
└── [other-workflows].yml

## Prerequisites

- Node.js (v16 or later)
- Python 3.9 or later
- Docker (optional, if you plan to containerize the app)
- GitHub account (for repository hosting and GitHub Actions)
- An Azure account if deploying to Azure (optional)

## Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/your_username/multi-model-assistant.git
   cd multi-model-assistant

	2.	Install Frontend Dependencies:

cd client
npm install


	3.	Install Backend Dependencies:

cd ../server
pip install -r requirements.txt



Local Development

Frontend (React)
	1.	Start the development server:

cd client
npm start

The app will be available at http://localhost:3000.

Backend (FastAPI)
	1.	Start the FastAPI server:

cd server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

The API will be available at http://localhost:8000.

Deployment

Deploying the React App to GitHub Pages

A GitHub Actions workflow is provided to build the React app and deploy it to GitHub Pages.

Make sure your package.json includes the "homepage" field, for example:

"homepage": "https://your_username.github.io/your_repo_name"

The workflow file .github/workflows/deploy-gh-pages.yml builds the app and deploys the build folder to GitHub Pages.

Container Deployment with Docker

Both the client and server include Dockerfiles. You can build and run them using Docker Compose.
	1.	Build and Run Containers:

docker-compose up --build

This will start the frontend on port 80 and the backend on port 8000 (or as configured).

Automated Deployment with GitHub Actions

GitHub Actions workflows can be configured to automatically build and deploy your application whenever you push changes. For example:
	•	For GitHub Pages:
The workflow in .github/workflows/deploy-gh-pages.yml will build the React app and deploy it to the gh-pages branch.
	•	For Docker-based Deployment:
You can set up a workflow to build Docker images and push them to a registry (such as Docker Hub or Azure Container Registry), and then deploy them to your server or cloud service.

Contributing

Contributions are welcome! Please fork the repository, make your changes, and open a pull request. For major changes, please open an issue first to discuss what you would like to change.

License

This project is licensed under the MIT License. See the LICENSE file for details.
