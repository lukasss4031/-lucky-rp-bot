const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const db = require("../db/database");

async function handleJoin(interaction) {
  const giveaway = db.prepare("SELECT * FROM giveaways WHERE messageId = ? AND ended = 0").get(interaction.message.id);
  if (!giveaway) {
    return interaction.reply({ content: "Dieses Giveaway ist bereits beendet.", ephemeral: true });
  }

  const already = db
    .prepare("SELECT 1 FROM giveaway_entries WHERE giveawayId = ? AND userId = ?")
    .get(giveaway.id, interaction.user.id);

  if (already) {
    db.prepare("DELETE FROM giveaway_entries WHERE giveawayId = ? AND userId = ?").run(giveaway.id, interaction.user.id);
  } else {
    db.prepare("INSERT INTO giveaway_entries (giveawayId, userId) VALUES (?, ?)").run(giveaway.id, interaction.user.id);
  }

  const count = db.prepare("SELECT COUNT(*) AS c FROM giveaway_entries WHERE giveawayId = ?").get(giveaway.id).c;

  const button = new ButtonBuilder()
    .setCustomId("giveaway_join")
    .setLabel(`🎉 Teilnehmen (${count})`)
    .setStyle(ButtonStyle.Success);

  await interaction.update({ components: [new ActionRowBuilder().addComponents(button)] });
  await interaction
    .followUp({ content: already ? "Du nimmst nicht mehr teil." : "Du nimmst jetzt teil! 🎉", ephemeral: true })
    .catch(() => {});
}

async function checkExpiredGiveaways(client) {
  const expired = db.prepare("SELECT * FROM giveaways WHERE ended = 0 AND endsAt <= ?").all(Date.now());

  for (const giveaway of expired) {
    db.prepare("UPDATE giveaways SET ended = 1 WHERE id = ?").run(giveaway.id);

    const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
    if (!channel) continue;

    const entries = db.prepare("SELECT userId FROM giveaway_entries WHERE giveawayId = ?").all(giveaway.id);
    const shuffled = entries.map((e) => e.userId).sort(() => Math.random() - 0.5);
    const winners = shuffled.slice(0, giveaway.winnersCount);

    const resultEmbed = new EmbedBuilder()
      .setTitle("🎉 Giveaway beendet")
      .setDescription(
        winners.length > 0
          ? `Herzlichen Glückwunsch ${winners.map((id) => `<@${id}>`).join(", ")}!\nGewonnen: **${giveaway.prize}**`
          : `Niemand hat teilgenommen, es gibt keinen Gewinner für **${giveaway.prize}**.`
      )
      .setColor(0xf1c40f);

    channel.send({ embeds: [resultEmbed] }).catch(() => {});

    const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
    if (message) {
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("giveaway_join").setLabel("Giveaway beendet").setStyle(ButtonStyle.Secondary).setDisabled(true)
      );
      message.edit({ components: [disabledRow] }).catch(() => {});
    }
  }
}

module.exports = { handleJoin, checkExpiredGiveaways };
