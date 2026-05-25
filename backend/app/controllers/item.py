from flask import Blueprint, jsonify
from app.services.item_service import ItemService

item_bp = Blueprint('item_bp', __name__)

@item_bp.route('/<player_name>/pickup/<item_id>', methods=['POST'])
def pickup_item(player_name, item_id):
    result, status_code = ItemService.pickup_item(player_name, item_id)
    return jsonify(result), status_code

@item_bp.route('/<player_name>/drop/<item_id>', methods=['POST'])
def drop_item(player_name, item_id):
    result, status_code = ItemService.drop_item(player_name, item_id)
    return jsonify(result), status_code

@item_bp.route('/<player_name>/equip/<item_id>', methods=['POST'])
def equip_item(player_name, item_id):
    result, status_code = ItemService.equip_item(player_name, item_id)
    return jsonify(result), status_code

@item_bp.route('/<player_name>/use/<item_id>', methods=['POST'])
def use_item(player_name, item_id):
    result, status_code = ItemService.use_item(player_name, item_id)
    return jsonify(result), status_code
