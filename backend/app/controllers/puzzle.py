from flask import Blueprint, jsonify, request
from app.services.puzzle_service import PuzzleService

puzzle_bp = Blueprint('puzzle_bp', __name__)

@puzzle_bp.route('/<player_name>/<puzzle_id>/solve', methods=['POST'])
def solve_puzzle_for_player(player_name, puzzle_id):
    result, status_code = PuzzleService.solve_puzzle(player_name, puzzle_id)
    return jsonify(result), status_code

@puzzle_bp.route('/<puzzle_id>/solve', methods=['POST'])
def solve_puzzle(puzzle_id):
    data = request.get_json(silent=True) or {}
    player_name = data.get('player_name') or request.args.get('player_name')
    result, status_code = PuzzleService.solve_puzzle(player_name, puzzle_id)
    return jsonify(result), status_code

