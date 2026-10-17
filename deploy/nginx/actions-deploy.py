#!/usr/bin/python3
"""Root-owned, application-scoped SSH deployment endpoint. No shell evaluation."""
import hashlib
import json
import os
import re
import shutil
import signal
import subprocess
import sys
import tarfile
import time
from pathlib import Path, PurePosixPath

BASE = Path('/var/lib/llm-actions')
TRUSTED = Path('/usr/local/lib/llm-actions')
STATIC = Path('/srv/awesome-free-llm-apis-ir')
SERVICE = Path('/opt/persiantoolbox-discover/current')
NODE = Path('/usr/local/bin/persiantoolbox-discover-node')
UNIT = Path('/etc/systemd/system/persiantoolbox-discover.service')
MAX_UPLOAD = 128 * 1024 * 1024


def parse_command(command):
    parts = command.split()
    if len(parts) not in (2, 3) or parts[0] not in ('upload', 'publish', 'rollback'):
        raise ValueError('unsupported deployment command')
    if not re.fullmatch('[0-9a-f]{40}', parts[1]):
        raise ValueError('full revision required')
    if (parts[0] == 'publish') != (len(parts) == 3):
        raise ValueError('invalid deployment arguments')
    if len(parts) == 3 and not re.fullmatch('[0-9a-f]{64}', parts[2]):
        raise ValueError('SHA-256 required')
    return parts


def extract_bundle(archive, destination, revision, manifest):
    """Validate every member before extraction, including duplicates and links."""
    allowed = ('service/services/discover/', 'service/node_modules/simple-icons/',
               'service/deploy/discover/', 'service/.discover-runtime/')
    parents = {'site', 'service', 'service/services', 'service/node_modules',
               'service/deploy', 'service/.discover-runtime'}
    private = re.compile(r'(^|/)\.env(?:\.|$)|\.sqlite3(?:-|$)|\.(?:pem|key)$')
    with tarfile.open(archive, 'r:gz') as source:
        members, seen, total = [], set(), 0
        for entry in source:
            name = entry.name.rstrip('/')
            path = PurePosixPath(name)
            if (not name or '\\' in name or path.is_absolute() or '..' in path.parts
                    or '.' in path.parts or str(path) != name or name in seen
                    or not (entry.isfile() or entry.isdir()) or private.search(name)):
                raise ValueError('unsafe release member')
            permitted = name.startswith('site/') or name in ('service/package.json', 'service/package-lock.json') or any(name.startswith(p) or (entry.isdir() and name == p.rstrip('/')) for p in allowed)
            if not permitted and not (entry.isdir() and name in parents):
                raise ValueError('unexpected release member')
            seen.add(name)
            total += entry.size
            members.append(entry)
            if len(members) > 30000 or total > 768 * 1024 * 1024 or entry.size > MAX_UPLOAD:
                raise ValueError('release exceeds extraction limits')
        required = {'site/index.html', 'site/catalog.json', 'site/build-meta.json',
                    'service/services/discover/server.mjs', 'service/node_modules/simple-icons/package.json',
                    'service/deploy/discover/node-runtime-manifest.env'}
        if not required <= seen:
            raise ValueError('incomplete release')
        meta = json.load(source.extractfile('site/build-meta.json'))
        if meta.get('source_revision') != revision or type(meta.get('provider_count')) is not int or meta['provider_count'] < 1:
            raise ValueError('artifact revision or provider count mismatch')
        if source.extractfile('service/deploy/discover/node-runtime-manifest.env').read() != manifest:
            raise ValueError('runtime policy changed; operator bootstrap required')
        destination.mkdir(mode=0o700, parents=True, exist_ok=False)
        for entry in members:
            target = destination / entry.name.rstrip('/')
            if entry.isdir():
                target.mkdir(mode=0o755, parents=True, exist_ok=True)
            else:
                target.parent.mkdir(mode=0o755, parents=True, exist_ok=True)
                with source.extractfile(entry) as data, target.open('xb') as output:
                    shutil.copyfileobj(data, output)
                target.chmod(0o644)
        # Root keeps the staging container private, while archived site trees
        # must remain traversable by Nginx after atomic publication.
        for directory in destination.rglob('*'):
            if directory.is_dir():
                directory.chmod(0o755)


def upload(revision):
    signal.alarm(300)
    target = BASE / (revision + '.tar.gz')
    temporary = BASE / (revision + '.upload')
    digest, size = hashlib.sha256(), 0
    try:
        with temporary.open('wb') as output:
            while chunk := sys.stdin.buffer.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_UPLOAD:
                    raise ValueError('upload exceeds limit')
                output.write(chunk)
                digest.update(chunk)
        if not size:
            raise ValueError('empty release')
        os.replace(temporary, target)
    finally:
        temporary.unlink(missing_ok=True)
    print(digest.hexdigest())


def run(args, log, **kwargs):
    subprocess.run(args, check=True, stdout=log, stderr=log, timeout=180, **kwargs)


def link(target, destination, allowed):
    resolved = Path(target).resolve(strict=True)
    if not any(resolved.is_relative_to(Path(prefix)) for prefix in allowed):
        raise ValueError('rollback target is outside application paths')
    temporary = destination.with_name(destination.name + '.actions-next')
    temporary.unlink(missing_ok=True)
    temporary.symlink_to(resolved)
    os.replace(temporary, destination)


def verify_restored(state, log):
    previous = json.loads((Path(state['static']) / 'build-meta.json').read_text())['source_revision']
    for attempt in range(30):
        try:
            run(['systemctl', 'is-active', '--quiet', 'persiantoolbox-discover'], log)
            run(['curl', '--fail', '--silent', '--show-error', '--max-time', '3',
                 'http://127.0.0.1:8003/discover/api/health'], log)
            public = subprocess.check_output(['curl', '--fail', '--silent', '--show-error', '--max-time', '3',
                '--resolve', 'llm.persiantoolbox.ir:443:127.0.0.1',
                'https://llm.persiantoolbox.ir/build-meta.json'], stderr=log, timeout=5)
            if json.loads(public)['source_revision'] != previous:
                raise ValueError('restored canonical revision mismatch')
            return
        except (subprocess.SubprocessError, ValueError, KeyError):
            if attempt == 29:
                raise
            time.sleep(1)


def rollback(revision, log):
    # A disconnected runner may retry while the first rollback is still running.
    handlers = {sig: signal.signal(sig, signal.SIG_IGN) for sig in (signal.SIGHUP, signal.SIGTERM)}
    try:
        restore_transaction(revision, log)
    finally:
        for sig, handler in handlers.items():
            signal.signal(sig, handler)


def restore_transaction(revision, log):
    if not (BASE / 'state.json').exists():
        return  # Publication never reached its first mutation.
    state = json.loads((BASE / 'state.json').read_text())
    if state['revision'] != revision:
        raise ValueError('rollback does not own the active transaction')
    current = (STATIC / 'current').resolve()
    expected = json.loads((current / 'build-meta.json').read_text())['source_revision']
    if expected != revision and str(current) != state['static']:
        raise ValueError('a newer publication must not be rolled back')
    if state['status'] == 'rolled-back':
        verify_restored(state, log)
        return
    run(['systemctl', 'stop', 'persiantoolbox-discover'], log)
    link(state['service'], SERVICE, ['/opt/persiantoolbox-discover/releases'])
    link(state['node'], NODE, ['/usr/local/bin'])
    UNIT.write_bytes((BASE / 'previous-unit').read_bytes())
    run(['systemctl', 'daemon-reload'], log)
    run(['systemctl', 'start', 'persiantoolbox-discover'], log)
    link(state['static'], STATIC / 'current', [str(STATIC / 'releases')])
    verify_restored(state, log)
    state['status'] = 'rolled-back'
    (BASE / 'state.json').write_text(json.dumps(state))


def publish(revision, expected_digest, log):
    import pwd  # Linux service identity; archive validation is platform-independent.
    archive = BASE / (revision + '.tar.gz')
    if hashlib.sha256(archive.read_bytes()).hexdigest() != expected_digest:
        raise ValueError('release transport checksum mismatch')
    # Never execute repository-supplied shell, unit, or runtime-policy files as root.
    work = BASE / ('work-' + revision)
    if work.exists():
        shutil.rmtree(work)
    extract_bundle(archive, work, revision, (TRUSTED / 'discover/node-runtime-manifest.env').read_bytes())
    shutil.copytree(TRUSTED / 'discover', work / 'service/deploy/discover', dirs_exist_ok=True)
    run(['nginx', '-t'], log)
    run(['systemctl', 'is-active', '--quiet', 'nginx', 'persiantoolbox-discover'], log)
    state = {'revision': revision, 'status': 'starting', 'static': str((STATIC / 'current').resolve(strict=True)),
             'service': str(SERVICE.resolve(strict=True)), 'node': str(NODE.resolve(strict=True))}
    # Validate all restoration targets before the first production mutation.
    if not Path(state['static']).is_relative_to(STATIC / 'releases') or not Path(state['service']).is_relative_to('/opt/persiantoolbox-discover/releases') or not Path(state['node']).name.startswith('persiantoolbox-discover-node-'):
        raise ValueError('unexpected existing release state')
    (BASE / 'previous-unit').write_bytes(UNIT.read_bytes())
    (BASE / 'state.json').write_text(json.dumps(state))
    try:
        # Installer copies are operator-installed and root-owned, not uploaded code.
        service_id = revision + '-actions-' + expected_digest[:12]
        if not (Path('/opt/persiantoolbox-discover/releases') / service_id).exists():
            run(['bash', str(TRUSTED / 'discover/install-discover-service.sh'), str(work / 'service'), service_id], log)
        elif SERVICE.resolve().name != service_id:
            raise ValueError('existing inactive service release; operator review required')
        listeners = subprocess.check_output(['ss', '-ltnH', 'sport = :8003'], text=True).splitlines()
        if len(listeners) != 1 or listeners[0].split()[3] != '127.0.0.1:8003':
            raise ValueError('Discover listener must remain loopback-only')
        if not Path('/var/lib/persiantoolbox-discover/discover.sqlite3').is_file() or any(SERVICE.resolve().rglob('*.sqlite3')):
            raise ValueError('SQLite must persist outside the service release')
        run(['curl', '--fail', '--silent', '--show-error', '--max-time', '15', '--resolve',
             'llm.persiantoolbox.ir:443:127.0.0.1', 'https://llm.persiantoolbox.ir/discover/api/health'], log)
        for route in ('/discover/admin/', '/discover/api/admin/tools'):
            status = subprocess.check_output(['curl', '--silent', '--show-error', '--max-time', '15', '--resolve',
                'llm.persiantoolbox.ir:443:127.0.0.1', '--output', '/dev/null', '--write-out', '%{http_code}',
                'https://llm.persiantoolbox.ir' + route], text=True)
            if status != '401':
                raise ValueError('administrator boundary is not protected')
        credentials = dict(line.split('=', 1) for line in Path('/etc/persiantoolbox-discover/admin-owner-credentials').read_text().splitlines())
        env = dict(os.environ, DISCOVER_BASE_URL='https://llm.persiantoolbox.ir/discover',
                   DISCOVER_ADMIN_USER=credentials['username'], DISCOVER_ADMIN_PASSWORD=credentials['password'], GITHUB_SHA=revision)
        account = pwd.getpwnam('persiantoolbox-discover')
        run([str(NODE), str(TRUSTED / 'check-discover-live-crud.mjs')], log,
            env=env, user=account.pw_uid, group=account.pw_gid, extra_groups=[])
        static_archive = work / 'site.tar.gz'
        run(['tar', '-C', str(work / 'site'), '-czf', str(static_archive), '.'], log)
        run(['bash', str(TRUSTED / 'remote-release.sh'), str(STATIC), str(static_archive), revision], log)
        state['status'] = 'published'
        (BASE / 'state.json').write_text(json.dumps(state))
    except Exception:
        rollback(revision, log)
        raise
    finally:
        if work.exists():
            shutil.rmtree(work)
        archive.unlink(missing_ok=True)
    print('Canonical release activated; authenticated Discover CRUD passed.')


def main():
    import fcntl  # Deployment locking is supported only on the Linux target.
    if os.geteuid() != 0:
        raise ValueError('privileged application endpoint required')
    command = os.environ.get('SSH_ORIGINAL_COMMAND') if len(sys.argv) == 1 else ' '.join(sys.argv[1:])
    args = parse_command(command or '')
    os.umask(0o077)
    def interrupted(signum, frame):
        raise InterruptedError('deployment connection interrupted')
    for sig in (signal.SIGHUP, signal.SIGTERM):
        signal.signal(sig, interrupted)
    BASE.mkdir(mode=0o700, parents=True, exist_ok=True)
    with (BASE / 'deploy.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        if args[0] == 'upload':
            upload(args[1])
        else:
            with (BASE / 'deployment.log').open('a') as log:
                if args[0] == 'publish':
                    publish(args[1], args[2], log)
                else:
                    rollback(args[1], log)
                    print('Previous application release restored.')


if __name__ == '__main__':
    try:
        main()
    except Exception:
        print('Application deployment rejected or failed; protected operator diagnostics are available.', file=sys.stderr)
        sys.exit(1)
