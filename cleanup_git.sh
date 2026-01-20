#!/bin/bash
git status
git add -A
git commit -m "chore: clean up temporary files and directories

- Remove accidental docker/ directory
- Remove testing scripts
- Clean up git working directory"
git push origin main
