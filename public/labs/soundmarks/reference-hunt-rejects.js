const rejectedStorageKey = "pack-soundmark-reference-rejects-v1";
const likedStorageKey = "pack-soundmark-reference-likes-v1";
const historyStorageKey = "pack-soundmark-reference-history-v1";

const cards = Array.from(document.querySelectorAll(".card"));
const grid = document.querySelector("#grid");
let activeAudio = null;

const readStored = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
};

const writeStored = (key, items) => {
  localStorage.setItem(key, JSON.stringify(items));
};

const soundIdForCard = (card) => {
  const source = card.querySelector(".source")?.href || "";
  return source.match(/sounds\/(\d+)\//)?.[1] || card.querySelector(".rank")?.textContent || "";
};

const payloadForCard = (card) => ({
  id: soundIdForCard(card),
  rank: card.querySelector(".rank")?.textContent?.trim() || "",
  title: card.querySelector("h2")?.textContent?.trim() || "",
  query: card.dataset.query || "",
  source: card.querySelector(".source")?.href || "",
});

const upsertDecision = (key, payload) => {
  const current = readStored(key).filter((item) => item.id !== payload.id);
  writeStored(key, [...current, payload]);
};

const removeDecision = (key, id) => {
  writeStored(
    key,
    readStored(key).filter((item) => item.id !== id),
  );
};

const decidedIds = () =>
  new Set([
    ...readStored(likedStorageKey).map((item) => item.id),
    ...readStored(rejectedStorageKey).map((item) => item.id),
  ]);

const nextUndecidedIndex = () => {
  const decided = decidedIds();
  return cards.findIndex((card) => !decided.has(soundIdForCard(card)));
};

const activeCard = () => cards.find((card) => card.classList.contains("is-current"));

const stopAudio = () => {
  if (!activeAudio) {
    return;
  }

  activeAudio.pause();
  activeAudio.currentTime = 0;
  activeAudio = null;
};

const updateStats = () => {
  const liked = readStored(likedStorageKey).length;
  const rejected = readStored(rejectedStorageKey).length;
  const remaining = Math.max(cards.length - liked - rejected, 0);
  document.querySelector("#likedCount").textContent = String(liked);
  document.querySelector("#rejectedCount").textContent = String(rejected);
  document.querySelector("#remainingCount").textContent = String(remaining);
};

const showCardAt = (index) => {
  stopAudio();
  cards.forEach((card, cardIndex) => {
    card.classList.toggle("is-current", cardIndex === index);
    card.hidden = cardIndex !== index;
  });

  const done = index < 0;
  document.body.classList.toggle("review-complete", done);
  document.querySelector("#reviewDone").hidden = !done;
  updateStats();
};

const showNext = () => {
  showCardAt(nextUndecidedIndex());
};

const decide = (decision) => {
  const card = activeCard();

  if (!card) {
    return;
  }

  const payload = payloadForCard(card);
  removeDecision(likedStorageKey, payload.id);
  removeDecision(rejectedStorageKey, payload.id);
  upsertDecision(decision === "yes" ? likedStorageKey : rejectedStorageKey, payload);
  writeStored(historyStorageKey, [
    ...readStored(historyStorageKey),
    { decision, payload },
  ]);
  showNext();
};

const undo = () => {
  const history = readStored(historyStorageKey);
  const last = history.pop();

  if (!last) {
    return;
  }

  removeDecision(likedStorageKey, last.payload.id);
  removeDecision(rejectedStorageKey, last.payload.id);
  writeStored(historyStorageKey, history);
  showCardAt(cards.findIndex((card) => soundIdForCard(card) === last.payload.id));
};

const playCurrent = () => {
  const card = activeCard();
  const src = card?.querySelector("audio")?.src;

  if (!src) {
    return;
  }

  stopAudio();
  activeAudio = new Audio(src);
  void activeAudio.play();
};

const copyReviewJson = async () => {
  const params = new URLSearchParams(window.location.search);
  const payload = {
    v: 1,
    r: params.get("reviewer") || "default",
    d: params.get("round") || "1",
    y: readStored(likedStorageKey).map((item) => item.id),
    n: readStored(rejectedStorageKey).map((item) => item.id),
  };
  const text = JSON.stringify(payload, null, 2);

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    console.log(text);
  }
};

const clearReview = () => {
  writeStored(likedStorageKey, []);
  writeStored(rejectedStorageKey, []);
  writeStored(historyStorageKey, []);
  showNext();
};

const installReviewUi = () => {
  document.body.classList.add("tinder-review");

  const style = document.createElement("style");
  style.textContent = `
    .tinder-review .tools input,
    .tinder-review .tools .note,
    .tinder-review .actions,
    .tinder-review .reject,
    .tinder-review .card audio {
      display: none;
    }

    .review-toolbar {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 12px;
      align-items: center;
      margin: 20px 0 18px;
    }

    .review-button {
      min-height: 64px;
      border: 1px solid var(--line);
      border-radius: 10px;
      background: rgba(255, 248, 236, .06);
      color: var(--ink);
      font: inherit;
      font-size: 1.05rem;
      font-weight: 900;
      cursor: pointer;
    }

    .review-button.yes {
      background: rgba(240, 198, 45, .18);
      border-color: rgba(240, 198, 45, .58);
    }

    .review-button.no {
      background: rgba(231, 35, 64, .16);
      border-color: rgba(231, 35, 64, .56);
    }

    .review-button.play {
      min-width: 180px;
      background: var(--gold);
      color: #111;
      border-color: var(--gold);
    }

    .review-button.undo {
      min-height: 46px;
      min-width: 140px;
    }

    .review-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 18px;
      color: var(--muted);
      font-size: .95rem;
    }

    .review-stats strong {
      color: var(--gold);
    }

    .tinder-review .grid {
      display: block;
      max-width: 720px;
      margin: 0 auto;
    }

    .tinder-review .card {
      min-height: 420px;
      padding: 28px;
      justify-content: center;
      gap: 22px;
      text-align: center;
    }

    .tinder-review .card .rank {
      font-size: 1.2rem;
    }

    .tinder-review .card h2 {
      font-size: clamp(1.8rem, 5vw, 3.2rem);
      line-height: 1.02;
    }

    .tinder-review .card .byline,
    .tinder-review .card .kicker {
      font-size: 1rem;
    }

    .tinder-review .card .tags {
      justify-content: center;
    }

    #reviewDone {
      max-width: 720px;
      margin: 0 auto;
      border: 1px solid var(--line);
      border-radius: 10px;
      background: rgba(255, 248, 236, .06);
      padding: 28px;
      text-align: center;
    }

    @media (max-width: 720px) {
      .review-toolbar {
        grid-template-columns: 1fr;
      }

      .review-button.play,
      .review-button.undo {
        width: 100%;
      }
    }
  `;
  document.head.append(style);

  const toolbar = document.createElement("section");
  toolbar.className = "review-toolbar";
  toolbar.innerHTML = `
    <button class="review-button no" type="button" id="reviewNo">← No</button>
    <div>
      <button class="review-button play" type="button" id="reviewPlay">Play</button>
      <button class="review-button undo" type="button" id="reviewUndo">Undo</button>
    </div>
    <button class="review-button yes" type="button" id="reviewYes">Yes →</button>
  `;

  const stats = document.createElement("section");
  stats.className = "review-stats";
  stats.innerHTML = `
    <span>Yes <strong id="likedCount">0</strong></span>
    <span>No <strong id="rejectedCount">0</strong></span>
    <span>Remaining <strong id="remainingCount">0</strong></span>
    <button class="tool-button" type="button" id="copyReviewJson">Copy review JSON</button>
    <button class="tool-button" type="button" id="clearReview">Clear</button>
  `;

  const done = document.createElement("section");
  done.id = "reviewDone";
  done.hidden = true;
  done.innerHTML = `
    <h2>Review complete</h2>
    <p class="byline">Copy the review JSON and send it over. I can use the Yes and No patterns to run a better targeted search.</p>
  `;

  grid.before(toolbar, stats);
  grid.after(done);

  document.querySelector("#reviewYes").addEventListener("click", () => decide("yes"));
  document.querySelector("#reviewNo").addEventListener("click", () => decide("no"));
  document.querySelector("#reviewUndo").addEventListener("click", undo);
  document.querySelector("#reviewPlay").addEventListener("click", playCurrent);
  document.querySelector("#copyReviewJson").addEventListener("click", copyReviewJson);
  document.querySelector("#clearReview").addEventListener("click", clearReview);

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      decide("no");
    } else if (event.key === "ArrowRight") {
      decide("yes");
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      playCurrent();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      undo();
    }
  });
};

installReviewUi();
showNext();
