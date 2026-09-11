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
            reward_item_id = 'item_wd40' if puzzle_id == 'puz_1' else ('item_key' if puzzle_id == 'puz_3' else None)
            if reward_item_id:
                reward_name = 'WD-40' if reward_item_id == 'item_wd40' else 'Exit Key'
                if player_name:
                    ItemService.grant_reward(player_name, reward_item_id, updated_puzzle['x'], updated_puzzle['y'])
                    msg += f" Reward granted: {reward_name}."
                else:
                    from app.repositories.item_repo import ItemRepo
                    ItemRepo.update_location(reward_item_id, 'grid', None, updated_puzzle['x'], updated_puzzle['y'])
                    msg += f" Reward dropped at node: {reward_name}."
                
            return {
                'status': 'success',
                'puzzle': updated_puzzle,
                'message': msg
            }, 200
        except Exception as e:
            return {'error': f'Failed to record bypass: {str(e)}'}, 500
