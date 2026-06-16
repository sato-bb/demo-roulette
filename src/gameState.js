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

function createEmptyStops() {
  return Array(REEL_COUNT).fill(null);
}

const initialState = () => ({
  status: "idle", // idle | spinning | success | failed
  reels: createReels(),
  stops: createEmptyStops(),
  message: "好きな順番でリールを止めてください",
  tickMs: 300,
  updatedAt: Date.now(),
});

let state = initialState();
let timer = null;

function createSpinningState() {
  const nextState = initialState();
  nextState.status = "spinning";
  nextState.message = "好きな順番でリールを止めてください";
  return nextState;
}

function beginSpinning(onTick) {
  state = createSpinningState();
  startTicker(onTick);
  return serializeState();
}

function getReelSymbol(reel) {
  return SYMBOLS[reel.index];
}

function countUnlockedReels() {
  return state.reels.filter((reel) => !reel.locked).length;
}

function serializeReel(reel, reelIndex) {
  const symbol = getReelSymbol(reel);
  const stop = state.stops[reelIndex];

  return {
    symbol,
    label: SYMBOL_LABELS[symbol],
    imageUrl: getSymbolImage(symbol),
    locked: reel.locked,
    canStop: state.status === "spinning" && !reel.locked,
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
  const nextUnstoppedIndex = state.reels.findIndex((reel) => !reel.locked);

  return {
    ...state,
    reels: state.reels.map(serializeReel),
    targetSequence: TARGET_SEQUENCE.map((symbol) => ({
      key: symbol,
      label: SYMBOL_LABELS[symbol],
      imageUrl: getSymbolImage(symbol),
    })),
    nextTargetLabel:
      nextUnstoppedIndex >= 0 ? getTargetLabel(nextUnstoppedIndex) : "",
    nextTargetImageUrl:
      nextUnstoppedIndex >= 0 ? getSymbolImage(TARGET_SEQUENCE[nextUnstoppedIndex]) : "",
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
  return beginSpinning(onTick);
}

function stopRoulette(onTick, reelIndex) {
  if (state.status !== "spinning") {
    return touch("リセットして再開してください");
  }

  if (reelIndex === undefined || reelIndex === null) {
    return serializeState();
  }

  const reel = state.reels[reelIndex];
  if (!reel || reel.locked) {
    return serializeState();
  }

  const stoppedSymbol = getReelSymbol(reel);
  const expectedLabel = getTargetLabel(reelIndex);
  const isCorrect = judgeStep(reelIndex, stoppedSymbol);

  reel.locked = true;

  state.stops[reelIndex] = {
    reel: reelIndex + 1,
    symbol: stoppedSymbol,
    label: SYMBOL_LABELS[stoppedSymbol],
    expectedLabel,
    correct: isCorrect,
  };

  const remaining = countUnlockedReels();

  if (remaining === 0) {
    const allCorrect = state.stops.every((stop) => stop?.correct);
    state.status = allCorrect ? "success" : "failed";
    state.message = allCorrect
      ? "成功！すべて正しい位置で止められました"
      : "失敗：目押しにミスがありました";
    lockAllReels();
    stopTicker();
    return serializeState();
  }

  state.message = isCorrect
    ? `${reelIndex + 1}番目OK！残り${remaining}つ`
    : `${reelIndex + 1}番目NG：${expectedLabel}で止める番でした（残り${remaining}つ）`;
  return serializeState();
}

function resetGame(onTick) {
  stopTicker();
  return beginSpinning(onTick);
}

function bootGame(onTick) {
  if (state.status !== "spinning") {
    return beginSpinning(onTick);
  }

  if (!timer) {
    startTicker(onTick);
  }

  return serializeState();
}

module.exports = {
  serializeState,
  startGame,
  stopRoulette,
  resetGame,
  bootGame,
};
