from app.db import get_db

class PlayerRepo:
    @staticmethod
    def get_by_name(name):
        db = get_db()
        row = db.execute("SELECT * FROM players WHERE name = ?", (name,)).fetchone()
        return dict(row) if row else None

    @staticmethod
    def create(name, role, color):
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            "INSERT INTO players (name, role, color, x, y, steps_taken) VALUES (?, ?, ?, 0, 0, 0)",
            (name, role, color)
        )
        db.commit()
        return PlayerRepo.get_by_name(name)

    @staticmethod
    def update_position(name, x, y, steps_taken):
        db = get_db()
        db.execute(
            "UPDATE players SET x = ?, y = ?, steps_taken = ? WHERE name = ?",
            (x, y, steps_taken, name)
        )
        db.commit()
        return PlayerRepo.get_by_name(name)

    @staticmethod
    def reset_position(name):
        db = get_db()
        db.execute(
            "UPDATE players SET x = 0, y = 0, steps_taken = 0 WHERE name = ?",
            (name,)
        )
        db.commit()
        return PlayerRepo.get_by_name(name)

    @staticmethod
    def get_all():
        db = get_db()
        rows = db.execute("SELECT * FROM players").fetchall()
        return [dict(row) for row in rows]
