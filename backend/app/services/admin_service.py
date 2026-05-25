import os
from app.db import get_db
from app.repositories.player_repo import PlayerRepo

class AdminService:
    @staticmethod
    def init_database(force=False):
        db = get_db()
        schema_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'schema.sql')
        
        try:
            if force:
                db.execute("DROP TABLE IF EXISTS players")
                db.execute("DROP TABLE IF EXISTS puzzles")
                db.commit()

            with open(schema_path, 'r') as f:
                schema_sql = f.read()
                
            db.executescript(schema_sql)
            db.commit()
            
            action = "rebuilt" if force else "initialized"
            return {'status': 'success', 'message': f'Database {action} successfully from schema.sql.'}, 200
        except Exception as e:
            db.rollback()
            return {'error': f'Failed to initialize database: {str(e)}'}, 500

    @staticmethod
    def get_all_players():
        try:
            players = PlayerRepo.get_all()
            return {'status': 'success', 'players': players}, 200
        except Exception as e:
            return {'error': f'Failed to fetch players: {str(e)}'}, 500
