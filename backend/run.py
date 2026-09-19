import os

from app.debugger import attach_to_debugger, start_debugger_background_listener, is_debugger_connected

# Connect to IntelliJ Remote Debug Server if enabled
if os.environ.get('ENABLE_INTELLIJ_DEBUG') == '1' and (os.environ.get('WERKZEUG_RUN_MAIN') == 'true' or os.environ.get('FLASK_DEBUG') != '1'):
    suspend_flag = os.environ.get('DEBUGGER_SUSPEND', '0') == '1'
    if not attach_to_debugger(suspend=suspend_flag, verbose=True):
        start_debugger_background_listener()

from app import create_app
from app.services.admin_service import AdminService

app = create_app()

if os.environ.get('ENABLE_INTELLIJ_DEBUG') == '1':
    @app.before_request
    def _auto_attach_debugger():
        if not is_debugger_connected():
            attach_to_debugger(suspend=False, verbose=False)

if __name__ == '__main__':
    with app.app_context():
        # Ensure database is initialized with default data if empty
        # We don't force rebuild here to preserve existing data between restarts
        AdminService.init_database(force=False)
        print("Successfully ensured MySQL database is initialized.")
        
    app.run(host='0.0.0.0', port=5001, debug=True)
