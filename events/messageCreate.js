const config = require("../config");
const faqAssistant = require("../modules/faqAssistant");

module.exports = {
  name: "messageCreate",
  async execute(message) {
    if (message.author.bot) return;
    if (message.channel.id !== config.fragenChannelId) return;

    const antwort = faqAssistant.findAnswer(message.content);
    message.reply(antwort).catch(() => {});
  },
};
