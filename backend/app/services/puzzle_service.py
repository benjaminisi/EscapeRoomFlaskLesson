from app.repositories.puzzle_repo import PuzzleRepo
from app.services.item_service import ItemService

class PuzzleService:
    @staticmethod
    def solve_puzzle(player_name, puzzle_id):
        puzzle = PuzzleRepo.get_by_id(puzzle_id)
        if not puzzle:
            return {'error': f'Puzzle {puzzle_id} not found'}, 404
            
        try:
            updated_puzzle = PuzzleRepo.solve(puzzle_id)
            msg = f"Puzzle Node '{updated_puzzle['name']}' bypass verified."
            
            # Check for rewards
            if puzzle_id == 'puz_1':
                ItemService.grant_reward(player_name, 'item_wd40', updated_puzzle['x'], updated_puzzle['y'])
                msg += " Reward granted: WD-40."
                
            return {
                'status': 'success',
                'puzzle': updated_puzzle,
                'message': msg
            }, 200
        except Exception as e:
            return {'error': f'Failed to record bypass: {str(e)}'}, 500
