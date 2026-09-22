const config = require("../config");
const { checkExpiredGiveaways } = require("../modules/giveawayHandler");

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(`✅ Bot eingeloggt als ${client.user.tag}`);

    const guild = client.guilds.cache.first();

    async function updateStatus() {
      if (!guild) return;
      await guild.members.fetch().catch(() => {});

      const players = guild.members.cache.filter((m) => !m.user.bot).size;
      const bots = guild.members.cache.filter((m) => m.user.bot).size;
      const boosts = guild.premiumSubscriptionCount ?? 0;

      const setName = (channelId, name) => {
        const channel = guild.channels.cache.get(channelId);
        if (channel) channel.setName(name).catch(() => {});
      };

      setName(config.statusChannels.playersChannelId, `👥 Spieler: ${players}`);
      setName(config.statusChannels.botsChannelId, `🤖 Bots: ${bots}`);
      setName(config.statusChannels.boostsChannelId, `🚀 Boosts: ${boosts}`);
    }

    // Discord erlaubt Kanal-Umbenennungen nicht beliebig oft (Rate-Limit),
    // daher alle 10 Minuten statt jede Sekunde.
    updateStatus();
    setInterval(updateStatus, 10 * 60 * 1000);

    // Giveaways alle 15 Sekunden auf Ablauf prüfen
    setInterval(() => checkExpiredGiveaways(client), 15 * 1000);
  },
};
