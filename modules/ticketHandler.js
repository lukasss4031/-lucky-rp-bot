const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require("discord.js");
const db = require("../db/database");
const { baseEmbed, FARBEN } = require("../utils/embeds");
const config = require("../config");

const kategorieNamen = {
  allgemein: "Allgemein",
  bewerbung: "Bewerbung",
  beschwerde: "Beschwerde",
  sonstiges: "Sonstiges",
};

async function createTicket(interaction, category) {
  const guild = interaction.guild;
  const existing = db
    .prepare("SELECT * FROM tickets WHERE userId = ? AND category = ? AND status = 'open'")
    .get(interaction.user.id, category);

  if (existing) {
    return interaction.reply({
      content: `⚠️ Du hast bereits ein offenes Ticket dieser Kategorie: <#${existing.channelId}>`,
      ephemeral: true,
    });
  }

  const modRoleIds = Array.isArray(config.moderationRoleId) ? config.moderationRoleId : [config.moderationRoleId];

  const channel = await guild.channels.create({
    name: `ticket-${category}-${interaction.user.username}`.toLowerCase().slice(0, 90),
    type: ChannelType.GuildText,
    parent: config.ticketCategoryId,
    permissionOverwrites: [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      ...modRoleIds.map((id) => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] })),
    ],
  });

  db.prepare("INSERT INTO tickets (channelId, userId, category, createdAt) VALUES (?, ?, ?, ?)").run(
    channel.id,
    interaction.user.id,
    category,
    Date.now()
  );

  const closeButton = new ButtonBuilder().setCustomId("ticket_close").setLabel("Ticket schließen").setStyle(ButtonStyle.Danger).setEmoji("🔒");
  const embed = baseEmbed(guild, {
    title: `🎫 Ticket — ${kategorieNamen[category] ?? category}`,
    color: FARBEN.info,
    thumbnail: interaction.user.displayAvatarURL(),
    description: `Hallo <@${interaction.user.id}>, das Team kümmert sich in Kürze um dein Anliegen.\nSchreib hier einfach, worum es geht.`,
  });

  await channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(closeButton)] });
  await interaction.reply({ content: `✅ Dein Ticket wurde erstellt: ${channel}`, ephemeral: true });
}

async function closeTicket(interaction) {
  const ticket = db.prepare("SELECT * FROM tickets WHERE channelId = ? AND status = 'open'").get(interaction.channel.id);
  if (!ticket) {
    return interaction.reply({ content: "⚠️ Dies ist kein offenes Ticket.", ephemeral: true });
  }

  db.prepare("UPDATE tickets SET status = 'closed' WHERE id = ?").run(ticket.id);
  await interaction.reply("🔒 Dieses Ticket wird in 5 Sekunden geschlossen...");
  setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
}

module.exports = { createTicket, closeTicket };
