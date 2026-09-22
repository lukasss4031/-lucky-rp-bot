const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const db = require("../db/database");
const { hasAnyRole } = require("../utils/hasRole");
const config = require("../config");

function parseDauer(text) {
  // z.B. "10m", "2h", "1d"
  const match = text.match(/^(\d+)(m|h|d)$/i);
  if (!match) return null;
  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const ms = unit === "m" ? 60000 : unit === "h" ? 3600000 : 86400000;
  return amount * ms;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("giveaway-start")
    .setDescription("Startet ein Giveaway.")
    .addStringOption((o) => o.setName("preis").setDescription("Was wird verlost?").setRequired(true))
    .addStringOption((o) =>
      o.setName("dauer").setDescription("z.B. 10m, 2h, 1d").setRequired(true)
    )
    .addIntegerOption((o) => o.setName("gewinner").setDescription("Anzahl Gewinner").setRequired(true)),

  async execute(interaction) {
    if (!hasAnyRole(interaction.member, config.moderationRoleId)) {
      return interaction.reply({ content: "Du hast keine Berechtigung für diesen Befehl.", ephemeral: true });
    }

    const preis = interaction.options.getString("preis");
    const dauerText = interaction.options.getString("dauer");
    const gewinner = interaction.options.getInteger("gewinner");
    const dauerMs = parseDauer(dauerText);

    if (!dauerMs) {
      return interaction.reply({
        content: "Ungültiges Dauer-Format. Nutze z.B. `10m`, `2h` oder `1d`.",
        ephemeral: true,
      });
    }

    const endsAt = Date.now() + dauerMs;

    const embed = new EmbedBuilder()
      .setTitle("🎉 Giveaway 🎉")
      .setDescription(`**Preis:** ${preis}\n**Gewinner:** ${gewinner}\n**Endet:** <t:${Math.floor(endsAt / 1000)}:R>\n\nKlicke auf den Button, um teilzunehmen!`)
      .setColor(0xf1c40f)
      .setFooter({ text: "Gehostet von " + interaction.user.username });

    const button = new ButtonBuilder()
      .setCustomId("giveaway_join")
      .setLabel("🎉 Teilnehmen (0)")
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(button);
    await interaction.reply({ embeds: [embed], components: [row] });
    const message = await interaction.fetchReply();

    db.prepare(
      "INSERT INTO giveaways (messageId, channelId, prize, winnersCount, endsAt, hostId) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(message.id, interaction.channel.id, preis, gewinner, endsAt, interaction.user.id);
  },
};
