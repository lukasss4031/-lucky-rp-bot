const config = require("../config");

module.exports = {
  name: "voiceStateUpdate",
  async execute(oldState, newState) {
    // Nutzer betritt den Support-Warteraum -> Team im #Supportping-Kanal benachrichtigen.
    // (Voice-Join + Wartemusik wurde entfernt: Discord-Sprachverbindungen funktionieren
    // auf dem aktuellen Railway-Hosting nicht zuverlässig - UDP-Verkehr wird blockiert.)
    if (newState.member.user.bot) return; // Bots (auch der eigene) lösen keinen Ping aus

    if (newState.channelId === config.supportWarteraumChannelId && oldState.channelId !== config.supportWarteraumChannelId) {
      const pingChannel = newState.guild.channels.cache.get(config.supportPingChannelId);
      if (pingChannel) {
        const pingRollen = [].concat(config.supportPingRoleId).map((id) => `<@&${id}>`).join(" ");
        pingChannel
          .send(`${pingRollen} im Support-Warteraum wartet ${newState.member}! 🆘`)
          .catch(() => {});
      }
    }
  },
};
