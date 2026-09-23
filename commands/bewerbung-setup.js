const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { hasAnyRole } = require("../utils/hasRole");
const { baseEmbed, FARBEN } = require("../utils/embeds");
const config = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bewerbung-setup")
    .setDescription("Postet den Bewerbung-Button in diesem Kanal (nur Team)."),

  async execute(interaction) {
    if (!hasAnyRole(interaction.member, config.moderationRoleId)) {
      return interaction.reply({ content: "❌ Du hast keine Berechtigung für diesen Befehl.", ephemeral: true });
    }

    const embed = baseEmbed(interaction.guild, {
      title: "📝 Team-Bewerbung",
      color: FARBEN.lila,
      description: "Klicke auf den Button, um dich als Teammitglied zu bewerben.",
    });

    const button = new ButtonBuilder()
      .setCustomId("bewerbung_start")
      .setLabel("Jetzt bewerben")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("📝");

    const row = new ActionRowBuilder().addComponents(button);
    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: "✅ Bewerbung-Panel wurde gepostet.", ephemeral: true });
  },
};
