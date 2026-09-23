const { EmbedBuilder } = require("discord.js");

const FARBEN = {
  erfolg: 0x2ecc71,
  warnung: 0xe67e22,
  fehler: 0xe74c3c,
  info: 0x3498db,
  gold: 0xf1c40f,
  lila: 0x9b59b6,
};

// Baut ein Embed mit einheitlichem Look: Farbe, Zeitstempel und Footer mit Server-Icon.
function baseEmbed(guild, { title, description, color = FARBEN.info, fields, thumbnail } = {}) {
  const embed = new EmbedBuilder().setColor(color).setTimestamp();
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (fields) embed.addFields(fields);
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (guild) embed.setFooter({ text: guild.name, iconURL: guild.iconURL() ?? undefined });
  return embed;
}

module.exports = { baseEmbed, FARBEN };
