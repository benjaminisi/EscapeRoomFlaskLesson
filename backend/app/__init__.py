from flask import Flask, jsonify
from flask_cors import CORS
from app import db

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    db.init_app(app)
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'online',
            'message': 'Cyber Escape Room API server is active.'
        }), 200

    from app.controllers.player import player_bp
    from app.controllers.puzzle import puzzle_bp
    from app.controllers.game import game_bp
    from app.controllers.admin import admin_bp
    from app.controllers.item import item_bp

    app.register_blueprint(player_bp, url_prefix='/api/player')
    app.register_blueprint(puzzle_bp, url_prefix='/api/puzzle')
    app.register_blueprint(game_bp, url_prefix='/api/game-state')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(item_bp, url_prefix='/api/item')

    # Diagnostic error handlers to eliminate silent failures
    from flask import request
    import traceback

    @app.errorhandler(404)
    def handle_api_404(e):
        if request.path.startswith('/api'):
            diag_msg = (
                f"\n=== [AGENT DIAGNOSTIC REPORT: 404 NOT FOUND] ===\n"
                f"Endpoint: {request.method} {request.path}\n"
                f"Query Params: {dict(request.args)}\n"
                f"Request Body: {request.get_json(silent=True)}\n"
                f"Failure Cause: No matching route found for this URL.\n"
                f"Agent Prompt Hint: Check route path in backend/app/controllers/ vs frontend/src/services/api.ts\n"
                f"================================================"
            )
            app.logger.error(diag_msg)
            return jsonify({
                'error': f"Endpoint not found: {request.method} {request.path}",
                'status_code': 404,
                'diagnostic': diag_msg
            }), 404
        return e

    @app.errorhandler(Exception)
    def handle_api_exception(e):
        if request.path.startswith('/api'):
            tb = traceback.format_exc()
            diag_msg = (
                f"\n=== [AGENT DIAGNOSTIC REPORT: 500 SERVER ERROR] ===\n"
                f"Endpoint: {request.method} {request.path}\n"
                f"Query Params: {dict(request.args)}\n"
                f"Request Body: {request.get_json(silent=True)}\n"
                f"Exception: {type(e).__name__}: {str(e)}\n"
                f"Traceback:\n{tb}"
                f"Agent Prompt Hint: Unhandled exception in backend service/controller.\n"
                f"=================================================="
            )
            app.logger.error(diag_msg)
            return jsonify({
                'error': f"Server error: {str(e)}",
                'status_code': 500,
                'diagnostic': diag_msg
            }), 500
        raise e

    return app
