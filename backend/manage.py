#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'petrofinance_backend.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    # Suppress harmless Broken pipe noise when clients disconnect early
    try:
        from django.core.servers import basehttp
        _orig_log_error = basehttp.WSGIRequestHandler.log_error
        def _quiet_log_error(self, format, *args):
            msg = format % args if args else format
            if "Broken pipe" in str(msg) or "connection was aborted" in str(msg).lower():
                return
            _orig_log_error(self, format, *args)
        basehttp.WSGIRequestHandler.log_error = _quiet_log_error
    except Exception:
        pass

    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
