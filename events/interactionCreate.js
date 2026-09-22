const ticketHandler = require("../modules/ticketHandler");
const bewerbungHandler = require("../modules/bewerbungHandler");
const vorschlagHandler = require("../modules/vorschlagHandler");
const giveawayHandler = require("../modules/giveawayHandler");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    try {
      // --- Slash-Befehle ---
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
        return command.execute(interaction);
      }

      // --- Select-Menü: Ticket-Kategorie ---
      if (interaction.isStringSelectMenu() && interaction.customId === "ticket_category_select") {
        return ticketHandler.createTicket(interaction, interaction.values[0]);
      }

      // --- Buttons ---
      if (interaction.isButton()) {
        const id = interaction.customId;

        if (id === "ticket_close") return ticketHandler.closeTicket(interaction);
        if (id === "bewerbung_start") return interaction.showModal(bewerbungHandler.buildModal());
        if (id === "giveaway_join") return giveawayHandler.handleJoin(interaction);

        if (id.startsWith("bewerbung_accept_")) return bewerbungHandler.handleDecision(interaction, "accept", id.split("_").pop());
        if (id.startsWith("bewerbung_reject_")) return bewerbungHandler.handleDecision(interaction, "reject", id.split("_").pop());

        if (id.startsWith("vorschlag_up_")) return vorschlagHandler.handleVote(interaction, "up", id.split("_").pop());
        if (id.startsWith("vorschlag_down_")) return vorschlagHandler.handleVote(interaction, "down", id.split("_").pop());
        if (id.startsWith("vorschlag_accept_")) return vorschlagHandler.handleDecision(interaction, "accept", id.split("_").pop());
        if (id.startsWith("vorschlag_reject_")) return vorschlagHandler.handleDecision(interaction, "reject", id.split("_").pop());
      }

      // --- Modals ---
      if (interaction.isModalSubmit()) {
        if (interaction.customId === "vorschlag_modal") return vorschlagHandler.handleSubmit(interaction);
        if (interaction.customId === "bewerbung_modal") return bewerbungHandler.handleSubmit(interaction);
      }
    } catch (err) {
      console.error("Fehler bei Interaction:", err);
      const payload = { content: "Es ist ein Fehler aufgetreten.", ephemeral: true };
      if (interaction.deferred || interaction.replied) {
        interaction.followUp(payload).catch(() => {});
      } else {
        interaction.reply(payload).catch(() => {});
      }
    }
  },
};
