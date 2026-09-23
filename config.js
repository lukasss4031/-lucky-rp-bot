// =========================================================================
// KONFIGURATION - Hier trägst du deine eigenen IDs ein.
// IDs bekommst du per Rechtsklick auf Server/Kanal/Rolle -> "ID kopieren"
// (Discord-Einstellungen -> Erweitert -> Entwicklermodus muss aktiviert sein)
// =========================================================================

module.exports = {
  // Rolle(n), die uprank/downrank/verwarnen/Roblox-Warns nutzen darf (Array = mehrere Rollen erlaubt)
  moderationRoleId: ["1550950817496825867", "1550985124043034726", "1550950740862828574"],

  // Rolle, die Vorschläge annehmen/ablehnen darf
  vorschlagReviewRoleId: "1550985124043034726",

  // Kanal, in dem Vorschläge gepostet werden
  vorschlagChannelId: "1551004481292996758",

  // Kanal, in dem Fragen an den KI-Assistenten gestellt werden können
  fragenChannelId: "1550950516723294228",

  // Sprachkanal "Support-Warteraum"
  supportWarteraumChannelId: "1550954146398732368",
  // Textkanal, in dem das Team gepingt wird, wenn jemand im Warteraum ist
  supportPingChannelId: "1551295071461310554",
  // Rolle(n), die bei Support-Anfragen gepingt wird (Array = mehrere Rollen erlaubt)
  supportPingRoleId: ["1550950817496825867", "1550985124043034726"],

  // Kategorie, in der neue Ticket-Kanäle erstellt werden
  ticketCategoryId: "1550963611751551026",
  // Kanal, in dem der Ticket-Öffnen-Button gepostet wird
  ticketPanelChannelId: "1550953951514333235",

  // Kanal, in dem der Bewerbung-Button gepostet wird
  bewerbungPanelChannelId: "1550984458000273430",
  // Kanal, in dem eingehende Bewerbungen landen (Pending)
  bewerbungReviewChannelId: "1550985400762245160",
  // Kanal für akzeptierte Bewerbungen
  bewerbungAkzeptiertChannelId: "1550985826366922752",
  // Kanal für abgelehnte Bewerbungen
  bewerbungAbgelehntChannelId: "1550985901390172241",

  // Sprachkanäle, deren NAME automatisch den Serverstatus anzeigt
  // (Bot benennt diese Kanäle alle paar Minuten um, z.B. "👥 Spieler: 800")
  statusChannels: {
    playersChannelId: "1551271960904867950",
    botsChannelId: "1551272085794463894",
    boostsChannelId: "1551272666432938094",
  },

  // Kanal für das Team-Log (uprank, downrank, verwarnen, shift, deranken usw.)
  teamLogChannelId: "1551001576662110308",

  // Geordnete Rangliste von "niedrigster" bis "höchster" Rolle für uprank/downrank.
  // WICHTIG: Reihenfolge = Rangfolge.
  rankLadder: [
    "1550947160231645255",
    "1550947142808375377",
    "1550947126039805952",
    "1550947109451206766",
    "1550947039867568169",
    "1550946983081021440",
    "1550946937610698782",
    "1550946912352469054",
  ],

  // Einfache Wissensdatenbank für den KI-Assistenten im Fragen-Kanal.
  // Passe/erweitere die Einträge nach deinem Server.
  faq: [
    {
      keywords: ["join", "beitreten", "wie komme ich", "server ip", "wie betrete"],
      answer: `Um Lucky RP beizutreten musst du folgende Schritte beachten:
1. Notruf Hamburg in Roblox joinen
2. Handy öffnen und die Server App öffnen
3. 1raxadtp als Joincode benutzen.`,
    },
    {
      keywords: ["wie heißt der server", "servername", "wie heißt dieser server"],
      answer: "Dieser Server heißt **Lucky RP** und ist ein Notruf-Hamburg-Roleplay-Server auf Roblox.",
    },
    {
      keywords: ["bewerben", "bewerbung", "team werden"],
      answer: "Du kannst dich über den Bewerbungs-Button im entsprechenden Kanal als Teammitglied bewerben. Dort öffnet sich ein Formular.",
    },
    {
      keywords: ["ticket", "support", "hilfe brauche"],
      answer: "Für individuelle Hilfe öffne bitte ein Ticket über den Ticket-Kanal, dort wählst du die passende Kategorie aus.",
    },
    {
      keywords: ["hallo", "helfen", "hilfe"],
      answer: "Hallo, wie kann ich dir heute weiterhelfen?",
    },
  ],
};
