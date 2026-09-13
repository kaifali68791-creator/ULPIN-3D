# -*- coding: utf-8 -*-
"""
Generator: js/lgd-villages/villages-<stateCode>.js from the official LGD
village CSV (data.gov.in LGD, snapshot dated 2026-07-02).

Usage:
  python _gen_lgd_villages.py [path-to-zip-or-csv]

Default source ZIP:
  C:/Users/lenovo/Downloads/info 21838- Dataful.zip
  member: list-of-states-districts-sub-districts-and-villages-along-with-their-lgd-codes-as-of-2-july-2026.csv

Behaviour (additive only):
  * Reads the uploaded CSV and the CURRENT js/lgd-data.js hierarchy.
  * Attaches ONLY villages whose (state_code, district_code, sub-district_code)
    parent matches js/lgd-data.js EXACTLY (string equality, leading zeroes kept).
  * Writes/regenerates js/lgd-villages/villages-<stateCode>.js chunk files.
  * Writes js/lgd-villages/README.md with counts and policy.
  * NEVER fabricates names/codes; incompatible parents are left isolated.
"""
import zipfile, csv, re, os, json, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
LGDJS = os.path.join(ROOT, "js", "lgd-data.js")
OUT_DIR = os.path.join(ROOT, "js", "lgd-villages")
DEFAULT_ZIP = r"C:\Users\lenovo\Downloads\info 21838- Dataful.zip"
CSV_NAME = "list-of-states-districts-sub-districts-and-villages-along-with-their-lgd-codes-as-of-2-july-2026.csv"
SNAPSHOT = "2026-07-02"


def read_uploaded_rows(src):
    src = src or DEFAULT_ZIP
    if src.lower().endswith(".zip"):
        z = zipfile.ZipFile(src)
        raw = z.read(CSV_NAME)
    else:
        with open(src, "rb") as f:
            raw = f.read()
    txt = raw.decode("utf-8-sig", errors="replace")
    rows = list(csv.reader(txt.splitlines()))
    out = []
    for r in rows[1:]:
        if len(r) >= 8:
            out.append({
                "state_code": r[0].strip(),
                "state_name": r[1].strip(),
                "district_code": r[2].strip(),
                "district_name": r[3].strip(),
                "subdist_code": r[4].strip(),
                "subdist_name": r[5].strip(),
                "village_code": r[6].strip(),
                "village_name": r[7].strip(),
            })
    return out


def read_current_hierarchy():
    src = open(LGDJS, encoding="utf-8-sig").read()
    pat = re.compile(r"\{code:'([^']+)', name:'([^']+)'(, (districts|tehsils):\[)?")
    state = None
    district = None
    states = {}
    dists = {}
    tehsils = {}
    for m in pat.finditer(src):
        code, name, kind = m.group(1), m.group(2), m.group(4)
        if kind == "districts":
            state = code
            states[code] = name
            district = None
        elif kind == "tehsils":
            district = code
            dists[(state, code)] = name
        else:
            if state is not None and district is not None:
                tehsils[(state, district, code)] = name
    return states, dists, tehsils
def main():
    src = sys.argv[1] if len(sys.argv) > 1 else None
    rows = read_uploaded_rows(src)
    cur_states, cur_dists, cur_tehsils = read_current_hierarchy()

    by_parent = {}
    for r in rows:
        key = (r["state_code"], r["district_code"], r["subdist_code"])
        by_parent.setdefault(key, []).append((r["village_code"], r["village_name"]))

    matched = {k: v for k, v in by_parent.items() if k in cur_tehsils}
    isolated = {k: v for k, v in by_parent.items() if k not in cur_tehsils}
    attached_total = sum(len(v) for v in matched.values())
    isolated_total = sum(len(v) for v in isolated.values())

    os.makedirs(OUT_DIR, exist_ok=True)

    per_state = {}
    for (sc, dc, tc), vills in matched.items():
        per_state.setdefault(sc, {}).setdefault(dc + ":" + tc, []).extend(vills)

    for sc in per_state:
        for key in per_state[sc]:
            per_state[sc][key].sort(key=lambda x: (x[1].lower(), x[1], x[0]))

    lines_kv = []
    total_files = 0
    for sc in sorted(set(list(per_state.keys()) + list(cur_states.keys()))):
        data = per_state.get(sc, {})
        n_v = sum(len(v) for v in data.values())
        total_files += 1
        body = json.dumps(data, ensure_ascii=True, separators=(",", ":"))
        sname = cur_states.get(sc, "")
        content = (
            "/* AUTO-GENERATED official LGD village data - DO NOT EDIT */\n"
            "/* Source: data.gov.in Local Government Directory - snapshot %s */\n"
            "/* stateCode=%s %s | parent-tehsils=%d | villages=%d (exact parent match only) */\n"
            "(function () {\n"
            "  var V = %s;\n"
            "  if (typeof window.LGD_VILLAGE_INDEX === \"undefined\") window.LGD_VILLAGE_INDEX = {};\n"
            "  window.LGD_VILLAGE_INDEX[\"%s\"] = V;\n"
            "})();\n"
        ) % (SNAPSHOT, sc, sname, len(data), n_v, body, sc)
        with open(os.path.join(OUT_DIR, "villages-%s.js" % sc), "w", encoding="utf-8") as f:
            f.write(content)
        lines_kv.append((sc, sname, len(data), n_v))

    readme = build_readme(rows, cur_states, cur_tehsils, matched, isolated,
                          attached_total, isolated_total, lines_kv)
    with open(os.path.join(OUT_DIR, "README.md"), "w", encoding="utf-8") as f:
        f.write(readme)

    print("Uploaded rows         : %d" % len(rows))
    print("Uploaded parents      : %d" % len(by_parent))
    print("Matched (attached)    : %d parents | %d villages" % (len(matched), attached_total))
    print("Isolated (not merged) : %d parents | %d villages" % (len(isolated), isolated_total))
    print("Chunk files written   : %d -> %s" % (total_files, OUT_DIR))
    for sc, sname, n_t, n_v in lines_kv:
        if n_t:
            print("   villages-%s.js  %s  tehsils=%d villages=%d" % (sc, sname, n_t, n_v))


def build_readme(rows, cur_states, cur_tehsils, matched, isolated,
                 attached_total, isolated_total, lines_kv):
    L = []
    L.append("# LGD Village Data (lazy per-state chunks)\n")
    L.append("AUTO-GENERATED - DO NOT EDIT these files directly. Regenerate with:\n")
    L.append("```\npython _gen_lgd_villages.py [path-to-zip-or-csv]\n```\n")
    L.append("## Source")
    L.append("- **Dataset:** `%s`" % CSV_NAME)
    L.append("- **Snapshot date:** %s" % SNAPSHOT)
    L.append("- **Publisher:** Ministry of Panchayati Raj / Local Government Directory (data.gov.in)\n")
    L.append("## Content")
    L.append("Each `villages-<stateCode>.js` registers `window.LGD_VILLAGE_INDEX[\"<stateCode>\"]`")
    L.append("as a map of `\"<districtCode>:<subDistrictCode>\"` -> `[[\"<villageCode>\",\"<villageName>\"], ...]`.\n")
    L.append("Uploaded dataset: %d village rows | %d sub-districts | %d districts | %d state codes"
             % (len(rows), len(set((r['state_code'], r['district_code'], r['subdist_code']) for r in rows)),
                len(set((r['state_code'], r['district_code']) for r in rows)),
                len(set(r['state_code'] for r in rows))))
    L.append("\nCompatibility with the current `js/lgd-data.js` hierarchy (exact string match):")
    L.append("- matched parents (villages attached): %d (%d villages)" % (len(matched), attached_total))
    L.append("- uploaded-only parents (ISOLATED, NOT attached, never merged): %d (%d villages)"
             % (len(isolated), isolated_total))
    L.append("- current-only tehsils (keep SAMPLE fallback): %d"
             % (sum(1 for k in cur_tehsils if k not in matched and k not in isolated)))
    L.append("\nAll codes are kept as STRINGS (leading zeroes preserved). LGD codes are never truncated,")
    L.append("hashed, padded or converted. The RULPIN generated from a real village is a PROTOTYPE")
    L.append("identifier - NOT an official government-issued ULPIN.\n")
    L.append("## Files")
    L.append("| File | State | Parent tehsils | Villages |")
    L.append("|------|-------|----------------|----------|")
    for sc, sname, n_t, n_v in lines_kv:
        L.append("| `villages-%s.js` | %s | %d | %d |" % (sc, sname or "-", n_t, n_v))
    L.append("")
    return "\n".join(L)


if __name__ == "__main__":
    main()