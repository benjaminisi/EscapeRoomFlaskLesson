from app.db import get_db

class PuzzleRepo:
    @staticmethod
    def get_all():
        db = get_db()
        rows = db.execute("SELECT * FROM puzzles").fetchall()
        return [dict(row) for row in rows]

    @staticmethod
    def get_by_coords(x, y):
        db = get_db()
        row = db.execute("SELECT * FROM puzzles WHERE x = %s AND y = %s", (x, y)).fetchone()
        return dict(row) if row else None

    @staticmethod
    def get_by_id(puzzle_id):
        db = get_db()
        row = db.execute("SELECT * FROM puzzles WHERE id = %s", (puzzle_id,)).fetchone()
        return dict(row) if row else None

    @staticmethod
    def count_unsolved():
        db = get_db()
        row = db.execute("SELECT count(*) as cnt FROM puzzles WHERE solved = 0").fetchone()
        return row['cnt']

    @staticmethod
    def solve(puzzle_id):
        db = get_db()
        db.execute("UPDATE puzzles SET solved = 1 WHERE id = %s", (puzzle_id,))
        db.commit()
        return PuzzleRepo.get_by_id(puzzle_id)

    @staticmethod
    def reset_all():
        db = get_db()
        db.execute("UPDATE puzzles SET solved = 0")
        db.commit()
