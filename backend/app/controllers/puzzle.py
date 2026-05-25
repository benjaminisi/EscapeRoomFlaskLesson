from flask import Blueprint, jsonify
from app.services.puzzle_service import PuzzleService

puzzle_bp = Blueprint('puzzle_bp', __name__)

@puzzle_bp.route('/<player_name>/<puzzle_id>/solve', methods=['POST'])
def solve_puzzle(player_name, puzzle_id):
    result, status_code = PuzzleService.solve_puzzle(player_name, puzzle_id)
    return jsonify(result), status_code
