import os
import xml.etree.ElementTree as ET
import urllib.request
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def get_feed_data():
    try:
        req = urllib.request.Request(
            FEED_URL,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            xml_data = response.read()
        
        root = ET.fromstring(xml_data)
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        entries = []
        for entry in root.findall('atom:entry', ns):
            title = entry.find('atom:title', ns)
            updated = entry.find('atom:updated', ns)
            link_elem = entry.find('atom:link[@rel="alternate"]', ns)
            if link_elem is None:
                link_elem = entry.find('atom:link', ns)
            content = entry.find('atom:content', ns)
            
            entries.append({
                'title': title.text if title is not None else '',
                'updated': updated.text if updated is not None else '',
                'link': link_elem.get('href') if link_elem is not None else '',
                'content': content.text if content is not None else ''
            })
        return entries, None
    except Exception as e:
        return [], str(e)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def releases():
    entries, error = get_feed_data()
    if error:
        return jsonify({'error': error, 'entries': []}), 500
    return jsonify({'entries': entries})

if __name__ == '__main__':
    # Get port from environment or default to 5000
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
