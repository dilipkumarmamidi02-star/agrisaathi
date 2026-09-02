#!/usr/bin/env python3
"""
Run from ~/Downloads/agrisaathi/frontend:
    python3 patch_theme_everywhere.py

Scans every .jsx file under src/ and replaces leftover dark "Intelligence
OS" theme classes with their light "lt-" theme equivalents, using the
exact mapping already proven correct on Home.jsx and MarketPrices.jsx.
Handles arbitrary opacity suffixes (e.g. bg-mint/30, bg-ink/70) generically
via regex instead of hardcoding specific percentages.
"""
import re
import os

ROOT = "src"

# Order matters: longer/more-specific tokens must come before their
# substrings (e.g. bg-surface-hover before bg-surface).
PATTERNS = [
    (re.compile(r"\bbg-surface-hover\b"), lambda m: "bg-lt-bg"),
    (re.compile(r"\bbg-surface\b"), lambda m: "bg-lt-card"),
    (re.compile(r"\bborder-border-strong\b"), lambda m: "border-lt-border"),
    (re.compile(r"\bborder-border\b"), lambda m: "border-lt-border"),
    (re.compile(r"\btext-text-secondary\b"), lambda m: "text-lt-text-secondary"),
    (re.compile(r"\btext-text-muted\b"), lambda m: "text-lt-text-muted"),
    (re.compile(r"\btext-text-primary\b"), lambda m: "text-lt-text"),
    (re.compile(r"\bbg-mint(/\d+)?\b"), lambda m: "bg-lt-success" + (m.group(1) or "")),
    (re.compile(r"\btext-mint\b"), lambda m: "text-lt-success"),
    (re.compile(r"\bborder-mint(/\d+)?\b"), lambda m: "border-lt-success" + (m.group(1) or "")),
    (re.compile(r"\bring-mint(/\d+)?\b"), lambda m: "ring-lt-success" + (m.group(1) or "")),
    (re.compile(r"\bborder-accent-soft\b"), lambda m: "border-lt-accent/20"),
    (re.compile(r"\bbg-accent-soft\b"), lambda m: "bg-lt-accent/10"),
    (re.compile(r"\bborder-accent(/\d+)?\b"), lambda m: "border-lt-accent" + (m.group(1) or "")),
    (re.compile(r"\bring-accent(/\d+)?\b"), lambda m: "ring-lt-accent" + (m.group(1) or "")),
    (re.compile(r"\btext-accent\b"), lambda m: "text-lt-accent"),
    (re.compile(r"\bbg-accent(/\d+)?\b"), lambda m: "bg-lt-accent" + (m.group(1) or "")),
    (re.compile(r"\bbg-ink(/\d+)?\b"), lambda m: "bg-lt-bg" + (m.group(1) or "")),
    (re.compile(r"\btext-ink\b"), lambda m: "text-lt-text"),
]

changed_files = []
total_hits = 0

for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = [d for d in dirnames if d not in ("node_modules", "ui")]
    for fname in filenames:
        if not fname.endswith(".jsx"):
            continue
        fpath = os.path.join(dirpath, fname)
        with open(fpath, encoding="utf-8") as f:
            content = f.read()

        original = content
        file_hits = 0
        for pattern, repl in PATTERNS:
            content, n = pattern.subn(repl, content)
            file_hits += n

        if content != original:
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(content)
            changed_files.append((fpath, file_hits))
            total_hits += file_hits

print(f"Patched {len(changed_files)} files, {total_hits} total token replacements:\n")
for fpath, hits in sorted(changed_files, key=lambda x: -x[1]):
    print(f"  {hits:4d}  {fpath}")

print("\nNow run: npm run build")
