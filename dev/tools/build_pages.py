# build_pages.py: index.html（正本）から GitHub Pages 用の dist/pages/index.html を作る（v1.0.30）
# 群れの模型を埋め込み、server/url.txt があれば記録サーバーのURLを CFG.net.url に入れる（アーティファクト版はURL空のまま）
import re, os, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
s, n = re.subn(r'<title>[^<]*</title>', '<title>D.O.P.A. - G.A.K.I.</title>', s, count=1); assert n == 1
s = s.replace('<meta name="theme-color" content="#3e4148">', '<meta name="theme-color" content="#3e4148">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-title" content="DOPA-GAKI">', 1)
hd = {os.path.basename(f)[:-8]: open(f).read().strip() for f in sorted(glob.glob(os.path.join(ROOT, 'assets', '*.glb.txt')))}
if hd: s = s.replace('<script>window.SFX={', '<script>window.HORDE={' + ','.join(f'{k}:"{v}"' for k, v in hd.items()) + '};</script>\n<script>window.SFX={', 1)
uf = os.path.join(ROOT, 'server', 'url.txt')
if os.path.exists(uf):
    url = open(uf).read().strip(); assert url.startswith('https://script.google.com/'), url
    s, n = re.subn(r"net: \{ url: ''", "net: { url: '" + url + "'", s, count=1); assert n == 1
out = os.path.join(ROOT, 'dist', 'pages', 'index.html'); os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, 'w', encoding='utf-8').write(s); print(out, len(s.encode('utf-8')) // 1024, 'KB')
