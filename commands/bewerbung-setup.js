const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { hasAnyRole } = require("../utils/hasRole");
const config = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bewerbung-setup")
    .setDescription("Postet den Bewerbung-Button in diesem Kanal (nur Team)."),

  async execute(interaction) {
    if (!hasAnyRole(interaction.member, config.moderationRoleId)) {
      return interaction.reply({ content: "Du hast keine Berechtigung für diesen Befehl.", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle("📝 Team-Bewerbung")
      .setDescription("Klicke auf den Button, um dich als Teammitglied zu bewerben.")
      .setColor(0x9b59b6);

    const button = new ButtonBuilder()
      .setCustomId("bewerbung_start")
      .setLabel("Jetzt bewerben")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("📝");

    const row = new ActionRowBuilder().addComponents(button);
    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: "Bewerbung-Panel wurde gepostet.", ephemeral: true });
  },
};
