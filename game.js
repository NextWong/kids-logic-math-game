const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  choices: document.getElementById("choices"),
  feedback: document.getElementById("feedbackText"),
  modeLabel: document.getElementById("modeLabel"),
  next: document.getElementById("nextBtn"),
  prompt: document.getElementById("promptText"),
  round: document.getElementById("roundLabel"),
  speak: document.getElementById("speakBtn"),
  star: document.getElementById("starMeter"),
};

const WIDTH = 960;
const HEIGHT = 620;
const FLOOR_Y = 472;
const MODE_LABELS = {
  mixed: "混合练习",
  count: "数数练习",
  add: "加法练习",
  pattern: "规律练习",
};

const palette = {
  ink: "#24312b",
  muted: "#65736c",
  sky: "#bde9ff",
  cloud: "#fffdf4",
  grass: "#7bc86c",
  grassDark: "#2f9b5c",
  soil: "#9d6b47",
  sun: "#ffd45a",
  red: "#e85d75",
  blue: "#5da9e9",
  violet: "#8c6ff7",
  orange: "#ff9f43",
  yellow: "#ffd45a",
  teal: "#26b8a6",
  white: "#fffdf4",
};

const shapeTokens = [
  { id: "red-circle", shape: "circle", color: palette.red, name: "红圆" },
  { id: "blue-square", shape: "square", color: palette.blue, name: "蓝方块" },
  { id: "yellow-triangle", shape: "triangle", color: palette.yellow, name: "黄三角" },
  { id: "violet-diamond", shape: "diamond", color: palette.violet, name: "紫菱形" },
  { id: "teal-circle", shape: "circle", color: palette.teal, name: "绿圆" },
];

const itemKinds = [
  { id: "flower", label: "小花", color: palette.red },
  { id: "berry", label: "果子", color: palette.violet },
  { id: "leaf", label: "叶子", color: palette.grassDark },
  { id: "seed", label: "种子", color: palette.orange },
];

const state = {
  mode: "mixed",
  round: 1,
  stars: 0,
  challenge: null,
  feedback: "idle",
  feedbackMessage: "",
  feedbackTimer: 0,
  autoNextTimer: 0,
  triedKeys: new Set(),
  lastSelectedKey: "",
  garden: [],
  particles: [],
  time: 0,
};

let lastFrame = 0;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sample(list) {
  return list[randomInt(0, list.length - 1)];
}

function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function numberChoices(answer, min = 1, max = 8) {
  const values = new Set([answer]);
  const candidates = shuffle(
    Array.from({ length: max - min + 1 }, (_, index) => min + index).filter((value) => value !== answer)
  );
  for (const candidate of candidates) {
    if (values.size >= 4) break;
    if (Math.abs(candidate - answer) <= 3 || values.size < 2) values.add(candidate);
  }
  for (let value = min; values.size < 4 && value <= max; value += 1) values.add(value);
  return shuffle([...values]).map((value) => ({ type: "number", value, key: String(value) }));
}

function makeCountChallenge() {
  const count = randomInt(1, 6);
  const item = sample(itemKinds);
  return {
    type: "count",
    prompt: `花园里有几颗${item.label}？`,
    answerKey: String(count),
    answerText: String(count),
    choices: numberChoices(count, 1, 8),
    scene: { count, item },
  };
}

function makeAddChallenge() {
  const left = randomInt(1, 3);
  const right = randomInt(1, 6 - left);
  const total = left + right;
  const item = sample(itemKinds);
  return {
    type: "add",
    prompt: `${left} 加 ${right}，一共有几颗${item.label}？`,
    answerKey: String(total),
    answerText: String(total),
    choices: numberChoices(total, 1, 8),
    scene: { left, right, item },
  };
}

function makePatternChallenge() {
  const selected = shuffle(shapeTokens).slice(0, 3);
  const patterns = [
    { slots: [0, 1, 0, 1, 0, null], answer: 1 },
    { slots: [0, 0, 1, 0, 0, null], answer: 1 },
    { slots: [0, 1, 2, 0, 1, null], answer: 2 },
  ];
  const pattern = sample(patterns);
  const answerToken = selected[pattern.answer];
  const distractors = shuffle(shapeTokens.filter((token) => token.id !== answerToken.id)).slice(0, 3);
  const choices = shuffle([answerToken, ...distractors]).map((token) => ({
    type: "shape",
    key: token.id,
    token,
  }));

  return {
    type: "pattern",
    prompt: "接下来应该是哪一个图形？",
    answerKey: answerToken.id,
    answerText: answerToken.name,
    choices,
    scene: {
      slots: pattern.slots.map((tokenIndex) => (tokenIndex === null ? null : selected[tokenIndex])),
      answer: answerToken,
    },
  };
}

function makeChallenge() {
  if (state.mode === "count") return makeCountChallenge();
  if (state.mode === "add") return makeAddChallenge();
  if (state.mode === "pattern") return makePatternChallenge();
  const makers = [makeCountChallenge, makeAddChallenge, makePatternChallenge];
  return sample(makers)();
}

function setChallenge(nextRound = false) {
  if (nextRound) state.round += 1;
  state.challenge = makeChallenge();
  state.feedback = "idle";
  state.feedbackMessage = "";
  state.feedbackTimer = 0;
  state.autoNextTimer = 0;
  state.lastSelectedKey = "";
  state.triedKeys = new Set();
  renderChoices();
  syncDom();
  render();
}

function choiceToNode(choice, index) {
  const button = document.createElement("button");
  button.className = "choice-button";
  button.type = "button";
  button.dataset.key = choice.key;
  button.setAttribute("aria-label", `答案 ${index + 1}: ${choice.type === "number" ? choice.value : choice.token.name}`);

  if (choice.type === "number") {
    const number = document.createElement("span");
    number.className = "choice-number";
    number.textContent = choice.value;
    button.appendChild(number);
  } else {
    const swatch = document.createElement("span");
    swatch.className = `choice-swatch shape-${choice.token.shape}`;
    swatch.style.backgroundColor = choice.token.color;
    swatch.style.setProperty("--shape-color", choice.token.color);
    button.appendChild(swatch);
  }

  button.addEventListener("click", () => selectChoice(choice.key));
  return button;
}

function renderChoices() {
  ui.choices.replaceChildren();
  state.challenge.choices.forEach((choice, index) => ui.choices.appendChild(choiceToNode(choice, index)));
}

function syncDom() {
  ui.prompt.textContent = state.challenge.prompt;
  ui.feedback.textContent = state.feedbackMessage;
  ui.round.textContent = `第 ${state.round} 题`;
  ui.star.textContent = `${state.stars} 颗星`;
  ui.modeLabel.textContent = MODE_LABELS[state.mode];
  document.querySelectorAll(".mode-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.mode);
  });
  ui.choices.querySelectorAll(".choice-button").forEach((button) => {
    const key = button.dataset.key;
    button.dataset.tried = state.triedKeys.has(key) ? "true" : "false";
    button.classList.toggle("correct", state.feedback === "correct" && key === state.challenge.answerKey);
    button.classList.toggle("wrong", state.feedback === "wrong" && key === state.lastSelectedKey);
  });
  document.body.dataset.gameState = renderGameToText();
}

function selectChoice(key) {
  if (state.feedback === "correct") return;
  state.lastSelectedKey = key;
  if (key === state.challenge.answerKey) {
    state.feedback = "correct";
    state.feedbackMessage = "答对了，花园长大一点！";
    state.feedbackTimer = 900;
    state.autoNextTimer = 1250;
    state.stars += 1;
    addGardenBloom();
    burstParticles();
    playTone(660, 0.08, "sine");
    window.setTimeout(() => playTone(880, 0.08, "sine"), 90);
  } else {
    state.feedback = "wrong";
    state.feedbackMessage = "再看一看，可以再试一次。";
    state.feedbackTimer = 850;
    state.triedKeys.add(key);
    playTone(220, 0.08, "triangle");
  }
  syncDom();
  render();
}

function addGardenBloom() {
  state.garden.push({
    x: randomInt(92, 868),
    y: randomInt(FLOOR_Y + 58, HEIGHT - 35),
    size: randomInt(16, 27),
    color: sample([palette.red, palette.blue, palette.violet, palette.yellow, palette.orange]),
    stem: randomInt(22, 46),
    phase: Math.random() * Math.PI * 2,
  });
  if (state.garden.length > 18) state.garden.shift();
}

function burstParticles() {
  for (let index = 0; index < 18; index += 1) {
    state.particles.push({
      x: WIDTH / 2 + randomInt(-60, 60),
      y: 180 + randomInt(-20, 30),
      vx: randomInt(-80, 80),
      vy: randomInt(-130, -40),
      life: 0.75,
      color: sample([palette.red, palette.blue, palette.yellow, palette.violet, palette.teal]),
    });
  }
}

function playTone(frequency, duration, type) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  if (!playTone.context) playTone.context = new AudioContext();
  const audio = playTone.context;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.001, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.14, audio.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + duration + 0.02);
}

function speakPrompt() {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(state.challenge.prompt);
  utterance.lang = "zh-CN";
  utterance.rate = 0.88;
  window.speechSynthesis.speak(utterance);
}

function handleCanvasTap(event) {
  event.preventDefault();
  if (state.feedback === "correct") {
    setChallenge(true);
    return;
  }
  speakPrompt();
}

function update(dt) {
  state.time += dt;
  if (state.feedback === "wrong" && state.feedbackTimer > 0) {
    state.feedbackTimer -= dt * 1000;
    if (state.feedbackTimer <= 0) {
      state.feedback = "idle";
      state.feedbackMessage = "可以继续选。";
      syncDom();
    }
  }

  if (state.autoNextTimer > 0) {
    state.autoNextTimer -= dt * 1000;
    if (state.autoNextTimer <= 0) setChallenge(true);
  }

  state.particles = state.particles
    .map((particle) => ({
      ...particle,
      x: particle.x + particle.vx * dt,
      y: particle.y + particle.vy * dt,
      vy: particle.vy + 260 * dt,
      life: particle.life - dt,
    }))
    .filter((particle) => particle.life > 0);
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#bde9ff");
  sky.addColorStop(0.68, "#eaf8ff");
  sky.addColorStop(1, "#dff5d7");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = palette.sun;
  ctx.beginPath();
  ctx.arc(842, 86, 48, 0, Math.PI * 2);
  ctx.fill();

  drawCloud(168, 92, 1.05);
  drawCloud(392, 78, 0.82);
  drawCloud(650, 126, 0.74);

  ctx.fillStyle = "#a9dc7a";
  ctx.beginPath();
  ctx.moveTo(0, FLOOR_Y);
  ctx.bezierCurveTo(180, 398, 292, 435, 452, FLOOR_Y);
  ctx.bezierCurveTo(612, 518, 736, 392, WIDTH, FLOOR_Y);
  ctx.lineTo(WIDTH, HEIGHT);
  ctx.lineTo(0, HEIGHT);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = palette.grass;
  ctx.fillRect(0, FLOOR_Y, WIDTH, HEIGHT - FLOOR_Y);

  ctx.fillStyle = palette.soil;
  roundRect(52, FLOOR_Y + 54, WIDTH - 104, 86, 36);
  ctx.fill();
}

function drawCloud(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(255, 253, 244, 0.92)";
  ctx.beginPath();
  ctx.arc(0, 10, 26, 0, Math.PI * 2);
  ctx.arc(32, 0, 34, 0, Math.PI * 2);
  ctx.arc(70, 12, 24, 0, Math.PI * 2);
  ctx.roundRect(-26, 10, 116, 30, 16);
  ctx.fill();
  ctx.restore();
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function drawGarden() {
  state.garden.forEach((bloom) => {
    const sway = Math.sin(state.time * 2 + bloom.phase) * 2;
    ctx.strokeStyle = palette.grassDark;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(bloom.x, bloom.y);
    ctx.quadraticCurveTo(bloom.x + sway, bloom.y - bloom.stem / 2, bloom.x + sway, bloom.y - bloom.stem);
    ctx.stroke();
    drawFlower(bloom.x + sway, bloom.y - bloom.stem, bloom.size, bloom.color);
  });
}

function drawFlower(x, y, size, color) {
  ctx.fillStyle = color;
  for (let index = 0; index < 6; index += 1) {
    const angle = (Math.PI * 2 * index) / 6;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(angle) * size * 0.48, y + Math.sin(angle) * size * 0.48, size * 0.32, size * 0.2, angle, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = palette.yellow;
  ctx.beginPath();
  ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawChallenge() {
  if (state.challenge.type === "count") drawCountChallenge();
  if (state.challenge.type === "add") drawAddChallenge();
  if (state.challenge.type === "pattern") drawPatternChallenge();
}

function drawCountChallenge() {
  const { count, item } = state.challenge.scene;
  const positions = layoutPositions(count, 330, 188, 300, 205);
  drawQuestionBadge("数一数", 480, 142);
  positions.forEach((position, index) => {
    drawItem(item, position.x, position.y, 58 + (index % 2) * 5);
  });
}

function drawAddChallenge() {
  const { left, right, item } = state.challenge.scene;
  drawQuestionBadge("合起来", 480, 142);
  layoutPositions(left, 170, 220, 210, 140).forEach((position) => drawItem(item, position.x, position.y, 48));
  layoutPositions(right, 580, 220, 210, 140).forEach((position) => drawItem(item, position.x, position.y, 48));
  ctx.fillStyle = palette.ink;
  ctx.font = "900 58px ui-rounded, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("+", 480, 286);
  ctx.fillText("?", 480, 370);
}

function drawPatternChallenge() {
  drawQuestionBadge("找规律", 480, 142);
  const startX = 174;
  const gap = 122;
  state.challenge.scene.slots.forEach((token, index) => {
    const x = startX + index * gap;
    const y = 292;
    ctx.fillStyle = "rgba(255, 253, 244, 0.86)";
    ctx.strokeStyle = "rgba(36, 49, 43, 0.16)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(x - 44, y - 44, 88, 88, 18);
    ctx.fill();
    ctx.stroke();
    if (token) {
      drawShapeToken(token, x, y, 58);
    } else {
      ctx.fillStyle = palette.ink;
      ctx.font = "900 54px ui-rounded, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("?", x, y + 2);
    }
  });
}

function drawQuestionBadge(text, x, y) {
  ctx.fillStyle = "rgba(255, 253, 244, 0.84)";
  ctx.strokeStyle = "rgba(36, 49, 43, 0.12)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - 94, y - 34, 188, 68, 30);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = palette.ink;
  ctx.font = "900 30px ui-rounded, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}

function layoutPositions(count, x, y, width, height) {
  const columns = count <= 3 ? count : 3;
  const rows = Math.ceil(count / columns);
  const cellW = width / columns;
  const cellH = height / rows;
  return Array.from({ length: count }, (_, index) => ({
    x: x + cellW * (index % columns) + cellW / 2,
    y: y + cellH * Math.floor(index / columns) + cellH / 2,
  }));
}

function drawItem(item, x, y, size) {
  if (item.id === "flower") {
    ctx.strokeStyle = palette.grassDark;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.55);
    ctx.lineTo(x, y + size * 0.08);
    ctx.stroke();
    drawFlower(x, y - size * 0.08, size * 0.42, item.color);
    return;
  }

  if (item.id === "berry") {
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.white;
    ctx.beginPath();
    ctx.arc(x - size * 0.12, y - size * 0.12, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (item.id === "leaf") {
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.ellipse(x, y, size * 0.42, size * 0.24, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#d7ffd7";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.24, y + size * 0.1);
    ctx.lineTo(x + size * 0.26, y - size * 0.1);
    ctx.stroke();
    return;
  }

  ctx.fillStyle = item.color;
  ctx.beginPath();
  ctx.ellipse(x, y, size * 0.28, size * 0.38, -0.35, 0, Math.PI * 2);
  ctx.fill();
}

function drawShapeToken(token, x, y, size) {
  ctx.fillStyle = token.color;
  ctx.strokeStyle = "rgba(36, 49, 43, 0.14)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  if (token.shape === "circle") {
    ctx.arc(x, y, size * 0.46, 0, Math.PI * 2);
  } else if (token.shape === "square") {
    ctx.roundRect(x - size * 0.42, y - size * 0.42, size * 0.84, size * 0.84, 10);
  } else if (token.shape === "diamond") {
    ctx.moveTo(x, y - size * 0.5);
    ctx.lineTo(x + size * 0.5, y);
    ctx.lineTo(x, y + size * 0.5);
    ctx.lineTo(x - size * 0.5, y);
    ctx.closePath();
  } else {
    ctx.moveTo(x, y - size * 0.52);
    ctx.lineTo(x + size * 0.52, y + size * 0.42);
    ctx.lineTo(x - size * 0.52, y + size * 0.42);
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();
}

function drawParticles() {
  state.particles.forEach((particle) => {
    ctx.globalAlpha = Math.max(0, Math.min(1, particle.life / 0.75));
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 7, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function render() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawBackground();
  drawChallenge();
  drawGarden();
  drawParticles();
}

function loop(timestamp) {
  if (!lastFrame) lastFrame = timestamp;
  const dt = Math.min(0.05, (timestamp - lastFrame) / 1000);
  lastFrame = timestamp;
  update(dt);
  render();
  window.requestAnimationFrame(loop);
}

function setMode(mode) {
  state.mode = mode;
  state.round = 1;
  state.stars = 0;
  state.garden = [];
  state.particles = [];
  setChallenge(false);
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

function bindEvents() {
  canvas.addEventListener("pointerdown", handleCanvasTap);
  ui.next.addEventListener("click", () => setChallenge(true));
  ui.speak.addEventListener("click", speakPrompt);
  document.querySelectorAll(".mode-button").forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "f" || event.key === "F") {
      toggleFullscreen();
      return;
    }
    const index = Number(event.key) - 1;
    if (Number.isInteger(index) && index >= 0 && index < state.challenge.choices.length) {
      selectChoice(state.challenge.choices[index].key);
    }
    if (event.key === "Enter") setChallenge(true);
  });
}

function renderGameToText() {
  const challenge = state.challenge;
  const payload = {
    coordinateSystem: "canvas 960x620, origin top-left, x increases right, y increases down",
    mode: state.mode,
    round: state.round,
    stars: state.stars,
    feedback: state.feedback,
    prompt: challenge.prompt,
    answer: challenge.answerText,
    choices: challenge.choices.map((choice, index) => ({
      index: index + 1,
      key: choice.key,
      label: choice.type === "number" ? String(choice.value) : choice.token.name,
    })),
    scene:
      challenge.type === "pattern"
        ? {
            type: challenge.type,
            slots: challenge.scene.slots.map((slot) => (slot ? slot.name : "?")),
          }
        : {
            type: challenge.type,
            item: challenge.scene.item.label,
            count: challenge.scene.count,
            left: challenge.scene.left,
            right: challenge.scene.right,
          },
  };
  return JSON.stringify(payload);
}

window.render_game_to_text = renderGameToText;
globalThis.render_game_to_text = renderGameToText;
window.advanceTime = (ms) => {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let index = 0; index < steps; index += 1) update(1 / 60);
  render();
};

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || window.location.protocol === "file:") return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("Service worker registration failed:", error);
    });
  });
}

if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function polyfillRoundRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    this.moveTo(x + r, y);
    this.arcTo(x + width, y, x + width, y + height, r);
    this.arcTo(x + width, y + height, x, y + height, r);
    this.arcTo(x, y + height, x, y, r);
    this.arcTo(x, y, x + width, y, r);
    return this;
  };
}

bindEvents();
registerServiceWorker();
setChallenge(false);
window.requestAnimationFrame(loop);
