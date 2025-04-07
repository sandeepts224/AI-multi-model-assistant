let canvas = document.createElement("canvas");
canvas.width = canvas.height = 100;

let pipWindow = null;
let video = null;

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const buttonWidth = 120;
  const buttonHeight = 60;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const buttonX = cx - buttonWidth / 2;
  const buttonY = cy - buttonHeight / 2;

  if (x >= buttonX && x <= buttonX + buttonWidth &&
      y >= buttonY && y <= buttonY + buttonHeight) {
    console.log("Button clicked!");
    const mainStopBtn = window.top.document.getElementById("stopRecordingButton");
    if (mainStopBtn) {
      mainStopBtn.click();
    }
  }
});

export async function enterPip() {
  const parentWindow = window;
  if ('documentPictureInPicture' in window) {
    try {
      pipWindow = await window.documentPictureInPicture.requestWindow({
        width: canvas.width,
        height: canvas.height
      });

      [...document.styleSheets].forEach((styleSheet) => {
        try {
          const cssRules = [...styleSheet.cssRules].map(r => r.cssText).join("");
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

      const stopRecBtn = pipWindow.document.createElement("button");
      stopRecBtn.id = "pipStopRecordingButton";
      stopRecBtn.innerHTML = "&#9632;";
      stopRecBtn.className =
        "fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full h-12 w-12 flex items-center justify-center focus:outline-none";
      stopRecBtn.addEventListener("click", () => {
        const mainStopBtn = parentWindow.document.getElementById("stopRecordingButton");
        if (mainStopBtn) {
          mainStopBtn.click();
        }
        parentWindow.focus();
        exitPip();
      });
      pipWindow.document.body.appendChild(stopRecBtn);

      pipWindow.addEventListener("pagehide", () => {
        exitPip();
        pipWindow = null;
      }, { once: true });
      pipWindow.addEventListener("unload", () => {
        exitPip();
        pipWindow = null;
      }, { once: true });
    } catch (err) {
      console.warn("Document PiP failed:", err);
    }
  } else {
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
    document.exitPictureInPicture().catch(err => {
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