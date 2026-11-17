#!/usr/bin/env python3
"""Uso: python3 make-qr.py URL_PUBLICADA [codigo_clinica] [--demo]  -> qr.png / qr.svg"""
import sys, segno
args = [a for a in sys.argv[1:] if not a.startswith("--")]
url = args[0]
q = []
if len(args) > 1: q.append("c=" + args[1])
if "--demo" in sys.argv: q.append("demo=1")
if q: url += ("&" if "?" in url else "?") + "&".join(q)
qr = segno.make(url, error="m")
qr.save("qr.png", scale=12, border=4); qr.save("qr.svg", scale=12, border=4)
print("QR generado para:", url)
