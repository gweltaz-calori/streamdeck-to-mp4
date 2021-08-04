const { ipcRenderer } = require("electron");
const VERSION_STATUS = require("./enums");

let $progress = document.querySelector(".progress-text");
let $progressInner = document.querySelector(".progress-inner");
let $group = document.querySelector(".group");
let $groupYtb = document.querySelector(".group-ytb");
let $groupVersion = document.querySelector(".group-version");
let $progressVersion = document.querySelector(".progress-text-version");
let $progressInnerVersion = document.querySelector(".progress-inner-version");
let $downloading = document.querySelector(".downloading");

ipcRenderer.on("progress", (evt, value) => {
  $progress.textContent = value + "%";
  $progressInner.style.width = value + "%";
});

ipcRenderer.on("ev", (e, message) => {
  console.log(message);
});

ipcRenderer.on("version-status", (e, status) => {
  if (status == VERSION_STATUS.UP_TO_DATE) {
    $groupVersion.style.display = "none";
    $group.style.display = "flex";
  } else {
    $groupYtb.style.display = "flex";
    $groupVersion.style.display = "none";
  }
});

ipcRenderer.on("version-progress", (e, value) => {
  $progressVersion.textContent = value + "%";
  $progressInnerVersion.style.width = value + "%";
});

ipcRenderer.on("ytb-updated", () => {
  $group.style.display = "flex";
  $groupYtb.style.display = "none";
});

ipcRenderer.on("downloading-audio", () => {
  $downloading.textContent = "Downloading Audio";
});
