const socket = io();

const display = document.getElementById("display");
const reelsContainer = document.getElementById("reels");
const message = document.getElementById("message");

const STRIP_COPIES = 3;
const reelViews = [];
let symbolOrder = [];
let symbolIndexByKey = new Map();
let lastStatus = null;
let spinTransitionMs = 300;

function buildSymbolIndex(order) {
  symbolIndexByKey = new Map(order.map((item, index) => [item.key, index]));
}

function createReelView(index) {
  const reelEl = document.createElement("article");
  reelEl.className = "reel";
  reelEl.dataset.index = String(index);

  const windowEl = document.createElement("div");
  windowEl.className = "reel-window";

  const strip = document.createElement("div");
  strip.className = "reel-strip";

  windowEl.appendChild(strip);
  reelEl.appendChild(windowEl);
  reelsContainer.appendChild(reelEl);

  return {
    reelEl,
    strip,
    isAnimating: false,
  };
}

function ensureReels(count) {
  while (reelViews.length < count) {
    reelViews.push(createReelView(reelViews.length));
  }
}

function buildStrip(strip) {
  strip.innerHTML = "";

  const loop = Array.from({ length: STRIP_COPIES }, () => symbolOrder).flat();
  loop.forEach((item) => {
    const cell = document.createElement("div");
    cell.className = "reel-cell";

    const img = document.createElement("img");
    img.src = item.imageUrl;
    img.alt = "";
    img.className = "symbol-image";
    img.draggable = false;

    cell.appendChild(img);
    strip.appendChild(cell);
  });
}

function setStripOffset(view, offset) {
  view.strip.style.transform = `translate3d(0, calc(var(--reel-cell-height) * ${-offset}), 0)`;
}

function startSpinAnimation(view) {
  view.strip.style.animation = "none";
  setStripOffset(view, symbolOrder.length);
  void view.strip.offsetWidth;
  view.strip.style.removeProperty("animation");
  view.strip.style.removeProperty("transform");
  view.isAnimating = true;
}

function stopSpinAnimation(view) {
  view.strip.style.animation = "none";
  view.isAnimating = false;
}

function lockReelPosition(view, symbolIndex) {
  stopSpinAnimation(view);
  setStripOffset(view, symbolOrder.length + symbolIndex);
}

function updateReelView(view, reel, status) {
  const { reelEl } = view;
  const symbolIndex = symbolIndexByKey.get(reel.symbol) ?? 0;
  const shouldSpin = !reel.locked && status === "spinning";

  reelEl.classList.toggle("is-locked", reel.locked);
  reelEl.classList.toggle("is-correct", Boolean(reel.locked && reel.stop?.correct));
  reelEl.classList.toggle("is-wrong", Boolean(reel.locked && reel.stop && !reel.stop.correct));
  reelEl.classList.toggle("is-spinning", shouldSpin);

  if (reel.locked) {
    lockReelPosition(view, symbolIndex);
    return;
  }

  if (shouldSpin) {
    if (!view.isAnimating) {
      startSpinAnimation(view);
    }
    return;
  }

  stopSpinAnimation(view);
}

function resetReelViews() {
  reelViews.forEach((view) => {
    stopSpinAnimation(view);
    view.isAnimating = false;
  });
}

function renderReels(state) {
  if (symbolOrder.length === 0) {
    symbolOrder = state.targetSequence;
    buildSymbolIndex(symbolOrder);
  }

  ensureReels(state.reels.length);

  reelViews.forEach((view, index) => {
    const reel = state.reels[index];
    if (!view.strip.childElementCount) {
      buildStrip(view.strip);
    }
    updateReelView(view, reel, state.status);
  });
}

function setStatusClass(status) {
  display.classList.remove("is-idle", "is-spinning", "is-success", "is-failed");
  display.classList.add(`is-${status}`);
}

function render(state) {
  spinTransitionMs = state.tickMs ?? 300;
  const symbolCount = state.targetSequence?.length || symbolOrder.length || 4;
  document.documentElement.style.setProperty("--tick-ms", `${spinTransitionMs}ms`);
  document.documentElement.style.setProperty("--reel-cycle-duration", `${spinTransitionMs * symbolCount}ms`);

  if (lastStatus !== "spinning" && state.status === "spinning" && state.stops.every((stop) => !stop)) {
    resetReelViews();
  }
  lastStatus = state.status;

  message.textContent = state.message;
  setStatusClass(state.status);
  renderReels(state);
}

socket.on("game:state", render);
socket.emit("game:requestState");
