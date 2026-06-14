const socket = io();

const target = document.getElementById("target");
const message = document.getElementById("message");
const sequence = document.getElementById("sequence");
const stopButtonsContainer = document.getElementById("stopButtons");
const startButton = document.getElementById("startButton");
const resetButton = document.getElementById("resetButton");

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

    const label = document.createElement("span");
    label.className = "stop-label";
    label.textContent = "STOP";

    const step = document.createElement("span");
    step.className = "stop-step";

    button.append(label, step);
    button.addEventListener("click", () => {
      socket.emit("game:stop", { stepIndex: index });
    });

    stopButtons.push(button);
    stopButtonsContainer.appendChild(button);
  }
}

function renderSequence(state) {
  sequence.innerHTML = "";

  state.reels.forEach((reel, index) => {
    const li = document.createElement("li");

    li.className = "sequence-item";
    if (reel.stop?.correct) li.classList.add("is-correct");
    if (reel.isCurrent) li.classList.add("is-current");
    if (reel.stop && !reel.stop.correct) li.classList.add("is-wrong");
    if (reel.locked) li.classList.add("is-locked");

    const step = document.createElement("span");
    step.className = "step";
    step.textContent = `${index + 1}`;

    const expected = document.createElement("span");
    expected.className = "expected";
    renderSymbolImage(expected, reel.targetImageUrl, "symbol-image symbol-image--medium");

    const actual = document.createElement("span");
    actual.className = "actual";
    if (reel.locked) {
      renderSymbolImage(actual, reel.imageUrl, "symbol-image symbol-image--medium");
    } else {
      actual.textContent = "…";
    }

    li.append(step, expected, actual);
    sequence.appendChild(li);
  });
}

function renderStopButtons(state) {
  stopButtons.forEach((button, index) => {
    const reel = state.reels[index];
    button.disabled = !reel?.canStop;
    button.classList.toggle("is-current", Boolean(reel?.isCurrent));
    button.classList.toggle("is-locked", Boolean(reel?.locked));
    button.classList.toggle("is-correct", Boolean(reel?.stop?.correct));
    button.classList.toggle("is-wrong", Boolean(reel?.stop && !reel.stop.correct));

    const targetEl = button.querySelector(".stop-step");
    if (targetEl) {
      renderSymbolImage(targetEl, reel?.targetImageUrl, "symbol-image symbol-image--button");
    }
  });
}

function render(state) {
  renderSymbolImage(target, state.nextTargetImageUrl, "symbol-image symbol-image--hero");
  message.textContent = state.message;

  startButton.disabled = state.status === "spinning";
  resetButton.disabled = state.status === "spinning";

  renderStopButtons(state);
  renderSequence(state);
}

createStopButtons();

startButton.addEventListener("click", () => {
  socket.emit("game:start");
});

resetButton.addEventListener("click", () => {
  socket.emit("game:reset");
});

socket.on("game:state", render);
socket.emit("game:requestState");
