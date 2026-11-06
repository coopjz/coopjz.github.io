import copy
import json
from pathlib import Path
import tempfile
import unittest
from prepare_feed import validate, stage

FIXTURE = Path(__file__).parent.parent / 'tests/fixtures/reviewed-feed.json'

class PackageTests(unittest.TestCase):
    def setUp(self):
        self.data = json.loads(FIXTURE.read_text())
    def test_valid(self): validate(self.data)
    def test_month_precision_preserved(self):
        self.data['items'][0]['publishedAt'] = '2026-10'
        validate(self.data)
        self.assertEqual(self.data['items'][0]['publishedAt'], '2026-10')
    def test_unexpected_private_metadata_refused(self):
        self.data['items'][0]['private_notes'] = 'not for publication'
        with self.assertRaises(ValueError): validate(self.data)
    def test_empty_refused(self):
        self.data['items'] = []
        with self.assertRaises(ValueError): validate(self.data)
    def test_missing_review_refused(self):
        self.data['review']['status'] = 'draft'
        with self.assertRaises(ValueError): validate(self.data)
    def test_unsafe_link_refused(self):
        for url in ['javascript:alert(1)', 'https://localhost/x', 'https://127.0.0.1/x', 'https://user:pass@example.com']:
            with self.subTest(url=url):
                data = copy.deepcopy(self.data); data['items'][0]['url'] = url
                with self.assertRaises(ValueError): validate(data)
    def test_missing_evidence_refused(self):
        self.data['items'][0]['evidenceUrls'] = []
        with self.assertRaises(ValueError): validate(self.data)
    def test_duplicate_versions_refused(self):
        item = copy.deepcopy(self.data['items'][0]); item['id'] = 'duplicate'; item['url'] += 'v2'; item['evidenceUrls'] = [item['url']]
        self.data['items'].append(item)
        with self.assertRaises(ValueError): validate(self.data)
    def test_stale_package_refused(self):
        previous = copy.deepcopy(self.data); previous['updatedAt'] = '2026-11-05T12:00:00Z'
        with self.assertRaises(ValueError): validate(self.data, previous)
    def test_failed_staging_keeps_previous_bytes(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp)/'feed.json'; output.write_text('previous version')
            candidate = Path(tmp)/'candidate.json'; self.data['items']=[]; candidate.write_text(json.dumps(self.data))
            with self.assertRaises(ValueError): stage(candidate, output)
            self.assertEqual(output.read_text(), 'previous version')
    def test_stage_valid_package(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp)/'feed.json'; stage(FIXTURE, output)
            self.assertEqual(json.loads(output.read_text()), self.data)

if __name__ == '__main__': unittest.main()
