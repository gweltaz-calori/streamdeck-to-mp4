// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, clipboard } = require("electron");
const { exec, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
var https = require("follow-redirects").https;
const VERSION_STATUS = require("./enums");

let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 350,
    height: 200,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  mainWindow.loadFile("index.html");
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  let ytbPath = path.join(__dirname, "youtube-dl", "youtube-dl.exe");
  let ffmpegPath = path.join(__dirname, "ffmpeg", "ffmpeg.exe");

  if (__dirname.includes("app.asar")) {
    ytbPath = path.join(
      __dirname.replace("app.asar", "app.asar.unpacked"),
      "youtube-dl",
      "youtube-dl.exe"
    );
    ffmpegPath = path.join(
      __dirname.replace("app.asar", "app.asar.unpacked"),
      "ffmpeg",
      "ffmpeg.exe"
    );
  }

  mainWindow.webContents.send("checking-version");
  https.get("https://rg3.github.io/youtube-dl/update/versions.json", (res) => {
    let rawData = "";
    res.on("data", (chunk) => {
      rawData += chunk;
    });
    res.on("end", (_) => {
      let lastVersion = JSON.parse(rawData)["latest"].trim();
      exec(`${ytbPath} --version`, (err, stdout) => {
        stdout = stdout.trim();

        if (lastVersion !== stdout) {
          mainWindow.webContents.send(
            "version-status",
            VERSION_STATUS.NEED_UPDATE
          );
          const file = fs.createWriteStream(ytbPath);
          https.get(`https://yt-dl.org/latest/youtube-dl.exe`, (response) => {
            let total = parseInt(response.headers["content-length"]);
            let received = 0;

            response
              .on("data", (chunk) => {
                received += chunk.length;
                mainWindow.webContents.send(
                  "version-progress",
                  ((received * 100) / total).toFixed(2)
                );
              })
              .pipe(file)
              .on("close", () => {
                mainWindow.webContents.send("ytb-updated");
                download();
              });
          });
        } else {
          mainWindow.webContents.send(
            "version-status",
            VERSION_STATUS.UP_TO_DATE
          );
          download();
        }
      });
    });
  });

  let clipboardValue = clipboard.readText();

  function download() {
    const ytb = spawn(ytbPath, [
      "-f",
      "bestvideo+bestaudio/best",
      clipboardValue,
      "--ffmpeg-location",
      ffmpegPath,
      "--merge-output-format",
      "mp4",
      "-o",
      `${process.env.USERPROFILE}\\Downloads\\%(title)s.%(ext)s`,
    ]);
    ytb.stdout.on("data", (data) => {
      let stringifyData = data.toString();
      if (stringifyData.includes("%")) {
        const regex = /([0-9.]+)%/;
        const progress = regex.exec(stringifyData)[1];
        if (progress == 100) {
          mainWindow.webContents.send("downloading-audio");
        }
        mainWindow.webContents.send("progress", progress);
      }
    });
    ytb.stderr.on("data", (data) => {});
    ytb.on("error", (error) => {
      console.log(error);
      app.quit();
    });

    ytb.on("close", (code) => {
      app.quit();
    });
  }
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
