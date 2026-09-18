import os
import time
import pymysql
import pymysql.cursors
from pymysql.constants import CLIENT
from flask import g

DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = int(os.environ.get('DB_PORT', 3306))
DB_USER = os.environ.get('DB_USER', 'escaperoom')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'escaperoom_pass')
DB_NAME = os.environ.get('DB_NAME', 'escaperoom')

_migrated = False

class MySQLCursorWrapper:
    def __init__(self, cursor):
        self._cursor = cursor

    def execute(self, query, args=None):
        if '?' in query:
            query = query.replace('?', '%s')
        if args is not None:
            return self._cursor.execute(query, args)
        return self._cursor.execute(query)

    def executemany(self, query, args):
        if '?' in query:
            query = query.replace('?', '%s')
        return self._cursor.executemany(query, args)

    def fetchone(self):
        return self._cursor.fetchone()

    def fetchall(self):
        return self._cursor.fetchall()

    def fetchmany(self, size=None):
        return self._cursor.fetchmany(size)

    @property
    def rowcount(self):
        return self._cursor.rowcount

    @property
    def lastrowid(self):
        return self._cursor.lastrowid

    def close(self):
        return self._cursor.close()

    def __iter__(self):
        return iter(self._cursor)

class MySQLDatabaseWrapper:
    def __init__(self, conn):
        self._conn = conn

    def cursor(self):
        raw_cursor = self._conn.cursor(pymysql.cursors.DictCursor)
        return MySQLCursorWrapper(raw_cursor)

    def execute(self, query, args=None):
        cur = self.cursor()
        cur.execute(query, args)
        return cur

    def executescript(self, script):
        """Executes multiple SQL statements separated by semicolons."""
        statements = [stmt.strip() for stmt in script.split(';') if stmt.strip()]
        cur = self.cursor()
        for stmt in statements:
            cur.execute(stmt)
        return cur

    def commit(self):
        return self._conn.commit()

    def rollback(self):
        return self._conn.rollback()

    def close(self):
        return self._conn.close()

    @property
    def raw_connection(self):
        return self._conn

def create_connection(retries=5, delay=1.0):
    last_err = None
    for attempt in range(retries):
        try:
            conn = pymysql.connect(
                host=DB_HOST,
                port=DB_PORT,
                user=DB_USER,
                password=DB_PASSWORD,
                database=DB_NAME,
                charset='utf8mb4',
                autocommit=False,
                client_flag=CLIENT.MULTI_STATEMENTS
            )
            return conn
        except Exception as e:
            last_err = e
            if attempt < retries - 1:
                time.sleep(delay)
    raise last_err

def migrate_db(db):
    global _migrated
    if _migrated:
        return
    try:
        cur = db.cursor()
        cur.execute("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_schema = DATABASE() AND table_name = 'items' AND column_name = 'activation_level'
        """)
        if not cur.fetchone():
            cur.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = DATABASE() AND table_name = 'items'
            """)
            if cur.fetchone():
                cur.execute("ALTER TABLE items ADD COLUMN activation_level INT NOT NULL DEFAULT 0")
                db.commit()

        cur.execute("UPDATE items SET id = 'item_lantern', name = 'Lantern' WHERE id = 'item_flash'")
        db.commit()
        _migrated = True
    except Exception:
        db.rollback()

def get_db():
    if 'db' not in g:
        conn = create_connection()
        g.db = MySQLDatabaseWrapper(conn)
        migrate_db(g.db)
    return g.db

def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_app(app):
    app.teardown_appcontext(close_db)

