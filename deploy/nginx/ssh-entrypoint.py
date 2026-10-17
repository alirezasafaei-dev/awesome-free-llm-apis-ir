#!/usr/bin/python3
"""Forced-command bridge: fixed sudo program, validated arguments, no shell."""
import importlib.util
import os
import subprocess
import sys

spec = importlib.util.spec_from_file_location('actions_deploy', '/usr/local/lib/llm-actions/actions-deploy.py')
helper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)
try:
    args = helper.parse_command(os.environ.get('SSH_ORIGINAL_COMMAND', ''))
except ValueError:
    print('Only application deployment commands are permitted.', file=sys.stderr)
    sys.exit(64)
os.execv('/usr/bin/sudo', ['sudo', '-n', '/usr/local/lib/llm-actions/actions-deploy.py', *args])
