const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../db/database");
const config = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("teamliste")
    .setDescription("Zeigt alle aktuellen Teammitglieder an."),

  async execute(interaction) {
    await interaction.deferReply();

    // Teamliste wird live aus den Servern-Mitgliedern gebildet:
    // Alle, die mindestens die unterste Rang-Rolle aus der rankLadder haben.
    await interaction.guild.members.fetch();
    const rankRoles = config.rankLadder.filter((id) => id && !id.startsWith("DEIN") && !id.startsWith("PROBEZEIT_"));

    const teamMembers = interaction.guild.members.cache.filter((m) =>
      config.rankLadder.some((roleId) => m.roles.cache.has(roleId))
    );

    if (teamMembers.size === 0) {
      return interaction.editReply(
        "Aktuell ist niemand im Team gelistet (oder die Rollen-IDs in config.js sind noch nicht eingetragen)."
      );
    }

    // Höchster Rang zuerst
    const sorted = [...teamMembers.values()].sort((a, b) => {
      const rankA = config.rankLadder.findIndex((id) => a.roles.cache.has(id));
      const rankB = config.rankLadder.findIndex((id) => b.roles.cache.has(id));
      return rankB - rankA;
    });

    const lines = sorted.map((m) => {
      const rankIndex = config.rankLadder.findIndex((id) => m.roles.cache.has(id));
      const rolle = rankIndex >= 0 ? m.guild.roles.cache.get(config.rankLadder[rankIndex]) : null;
      return `**${m.user.username}** — ${rolle ? rolle.name : "Team"}`;
    });

    const embed = new EmbedBuilder()
      .setTitle("📋 Teamliste — Lucky RP")
      .setDescription(lines.join("\n"))
      .setColor(0x3498db)
      .setFooter({ text: `${sorted.length} Teammitglieder` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
