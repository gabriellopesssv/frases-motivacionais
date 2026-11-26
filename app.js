const quoteElement = document.querySelector("#quote");
const updatedElement = document.querySelector("#updated");
const nextButton = document.querySelector("#next-quote");
const dateElement = document.querySelector("#date");
const previousQuoteKey = "inspira:last-quote";

function showQuote(quotes, previousId) {
  const choices = quotes.filter((quote) => quote.id !== previousId);
  const quote = choices[Math.floor(Math.random() * choices.length)];
  quoteElement.textContent = `“${quote.text}”`;
  localStorage.setItem(previousQuoteKey, quote.id);
}

async function loadQuotes() {
  try {
    const response = await fetch(`./quotes.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Não foi possível carregar as frases (${response.status}).`);
    }

    const data = await response.json();
    if (!Array.isArray(data.quotes) || data.quotes.length < 2) {
      throw new Error("A lista de frases precisa conter pelo menos duas opções.");
    }

    const lastQuoteId = localStorage.getItem(previousQuoteKey);
    showQuote(data.quotes, lastQuoteId);
    updatedElement.textContent = `Frases renovadas em ${new Date(`${data.updatedAt}T12:00:00Z`).toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    })}.`;
    nextButton.addEventListener("click", () => {
      showQuote(data.quotes, localStorage.getItem(previousQuoteKey));
    });
  } catch (error) {
    quoteElement.textContent = "Não foi possível carregar uma nova frase agora. Tente novamente em instantes.";
    updatedElement.textContent = error.message;
    nextButton.disabled = true;
  }
}

dateElement.textContent = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date());

loadQuotes();
