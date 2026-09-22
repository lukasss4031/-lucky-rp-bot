const { AuditLogEvent } = require("discord.js");
const config = require("../config");

// Wie viele verdächtige Aktionen innerhalb welcher Zeit als "Nuke-Versuch" gelten.
const LIMIT = 5;
const ZEITFENSTER_MS = 10000;

// Merkt sich pro Nutzer, wie oft er zuletzt Kanäle/Rollen gelöscht oder Leute gebannt hat.
const aktionsZaehler = new Map();

function pruefeUndBestrafe(guild, executorId, aktion) {
  const key = executorId;
  const jetzt = Date.now();
  const eintrag = aktionsZaehler.get(key) ?? [];
  const gefiltert = eintrag.filter((t) => jetzt - t < ZEITFENSTER_MS);
  gefiltert.push(jetzt);
  aktionsZaehler.set(key, gefiltert);

  if (gefiltert.length >= LIMIT) {
    aktionsZaehler.delete(key);
    guild.members
      .fetch(executorId)
      .then((member) => {
        // Alle Rollen entziehen und rauswerfen, um weiteren Schaden zu verhindern.
        member.roles.set([]).catch(() => {});
        member.kick(`Anti-Nuke: Zu viele verdächtige Aktionen (${aktion})`).catch(() => {});

        const log = guild.channels.cache.get(config.teamLogChannelId);
        if (log) {
          log.send(
            `🚨 **Anti-Nuke ausgelöst!** <@${executorId}> hat ${gefiltert.length}x "${aktion}" innerhalb von ${ZEITFENSTER_MS / 1000}s ausgeführt und wurde automatisch entfernt. Bitte manuell prüfen!`
          );
        }
      })
      .catch(() => {});
  }
}

function setup(client) {
  client.on("channelDelete", async (channel) => {
    const logs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 1 }).catch(() => null);
    const entry = logs?.entries.first();
    if (entry && Date.now() - entry.createdTimestamp < 5000) {
      pruefeUndBestrafe(channel.guild, entry.executor.id, "Kanal gelöscht");
    }
  });

  client.on("roleDelete", async (role) => {
    const logs = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 1 }).catch(() => null);
    const entry = logs?.entries.first();
    if (entry && Date.now() - entry.createdTimestamp < 5000) {
      pruefeUndBestrafe(role.guild, entry.executor.id, "Rolle gelöscht");
    }
  });

  client.on("guildBanAdd", async (ban) => {
    const logs = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 }).catch(() => null);
    const entry = logs?.entries.first();
    if (entry && Date.now() - entry.createdTimestamp < 5000) {
      pruefeUndBestrafe(ban.guild, entry.executor.id, "Mitglied gebannt");
    }
  });

  // Einfacher Anti-Raid-Schutz: viele neue Joins in kurzer Zeit -> Warnung im Log
  let joinsLetzten30s = [];
  client.on("guildMemberAdd", (member) => {
    const jetzt = Date.now();
    joinsLetzten30s = joinsLetzten30s.filter((t) => jetzt - t < 30000);
    joinsLetzten30s.push(jetzt);

    if (joinsLetzten30s.length >= 10) {
      const log = member.guild.channels.cache.get(config.teamLogChannelId);
      if (log) {
        log.send(
          `🚨 **Möglicher Raid erkannt!** ${joinsLetzten30s.length} neue Mitglieder sind in den letzten 30 Sekunden beigetreten. Bitte prüfen und ggf. Server-Sicherheit (Verifizierungsstufe) manuell erhöhen.`
        );
      }
    }
  });
}

module.exports = { setup };
