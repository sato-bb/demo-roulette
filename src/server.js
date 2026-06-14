const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const game = require("./gameState");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "../public")));
app.use("/img", express.static(path.join(__dirname, "img")));

app.get("/", (_req, res) => {
  res.redirect("/controller");
});

app.get("/controller", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/controller/index.html"));
});

app.get("/display", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/display/index.html"));
});

function broadcastState(state) {
  io.emit("game:state", state);
}

io.on("connection", (socket) => {
  socket.emit("game:state", game.serializeState());

  socket.on("game:start", () => {
    const state = game.startGame(broadcastState);
    broadcastState(state);
  });

  socket.on("game:stop", (payload) => {
    const stepIndex = typeof payload === "number" ? payload : payload?.stepIndex;
    const state = game.stopRoulette(broadcastState, stepIndex);
    broadcastState(state);
  });

  socket.on("game:reset", () => {
    const state = game.resetGame();
    broadcastState(state);
  });

  socket.on("game:requestState", () => {
    socket.emit("game:state", game.serializeState());
  });
});

server.listen(PORT, () => {
  console.log(`Roulette MVP running at http://localhost:${PORT}`);
});
