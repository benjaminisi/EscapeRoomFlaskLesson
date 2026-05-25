from flask import Blueprint, jsonify
from app.services.game_service import GameService

game_bp = Blueprint('game_bp', __name__)

@game_bp.route('/<player_name>', methods=['GET'])
def get_game_state(player_name):
    result, status_code = GameService.get_game_state(player_name)
    return jsonify(result), status_code

@game_bp.route('/<player_name>/reset', methods=['POST'])
def reset_game(player_name):
    result, status_code = GameService.reset_game(player_name)
    return jsonify(result), status_code
