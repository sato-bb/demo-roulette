const socket = io();

const display = document.getElementById("display");
const reelsContainer = document.getElementById("reels");
const nextTarget = document.getElementById("nextTarget");
const message = document.getElementById("message");

function renderSymbolImage(container, imageUrl, className) {
  container.innerHTML = "";

  if (!imageUrl) {
    return;
  }

  const img = document.createElement("img");
  img.src = imageUrl;
  img.alt = "";
  img.className = className;
  img.draggable = false;
  container.appendChild(img);
}

function renderReels(state) {
  reelsContainer.innerHTML = "";

  state.reels.forEach((reel, index) => {
    const reelEl = document.createElement("article");
    reelEl.className = "reel";

    if (reel.isCurrent) reelEl.classList.add("is-current");
    if (reel.locked && reel.stop?.correct) reelEl.classList.add("is-correct");
    if (reel.locked && reel.stop && !reel.stop.correct) reelEl.classList.add("is-wrong");
    if (reel.locked) reelEl.classList.add("is-locked");
    if (!reel.locked && state.status === "spinning") reelEl.classList.add("is-spinning");

    const step = document.createElement("p");
    step.className = "reel-step";
    step.textContent = `${index + 1}`;

    const target = document.createElement("div");
    target.className = "reel-target";
    renderSymbolImage(target, reel.targetImageUrl, "symbol-image symbol-image--small");

    const windowEl = document.createElement("div");
    windowEl.className = "reel-window";

    const symbol = document.createElement("div");
    symbol.className = "reel-symbol";
    renderSymbolImage(symbol, reel.imageUrl, "symbol-image symbol-image--large");

    windowEl.appendChild(symbol);

    const status = document.createElement("p");
    status.className = "reel-status";
    if (reel.locked) {
      status.textContent = reel.stop?.correct ? "OK" : "NG";
    } else if (reel.isCurrent) {
      status.textContent = "STOP";
    } else {
      status.textContent = "—";
    }

    reelEl.append(step, target, windowEl, status);
    reelsContainer.appendChild(reelEl);
  });
}

function setStatusClass(status) {
  display.classList.remove("is-idle", "is-spinning", "is-success", "is-failed");
  display.classList.add(`is-${status}`);
}

function render(state) {
  renderSymbolImage(nextTarget, state.nextTargetImageUrl, "symbol-image symbol-image--target");
  message.textContent = state.message;
  setStatusClass(state.status);
  renderReels(state);
}

socket.on("game:state", render);
socket.emit("game:requestState");
