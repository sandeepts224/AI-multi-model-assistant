import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from "react-toastify";

const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);
root.render(
  <React.StrictMode>
    <App />
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      {`
        tailwind.config = {
          theme: {
            extend: {
              colors: {
                primary: '#4F46E5',
                secondary: '#3B82F6',
                accent: '#FBBF24',
              },
            },
          },
        }
      `}
    </script>
  </React.StrictMode>
);