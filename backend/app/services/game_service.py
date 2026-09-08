from app.repositories.player_repo import PlayerRepo
from app.repositories.puzzle_repo import PuzzleRepo

class GameService:
    @staticmethod
    def get_game_state(player_name):
        player = PlayerRepo.get_by_name(player_name)
        if not player:
            return {'error': f'Operative {player_name} not registered'}, 404
            
        puzzles = PuzzleRepo.get_all()
        
        from app.repositories.item_repo import ItemRepo
        from app.services.item_service import ItemService
        
        grid_items = [i for i in ItemRepo.get_all() if i['location_type'] == 'grid']
        inventory = ItemService.get_inventory(player_name)
        other_players = [p for p in PlayerRepo.get_all() if p['name'] != player_name]
        lantern = ItemRepo.get_by_id('item_lantern') or ItemRepo.get_by_id('item_flash')
        
        return {
            'player': player,
            'other_players': other_players,
            'puzzles': puzzles,
            'grid_items': grid_items,
            'inventory': inventory,
            'lantern': lantern
        }, 200

    @staticmethod
    def reset_game(player_name):
        player = PlayerRepo.get_by_name(player_name)
        if not player:
            return {'error': f'Operative {player_name} not registered'}, 404
            
        try:
            PlayerRepo.reset_position(player_name)
            PuzzleRepo.reset_all()
            from app.repositories.item_repo import ItemRepo
            ItemRepo.reset_all()
            
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
