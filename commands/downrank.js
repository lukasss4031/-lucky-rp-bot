const { SlashCommandBuilder } = require("discord.js");
const { hasAnyRole } = require("../utils/hasRole");
const { baseEmbed, FARBEN } = require("../utils/embeds");
const config = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("downrank")
    .setDescription("Setzt einen Nutzer auf die nächstniedrigere Rang-Rolle.")
    .addUserOption((o) => o.setName("user").setDescription("Wer wird runtergestuft?").setRequired(true)),

  async execute(interaction) {
    if (!hasAnyRole(interaction.member, config.moderationRoleId)) {
      return interaction.reply({ content: "❌ Du hast keine Berechtigung für diesen Befehl.", ephemeral: true });
    }

    const target = await interaction.guild.members.fetch(interaction.options.getUser("user").id);
    const ladder = config.rankLadder;

    const currentIndex = ladder.findIndex((roleId) => target.roles.cache.has(roleId));

    if (currentIndex <= 0) {
      return interaction.reply({
        content: `${target} hat keinen Rang, der noch tiefer gestuft werden kann.`,
        ephemeral: true,
      });
    }

    const oldRoleId = ladder[currentIndex];
    const newRoleId = ladder[currentIndex - 1];

    await target.roles.remove(oldRoleId).catch(() => null);
    await target.roles.add(newRoleId).catch(() => null);

    const embed = baseEmbed(interaction.guild, {
      title: "⬇️ Downrank",
      color: FARBEN.fehler,
      thumbnail: target.displayAvatarURL(),
      description: `${target} wurde runtergestuft.`,
      fields: [
        { name: "Von", value: interaction.guild.roles.cache.get(oldRoleId)?.name ?? oldRoleId, inline: true },
        { name: "Zu", value: interaction.guild.roles.cache.get(newRoleId)?.name ?? newRoleId, inline: true },
        { name: "Durchgeführt von", value: `<@${interaction.user.id}>` },
      ],
    });

    await interaction.reply({ embeds: [embed] });
    const logChannel = interaction.guild.channels.cache.get(config.teamLogChannelId);
    if (logChannel) logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};
