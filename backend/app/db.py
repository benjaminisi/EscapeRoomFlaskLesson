import sqlite3
import os
from flask import g

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'escaperoom.db')

def migrate_db(conn):
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='items'")
        if cursor.fetchone():
            cursor.execute("PRAGMA table_info(items)")
            columns = [row[1] for row in cursor.fetchall()]
            if 'activation_level' not in columns:
                cursor.execute("ALTER TABLE items ADD COLUMN activation_level INTEGER NOT NULL DEFAULT 0")
                conn.commit()
            
            cursor.execute("UPDATE items SET id = 'item_lantern', name = 'Lantern' WHERE id = 'item_flash'")
            conn.commit()
    except Exception:
        pass

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(
            DB_PATH,
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row
        migrate_db(g.db)
    return g.db

def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_app(app):
    app.teardown_appcontext(close_db)
    if os.path.exists(DB_PATH):
        try:
            conn = sqlite3.connect(DB_PATH)
            migrate_db(conn)
            conn.close()
        except Exception:
            pass
