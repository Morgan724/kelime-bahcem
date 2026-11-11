const lessons = [
  {
    id: "animals", title: "Hayvan dostlar", icon: "🐾", tile: "#ffeddf", background: "#fff0e6", minutes: 5,
    words: [
      ["cat", "kedi", "🐱"], ["dog", "köpek", "🐶"], ["bird", "kuş", "🐦"],
      ["fish", "balık", "🐟"], ["rabbit", "tavşan", "🐰"], ["horse", "at", "🐴"]
    ]
  },
  {
    id: "colors", title: "Renkler dünyası", icon: "🎨", tile: "#eee9ff", background: "#f1edff", minutes: 4,
    words: [
      ["red", "kırmızı", "🔴"], ["blue", "mavi", "🔵"], ["yellow", "sarı", "🟡"],
      ["green", "yeşil", "🟢"], ["orange", "turuncu", "🟠"], ["purple", "mor", "🟣"]
    ]
  },
  {
    id: "food", title: "Lezzetli kelimeler", icon: "🍓", tile: "#ffe8ea", background: "#fff0f0", minutes: 5,
    words: [
      ["apple", "elma", "🍎"], ["banana", "muz", "🍌"], ["bread", "ekmek", "🍞"],
      ["milk", "süt", "🥛"], ["egg", "yumurta", "🥚"], ["water", "su", "💧"]
    ]
  },
  {
    id: "school", title: "Okul çantam", icon: "🎒", tile: "#e5f4ff", background: "#eaf6ff", minutes: 5,
    words: [
      ["book", "kitap", "📘"], ["pencil", "kalem", "✏️"], ["bag", "çanta", "🎒"],
      ["ruler", "cetvel", "📏"], ["pen", "tükenmez kalem", "🖊️"], ["eraser", "silgi", "🧽"]
    ]
  }
].map(lesson => ({
  ...lesson,
  words: lesson.words.map(([en, tr, emoji], index) => ({ id: `${lesson.id}-${index}`, en, tr, emoji }))
}));

const allWords = lessons.flatMap(lesson => lesson.words);
const SAVE_KEY = "kelime-bahcem-v1";
const blankProgress = () => ({ xp: 0, seenWords: [], rewards: [] });
let progress = readProgress();
let currentView = "home";
let activeLesson = lessons[0];
let studyIndex = 0;
let matchState = null;
let quizState = null;
let toastTimer;

function readProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    return saved && typeof saved.xp === "number" ? { ...blankProgress(), ...saved } : blankProgress();
  } catch { return blankProgress(); }
}
function saveProgress() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(progress)); } catch { /* Keep the game playable when storage is unavailable. */ }
  updateXp();
}
function updateXp() { const el = document.querySelector("#top-xp"); if (el) el.textContent = progress.xp; }
function award(key, points = 5) {
  if (progress.rewards.includes(key)) return false;
  progress.rewards.push(key);
  progress.xp += points;
  saveProgress();
  return true;
}
function markSeen(word) {
  if (!progress.seenWords.includes(word.id)) {
    progress.seenWords.push(word.id);
    saveProgress();
    showToast(`Albümüne eklendi: ${word.en} ✨`);
  }
}
function esc(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2100);
}
function speak(word) {
  if (!("speechSynthesis" in window)) { showToast("Ses özelliği bu tarayıcıda kullanılamıyor."); return; }
  window.speechSynthesis.cancel();
  const phrase = new SpeechSynthesisUtterance(word);
  phrase.lang = "en-US";
  phrase.rate = 0.78;
  phrase.pitch = 1.08;
  window.speechSynthesis.speak(phrase);
}
function setNavActive(view) {
  document.querySelectorAll("[data-nav]").forEach(button => {
    const active = button.dataset.nav === view || (view === "lesson" && button.dataset.nav === "home");
    button.classList.toggle("active", active);
  });
}
function render() {
  updateXp();
  setNavActive(currentView === "collection" ? "collection" : "home");
  const main = document.querySelector("#main");
  if (currentView === "lesson") main.innerHTML = lessonScreen();
  else if (currentView === "study") main.innerHTML = studyScreen();
  else if (currentView === "match") main.innerHTML = matchScreen();
  else if (currentView === "quiz") main.innerHTML = quizScreen();
  else if (currentView === "collection") main.innerHTML = collectionScreen();
  else main.innerHTML = homeScreen();
  main.focus({ preventScroll: true });
}

function homeScreen() {
  const total = allWords.length;
  const learned = progress.seenWords.length;
  const percent = Math.round(learned / total * 100);
  const nextLesson = lessons.find(lesson => lesson.words.some(word => !progress.seenWords.includes(word.id))) || lessons[0];
  return `
    <div class="home-hero">
      <div class="hero-copy">
        <div class="hero-kicker">KELİME BAHÇESİ · A1</div>
        <h1>İngilizceyi gör,<br>oyna, hatırla!</h1>
        <p>Minik oyunlarla yeni kelimeler öğrenmeye hazır mısın?</p>
        <button class="hero-button" data-action="open-lesson" data-lesson="${nextLesson.id}">Haydi başlayalım <span aria-hidden="true">→</span></button>
      </div>
      <div class="hero-art" aria-hidden="true">
        <span class="hero-spark s1">✦</span><span class="hero-spark s2">✧</span>
        <span class="hero-bubble b1">⭐</span><span class="hero-bubble b2">📗</span>
        <div class="mascot">🦊</div>
      </div>
    </div>
    <section class="stats-row" aria-label="Öğrenme ilerlemen">
      <div class="stat-card"><span class="stat-emoji">🌼</span><div><div class="stat-value">${learned} / ${total} kelime</div><div class="stat-label">Kelime bahçem büyüyor</div><div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div></div></div>
      <div class="stat-card"><span class="stat-emoji">⭐</span><div><div class="stat-value">${progress.xp} yıldız</div><div class="stat-label">Toplam oyun ödülün</div></div></div>
      <div class="stat-card"><span class="stat-emoji">🎯</span><div><div class="stat-value">${lessons.length} oyun</div><div class="stat-label">Keşfedilecek konu</div></div></div>
    </section>
    <section aria-labelledby="lessons-title">
      <div class="section-head"><div><h2 id="lessons-title">Maceranı seç</h2><p class="section-note">Bir konu seç, kelimeleri oyunla keşfet!</p></div><button class="text-button" data-nav="collection">Albümümü gör →</button></div>
      <div class="lesson-grid">${lessons.map((lesson, index) => {
        const count = lesson.words.filter(word => progress.seenWords.includes(word.id)).length;
        return `<button class="lesson-card" style="--tile:${lesson.tile}" data-action="open-lesson" data-lesson="${lesson.id}" aria-label="${lesson.title}, ${lesson.words.length} kelime">
          <span class="lesson-number">0${index + 1}</span><span class="lesson-icon" aria-hidden="true">${lesson.icon}</span>
          <h3>${lesson.title}</h3><p>${lesson.words.length} yeni kelime · ${lesson.minutes} dk</p>
          <div class="lesson-bottom"><span>${count ? `${count}/${lesson.words.length} öğrendin` : "Yeni macera"}</span><span class="tiny-progress"><span style="width:${count / lesson.words.length * 100}%"></span></span></div>
        </button>`;
      }).join("")}</div>
    </section>
    <div class="game-banner"><div class="game-copy"><div class="game-icon" aria-hidden="true">🧠</div><div><h3>Hafıza kartları seni bekliyor!</h3><p>Resimlerle İngilizce kelimeleri eşleştir.</p></div></div><button class="outline-button" data-action="open-match" data-lesson="${nextLesson.id}">Oyna <span aria-hidden="true">→</span></button></div>`;
}

function lessonScreen() {
  const studied = activeLesson.words.filter(word => progress.seenWords.includes(word.id)).length;
  return `
    <button class="back-button" data-nav="home"><span aria-hidden="true">←</span> Maceralara dön</button>
    <section class="lesson-hero" style="--lesson-bg:${activeLesson.background}">
      <div class="lesson-hero-icon" aria-hidden="true">${activeLesson.icon}</div>
      <div><div class="eyebrow">A1 · ${activeLesson.minutes} DAKİKA</div><h1>${activeLesson.title}</h1><p>${studied} / ${activeLesson.words.length} kelime albümünde · Bak, dinle, hatırla!</p></div>
    </section>
    <div class="lesson-subhead"><h2>Bu bölümde neler var?</h2><span>${activeLesson.words.length} resimli kelime</span></div>
    <div class="word-grid">${activeLesson.words.map(word => `<div class="word-peek"><span class="emoji" aria-hidden="true">${word.emoji}</span><strong>${word.en}</strong><small>${word.tr}</small></div>`).join("")}</div>
    <div class="lesson-subhead"><h2>Nasıl oynamak istersin?</h2><span>Birini seç, başlayalım!</span></div>
    <div class="mode-grid">
      <button class="mode-card" data-action="study"><span class="mode-icon" aria-hidden="true">🃏</span><span><strong>Kelime kartları</strong><small>Gör, dinle ve öğren</small></span></button>
      <button class="mode-card" data-action="match"><span class="mode-icon" aria-hidden="true">🧠</span><span><strong>Eşini bul</strong><small>Resmi, kelimesiyle eşleştir</small></span></button>
      <button class="mode-card" data-action="quiz"><span class="mode-icon" aria-hidden="true">🔎</span><span><strong>Resmi bul</strong><small>Doğru kelimeyi seç</small></span></button>
    </div>`;
}

function studyScreen() {
  const word = activeLesson.words[studyIndex];
  const pct = (studyIndex + 1) / activeLesson.words.length * 100;
  return `<div class="activity-panel">
    <div class="activity-top"><h1 class="activity-title">🃏 Kelime kartları</h1><span class="activity-progress-text">${studyIndex + 1} / ${activeLesson.words.length}</span></div>
    <div class="activity-track"><span style="width:${pct}%"></span></div>
    <article class="flashcard" aria-label="${word.en}, ${word.tr}">
      <div class="flashcard-emoji" aria-hidden="true">${word.emoji}</div><h2>${word.en}</h2><div class="translation">${word.tr}</div>
      <button class="speaker-button" data-action="speak" data-word="${word.en}" aria-label="${word.en} kelimesini dinle">🔊 Dinle</button>
    </article>
    <div class="activity-actions"><button class="soft-button" data-nav="lesson">Sonra bakarım</button><button class="primary-button" data-action="learned">Öğrendim! ✓</button></div>
  </div>`;
}

function createMatchState() {
  const chosen = activeLesson.words.slice(0, 4);
  const cards = chosen.flatMap(word => [
    { id: `${word.id}-pic`, pair: word.id, side: "picture", face: word.emoji, word },
    { id: `${word.id}-word`, pair: word.id, side: "word", face: word.en, word }
  ]);
  return { cards: shuffle(cards), selected: [], matches: 0, moves: 0, locked: false };
}
function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function matchScreen() {
  if (!matchState) matchState = createMatchState();
  const done = matchState.matches === 4;
  if (done) return completeScreen("match");
  const items = matchState.cards.map((card, index) => {
    const flipped = matchState.selected.includes(index);
    const matched = matchState.cards[index].matched === true;
    const reveal = flipped || matched;
    return `<button class="memory-card ${reveal ? "flipped" : ""} ${matched ? "matched" : ""} ${card.side === "picture" ? "picture" : ""}" data-action="flip" data-index="${index}" ${reveal || matchState.locked ? "disabled" : ""} aria-label="${reveal ? `${card.side === "picture" ? card.word.en + ", " : ""}${card.face}` : "Kapalı hafıza kartı"}" aria-pressed="${reveal}"><span class="card-back" aria-hidden="true">?</span><span class="card-face" aria-hidden="true">${card.face}</span></button>`;
  }).join("");
  return `<div class="activity-panel">
    <div class="activity-top"><h1 class="activity-title">🧠 Eşini bul</h1><span class="activity-progress-text">${matchState.matches} / 4 çift · ${matchState.moves} hamle</span></div>
    <div class="activity-track"><span style="width:${matchState.matches / 4 * 100}%"></span></div>
    <div class="memory-board" aria-label="Hafıza kartları">${items}</div>
    <p class="memory-help">Aynı kelimeye ait resmi ve İngilizce kartı bul.</p>
    <div class="activity-actions"><button class="soft-button" data-nav="lesson">Derse dön</button><button class="primary-button" data-action="restart-match">Karıştır ↻</button></div>
  </div>`;
}

function startQuiz() {
  const words = shuffle(activeLesson.words).slice(0, 5);
  const optionsByQuestion = words.map(word => shuffle([word, ...shuffle(allWords.filter(item => item.id !== word.id)).slice(0, 2)]));
  quizState = { words, optionsByQuestion, index: 0, score: 0, answered: false, selected: null };
}
function quizScreen() {
  if (!quizState) startQuiz();
  if (quizState.index >= quizState.words.length) return completeScreen("quiz");
  const word = quizState.words[quizState.index];
  const options = quizState.optionsByQuestion[quizState.index];
  const pct = quizState.index / quizState.words.length * 100;
  return `<div class="activity-panel">
    <div class="activity-top"><h1 class="activity-title">🔎 Resmi bul</h1><span class="activity-progress-text">${quizState.index + 1} / ${quizState.words.length} · ⭐ ${quizState.score}</span></div>
    <div class="activity-track"><span style="width:${pct}%"></span></div>
    <div class="quiz-card"><div><div class="quiz-emoji" aria-hidden="true">${word.emoji}</div><p class="quiz-prompt">Bu resmin İngilizcesi ne?</p><p class="quiz-translation">${word.tr}</p></div></div>
    <div class="choice-grid">${options.map(option => {
      let state = "";
      if (quizState.answered && option.id === word.id) state = "correct";
      else if (quizState.answered && option.id === quizState.selected) state = "incorrect";
      return `<button class="choice-button ${state}" data-action="answer" data-answer="${option.id}" ${quizState.answered ? "disabled" : ""}>${option.en}</button>`;
    }).join("")}</div>
    <div class="feedback ${quizState.answered ? (quizState.selected === word.id ? "good" : "try") : ""}" aria-live="polite">${quizState.answered ? (quizState.selected === word.id ? "Harika! Doğru bildin! 🎉" : `Güzel deneme! Doğru cevap: ${word.en} 🌱`) : ""}</div>
    <div class="activity-actions"><button class="soft-button" data-nav="lesson">Derse dön</button>${quizState.answered ? `<button class="primary-button" data-action="next-question">Devam et →</button>` : ""}</div>
  </div>`;
}

function completeScreen(type) {
  const score = type === "quiz" ? quizState.score : matchState.moves;
  const title = type === "quiz" ? "Resim ustası!" : "Hafıza şampiyonu!";
  const message = type === "quiz" ? `${quizState.score} doğru cevap verdin. Kelimeler aklında!` : `Dört çifti ${matchState.moves} hamlede buldun. Ne güzel hatırladın!`;
  return `<div class="activity-panel"><section class="complete-card"><div class="complete-emoji" aria-hidden="true">🏆</div><div class="eyebrow">${activeLesson.title.toLocaleUpperCase("tr-TR")}</div><h1>${title}</h1><p>${message}</p><div class="activity-actions"><button class="soft-button" data-nav="lesson">Başka oyun seç</button><button class="primary-button" data-action="replay" data-type="${type}">Bir daha oyna ↻</button></div></section></div>`;
}

function collectionScreen() {
  const found = new Set(progress.seenWords);
  const percent = Math.round(found.size / allWords.length * 100);
  return `<section class="collection-hero"><span aria-hidden="true">📖</span><div><div class="eyebrow">KELİME ALBÜMÜM</div><h1>Harika bir koleksiyon!</h1><p>${found.size} / ${allWords.length} kelime keşfettin · ${percent}% tamamlandı</p><div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div></div></section>
    ${lessons.map(lesson => `<section class="collection-section"><div class="section-head"><div><h2>${lesson.icon} ${lesson.title}</h2><p class="section-note">${lesson.words.filter(word => found.has(word.id)).length} / ${lesson.words.length} kelime bulundu</p></div><button class="text-button" data-action="open-lesson" data-lesson="${lesson.id}">Oyna →</button></div><div class="sticker-grid">${lesson.words.map(word => {
      const isFound = found.has(word.id);
      return `<div class="sticker ${isFound ? "" : "locked"}" ${isFound ? "" : `aria-label="Henüz bulunmadı: ${word.tr}"`}><span class="emoji" aria-hidden="true">${isFound ? word.emoji : "❔"}</span><strong>${isFound ? word.en : "? ? ?"}</strong><small>${isFound ? word.tr : "Bulmak için oyna"}</small></div>`;
    }).join("")}</div></section>`).join("")}`;
}

document.addEventListener("click", event => {
  const target = event.target.closest("[data-nav], [data-action]");
  if (!target) return;
  if (target.dataset.nav) {
    const view = target.dataset.nav;
    currentView = view;
    render();
    return;
  }
  const action = target.dataset.action;
  if (target.dataset.lesson) activeLesson = lessons.find(lesson => lesson.id === target.dataset.lesson) || lessons[0];
  if (action === "open-lesson") { currentView = "lesson"; render(); }
  else if (action === "study") { studyIndex = 0; currentView = "study"; render(); speak(activeLesson.words[0].en); }
  else if (action === "learned") {
    const word = activeLesson.words[studyIndex];
    markSeen(word);
    if (studyIndex + 1 < activeLesson.words.length) { studyIndex++; render(); }
    else { award(`study-${activeLesson.id}`, 4); currentView = "lesson"; render(); showToast("Bölüm kartlarını tamamladın! ⭐"); }
  }
  else if (action === "speak") speak(target.dataset.word);
  else if (action === "match" || action === "open-match") { matchState = createMatchState(); currentView = "match"; render(); }
  else if (action === "restart-match") { matchState = createMatchState(); render(); }
  else if (action === "flip") flipCard(Number(target.dataset.index));
  else if (action === "quiz") { startQuiz(); currentView = "quiz"; render(); }
  else if (action === "answer") answerQuiz(target.dataset.answer);
  else if (action === "next-question") {
    quizState.index++;
    quizState.answered = false;
    quizState.selected = null;
    if (quizState.index >= quizState.words.length) award(`quiz-${activeLesson.id}`, 8);
    render();
  }
  else if (action === "replay") {
    if (target.dataset.type === "quiz") startQuiz(); else matchState = createMatchState();
    render();
  }
});

function flipCard(index) {
  if (!matchState || matchState.locked || matchState.selected.includes(index)) return;
  matchState.selected.push(index);
  if (matchState.selected.length === 2) {
    matchState.moves++;
    const [first, second] = matchState.selected.map(i => matchState.cards[i]);
    if (first.pair === second.pair && first.side !== second.side) {
      matchState.cards[matchState.selected[0]].matched = true;
      matchState.cards[matchState.selected[1]].matched = true;
      matchState.matches++;
      matchState.selected = [];
      if (matchState.matches === 4) award(`match-${activeLesson.id}`, 8);
    } else {
      matchState.locked = true;
      window.setTimeout(() => {
        if (!matchState) return;
        matchState.selected = [];
        matchState.locked = false;
        render();
      }, 720);
    }
  }
  render();
}

function answerQuiz(answerId) {
  if (!quizState || quizState.answered) return;
  const word = quizState.words[quizState.index];
  quizState.answered = true;
  quizState.selected = answerId;
  if (answerId === word.id) { quizState.score++; markSeen(word); }
  render();
}

document.querySelectorAll("[data-nav]").forEach(button => button.addEventListener("keydown", event => {
  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); button.click(); }
}));
render();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
