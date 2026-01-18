const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

const HAND_RANKS = [
  "High Card",
  "Jacks or Better",
  "Two Pair",
  "Three of a Kind",
  "Straight",
  "Flush",
  "Full House",
  "Four of a Kind",
  "Straight Flush",
  "Royal Flush",
];

class Card {
  constructor(rank, suit) {
    this.rank = rank;
    this.suit = suit;
  }

  toString() {
    const rankLabel = {
      11: "J",
      12: "Q",
      13: "K",
      14: "A",
    }[this.rank] || this.rank;
    return `${rankLabel}${this.suit}`;
  }
}

class Deck {
  constructor() {
    this.cards = [];
    this.reset();
  }

  reset() {
    this.cards = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        this.cards.push(new Card(rank, suit));
      }
    }
    return this;
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
    return this;
  }

  deal(count = 1) {
    if (count > this.cards.length) {
      throw new Error("Not enough cards to deal.");
    }
    return this.cards.splice(0, count);
  }
}

const getRankCounts = (hand) => {
  const counts = new Map();
  for (const card of hand) {
    counts.set(card.rank, (counts.get(card.rank) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([rank, count]) => ({ rank, count }))
    .sort((a, b) => b.count - a.count || b.rank - a.rank);
};

const isFlush = (hand) => hand.every((card) => card.suit === hand[0].suit);

const isStraight = (ranks) => {
  const sorted = [...new Set(ranks)].sort((a, b) => a - b);
  if (sorted.length !== 5) {
    return { straight: false, highCard: null };
  }
  const lowAce = [2, 3, 4, 5, 14];
  if (sorted.every((rank, index) => rank === lowAce[index])) {
    return { straight: true, highCard: 5 };
  }
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i] !== sorted[i - 1] + 1) {
      return { straight: false, highCard: null };
    }
  }
  return { straight: true, highCard: sorted[sorted.length - 1] };
};

const evaluateHand = (hand) => {
  if (!Array.isArray(hand) || hand.length !== 5) {
    throw new Error("Hand must be an array of 5 cards.");
  }

  const ranks = hand.map((card) => card.rank);
  const rankCounts = getRankCounts(hand);
  const flush = isFlush(hand);
  const { straight, highCard } = isStraight(ranks);

  if (flush && straight && highCard === 14) {
    return { rank: 9, name: HAND_RANKS[9] };
  }

  if (flush && straight) {
    return { rank: 8, name: HAND_RANKS[8], highCard };
  }

  if (rankCounts[0].count === 4) {
    return { rank: 7, name: HAND_RANKS[7], quadRank: rankCounts[0].rank };
  }

  if (rankCounts[0].count === 3 && rankCounts[1].count === 2) {
    return { rank: 6, name: HAND_RANKS[6], tripsRank: rankCounts[0].rank };
  }

  if (flush) {
    return { rank: 5, name: HAND_RANKS[5], highCard: Math.max(...ranks) };
  }

  if (straight) {
    return { rank: 4, name: HAND_RANKS[4], highCard };
  }

  if (rankCounts[0].count === 3) {
    return { rank: 3, name: HAND_RANKS[3], tripsRank: rankCounts[0].rank };
  }

  if (rankCounts[0].count === 2 && rankCounts[1].count === 2) {
    return {
      rank: 2,
      name: HAND_RANKS[2],
      highPair: Math.max(rankCounts[0].rank, rankCounts[1].rank),
      lowPair: Math.min(rankCounts[0].rank, rankCounts[1].rank),
    };
  }

  if (rankCounts[0].count === 2) {
    const pairRank = rankCounts[0].rank;
    if (pairRank >= 11) {
      return { rank: 1, name: HAND_RANKS[1], pairRank };
    }
  }

  return { rank: 0, name: HAND_RANKS[0], highCard: Math.max(...ranks) };
};

window.PokerEngine = {
  Card,
  Deck,
  HAND_RANKS,
  evaluateHand,
};
