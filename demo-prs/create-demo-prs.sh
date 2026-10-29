#!/usr/bin/env bash
# Creates and pushes the two demo branches for Task 3.
# Run from the repo root AFTER the test suite + CI changes are merged into main.
#   bash demo-prs/create-demo-prs.sh
set -euo pipefail

git checkout main
git pull --ff-only origin main

# PR 1: passing (new helper + test)
git checkout -b feature/add-helper
git apply demo-prs/feature-add-helper.diff
git add -A -- utils tests
git commit -m "Add capitalize helper with tests"
git push -u origin feature/add-helper

# PR 2: failing (bug in formatAmount, tests NOT updated)
git checkout main
git checkout -b feature/broken-test
git apply demo-prs/feature-broken-test.diff
git add -A -- utils
git commit -m "Change formatAmount output format"
git push -u origin feature/broken-test

git checkout main
echo "Now open a PR into main from each branch on GitHub."
