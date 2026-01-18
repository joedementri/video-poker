const PAY_TABLE = {
  "Royal Flush": [250, 500, 750, 1000, 4000],
  "Straight Flush": [50, 100, 150, 200, 250],
  "Four of a Kind": [25, 50, 75, 100, 125],
  "Full House": [9, 18, 27, 36, 45],
  Flush: [6, 12, 18, 24, 30],
  Straight: [4, 8, 12, 16, 20],
  "Three of a Kind": [3, 6, 9, 12, 15],
  "Two Pair": [2, 4, 6, 8, 10],
  "Jacks or Better": [1, 2, 3, 4, 5],
};

const SUITS = ["S", "H", "D", "C"];
const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const SUIT_SYMBOLS = {
  S: "&spades;",
  H: "&hearts;",
  D: "&diams;",
  C: "&clubs;",
};
const RED_SUITS = new Set(["H", "D"]);

const handNameEl = document.getElementById("handName");
const winDisplayEl = document.getElementById("winDisplay");
const betUnitsLabelEl = document.getElementById("betUnitsLabel");
const denomBtn = document.getElementById("denomBtn");
const bankrollDisplayEl = document.getElementById("bankrollDisplay");
const speedBtn = document.getElementById("speedBtn");
const betUpBtn = document.getElementById("betUpBtn");
const dealBtn = document.getElementById("dealBtn");
const cardButtons = Array.from(document.querySelectorAll(".card"));

let deck = [];
let hand = [];
let held = [false, false, false, false, false];
let phase = "idle";
let betUnits = 1;
let denomIndex = 0;
const denomOptions = [1, 5, 10, 25];
let bankroll = 100;
let flipSpeed = 450;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildDeck = () => {
  const newDeck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      newDeck.push({ rank, suit });
    }
  }
  return newDeck;
};

const shuffle = (cards) => {
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
};

const getRankCounts = (cards) => {
  const counts = new Map();
  cards.forEach((card) => {
    counts.set(card.rank, (counts.get(card.rank) || 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([rank, count]) => ({ rank, count }))
    .sort((a, b) => b.count - a.count || b.rank - a.rank);
};

const isFlush = (cards) => cards.every((card) => card.suit === cards[0].suit);

const isStraight = (ranks) => {
  const unique = [...new Set(ranks)].sort((a, b) => a - b);
  if (unique.length !== 5) {
    return { straight: false, highCard: null };
  }
  const lowAce = [2, 3, 4, 5, 14];
  if (lowAce.every((rank, index) => rank === unique[index])) {
    return { straight: true, highCard: 5 };
  }
  for (let i = 1; i < unique.length; i += 1) {
    if (unique[i] !== unique[i - 1] + 1) {
      return { straight: false, highCard: null };
    }
  }
  return { straight: true, highCard: unique[unique.length - 1] };
};

const evaluateHand = (cards) => {
  const ranks = cards.map((card) => card.rank);
  const counts = getRankCounts(cards);
  const flush = isFlush(cards);
  const straightInfo = isStraight(ranks);

  if (flush && straightInfo.straight && straightInfo.highCard === 14) {
    return "Royal Flush";
  }
  if (flush && straightInfo.straight) {
    return "Straight Flush";
  }
  if (counts[0].count === 4) {
    return "Four of a Kind";
  }
  if (counts[0].count === 3 && counts[1].count === 2) {
    return "Full House";
  }
  if (flush) {
    return "Flush";
  }
  if (straightInfo.straight) {
    return "Straight";
  }
  if (counts[0].count === 3) {
    return "Three of a Kind";
  }
  if (counts[0].count === 2 && counts[1].count === 2) {
    return "Two Pair";
  }
  if (counts[0].count === 2) {
    const pairRank = counts[0].rank;
    if (pairRank >= 11) {
      return "Jacks or Better";
    }
  }
  return "High Card";
};

const formatMoney = (amount) => amount.toFixed(2);

const updateBankroll = () => {
  bankrollDisplayEl.textContent = `CREDIT $${formatMoney(bankroll)}`;
};

const updateBetDisplay = () => {
  betUnitsLabelEl.textContent = `BET ${betUnits}`;
  denomBtn.textContent = `DENOM $${denomOptions[denomIndex]}`;
};

const updateWinDisplay = (amount) => {
  winDisplayEl.textContent = `WIN $${formatMoney(amount)}`;
};

const updateHandName = (handLabel) => {
  handNameEl.textContent = handLabel || "";
};

const setFlipSpeed = (speed) => {
  flipSpeed = speed;
  document.documentElement.style.setProperty("--flip-duration", `${speed}ms`);
};

const resetCardVisuals = () => {
  cardButtons.forEach((card) => {
    card.classList.remove("held");
    card.classList.remove("face-up");
  });
};

const setCardFace = (index, card) => {
  const cardEl = cardButtons[index];
  const rankEl = cardEl.querySelector(".rank");
  const suitEl = cardEl.querySelector(".suit");
  const rankLabel = {
    11: "J",
    12: "Q",
    13: "K",
    14: "A",
  }[card.rank] || card.rank;

  rankEl.textContent = rankLabel;
  suitEl.innerHTML = SUIT_SYMBOLS[card.suit];
  cardEl.classList.toggle("red-suit", RED_SUITS.has(card.suit));
  cardEl.setAttribute("aria-label", `Card ${index + 1} ${rankLabel}`);
};

const flipCardUp = async (index, delay) => {
  await wait(delay);
  cardButtons[index].classList.add("face-up");
};

const flipCardDown = async (index, delay) => {
  await wait(delay);
  cardButtons[index].classList.remove("face-up");
};

const handleDeal = async () => {
  if (phase === "dealing" || phase === "drawing") {
    return;
  }

  if (phase === "dealt") {
    await handleDraw();
    return;
  }

  const wager = betUnits * denomOptions[denomIndex];
  if (bankroll < wager) {
    updateHandName("");
    return;
  }

  bankroll -= wager;
  updateBankroll();
  updateWinDisplay(0);
  updateHandName("");
  held = [false, false, false, false, false];
  resetCardVisuals();

  deck = shuffle(buildDeck());
  hand = deck.splice(0, 5);

  phase = "dealing";
  const delayStep = Math.max(120, Math.floor(flipSpeed * 0.6));

  for (let i = 0; i < hand.length; i += 1) {
    setCardFace(i, hand[i]);
    await flipCardUp(i, delayStep);
  }

  const firstResult = evaluateHand(hand);
  updateHandName(PAY_TABLE[firstResult] ? firstResult : "");

  phase = "dealt";
  dealBtn.textContent = "DRAW";
};

const handleDraw = async () => {
  phase = "drawing";
  const delayStep = Math.max(120, Math.floor(flipSpeed * 0.6));

  for (let i = 0; i < hand.length; i += 1) {
    if (!held[i]) {
      await flipCardDown(i, 0);
      await wait(delayStep / 2);
      hand[i] = deck.shift();
      setCardFace(i, hand[i]);
      await flipCardUp(i, delayStep / 2);
    }
  }

  const result = evaluateHand(hand);
  const payoutUnits = PAY_TABLE[result] ? PAY_TABLE[result][betUnits - 1] : 0;
  const payout = payoutUnits * denomOptions[denomIndex];
  bankroll += payout;
  updateBankroll();
  updateWinDisplay(payout);
  updateHandName(payout > 0 ? result : "");

  phase = "drawn";
  dealBtn.textContent = "DEAL";
};

cardButtons.forEach((card, index) => {
  card.addEventListener("click", () => {
    if (phase !== "dealt") {
      return;
    }
    held[index] = !held[index];
    card.classList.toggle("held", held[index]);
  });
});

betUpBtn.addEventListener("click", () => {
  if (phase === "dealt") {
    return;
  }
  betUnits = betUnits === 5 ? 1 : betUnits + 1;
  updateBetDisplay();
});

denomBtn.addEventListener("click", () => {
  if (phase === "dealt") {
    return;
  }
  denomIndex = (denomIndex + 1) % denomOptions.length;
  updateBetDisplay();
});

speedBtn.addEventListener("click", () => {
  if (flipSpeed === 450) {
    setFlipSpeed(200);
    speedBtn.textContent = "SPEED: FAST";
  } else {
    setFlipSpeed(450);
    speedBtn.textContent = "SPEED: SLOW";
  }
});

dealBtn.addEventListener("click", () => {
  handleDeal();
});

setFlipSpeed(450);
updateBetDisplay();
updateBankroll();
updateWinDisplay(0);
