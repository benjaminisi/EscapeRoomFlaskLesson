from app.repositories.player_repo import PlayerRepo
from app.repositories.puzzle_repo import PuzzleRepo

class PlayerService:
    @staticmethod
    def register_player(name, role='operative', color='#00f0ff'):
        if not name:
            return {'error': 'Operative name is required'}, 400
            
        existing = PlayerRepo.get_by_name(name)
        if existing:
            return {'message': 'Welcome back, operative.', 'player': existing}, 200
            
        try:
            new_player = PlayerRepo.create(name, role, color)
            return {'message': 'Operative registered successfully.', 'player': new_player}, 201
        except Exception as e:
            return {'error': f'Failed to create operative: {str(e)}'}, 500

    @staticmethod
    def move_player(name, dx, dy):
        player = PlayerRepo.get_by_name(name)
        if not player:
            return {'error': f'Operative {name} not registered'}, 404
            
        try:
            dx = int(dx)
            dy = int(dy)
        except ValueError:
            return {'error': 'Invalid delta format'}, 400
            
        # Standard maze walls
        walls = [(1, 0), (1, 1), (3, 2), (3, 3), (1, 4)]
        
        target_x = player['x'] + dx
        target_y = player['y'] + dy
        
        # 1. Bounds check
        if target_x < 0 or target_x >= 5 or target_y < 0 or target_y >= 5:
            return {
                'status': 'blocked',
                'reason': 'boundary_collision',
                'message': f'Operative coordinate out of bounds at ({target_x}, {target_y}).'
            }, 200
            
        # 2. Wall collision check
        if (target_x, target_y) in walls:
            return {
                'status': 'blocked',
                'reason': 'wall_collision',
                'message': f'Titanium barrier detected at ({target_x}, {target_y}).'
            }, 200
            
        # 3. Puzzle check
        puzzle = PuzzleRepo.get_by_coords(target_x, target_y)
        if puzzle and not puzzle['solved']:
            return {
                'status': 'blocked',
                'reason': 'unsolved_puzzle',
                'puzzle': puzzle,
                'message': f"Access denied: Puzzle Node '{puzzle['name']}' requires bypass at ({target_x}, {target_y})."
            }, 200
            
        # 4. Exit door check
        if target_x == 4 and target_y == 4:
            unsolved_count = PuzzleRepo.count_unsolved()
            if unsolved_count > 0:
                return {
                    'status': 'blocked',
                    'reason': 'exit_locked',
                    'message': 'Exit Door Locked: active firewall nodes detected.'
                }, 200

            from app.services.item_service import ItemService
            from app.repositories.item_repo import ItemRepo
            inv = ItemService.get_inventory(name)
            wd40_item = None
            if inv['hand'] and inv['hand']['id'] == 'item_wd40':
                wd40_item = inv['hand']
            else:
                for item in inv['bag']:
                    if item['id'] == 'item_wd40':
                        wd40_item = item
                        break
                        
            if not wd40_item or wd40_item['uses_left'] <= 0:
                return {
                    'status': 'blocked',
                    'reason': 'exit_locked_rusty',
                    'message': 'Exit Door is extremely rusty and stuck. You need some WD-40 to open it.'
                }, 200
                
            ItemRepo.use_item('item_wd40')
                
        # Success: Commit coordinates and step count
        new_steps = player['steps_taken'] + 1
        updated_player = PlayerRepo.update_position(name, target_x, target_y, new_steps)
        
        return {
            'status': 'success',
            'player': updated_player,
            'message': f'Operative coordinate updated to ({target_x}, {target_y}).'
        }, 200
