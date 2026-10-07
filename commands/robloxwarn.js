const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const db = require("../db/database");
const { hasAnyRole } = require("../utils/hasRole");
const { baseEmbed, FARBEN } = require("../utils/embeds");
const config = require("../config");

// Löschen/Bearbeiten dürfen nur Administratoren ODER der Moderator, der den Warn selbst eingetragen hat.
function darfBearbeiten(interaction, warn) {
  if (interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  return warn.moderatorId === interaction.user.id;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("robloxwarn")
    .setDescription("Verwaltet Roblox-Verwarnungen (z.B. Fail-RP).")
    .addSubcommand((sub) =>
      sub
        .setName("eintragen")
        .setDescription("Trägt eine neue Roblox-Verwarnung ein.")
        .addStringOption((o) =>
          o.setName("roblox_username").setDescription("Roblox-Nutzername des Spielers").setRequired(true).setAutocomplete(true)
        )
        .addStringOption((o) => o.setName("grund").setDescription("Grund, z.B. Fail-RP").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("anzeigen")
        .setDescription("Zeigt alle Roblox-Verwarnungen eines Spielers inkl. ID an.")
        .addStringOption((o) =>
          o.setName("roblox_username").setDescription("Roblox-Nutzername des Spielers").setRequired(true).setAutocomplete(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("bearbeiten")
        .setDescription("Ändert den Grund einer Roblox-Verwarnung.")
        .addIntegerOption((o) => o.setName("warn_id").setDescription("ID der Verwarnung (siehe /robloxwarn anzeigen)").setRequired(true))
        .addStringOption((o) => o.setName("neuer_grund").setDescription("Neuer Grund").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("loeschen")
        .setDescription("Löscht eine Roblox-Verwarnung.")
        .addIntegerOption((o) => o.setName("warn_id").setDescription("ID der Verwarnung (siehe /robloxwarn anzeigen)").setRequired(true))
    ),

  // Wird aufgerufen, während der Moderator im roblox_username-Feld tippt.
  // Fragt die offizielle, kostenlose Roblox-Such-API ab (kein API-Key nötig).
  async autocomplete(interaction) {
    const eingabe = interaction.options.getFocused();

    if (!eingabe || eingabe.length < 3) {
      return interaction.respond([]);
    }

    try {
      const res = await fetch(
        `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(eingabe)}&limit=10`
      );
      if (!res.ok) return interaction.respond([]);

      const data = await res.json();
      const vorschlaege = (data.data || [])
        .slice(0, 25)
        .map((u) => ({ name: u.name, value: u.name }));

      await interaction.respond(vorschlaege);
    } catch (err) {
      console.error("Roblox-Autocomplete fehlgeschlagen:", err.message);
      await interaction.respond([]).catch(() => {});
    }
  },

  async execute(interaction) {
    if (!hasAnyRole(interaction.member, config.moderationRoleId)) {
      return interaction.reply({ content: "❌ Du hast keine Berechtigung für diesen Befehl.", ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === "eintragen") {
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

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === "anzeigen") {
      const robloxUsername = interaction.options.getString("roblox_username");
      const warns = db
        .prepare("SELECT * FROM warns WHERE userId = ? AND type = 'roblox' ORDER BY createdAt DESC")
        .all(robloxUsername);

      if (warns.length === 0) {
        return interaction.reply({ content: "Keine Roblox-Verwarnungen gefunden.", ephemeral: true });
      }

      const zeilen = warns
        .map(
          (w) =>
            `**ID ${w.id}**\n> Grund: ${w.reason}\n> Moderator: <@${w.moderatorId}>\n> Datum: <t:${Math.floor(w.createdAt / 1000)}:d>`
        )
        .join("\n\n");

      const embed = baseEmbed(interaction.guild, {
        title: `📋 Roblox-Verwarnungen — ${robloxUsername}`,
        color: FARBEN.warnung,
        description: zeilen.slice(0, 4000),
      });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === "bearbeiten" || sub === "loeschen") {
      const warnId = interaction.options.getInteger("warn_id");
      const warn = db.prepare("SELECT * FROM warns WHERE id = ? AND type = 'roblox'").get(warnId);

      if (!warn) {
        return interaction.reply({ content: `❌ Keine Roblox-Verwarnung mit der ID \`${warnId}\` gefunden.`, ephemeral: true });
      }

      if (!darfBearbeiten(interaction, warn)) {
        return interaction.reply({
          content: "❌ Nur Administratoren oder der Moderator, der diese Verwarnung eingetragen hat, dürfen sie bearbeiten oder löschen.",
          ephemeral: true,
        });
      }

      if (sub === "loeschen") {
        db.prepare("DELETE FROM warns WHERE id = ?").run(warnId);

        const embed = baseEmbed(interaction.guild, {
          title: "🗑️ Roblox-Verwarnung gelöscht",
          color: FARBEN.erfolg,
          fields: [
            { name: "ID", value: `${warnId}`, inline: true },
            { name: "Roblox-Nutzer", value: warn.userId, inline: true },
            { name: "War Grund", value: warn.reason },
          ],
        });

        return interaction.reply({ embeds: [embed] });
      }

      const neuerGrund = interaction.options.getString("neuer_grund");
      db.prepare("UPDATE warns SET reason = ? WHERE id = ?").run(neuerGrund, warnId);

      const embed = baseEmbed(interaction.guild, {
        title: "✏️ Roblox-Verwarnung bearbeitet",
        color: FARBEN.info,
        fields: [
          { name: "ID", value: `${warnId}`, inline: true },
          { name: "Roblox-Nutzer", value: warn.userId, inline: true },
          { name: "Alter Grund", value: warn.reason },
          { name: "Neuer Grund", value: neuerGrund },
        ],
      });

      return interaction.reply({ embeds: [embed] });
    }
  },
};
