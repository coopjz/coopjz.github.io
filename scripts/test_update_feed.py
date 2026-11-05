import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import update_feed as feed

class FeedTests(unittest.TestCase):
    def test_rss_filters_and_sanitizes(self):
        xml = b'''<rss><channel><item><title>Robot navigation</title><link>http://arxiv.org/abs/1234.5678v2</link><description>&lt;b&gt;An agent&lt;/b&gt; &amp;amp; robot</description><pubDate>Wed, 04 Nov 2026 10:00:00 GMT</pubDate></item><item><title>Cooking</title><link>https://example.com</link><pubDate>Wed, 04 Nov 2026 10:00:00 GMT</pubDate></item></channel></rss>'''
        items = feed.parse_rss(xml, 'arXiv', 'paper')
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]['url'], 'https://arxiv.org/abs/1234.5678')
        self.assertEqual(items[0]['summary'], 'An agent & robot')
    def test_atom(self):
        xml = b'''<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Robot</title><link href="https://example.com/paper"/><published>2026-11-04T10:00:00Z</published><summary>navigation</summary></entry></feed>'''
        self.assertEqual(len(feed.parse_rss(xml, 'test', 'paper')), 1)
    def test_unsafe_url_rejected(self):
        xml = b'<rss><item><title>Robot</title><link>javascript:alert(1)</link><pubDate>2026-11-04</pubDate></item></rss>'
        self.assertEqual(feed.parse_rss(xml, 'test', 'paper'), [])
    def test_failed_sources_keep_old_items(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / 'feed.json'
            output.write_text(json.dumps({'items': [{'url':'https://example.com/old', 'source':'arXiv cs.RO', 'category':'paper', 'publishedAt':'2026-11-01'}]}))
            with patch.object(feed, 'OUTPUT', output), patch.object(feed, 'read_url', side_effect=TimeoutError):
                feed.refresh()
            result = json.loads(output.read_text())
            self.assertEqual(len(result['items']), 1)
            self.assertTrue(all(source['status'] == 'stale' for source in result['sources']))

if __name__ == '__main__':
    unittest.main()
