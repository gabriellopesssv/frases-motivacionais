const quoteElement = document.querySelector("#quote");
const updatedElement = document.querySelector("#updated");
const nextButton = document.querySelector("#next-quote");
const dateElement = document.querySelector("#date");
const previousQuoteKey = "inspira:last-quote";
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
  "nextButton",
  "footerMessage",
];

function applyInterface(ui) {
  for (const field of textFields) {
    if (typeof ui[field] !== "string") {
      throw new Error(`Campo de interface inválido: ${field}.`);
    }
  }

  document.documentElement.lang = ui.language;
  document.title = ui.documentTitle;
  document.querySelector('meta[name="description"]').content = ui.description;
  document.querySelector("#brand").setAttribute("aria-label", ui.brandLabel);
  document.querySelector("#brand-name").textContent = ui.brandName;
  document.querySelector("#daily-label").textContent = ui.dailyLabel;
  document.querySelector("#eyebrow").textContent = ui.eyebrow;
  document.querySelector("#page-title").textContent = ui.heading;
  document.querySelector("#quote").textContent = ui.loadingQuote;
  document.querySelector("#next-label").textContent = ui.nextButton;
  document.querySelector("#footer-message").textContent = ui.footerMessage;
  dateElement.textContent = new Intl.DateTimeFormat(ui.locale, ui.dateFormat).format(new Date());
}

function showQuote(quotes, previousId, ui) {
  const choices = quotes.filter((quote) => quote.id !== previousId);
  const quote = choices[Math.floor(Math.random() * choices.length)];
  quoteElement.textContent = `${ui.quotePrefix}${quote.text}${ui.quoteSuffix}`;
  localStorage.setItem(previousQuoteKey, quote.id);
}

async function loadJson(path) {
  const response = await fetch(`./${path}?v=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`${path} request failed (${response.status}).`);
  }
  return response.json();
}

async function loadInterface() {
  let ui;

  try {
    ui = await loadJson("interface.json");
    applyInterface(ui);
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
    if (!data.quotes.every((quote) => typeof quote.id === "string" && typeof quote.text === "string")) {
      throw new Error();
    }

    const lastQuoteId = localStorage.getItem(previousQuoteKey);
    showQuote(data.quotes, lastQuoteId, ui);
    const updatedDate = new Date(`${data.updatedAt}T12:00:00Z`);
    const formattedDate = new Intl.DateTimeFormat(ui.locale, ui.updatedDateFormat).format(updatedDate);
    updatedElement.textContent = ui.updatedTemplate.replace("{date}", formattedDate);
    nextButton.disabled = false;
    nextButton.addEventListener("click", () => {
      showQuote(data.quotes, localStorage.getItem(previousQuoteKey), ui);
    });
  } catch (error) {
    quoteElement.textContent = ui.errors?.quotes ?? error.message;
    nextButton.disabled = true;
  }
}

loadInterface();
