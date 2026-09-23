const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const db = require("../db/database");
const { hasAnyRole } = require("../utils/hasRole");
const { baseEmbed, FARBEN } = require("../utils/embeds");
const config = require("../config");

async function handleSubmit(interaction) {
  const text = interaction.fields.getTextInputValue("vorschlag_text");

  const result = db
    .prepare("INSERT INTO suggestions (userId, content, createdAt) VALUES (?, ?, ?)")
    .run(interaction.user.id, text, Date.now());

  const embed = baseEmbed(interaction.guild, {
    title: "💡 Neuer Vorschlag",
    color: FARBEN.info,
    description: text,
    fields: [
      { name: "👍 Dafür", value: "0", inline: true },
      { name: "👎 Dagegen", value: "0", inline: true },
    ],
  })
    .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
    .setFooter({ text: `Vorschlag #${result.lastInsertRowid} — Status: Ausstehend` });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`vorschlag_up_${result.lastInsertRowid}`).setLabel("👍").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`vorschlag_down_${result.lastInsertRowid}`).setLabel("👎").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`vorschlag_accept_${result.lastInsertRowid}`).setLabel("Annehmen").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`vorschlag_reject_${result.lastInsertRowid}`).setLabel("Ablehnen").setStyle(ButtonStyle.Danger)
  );

  const channel = interaction.guild.channels.cache.get(config.vorschlagChannelId);
  if (!channel) {
    return interaction.reply({ content: "Der Vorschlags-Kanal ist noch nicht in config.js eingetragen.", ephemeral: true });
  }

  const message = await channel.send({ embeds: [embed], components: [row] });
  db.prepare("UPDATE suggestions SET messageId = ? WHERE id = ?").run(message.id, result.lastInsertRowid);

  await interaction.reply({ content: "✅ Danke, dein Vorschlag wurde eingereicht!", ephemeral: true });
}

async function handleVote(interaction, direction, suggestionId) {
  const column = direction === "up" ? "upvotes" : "downvotes";
  db.prepare(`UPDATE suggestions SET ${column} = ${column} + 1 WHERE id = ?`).run(suggestionId);
  const suggestion = db.prepare("SELECT * FROM suggestions WHERE id = ?").get(suggestionId);

  const embed = EmbedBuilder.from(interaction.message.embeds[0]).setFields(
    { name: "👍 Dafür", value: `${suggestion.upvotes}`, inline: true },
    { name: "👎 Dagegen", value: `${suggestion.downvotes}`, inline: true }
  );

  await interaction.update({ embeds: [embed] });
}

async function handleDecision(interaction, decision, suggestionId) {
  if (!hasAnyRole(interaction.member, config.vorschlagReviewRoleId)) {
    return interaction.reply({ content: "❌ Du hast keine Berechtigung dafür.", ephemeral: true });
  }

  const status = decision === "accept" ? "accepted" : "rejected";
  db.prepare("UPDATE suggestions SET status = ? WHERE id = ?").run(status, suggestionId);

  const embed = EmbedBuilder.from(interaction.message.embeds[0])
    .setColor(decision === "accept" ? FARBEN.erfolg : FARBEN.fehler)
    .setFooter({ text: `Vorschlag #${suggestionId} — Status: ${decision === "accept" ? "Angenommen ✅" : "Abgelehnt ❌"}` });

  const row = ActionRowBuilder.from(interaction.message.components[0]);
  row.components.forEach((c) => c.setDisabled(true));

  await interaction.update({ embeds: [embed], components: [row] });
}

module.exports = { handleSubmit, handleVote, handleDecision };
