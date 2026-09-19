import os

# Connect to IntelliJ Remote Debug Server if enabled
if os.environ.get('ENABLE_INTELLIJ_DEBUG') == '1' and (os.environ.get('WERKZEUG_RUN_MAIN') == 'true' or os.environ.get('FLASK_DEBUG') != '1'):
    try:
        # Pre-configure pydevd path mappings so breakpoints in local files map to container /app
        project_root = os.environ.get('LOCAL_PROJECT_ROOT', '/Users/david/Projects/EscapeRoom')
        from pydevd_file_utils import setup_client_server_paths
        setup_client_server_paths([
            (project_root, '/app'),
            (f"{project_root}/backend", '/app/backend')
        ])

        import pydevd_pycharm
        debug_host = os.environ.get('DEBUGGER_HOST', 'host.docker.internal')
        debug_port = int(os.environ.get('DEBUGGER_PORT', 5678))
        suspend_flag = os.environ.get('DEBUGGER_SUSPEND', '0') == '1'

        pydevd_pycharm.settrace(
            host=debug_host,
            port=debug_port,
            stdout_to_server=True,
            stderr_to_server=True,
            suspend=suspend_flag,
            trace_only_current_thread=False,
            patch_multiprocessing=True
        )
        print(f"✔ Connected to IntelliJ Python Debugger at {debug_host}:{debug_port}", flush=True)
        import time
        time.sleep(0.5)  # Allow IntelliJ time to push breakpoints over the wire before app code runs
    except Exception as e:
        print(f"IntelliJ Debugger skipped or unavailable: {e}", flush=True)

from app import create_app
from app.services.admin_service import AdminService

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        # Ensure database is initialized with default data if empty
        # We don't force rebuild here to preserve existing data between restarts
        AdminService.init_database(force=False)
        print("Successfully ensured MySQL database is initialized.")
        
    app.run(host='0.0.0.0', port=5001, debug=True)
