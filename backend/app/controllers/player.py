from flask import Blueprint, request, jsonify
from app.services.player_service import PlayerService

player_bp = Blueprint('player_bp', __name__)

@player_bp.route('', methods=['POST'])
def register_player():
    data = request.json or {}
    name = data.get('name', '').strip()
    role = data.get('role', 'operative').strip()
    color = data.get('color', '#00f0ff').strip()
    
    result, status_code = PlayerService.register_player(name, role, color)
    return jsonify(result), status_code

@player_bp.route('/<player_name>/move', methods=['POST'])
def move_player(player_name):
    data = request.json or {}
    dx = data.get('dx', 0)
    dy = data.get('dy', 0)
    
    result, status_code = PlayerService.move_player(player_name, dx, dy)
    return jsonify(result), status_code
