from flask import Blueprint, request, jsonify
from app.services.admin_service import AdminService

admin_bp = Blueprint('admin_bp', __name__)

@admin_bp.route('/init-db', methods=['POST'])
def init_database():
    force = request.args.get('force', 'false').lower() == 'true'
    result, status_code = AdminService.init_database(force=force)
    return jsonify(result), status_code

@admin_bp.route('/players', methods=['GET'])
def get_players():
    result, status_code = AdminService.get_all_players()
    return jsonify(result), status_code

@admin_bp.route('/debug-status', methods=['GET'])
def get_debug_status():
    from app.debugger import is_debugger_connected
    return jsonify({'connected': is_debugger_connected()}), 200

@admin_bp.route('/debug-connect', methods=['POST'])
def trigger_debug_connect():
    from app.debugger import attach_to_debugger, is_debugger_connected
    success = attach_to_debugger(suspend=False, verbose=True)
    return jsonify({'connected': is_debugger_connected(), 'success': success}), 200
