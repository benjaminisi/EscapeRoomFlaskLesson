from app.repositories.item_repo import ItemRepo
from app.repositories.player_repo import PlayerRepo

BAG_CAPACITY = 3

class ItemService:
    @staticmethod
    def get_inventory(player_name):
        items = ItemRepo.get_by_player(player_name)
        hand = next((i for i in items if i['location_type'] == 'hand'), None)
        bag = [i for i in items if i['location_type'] == 'bag']
        return {'hand': hand, 'bag': bag}

    @staticmethod
    def pickup_item(player_name, item_id):
        player = PlayerRepo.get_by_name(player_name)
        if not player:
            return {'error': 'Player not found'}, 404

        item = ItemRepo.get_by_id(item_id)
        if not item:
            return {'error': 'Item not found'}, 404

        if item['location_type'] != 'grid' or item['x'] != player['x'] or item['y'] != player['y']:
            return {'error': 'Item not at your location'}, 400

        inv = ItemService.get_inventory(player_name)
        
        # If hand is full, try to move hand item to bag
        if inv['hand']:
            if len(inv['bag']) >= BAG_CAPACITY:
                return {'error': 'Bag is full (capacity 3) and hand is full. Drop something first.'}, 400
            
            # Move current hand item to bag
            ItemRepo.update_location(inv['hand']['id'], 'bag', player_name, None, None)

        # Move new item to hand
        updated_item = ItemRepo.update_location(item_id, 'hand', player_name, None, None)
        
        return {
            'status': 'success',
            'message': f"Picked up {updated_item['name']}.",
            'inventory': ItemService.get_inventory(player_name)
        }, 200

    @staticmethod
    def drop_item(player_name, item_id):
        player = PlayerRepo.get_by_name(player_name)
        if not player:
            return {'error': 'Player not found'}, 404

        item = ItemRepo.get_by_id(item_id)
        if not item or item['owner_name'] != player_name:
            return {'error': 'You do not own this item'}, 400

        if item_id in ('item_lantern', 'item_flash'):
            ItemRepo.set_activation_level(item_id, 0)

        updated_item = ItemRepo.update_location(item_id, 'grid', None, player['x'], player['y'])
        
        return {
            'status': 'success',
            'message': f"Dropped {updated_item['name']}.",
            'inventory': ItemService.get_inventory(player_name)
        }, 200

    @staticmethod
    def equip_item(player_name, item_id):
        """Move item from bag to hand. Moves current hand item to bag."""
        item = ItemRepo.get_by_id(item_id)
        if not item or item['owner_name'] != player_name or item['location_type'] != 'bag':
            return {'error': 'Item is not in your bag'}, 400

        inv = ItemService.get_inventory(player_name)
        
        # If hand has something, move it to bag
        if inv['hand']:
            ItemRepo.update_location(inv['hand']['id'], 'bag', player_name, None, None)

        # Move requested item to hand
        ItemRepo.update_location(item_id, 'hand', player_name, None, None)

        return {
            'status': 'success',
            'message': f"Equipped {item['name']}.",
            'inventory': ItemService.get_inventory(player_name)
        }, 200

    @staticmethod
    def use_item(player_name, item_id):
        player = PlayerRepo.get_by_name(player_name)
        if not player:
            return {'error': 'Player not found'}, 404

        item = ItemRepo.get_by_id(item_id)
        if not item or item['owner_name'] != player_name:
            return {'error': 'You do not possess this item'}, 400

        if item['uses_left'] == 0:
            if item_id in ('item_lantern', 'item_flash'):
                return {'error': 'The lantern is broken and cannot be turned on.'}, 400
            return {'error': 'This item has no uses left'}, 400

        if item_id in ('item_lantern', 'item_flash'):
            current_level = item.get('activation_level', 0)
            new_level = 0 if current_level > 0 else 1
            ItemRepo.set_activation_level(item['id'], new_level)
            if new_level > 0:
                msg = f"{item['name']} activated. Illumination expanded by activation level {new_level} (radius {1 + new_level})."
            else:
                msg = f"{item['name']} deactivated. Field of vision reduced to adjacent cells."
            return {
                'status': 'success',
                'message': msg,
                'inventory': ItemService.get_inventory(player_name)
            }, 200

        if item_id == 'item_wd40':
            # Using the WD-40 when the lantern is on creates a fireball that damages the lantern
            lamp_item = ItemRepo.get_by_id('item_lantern') or ItemRepo.get_by_id('item_flash')
            # if lamp_item and lamp_item['owner_name'] == player_name and lamp_item['activation_level'] > 0:
            if lamp_item and lamp_item['owner_name'] == player_name:
                ItemRepo.set_uses(lamp_item['id'], 0)
                ItemRepo.set_activation_level(lamp_item['id'], 0)
                return {
                    'status': 'blocked',
                    'message': "The WD-40 hits the lantern and creates a fireball - lantern is broken.",
                    'inventory': ItemService.get_inventory(player_name)
                }, 200
            # Check proximity to exit (4, 4)
            dx = abs(player['x'] - 4)
            dy = abs(player['y'] - 4)
            if dx + dy > 1 and not (player['x'] == 4 and player['y'] == 4):
                return {'error': 'You must be next to the exit door at (4, 4) to use the WD-40'}, 400
                
            ItemRepo.use_item(item_id)
            return {
                'status': 'success',
                'message': 'You sprayed WD-40 on the exit door hinges. The rust dissolved!',
                'inventory': ItemService.get_inventory(player_name)
            }, 200

        if item_id == 'item_key':
            wd40_item = ItemRepo.get_by_id('item_wd40')
            if not wd40_item or wd40_item['uses_left'] > 0:
                return {'error': 'The keyway is rusted shut! You must use WD-40 on the door first.'}, 400

            dx = abs(player['x'] - 4)
            dy = abs(player['y'] - 4)
            if dx + dy > 1 and not (player['x'] == 4 and player['y'] == 4):
                return {'error': 'You must be next to the exit door at (4, 4) to use the key'}, 400
                
            ItemRepo.use_item(item_id)
            return {
                'status': 'success',
                'message': 'You turned the key. The exit door is unlocked!',
                'inventory': ItemService.get_inventory(player_name)
            }, 200

        if item['uses_left'] > 0:
            ItemRepo.use_item(item_id)
            
        return {
            'status': 'success',
            'message': f"Used {item['name']}.",
            'inventory': ItemService.get_inventory(player_name)
        }, 200

    @staticmethod
    def grant_reward(player_name, item_id, x, y):
        item = ItemRepo.get_by_id(item_id)
        if not item or item['owner_name'] is not None:
            return # already granted
            
        inv = ItemService.get_inventory(player_name)
        if not inv['hand']:
            ItemRepo.update_location(item_id, 'hand', player_name, None, None)
        elif len(inv['bag']) < BAG_CAPACITY:
            ItemRepo.update_location(item_id, 'bag', player_name, None, None)
        else:
            ItemRepo.update_location(item_id, 'grid', None, x, y)
