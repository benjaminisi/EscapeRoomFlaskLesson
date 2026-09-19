import os
import time
import threading

def init_debugger_path_mappings():
    """Configure pydevd path mappings so breakpoints in host files match container /app."""
    try:
        project_root = os.environ.get('LOCAL_PROJECT_ROOT', '/Users/david/Projects/EscapeRoom')
        from pydevd_file_utils import setup_client_server_paths
        setup_client_server_paths([
            (project_root, '/app'),
            (f"{project_root}/backend", '/app/backend')
        ])
    except Exception:
        pass

def is_debugger_connected():
    """Check if pydevd is currently connected to an active debug server."""
    try:
        import pydevd
        return bool(getattr(pydevd, 'connected', False))
    except Exception:
        return False

def attach_to_debugger(suspend=False, verbose=True):
    """Attempt to attach pydevd to the IntelliJ Python Debug Server."""
    if is_debugger_connected():
        return True

    debug_host = os.environ.get('DEBUGGER_HOST', 'host.docker.internal')
    debug_port = int(os.environ.get('DEBUGGER_PORT', 5678))

    init_debugger_path_mappings()

    try:
        import pydevd_pycharm
        pydevd_pycharm.settrace(
            host=debug_host,
            port=debug_port,
            stdout_to_server=True,
            stderr_to_server=True,
            suspend=suspend,
            trace_only_current_thread=False,
            patch_multiprocessing=True
        )
        print(f"✔ Connected to IntelliJ Python Debugger at {debug_host}:{debug_port}", flush=True)
        time.sleep(0.5)  # Allow IntelliJ time to push breakpoints over the wire
        return True
    except ConnectionRefusedError:
        if verbose:
            print(f"IntelliJ Debugger not listening at {debug_host}:{debug_port} (auto-reconnect active)", flush=True)
        return False
    except Exception as e:
        if verbose:
            print(f"IntelliJ Debugger connect failed: {e}", flush=True)
        return False

def start_debugger_background_listener():
    """Start a daemon thread that periodically tries to attach when IntelliJ starts listening."""
    def _poll_and_connect():
        while not is_debugger_connected():
            time.sleep(2)
            try:
                if attach_to_debugger(suspend=False, verbose=False):
                    break
            except Exception:
                pass

    t = threading.Thread(target=_poll_and_connect, name="DebuggerAutoConnector", daemon=True)
    t.start()
