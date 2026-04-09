const numberToLabel = {
  1: "ace",
  2: "two",
  3: "three",
  4: "four",
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
  10: "ten",
};

const lifeLostSound = new Audio("../../../assets/sounds/life-lost.wav");

let soundEnabled = true;

const STORAGE_KEY = "blind_killer_game_state";

document.getElementById("soundToggle").addEventListener("change", (e) => {
  soundEnabled = e.target.checked;
});

function getDeck(max) {
  const deck = [];
  for (let i = 1; i <= max; i++) {
    const label = numberToLabel[i];
    deck.push({
      n: i,
      name: label.charAt(0).toUpperCase() + label.slice(1) + " of Spades",
      img: `../../../assets/cards/spade/spade_${label}.png`,
      lives: 3,
    });
  }
  return deck;
}

let remaining = [],
  used = [],
  drawCount = 0;
let sliderLocked = false;
let cardListContainer;
let maxSelected = 10;
let playerCount = 1;
let playerDraws = 0;
let cardListRevealed = false;

// --- Session Storage ---
function saveState() {
  const state = {
    remaining,
    used,
    drawCount,
    sliderLocked,
    maxSelected,
    playerCount,
    playerDraws,
    cardListRevealed,
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clearSavedState() {
  sessionStorage.removeItem(STORAGE_KEY);
}

function restoreState() {
  const saved = sessionStorage.getItem(STORAGE_KEY);
  if (!saved) return false;

  try {
    const state = JSON.parse(saved);
    // Only restore if a game was actually in progress
    if (!state.sliderLocked) return false;

    remaining = state.remaining;
    used = state.used;
    drawCount = state.drawCount;
    sliderLocked = state.sliderLocked;
    maxSelected = state.maxSelected;
    playerCount = state.playerCount;
    playerDraws = state.playerDraws;
    cardListRevealed = state.cardListRevealed;

    // Hide setup controls
    document.getElementById("rangeControls").style.display = "none";
    document.getElementById("playerControls").style.display = "none";
    document.getElementById("resetBtn").style.display = "inline-block";

    // Hide rules overlay on restore
    document.getElementById("rulesOverlay").classList.add("hidden");

    updateDrawCount();

    // If all cards drawn, hide draw button
    if (playerDraws >= maxSelected || remaining.length === 0) {
      document.querySelector("button[onclick='showRandomCard()']").style.display = "none";
    }

    // If card list was already revealed, re-render it
    if (cardListRevealed) {
      showCardList();
    }

    return true;
  } catch (e) {
    clearSavedState();
    return false;
  }
}

function updateRange(value) {
  if (value < 5) value = 5;
  const endCard = numberToLabel[value];
  maxSelected = parseInt(value);
  document.getElementById(
    "rangeLabel"
  ).innerHTML = `Showing cards from <strong>Ace (1)</strong> to <strong>${
    endCard.charAt(0).toUpperCase() + endCard.slice(1)
  }</strong> of Spades`;
}

function updatePlayers(value) {
  playerCount = parseInt(value);
  document.getElementById(
    "playerLabel"
  ).innerHTML = `Number of players: <strong>${playerCount}</strong>`;
}

function resetDeck() {
  const max = parseInt(document.getElementById("rangeSelect").value);
  maxSelected = Math.max(5, max);
  remaining = getDeck(maxSelected);
  used = [];
  drawCount = 0;
  playerDraws = 0;
  cardListRevealed = false;
  updateDrawCount();
  updateRange(maxSelected);
  updatePlayers(document.getElementById("playerSelect").value);
  document.getElementById("cardDisplay").innerHTML = "";

  document.querySelector("button[onclick='showRandomCard()']").style.display =
    "inline-block";

  const existingList = document.getElementById("cardList");
  if (existingList) {
    existingList.remove();
  }

  document.getElementById("winnerOverlay").classList.add("hidden");
  document.getElementById("allDrawnOverlay").classList.add("hidden");

  clearSavedState();
}

function showRandomCard() {
  if (!sliderLocked) {
    document.getElementById("rangeControls").style.display = "none";
    document.getElementById("playerControls").style.display = "none";
    document.getElementById("resetBtn").style.display = "inline-block";
    sliderLocked = true;
  }

  if (remaining.length === 0 || playerDraws >= maxSelected) {
    document.querySelector("button[onclick='showRandomCard()']").style.display =
      "none";
    return;
  }

  const idx = Math.floor(Math.random() * remaining.length);
  const card = remaining.splice(idx, 1)[0];
  used.push(card);
  drawCount++;
  playerDraws++;
  updateDrawCount();

  document.getElementById("cardDisplay").innerHTML = `
    <div class="number">${card.n === 1 ? "A" : card.n}</div>
    <img class="card-img" src="${card.img}" alt="${card.name}">
    <div>${card.name}</div>
  `;

  clearTimeout(window.hideTimeout);
  window.hideTimeout = setTimeout(() => {
    document.getElementById("cardDisplay").innerHTML = "";

    // Final check if all cards are now drawn
    if (playerDraws >= maxSelected || remaining.length === 0) {
      document.querySelector(
        "button[onclick='showRandomCard()']"
      ).style.display = "none";
      document.getElementById("allDrawnOverlay").classList.remove("hidden");
    }
  }, 3000);

  if (playerDraws === playerCount) {
    while (playerDraws < maxSelected && remaining.length > 0) {
      const dummyIdx = Math.floor(Math.random() * remaining.length);
      const dummyCard = remaining.splice(dummyIdx, 1)[0];
      used.push(dummyCard);
      playerDraws++;
    }
  }

  saveState();
}

function updateDrawCount() {
  document.getElementById("drawCount").textContent = "Draws: " + drawCount;
}

function enableSlider() {
  sliderLocked = false;
  cardListRevealed = false;
  document.getElementById("rangeControls").style.display = "block";
  document.getElementById("playerControls").style.display = "block";
  document.getElementById("resetBtn").style.display = "none";
  resetDeck();
}

function getHeartIcons(lives) {
  return "❤️".repeat(lives);
}

function checkForWinner() {
  const aliveCards = used.filter((card) => card.lives > 0);
  if (aliveCards.length === 1) {
    clearSavedState();
    showWinner(aliveCards[0]);
  }
}

function showWinner(card) {
  const msg = document.getElementById("winnerMessage");
  const cardLabel = card.n === 1 ? "Ace" : String(card.n);
  msg.textContent = `${cardLabel} of Spades is the winner! Would you like to play again?`;
  openWinnerOverlay('winnerOverlay', 'blind-killer', cardLabel, used.map(c => c.n === 1 ? 'Ace' : String(c.n)));
}

function showCardList() {
  cardListRevealed = true;
  const sortedCards = [...used].sort((a, b) => a.n - b.n);

  // Remove existing list if present
  const existingList = document.getElementById("cardList");
  if (existingList) {
    existingList.remove();
  }

  cardListContainer = document.createElement("div");
  cardListContainer.id = "cardList";
  cardListContainer.className = "card-list";
  document.body.appendChild(cardListContainer);

  sortedCards.forEach((card, index) => {
    const cardElement = document.createElement("div");
    cardElement.className = "card-with-lives";
    cardElement.style.animationDelay = `${index * 0.5}s`; // Stagger animation
    cardElement.dataset.index = index;

    const img = document.createElement("img");
    img.src = card.img;
    img.alt = card.name;
    img.className = "card-img";

    const skullOverlay = document.createElement("div");
    skullOverlay.className = "skull-overlay";
    skullOverlay.style.display = card.lives === 0 ? "flex" : "none";
    skullOverlay.textContent = "💀";

    const livesText = document.createElement("div");
    livesText.className = "lives";
    livesText.textContent = getHeartIcons(card.lives);

    if (card.lives === 0) {
      img.classList.add("grayed-out");
    }

    cardElement.appendChild(img);
    cardElement.appendChild(skullOverlay);
    cardElement.appendChild(livesText);
    cardListContainer.appendChild(cardElement);

    cardElement.addEventListener("click", () => {
      if (card.lives > 0) {
        const overlay = document.getElementById("confirmOverlay");
        overlay.classList.remove("hidden");

        const yesBtn = document.getElementById("confirmYes");
        const noBtn = document.getElementById("confirmNo");

        const confirmAction = () => {
          card.lives--;

          if (soundEnabled) {
            lifeLostSound.currentTime = 0;
            lifeLostSound.play();
          }

          livesText.style.opacity = 0;
          setTimeout(() => {
            livesText.textContent = getHeartIcons(card.lives);
            livesText.style.opacity = 1;
            if (card.lives === 0) {
              img.classList.add("grayed-out");
              skullOverlay.style.display = "flex";
              checkForWinner();
            }
          }, 200);
          cleanup();
          saveState();
        };

        const cleanup = () => {
          overlay.classList.add("hidden");
          yesBtn.removeEventListener("click", confirmAction);
          noBtn.removeEventListener("click", cancelAction);
        };

        const cancelAction = () => {
          cleanup();
        };

        yesBtn.onclick = () => {
          confirmAction();
          yesBtn.onclick = null;
          noBtn.onclick = null;
        };

        noBtn.onclick = () => {
          cancelAction();
          yesBtn.onclick = null;
          noBtn.onclick = null;
        };
      }
    });
  });

  saveState();
}

document.getElementById("playAgainBtn").addEventListener("click", () => {
  document.getElementById("winnerOverlay").classList.add("hidden");
  enableSlider();
});

document.getElementById("viewResultsBtn").addEventListener("click", () => {
  document.getElementById("allDrawnOverlay").classList.add("hidden");
  showCardList();
});

function goHome() {
  window.location.href = "../../../";
}

// Rules overlay
const RULES_SEEN_KEY = "blind_killer_rules_seen";

document.getElementById("closeRulesBtn").addEventListener("click", () => {
  document.getElementById("rulesOverlay").classList.add("hidden");
  sessionStorage.setItem(RULES_SEEN_KEY, "true");
});

document.getElementById("howToPlayBtn").addEventListener("click", () => {
  document.getElementById("rulesOverlay").classList.remove("hidden");
});

// Hide rules if already dismissed this session
if (sessionStorage.getItem(RULES_SEEN_KEY)) {
  document.getElementById("rulesOverlay").classList.add("hidden");
}

// Restore saved game or start fresh
if (!restoreState()) {
  resetDeck();
}
