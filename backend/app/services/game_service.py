from app.repositories.player_repo import PlayerRepo
from app.repositories.puzzle_repo import PuzzleRepo

class GameService:
    @staticmethod
    def get_game_state(player_name):
        player = PlayerRepo.get_by_name(player_name)
        if not player:
            return {'error': f'Operative {player_name} not registered'}, 404
            
        puzzles = PuzzleRepo.get_all()
        return {
            'player': player,
            'puzzles': puzzles
        }, 200

    @staticmethod
    def reset_game(player_name):
        player = PlayerRepo.get_by_name(player_name)
        if not player:
            return {'error': f'Operative {player_name} not registered'}, 404
            
        try:
            PlayerRepo.reset_position(player_name)
            PuzzleRepo.reset_all()
            
            updated_player = PlayerRepo.get_by_name(player_name)
            puzzles = PuzzleRepo.get_all()
            
            return {
                'status': 'success',
                'message': 'Chamber simulation environment reset successfully.',
                'player': updated_player,
                'puzzles': puzzles
            }, 200
        except Exception as e:
            return {'error': f'Failed to reset simulation: {str(e)}'}, 500
