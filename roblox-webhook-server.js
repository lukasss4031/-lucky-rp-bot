const express = require("express");
const db = require("./db/database");
const config = require("./config");

// Dein Roblox-Spiel kann hierüber einen HTTP-Request an den Bot schicken
// (z.B. über Roblox's HttpService:PostAsync), um automatisch einen Warn
// im Discord-Bot einzutragen. Das ist der Gegenpart zu /robloxwarn.
//
// Beispiel-Aufruf aus Roblox (Lua), in einem Server-Script:
//
// local HttpService = game:GetService("HttpService")
// HttpService:PostAsync(
//   "https://DEINE-RAILWAY-URL.up.railway.app/roblox/warn",
//   HttpService:JSONEncode({
//     secret = "DEIN_ROBLOX_API_SECRET",
//     robloxUsername = player.Name,
//     reason = "Fail-RP",
//     moderator = "System"
//   }),
//   Enum.HttpContentType.ApplicationJson
// )

module.exports = function startRobloxWebhookServer(client) {
  const app = express();
  app.use(express.json());

  app.post("/roblox/warn", (req, res) => {
    const { secret, robloxUsername, reason, moderator } = req.body || {};

    if (secret !== process.env.ROBLOX_API_SECRET) {
      return res.status(401).json({ error: "Ungültiges Secret" });
    }
    if (!robloxUsername || !reason) {
      return res.status(400).json({ error: "robloxUsername und reason sind Pflicht" });
    }

    db.prepare(
      "INSERT INTO warns (userId, moderatorId, reason, type, createdAt) VALUES (?, ?, ?, 'roblox', ?)"
    ).run(robloxUsername, moderator || "Roblox-System", reason, Date.now());

    const guild = client.guilds.cache.first();
    const logChannel = guild?.channels.cache.get(config.teamLogChannelId);
    if (logChannel) {
      logChannel.send(`🟥 **Roblox-Warn (automatisch)**: **${robloxUsername}** wurde verwarnt.\nGrund: ${reason}`);
    }

    res.json({ success: true });
  });

  app.get("/", (req, res) => res.send("Lucky RP Bot Webhook läuft ✅"));

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`🌐 Roblox-Webhook-Server läuft auf Port ${port}`));
};
