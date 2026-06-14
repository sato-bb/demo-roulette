const SYMBOLS = ["triangle", "circle", "cross", "square"];

const SYMBOL_LABELS = {
  triangle: "△",
  circle: "○",
  cross: "×",
  square: "◻︎",
};

const SYMBOL_IMAGES = {
  triangle: "/img/triangle.jpg",
  circle: "/img/circle.jpg",
  cross: "/img/cross.jpg",
  square: "/img/square.jpg",
};

const TARGET_SEQUENCE = ["triangle", "circle", "cross", "square"];

function judgeStep(stepIndex, stoppedSymbol) {
  return TARGET_SEQUENCE[stepIndex] === stoppedSymbol;
}

function getTargetLabel(stepIndex) {
  const target = TARGET_SEQUENCE[stepIndex];
  return SYMBOL_LABELS[target] || "";
}

function getSymbolImage(symbol) {
  return SYMBOL_IMAGES[symbol] || "";
}

module.exports = {
  SYMBOLS,
  SYMBOL_LABELS,
  SYMBOL_IMAGES,
  TARGET_SEQUENCE,
  judgeStep,
  getTargetLabel,
  getSymbolImage,
};
