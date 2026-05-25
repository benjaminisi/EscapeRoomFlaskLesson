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

    return app
