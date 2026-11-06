CREATE TABLE daily_players (
    player_id TEXT PRIMARY KEY,
    first_daily_date TEXT NOT NULL
);

CREATE TABLE feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    feedback_type TEXT NOT NULL,
    message TEXT NOT NULL,
    email TEXT
);

CREATE TABLE game_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    event_type TEXT NOT NULL,
    game_mode TEXT,
    challenge_date TEXT,
    session_id TEXT,
    device_type TEXT,
    final_score INTEGER,
    duration_seconds INTEGER,
    round_number INTEGER,
    location_name TEXT,
    location_category TEXT,
    round_score INTEGER,
    distance_km REAL,
    player_id TEXT,
    location_difficulty INTEGER
);