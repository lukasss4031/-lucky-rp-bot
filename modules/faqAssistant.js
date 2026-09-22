const config = require("../config");

// Einfacher, kostenloser Assistent auf Keyword-Basis.
// Für eine "echte" KI (die auch freie Fragen beantwortet) müsstest du hier
// einen API-Aufruf an ein Sprachmodell einbauen (z.B. Anthropic-API mit eigenem
// API-Key). Das kostet dann Geld pro Anfrage, daher hier erstmal die kostenlose
// Variante mit einer Wissensdatenbank aus config.js (config.faq).
function findAnswer(message) {
  const text = message.toLowerCase();

  for (const entry of config.faq) {
    if (entry.keywords.some((k) => text.includes(k.toLowerCase()))) {
      return entry.answer;
    }
  }

  return "Dazu habe ich leider keine passende Antwort gefunden. Bitte öffne ein Ticket, damit dir das Team weiterhelfen kann.";
}

module.exports = { findAnswer };
