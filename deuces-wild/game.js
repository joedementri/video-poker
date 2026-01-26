const PAY_TABLE = {
  "Natural Royal Flush": [250, 500, 750, 1000, 4000],
  "Four Deuces": [200, 400, 600, 800, 1000],
  "Wild Royal Flush": [25, 50, 75, 100, 125],
  "Five of a Kind": [15, 30, 45, 60, 75],
  "Straight Flush": [9, 18, 27, 36, 45],
  "Four of a Kind": [5, 10, 15, 20, 25],
  "Full House": [3, 6, 9, 12, 15],
  Flush: [2, 4, 6, 8, 10],
  Straight: [2, 4, 6, 8, 10],
  "Three of a Kind": [1, 2, 3, 4, 5],
};

const SUITS = ["S", "H", "D", "C"];
const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const WILD_RANK = 2;
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
const bestPlayBtn = document.getElementById("bestPlayBtn");
const betUpBtn = document.getElementById("betUpBtn");
const dealBtn = document.getElementById("dealBtn");
const cardButtons = Array.from(document.querySelectorAll(".card"));
const payTableEl = document.getElementById("payTable");
const creditModal = document.getElementById("creditModal");
const creditInput = document.getElementById("creditInput");
const creditConfirmBtn = document.getElementById("creditConfirmBtn");
const creditError = document.getElementById("creditError");
const statHandsEl = document.getElementById("statHands");
const statWageredEl = document.getElementById("statWagered");
const statWonEl = document.getElementById("statWon");
const statLossEl = document.getElementById("statLoss");
const statNetEl = document.getElementById("statNet");
const statRtpEl = document.getElementById("statRtp");
const statStreakEl = document.getElementById("statStreak");
const statNaturalRoyalEl = document.getElementById("statNaturalRoyal");
const statFourDeucesEl = document.getElementById("statFourDeuces");
const statWildRoyalEl = document.getElementById("statWildRoyal");
const statFiveKindEl = document.getElementById("statFiveKind");
const statStraightFlushEl = document.getElementById("statStraightFlush");
const statFourKindEl = document.getElementById("statFourKind");
const statFullHouseEl = document.getElementById("statFullHouse");
const statFlushEl = document.getElementById("statFlush");
const statStraightEl = document.getElementById("statStraight");
const statTripsEl = document.getElementById("statTrips");
const resetStatsBtn = document.getElementById("resetStatsBtn");

let deck = [];
let hand = [];
let held = [false, false, false, false, false];
let phase = "idle";
let betUnits = 1;
let denomIndex = 2;
const denomOptions = [0.25, 0.5, 1, 5, 10, 25];
let bankroll = 100;
let flipSpeed = 450;
let showBestPlay = false;
let handsPlayed = 0;
let totalWagered = 0;
let totalWon = 0;
let winStreak = 0;
const handCounts = {
  "Natural Royal Flush": 0,
  "Four Deuces": 0,
  "Wild Royal Flush": 0,
  "Five of a Kind": 0,
  "Straight Flush": 0,
  "Four of a Kind": 0,
  "Full House": 0,
  Flush: 0,
  Straight: 0,
  "Three of a Kind": 0,
};

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

const isFlushPossible = (cards) => cards.length === 0 || cards.every((card) => card.suit === cards[0].suit);

const isRoyalPossible = (ranks, wilds) => {
  const target = [10, 11, 12, 13, 14];
  const unique = new Set(ranks);
  for (const rank of unique) {
    if (!target.includes(rank)) {
      return false;
    }
  }
  const missing = target.filter((rank) => !unique.has(rank)).length;
  return missing <= wilds;
};

const isStraightPossible = (ranks, wilds) => {
  const unique = [...new Set(ranks)];
  if (unique.length + wilds < 5) {
    return false;
  }
  for (let high = 5; high <= 14; high += 1) {
    const target = [];
    if (high === 5) {
      target.push(14, 2, 3, 4, 5);
    } else {
      for (let i = high - 4; i <= high; i += 1) {
        target.push(i);
      }
    }
    const targetSet = new Set(target);
    if (unique.some((rank) => !targetSet.has(rank))) {
      continue;
    }
    const missing = target.filter((rank) => !unique.includes(rank)).length;
    if (missing <= wilds) {
      return true;
    }
  }
  return false;
};

const canMakeFiveOfKind = (counts, wilds) => {
  if (wilds === 0) {
    return false;
  }
  const maxCount = counts.length ? counts[0].count : 0;
  return maxCount + wilds >= 5;
};

const canMakeFourOfKind = (counts, wilds) => {
  const maxCount = counts.length ? counts[0].count : 0;
  return maxCount + wilds >= 4;
};

const canMakeThreeOfKind = (counts, wilds) => {
  const maxCount = counts.length ? counts[0].count : 0;
  return maxCount + wilds >= 3;
};

const canMakeFullHouse = (counts, wilds) => {
  const rankCounts = new Map(counts.map((item) => [item.rank, item.count]));
  const candidates = [...rankCounts.keys(), null];

  for (const tripRank of candidates) {
    const tripCount = tripRank === null ? 0 : rankCounts.get(tripRank) || 0;
    const needTrip = Math.max(0, 3 - tripCount);
    if (needTrip > wilds) {
      continue;
    }
    for (const pairRank of candidates) {
      if (pairRank === tripRank) {
        continue;
      }
      const pairCount = pairRank === null ? 0 : rankCounts.get(pairRank) || 0;
      const needPair = Math.max(0, 2 - pairCount);
      if (needTrip + needPair <= wilds) {
        return true;
      }
    }
  }
  return false;
};

const evaluateHand = (cards) => {
  const wilds = cards.filter((card) => card.rank === WILD_RANK).length;
  const nonWilds = cards.filter((card) => card.rank !== WILD_RANK);
  const ranks = nonWilds.map((card) => card.rank);
  const counts = getRankCounts(nonWilds);
  const flushPossible = isFlushPossible(nonWilds);
  const straightPossible = isStraightPossible(ranks, wilds);
  const royalPossible = isRoyalPossible(ranks, wilds);

  if (wilds === 0 && flushPossible && royalPossible) {
    return "Natural Royal Flush";
  }
  if (wilds === 4) {
    return "Four Deuces";
  }
  if (wilds > 0 && flushPossible && royalPossible) {
    return "Wild Royal Flush";
  }
  if (canMakeFiveOfKind(counts, wilds)) {
    return "Five of a Kind";
  }
  if (flushPossible && straightPossible) {
    return "Straight Flush";
  }
  if (canMakeFourOfKind(counts, wilds)) {
    return "Four of a Kind";
  }
  if (canMakeFullHouse(counts, wilds)) {
    return "Full House";
  }
  if (flushPossible) {
    return "Flush";
  }
  if (straightPossible) {
    return "Straight";
  }
  if (canMakeThreeOfKind(counts, wilds)) {
    return "Three of a Kind";
  }
  return "No Win";
};

const formatMoney = (amount) => amount.toFixed(2);

const updateBankroll = () => {
  bankrollDisplayEl.textContent = `CREDIT $${formatMoney(bankroll)}`;
  fitTextToContainer(bankrollDisplayEl, 18);
};

const updateBetDisplay = () => {
  betUnitsLabelEl.textContent = `BET ${betUnits}`;
  const denomValue = denomOptions[denomIndex];
  const denomLabel = denomValue < 1 ? denomValue.toFixed(2) : denomValue;
  denomBtn.textContent = `DENOM $${denomLabel}`;
  if (payTableEl) {
    payTableEl.dataset.bet = String(betUnits);
  }
  if (showBestPlay && phase === "dealt") {
    updateBestPlay();
  }
};

const updateWinDisplay = (amount) => {
  winDisplayEl.textContent = `WIN $${formatMoney(amount)}`;
};

const updateHandName = (handLabel) => {
  handNameEl.textContent = handLabel || "";
};

const updateStatsDisplay = () => {
  const totalLoss = Math.max(0, totalWagered - totalWon);
  const net = totalWon - totalWagered;
  const rtp = totalWagered > 0 ? (totalWon / totalWagered) * 100 : 0;
  const streakLabel = winStreak === 0 ? "-" : winStreak > 0 ? `W${winStreak}` : `L${Math.abs(winStreak)}`;

  if (statHandsEl) statHandsEl.textContent = handsPlayed;
  if (statWageredEl) statWageredEl.textContent = `$${formatMoney(totalWagered)}`;
  if (statWonEl) statWonEl.textContent = `$${formatMoney(totalWon)}`;
  if (statLossEl) statLossEl.textContent = `$${formatMoney(totalLoss)}`;
  if (statNetEl) statNetEl.textContent = `$${formatMoney(net)}`;
  if (statRtpEl) statRtpEl.textContent = `${rtp.toFixed(2)}%`;
  if (statStreakEl) statStreakEl.textContent = streakLabel;
  if (statNaturalRoyalEl) statNaturalRoyalEl.textContent = handCounts["Natural Royal Flush"];
  if (statFourDeucesEl) statFourDeucesEl.textContent = handCounts["Four Deuces"];
  if (statWildRoyalEl) statWildRoyalEl.textContent = handCounts["Wild Royal Flush"];
  if (statFiveKindEl) statFiveKindEl.textContent = handCounts["Five of a Kind"];
  if (statStraightFlushEl) statStraightFlushEl.textContent = handCounts["Straight Flush"];
  if (statFourKindEl) statFourKindEl.textContent = handCounts["Four of a Kind"];
  if (statFullHouseEl) statFullHouseEl.textContent = handCounts["Full House"];
  if (statFlushEl) statFlushEl.textContent = handCounts.Flush;
  if (statStraightEl) statStraightEl.textContent = handCounts.Straight;
  if (statTripsEl) statTripsEl.textContent = handCounts["Three of a Kind"];
};

const openCreditModal = () => {
  if (!creditModal || !creditInput) {
    return;
  }
  creditInput.value = formatMoney(bankroll);
  if (creditError) {
    creditError.classList.remove("is-visible");
  }
  creditModal.classList.add("is-open");
  creditModal.setAttribute("aria-hidden", "false");
  creditInput.focus();
  creditInput.select();
};

const closeCreditModal = () => {
  if (!creditModal) {
    return;
  }
  creditModal.classList.remove("is-open");
  creditModal.setAttribute("aria-hidden", "true");
};

const applyCreditInput = () => {
  if (!creditInput) {
    return;
  }
  const nextValue = Number.parseFloat(creditInput.value);
  if (!Number.isFinite(nextValue) || nextValue <= 0) {
    if (creditError) {
      creditError.classList.add("is-visible");
    }
    return;
  }
  if (creditError) {
    creditError.classList.remove("is-visible");
  }
  bankroll = nextValue;
  updateBankroll();
  closeCreditModal();
};

const resetStats = () => {
  handsPlayed = 0;
  totalWagered = 0;
  totalWon = 0;
  winStreak = 0;
  Object.keys(handCounts).forEach((key) => {
    handCounts[key] = 0;
  });
  updateStatsDisplay();
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
  let wildEl = cardEl.querySelector(".wild-text");
  if (!wildEl) {
    wildEl = document.createElement("span");
    wildEl.className = "wild-text";
    cardEl.querySelector(".card-front").appendChild(wildEl);
  }
  const isWild = card.rank === WILD_RANK;
  const rankLabel = {
    11: "J",
    12: "Q",
    13: "K",
    14: "A",
  }[card.rank] || card.rank;

  rankEl.textContent = rankLabel;
  suitEl.innerHTML = SUIT_SYMBOLS[card.suit];
  cardEl.classList.toggle("red-suit", RED_SUITS.has(card.suit));
  cardEl.classList.toggle("wild-card", isWild);
  wildEl.textContent = isWild ? "WILD" : "";
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

const getPayoutUnits = (cards) => {
  const result = evaluateHand(cards);
  return PAY_TABLE[result] ? PAY_TABLE[result][betUnits - 1] : 0;
};

const countBits = (mask) => {
  let count = 0;
  let value = mask;
  while (value) {
    count += value & 1;
    value >>= 1;
  }
  return count;
};

const fitTextToContainer = (element, minSizePx) => {
  if (!element) {
    return;
  }
  element.style.fontSize = "";
  let fontSize = parseFloat(window.getComputedStyle(element).fontSize);
  const minSize = minSizePx || 18;
  if (!Number.isFinite(fontSize)) {
    return;
  }
  const maxTries = 20;
  let tries = 0;
  while (element.scrollWidth > element.clientWidth && fontSize > minSize && tries < maxTries) {
    fontSize -= 1;
    element.style.fontSize = `${fontSize}px`;
    tries += 1;
  }
};

const countCombinations = (n, k) => {
  if (k < 0 || k > n) {
    return 0;
  }
  let result = 1;
  for (let i = 1; i <= k; i += 1) {
    result = (result * (n - k + i)) / i;
  }
  return result;
};

const sampleDraw = (cards, drawCount) => {
  const chosen = new Set();
  const drawn = [];
  while (drawn.length < drawCount) {
    const index = Math.floor(Math.random() * cards.length);
    if (!chosen.has(index)) {
      chosen.add(index);
      drawn.push(cards[index]);
    }
  }
  return drawn;
};

const forEachCombination = (n, k, callback) => {
  if (k === 0) {
    callback([]);
    return;
  }
  const indices = Array.from({ length: k }, (_, i) => i);
  while (true) {
    callback(indices);
    let i = k - 1;
    while (i >= 0 && indices[i] === n - k + i) {
      i -= 1;
    }
    if (i < 0) {
      break;
    }
    indices[i] += 1;
    for (let j = i + 1; j < k; j += 1) {
      indices[j] = indices[j - 1] + 1;
    }
  }
};

const getBestHoldMask = (cards, remainingDeck) => {
  const exactThreshold = 6000;
  const sampleCount = 2500;
  let bestMask = 0;
  let bestEv = -1;
  let bestHeldCount = -1;

  for (let mask = 0; mask < 32; mask += 1) {
    const heldCards = [];
    for (let i = 0; i < 5; i += 1) {
      if (mask & (1 << i)) {
        heldCards.push(cards[i]);
      }
    }
    const drawCount = 5 - heldCards.length;
    let total = 0;
    let combos = 0;
    const totalCombos = countCombinations(remainingDeck.length, drawCount);

    if (drawCount === 0) {
      total = getPayoutUnits(heldCards);
      combos = 1;
    } else {
      if (totalCombos <= exactThreshold) {
        forEachCombination(remainingDeck.length, drawCount, (combo) => {
          const drawn = combo.map((index) => remainingDeck[index]);
          const testHand = heldCards.concat(drawn);
          total += getPayoutUnits(testHand);
          combos += 1;
        });
      } else {
        const samples = Math.min(sampleCount, totalCombos);
        for (let i = 0; i < samples; i += 1) {
          const drawn = sampleDraw(remainingDeck, drawCount);
          const testHand = heldCards.concat(drawn);
          total += getPayoutUnits(testHand);
        }
        combos = samples;
      }
    }

    const ev = combos > 0 ? total / combos : 0;
    const heldCount = heldCards.length;
    if (ev > bestEv || (Math.abs(ev - bestEv) < 1e-9 && heldCount > bestHeldCount)) {
      bestEv = ev;
      bestMask = mask;
      bestHeldCount = heldCount;
    }
  }

  return bestMask;
};

const clearBestHolds = () => {
  cardButtons.forEach((card) => card.classList.remove("best-hold"));
};

const updateBestPlay = () => {
  if (!showBestPlay || phase !== "dealt") {
    clearBestHolds();
    return;
  }
  const bestMask = getBestHoldMask(hand, deck);
  clearBestHolds();
  for (let i = 0; i < 5; i += 1) {
    if (bestMask & (1 << i)) {
      cardButtons[i].classList.add("best-hold");
    }
  }
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
  totalWagered += wager;
  updateBankroll();
  updateWinDisplay(0);
  updateHandName("");
  clearBestHolds();
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

  phase = "dealt";
  dealBtn.textContent = "DRAW";

  const firstResult = evaluateHand(hand);
  updateHandName(PAY_TABLE[firstResult] ? firstResult : "");
  updateBestPlay();
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
  totalWon += payout;
  updateBankroll();
  updateWinDisplay(payout);
  updateHandName(payout > 0 ? result : "");
  clearBestHolds();
  handsPlayed += 1;
  if (handCounts[result] !== undefined) {
    handCounts[result] += 1;
  }
  if (payout > 0) {
    winStreak = winStreak >= 0 ? winStreak + 1 : 1;
  } else {
    winStreak = winStreak <= 0 ? winStreak - 1 : -1;
  }
  updateStatsDisplay();

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

bestPlayBtn.addEventListener("click", () => {
  showBestPlay = !showBestPlay;
  bestPlayBtn.textContent = showBestPlay ? "HIDE BEST PLAY" : "SHOW BEST PLAY";
  updateBestPlay();
});

resetStatsBtn.addEventListener("click", () => {
  resetStats();
});

bankrollDisplayEl.addEventListener("click", () => {
  openCreditModal();
});

creditConfirmBtn.addEventListener("click", () => {
  applyCreditInput();
});

creditInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    applyCreditInput();
  }
  if (event.key === "Escape") {
    closeCreditModal();
  }
});

creditModal.addEventListener("click", (event) => {
  if (event.target === creditModal) {
    closeCreditModal();
  }
});

dealBtn.addEventListener("click", () => {
  handleDeal();
});

setFlipSpeed(450);
updateBetDisplay();
updateBankroll();
updateWinDisplay(0);
updateStatsDisplay();

window.addEventListener("resize", () => {
  fitTextToContainer(bankrollDisplayEl, 18);
});
