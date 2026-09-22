const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder().setName("vorschlag").setDescription("Reiche einen Vorschlag für den Server ein."),

  async execute(interaction) {
    const modal = new ModalBuilder().setCustomId("vorschlag_modal").setTitle("Neuer Vorschlag");

    const input = new TextInputBuilder()
      .setCustomId("vorschlag_text")
      .setLabel("Was möchtest du vorschlagen?")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("z.B. Macht das und das auf eurem Server...")
      .setMaxLength(1000)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
  },
};
