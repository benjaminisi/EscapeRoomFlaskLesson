from app import create_app
from app.services.admin_service import AdminService

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        # Ensure database is initialized with default data if empty
        # We don't force rebuild here to preserve existing data between restarts
        AdminService.init_database(force=False)
        print("Successfully ensured SQLite database is initialized.")
        
    app.run(host='0.0.0.0', port=5001, debug=True)
