DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS timeline_items;
DROP TABLE IF EXISTS trips;

CREATE TABLE trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

CREATE TABLE timeline_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    time_mark TEXT NOT NULL,
    title TEXT NOT NULL,
    maps_url TEXT,
    description TEXT
);

CREATE TABLE expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
    timeline_item_id INTEGER REFERENCES timeline_items(id) ON DELETE SET NULL,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    expense_date DATE NOT NULL
);
