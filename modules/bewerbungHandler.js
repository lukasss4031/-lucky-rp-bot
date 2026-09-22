const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const db = require("../db/database");
const { hasAnyRole } = require("../utils/hasRole");
const config = require("../config");

function buildModal() {
  const modal = new ModalBuilder().setCustomId("bewerbung_modal").setTitle("Team-Bewerbung");

  const alter = new TextInputBuilder()
    .setCustomId("bewerbung_alter")
    .setLabel("Wie alt bist du?")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const erfahrung = new TextInputBuilder()
    .setCustomId("bewerbung_erfahrung")
    .setLabel("Hast du bereits Team-Erfahrung?")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  const motivation = new TextInputBuilder()
    .setCustomId("bewerbung_motivation")
    .setLabel("Warum möchtest du ins Team?")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(alter),
    new ActionRowBuilder().addComponents(erfahrung),
    new ActionRowBuilder().addComponents(motivation)
  );
  return modal;
}

async function handleSubmit(interaction) {
  const alter = interaction.fields.getTextInputValue("bewerbung_alter");
  const erfahrung = interaction.fields.getTextInputValue("bewerbung_erfahrung");
  const motivation = interaction.fields.getTextInputValue("bewerbung_motivation");
  const answers = JSON.stringify({ alter, erfahrung, motivation });

  const result = db
    .prepare("INSERT INTO applications (userId, answers, createdAt) VALUES (?, ?, ?)")
    .run(interaction.user.id, answers, Date.now());

  const embed = new EmbedBuilder()
    .setTitle("📝 Neue Bewerbung (Pending)")
    .setColor(0xf1c40f)
    .addFields(
      { name: "Bewerber", value: `<@${interaction.user.id}>` },
      { name: "Alter", value: alter },
      { name: "Team-Erfahrung", value: erfahrung },
      { name: "Motivation", value: motivation }
    )
    .setFooter({ text: `Bewerbung #${result.lastInsertRowid}` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`bewerbung_accept_${result.lastInsertRowid}`).setLabel("Annehmen").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`bewerbung_reject_${result.lastInsertRowid}`).setLabel("Ablehnen").setStyle(ButtonStyle.Danger)
  );

  const reviewChannel = interaction.guild.channels.cache.get(config.bewerbungReviewChannelId);
  if (reviewChannel) await reviewChannel.send({ embeds: [embed], components: [row] });

  await interaction.reply({ content: "Deine Bewerbung wurde eingereicht und wird geprüft. Status: **Pending**.", ephemeral: true });
}

async function handleDecision(interaction, decision, applicationId) {
  if (!hasAnyRole(interaction.member, config.moderationRoleId)) {
    return interaction.reply({ content: "Du hast keine Berechtigung dafür.", ephemeral: true });
  }

  const application = db.prepare("SELECT * FROM applications WHERE id = ?").get(applicationId);
  if (!application) return interaction.reply({ content: "Bewerbung nicht gefunden.", ephemeral: true });

  const status = decision === "accept" ? "accepted" : "rejected";
  db.prepare("UPDATE applications SET status = ? WHERE id = ?").run(status, applicationId);

  const targetChannelId = decision === "accept" ? config.bewerbungAkzeptiertChannelId : config.bewerbungAbgelehntChannelId;
  const targetChannel = interaction.guild.channels.cache.get(targetChannelId);

  const embed = EmbedBuilder.from(interaction.message.embeds[0])
    .setTitle(decision === "accept" ? "✅ Bewerbung angenommen" : "❌ Bewerbung abgelehnt")
    .setColor(decision === "accept" ? 0x2ecc71 : 0xe74c3c);

  if (targetChannel) await targetChannel.send({ embeds: [embed] });

  await interaction.update({ embeds: [embed], components: [] });

  const applicant = await interaction.guild.members.fetch(application.userId).catch(() => null);
  if (applicant) {
    applicant
      .send(
        decision === "accept"
          ? `🎉 Deine Bewerbung auf **${interaction.guild.name}** wurde angenommen!`
          : `Deine Bewerbung auf **${interaction.guild.name}** wurde leider abgelehnt.`
      )
      .catch(() => {});
  }
}

module.exports = { buildModal, handleSubmit, handleDecision };
