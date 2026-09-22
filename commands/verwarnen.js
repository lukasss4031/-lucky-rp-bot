const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const db = require("../db/database");
const { hasAnyRole } = require("../utils/hasRole");
const config = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("verwarnen")
    .setDescription("Trägt eine Discord-Verwarnung für einen Nutzer ein.")
    .addUserOption((o) => o.setName("user").setDescription("Wer wird verwarnt?").setRequired(true))
    .addStringOption((o) => o.setName("grund").setDescription("Grund der Verwarnung").setRequired(true)),

  async execute(interaction) {
    if (!hasAnyRole(interaction.member, config.moderationRoleId)) {
      return interaction.reply({ content: "Du hast keine Berechtigung für diesen Befehl.", ephemeral: true });
    }

    const target = interaction.options.getUser("user");
    const grund = interaction.options.getString("grund");

    db.prepare(
      "INSERT INTO warns (userId, moderatorId, reason, type, createdAt) VALUES (?, ?, ?, 'discord', ?)"
    ).run(target.id, interaction.user.id, grund, Date.now());

    const count = db.prepare("SELECT COUNT(*) AS c FROM warns WHERE userId = ? AND type = 'discord'").get(target.id).c;

    const embed = new EmbedBuilder()
      .setTitle("⚠️ Verwarnung eingetragen")
      .setColor(0xe67e22)
      .addFields(
        { name: "Nutzer", value: `<@${target.id}>`, inline: true },
        { name: "Moderator", value: `<@${interaction.user.id}>`, inline: true },
        { name: "Grund", value: grund },
        { name: "Verwarnungen gesamt", value: `${count}`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const logChannel = interaction.guild.channels.cache.get(config.teamLogChannelId);
    if (logChannel) logChannel.send({ embeds: [embed] }).catch(() => {});

    target.send({ content: `Du wurdest auf **${interaction.guild.name}** verwarnt.\nGrund: ${grund}` }).catch(() => {});
  },
};
