#!/usr/bin/env python3
import re

# Read the file
with open('app/admin/dashboard/page.tsx', 'r') as f:
    lines = f.readlines()

# Look for the problem area
print(f"Total lines: {len(lines)}")

# Check around line 1222 (1-indexed to 0-indexed)
print("\nLines 1199-1210:")
for i in range(1198, min(1210, len(lines))):
    print(f"  {i+1}: {repr(lines[i][:80])}")

print("\nLines 1220-1230:")
for i in range(1219, min(1230, len(lines))):
    print(f"  {i+1}: {repr(lines[i][:80])}")

# Count history tabs
history_count = 0
for i, line in enumerate(lines):
    if 'activeTab === "history"' in line:
        history_count += 1
        print(f"\nFound history tab at line {i+1}")

print(f"\nTotal history tabs found: {history_count}")
