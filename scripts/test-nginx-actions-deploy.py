#!/usr/bin/env python3
"""Deployment security regressions; no SSH, sudo or production mutations."""
import importlib.util
import io
import json
import tarfile
import tempfile
import unittest
import hashlib
import os
from unittest.mock import patch
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = (ROOT / '.github/workflows/deploy-vps.yml').read_text()
HELPER = ROOT / 'deploy/nginx/actions-deploy.py'


class ArchiveSafety(unittest.TestCase):
    def setUp(self):
        self.assertTrue(HELPER.is_file(), 'Restricted Nginx Actions deployment helper is missing')
        spec = importlib.util.spec_from_file_location('actions_deploy', HELPER)
        self.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.module)
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def archive(self, items):
        archive = self.root / 'bundle.tar.gz'
        with tarfile.open(archive, 'w:gz') as tar:
            for name, value in items:
                entry = tarfile.TarInfo(name)
                if value is None:
                    entry.type = tarfile.SYMTYPE
                    entry.linkname = '/etc/passwd'
                    tar.addfile(entry)
                else:
                    entry.size = len(value)
                    tar.addfile(entry, io.BytesIO(value))
        return archive

    def files(self, revision='a' * 40):
        return [('site/index.html', b'<!doctype html>safe'),
                ('site/catalog.json', b'{}'),
                ('site/build-meta.json', json.dumps({'source_revision': revision, 'provider_count': 1}).encode()),
                ('service/services/discover/server.mjs', b'// service'),
                ('service/node_modules/simple-icons/package.json', b'{}'),
                ('service/deploy/discover/node-runtime-manifest.env', b'pinned')]

    def test_valid_bundle_and_exact_revision(self):
        archive = self.archive(self.files())
        self.module.extract_bundle(archive, self.root / 'out', 'a' * 40, b'pinned')
        self.assertTrue((self.root / 'out/site/index.html').is_file())

    def test_rejects_traversal_links_duplicates_and_private_files(self):
        for name, value in [('../escape', b'x'), ('/etc/passwd', b'x'), ('site/link', None), ('site/.env', b'x'), ('other/payload', b'x'), ('site/index.html', b'duplicate')]:
            archive = self.archive(self.files() + [(name, value)])
            with self.assertRaises(ValueError):
                self.module.extract_bundle(archive, self.root / 'out', 'a' * 40, b'pinned')

    def test_rejects_revision_and_privileged_runtime_drift(self):
        archive = self.archive(self.files())
        for sha, manifest in [('b' * 40, b'pinned'), ('a' * 40, b'unreviewed')]:
            with self.assertRaises(ValueError):
                self.module.extract_bundle(archive, self.root / 'out', sha, manifest)

    def test_rejects_shell_and_unknown_protocol_commands(self):
        for command in ['sh', 'publish a;id', 'upload ' + 'a' * 39, 'rollback ' + 'a' * 40 + ' extra', 'publish ' + 'a' * 40 + ' $(id)']:
            with self.assertRaises(ValueError):
                self.module.parse_command(command)
        self.assertEqual(self.module.parse_command('upload ' + 'a' * 40), ['upload', 'a' * 40])


class WorkflowSafety(unittest.TestCase):
    def test_nginx_canonical_release_retires_caddy_and_mirror(self):
        self.assertNotIn('upgrade-caddy.sh', WORKFLOW, 'Canonical Actions must not upgrade Caddy on the shared Nginx server')
        self.assertNotIn('deploy-iran:', WORKFLOW)
        self.assertNotIn('ir.llm.persiantoolbox.ir', WORKFLOW)
        self.assertIn('StrictHostKeyChecking=yes', WORKFLOW)
        self.assertIn('cancel-in-progress: false', WORKFLOW)
        self.assertIn('production-global', WORKFLOW)


@unittest.skipUnless(os.name == 'posix', 'systemd, POSIX signals and release symlinks are verified by Linux CI')
class RollbackSafety(ArchiveSafety):
    def setUp(self):
        super().setUp()
        self.module.BASE = self.root
        self.module.STATIC = self.root / 'static'
        old = self.module.STATIC / 'releases/old'
        old.mkdir(parents=True)
        (old / 'build-meta.json').write_text(json.dumps({'source_revision': 'b' * 40}))
        (self.module.STATIC / 'current').symlink_to(old)
        self.state = {'revision': 'a' * 40, 'status': 'starting', 'static': str(old), 'service': '/opt/persiantoolbox-discover/releases/old', 'node': '/usr/local/bin/persiantoolbox-discover-node-old'}
        (self.root / 'state.json').write_text(json.dumps(self.state))
        (self.root / 'previous-unit').write_bytes(b'unit')
        self.module.UNIT = self.root / 'unit'

    def test_failed_health_never_claims_restored(self):
        with patch.object(self.module, 'run'), patch.object(self.module, 'link'), patch.object(self.module, 'verify_restored', side_effect=ValueError('unhealthy')):
            with self.assertRaises(ValueError):
                self.module.rollback('a' * 40, io.StringIO())
        self.assertEqual(json.loads((self.root / 'state.json').read_text())['status'], 'starting')

    def test_success_is_verified_and_repeated_rollback_does_not_restart(self):
        with patch.object(self.module, 'run') as run, patch.object(self.module, 'link'), patch.object(self.module, 'verify_restored') as verify:
            self.module.rollback('a' * 40, io.StringIO())
            self.assertEqual(verify.call_count, 1)
            run.reset_mock()
            self.module.rollback('a' * 40, io.StringIO())
            run.assert_not_called()
            self.assertEqual(verify.call_count, 2)

    def test_foreign_revision_cannot_restore(self):
        with patch.object(self.module, 'run') as run:
            with self.assertRaises(ValueError):
                self.module.rollback('c' * 40, io.StringIO())
            run.assert_not_called()

    def test_canonical_revision_mismatch_fails_bounded_verification(self):
        with patch.object(self.module, 'run'), patch.object(self.module.time, 'sleep'), patch.object(self.module.subprocess, 'check_output', return_value=b'{"source_revision":"wrong"}') as fetch:
            with self.assertRaises(ValueError):
                self.module.verify_restored(self.state, io.StringIO())
            self.assertEqual(fetch.call_count, 30)


if __name__ == '__main__':
    unittest.main()
