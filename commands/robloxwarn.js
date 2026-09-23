const { SlashCommandBuilder } = require("discord.js");
const db = require("../db/database");
const { hasAnyRole } = require("../utils/hasRole");
const { baseEmbed, FARBEN } = require("../utils/embeds");
const config = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("robloxwarn")
    .setDescription("Trägt eine Roblox-Verwarnung ein (z.B. Fail-RP).")
    .addStringOption((o) =>
      o.setName("roblox_username").setDescription("Roblox-Nutzername des Spielers").setRequired(true)
    )
    .addStringOption((o) => o.setName("grund").setDescription("Grund, z.B. Fail-RP").setRequired(true)),

  async execute(interaction) {
    if (!hasAnyRole(interaction.member, config.moderationRoleId)) {
      return interaction.reply({ content: "❌ Du hast keine Berechtigung für diesen Befehl.", ephemeral: true });
    }

    const robloxUsername = interaction.options.getString("roblox_username");
    const grund = interaction.options.getString("grund");

    db.prepare(
      "INSERT INTO warns (userId, moderatorId, reason, type, createdAt) VALUES (?, ?, ?, 'roblox', ?)"
    ).run(robloxUsername, interaction.user.id, grund, Date.now());

    const count = db
      .prepare("SELECT COUNT(*) AS c FROM warns WHERE userId = ? AND type = 'roblox'")
      .get(robloxUsername).c;

    const embed = baseEmbed(interaction.guild, {
      title: "🟥 Roblox-Verwarnung eingetragen",
      color: FARBEN.fehler,
      fields: [
        { name: "🎮 Roblox-Nutzer", value: robloxUsername, inline: true },
        { name: "🛡️ Moderator", value: `<@${interaction.user.id}>`, inline: true },
        { name: "🔢 Verwarnungen gesamt", value: `${count}`, inline: true },
        { name: "📝 Grund", value: grund },
      ],
    });

    await interaction.reply({ embeds: [embed] });
  },
};
