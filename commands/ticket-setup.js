const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { hasAnyRole } = require("../utils/hasRole");
const config = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-setup")
    .setDescription("Postet das Ticket-Panel in diesem Kanal (nur Team)."),

  async execute(interaction) {
    if (!hasAnyRole(interaction.member, config.moderationRoleId)) {
      return interaction.reply({ content: "Du hast keine Berechtigung für diesen Befehl.", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle("🎫 Support-Tickets")
      .setDescription("Wähle unten eine Kategorie aus, um ein Ticket zu erstellen.")
      .setColor(0x3498db);

    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket_category_select")
      .setPlaceholder("Kategorie auswählen...")
      .addOptions(
        { label: "Allgemein", value: "allgemein", emoji: "💬" },
        { label: "Bewerbung", value: "bewerbung", emoji: "📝" },
        { label: "Beschwerde", value: "beschwerde", emoji: "⚠️" },
        { label: "Sonstiges", value: "sonstiges", emoji: "❓" }
      );

    const row = new ActionRowBuilder().addComponents(menu);
    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: "Ticket-Panel wurde gepostet.", ephemeral: true });
  },
};
