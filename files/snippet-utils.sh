#!/usr/bin/env bash
set -euo pipefail

echo "Cleaning temp files..."
find . -type f -name '*.tmp' -delete
