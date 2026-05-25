import os
from datetime import datetime
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)
# Allow CORS for development (e.g., React frontend running on localhost:5173)
CORS(app)

# SQLite database setup in the backend folder
db_path = os.path.join(os.path.dirname(__file__), 'escaperoom.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ==========================================
# Database Models
# ==========================================

class Player(db.Model):
    __tablename__ = 'players'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    role = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(10), nullable=False)
    x = db.Column(db.Integer, default=0, nullable=False)
    y = db.Column(db.Integer, default=0, nullable=False)
    steps_taken = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'role': self.role,
            'color': self.color,
            'x': self.x,
            'y': self.y,
            'steps_taken': self.steps_taken,
            'created_at': self.created_at.isoformat()
        }

class Puzzle(db.Model):
    __tablename__ = 'puzzles'
    
    id = db.Column(db.String(20), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    solved = db.Column(db.Boolean, default=False, nullable=False)
    x = db.Column(db.Integer, nullable=False)
    y = db.Column(db.Integer, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'solved': self.solved,
            'x': self.x,
            'y': self.y
        }

# ==========================================
# Routes & API Endpoints
# ==========================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple connection test to check API status."""
    return jsonify({
        'status': 'online',
        'message': 'Cyber Escape Room API server is active.'
    }), 200

@app.route('/api/player', methods=['POST'])
def register_player():
    """Register a new operative / player."""
    data = request.json or {}
    name = data.get('name', '').strip()
    role = data.get('role', 'operative').strip()
    color = data.get('color', '#00f0ff').strip()
    
    if not name:
        return jsonify({'error': 'Operative name is required'}), 400
        
    existing = Player.query.filter_by(name=name).first()
    if existing:
        return jsonify({
            'message': 'Welcome back, operative.',
            'player': existing.to_dict()
        }), 200
        
    try:
        new_player = Player(name=name, role=role, color=color, x=0, y=0, steps_taken=0)
        db.session.add(new_player)
        db.session.commit()
        return jsonify({
            'message': 'Operative registered successfully.',
            'player': new_player.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create operative: {str(e)}'}), 500

@app.route('/api/game-state/<player_name>', methods=['GET'])
def get_game_state(player_name):
    """Retrieve operative coordinate and status of all room puzzles."""
    player = Player.query.filter_by(name=player_name).first()
    if not player:
        return jsonify({'error': f'Operative {player_name} not registered'}), 404
        
    puzzles = Puzzle.query.all()
    
    return jsonify({
        'player': player.to_dict(),
        'puzzles': [p.to_dict() for p in puzzles]
    }), 200

@app.route('/api/player/<player_name>/move', methods=['POST'])
def move_player(player_name):
    player = Player.query.filter_by(name=player_name).first()
    if not player:
        return jsonify({'error': f'Operative {player_name} not registered'}), 404
        
    data = request.json or {}
    try:
        dx = int(data.get('dx', 0))
        dy = int(data.get('dy', 0))
    except ValueError:
        return jsonify({'error': 'Invalid delta format'}), 400
        
    # Standard maze walls
    walls = [(1, 0), (1, 1), (3, 2), (3, 3), (1, 4)]
    
    target_x = player.x + dx
    target_y = player.y + dy
    
    # 1. Bounds check
    if target_x < 0 or target_x >= 5 or target_y < 0 or target_y >= 5:
        return jsonify({
            'status': 'blocked',
            'reason': 'boundary_collision',
            'message': f'Operative coordinate out of bounds at ({target_x}, {target_y}).'
        }), 200
        
    # 2. Wall collision check
    if (target_x, target_y) in walls:
        return jsonify({
            'status': 'blocked',
            'reason': 'wall_collision',
            'message': f'Titanium barrier detected at ({target_x}, {target_y}).'
        }), 200
        
    # 3. Puzzle check
    puzzle = Puzzle.query.filter_by(x=target_x, y=target_y).first()
    if puzzle and not puzzle.solved:
        return jsonify({
            'status': 'blocked',
            'reason': 'unsolved_puzzle',
            'puzzle': puzzle.to_dict(),
            'message': f"Access denied: Puzzle Node '{puzzle.name}' requires bypass at ({target_x}, {target_y})."
        }), 200
        
    # 4. Exit door check
    if target_x == 4 and target_y == 4:
        all_solved = Puzzle.query.filter_by(solved=False).count() == 0
        if not all_solved:
            return jsonify({
                'status': 'blocked',
                'reason': 'exit_locked',
                'message': 'Exit Door Locked: active firewall nodes detected.'
            }), 200
            
    # Success: Commit coordinates and step count
    player.x = target_x
    player.y = target_y
    player.steps_taken += 1
    
    try:
        db.session.commit()
        return jsonify({
            'status': 'success',
            'player': player.to_dict(),
            'message': f'Operative coordinate updated to ({target_x}, {target_y}).'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to process movement: {str(e)}'}), 500

@app.route('/api/puzzle/<puzzle_id>/solve', methods=['POST'])
def solve_puzzle(puzzle_id):
    puzzle = Puzzle.query.get(puzzle_id)
    if not puzzle:
        return jsonify({'error': f'Puzzle {puzzle_id} not found'}), 404
        
    try:
        puzzle.solved = True
        db.session.commit()
        return jsonify({
            'status': 'success',
            'puzzle': puzzle.to_dict(),
            'message': f"Puzzle Node '{puzzle.name}' bypass verified."
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to record bypass: {str(e)}'}), 500

@app.route('/api/game-state/<player_name>/reset', methods=['POST'])
def reset_game(player_name):
    player = Player.query.filter_by(name=player_name).first()
    if not player:
        return jsonify({'error': f'Operative {player_name} not registered'}), 404
        
    try:
        # Reset player to start position
        player.x = 0
        player.y = 0
        player.steps_taken = 0
        
        # Reset all puzzles to unsolved
        puzzles = Puzzle.query.all()
        for p in puzzles:
            p.solved = False
            
        db.session.commit()
        return jsonify({
            'status': 'success',
            'message': 'Chamber simulation environment reset successfully.',
            'player': player.to_dict(),
            'puzzles': [p.to_dict() for p in puzzles]
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to reset simulation: {str(e)}'}), 500

# ==========================================
# Setup Database & seed puzzles
# ==========================================

def init_db():
    with app.app_context():
        db.create_all()
        
        # Seed default puzzles if empty
        if Puzzle.query.count() == 0:
            default_puzzles = [
                Puzzle(id='puz_1', name='Main Terminal', type='hex_match', solved=False, x=2, y=1),
                Puzzle(id='puz_2', name='Security Router', type='memory_matrix', solved=False, x=0, y=3),
                Puzzle(id='puz_3', name='Reactor Core', type='hex_match', solved=False, x=4, y=2)
            ]
            for p in default_puzzles:
                db.session.add(p)
            db.session.commit()
            print("Successfully initialized SQLite database and seeded puzzles.")

if __name__ == '__main__':
    init_db()
    # Runs flask server on port 5001
    app.run(host='0.0.0.0', port=5001, debug=True)
