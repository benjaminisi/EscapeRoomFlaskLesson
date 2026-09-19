import os
import sys
import unittest
from unittest.mock import patch, MagicMock

# Ensure backend directory is on sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.item_service import ItemService


class TestWD40FireballMechanics(unittest.TestCase):
    def setUp(self):
        self.player_alice = {'name': 'Alice', 'x': 3, 'y': 4, 'role': 'operative', 'color': '#00f0ff'}
        self.wd40 = {'id': 'item_wd40', 'name': 'WD-40', 'owner_name': 'Alice', 'location_type': 'hand', 'x': None, 'y': None, 'uses_left': 1, 'activation_level': 0}

    @patch('app.services.item_service.ItemRepo')
    @patch('app.services.item_service.PlayerRepo')
    def test_wd40_fireball_when_using_player_holds_active_lantern(self, mock_player_repo, mock_item_repo):
        """Spraying WD-40 while holding an active lantern triggers a fireball."""
        mock_player_repo.get_by_name.side_effect = lambda name: self.player_alice if name == 'Alice' else None
        
        active_lantern = {
            'id': 'item_lantern',
            'name': 'Lantern',
            'owner_name': 'Alice',
            'location_type': 'hand',
            'x': None,
            'y': None,
            'activation_level': 1,
            'uses_left': -1
        }
        mock_item_repo.get_by_id.side_effect = lambda item_id: (
            self.wd40 if item_id == 'item_wd40' else (active_lantern if item_id in ('item_lantern', 'item_flash') else None)
        )
        mock_item_repo.get_by_player.return_value = [self.wd40, active_lantern]

        res, code = ItemService.use_item('Alice', 'item_wd40')

        self.assertEqual(code, 200)
        self.assertEqual(res['status'], 'blocked')
        self.assertIn('fireball', res['message'])
        mock_item_repo.set_uses.assert_called_with('item_lantern', 0)
        mock_item_repo.set_activation_level.assert_called_with('item_lantern', 0)
        # WD-40 should NOT have been consumed
        mock_item_repo.use_item.assert_not_called()

    @patch('app.services.item_service.ItemRepo')
    @patch('app.services.item_service.PlayerRepo')
    def test_wd40_no_fireball_when_using_player_holds_inactive_lantern(self, mock_player_repo, mock_item_repo):
        """Spraying WD-40 next to the exit door with an inactive lantern does NOT fireball."""
        mock_player_repo.get_by_name.side_effect = lambda name: self.player_alice if name == 'Alice' else None
        
        inactive_lantern = {
            'id': 'item_lantern',
            'name': 'Lantern',
            'owner_name': 'Alice',
            'location_type': 'bag',
            'x': None,
            'y': None,
            'activation_level': 0,
            'uses_left': -1
        }
        mock_item_repo.get_by_id.side_effect = lambda item_id: (
            self.wd40 if item_id == 'item_wd40' else (inactive_lantern if item_id in ('item_lantern', 'item_flash') else None)
        )
        mock_item_repo.get_by_player.return_value = [self.wd40, inactive_lantern]

        res, code = ItemService.use_item('Alice', 'item_wd40')

        self.assertEqual(code, 200)
        self.assertEqual(res['status'], 'success')
        self.assertIn('rust dissolved', res['message'])
        mock_item_repo.use_item.assert_called_with('item_wd40')
        mock_item_repo.set_uses.assert_not_called()

    @patch('app.services.item_service.ItemRepo')
    @patch('app.services.item_service.PlayerRepo')
    def test_wd40_fireball_when_active_lantern_dropped_nearby_orthogonal(self, mock_player_repo, mock_item_repo):
        """Active lantern dropped orthogonally adjacent (3, 3) to player at (3, 4) triggers fireball."""
        mock_player_repo.get_by_name.side_effect = lambda name: self.player_alice if name == 'Alice' else None
        
        dropped_lantern = {
            'id': 'item_lantern',
            'name': 'Lantern',
            'owner_name': None,
            'location_type': 'grid',
            'x': 3,
            'y': 3,
            'activation_level': 2,
            'uses_left': -1
        }
        mock_item_repo.get_by_id.side_effect = lambda item_id: (
            self.wd40 if item_id == 'item_wd40' else (dropped_lantern if item_id in ('item_lantern', 'item_flash') else None)
        )
        mock_item_repo.get_by_player.return_value = [self.wd40]

        res, code = ItemService.use_item('Alice', 'item_wd40')

        self.assertEqual(code, 200)
        self.assertEqual(res['status'], 'blocked')
        self.assertIn('fireball', res['message'])
        mock_item_repo.set_uses.assert_called_with('item_lantern', 0)
        mock_item_repo.set_activation_level.assert_called_with('item_lantern', 0)
        mock_item_repo.use_item.assert_not_called()

    @patch('app.services.item_service.ItemRepo')
    @patch('app.services.item_service.PlayerRepo')
    def test_wd40_fireball_when_active_lantern_dropped_nearby_diagonal(self, mock_player_repo, mock_item_repo):
        """Active lantern dropped diagonally adjacent (2, 3) to player at (3, 4) triggers fireball."""
        mock_player_repo.get_by_name.side_effect = lambda name: self.player_alice if name == 'Alice' else None
        
        dropped_lantern = {
            'id': 'item_lantern',
            'name': 'Lantern',
            'owner_name': None,
            'location_type': 'grid',
            'x': 2,
            'y': 3,
            'activation_level': 1,
            'uses_left': -1
        }
        mock_item_repo.get_by_id.side_effect = lambda item_id: (
            self.wd40 if item_id == 'item_wd40' else (dropped_lantern if item_id in ('item_lantern', 'item_flash') else None)
        )
        mock_item_repo.get_by_player.return_value = [self.wd40]

        res, code = ItemService.use_item('Alice', 'item_wd40')

        self.assertEqual(code, 200)
        self.assertEqual(res['status'], 'blocked')
        self.assertIn('fireball', res['message'])
        mock_item_repo.set_uses.assert_called_with('item_lantern', 0)
        mock_item_repo.set_activation_level.assert_called_with('item_lantern', 0)

    @patch('app.services.item_service.ItemRepo')
    @patch('app.services.item_service.PlayerRepo')
    def test_wd40_fireball_when_active_lantern_dropped_on_same_tile(self, mock_player_repo, mock_item_repo):
        """Active lantern dropped on same tile (3, 4) as player triggers fireball."""
        mock_player_repo.get_by_name.side_effect = lambda name: self.player_alice if name == 'Alice' else None
        
        dropped_lantern = {
            'id': 'item_lantern',
            'name': 'Lantern',
            'owner_name': None,
            'location_type': 'grid',
            'x': 3,
            'y': 4,
            'activation_level': 1,
            'uses_left': -1
        }
        mock_item_repo.get_by_id.side_effect = lambda item_id: (
            self.wd40 if item_id == 'item_wd40' else (dropped_lantern if item_id in ('item_lantern', 'item_flash') else None)
        )
        mock_item_repo.get_by_player.return_value = [self.wd40]

        res, code = ItemService.use_item('Alice', 'item_wd40')

        self.assertEqual(code, 200)
        self.assertEqual(res['status'], 'blocked')
        self.assertIn('fireball', res['message'])
        mock_item_repo.set_uses.assert_called_with('item_lantern', 0)

    @patch('app.services.item_service.ItemRepo')
    @patch('app.services.item_service.PlayerRepo')
    def test_wd40_no_fireball_when_active_lantern_dropped_far_away(self, mock_player_repo, mock_item_repo):
        """Active lantern dropped at (2, 2) (cheat position) does NOT trigger fireball for player at (3, 4)."""
        mock_player_repo.get_by_name.side_effect = lambda name: self.player_alice if name == 'Alice' else None
        
        dropped_lantern = {
            'id': 'item_lantern',
            'name': 'Lantern',
            'owner_name': None,
            'location_type': 'grid',
            'x': 2,
            'y': 2,
            'activation_level': 3,
            'uses_left': -1
        }
        mock_item_repo.get_by_id.side_effect = lambda item_id: (
            self.wd40 if item_id == 'item_wd40' else (dropped_lantern if item_id in ('item_lantern', 'item_flash') else None)
        )
        mock_item_repo.get_by_player.return_value = [self.wd40]

        res, code = ItemService.use_item('Alice', 'item_wd40')

        # Since player is at (3, 4) next to door (4, 4), WD-40 should successfully dissolve rust
        self.assertEqual(code, 200)
        self.assertEqual(res['status'], 'success')
        self.assertIn('rust dissolved', res['message'])
        mock_item_repo.use_item.assert_called_with('item_wd40')

    @patch('app.services.item_service.ItemRepo')
    @patch('app.services.item_service.PlayerRepo')
    def test_wd40_no_fireball_when_dropped_lantern_nearby_is_inactive(self, mock_player_repo, mock_item_repo):
        """Nearby dropped lantern with activation_level=0 does NOT trigger fireball."""
        mock_player_repo.get_by_name.side_effect = lambda name: self.player_alice if name == 'Alice' else None
        
        dropped_lantern = {
            'id': 'item_lantern',
            'name': 'Lantern',
            'owner_name': None,
            'location_type': 'grid',
            'x': 3,
            'y': 3,
            'activation_level': 0,
            'uses_left': -1
        }
        mock_item_repo.get_by_id.side_effect = lambda item_id: (
            self.wd40 if item_id == 'item_wd40' else (dropped_lantern if item_id in ('item_lantern', 'item_flash') else None)
        )
        mock_item_repo.get_by_player.return_value = [self.wd40]

        res, code = ItemService.use_item('Alice', 'item_wd40')

        self.assertEqual(code, 200)
        self.assertEqual(res['status'], 'success')
        mock_item_repo.use_item.assert_called_with('item_wd40')

    @patch('app.services.item_service.ItemRepo')
    @patch('app.services.item_service.PlayerRepo')
    def test_wd40_fireball_when_nearby_other_player_holds_active_lantern(self, mock_player_repo, mock_item_repo):
        """Player Bob at (2, 4) holding active lantern triggers fireball when Alice at (3, 4) uses WD-40."""
        player_bob = {'name': 'Bob', 'x': 2, 'y': 4, 'role': 'operative', 'color': '#ff00ff'}
        mock_player_repo.get_by_name.side_effect = lambda name: (
            self.player_alice if name == 'Alice' else (player_bob if name == 'Bob' else None)
        )
        
        bob_lantern = {
            'id': 'item_lantern',
            'name': 'Lantern',
            'owner_name': 'Bob',
            'location_type': 'hand',
            'x': None,
            'y': None,
            'activation_level': 1,
            'uses_left': -1
        }
        mock_item_repo.get_by_id.side_effect = lambda item_id: (
            self.wd40 if item_id == 'item_wd40' else (bob_lantern if item_id in ('item_lantern', 'item_flash') else None)
        )
        mock_item_repo.get_by_player.return_value = [self.wd40]

        res, code = ItemService.use_item('Alice', 'item_wd40')

        self.assertEqual(code, 200)
        self.assertEqual(res['status'], 'blocked')
        self.assertIn('fireball', res['message'])
        mock_item_repo.set_uses.assert_called_with('item_lantern', 0)
        mock_item_repo.set_activation_level.assert_called_with('item_lantern', 0)

    @patch('app.services.item_service.ItemRepo')
    @patch('app.services.item_service.PlayerRepo')
    def test_wd40_no_fireball_when_other_player_with_active_lantern_is_far(self, mock_player_repo, mock_item_repo):
        """Player Bob at (0, 0) holding active lantern does NOT trigger fireball when Alice at (3, 4) uses WD-40."""
        player_bob = {'name': 'Bob', 'x': 0, 'y': 0, 'role': 'operative', 'color': '#ff00ff'}
        mock_player_repo.get_by_name.side_effect = lambda name: (
            self.player_alice if name == 'Alice' else (player_bob if name == 'Bob' else None)
        )
        
        bob_lantern = {
            'id': 'item_lantern',
            'name': 'Lantern',
            'owner_name': 'Bob',
            'location_type': 'hand',
            'x': None,
            'y': None,
            'activation_level': 1,
            'uses_left': -1
        }
        mock_item_repo.get_by_id.side_effect = lambda item_id: (
            self.wd40 if item_id == 'item_wd40' else (bob_lantern if item_id in ('item_lantern', 'item_flash') else None)
        )
        mock_item_repo.get_by_player.return_value = [self.wd40]

        res, code = ItemService.use_item('Alice', 'item_wd40')

        self.assertEqual(code, 200)
        self.assertEqual(res['status'], 'success')
        self.assertIn('rust dissolved', res['message'])
        mock_item_repo.use_item.assert_called_with('item_wd40')

    @patch('app.services.item_service.ItemRepo')
    @patch('app.services.item_service.PlayerRepo')
    def test_wd40_no_fireball_when_nearby_other_player_holds_inactive_lantern(self, mock_player_repo, mock_item_repo):
        """Player Bob at (3, 3) holding inactive lantern does NOT trigger fireball when Alice uses WD-40."""
        player_bob = {'name': 'Bob', 'x': 3, 'y': 3, 'role': 'operative', 'color': '#ff00ff'}
        mock_player_repo.get_by_name.side_effect = lambda name: (
            self.player_alice if name == 'Alice' else (player_bob if name == 'Bob' else None)
        )
        
        bob_lantern = {
            'id': 'item_lantern',
            'name': 'Lantern',
            'owner_name': 'Bob',
            'location_type': 'hand',
            'x': None,
            'y': None,
            'activation_level': 0,
            'uses_left': -1
        }
        mock_item_repo.get_by_id.side_effect = lambda item_id: (
            self.wd40 if item_id == 'item_wd40' else (bob_lantern if item_id in ('item_lantern', 'item_flash') else None)
        )
        mock_item_repo.get_by_player.return_value = [self.wd40]

        res, code = ItemService.use_item('Alice', 'item_wd40')

        self.assertEqual(code, 200)
        self.assertEqual(res['status'], 'success')
        mock_item_repo.use_item.assert_called_with('item_wd40')


if __name__ == '__main__':
    unittest.main()
