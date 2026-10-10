const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  NoSubscriberBehavior,
  getVoiceConnection,
  VoiceConnectionStatus,
  entersState,
} = require("@discordjs/voice");
const fs = require("fs");
const path = require("path");
const config = require("../config");
 
// ffmpeg-static liefert nur den Pfad zur Programmdatei - @discordjs/voice muss
// diesen Pfad kennen, um MP3s zu Opus zu transkodieren.
process.env.FFMPEG_PATH = require("ffmpeg-static");
 
// Zerstört eine Verbindung sicher - verhindert den Absturz "already been destroyed".
function sicherZerstoeren(connection) {
  if (!connection) return;
  if (connection.state.status === VoiceConnectionStatus.Destroyed) return;
  try {
    connection.destroy();
  } catch (err) {
    console.error("Konnte Voice-Verbindung nicht sauber schließen:", err.message);
  }
}
 
module.exports = {
  name: "voiceStateUpdate",
  async execute(oldState, newState) {
    // Nutzer betritt den Support-Warteraum
    if (newState.channelId === config.supportWarteraumChannelId && oldState.channelId !== config.supportWarteraumChannelId) {
      const pingChannel = newState.guild.channels.cache.get(config.supportPingChannelId);
      if (pingChannel) {
        const pingRollen = [].concat(config.supportPingRoleId).map((id) => `<@&${id}>`).join(" ");
        pingChannel
          .send(`${pingRollen} im Support-Warteraum wartet ${newState.member}! 🆘`)
          .catch(() => {});
      }
 
      const mp3Pfad = path.join(__dirname, "..", "assets", "warteraum-musik.mp3");
      console.log(`[Warteraum] Prüfe Musikdatei unter: ${mp3Pfad}`);
      console.log(`[Warteraum] Datei existiert: ${fs.existsSync(mp3Pfad)}`);
      console.log(`[Warteraum] FFMPEG_PATH: ${process.env.FFMPEG_PATH}`);
 
      try {
        const connection = joinVoiceChannel({
          channelId: config.supportWarteraumChannelId,
          guildId: newState.guild.id,
          adapterCreator: newState.guild.voiceAdapterCreator,
        });
 
        connection.on("stateChange", (oldS, newS) => {
          console.log(`[Warteraum] Verbindung: ${oldS.status} -> ${newS.status}`);
        });
        connection.on("error", (err) => {
          console.error("[Warteraum] Verbindungsfehler:", err.message);
        });
 
        await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
        console.log("[Warteraum] Verbindung bereit, starte Wiedergabe.");
 
        const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
        const resource = createAudioResource(mp3Pfad, { inlineVolume: true });
        player.play(resource);
        connection.subscribe(player);
 
        player.on("stateChange", (oldS, newS) => {
          console.log(`[Warteraum] Player: ${oldS.status} -> ${newS.status}`);
        });
        player.on("error", (err) => {
          console.error("[Warteraum] Fehler beim Abspielen der Wartemusik:", err.message, err.stack);
        });
 
        player.on(AudioPlayerStatus.Idle, () => sicherZerstoeren(connection));
      } catch (err) {
        console.error("[Warteraum] Konnte Wartemusik nicht abspielen:", err.message, err.stack);
      }
    }
 
    // Warteraum verlassen -> falls niemand mehr drin ist, Musik/Verbindung stoppen
    if (oldState.channelId === config.supportWarteraumChannelId) {
      const channel = oldState.guild.channels.cache.get(config.supportWarteraumChannelId);
      if (channel && channel.members.size === 0) {
        sicherZerstoeren(getVoiceConnection(oldState.guild.id));
      }
    }
  },
};
 
