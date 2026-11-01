# build_artifact.py: index.html（正本）からスマホ公開用のページ dist/breakthrough.html を作る
# 公開先の外枠（doctype/head/body）は公開時に付くので外し、タイトルと全画面表示用のCSSだけ足す
import re, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
s = src
for pat in [r'<!DOCTYPE html>\s*', r'<html[^>]*>\s*', r'<head>\s*', r'<meta charset="UTF-8">\s*', r'<meta name="viewport"[^>]*>\s*', r'<meta name="theme-color"[^>]*>\s*', r'</head>\s*', r'<body>\s*', r'</body>\s*', r'</html>\s*']:
    s, n = re.subn(pat, '', s, count=1); assert n == 1, pat
s, n = re.subn(r'<title>[^<]*</title>', '<title>D.O.P.A. - G.A.K.I.</title>', s, count=1); assert n == 1
s = s.replace('<style>\n', '<style>\n:root{color-scheme:dark;background:#3e4148}\ncanvas{position:fixed;left:0;top:0}\n', 1)
# v0.9.2: 襲来の群れの模型（assets/*.glb.txt）を埋め込む（公開ページでは別ファイルの読み込みに頼らない）
import glob
hd = {os.path.basename(f)[:-8]: open(f).read().strip() for f in sorted(glob.glob(os.path.join(ROOT, 'assets', '*.glb.txt')))}
if hd: s = s.replace('<script>window.SFX={', '<script>window.HORDE={' + ','.join(f'{k}:"{v}"' for k, v in hd.items()) + '};</script>\n<script>window.SFX={', 1)
out = os.path.join(ROOT, 'dist', 'breakthrough.html'); os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, 'w', encoding='utf-8').write(s); print(out, len(s.encode('utf-8')) // 1024, 'KB')
