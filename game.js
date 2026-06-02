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
const AUDIO_VERSION = "6";
const PROMPT_AUDIO_BASE = "./audio/prompts";
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
  pink: "#ff8fb3",
  cream: "#fff1cf",
  brown: "#9b6b4a",
  fox: "#f28a35",
  panda: "#f7f4ea",
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
  { id: "pink-heart", shape: "heart", color: palette.pink, name: "粉爱心" },
  { id: "orange-star", shape: "star", color: palette.orange, name: "橙星星" },
];

const itemKinds = [
  { id: "flower", label: "小花", color: palette.red },
  { id: "berry", label: "果子", color: palette.violet },
  { id: "carrot", label: "胡萝卜", color: palette.orange },
  { id: "fish", label: "小鱼", color: palette.blue },
  { id: "balloon", label: "气球", color: palette.pink },
  { id: "star-treat", label: "星星糖", color: palette.yellow },
];

const animalFriends = [
  { id: "bunny", name: "兔兔", body: palette.white, accent: palette.pink },
  { id: "panda", name: "熊猫", body: palette.panda, accent: palette.ink },
  { id: "fox", name: "小狐狸", body: palette.fox, accent: palette.white },
  { id: "chick", name: "小鸡", body: palette.yellow, accent: palette.orange },
  { id: "kitty", name: "小猫", body: palette.cream, accent: palette.brown },
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
  unlockedAnimals: 1,
  animalBounce: 0,
  mascotMessage: "摸摸小动物，一起玩！",
  mascotMessageTimer: 4000,
  particles: [],
  time: 0,
};

let lastFrame = 0;
let preferredSpeechVoice = null;
let promptAudio = null;
let promptAudioSrc = "";

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

function promptAudioPath(key) {
  return `${PROMPT_AUDIO_BASE}/${key}.mp3?v=${AUDIO_VERSION}`;
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
  const promptAudioKey = `count-${item.id}-${count}`;
  return {
    type: "count",
    prompt: `花园里有几颗${item.label}？`,
    promptAudioKey,
    promptAudio: promptAudioPath(promptAudioKey),
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
  const promptAudioKey = `add-${item.id}-${left}-${right}`;
  return {
    type: "add",
    prompt: `${left} 加 ${right}，一共有几颗${item.label}？`,
    promptAudioKey,
    promptAudio: promptAudioPath(promptAudioKey),
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
    promptAudioKey: "pattern-next-shape",
    promptAudio: promptAudioPath("pattern-next-shape"),
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
  preloadPromptAudio();
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
    if (choice.token.shape !== "triangle") {
      const face = document.createElement("span");
      face.className = "shape-face";
      swatch.appendChild(face);
    }
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
    const previousUnlocked = state.unlockedAnimals;
    state.feedback = "correct";
    state.feedbackMessage = "答对了，花园长大一点！";
    state.feedbackTimer = 900;
    state.autoNextTimer = 1250;
    state.stars += 1;
    state.unlockedAnimals = Math.min(animalFriends.length, 1 + Math.floor(state.stars / 3));
    if (state.unlockedAnimals > previousUnlocked) {
      const friend = animalFriends[state.unlockedAnimals - 1];
      state.feedbackMessage = `${friend.name}也来花园玩啦！`;
      state.mascotMessage = `${friend.name}来啦！`;
    } else {
      state.mascotMessage = sample(["太棒啦！", "你真会观察！", "花园亮起来啦！"]);
    }
    state.mascotMessageTimer = 1800;
    state.animalBounce = 1;
    addGardenBloom();
    burstParticles();
    playSound("correct");
  } else {
    state.feedback = "wrong";
    state.feedbackMessage = "再看一看，可以再试一次。";
    state.mascotMessage = sample(["再试试！", "我陪你看一看。", "数慢一点。"]);
    state.mascotMessageTimer = 1500;
    state.animalBounce = 0.35;
    state.feedbackTimer = 850;
    state.triedKeys.add(key);
    playSound("wrong");
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
      shape: sample(["dot", "star", "heart"]),
      color: sample([palette.red, palette.blue, palette.yellow, palette.violet, palette.teal]),
    });
  }
}

function addTapSparkles(x, y) {
  for (let index = 0; index < 12; index += 1) {
    state.particles.push({
      x,
      y,
      vx: randomInt(-120, 120),
      vy: randomInt(-150, -35),
      life: 0.65,
      shape: sample(["star", "heart"]),
      color: sample([palette.pink, palette.yellow, palette.teal, palette.orange]),
    });
  }
}

function getAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!getAudioContext.context) getAudioContext.context = new AudioContext();
  const audio = getAudioContext.context;
  if (audio.state === "suspended") audio.resume().catch(() => {});
  return audio;
}

function playPluck(frequency, options = {}) {
  const audio = getAudioContext();
  if (!audio) return;

  const delay = options.delay || 0;
  const duration = options.duration || 0.42;
  const gainValue = options.gain || 0.09;
  const now = audio.currentTime + delay;
  const main = audio.createOscillator();
  const overtone = audio.createOscillator();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  const panner = audio.createStereoPanner ? audio.createStereoPanner() : null;

  main.type = options.type || "sine";
  main.frequency.setValueAtTime(frequency, now);
  main.detune.setValueAtTime(-5, now);
  overtone.type = "sine";
  overtone.frequency.setValueAtTime(frequency * 2.01, now);
  overtone.detune.setValueAtTime(4, now);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(options.filter || 2600, now);
  filter.Q.setValueAtTime(0.7, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.018);
  gain.gain.exponentialRampToValueAtTime(gainValue * 0.34, now + duration * 0.32);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  main.connect(filter);
  overtone.connect(filter);
  filter.connect(gain);
  if (panner) {
    panner.pan.setValueAtTime(options.pan || 0, now);
    gain.connect(panner);
    panner.connect(audio.destination);
  } else {
    gain.connect(audio.destination);
  }

  main.start(now);
  overtone.start(now);
  main.stop(now + duration + 0.04);
  overtone.stop(now + duration + 0.04);
}

function playSound(kind) {
  if (kind === "correct") {
    [
      [523.25, 0, -0.18],
      [659.25, 0.08, 0],
      [783.99, 0.17, 0.16],
    ].forEach(([frequency, delay, pan]) => playPluck(frequency, { delay, pan, gain: 0.075, duration: 0.48, filter: 3200 }));
    return;
  }

  if (kind === "wrong") {
    playPluck(293.66, { type: "triangle", gain: 0.055, duration: 0.34, filter: 1500, pan: -0.1 });
    window.setTimeout(() => playPluck(246.94, { type: "sine", gain: 0.038, duration: 0.3, filter: 1300, pan: 0.1 }), 70);
    return;
  }

  if (kind === "animal") {
    playPluck(587.33, { gain: 0.062, duration: 0.34, filter: 2800, pan: -0.08 });
    window.setTimeout(() => playPluck(739.99, { gain: 0.052, duration: 0.32, filter: 3000, pan: 0.12 }), 75);
    return;
  }

  playPluck(440, { gain: 0.035, duration: 0.24, filter: 2200 });
}

function chooseSpeechVoice() {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const chineseVoices = voices.filter((voice) => /^zh/i.test(voice.lang));
  const naturalNames = ["xiaoxiao", "tingting", "meijia", "sin-ji", "yunxi", "google 普通话", "google mandarin"];
  return (
    chineseVoices.find((voice) => naturalNames.some((name) => voice.name.toLowerCase().includes(name))) ||
    chineseVoices.find((voice) => voice.lang.toLowerCase() === "zh-cn") ||
    chineseVoices[0] ||
    null
  );
}

function preloadPromptAudio() {
  const src = state.challenge?.promptAudio || "";
  promptAudioSrc = src;
  promptAudio = null;
  if (!src) return;
  promptAudio = new Audio(src);
  promptAudio.preload = "auto";
  promptAudio.volume = 0.95;
  promptAudio.load();
}

function stopPromptAudio() {
  if (promptAudio) {
    promptAudio.pause();
    try {
      promptAudio.currentTime = 0;
    } catch (error) {
      // Some browsers disallow seeking before metadata is ready.
    }
  }
  window.speechSynthesis?.cancel();
}

function speakPromptWithSystemVoice() {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(state.challenge.prompt);
  const voice = preferredSpeechVoice || chooseSpeechVoice();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = "zh-CN";
  }
  utterance.rate = 0.82;
  utterance.pitch = 1.06;
  utterance.volume = 0.92;
  window.speechSynthesis.speak(utterance);
}

function speakPrompt() {
  if (!state.challenge) return;
  stopPromptAudio();
  const src = state.challenge.promptAudio;
  if (!src) {
    speakPromptWithSystemVoice();
    return;
  }

  const audio = promptAudio && promptAudioSrc === src ? promptAudio : new Audio(src);
  promptAudio = audio;
  promptAudioSrc = src;
  promptAudio.volume = 0.95;
  promptAudio.play().catch(() => speakPromptWithSystemVoice());
}

function handleCanvasTap(event) {
  event.preventDefault();
  const point = canvasPoint(event);
  addTapSparkles(point.x, point.y);

  if (state.feedback === "correct") {
    setChallenge(true);
    return;
  }

  const friend = hitAnimalFriend(point.x, point.y);
  if (friend) {
    state.mascotMessage = `${friend.name}跳起来啦！`;
    state.mascotMessageTimer = 1500;
    state.animalBounce = 1;
    playSound("animal");
    syncDom();
    render();
    return;
  }

  state.mascotMessage = "听题目，再选答案！";
  state.mascotMessageTimer = 1200;
  playSound("tap");
  speakPrompt();
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
  };
}

function friendSlots() {
  const count = state.unlockedAnimals;
  const start = WIDTH / 2 - (count - 1) * 74;
  return animalFriends.slice(0, count).map((friend, index) => ({
    ...friend,
    x: start + index * 148,
    y: FLOOR_Y + 82 + (index % 2) * 8,
    r: 48,
  }));
}

function hitAnimalFriend(x, y) {
  return friendSlots().find((friend) => Math.hypot(friend.x - x, friend.y - y) < friend.r + 18);
}

function update(dt) {
  state.time += dt;
  state.animalBounce = Math.max(0, state.animalBounce - dt * 2.4);
  state.mascotMessageTimer = Math.max(0, state.mascotMessageTimer - dt * 1000);
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

  drawPaperGrain();
  drawSunRays(842, 86);
  ctx.fillStyle = palette.sun;
  ctx.beginPath();
  ctx.arc(842, 86, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(36, 49, 43, 0.1)";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 253, 244, 0.5)";
  ctx.beginPath();
  ctx.ellipse(825, 68, 12, 8, -0.55, 0, Math.PI * 2);
  ctx.fill();

  drawCloud(168, 92, 1.05);
  drawCloud(392, 78, 0.82);
  drawCloud(650, 126, 0.74);
  drawRainbow(92, 238, 0.92);
  drawButterfly(774, 178, 0.9, palette.pink);
  drawButterfly(114, 318, 0.7, palette.violet);

  ctx.fillStyle = "#a9dc7a";
  ctx.beginPath();
  ctx.moveTo(0, FLOOR_Y);
  ctx.bezierCurveTo(180, 398, 292, 435, 452, FLOOR_Y);
  ctx.bezierCurveTo(612, 518, 736, 392, WIDTH, FLOOR_Y);
  ctx.lineTo(WIDTH, HEIGHT);
  ctx.lineTo(0, HEIGHT);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(36, 49, 43, 0.08)";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = palette.grass;
  ctx.fillRect(0, FLOOR_Y, WIDTH, HEIGHT - FLOOR_Y);
  drawGrassMarks();

  ctx.fillStyle = palette.soil;
  roundRect(52, FLOOR_Y + 54, WIDTH - 104, 86, 36);
  ctx.fill();
  ctx.strokeStyle = "rgba(36, 49, 43, 0.12)";
  ctx.lineWidth = 4;
  ctx.stroke();
  drawSoilPebbles();
  drawComicFrame();
}

function drawPaperGrain() {
  ctx.save();
  ctx.fillStyle = "rgba(255, 253, 244, 0.2)";
  for (let x = 18; x < WIDTH; x += 54) {
    for (let y = 16; y < HEIGHT; y += 48) {
      const wobble = ((x * 7 + y * 11) % 13) - 6;
      ctx.beginPath();
      ctx.arc(x + wobble, y - wobble * 0.3, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawSunRays(x, y) {
  ctx.save();
  ctx.strokeStyle = "rgba(255, 212, 90, 0.38)";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  for (let index = 0; index < 12; index += 1) {
    const angle = (Math.PI * 2 * index) / 12;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * 64, y + Math.sin(angle) * 64);
    ctx.lineTo(x + Math.cos(angle) * 84, y + Math.sin(angle) * 84);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGrassMarks() {
  ctx.save();
  ctx.strokeStyle = "rgba(47, 155, 92, 0.22)";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  for (let x = 34; x < WIDTH; x += 48) {
    const y = FLOOR_Y + 20 + ((x * 5) % 58);
    ctx.beginPath();
    ctx.moveTo(x, y + 12);
    ctx.quadraticCurveTo(x + 7, y + 2, x + 15, y + 10);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSoilPebbles() {
  ctx.save();
  ctx.fillStyle = "rgba(255, 253, 244, 0.22)";
  for (let index = 0; index < 16; index += 1) {
    const x = 92 + index * 52;
    const y = FLOOR_Y + 82 + ((index * 17) % 38);
    ctx.beginPath();
    ctx.ellipse(x, y, 7, 3.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawComicFrame() {
  ctx.save();
  ctx.strokeStyle = "rgba(36, 49, 43, 0.1)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(13, 13, WIDTH - 26, HEIGHT - 26, 18);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255, 253, 244, 0.48)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(21, 21, WIDTH - 42, HEIGHT - 42, 14);
  ctx.stroke();
  ctx.restore();
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
  ctx.strokeStyle = "rgba(36, 49, 43, 0.07)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function drawRainbow(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = 0.34;
  const colors = [palette.red, palette.orange, palette.yellow, palette.grassDark, palette.blue, palette.violet];
  colors.forEach((color, index) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(0, 78, 82 - index * 12, Math.PI * 1.02, Math.PI * 1.88);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawButterfly(x, y, scale, color) {
  const flap = Math.sin(state.time * 7 + x) * 0.08;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(flap);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(-13, -5, 14, 20, -0.5, 0, Math.PI * 2);
  ctx.ellipse(13, -5, 14, 20, 0.5, 0, Math.PI * 2);
  ctx.ellipse(-9, 14, 10, 14, 0.3, 0, Math.PI * 2);
  ctx.ellipse(9, 14, 10, 14, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette.ink;
  ctx.beginPath();
  ctx.ellipse(0, 5, 4, 20, 0, 0, Math.PI * 2);
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
  drawAnimalFriends();
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

function drawAnimalFriends() {
  friendSlots().forEach((friend, index) => drawAnimalFriend(friend, index));
}

function drawAnimalFriend(friend, index) {
  const size = friend.r;
  const bob = Math.sin(state.time * 3 + index * 1.7) * 2 - state.animalBounce * (16 - index * 1.5);
  const x = friend.x;
  const y = friend.y + bob;

  ctx.save();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(36, 49, 43, 0.12)";

  ctx.fillStyle = "rgba(36, 49, 43, 0.12)";
  ctx.beginPath();
  ctx.ellipse(x, friend.y + size * 0.52, size * 0.72, size * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  if (friend.id === "bunny") {
    ctx.fillStyle = friend.body;
    ctx.beginPath();
    ctx.ellipse(x - size * 0.2, y - size * 0.58, size * 0.17, size * 0.48, -0.18, 0, Math.PI * 2);
    ctx.ellipse(x + size * 0.2, y - size * 0.58, size * 0.17, size * 0.48, 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = friend.accent;
    ctx.beginPath();
    ctx.ellipse(x - size * 0.2, y - size * 0.58, size * 0.08, size * 0.3, -0.18, 0, Math.PI * 2);
    ctx.ellipse(x + size * 0.2, y - size * 0.58, size * 0.08, size * 0.3, 0.18, 0, Math.PI * 2);
    ctx.fill();
  }

  if (friend.id === "fox" || friend.id === "kitty") {
    ctx.fillStyle = friend.body;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.42, y - size * 0.3);
    ctx.lineTo(x - size * 0.16, y - size * 0.74);
    ctx.lineTo(x + size * 0.02, y - size * 0.28);
    ctx.closePath();
    ctx.moveTo(x + size * 0.42, y - size * 0.3);
    ctx.lineTo(x + size * 0.16, y - size * 0.74);
    ctx.lineTo(x - size * 0.02, y - size * 0.28);
    ctx.closePath();
    ctx.fill();
  }

  if (friend.id === "panda") {
    ctx.fillStyle = friend.accent;
    ctx.beginPath();
    ctx.arc(x - size * 0.35, y - size * 0.38, size * 0.18, 0, Math.PI * 2);
    ctx.arc(x + size * 0.35, y - size * 0.38, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }

  if (friend.id === "chick") {
    ctx.fillStyle = friend.body;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.15, y - size * 0.58);
    ctx.lineTo(x, y - size * 0.84);
    ctx.lineTo(x + size * 0.15, y - size * 0.58);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = friend.body;
  ctx.beginPath();
  ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (friend.id === "panda") {
    ctx.fillStyle = friend.accent;
    ctx.beginPath();
    ctx.ellipse(x - size * 0.18, y - size * 0.06, size * 0.13, size * 0.18, -0.55, 0, Math.PI * 2);
    ctx.ellipse(x + size * 0.18, y - size * 0.06, size * 0.13, size * 0.18, 0.55, 0, Math.PI * 2);
    ctx.fill();
    drawCuteFace(x, y + size * 0.03, size * 0.26, palette.white);
  } else if (friend.id === "fox") {
    ctx.fillStyle = friend.accent;
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.05);
    ctx.lineTo(x - size * 0.28, y + size * 0.32);
    ctx.lineTo(x + size * 0.28, y + size * 0.32);
    ctx.closePath();
    ctx.fill();
    drawCuteFace(x, y + size * 0.03, size * 0.28);
  } else if (friend.id === "chick") {
    ctx.fillStyle = friend.accent;
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.08);
    ctx.lineTo(x - size * 0.11, y + size * 0.2);
    ctx.lineTo(x + size * 0.11, y + size * 0.2);
    ctx.closePath();
    ctx.fill();
    drawCuteFace(x, y - size * 0.04, size * 0.28);
  } else {
    drawCuteFace(x, y + size * 0.02, size * 0.3);
  }

  ctx.fillStyle = "rgba(232, 93, 117, 0.45)";
  ctx.beginPath();
  ctx.arc(x - size * 0.27, y + size * 0.13, size * 0.07, 0, Math.PI * 2);
  ctx.arc(x + size * 0.27, y + size * 0.13, size * 0.07, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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
  ctx.fillStyle = "rgba(36, 49, 43, 0.08)";
  ctx.beginPath();
  ctx.roundRect(x - 88, y - 28, 176, 58, 26);
  ctx.fill();
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

function drawSpeechBubble() {
  if (state.mascotMessageTimer <= 0) return;
  const slots = friendSlots();
  if (!slots.length) return;
  const friend = slots[0];
  const alpha = Math.min(1, state.mascotMessageTimer / 450);
  const x = Math.min(Math.max(friend.x, 180), WIDTH - 180);
  const y = friend.y - 112;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(255, 253, 244, 0.94)";
  ctx.strokeStyle = "rgba(36, 49, 43, 0.12)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - 136, y - 28, 272, 56, 26);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 24, y + 24);
  ctx.lineTo(friend.x - 12, friend.y - 44);
  ctx.lineTo(x + 12, y + 24);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = palette.ink;
  ctx.font = "900 24px ui-rounded, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(state.mascotMessage, x, y + 1);
  ctx.restore();
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

function drawCuteFace(x, y, size, eyeColor = palette.ink) {
  ctx.fillStyle = eyeColor;
  ctx.beginPath();
  ctx.arc(x - size * 0.33, y - size * 0.1, size * 0.08, 0, Math.PI * 2);
  ctx.arc(x + size * 0.33, y - size * 0.1, size * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = eyeColor;
  ctx.lineWidth = Math.max(2, size * 0.06);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(x, y + size * 0.06, size * 0.18, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  ctx.lineCap = "butt";
}

function drawObjectShadow(x, y, width, height, alpha = 0.1) {
  ctx.save();
  ctx.fillStyle = `rgba(36, 49, 43, ${alpha})`;
  ctx.beginPath();
  ctx.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawStarPath(x, y, outer, inner) {
  for (let index = 0; index < 10; index += 1) {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawStarShape(x, y, outer, inner, color) {
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(36, 49, 43, 0.12)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  drawStarPath(x, y, outer, inner);
  ctx.fill();
  ctx.stroke();
}

function drawHeartPath(x, y, size) {
  ctx.moveTo(x, y + size * 0.45);
  ctx.bezierCurveTo(x - size * 1.05, y - size * 0.18, x - size * 0.55, y - size * 0.92, x, y - size * 0.34);
  ctx.bezierCurveTo(x + size * 0.55, y - size * 0.92, x + size * 1.05, y - size * 0.18, x, y + size * 0.45);
  ctx.closePath();
}

function drawItem(item, x, y, size) {
  drawObjectShadow(x, y + size * 0.48, size * 0.38, size * 0.09, 0.08);

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

  if (item.id === "carrot") {
    ctx.fillStyle = palette.grassDark;
    ctx.beginPath();
    ctx.ellipse(x - size * 0.11, y - size * 0.38, size * 0.12, size * 0.28, -0.55, 0, Math.PI * 2);
    ctx.ellipse(x + size * 0.11, y - size * 0.38, size * 0.12, size * 0.28, 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.46);
    ctx.quadraticCurveTo(x - size * 0.34, y - size * 0.12, x, y - size * 0.3);
    ctx.quadraticCurveTo(x + size * 0.34, y - size * 0.12, x, y + size * 0.46);
    ctx.fill();
    drawCuteFace(x, y - size * 0.02, size * 0.36);
    return;
  }

  if (item.id === "fish") {
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.ellipse(x, y, size * 0.42, size * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + size * 0.36, y);
    ctx.lineTo(x + size * 0.66, y - size * 0.24);
    ctx.lineTo(x + size * 0.66, y + size * 0.24);
    ctx.closePath();
    ctx.fill();
    drawCuteFace(x - size * 0.09, y - size * 0.02, size * 0.32);
    return;
  }

  if (item.id === "balloon") {
    ctx.strokeStyle = palette.muted;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.34);
    ctx.quadraticCurveTo(x + size * 0.14, y + size * 0.62, x - size * 0.06, y + size * 0.82);
    ctx.stroke();
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.ellipse(x, y - size * 0.04, size * 0.34, size * 0.42, -0.12, 0, Math.PI * 2);
    ctx.fill();
    drawCuteFace(x, y - size * 0.04, size * 0.34);
    return;
  }

  if (item.id === "star-treat") {
    drawStarShape(x, y, size * 0.46, size * 0.22, item.color);
    drawCuteFace(x, y + size * 0.02, size * 0.3);
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
    drawCuteFace(x, y + size * 0.02, size * 0.26);
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
  drawCuteFace(x, y, size * 0.24);
}

function drawShapeToken(token, x, y, size) {
  drawObjectShadow(x + 3, y + size * 0.4, size * 0.34, size * 0.08, 0.08);
  ctx.fillStyle = token.color;
  ctx.strokeStyle = "rgba(36, 49, 43, 0.14)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  if (token.shape === "circle") {
    ctx.arc(x, y, size * 0.46, 0, Math.PI * 2);
  } else if (token.shape === "square") {
    ctx.roundRect(x - size * 0.42, y - size * 0.42, size * 0.84, size * 0.84, 10);
  } else if (token.shape === "heart") {
    drawHeartPath(x, y + size * 0.06, size * 0.48);
  } else if (token.shape === "star") {
    drawStarPath(x, y, size * 0.5, size * 0.24);
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
  ctx.fillStyle = "rgba(255, 253, 244, 0.34)";
  ctx.beginPath();
  ctx.ellipse(x - size * 0.16, y - size * 0.2, size * 0.11, size * 0.07, -0.55, 0, Math.PI * 2);
  ctx.fill();
  drawCuteFace(x, y + size * 0.04, size * 0.34);
}

function drawParticles() {
  state.particles.forEach((particle) => {
    ctx.globalAlpha = Math.max(0, Math.min(1, particle.life / 0.75));
    if (particle.shape === "star") {
      drawStarShape(particle.x, particle.y, 10, 5, particle.color);
    } else if (particle.shape === "heart") {
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      drawHeartPath(particle.x, particle.y, 8);
      ctx.fill();
    } else {
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.globalAlpha = 1;
}

function render() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawBackground();
  drawChallenge();
  drawGarden();
  drawSpeechBubble();
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
    unlockedAnimals: animalFriends.slice(0, state.unlockedAnimals).map((friend) => friend.name),
    mascotMessage: state.mascotMessageTimer > 0 ? state.mascotMessage : "",
    prompt: challenge.prompt,
    promptAudioKey: challenge.promptAudioKey,
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

if ("speechSynthesis" in window) {
  window.speechSynthesis.addEventListener?.("voiceschanged", () => {
    preferredSpeechVoice = chooseSpeechVoice();
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
