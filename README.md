# Lucky RP Discord Bot

Ein Discord-Bot für Lucky RP (Notruf Hamburg) mit Moderation, Teamliste,
Giveaways, Ticket-System, Bewerbungen, Vorschlägen, Support-Warteraum,
Server-Status-Anzeige, einfachem Anti-Nuke/Anti-Raid-Schutz, einem
FAQ-Assistenten und einer Anbindung für Roblox-Verwarnungen.

## 1. Discord Bot erstellen

1. Gehe zu https://discord.com/developers/applications und klicke auf **New Application**.
2. Gib ihr einen Namen (z.B. "Lucky RP Bot").
3. Gehe links auf **Bot** → **Reset Token** → kopiere den Token (das ist dein `DISCORD_TOKEN`).
4. Aktiviere dort unter "Privileged Gateway Intents": **Server Members Intent** und **Message Content Intent**.
5. Gehe zu **OAuth2 → URL Generator**, wähle die Scopes `bot` und `applications.commands`,
   bei Bot-Permissions z.B. `Administrator` (für den Anfang am einfachsten), und lade den Bot
   über den generierten Link auf deinen Server ein.
6. Unter **General Information** findest du die **Application ID** (das ist dein `CLIENT_ID`).
7. Deine Server-ID (`GUILD_ID`) bekommst du, indem du in Discord den Entwicklermodus aktivierst
   (Einstellungen → Erweitert → Entwicklermodus) und dann rechtsklick auf deinen Server → "ID kopieren".

## 2. Projekt einrichten

1. Kopiere `.env.example` zu `.env` und trage dort deine Werte ein (`DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`, `ROBLOX_API_SECRET`).
2. Öffne `config.js` und trage dort alle Kanal- und Rollen-IDs deines Servers ein (siehe Kommentare in der Datei).
3. Lege optional eine MP3-Datei unter `assets/warteraum-musik.mp3` ab, das ist die Musik für den Support-Warteraum.
4. Lokal testen (optional, braucht Node.js): `npm install` dann `npm run deploy` (registriert die Slash-Befehle) und `npm start`.

## 3. Kostenlos hosten mit Railway

1. Lade dieses Projekt in ein neues GitHub-Repository hoch (kannst du direkt über die GitHub-Webseite machen, "Upload files").
2. Gehe zu https://railway.app, logge dich mit GitHub ein.
3. **New Project → Deploy from GitHub repo** → wähle dein Repository aus.
4. Gehe im Railway-Projekt auf **Variables** und trage dort dieselben Werte wie in deiner `.env`-Datei ein
   (`DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`, `ROBLOX_API_SECRET`). `PORT` setzt Railway meist automatisch.
5. Unter **Settings** stellst du als **Start Command** `npm start` ein (falls nicht automatisch erkannt).
6. Einmalig musst du die Slash-Befehle registrieren. Am einfachsten lokal mit `npm run deploy`,
   oder du fügst in Railway unter "Deploy" testweise kurz `npm run deploy && npm start` als Start-Befehl ein.
7. Fertig — der Bot sollte online gehen.

## 4. Module aktivieren (Panels posten)

Nutze im Discord-Server einmalig (als Team-Mitglied mit der Moderationsrolle):
- `/ticket-setup` im gewünschten Ticket-Kanal
- `/bewerbung-setup` im gewünschten Bewerbungs-Kanal

## 5. Roblox-Anbindung (automatische Warns aus dem Spiel)

Der Bot startet einen kleinen Webserver (`roblox-webhook-server.js`). Railway gibt dir automatisch
eine öffentliche URL für dein Projekt (unter Settings → Networking → "Generate Domain").

In deinem Roblox-Spiel (Server-Script) kannst du dann bei einem Fail-RP-Vorfall Folgendes senden:

```lua
local HttpService = game:GetService("HttpService")

HttpService:PostAsync(
  "https://DEINE-RAILWAY-URL.up.railway.app/roblox/warn",
  HttpService:JSONEncode({
    secret = "DEIN_ROBLOX_API_SECRET", -- muss exakt mit ROBLOX_API_SECRET übereinstimmen
    robloxUsername = player.Name,
    reason = "Fail-RP",
    moderator = "System"
  }),
  Enum.HttpContentType.ApplicationJson
)
```

Wichtig: In Roblox Studio musst du unter **Game Settings → Security → Allow HTTP Requests** aktivieren.

Alternativ kannst du Verwarnungen auch direkt in Discord mit `/robloxwarn` eintragen, ganz ohne
die Roblox-Anbindung — das funktioniert auch ohne den Webserver.

## 6. Befehlsübersicht

| Befehl | Beschreibung |
|---|---|
| `/teamliste` | Zeigt alle Teammitglieder |
| `/verwarnen` | Discord-Verwarnung eintragen |
| `/robloxwarn` | Roblox-Verwarnung eintragen (z.B. Fail-RP) |
| `/uprank` | Nutzer eine Rangstufe hochstufen |
| `/downrank` | Nutzer eine Rangstufe runterstufen |
| `/shift start` / `/shift ende` | Team-Schicht starten/beenden |
| `/abmelden` | Vom Dienst abmelden |
| `/vorschlag` | Vorschlag einreichen |
| `/ticket-setup` | Ticket-Panel posten (einmalig) |
| `/bewerbung-setup` | Bewerbung-Panel posten (einmalig) |
| `/giveaway-start` | Giveaway starten |

## 7. Was noch fehlt / ausgebaut werden kann

- **KI-Assistent**: Aktuell antwortet der Bot nur auf feste Stichwörter aus `config.js` (`faq`-Liste, kostenlos).
  Für einen "echten" KI-Assistenten, der auch freie Fragen versteht, bräuchtest du einen bezahlten
  API-Zugang zu einem Sprachmodell — sag Bescheid, dann bauen wir das als nächstes ein.
- **Anti-Nuke/Anti-Raid**: Der eingebaute Schutz ist eine solide Basis (erkennt schnelles Massen-Löschen
  von Kanälen/Rollen, Massen-Bans und viele Joins in kurzer Zeit), aber kein Ersatz für einen dedizierten
  Sicherheitsbot bei sehr großen Servern.
- **Wartemusik**: Du musst selbst eine MP3-Datei unter `assets/warteraum-musik.mp3` ablegen (aus
  Urheberrechtsgründen liegt hier keine bei).
