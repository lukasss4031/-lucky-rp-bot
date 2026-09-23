const { SlashCommandBuilder } = require("discord.js");
const { hasAnyRole } = require("../utils/hasRole");
const { baseEmbed, FARBEN } = require("../utils/embeds");
const config = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("uprank")
    .setDescription("Setzt einen Nutzer auf die nächsthöhere Rang-Rolle.")
    .addUserOption((o) => o.setName("user").setDescription("Wer wird hochgestuft?").setRequired(true)),

  async execute(interaction) {
    if (!hasAnyRole(interaction.member, config.moderationRoleId)) {
      return interaction.reply({ content: "❌ Du hast keine Berechtigung für diesen Befehl.", ephemeral: true });
    }

    const target = await interaction.guild.members.fetch(interaction.options.getUser("user").id);
    const ladder = config.rankLadder;

    const currentIndex = ladder.findIndex((roleId) => target.roles.cache.has(roleId));

    if (currentIndex === -1) {
      await target.roles.add(ladder[0]).catch(() => null);
      return interaction.reply(`${target} wurde in den Rang **${interaction.guild.roles.cache.get(ladder[0])?.name ?? ladder[0]}** eingestuft.`);
    }

    if (currentIndex === ladder.length - 1) {
      return interaction.reply({ content: `${target} hat bereits den höchsten Rang erreicht.`, ephemeral: true });
    }

    const oldRoleId = ladder[currentIndex];
    const newRoleId = ladder[currentIndex + 1];

    await target.roles.remove(oldRoleId).catch(() => null);
    await target.roles.add(newRoleId).catch(() => null);

    const embed = baseEmbed(interaction.guild, {
      title: "⬆️ Uprank",
      color: FARBEN.erfolg,
      thumbnail: target.displayAvatarURL(),
      description: `${target} wurde hochgestuft.`,
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
