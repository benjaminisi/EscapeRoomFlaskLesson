from app.db import get_db

class ItemRepo:
    @staticmethod
    def get_by_id(item_id):
        db = get_db()
        row = db.execute("SELECT * FROM items WHERE id = %s", (item_id,)).fetchone()
        return dict(row) if row else None

    @staticmethod
    def get_all():
        db = get_db()
        rows = db.execute("SELECT * FROM items").fetchall()
        return [dict(row) for row in rows]

    @staticmethod
    def get_by_player(player_name):
        db = get_db()
        rows = db.execute("SELECT * FROM items WHERE owner_name = %s", (player_name,)).fetchall()
        return [dict(row) for row in rows]

    @staticmethod
    def get_by_grid_coords(x, y):
        db = get_db()
        rows = db.execute("SELECT * FROM items WHERE location_type = 'grid' AND x = %s AND y = %s", (x, y)).fetchall()
        return [dict(row) for row in rows]

    @staticmethod
    def update_location(item_id, location_type, owner_name, x, y):
        db = get_db()
        db.execute(
            "UPDATE items SET location_type = %s, owner_name = %s, x = %s, y = %s WHERE id = %s",
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
            db.execute("UPDATE items SET uses_left = %s WHERE id = %s", (new_uses, item_id))
            db.commit()
        return ItemRepo.get_by_id(item_id)

    @staticmethod
    def set_activation_level(item_id, level):
        db = get_db()
        db.execute("UPDATE items SET activation_level = %s WHERE id = %s", (level, item_id))
        db.commit()
        return ItemRepo.get_by_id(item_id)

    @staticmethod
    def set_uses(item_id, uses):
        db = get_db()
        db.execute("UPDATE items SET uses_left = %s WHERE id = %s", (uses, item_id))
        db.commit()
        return ItemRepo.get_by_id(item_id)


    @staticmethod
    def reset_all():
        db = get_db()
        # Reset lantern to grid
        db.execute("UPDATE items SET location_type = 'grid', owner_name = NULL, x = 0, y = 1, uses_left = -1, activation_level = 0 WHERE id = 'item_lantern'")
        db.execute("UPDATE items SET id = 'item_lantern', name = 'Lantern', location_type = 'grid', owner_name = NULL, x = 0, y = 1, uses_left = -1, activation_level = 0 WHERE id = 'item_flash'")
        # Reset WD-40 to puzzle_reward
        db.execute("UPDATE items SET location_type = 'puzzle_reward', owner_name = NULL, x = NULL, y = NULL, uses_left = 1, activation_level = 0 WHERE id = 'item_wd40'")
        # Reset Key to puzzle_reward
        db.execute("UPDATE items SET location_type = 'puzzle_reward', owner_name = NULL, x = NULL, y = NULL, uses_left = 1, activation_level = 0 WHERE id = 'item_key'")
        db.commit()
