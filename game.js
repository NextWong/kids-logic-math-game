const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  ageButtons: document.querySelectorAll(".age-button"),
  choices: document.getElementById("choices"),
  difficulty: document.getElementById("difficultyLabel"),
  feedback: document.getElementById("feedbackText"),
  languageButtons: document.querySelectorAll(".language-button"),
  modeLabel: document.getElementById("modeLabel"),
  modeButtons: document.querySelectorAll(".mode-button"),
  next: document.getElementById("nextBtn"),
  prompt: document.getElementById("promptText"),
  round: document.getElementById("roundLabel"),
  speak: document.getElementById("speakBtn"),
  star: document.getElementById("starMeter"),
  title: document.querySelector("h1"),
};

const WIDTH = 960;
const HEIGHT = 620;
const FLOOR_Y = 472;
const AUDIO_VERSION = "7";
const PROMPT_AUDIO_BASE = "./audio/prompts";
const MODE_LABELS = {
  mixed: { zh: "混合练习", en: "Mixed" },
  count: { zh: "数数练习", en: "Counting" },
  add: { zh: "算数练习", en: "Math" },
  pattern: { zh: "规律练习", en: "Patterns" },
  logic: { zh: "逻辑练习", en: "Logic" },
};
const MODE_BUTTON_LABELS = {
  mixed: { zh: "混合", en: "Mix" },
  count: { zh: "数数", en: "Count" },
  add: { zh: "算数", en: "Math" },
  pattern: { zh: "规律", en: "Pattern" },
  logic: { zh: "逻辑", en: "Logic" },
};
const UI_TEXT = {
  title: { zh: "小兔子闯关花园", en: "Bunny Quest Garden" },
  listen: { zh: "听", en: "Hear" },
  next: { zh: "换", en: "Next" },
  nextLevel: { zh: "下一关", en: "Next" },
  stars: { zh: "颗星", en: "stars" },
  levelClear: { zh: "闯关成功！", en: "Level clear!" },
};
const AGE_CONFIGS = {
  3: {
    rounds: 6,
    maxCount: 4,
    maxSum: 4,
    addPartMax: 2,
    patternLevel: 1,
    compareMax: 0,
    logicTypes: ["match"],
    mathTypes: ["add"],
    mixedTypes: ["count", "count", "count", "add", "pattern", "logic"],
    difficultyZh: "3岁：数到4，4以内加法，AB规律，只找一样。",
    difficultyEn: "Age 3: count to 4, sums to 4, AB patterns, match only.",
  },
  4: {
    rounds: 6,
    maxCount: 7,
    maxSum: 7,
    addPartMax: 4,
    patternLevel: 2,
    compareMax: 6,
    logicTypes: ["match", "odd", "pair", "compare"],
    mathTypes: ["add"],
    mixedTypes: ["count", "count", "add", "pattern", "logic", "logic"],
    difficultyZh: "4岁：数到7，7以内加法，找不同、配对和比较多少。",
    difficultyEn: "Age 4: count to 7, sums to 7, odd one, pairs, more/less.",
  },
  5: {
    rounds: 7,
    maxCount: 12,
    maxSum: 12,
    addPartMax: 6,
    patternLevel: 3,
    compareMax: 8,
    logicTypes: ["match", "odd", "pair", "compare", "sequence"],
    mathTypes: ["add", "subtract"],
    sequenceSteps: [1, 2],
    mixedTypes: ["count", "add", "subtract", "subtract", "pattern", "logic", "logic"],
    difficultyZh: "5岁：数到12，12以内加减法，数字规律和复杂图形规律。",
    difficultyEn: "Age 5: count to 12, add/subtract to 12, number and shape patterns.",
  },
  6: {
    rounds: 8,
    maxCount: 16,
    maxSum: 16,
    addPartMax: 9,
    patternLevel: 5,
    compareMax: 10,
    logicTypes: ["odd", "pair", "compare", "sequence"],
    mathTypes: ["add", "subtract", "missing-addend"],
    sequenceSteps: [2, 3, 4],
    mixedTypes: ["count", "add", "subtract", "missing-addend", "missing-addend", "pattern", "logic", "logic"],
    difficultyZh: "6岁：数到16，16以内加减法，缺数加法和2/3/4跳数规律。",
    difficultyEn: "Age 6: count to 16, add/subtract to 16, missing addends, skip-counting.",
  },
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
  { id: "red-circle", shape: "circle", color: palette.red, name: "红圆", nameZh: "红圆", nameEn: "red circle" },
  { id: "blue-square", shape: "square", color: palette.blue, name: "蓝方块", nameZh: "蓝方块", nameEn: "blue square" },
  { id: "yellow-triangle", shape: "triangle", color: palette.yellow, name: "黄三角", nameZh: "黄三角", nameEn: "yellow triangle" },
  { id: "violet-diamond", shape: "diamond", color: palette.violet, name: "紫菱形", nameZh: "紫菱形", nameEn: "purple diamond" },
  { id: "teal-circle", shape: "circle", color: palette.teal, name: "绿圆", nameZh: "绿圆", nameEn: "green circle" },
  { id: "pink-heart", shape: "heart", color: palette.pink, name: "粉爱心", nameZh: "粉爱心", nameEn: "pink heart" },
  { id: "orange-star", shape: "star", color: palette.orange, name: "橙星星", nameZh: "橙星星", nameEn: "orange star" },
];

const itemKinds = [
  { id: "flower", label: "小花", labelZh: "小花", labelEn: "flowers", color: palette.red },
  { id: "berry", label: "果子", labelZh: "果子", labelEn: "berries", color: palette.violet },
  { id: "carrot", label: "胡萝卜", labelZh: "胡萝卜", labelEn: "carrots", color: palette.orange },
  { id: "fish", label: "小鱼", labelZh: "小鱼", labelEn: "fish", color: palette.blue },
  { id: "balloon", label: "气球", labelZh: "气球", labelEn: "balloons", color: palette.pink },
  { id: "star-treat", label: "星星糖", labelZh: "星星糖", labelEn: "star treats", color: palette.yellow },
];

const animalFriends = [
  { id: "bunny", name: "兔兔", nameZh: "兔兔", nameEn: "Bunny", body: palette.white, accent: palette.pink },
  { id: "panda", name: "熊猫", nameZh: "熊猫", nameEn: "Panda", body: palette.panda, accent: palette.ink },
  { id: "fox", name: "小狐狸", nameZh: "小狐狸", nameEn: "Fox", body: palette.fox, accent: palette.white },
  { id: "chick", name: "小鸡", nameZh: "小鸡", nameEn: "Chick", body: palette.yellow, accent: palette.orange },
  { id: "kitty", name: "小猫", nameZh: "小猫", nameEn: "Kitty", body: palette.cream, accent: palette.brown },
];
const activityKinds = [
  { id: "swing", zh: "荡秋千", en: "swinging", promptEn: "play on the swing", lineEn: "are swinging" },
  { id: "dance", zh: "跳舞", en: "dancing", promptEn: "dance", lineEn: "are dancing" },
  { id: "climb", zh: "攀岩", en: "climbing", promptEn: "climb", lineEn: "are climbing" },
  { id: "ball", zh: "玩球", en: "playing ball", promptEn: "play ball", lineEn: "are playing ball" },
];
const animalActionKinds = [
  { id: "jump", zh: "跳起来啦", en: "jumps" },
  { id: "wave", zh: "挥挥手", en: "waves" },
  { id: "dance", zh: "跳舞啦", en: "dances" },
  { id: "spin", zh: "转圈圈", en: "spins" },
  { id: "peek", zh: "躲猫猫", en: "plays peekaboo" },
  { id: "heart", zh: "送爱心", en: "sends hearts" },
];

const state = {
  age: 3,
  language: "zh",
  mode: "mixed",
  level: 1,
  levelProgress: 0,
  round: 1,
  stars: 0,
  adventure: "question",
  challenge: null,
  feedback: "idle",
  feedbackMessage: "",
  feedbackTimer: 0,
  autoNextTimer: 0,
  rewardTimer: 0,
  rewardAnimal: null,
  rewardActivity: activityKinds[0],
  triedKeys: new Set(),
  lastSelectedKey: "",
  garden: [],
  unlockedAnimals: 1,
  animalBounce: 0,
  activeAnimalAction: null,
  lastAnimalActionId: "",
  mascotMessage: "摸摸小动物，一起闯关！",
  mascotMessageTimer: 4000,
  particles: [],
  time: 0,
};

let lastFrame = 0;
let preferredSpeechVoice = null;
let promptAudio = null;
let promptAudioSrc = "";

function isPhoneLayout() {
  return window.matchMedia?.("(max-width: 720px)").matches ?? window.innerWidth <= 720;
}

function phoneScale(value, scale = 1.28) {
  return isPhoneLayout() ? value * scale : value;
}

function localize(zh, en) {
  return state.language === "en" ? en : zh;
}

function uiText(key) {
  const entry = UI_TEXT[key];
  return entry ? localize(entry.zh, entry.en) : key;
}

function modeLabel(mode) {
  const entry = MODE_LABELS[mode] || MODE_LABELS.mixed;
  return localize(entry.zh, entry.en);
}

function modeButtonLabel(mode) {
  const entry = MODE_BUTTON_LABELS[mode] || MODE_BUTTON_LABELS.mixed;
  return localize(entry.zh, entry.en);
}

function ageConfig() {
  return AGE_CONFIGS[state.age] || AGE_CONFIGS[3];
}

function difficultyLabel() {
  const config = ageConfig();
  return localize(config.difficultyZh, config.difficultyEn);
}

function levelGoal() {
  return ageConfig().rounds;
}

function itemLabel(item) {
  return localize(item.labelZh || item.label, item.labelEn || item.label);
}

function shapeName(token) {
  return localize(token.nameZh || token.name, token.nameEn || token.name);
}

function animalName(friend) {
  return localize(friend.nameZh || friend.name, friend.nameEn || friend.name);
}

function challengePrompt(challenge = state.challenge) {
  if (!challenge) return "";
  return localize(challenge.promptZh || challenge.prompt, challenge.promptEn || challenge.prompt);
}

function challengeAnswerText(challenge = state.challenge) {
  if (!challenge) return "";
  return localize(challenge.answerTextZh || challenge.answerText, challenge.answerTextEn || challenge.answerText);
}

function choiceLabel(choice) {
  if (choice.type === "number") return String(choice.value);
  if (choice.type === "shape") return shapeName(choice.token);
  return localize(choice.labelZh, choice.labelEn);
}

function bilingualFeedback(zh, en) {
  return `${zh} ${en}`;
}

function makeMathChallenge() {
  const type = sample(ageConfig().mathTypes);
  if (type === "subtract") return makeSubtractChallenge();
  if (type === "missing-addend") return makeMissingAddendChallenge();
  return makeAddChallenge();
}

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
  const config = ageConfig();
  const count = randomInt(1, config.maxCount);
  const item = sample(itemKinds);
  const promptAudioKey = `count-${item.id}-${count}`;
  return {
    type: "count",
    promptZh: `花园里有几颗${item.labelZh}？`,
    promptEn: `How many ${item.labelEn} are in the garden?`,
    promptAudioKey,
    promptAudio: count <= 6 ? promptAudioPath(promptAudioKey) : "",
    answerKey: String(count),
    answerTextZh: String(count),
    answerTextEn: String(count),
    choices: numberChoices(count, 1, config.maxCount),
    scene: { count, item },
  };
}

function makeAddChallenge() {
  const config = ageConfig();
  const left = randomInt(1, Math.min(config.addPartMax, config.maxSum - 1));
  const right = randomInt(1, Math.min(config.addPartMax, config.maxSum - left));
  const total = left + right;
  const item = sample(itemKinds);
  const promptAudioKey = `add-${item.id}-${left}-${right}`;
  return {
    type: "add",
    promptZh: `${left} 加 ${right}，一共有几颗${item.labelZh}？`,
    promptEn: `${left} plus ${right}. How many ${item.labelEn} altogether?`,
    promptAudioKey,
    promptAudio: total <= 6 && left <= 3 ? promptAudioPath(promptAudioKey) : "",
    answerKey: String(total),
    answerTextZh: String(total),
    answerTextEn: String(total),
    choices: numberChoices(total, 1, config.maxSum),
    scene: { left, right, item },
  };
}

function makeSubtractChallenge() {
  const config = ageConfig();
  const total = randomInt(3, config.maxSum);
  const remove = randomInt(1, Math.min(total - 1, config.addPartMax));
  const answer = total - remove;
  const item = sample(itemKinds);
  return {
    type: "subtract",
    promptZh: `${total} 减 ${remove}，还剩几颗${item.labelZh}？`,
    promptEn: `${total} take away ${remove}. How many ${item.labelEn} are left?`,
    promptAudioKey: "",
    promptAudio: "",
    answerKey: String(answer),
    answerTextZh: String(answer),
    answerTextEn: String(answer),
    choices: numberChoices(answer, 1, config.maxSum),
    scene: { total, remove, item },
  };
}

function makeMissingAddendChallenge() {
  const config = ageConfig();
  const left = randomInt(1, Math.min(config.addPartMax, config.maxSum - 2));
  const missing = randomInt(1, Math.min(config.addPartMax, config.maxSum - left));
  const total = left + missing;
  const item = sample(itemKinds);
  return {
    type: "missing-addend",
    promptZh: `${left} 加几，等于 ${total}？`,
    promptEn: `${left} plus what makes ${total}?`,
    promptAudioKey: "",
    promptAudio: "",
    answerKey: String(missing),
    answerTextZh: String(missing),
    answerTextEn: String(missing),
    choices: numberChoices(missing, 1, Math.max(config.addPartMax, 8)),
    scene: { left, missing, total, item },
  };
}

function makePatternChallenge() {
  const selected = shuffle(shapeTokens).slice(0, ageConfig().patternLevel >= 5 ? 4 : 3);
  const patterns = [
    { level: 1, slots: [0, 1, 0, 1, 0, null], answer: 1 },
    { level: 1, slots: [0, 0, 1, 0, 0, null], answer: 1 },
    { level: 2, slots: [0, 1, 2, 0, 1, null], answer: 2 },
    { level: 3, slots: [0, 1, 1, 0, 1, null], answer: 1 },
    { level: 4, slots: [0, 1, 2, 1, 0, null], answer: 1 },
    { level: 5, slots: [0, 1, 2, 3, 0, null], answer: 1 },
  ];
  const pattern = sample(patterns.filter((entry) => entry.level <= ageConfig().patternLevel));
  const answerToken = selected[pattern.answer];
  const distractors = shuffle(shapeTokens.filter((token) => token.id !== answerToken.id)).slice(0, 3);
  const choices = shuffle([answerToken, ...distractors]).map((token) => ({
    type: "shape",
    key: token.id,
    token,
  }));

  return {
    type: "pattern",
    promptZh: "接下来应该是哪一个图形？",
    promptEn: "Which shape comes next?",
    promptAudioKey: "pattern-next-shape",
    promptAudio: promptAudioPath("pattern-next-shape"),
    answerKey: answerToken.id,
    answerTextZh: answerToken.nameZh,
    answerTextEn: answerToken.nameEn,
    choices,
    scene: {
      slots: pattern.slots.map((tokenIndex) => (tokenIndex === null ? null : selected[tokenIndex])),
      answer: answerToken,
    },
  };
}

function shapeChoices(answerToken) {
  const distractors = shuffle(shapeTokens.filter((token) => token.id !== answerToken.id)).slice(0, 3);
  return shuffle([answerToken, ...distractors]).map((token) => ({
    type: "shape",
    key: token.id,
    token,
  }));
}

function makeLogicMatchChallenge() {
  const target = sample(shapeTokens);
  return {
    type: "logic-match",
    promptZh: "找一个和中间一样的图形？",
    promptEn: "Find the shape that is the same.",
    promptAudioKey: "logic-find-same",
    promptAudio: promptAudioPath("logic-find-same"),
    answerKey: target.id,
    answerTextZh: target.nameZh,
    answerTextEn: target.nameEn,
    choices: shapeChoices(target),
    scene: { target },
  };
}

function makeLogicOddChallenge() {
  const base = sample(shapeTokens);
  const odd = sample(shapeTokens.filter((token) => token.id !== base.id));
  return {
    type: "logic-odd",
    promptZh: "哪一个不一样？",
    promptEn: "Which one is different?",
    promptAudioKey: "logic-odd-one",
    promptAudio: promptAudioPath("logic-odd-one"),
    answerKey: odd.id,
    answerTextZh: odd.nameZh,
    answerTextEn: odd.nameEn,
    choices: shapeChoices(odd),
    scene: { slots: shuffle([base, base, base, odd]), odd },
  };
}

function makeLogicPairChallenge() {
  const pair = shuffle(shapeTokens).slice(0, 2);
  const answer = pair[1];
  return {
    type: "logic-pair",
    promptZh: "空格里应该放哪一个？",
    promptEn: "Which one belongs in the empty space?",
    promptAudioKey: "logic-complete-pair",
    promptAudio: promptAudioPath("logic-complete-pair"),
    answerKey: answer.id,
    answerTextZh: answer.nameZh,
    answerTextEn: answer.nameEn,
    choices: shapeChoices(answer),
    scene: { slots: [pair[0], pair[1], pair[0], null], answer },
  };
}

function makeCompareChallenge() {
  const config = ageConfig();
  const max = config.compareMax || Math.min(config.maxCount, 9);
  const item = sample(itemKinds);
  const left = randomInt(1, max);
  const right = randomInt(1, max);
  const answerKey = left === right ? "same" : left > right ? "left" : "right";
  return {
    type: "compare",
    promptZh: "哪边更多？",
    promptEn: "Which side has more?",
    promptAudioKey: "",
    promptAudio: "",
    answerKey,
    answerTextZh: answerKey === "same" ? "一样多" : answerKey === "left" ? "左边" : "右边",
    answerTextEn: answerKey === "same" ? "same" : answerKey,
    choices: [
      { type: "text", key: "left", labelZh: "左边", labelEn: "Left" },
      { type: "text", key: "right", labelZh: "右边", labelEn: "Right" },
      { type: "text", key: "same", labelZh: "一样多", labelEn: "Same" },
    ],
    scene: { left, right, item },
  };
}

function makeSequenceChallenge() {
  const config = ageConfig();
  const step = sample(config.sequenceSteps || [1]);
  const startMax = Math.max(1, config.maxCount - step * 4);
  const start = randomInt(1, startMax);
  const slots = [start, start + step, start + step * 2, start + step * 3, null];
  const answer = start + step * 4;
  return {
    type: "sequence",
    promptZh: "接下来是哪个数字？",
    promptEn: "What number comes next?",
    promptAudioKey: "",
    promptAudio: "",
    answerKey: String(answer),
    answerTextZh: String(answer),
    answerTextEn: String(answer),
    choices: numberChoices(answer, 1, Math.max(config.maxCount, answer + 2)),
    scene: { slots, answer },
  };
}

function makeLogicChallenge() {
  const logicMakers = {
    match: makeLogicMatchChallenge,
    odd: makeLogicOddChallenge,
    pair: makeLogicPairChallenge,
    compare: makeCompareChallenge,
    sequence: makeSequenceChallenge,
  };
  const makers = ageConfig().logicTypes.map((type) => logicMakers[type]).filter(Boolean);
  return sample(makers)();
}

function makeChallenge() {
  if (state.mode === "count") return makeCountChallenge();
  if (state.mode === "add") return makeMathChallenge();
  if (state.mode === "pattern") return makePatternChallenge();
  if (state.mode === "logic") return makeLogicChallenge();
  const mixedMakers = {
    count: makeCountChallenge,
    add: makeAddChallenge,
    subtract: makeSubtractChallenge,
    "missing-addend": makeMissingAddendChallenge,
    pattern: makePatternChallenge,
    logic: makeLogicChallenge,
  };
  const makers = ageConfig().mixedTypes.map((type) => mixedMakers[type]).filter(Boolean);
  return sample(makers)();
}

function setChallenge(nextRound = false) {
  state.adventure = "question";
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
  button.setAttribute("aria-label", `${localize("答案", "Answer")} ${index + 1}: ${choiceLabel(choice)}`);

  if (choice.type === "number") {
    const number = document.createElement("span");
    number.className = "choice-number";
    number.textContent = choice.value;
    button.appendChild(number);
  } else if (choice.type === "shape") {
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
  } else {
    const label = document.createElement("span");
    label.className = "choice-label";
    label.textContent = choiceLabel(choice);
    button.appendChild(label);
  }

  button.addEventListener("click", () => selectChoice(choice.key));
  return button;
}

function renderChoices() {
  ui.choices.replaceChildren();
  ui.choices.dataset.count = state.adventure === "question" && state.challenge ? String(state.challenge.choices.length) : "0";
  if (state.adventure !== "question" || !state.challenge) return;
  state.challenge.choices.forEach((choice, index) => ui.choices.appendChild(choiceToNode(choice, index)));
}

function syncDom() {
  document.documentElement.lang = state.language === "en" ? "en" : "zh-CN";
  ui.title.textContent = uiText("title");
  ui.difficulty.textContent = difficultyLabel();
  ui.prompt.textContent = state.adventure === "reward" ? rewardPrompt() : challengePrompt();
  ui.feedback.textContent = state.feedbackMessage;
  ui.round.textContent =
    state.adventure === "reward"
      ? localize(`第 ${state.level} 关完成`, `Level ${state.level} clear`)
      : localize(`第 ${state.level} 关 · ${state.levelProgress + 1}/${levelGoal()}`, `Level ${state.level} · ${state.levelProgress + 1}/${levelGoal()}`);
  ui.star.textContent = localize(`${state.age}岁 · ${state.stars} ${uiText("stars")}`, `Age ${state.age} · ${state.stars} ${uiText("stars")}`);
  ui.modeLabel.textContent = modeLabel(state.mode);
  ui.speak.textContent = uiText("listen");
  ui.next.textContent = state.adventure === "reward" ? uiText("nextLevel") : uiText("next");
  ui.modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.mode);
    button.textContent = modeButtonLabel(button.dataset.mode);
  });
  ui.ageButtons.forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.age) === state.age);
    button.textContent = state.language === "en" ? `Age ${button.dataset.age}` : `${button.dataset.age}岁`;
  });
  ui.languageButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.language === state.language);
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
  if (state.adventure !== "question" || state.feedback === "correct") return;
  state.lastSelectedKey = key;
  if (key === state.challenge.answerKey) {
    state.feedback = "correct";
    state.feedbackMessage = bilingualFeedback("太棒了，答对了！", "Yes, that's correct!");
    state.feedbackTimer = 1300;
    state.stars += 1;
    state.levelProgress += 1;
    if (state.levelProgress >= levelGoal()) {
      completeLevel();
    } else {
      state.autoNextTimer = 1350;
      state.mascotMessage = sample([
        localize("太棒啦！", "Great job!"),
        localize("你真会观察！", "Great observing!"),
        localize("继续闯关！", "Keep going!"),
      ]);
      state.mascotMessageTimer = 1800;
      state.animalBounce = 1;
      addGardenBloom();
      burstParticles();
    }
    playSound("correct");
  } else {
    state.feedback = "wrong";
    state.feedbackMessage = bilingualFeedback("再想想哦。", "Think again.");
    state.mascotMessage = localize("再试试！", "Try again!");
    state.mascotMessageTimer = 1800;
    state.animalBounce = 0.35;
    state.feedbackTimer = 1800;
    state.triedKeys.add(key);
    playSound("wrong");
  }
  syncDom();
  render();
}

function completeLevel() {
  const newFriendIndex = state.level < animalFriends.length ? state.level : -1;
  const rewardFriend = newFriendIndex > 0 ? animalFriends[newFriendIndex] : sample(animalFriends.slice(1));
  if (newFriendIndex > 0) state.unlockedAnimals = Math.max(state.unlockedAnimals, newFriendIndex + 1);
  state.rewardAnimal = rewardFriend;
  state.rewardActivity = sample(activityKinds);
  state.adventure = "reward";
  state.feedback = "level";
  state.feedbackMessage = bilingualFeedback("闯关成功！", "Level clear!");
  state.mascotMessage = localize(`${animalName(rewardFriend)}来一起玩啦！`, `${animalName(rewardFriend)} joins the game!`);
  state.mascotMessageTimer = 5200;
  state.rewardTimer = 5600;
  state.autoNextTimer = 0;
  state.animalBounce = 1.2;
  addGardenBloom();
  burstParticles();
  renderChoices();
}

function advanceLevel() {
  state.level += 1;
  state.levelProgress = 0;
  state.round = 1;
  state.rewardTimer = 0;
  state.rewardAnimal = null;
  state.adventure = "question";
  state.feedback = "idle";
  state.feedbackMessage = "";
  setChallenge(false);
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

function startAnimalAction(friend) {
  const choices = animalActionKinds.filter((action) => action.id !== state.lastAnimalActionId);
  const action = sample(choices.length ? choices : animalActionKinds);
  state.lastAnimalActionId = action.id;
  state.activeAnimalAction = {
    animalId: friend.id,
    type: action.id,
    labelZh: action.zh,
    labelEn: action.en,
    timer: 1500,
    duration: 1500,
    seed: Math.random() * Math.PI * 2,
  };
  if (action.id === "heart") {
    for (let index = 0; index < 8; index += 1) {
      state.particles.push({
        x: friend.x + randomInt(-42, 42),
        y: friend.y - randomInt(40, 120),
        vx: randomInt(-45, 45),
        vy: randomInt(-120, -45),
        life: 1,
        shape: "heart",
        color: sample([palette.pink, palette.red, palette.yellow]),
      });
    }
  }
  return action;
}

function animalActionFor(friend) {
  if (!state.activeAnimalAction || state.activeAnimalAction.animalId !== friend.id) return null;
  return state.activeAnimalAction;
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

function chooseSpeechVoice(language = state.language) {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const wantedVoices = voices.filter((voice) => (language === "en" ? /^en/i : /^zh/i).test(voice.lang));
  const naturalNames =
    language === "en"
      ? ["samantha", "karen", "daniel", "google us english", "google uk english"]
      : ["xiaoxiao", "tingting", "meijia", "sin-ji", "yunxi", "google 普通话", "google mandarin"];
  return (
    wantedVoices.find((voice) => naturalNames.some((name) => voice.name.toLowerCase().includes(name))) ||
    wantedVoices.find((voice) => voice.lang.toLowerCase() === (language === "en" ? "en-us" : "zh-cn")) ||
    wantedVoices[0] ||
    null
  );
}

function preloadPromptAudio() {
  const src = state.language === "zh" ? state.challenge?.promptAudio || "" : "";
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
  const utterance = new SpeechSynthesisUtterance(challengePrompt());
  const voice = preferredSpeechVoice || chooseSpeechVoice(state.language);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = state.language === "en" ? "en-US" : "zh-CN";
  }
  utterance.rate = state.language === "en" ? 0.86 : 0.82;
  utterance.pitch = 1.06;
  utterance.volume = 0.92;
  window.speechSynthesis.speak(utterance);
}

function speakPrompt() {
  if (!state.challenge) return;
  stopPromptAudio();
  const src = state.language === "zh" ? state.challenge.promptAudio : "";
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

  if (state.adventure === "reward") {
    state.rewardTimer = 250;
    playSound("animal");
    return;
  }

  if (state.feedback === "correct") {
    setChallenge(true);
    return;
  }

  const friend = hitAnimalFriend(point.x, point.y);
  if (friend) {
    const action = startAnimalAction(friend);
    state.mascotMessage = localize(`${animalName(friend)}${action.zh}！`, `${animalName(friend)} ${action.en}!`);
    state.mascotMessageTimer = 1500;
    state.animalBounce = 1;
    playSound("animal");
    syncDom();
    render();
    return;
  }

  state.mascotMessage = localize("听题目，再选答案！", "Listen, then choose!");
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
  const gap = isPhoneLayout() ? 176 : 148;
  const radius = isPhoneLayout() ? 76 : 48;
  const start = WIDTH / 2 - ((count - 1) * gap) / 2;
  return animalFriends.slice(0, count).map((friend, index) => ({
    ...friend,
    x: start + index * gap,
    y: FLOOR_Y + 82 + (index % 2) * 8,
    r: radius,
  }));
}

function hitAnimalFriend(x, y) {
  return friendSlots().find((friend) => Math.hypot(friend.x - x, friend.y - y) < friend.r + 18);
}

function update(dt) {
  state.time += dt;
  state.animalBounce = Math.max(0, state.animalBounce - dt * 2.4);
  state.mascotMessageTimer = Math.max(0, state.mascotMessageTimer - dt * 1000);
  if (state.activeAnimalAction) {
    state.activeAnimalAction.timer -= dt * 1000;
    if (state.activeAnimalAction.timer <= 0) state.activeAnimalAction = null;
  }
  if (state.adventure === "reward" && state.rewardTimer > 0) {
    state.rewardTimer -= dt * 1000;
    if (state.rewardTimer <= 0) {
      advanceLevel();
      return;
    }
  }
  if (state.feedback === "wrong" && state.feedbackTimer > 0) {
    state.feedbackTimer -= dt * 1000;
    if (state.feedbackTimer <= 0) {
      state.feedback = "idle";
      state.feedbackMessage = bilingualFeedback("可以继续选。", "Try again.");
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
  const action = animalActionFor(friend);
  const progress = action ? 1 - Math.max(0, action.timer) / action.duration : 0;
  const pulse = action ? Math.sin(progress * Math.PI) : 0;
  let bob = Math.sin(state.time * 3 + index * 1.7) * 2 - state.animalBounce * (16 - index * 1.5);
  let offsetX = 0;
  let offsetY = 0;
  let rotation = 0;
  let scaleX = 1;
  let scaleY = 1;
  if (action?.type === "jump") offsetY -= pulse * size * 0.78;
  if (action?.type === "dance") {
    offsetX += Math.sin(state.time * 15 + action.seed) * size * 0.14;
    rotation = Math.sin(state.time * 12 + action.seed) * 0.18;
  }
  if (action?.type === "spin") {
    rotation = progress * Math.PI * 2;
    scaleX = 0.9 + pulse * 0.12;
  }
  if (action?.type === "wave") rotation = Math.sin(state.time * 12 + action.seed) * 0.09;
  if (action?.type === "peek") {
    offsetY += pulse * size * 0.32;
    scaleY = 1 - pulse * 0.18;
  }
  if (action?.type === "heart") offsetY -= pulse * size * 0.24;
  const baseX = friend.x + offsetX;
  const baseY = friend.y + bob + offsetY;
  const x = 0;
  const y = 0;

  ctx.save();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(36, 49, 43, 0.12)";

  ctx.fillStyle = "rgba(36, 49, 43, 0.12)";
  ctx.beginPath();
  ctx.ellipse(baseX, friend.y + size * 0.52, size * 0.72, size * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(baseX, baseY);
  ctx.rotate(rotation);
  ctx.scale(scaleX, scaleY);

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
  if (action) drawAnimalActionEffect(action, baseX, baseY, size, progress);
}

function drawAnimalActionEffect(action, x, y, size, progress) {
  const pulse = Math.sin(progress * Math.PI);
  ctx.save();
  ctx.lineCap = "round";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (action.type === "wave") {
    ctx.strokeStyle = "rgba(36, 49, 43, 0.34)";
    ctx.lineWidth = 4;
    for (let index = 0; index < 3; index += 1) {
      ctx.beginPath();
      ctx.arc(x + size * 0.5 + index * 12, y - size * 0.18, 10 + index * 7, -0.7, 0.65);
      ctx.stroke();
    }
  }
  if (action.type === "dance") {
    ["♪", "♫"].forEach((note, index) => {
      ctx.fillStyle = index ? palette.violet : palette.teal;
      ctx.font = `900 ${24 + pulse * 10}px ui-rounded, system-ui, sans-serif`;
      ctx.fillText(note, x - size * 0.68 + index * size * 1.35, y - size * (0.8 + index * 0.1));
    });
  }
  if (action.type === "spin") {
    ctx.strokeStyle = "rgba(140, 111, 247, 0.42)";
    ctx.lineWidth = 5;
    ctx.setLineDash([12, 12]);
    ctx.beginPath();
    ctx.arc(x, y, size * (0.72 + pulse * 0.22), progress * Math.PI * 2, progress * Math.PI * 2 + Math.PI * 1.45);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (action.type === "peek") {
    ctx.fillStyle = "rgba(47, 155, 92, 0.88)";
    for (let index = 0; index < 5; index += 1) {
      ctx.beginPath();
      ctx.ellipse(x - size * 0.48 + index * size * 0.24, y + size * 0.42, size * 0.18, size * 0.34, -0.4 + index * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (action.type === "heart") {
    for (let index = 0; index < 3; index += 1) {
      ctx.fillStyle = [palette.pink, palette.red, palette.yellow][index];
      ctx.beginPath();
      drawHeartPath(x - size * 0.52 + index * size * 0.52, y - size * (0.86 + pulse * 0.35) - index * 9, size * 0.16);
      ctx.fill();
    }
  }
  if (action.type === "jump") {
    drawStarShape(x - size * 0.55, y + size * 0.42, size * 0.18, size * 0.08, palette.yellow);
    drawStarShape(x + size * 0.55, y + size * 0.38, size * 0.16, size * 0.07, palette.yellow);
  }
  ctx.restore();
}

function drawChallenge() {
  if (state.adventure === "reward") {
    drawRewardScene();
    return;
  }
  if (state.challenge.type === "count") drawCountChallenge();
  if (state.challenge.type === "add") drawAddChallenge();
  if (state.challenge.type === "subtract") drawSubtractChallenge();
  if (state.challenge.type === "missing-addend") drawMissingAddendChallenge();
  if (state.challenge.type === "pattern") drawPatternChallenge();
  if (state.challenge.type === "logic-match") drawLogicMatchChallenge();
  if (state.challenge.type === "logic-odd") drawLogicOddChallenge();
  if (state.challenge.type === "logic-pair") drawLogicPairChallenge();
  if (state.challenge.type === "compare") drawCompareChallenge();
  if (state.challenge.type === "sequence") drawSequenceChallenge();
}

function drawFormulaPanel(text, y = 398, width = 432) {
  const mobile = isPhoneLayout();
  const panelWidth = mobile ? Math.max(width, 500) : width;
  const panelHeight = mobile ? 72 : 64;
  const x = WIDTH / 2 - panelWidth / 2;
  drawObjectShadow(WIDTH / 2, y + panelHeight + 6, panelWidth * 0.42, 11, 0.08);
  ctx.save();
  ctx.fillStyle = "rgba(255, 253, 244, 0.94)";
  ctx.strokeStyle = "rgba(36, 49, 43, 0.16)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(x, y, panelWidth, panelHeight, 24);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = palette.ink;
  ctx.font = `950 ${mobile ? 52 : 44}px ui-rounded, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, WIDTH / 2, y + panelHeight / 2 + 2);
  ctx.restore();
}

function drawCountChallenge() {
  const { count, item } = state.challenge.scene;
  const mobile = isPhoneLayout();
  const maxColumns = count > 12 ? 4 : 3;
  const positions = mobile
    ? layoutPositions(count, 92, 158, 776, 292, maxColumns)
    : layoutPositions(count, 178, 166, 604, 288, maxColumns);
  const baseSize = count <= 6 ? 58 : count <= 9 ? 48 : count <= 12 ? 40 : 34;
  const scale = count <= 6 ? 1.46 : count <= 9 ? 1.2 : count <= 12 ? 1.1 : 1.04;
  drawQuestionBadge(localize("数一数", "Count"), 480, 142);
  positions.forEach((position, index) => {
    drawItem(item, position.x, position.y, phoneScale(baseSize + (index % 2) * 4, scale));
  });
}

function drawAddChallenge() {
  const { left, right, item } = state.challenge.scene;
  const mobile = isPhoneLayout();
  const maxGroup = Math.max(left, right);
  const itemSize = maxGroup > 7 ? 34 : maxGroup > 5 ? 38 : maxGroup > 3 ? 44 : 50;
  drawQuestionBadge(localize("合起来", "Add"), 480, 142);
  const leftLayout = mobile ? layoutPositions(left, 72, 176, 336, 214) : layoutPositions(left, 146, 190, 254, 190);
  const rightLayout = mobile ? layoutPositions(right, 552, 176, 336, 214) : layoutPositions(right, 560, 190, 254, 190);
  leftLayout.forEach((position) => drawItem(item, position.x, position.y, phoneScale(itemSize, maxGroup > 6 ? 1.26 : 1.4)));
  rightLayout.forEach((position) => drawItem(item, position.x, position.y, phoneScale(itemSize, maxGroup > 6 ? 1.26 : 1.4)));
  ctx.fillStyle = palette.ink;
  ctx.font = `950 ${mobile ? 54 : 44}px ui-rounded, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("+", 480, 286);
  drawFormulaPanel(`${left} + ${right} = ?`);
}

function drawSubtractChallenge() {
  const { total, remove, item } = state.challenge.scene;
  const mobile = isPhoneLayout();
  const maxColumns = total > 12 ? 4 : 3;
  const positions = mobile
    ? layoutPositions(total, 94, 164, 772, 224, maxColumns)
    : layoutPositions(total, 174, 174, 612, 214, maxColumns);
  const itemSize = total > 12 ? 33 : total > 9 ? 37 : total > 6 ? 44 : 50;
  drawQuestionBadge(localize("减一减", "Take away"), 480, 142);
  positions.forEach((position, index) => {
    const displaySize = phoneScale(itemSize, total > 10 ? 1.02 : total > 8 ? 1.08 : 1.2);
    drawItem(item, position.x, position.y, displaySize);
    if (index < remove) drawTakeAwayMark(position.x, position.y, displaySize);
  });
  drawFormulaPanel(`${total} - ${remove} = ?`);
}

function drawMissingAddendChallenge() {
  const { left, total, item } = state.challenge.scene;
  const mobile = isPhoneLayout();
  drawQuestionBadge(localize("缺哪个数", "Missing"), 480, 142);
  const itemSize = left > 7 ? 34 : left > 5 ? 38 : 46;
  const leftLayout = mobile ? layoutPositions(left, 142, 178, 296, 206) : layoutPositions(left, 180, 190, 252, 186);
  leftLayout.forEach((position) => drawItem(item, position.x, position.y, phoneScale(itemSize, left > 6 ? 1.18 : 1.34)));
  ctx.fillStyle = "rgba(255, 253, 244, 0.78)";
  ctx.strokeStyle = "rgba(36, 49, 43, 0.14)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(mobile ? 540 : 560, mobile ? 206 : 210, mobile ? 170 : 146, mobile ? 116 : 100, 22);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = palette.muted;
  ctx.font = `900 ${mobile ? 24 : 22}px ui-rounded, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(localize("总数", "Total"), mobile ? 625 : 633, mobile ? 230 : 232);
  drawNumberCard(total, mobile ? 625 : 633, mobile ? 282 : 282, mobile ? 78 : 68);
  drawFormulaPanel(`${left} + ? = ${total}`);
}

function drawTakeAwayMark(x, y, size) {
  ctx.save();
  ctx.strokeStyle = "rgba(232, 93, 117, 0.88)";
  ctx.lineWidth = Math.max(5, size * 0.09);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - size * 0.4, y - size * 0.4);
  ctx.lineTo(x + size * 0.4, y + size * 0.4);
  ctx.moveTo(x + size * 0.4, y - size * 0.4);
  ctx.lineTo(x - size * 0.4, y + size * 0.4);
  ctx.stroke();
  ctx.restore();
}

function drawPatternChallenge() {
  drawQuestionBadge(localize("找规律", "Pattern"), 480, 142);
  const mobile = isPhoneLayout();
  const startX = mobile ? 132 : 174;
  const gap = mobile ? 140 : 122;
  const cardSize = mobile ? 122 : 88;
  const tokenSize = mobile ? 90 : 58;
  state.challenge.scene.slots.forEach((token, index) => {
    const x = startX + index * gap;
    const y = 292;
    drawShapeCard(token, x, y, cardSize, tokenSize);
  });
}

function drawLogicMatchChallenge() {
  const { target } = state.challenge.scene;
  const mobile = isPhoneLayout();
  drawQuestionBadge(localize("找一样", "Match"), 480, 142);
  drawShapeCard(target, 480, 304, mobile ? 224 : 150, mobile ? 152 : 96);
  drawStarShape(352, 286, mobile ? 32 : 20, mobile ? 15 : 9, palette.yellow);
  drawStarShape(608, 286, mobile ? 32 : 20, mobile ? 15 : 9, palette.yellow);
}

function drawLogicOddChallenge() {
  drawQuestionBadge(localize("找不同", "Odd one"), 480, 142);
  const mobile = isPhoneLayout();
  const startX = mobile ? 234 : 270;
  const gap = mobile ? 164 : 140;
  const cardSize = mobile ? 150 : 104;
  const tokenSize = mobile ? 106 : 66;
  state.challenge.scene.slots.forEach((token, index) => {
    drawShapeCard(token, startX + index * gap, 302, cardSize, tokenSize);
  });
}

function drawLogicPairChallenge() {
  drawQuestionBadge(localize("配一配", "Pair"), 480, 142);
  const mobile = isPhoneLayout();
  const positions = [
    { x: mobile ? 390 : 410, y: mobile ? 250 : 252 },
    { x: mobile ? 570 : 550, y: mobile ? 250 : 252 },
    { x: mobile ? 390 : 410, y: mobile ? 402 : 376 },
    { x: mobile ? 570 : 550, y: mobile ? 402 : 376 },
  ];
  ctx.strokeStyle = "rgba(36, 49, 43, 0.12)";
  ctx.lineWidth = 5;
  ctx.setLineDash([10, 12]);
  ctx.beginPath();
  ctx.moveTo(480, mobile ? 174 : 202);
  ctx.lineTo(480, mobile ? 476 : 426);
  ctx.moveTo(mobile ? 300 : 346, mobile ? 326 : 314);
  ctx.lineTo(mobile ? 660 : 614, mobile ? 326 : 314);
  ctx.stroke();
  ctx.setLineDash([]);
  state.challenge.scene.slots.forEach((token, index) => {
    drawShapeCard(token, positions[index].x, positions[index].y, mobile ? 148 : 104, mobile ? 104 : 66);
  });
}

function drawCompareChallenge() {
  const { left, right, item } = state.challenge.scene;
  const mobile = isPhoneLayout();
  drawQuestionBadge(localize("比一比", "Compare"), 480, 142);
  drawGroupPanel(98, 178, 330, 250, localize("左边", "Left"));
  drawGroupPanel(532, 178, 330, 250, localize("右边", "Right"));
  const leftPositions = layoutPositions(left, 130, 222, 264, 166);
  const rightPositions = layoutPositions(right, 564, 222, 264, 166);
  const maxGroup = Math.max(left, right);
  const size = maxGroup > 6 ? 38 : maxGroup > 4 ? 44 : 50;
  leftPositions.forEach((position) => drawItem(item, position.x, position.y, phoneScale(size, mobile ? 1.25 : 1)));
  rightPositions.forEach((position) => drawItem(item, position.x, position.y, phoneScale(size, mobile ? 1.25 : 1)));
  ctx.fillStyle = palette.ink;
  ctx.font = "900 72px ui-rounded, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("?", 480, 302);
}

function drawSequenceChallenge() {
  drawQuestionBadge(localize("数字规律", "Numbers"), 480, 142);
  const slots = state.challenge.scene.slots;
  const gap = isPhoneLayout() ? 154 : 136;
  const startX = 480 - ((slots.length - 1) * gap) / 2;
  slots.forEach((value, index) => {
    drawNumberCard(value, startX + index * gap, 302, isPhoneLayout() ? 126 : 104);
  });
}

function drawGroupPanel(x, y, width, height, label) {
  ctx.fillStyle = "rgba(255, 253, 244, 0.52)";
  ctx.strokeStyle = "rgba(36, 49, 43, 0.12)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 22);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = palette.muted;
  ctx.font = "900 24px ui-rounded, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + width / 2, y + 28);
}

function drawNumberCard(value, x, y, cardSize) {
  ctx.fillStyle = "rgba(255, 253, 244, 0.9)";
  ctx.strokeStyle = "rgba(36, 49, 43, 0.16)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(x - cardSize / 2, y - cardSize / 2, cardSize, cardSize, 18);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = value === null ? palette.ink : palette.blue;
  ctx.font = `950 ${value === null ? 58 : 52}px ui-rounded, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(value === null ? "?" : String(value), x, y + 2);
}

function rewardPrompt() {
  const friend = state.rewardAnimal || animalFriends[1];
  const activity = state.rewardActivity || activityKinds[0];
  return localize(`找到${animalName(friend)}，一起${activity.zh}！`, `${animalName(friend)} and Bunny ${activity.promptEn}!`);
}

function drawRewardScene() {
  const friend = state.rewardAnimal || animalFriends[1];
  const activity = state.rewardActivity || activityKinds[0];
  const bounce = Math.sin(state.time * 4) * 8 - state.animalBounce * 10;
  drawRewardBanner(friend, activity);
  if (activity.id === "swing") drawSwingReward(friend, bounce);
  if (activity.id === "dance") drawDanceReward(friend, bounce);
  if (activity.id === "climb") drawClimbReward(friend, bounce);
  if (activity.id === "ball") drawBallReward(friend, bounce);
}

function drawRewardBanner(friend, activity) {
  ctx.fillStyle = "rgba(255, 253, 244, 0.88)";
  ctx.strokeStyle = "rgba(36, 49, 43, 0.13)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(194, 92, 572, 86, 30);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = palette.ink;
  ctx.font = "950 34px ui-rounded, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(uiText("levelClear"), 480, 118);
  ctx.fillStyle = palette.muted;
  ctx.font = "900 24px ui-rounded, system-ui, sans-serif";
  ctx.fillText(localize(`${animalName(friend)}和兔兔一起${activity.zh}`, `${animalName(friend)} and Bunny ${activity.lineEn}`), 480, 152);
}

function rewardFriends(friend, bunnyX, friendX, y, bounce = 0) {
  drawAnimalFriend({ ...animalFriends[0], x: bunnyX, y: y + bounce, r: 82 }, 0);
  drawAnimalFriend({ ...friend, x: friendX, y: y - bounce * 0.7, r: 76 }, 1);
}

function drawSwingReward(friend, bounce) {
  ctx.strokeStyle = palette.brown;
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(250, 214);
  ctx.lineTo(760, 214);
  ctx.stroke();
  ctx.strokeStyle = "rgba(36, 49, 43, 0.38)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(390, 214);
  ctx.lineTo(360, 360 + bounce);
  ctx.moveTo(610, 214);
  ctx.lineTo(640, 360 - bounce);
  ctx.stroke();
  ctx.fillStyle = palette.orange;
  ctx.beginPath();
  ctx.roundRect(324, 360 + bounce, 112, 22, 12);
  ctx.roundRect(584, 360 - bounce, 112, 22, 12);
  ctx.fill();
  rewardFriends(friend, 378, 638, 402, bounce * 0.35);
}

function drawDanceReward(friend, bounce) {
  ["♪", "♫", "♪"].forEach((note, index) => {
    ctx.fillStyle = [palette.violet, palette.red, palette.teal][index];
    ctx.font = "900 44px ui-rounded, system-ui, sans-serif";
    ctx.fillText(note, 330 + index * 150, 240 + Math.sin(state.time * 3 + index) * 12);
  });
  drawStarShape(480, 346, 46, 22, palette.yellow);
  rewardFriends(friend, 382, 622, 390, bounce);
}

function drawClimbReward(friend, bounce) {
  ctx.fillStyle = "rgba(255, 253, 244, 0.64)";
  ctx.strokeStyle = "rgba(36, 49, 43, 0.12)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(318, 202, 324, 260, 24);
  ctx.fill();
  ctx.stroke();
  [0, 1, 2, 3, 4, 5, 6].forEach((index) => {
    ctx.fillStyle = [palette.red, palette.blue, palette.yellow, palette.violet, palette.teal, palette.orange, palette.pink][index];
    ctx.beginPath();
    ctx.ellipse(370 + ((index * 77) % 236), 238 + index * 32, 22, 13, index * 0.4, 0, Math.PI * 2);
    ctx.fill();
  });
  drawAnimalFriend({ ...animalFriends[0], x: 390, y: 382 + bounce * 0.2, r: 68 }, 0);
  drawAnimalFriend({ ...friend, x: 570, y: 344 - bounce * 0.2, r: 68 }, 1);
}

function drawBallReward(friend, bounce) {
  ctx.fillStyle = palette.sun;
  ctx.strokeStyle = "rgba(36, 49, 43, 0.16)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(480, 358 + bounce, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(36, 49, 43, 0.16)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(480, 358 + bounce, 36, 0, Math.PI * 2);
  ctx.moveTo(422, 358 + bounce);
  ctx.lineTo(538, 358 + bounce);
  ctx.stroke();
  rewardFriends(friend, 334, 666, 398, bounce * 0.5);
}

function drawShapeCard(token, x, y, cardSize, tokenSize) {
  ctx.fillStyle = "rgba(255, 253, 244, 0.88)";
  ctx.strokeStyle = "rgba(36, 49, 43, 0.16)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(x - cardSize / 2, y - cardSize / 2, cardSize, cardSize, 18);
  ctx.fill();
  ctx.stroke();
  if (token) {
    drawShapeToken(token, x, y, tokenSize);
  } else {
    ctx.fillStyle = palette.ink;
    ctx.font = "900 54px ui-rounded, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", x, y + 2);
  }
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

function layoutPositions(count, x, y, width, height, maxColumns = 3) {
  const columns = count <= maxColumns ? count : maxColumns;
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
  if (state.adventure !== "reward") {
    drawGarden();
    drawSpeechBubble();
  }
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
  resetQuest();
  setChallenge(false);
}

function resetQuest() {
  state.round = 1;
  state.level = 1;
  state.levelProgress = 0;
  state.stars = 0;
  state.garden = [];
  state.particles = [];
  state.unlockedAnimals = 1;
  state.activeAnimalAction = null;
  state.lastAnimalActionId = "";
  state.adventure = "question";
  state.rewardTimer = 0;
  state.rewardAnimal = null;
  state.feedback = "idle";
  state.feedbackMessage = "";
  state.mascotMessage = localize("摸摸小动物，一起闯关！", "Tap an animal. Let's play!");
  state.mascotMessageTimer = 3600;
}

function setAge(age) {
  state.age = age;
  resetQuest();
  setChallenge(false);
}

function setLanguage(language) {
  state.language = language;
  preferredSpeechVoice = chooseSpeechVoice(language);
  if (state.adventure === "question" && state.feedback === "idle") {
    state.mascotMessage = localize("摸摸小动物，一起闯关！", "Tap an animal. Let's play!");
    state.mascotMessageTimer = 2600;
  }
  if (state.adventure === "question") renderChoices();
  preloadPromptAudio();
  syncDom();
  render();
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
  ui.next.addEventListener("click", () => {
    if (state.adventure === "reward") {
      advanceLevel();
      return;
    }
    setChallenge(false);
  });
  ui.speak.addEventListener("click", speakPrompt);
  ui.modeButtons.forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });
  ui.ageButtons.forEach((button) => {
    button.addEventListener("click", () => setAge(Number(button.dataset.age)));
  });
  ui.languageButtons.forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.language));
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "f" || event.key === "F") {
      toggleFullscreen();
      return;
    }
    const index = Number(event.key) - 1;
    if (state.adventure === "question" && Number.isInteger(index) && index >= 0 && index < state.challenge.choices.length) {
      selectChoice(state.challenge.choices[index].key);
    }
    if (event.key === "Enter") {
      if (state.adventure === "reward") advanceLevel();
      else setChallenge(false);
    }
  });
}

function renderGameToText() {
  const challenge = state.challenge;
  const payload = {
    coordinateSystem: "canvas 960x620, origin top-left, x increases right, y increases down",
    age: state.age,
    language: state.language,
    mode: state.mode,
    adventure: state.adventure,
    level: state.level,
    levelProgress: state.levelProgress,
    levelGoal: levelGoal(),
    difficulty: difficultyLabel(),
    round: state.round,
    stars: state.stars,
    feedback: state.feedback,
    feedbackMessage: state.feedbackMessage,
    unlockedAnimals: animalFriends.slice(0, state.unlockedAnimals).map((friend) => animalName(friend)),
    animalAction: state.activeAnimalAction
      ? {
          animalId: state.activeAnimalAction.animalId,
          type: state.activeAnimalAction.type,
          label: localize(state.activeAnimalAction.labelZh, state.activeAnimalAction.labelEn),
        }
      : null,
    mascotMessage: state.mascotMessageTimer > 0 ? state.mascotMessage : "",
    reward:
      state.adventure === "reward"
        ? {
            animal: state.rewardAnimal ? animalName(state.rewardAnimal) : "",
            activity: state.rewardActivity ? localize(state.rewardActivity.zh, state.rewardActivity.en) : "",
            prompt: rewardPrompt(),
          }
        : null,
    prompt: state.adventure === "reward" ? rewardPrompt() : challengePrompt(challenge),
    promptAudioKey: state.adventure === "reward" ? "" : challenge?.promptAudioKey || "",
    answer: state.adventure === "reward" ? "" : challengeAnswerText(challenge),
    choices:
      state.adventure === "question" && challenge
        ? challenge.choices.map((choice, index) => ({
            index: index + 1,
            key: choice.key,
            label: choiceLabel(choice),
          }))
        : [],
    scene: state.adventure === "reward" || !challenge ? null : renderSceneText(challenge),
  };
  return JSON.stringify(payload);
}

function renderSceneText(challenge) {
  if (challenge.type === "pattern" || challenge.type === "logic-odd" || challenge.type === "logic-pair") {
    return {
      type: challenge.type,
      slots: challenge.scene.slots.map((slot) => (slot ? shapeName(slot) : "?")),
    };
  }
  if (challenge.type === "logic-match") {
    return {
      type: challenge.type,
      target: shapeName(challenge.scene.target),
    };
  }
  if (challenge.type === "compare") {
    return {
      type: challenge.type,
      item: itemLabel(challenge.scene.item),
      left: challenge.scene.left,
      right: challenge.scene.right,
    };
  }
  if (challenge.type === "sequence") {
    return {
      type: challenge.type,
      slots: challenge.scene.slots.map((slot) => (slot === null ? "?" : String(slot))),
    };
  }
  if (challenge.type === "subtract") {
    return {
      type: challenge.type,
      item: itemLabel(challenge.scene.item),
      total: challenge.scene.total,
      remove: challenge.scene.remove,
    };
  }
  if (challenge.type === "missing-addend") {
    return {
      type: challenge.type,
      item: itemLabel(challenge.scene.item),
      left: challenge.scene.left,
      total: challenge.scene.total,
    };
  }
  return {
    type: challenge.type,
    item: itemLabel(challenge.scene.item),
    count: challenge.scene.count,
    left: challenge.scene.left,
    right: challenge.scene.right,
  };
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
