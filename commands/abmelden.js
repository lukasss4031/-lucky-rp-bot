const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../db/database");
const config = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("abmelden")
    .setDescription("Meldet dich vom Dienst ab (beendet eine laufende Shift, falls vorhanden)."),

  async execute(interaction) {
    const userId = interaction.user.id;
    const laufend = db.prepare("SELECT * FROM shifts WHERE userId = ? AND endedAt IS NULL").get(userId);

    if (laufend) {
      db.prepare("UPDATE shifts SET endedAt = ? WHERE id = ?").run(Date.now(), laufend.id);
    }

    const embed = new EmbedBuilder()
      .setTitle("👋 Abgemeldet")
      .setDescription(`<@${userId}> hat sich vom Dienst abgemeldet.`)
      .setColor(0x95a5a6)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    const logChannel = interaction.guild.channels.cache.get(config.teamLogChannelId);
    if (logChannel) logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};
