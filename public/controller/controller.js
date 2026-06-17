const socket = io();

const RESET_LABEL = "RESET";

const stopButtonsContainer = document.getElementById("stopButtons");
const resetButton = document.getElementById("resetButton");
const controllerBg = document.querySelector(".controller-bg");

const FLOATING_SHAPES = [
  "/img/circle.svg",
  "/img/cross.svg",
  "/img/square.svg",
  "/img/triangle.svg",
];

function createFloatingBackground(container) {
  const shapeCount = Math.round(52);

  for (let index = 0; index < shapeCount; index += 1) {
    const shape = document.createElement("img");
    shape.src = FLOATING_SHAPES[Math.floor(Math.random() * FLOATING_SHAPES.length)];
    shape.alt = "";
    shape.className = "controller-bg__shape";
    shape.draggable = false;

    const size = 20 + Math.random() * 56;
    const left = Math.random() * 100;
    const duration = 5 + Math.random() * 8;
    const delay = -Math.random() * duration;
    const opacity = 0.18 + Math.random() * 0.32;
    const rotate = Math.random() * 360;
    const floatX = (Math.random() - 0.5) * 40;
    const spinDuration = 10 + Math.random() * 14;
    const spinDirection = Math.random() < 0.5 ? -360 : 360;

    shape.style.setProperty("--size", `${size}px`);
    shape.style.setProperty("--rotate", `${rotate}deg`);
    shape.style.setProperty("--rotate-end", `${rotate + spinDirection}deg`);
    shape.style.setProperty("--float-x", `${floatX}px`);
    shape.style.setProperty("--rise-duration", `${duration}s`);
    shape.style.setProperty("--rise-delay", `${delay}s`);
    shape.style.setProperty("--spin-duration", `${spinDuration}s`);
    shape.style.setProperty("--spin-delay", `${-Math.random() * spinDuration}s`);
    shape.style.left = `${left}%`;
    shape.style.opacity = String(opacity);

    container.appendChild(shape);
  }
}

const stopButtons = [];

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

function createStopButtons() {
  stopButtonsContainer.innerHTML = "";

  for (let index = 0; index < 4; index += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button button-stop";
    button.dataset.step = String(index);

    const step = document.createElement("span");
    step.className = "stop-step";

    button.append(step);
    button.addEventListener("click", () => {
      socket.emit("game:stop", { stepIndex: index });
    });

    stopButtons.push(button);
    stopButtonsContainer.appendChild(button);
  }
}

function applyButtonSymbol(button, symbolKey) {
  if (symbolKey) {
    button.dataset.symbol = symbolKey;
  }
}

function renderStopButtons(state) {
  stopButtons.forEach((button, index) => {
    const reel = state.reels[index];
    button.disabled = !reel?.canStop;
    button.classList.toggle("is-locked", Boolean(reel?.locked));
    button.classList.toggle("is-correct", Boolean(reel?.stop?.correct));
    button.classList.toggle("is-wrong", Boolean(reel?.stop && !reel.stop.correct));

    applyButtonSymbol(button, state.targetSequence?.[index]?.key);

    const targetEl = button.querySelector(".stop-step");
    if (targetEl) {
      renderSymbolImage(targetEl, reel?.targetImageUrl, "symbol-image symbol-image--button");
    }
  });
}

function render(state) {
  resetButton.disabled = state.status === "spinning";

  renderStopButtons(state);
}

if (controllerBg) {
  createFloatingBackground(controllerBg);
}

if (resetButton) {
  resetButton.textContent = RESET_LABEL;
}

createStopButtons();

resetButton.addEventListener("click", () => {
  socket.emit("game:reset");
});

socket.on("game:state", render);
socket.emit("game:requestState");
