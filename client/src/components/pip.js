let canvas = document.createElement("canvas");
canvas.width = canvas.height = 150;

let pipWindow = null;
let video = null;

export async function enterPip() {  
  if (pipWindow && !pipWindow.closed) {
    return;
  }

  const parentWindow = window;
  if ("documentPictureInPicture" in window) {
    try {
      pipWindow = await window.documentPictureInPicture.requestWindow({
        width: canvas.width,
        height: canvas.height,
      });

      [...document.styleSheets].forEach((styleSheet) => {
        try {
          const cssRules = [...styleSheet.cssRules]
            .map((r) => r.cssText)
            .join("");
          const style = pipWindow.document.createElement("style");
          style.textContent = cssRules;
          pipWindow.document.head.appendChild(style);
        } catch {
          const link = pipWindow.document.createElement("link");
          link.rel = "stylesheet";
          link.href = styleSheet.href;
          pipWindow.document.head.appendChild(link);
        }
      });

      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      pipWindow.document.body.appendChild(canvas);

      let stopRecBtn = pipWindow.document.getElementById("pipStopBtn");
      if (!stopRecBtn) {
        stopRecBtn = pipWindow.document.createElement("button");
        stopRecBtn.id = "pipStopBtn";
        pipWindow.document.body.appendChild(stopRecBtn);
      }

      const updatePipButtonState = () => {
        const startBtn = parentWindow.document.getElementById("startRecordingButton");
        const stopBtn = parentWindow.document.getElementById("stopRecordingButton");
        const isRecordingOnParent = stopBtn && stopBtn.offsetParent !== null;
        const currentBtn = isRecordingOnParent ? stopBtn : startBtn;
        if (currentBtn) {
          stopRecBtn.className = currentBtn.className;
          stopRecBtn.innerHTML = currentBtn.innerHTML;
        }
        // Center the button in the 150x150 PiP window
        stopRecBtn.style.position = "absolute";
        stopRecBtn.style.top = "50%";
        stopRecBtn.style.left = "50%";
        stopRecBtn.style.transform = "translate(-50%, -50%)";
      };

      updatePipButtonState();

      // Update the PiP button state periodically so it remains in sync
      const pipStateInterval = setInterval(updatePipButtonState, 300);

      // When the PiP button is clicked, simulate a click on the corresponding parent's button.
      stopRecBtn.onclick = () => {
        const startBtn = parentWindow.document.getElementById("startRecordingButton");
        const stopBtn = parentWindow.document.getElementById("stopRecordingButton");
        const isRecordingOnParent = stopBtn && stopBtn.offsetParent !== null;
        const currentBtn = isRecordingOnParent ? stopBtn : startBtn;
        if (currentBtn) {
          currentBtn.click();
          // Allow parent's state change to propagate, then update
          setTimeout(updatePipButtonState, 0);
        }
      };

      // When the PiP window is closed manually, clear interval and clean up
      pipWindow.addEventListener(
        "pagehide",
        () => {
          clearInterval(pipStateInterval);
          exitPip();
          pipWindow = null;
        },
        { once: true }
      );
      pipWindow.addEventListener(
        "unload",
        () => {
          clearInterval(pipStateInterval);
          exitPip();
          pipWindow = null;
        },
        { once: true }
      );
    } catch (err) {
      console.warn("Document PiP failed:", err);
    }
  } else {
    // Fallback for browsers without Document PiP support
    if (!video) {
      video = document.createElement("video");
      video.id = "pipFallbackVideo";
      video.style.display = "none";
      document.body.appendChild(video);
      document.body.appendChild(canvas);
    }
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        const stream = canvas.captureStream();
        video.srcObject = stream;
        await video.play();
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.warn("Video PiP failed:", err);
    }
  }
}

export function exitPip() {
  if (pipWindow) {
    pipWindow.close();
    pipWindow = null;
  } else if (document.pictureInPictureElement) {
    document.exitPictureInPicture().catch((err) => {
      console.warn("Exit PiP failed:", err);
    });
  }
}

export function initPip() {
  const btn = document.getElementById("pipStopBtn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    if (pipWindow || document.pictureInPictureElement) {
      exitPip();
    } else {
      await enterPip();
    }
  });
}