const quoteElement = document.querySelector("#quote");
const updatedElement = document.querySelector("#updated");
const nextButton = document.querySelector("#next-quote");
const favoriteButton = document.querySelector("#favorite-quote");
const favoriteIcon = document.querySelector("#favorite-icon");
const copyButton = document.querySelector("#copy-quote");
const shareButton = document.querySelector("#share-quote");
const categoryFiltersElement = document.querySelector("#category-filters");
const feedbackElement = document.querySelector("#feedback");
const dateElement = document.querySelector("#date");
const previousQuoteKey = "inspira:last-quote";
const favoriteQuotesKey = "inspira:favorites";
const textFields = [
  "language",
  "locale",
  "documentTitle",
  "description",
  "brandName",
  "brandLabel",
  "dailyLabel",
  "eyebrow",
  "heading",
  "loadingQuote",
  "quotePrefix",
  "quoteSuffix",
  "updatedTemplate",
  "filterLabel",
  "favoriteLabel",
  "favoritedLabel",
  "savedFavoriteMessage",
  "removedFavoriteMessage",
  "copyLabel",
  "shareLabel",
  "copiedMessage",
  "sharedMessage",
  "shareFallbackMessage",
  "shareFallbackMessage",
  "emptyFavorites",
  "nextButton",
  "footerMessage",
];

let ui;
let quotes = [];
let favoriteIds = new Set();
let currentQuote;
let activeFilter = "all";
let filterButtons = [];

function applyInterface(interfaceData) {
  for (const field of textFields) {
    if (typeof interfaceData[field] !== "string") {
      throw new Error(`Campo de interface inválido: ${field}.`);
    }
  }
  if (!Array.isArray(interfaceData.filters) || !interfaceData.filters.every((filter) =>
    typeof filter.id === "string" && typeof filter.label === "string")) {
    throw new Error("Lista de filtros de interface inválida.");
  }

  document.documentElement.lang = interfaceData.language;
  document.title = interfaceData.documentTitle;
  document.querySelector('meta[name="description"]').content = interfaceData.description;
  document.querySelector("#brand").setAttribute("aria-label", interfaceData.brandLabel);
  document.querySelector("#brand-name").textContent = interfaceData.brandName;
  document.querySelector("#daily-label").textContent = interfaceData.dailyLabel;
  document.querySelector("#eyebrow").textContent = interfaceData.eyebrow;
  document.querySelector("#page-title").textContent = interfaceData.heading;
  quoteElement.textContent = interfaceData.loadingQuote;
  document.querySelector("#favorite-label").textContent = interfaceData.favoriteLabel;
  document.querySelector("#copy-label").textContent = interfaceData.copyLabel;
  document.querySelector("#share-label").textContent = interfaceData.shareLabel;
  document.querySelector("#next-label").textContent = interfaceData.nextButton;
  document.querySelector("#footer-message").textContent = interfaceData.footerMessage;
  categoryFiltersElement.setAttribute("aria-label", interfaceData.filterLabel);
  dateElement.textContent = new Intl.DateTimeFormat(interfaceData.locale, interfaceData.dateFormat).format(new Date());
}

function loadFavorites() {
  try {
    const stored = localStorage.getItem(favoriteQuotesKey);
    const parsed = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(parsed)) {
      throw new Error();
    }
    return new Set(parsed.filter((id) => typeof id === "string"));
  } catch {
    showFeedback(ui.errors.storage);
    return new Set();
  }
}

function updateFilterButtons() {
  for (const { button, filter } of filterButtons) {
    const label = filter.id === "favorites"
      ? filter.label.replace("{count}", String(favoriteIds.size))
      : filter.label;
    button.textContent = label;
    button.setAttribute("aria-pressed", String(filter.id === activeFilter));
  }
}

function renderFilterButtons() {
  filterButtons = ui.filters.map((filter) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-button";
    button.addEventListener("click", () => {
      activeFilter = filter.id;
      updateFilterButtons();
      showQuote();
    });
    return { button, filter };
  });
  categoryFiltersElement.replaceChildren(...filterButtons.map(({ button }) => button));
  updateFilterButtons();
}

function showFeedback(message) {
  feedbackElement.textContent = message;
}

function updateActionButtons() {
  const isFavorited = currentQuote && favoriteIds.has(currentQuote.id);
  favoriteButton.disabled = !currentQuote;
  favoriteButton.setAttribute("aria-pressed", String(Boolean(isFavorited)));
  favoriteIcon.textContent = isFavorited ? "♥" : "♡";
  document.querySelector("#favorite-label").textContent = isFavorited
    ? ui.favoritedLabel
    : ui.favoriteLabel;
  copyButton.disabled = !currentQuote;
  shareButton.disabled = !currentQuote;
  nextButton.disabled = !currentQuote;
}

function showQuote() {
  let eligibleQuotes = quotes;
  if (activeFilter === "favorites") {
    eligibleQuotes = quotes.filter((quote) => favoriteIds.has(quote.id));
  } else if (activeFilter !== "all") {
    eligibleQuotes = quotes.filter((quote) => quote.category === activeFilter);
  }

  if (eligibleQuotes.length === 0) {
    currentQuote = undefined;
    quoteElement.textContent = ui.emptyFavorites;
    updateActionButtons();
    return;
  }

  let previousId;
  try {
    previousId = localStorage.getItem(previousQuoteKey);
  } catch {
    showFeedback(ui.errors.storage);
  }

  const alternatives = eligibleQuotes.filter((quote) => quote.id !== previousId);
  const choices = alternatives.length > 0 ? alternatives : eligibleQuotes;
  currentQuote = choices[Math.floor(Math.random() * choices.length)];

  try {
    localStorage.setItem(previousQuoteKey, currentQuote.id);
  } catch {
    showFeedback(ui.errors.storage);
  }

  quoteElement.classList.remove("quote-enter");
  void quoteElement.offsetWidth;
  quoteElement.textContent = `${ui.quotePrefix}${currentQuote.text}${ui.quoteSuffix}`;
  quoteElement.classList.add("quote-enter");
  updateActionButtons();
}

function toggleFavorite() {
  const wasFavorited = favoriteIds.has(currentQuote.id);
  if (wasFavorited) {
    favoriteIds.delete(currentQuote.id);
  } else {
    favoriteIds.add(currentQuote.id);
  }

  try {
    localStorage.setItem(favoriteQuotesKey, JSON.stringify([...favoriteIds]));
  } catch {
    if (wasFavorited) {
      favoriteIds.add(currentQuote.id);
    } else {
      favoriteIds.delete(currentQuote.id);
    }
    showFeedback(ui.errors.storage);
    return;
  }

  updateFilterButtons();
  showFeedback(wasFavorited ? ui.removedFavoriteMessage : ui.savedFavoriteMessage);
  if (activeFilter === "favorites" && wasFavorited) {
    showQuote();
  } else {
    updateActionButtons();
  }
}

async function copyQuote() {
  try {
    await navigator.clipboard.writeText(`${ui.quotePrefix}${currentQuote.text}${ui.quoteSuffix}`);
    showFeedback(ui.copiedMessage);
  } catch {
    showFeedback(ui.errors.clipboard);
  }
}

async function shareQuote() {
  const text = `${ui.quotePrefix}${currentQuote.text}${ui.quoteSuffix}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: ui.documentTitle, text });
      showFeedback(ui.sharedMessage);
    } else {
      await navigator.clipboard.writeText(text);
      showFeedback(ui.shareFallbackMessage);
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      showFeedback(ui.errors.share);
    }
  }
}

async function loadJson(path) {
  const response = await fetch(`./${path}?v=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`${path} request failed (${response.status}).`);
  }
  return response.json();
}

async function loadInterface() {
  try {
    ui = await loadJson("interface.json");
    applyInterface(ui);
    renderFilterButtons();
  } catch (error) {
    quoteElement.textContent = ui?.errors?.interface ?? error.message;
    nextButton.disabled = true;
    return;
  }

  try {
    const data = await loadJson("quotes.json");
    if (!Array.isArray(data.quotes) || data.quotes.length < 2) {
      throw new Error();
    }
    if (!data.quotes.every((quote) =>
      typeof quote.id === "string" && typeof quote.text === "string" && typeof quote.category === "string")) {
      throw new Error();
    }

    quotes = data.quotes;
    favoriteIds = loadFavorites();
    const updatedDate = new Date(`${data.updatedAt}T12:00:00Z`);
    const formattedDate = new Intl.DateTimeFormat(ui.locale, ui.updatedDateFormat).format(updatedDate);
    updatedElement.textContent = ui.updatedTemplate.replace("{date}", formattedDate);
    nextButton.addEventListener("click", showQuote);
    favoriteButton.addEventListener("click", toggleFavorite);
    copyButton.addEventListener("click", copyQuote);
    shareButton.addEventListener("click", shareQuote);
    showQuote();
  } catch (error) {
    quoteElement.textContent = ui.errors?.quotes ?? error.message;
    nextButton.disabled = true;
    favoriteButton.disabled = true;
    copyButton.disabled = true;
    shareButton.disabled = true;
  }
}

loadInterface();
