const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const db = require("../db/database");
const { baseEmbed, FARBEN } = require("../utils/embeds");

const SHIFT_ROLLE_ID = "1557746462765350962";

function formatDauer(ms) {
  const min = Math.floor(ms / 60000);
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

function laufendeShift(userId) {
  return db
    .prepare("SELECT * FROM shifts WHERE userId = ? AND endedAt IS NULL ORDER BY startedAt DESC")
    .get(userId);
}

// Baut die Status-Nachricht (Embed + Buttons) passend zum aktuellen Zustand der Shift.
function baustatusNachricht(userId) {
  const shift = laufendeShift(userId);

  if (!shift) {
    const embed = baseEmbed(null, {
      title: "🕒 Shift-Kontrollfeld",
      color: FARBEN.info,
      description: "Du hast aktuell keine laufende Shift.",
    });
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("shift_start").setLabel("▶️ Start").setStyle(ButtonStyle.Success)
    );
    return { embeds: [embed], components: [row] };
  }

  const pausiert = !!shift.pausedAt;
  const aktiveDauer = (pausiert ? shift.pausedAt : Date.now()) - shift.startedAt - shift.totalPausedMs;

  const embed = baseEmbed(null, {
    title: "🕒 Shift-Kontrollfeld",
    color: pausiert ? FARBEN.warnung : FARBEN.erfolg,
    description: pausiert ? "⏸️ Deine Shift ist aktuell pausiert." : "🟢 Deine Shift läuft.",
    fields: [{ name: "⏱️ Aktive Dauer bisher", value: formatDauer(aktiveDauer) }],
  });

  const row = new ActionRowBuilder().addComponents(
    pausiert
      ? new ButtonBuilder().setCustomId("shift_fortsetzen").setLabel("▶️ Fortsetzen").setStyle(ButtonStyle.Success)
      : new ButtonBuilder().setCustomId("shift_pause").setLabel("⏸️ Pause").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("shift_ende").setLabel("⏹️ Ende").setStyle(ButtonStyle.Danger)
  );

  return { embeds: [embed], components: [row] };
}

async function handleStart(interaction) {
  const userId = interaction.user.id;

  if (laufendeShift(userId)) {
    return interaction.update(baustatusNachricht(userId));
  }

  db.prepare("INSERT INTO shifts (userId, startedAt, totalPausedMs) VALUES (?, ?, 0)").run(userId, Date.now());

  await interaction.member.roles.add(SHIFT_ROLLE_ID).catch((err) => {
    console.error("Konnte Shift-Rolle nicht vergeben:", err.message);
  });

  await interaction.update(baustatusNachricht(userId));
}

async function handlePause(interaction) {
  const userId = interaction.user.id;
  const shift = laufendeShift(userId);
  if (!shift || shift.pausedAt) return interaction.update(baustatusNachricht(userId));

  db.prepare("UPDATE shifts SET pausedAt = ? WHERE id = ?").run(Date.now(), shift.id);
  await interaction.update(baustatusNachricht(userId));
}

async function handleFortsetzen(interaction) {
  const userId = interaction.user.id;
  const shift = laufendeShift(userId);
  if (!shift || !shift.pausedAt) return interaction.update(baustatusNachricht(userId));

  const pausenDauer = Date.now() - shift.pausedAt;
  db.prepare("UPDATE shifts SET pausedAt = NULL, totalPausedMs = totalPausedMs + ? WHERE id = ?").run(
    pausenDauer,
    shift.id
  );
  await interaction.update(baustatusNachricht(userId));
}

async function handleEnde(interaction) {
  const userId = interaction.user.id;
  const shift = laufendeShift(userId);
  if (!shift) return interaction.update(baustatusNachricht(userId));

  const endedAt = Date.now();
  // Falls gerade pausiert: letzte Pause noch mit einrechnen.
  const totalPausedMs = shift.pausedAt ? shift.totalPausedMs + (endedAt - shift.pausedAt) : shift.totalPausedMs;

  db.prepare("UPDATE shifts SET endedAt = ?, pausedAt = NULL, totalPausedMs = ? WHERE id = ?").run(
    endedAt,
    totalPausedMs,
    shift.id
  );

  await interaction.member.roles.remove(SHIFT_ROLLE_ID).catch((err) => {
    console.error("Konnte Shift-Rolle nicht entfernen:", err.message);
  });

  const aktiveDauer = endedAt - shift.startedAt - totalPausedMs;
  const embed = baseEmbed(null, {
    title: "🔴 Shift beendet",
    color: FARBEN.fehler,
    thumbnail: interaction.user.displayAvatarURL(),
    description: `<@${userId}> hat seine Shift beendet.`,
    fields: [{ name: "⏱️ Aktive Dauer", value: formatDauer(aktiveDauer) }],
  });

  await interaction.update({ embeds: [embed], components: [] });
}

module.exports = { baustatusNachricht, handleStart, handlePause, handleFortsetzen, handleEnde };
