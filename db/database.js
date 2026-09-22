const Database = require("better-sqlite3");
const path = require("path");

// Die Datei bot.sqlite wird automatisch angelegt und speichert alle Daten dauerhaft.
const db = new Database(path.join(__dirname, "..", "bot.sqlite"));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS warns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL,
  moderatorId TEXT NOT NULL,
  reason TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'discord', -- 'discord' oder 'roblox'
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS team_members (
  userId TEXT PRIMARY KEY,
  addedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS shifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL,
  startedAt INTEGER NOT NULL,
  endedAt INTEGER
);

CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channelId TEXT NOT NULL,
  userId TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL,
  answers TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  messageId TEXT,
  userId TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS giveaways (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  messageId TEXT,
  channelId TEXT NOT NULL,
  prize TEXT NOT NULL,
  winnersCount INTEGER NOT NULL,
  endsAt INTEGER NOT NULL,
  ended INTEGER NOT NULL DEFAULT 0,
  hostId TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS giveaway_entries (
  giveawayId INTEGER NOT NULL,
  userId TEXT NOT NULL,
  PRIMARY KEY (giveawayId, userId)
);
`);

module.exports = db;
