const {
  SYMBOLS,
  SYMBOL_LABELS,
  TARGET_SEQUENCE,
  judgeStep,
  getTargetLabel,
  getSymbolImage,
} = require("./judge");

const REEL_COUNT = TARGET_SEQUENCE.length;

function createReels() {
  return Array.from({ length: REEL_COUNT }, (_, index) => ({
    index: index % SYMBOLS.length,
    locked: false,
  }));
}

const initialState = () => ({
  status: "idle", // idle | spinning | success | failed
  reels: createReels(),
  currentStep: 0,
  stops: [],
  message: "STARTを押してゲーム開始",
  tickMs: 120,
  updatedAt: Date.now(),
});

let state = initialState();
let timer = null;

function getReelSymbol(reel) {
  return SYMBOLS[reel.index];
}

function serializeReel(reel, reelIndex) {
  const symbol = getReelSymbol(reel);
  const stop = state.stops[reelIndex];

  return {
    symbol,
    label: SYMBOL_LABELS[symbol],
    imageUrl: getSymbolImage(symbol),
    locked: reel.locked,
    isCurrent: reelIndex === state.currentStep && state.status === "spinning",
    canStop: reelIndex === state.currentStep && state.status === "spinning" && !reel.locked,
    targetLabel: SYMBOL_LABELS[TARGET_SEQUENCE[reelIndex]],
    targetImageUrl: getSymbolImage(TARGET_SEQUENCE[reelIndex]),
    stop: stop
      ? {
          symbol: stop.symbol,
          label: stop.label,
          imageUrl: getSymbolImage(stop.symbol),
          correct: stop.correct,
        }
      : null,
  };
}

function serializeState() {
  return {
    ...state,
    reels: state.reels.map(serializeReel),
    targetSequence: TARGET_SEQUENCE.map((symbol) => ({
      key: symbol,
      label: SYMBOL_LABELS[symbol],
      imageUrl: getSymbolImage(symbol),
    })),
    nextTargetLabel: getTargetLabel(state.currentStep),
    nextTargetImageUrl: getSymbolImage(TARGET_SEQUENCE[state.currentStep]),
  };
}

function touch(message) {
  state.updatedAt = Date.now();
  if (message) state.message = message;
  return serializeState();
}

function spinUnlockedReels() {
  state.reels.forEach((reel) => {
    if (!reel.locked) {
      reel.index = (reel.index + 1) % SYMBOLS.length;
    }
  });
}

function startTicker(onTick) {
  stopTicker();
  timer = setInterval(() => {
    spinUnlockedReels();
    state.updatedAt = Date.now();
    onTick(serializeState());
  }, state.tickMs);
}

function stopTicker() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function lockAllReels() {
  state.reels.forEach((reel) => {
    reel.locked = true;
  });
}

function startGame(onTick) {
  state = initialState();
  state.status = "spinning";
  state.message = `1つ目：${getTargetLabel(0)}で止めてください`;
  startTicker(onTick);
  return serializeState();
}

function stopRoulette(onTick, stepIndex = state.currentStep) {
  if (state.status !== "spinning") {
    return touch("STARTを押してゲームを開始してください");
  }

  if (stepIndex !== state.currentStep) {
    return touch(`${state.currentStep + 1}番目のリールを止めてください`);
  }

  const reel = state.reels[stepIndex];
  if (reel.locked) {
    return serializeState();
  }

  const stoppedSymbol = getReelSymbol(reel);
  const expectedLabel = getTargetLabel(stepIndex);
  const isCorrect = judgeStep(stepIndex, stoppedSymbol);

  reel.locked = true;

  state.stops.push({
    step: stepIndex + 1,
    symbol: stoppedSymbol,
    label: SYMBOL_LABELS[stoppedSymbol],
    expectedLabel,
    correct: isCorrect,
  });

  state.currentStep += 1;

  if (state.currentStep >= TARGET_SEQUENCE.length) {
    const allCorrect = state.stops.every((stop) => stop.correct);
    state.status = allCorrect ? "success" : "failed";
    state.message = allCorrect
      ? "成功！順番通りに目押しできました"
      : "失敗：目押しにミスがありました";
    lockAllReels();
    stopTicker();
    return serializeState();
  }

  const nextLabel = getTargetLabel(state.currentStep);
  state.message = isCorrect
    ? `成功！次は${nextLabel}で止めてください`
    : `外れ：${expectedLabel}で止める番でした。次は${nextLabel}で止めてください`;
  return serializeState();
}

function resetGame() {
  stopTicker();
  state = initialState();
  return serializeState();
}

module.exports = {
  serializeState,
  startGame,
  stopRoulette,
  resetGame,
};
