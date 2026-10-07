-- Reel Irie Charters database (Cloudflare D1)
-- Apply with: npm run db:local   (local testing)
--             npm run db:remote  (live site, once)

CREATE TABLE IF NOT EXISTS bookings (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT,
  status        TEXT NOT NULL DEFAULT 'new',   -- new, confirmed, declined, done, cancelled
  trip_id       TEXT,
  trip_name     TEXT,
  date          TEXT,                          -- YYYY-MM-DD
  adults        INTEGER,
  kids          INTEGER,
  kid_ages      TEXT,
  island        TEXT,
  name          TEXT,
  phone         TEXT,
  email         TEXT,
  notes         TEXT,
  captain_notes TEXT
);
CREATE INDEX IF NOT EXISTS bookings_date ON bookings (date);
CREATE INDEX IF NOT EXISTS bookings_status ON bookings (status);

-- Days that differ from the normal week: off, on call, booked, sunset only, open
CREATE TABLE IF NOT EXISTS days (
  date       TEXT PRIMARY KEY,                 -- YYYY-MM-DD
  status     TEXT NOT NULL,
  note       TEXT,
  updated_at TEXT
);
