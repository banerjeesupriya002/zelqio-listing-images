#!/usr/bin/env python3
"""Make small WebP copies of every product image listed in products.json.
Run from the repo root:  python3 make-thumbs.py
Writes t/600/<folder>__<file>.webp (shop grid) and t/1000/<folder>__<file>.webp (product sheet).
Skips files that already exist. The shop falls back to the original image if a thumbnail is missing."""
import json, os, re, sys
from PIL import Image
PRE = re.compile(r'^https://raw\.githubusercontent\.com/[^/]+/[^/]+/main/')
SIZES = (600, 1000)
j = json.load(open('products.json'))
urls = []
for p in j['products']:
    for u in [p.get('image')] + list(p.get('images') or []):
        if u and u not in urls: urls.append(u)
made = 0
for u in urls:
    if not PRE.match(u): continue
    rel = PRE.sub('', u)
    from urllib.parse import unquote
    rel = unquote(rel)
    if not os.path.exists(rel): print('missing', rel); continue
    base = os.path.splitext(rel)[0]
    im = None
    for w in SIZES:
        out = f't/{w}/{base.replace('/', '__')}.webp'
        if os.path.exists(out): continue
        if im is None: im = Image.open(rel).convert('RGB')
        r = im.copy(); r.thumbnail((w, w), Image.LANCZOS)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        r.save(out, 'WEBP', quality=78, method=6); made += 1
print('made', made, 'thumbnails from', len(urls), 'images')
