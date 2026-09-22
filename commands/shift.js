const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../db/database");
const config = require("../config");

function formatDauer(ms) {
  const min = Math.floor(ms / 60000);
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shift")
    .setDescription("Starte oder beende deine Teamshift.")
    .addSubcommand((sub) => sub.setName("start").setDescription("Startet deine Shift"))
    .addSubcommand((sub) => sub.setName("ende").setDescription("Beendet deine Shift")),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (sub === "start") {
      const laufend = db
        .prepare("SELECT * FROM shifts WHERE userId = ? AND endedAt IS NULL")
        .get(userId);

      if (laufend) {
        return interaction.reply({ content: "Du hast bereits eine laufende Shift.", ephemeral: true });
      }

      db.prepare("INSERT INTO shifts (userId, startedAt) VALUES (?, ?)").run(userId, Date.now());

      const embed = new EmbedBuilder()
        .setTitle("🟢 Shift gestartet")
        .setDescription(`<@${userId}> hat seine Shift gestartet.`)
        .setColor(0x2ecc71)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      const logChannel = interaction.guild.channels.cache.get(config.teamLogChannelId);
      if (logChannel) logChannel.send({ embeds: [embed] }).catch(() => {});
    }

    if (sub === "ende") {
      const laufend = db
        .prepare("SELECT * FROM shifts WHERE userId = ? AND endedAt IS NULL ORDER BY startedAt DESC")
        .get(userId);

      if (!laufend) {
        return interaction.reply({ content: "Du hast aktuell keine laufende Shift.", ephemeral: true });
      }

      const endedAt = Date.now();
      db.prepare("UPDATE shifts SET endedAt = ? WHERE id = ?").run(endedAt, laufend.id);

      const embed = new EmbedBuilder()
        .setTitle("🔴 Shift beendet")
        .setDescription(`<@${userId}> hat seine Shift beendet.\nDauer: **${formatDauer(endedAt - laufend.startedAt)}**`)
        .setColor(0xe74c3c)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      const logChannel = interaction.guild.channels.cache.get(config.teamLogChannelId);
      if (logChannel) logChannel.send({ embeds: [embed] }).catch(() => {});
    }
  },
};
