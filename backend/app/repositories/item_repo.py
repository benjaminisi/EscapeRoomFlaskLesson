from app.db import get_db

class ItemRepo:
    @staticmethod
    def get_by_id(item_id):
        db = get_db()
        row = db.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
        return dict(row) if row else None

    @staticmethod
    def get_all():
        db = get_db()
        rows = db.execute("SELECT * FROM items").fetchall()
        return [dict(row) for row in rows]

    @staticmethod
    def get_by_player(player_name):
        db = get_db()
        rows = db.execute("SELECT * FROM items WHERE owner_name = ?", (player_name,)).fetchall()
        return [dict(row) for row in rows]

    @staticmethod
    def get_by_grid_coords(x, y):
        db = get_db()
        rows = db.execute("SELECT * FROM items WHERE location_type = 'grid' AND x = ? AND y = ?", (x, y)).fetchall()
        return [dict(row) for row in rows]

    @staticmethod
    def update_location(item_id, location_type, owner_name, x, y):
        db = get_db()
        db.execute(
            "UPDATE items SET location_type = ?, owner_name = ?, x = ?, y = ? WHERE id = ?",
            (location_type, owner_name, x, y, item_id)
        )
        db.commit()
        return ItemRepo.get_by_id(item_id)

    @staticmethod
    def use_item(item_id):
        db = get_db()
        item = ItemRepo.get_by_id(item_id)
        if item and item['uses_left'] > 0:
            new_uses = item['uses_left'] - 1
            db.execute("UPDATE items SET uses_left = ? WHERE id = ?", (new_uses, item_id))
            db.commit()
        return ItemRepo.get_by_id(item_id)

    @staticmethod
    def reset_all():
        db = get_db()
        # Reset flashlight to grid
        db.execute("UPDATE items SET location_type = 'grid', owner_name = NULL, x = 0, y = 1, uses_left = -1 WHERE id = 'item_flash'")
        # Reset WD-40 to puzzle_reward
        db.execute("UPDATE items SET location_type = 'puzzle_reward', owner_name = NULL, x = NULL, y = NULL, uses_left = 1 WHERE id = 'item_wd40'")
        # Reset Key to puzzle_reward
        db.execute("UPDATE items SET location_type = 'puzzle_reward', owner_name = NULL, x = NULL, y = NULL, uses_left = 1 WHERE id = 'item_key'")
        db.commit()
