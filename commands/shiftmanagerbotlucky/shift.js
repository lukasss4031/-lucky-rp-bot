const { SlashCommandBuilder } = require("discord.js");
const { baustatusNachricht } = require("../modules/shiftHandler");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shift")
    .setDescription("Öffnet dein Shift-Kontrollfeld (Start/Pause/Ende)."),

  async execute(interaction) {
    const nachricht = baustatusNachricht(interaction.user.id);
    await interaction.reply({ ...nachricht, ephemeral: true });
  },
};
