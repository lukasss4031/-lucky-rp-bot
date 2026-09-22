const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../config");

// Ordnet der Rollenfarbe einen passenden Farb-Punkt-Emoji zu, für eine schönere Optik.
function farbPunkt(hexColor) {
  if (!hexColor || hexColor === "#000000") return "⚪";
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  if (r > 200 && g < 100 && b < 100) return "🔴";
  if (r > 200 && g > 100 && g < 200 && b < 100) return "🟠";
  if (r > 200 && g > 200 && b < 100) return "🟡";
  if (g > 150 && r < 150 && b < 150) return "🟢";
  if (b > 150 && r < 150 && g < 150) return "🔵";
  if (r > 100 && b > 150 && g < 100) return "🟣";
  return "⚪";
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("teamliste")
    .setDescription("Zeigt alle Rangstufen des Teams an, inklusive unbesetzter Ränge."),

  async execute(interaction) {
    await interaction.deferReply();
    await interaction.guild.members.fetch();

    // Höchster Rang zuerst
    const ladderHoechsteZuerst = [...config.rankLadder].reverse();

    const zeilen = ladderHoechsteZuerst
      .map((roleId) => {
        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) return null;

        const mitglieder = interaction.guild.members.cache.filter((m) => {
          const hoechsterIndex = config.rankLadder.findIndex((id) => m.roles.cache.has(id));
          return hoechsterIndex !== -1 && config.rankLadder[hoechsterIndex] === roleId;
        });

        const punkt = farbPunkt(role.hexColor);
        const namen =
          mitglieder.size > 0
            ? [...mitglieder.values()].map((m) => `> <@${m.id}>`).join("\n")
            : "> *Niemand*";

        return `${punkt} **${role.name}**\n${namen}`;
      })
      .filter(Boolean);

    if (zeilen.length === 0) {
      return interaction.editReply(
        "Keine Ränge gefunden — bitte prüfe, ob die Rollen-IDs in `rankLadder` in `config.js` korrekt sind."
      );
    }

    const embed = new EmbedBuilder()
      .setTitle(`📋 Teamliste — ${interaction.guild.name}`)
      .setDescription(zeilen.join("\n\n"))
      .setColor(0x3498db)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
