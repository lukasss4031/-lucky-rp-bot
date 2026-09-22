const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } = require("@discordjs/voice");
const path = require("path");
const config = require("../config");

module.exports = {
  name: "voiceStateUpdate",
  async execute(oldState, newState) {
    // Nutzer betritt den Support-Warteraum
    if (newState.channelId === config.supportWarteraumChannelId && oldState.channelId !== config.supportWarteraumChannelId) {
      const pingChannel = newState.guild.channels.cache.get(config.supportPingChannelId);
      if (pingChannel) {
        pingChannel
          .send(`🔔 ${[].concat(config.supportPingRoleId).map((id) => `<@&${id}>`).join(" ")} — **${newState.member.user.username}** wartet im Support-Warteraum!`)
          .catch(() => {});
      }

      try {
        const connection = joinVoiceChannel({
          channelId: config.supportWarteraumChannelId,
          guildId: newState.guild.id,
          adapterCreator: newState.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
        // Lege eine eigene Wartemusik-Datei unter assets/warteraum-musik.mp3 ab (siehe README).
        const resource = createAudioResource(path.join(__dirname, "..", "assets", "warteraum-musik.mp3"), {
          inlineVolume: true,
        });
        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => connection.destroy());
      } catch (err) {
        console.error("Konnte Wartemusik nicht abspielen (fehlt assets/warteraum-musik.mp3?):", err.message);
      }
    }

    // Warteraum verlassen -> falls niemand mehr drin ist, Musik/Verbindung stoppen
    if (oldState.channelId === config.supportWarteraumChannelId) {
      const channel = oldState.guild.channels.cache.get(config.supportWarteraumChannelId);
      if (channel && channel.members.size === 0) {
        const { getVoiceConnection } = require("@discordjs/voice");
        const connection = getVoiceConnection(oldState.guild.id);
        if (connection) connection.destroy();
      }
    }
  },
};
