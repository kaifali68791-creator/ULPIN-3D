# -*- coding: utf-8 -*-
"""Structural sanity check for the add-on i18n.js (no JS parser available)."""
import io, re, sys

path = r"c:\Users\lenovo\OneDrive\Desktop\SIH26011\js\i18n.js"
src = io.open(path, encoding="utf-8").read()

# ---------- 1) delimiter balance, skipping strings/comments ----------
i, n = 0, len(src)
state = "code"
stack = []
pairs = {")": "(", "]": "[", "}": "{"}
opens = set("([{")
closes = set(")]}")
errors = []
while i < n:
    ch = src[i]
    if state == "code":
        if ch == "/" and i + 1 < n and src[i + 1] == "/":
            state = "lc"; i += 2; continue
        if ch == "/" and i + 1 < n and src[i + 1] == "*":
            state = "bc"; i += 2; continue
        if ch == '"':
            state = "dq"; i += 1; continue
        if ch == "'":
            state = "sq"; i += 1; continue
        if ch in opens:
            stack.append(ch)
        elif ch in closes:
            if not stack or stack[-1] != pairs[ch]:
                errors.append("mismatch at offset %d: %r" % (i, ch))
            else:
                stack.pop()
        i += 1
    elif state == "lc":
        if ch == "\n":
            state = "code"
        i += 1
    elif state == "bc":
        if ch == "*" and i + 1 < n and src[i + 1] == "/":
            state = "code"; i += 2; continue
        i += 1
    elif state == "dq":
        if ch == "\\":
            i += 2; continue
        if ch == '"':
            state = "code"
        i += 1
    elif state == "sq":
        if ch == "\\":
            i += 2; continue
        if ch == "'":
            state = "code"
        i += 1

print("== delimiter scan ==")
print("end state:", state)
print("unbalanced errors:", errors if errors else "none")
print("leftover stack:", stack if stack else "none")

# ---------- 2) LANGS count ----------
lm = re.search(r"var\s+LANGS\s*=\s*\{(.*?)\};", src, re.S)
langs_lst = re.findall(r"\b(en|hi|te|ta)\s*:\s*\{", lm.group(1)) if lm else []
print("== LANGS ==")
print("language entries:", langs_lst)

# ---------- 3) per-language dictionary keys ----------
dm = src.find("var DICT = {")
dt = src.find("};", dm) if dm >= 0 else -1
print("== DICT ==")
print("DICT present:", dm >= 0 and dt >= 0)
ok = True
langs = {}
if dm >= 0 and dt >= 0:
    body = src[dm + len("var DICT = {") : dt + 1]
    pos = 0
    for name in ("te", "hi", "ta"):
        hdr = body.find(name + ": {", 0 if pos == 0 else pos)
        if hdr < 0:
            ok = False
            print("MISSING dict header for", name)
            continue
        head = hdr + len(name) + 2
        close = body.find("\n  },", head)
        if close < 0:
            close = body.find("\n  }", head)  # last member (ta)
        if close < 0:
            ok = False
            print("MISSING close for", name)
            continue
        block = body[head:close]
        p = re.findall(r'"((?:[^"\\]|\\.)*)"\s*:\s*"((?:[^"\\]|\\.)*)"', block)
        keys = [k for k, v in p]
        dups = sorted({k for k in keys if keys.count(k) > 1})
        langs[name] = set(keys)
        print(name, "entries:", len(keys), "| dups:", dups if dups else "none")
        pos = close + 1

ref = None
for name in ("te", "hi", "ta"):
    if name not in langs:
        continue
    if ref is None:
        ref = set(langs[name])
    else:
        only_here = sorted(langs[name] - grassland(ref)) if False else sorted(
            langs[name] - ref
        )
        missing = sorted(ref - langs[name])
        if only_here or missing:
            ok = False
            print("  KEY MISMATCH vs te:", "extra:", only_here, "missing:", missing)

print("== overall dict structure ok:", ok)

# ---------- 4) leftover placeholders ----------
for pat in ("/*@@*/", "@@ENGINE@@"):
    print("leftover placeholder", repr(pat), ":", pat in src)