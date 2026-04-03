#!/bin/bash
# ============================================================
# LensGigs — Push to GitHub
# Run this once from the lensgigs/ project root
# ============================================================

set -e

REPO_NAME="lensgigs"
GITHUB_USER="anilpadheriya-1"   # your GitHub username

echo ""
echo "🚀 LensGigs — GitHub Push Script"
echo "=================================="
echo ""

# 1. Check git is installed
if ! command -v git &> /dev/null; then
  echo "❌ git not found. Install from https://git-scm.com"
  exit 1
fi

# 2. Check gh CLI (optional but helpful)
if command -v gh &> /dev/null; then
  echo "✅ GitHub CLI found — will create repo automatically"
  GH_CLI=true
else
  echo "ℹ️  GitHub CLI not found. You'll need to create the repo manually."
  echo "   Install from: https://cli.github.com"
  GH_CLI=false
fi

echo ""

# 3. Init git if not already
if [ ! -d ".git" ]; then
  git init
  echo "✅ Git initialised"
else
  echo "✅ Git already initialised"
fi

# 4. Set up .gitignore (already exists)
echo "✅ .gitignore in place"

# 5. Stage everything
git add -A
git commit -m "feat: initial LensGigs commit — full-stack visual arts marketplace

- FastAPI backend (Python) with JWT auth, MongoDB, Cloudinary, Razorpay
- React 18 frontend with Tailwind CSS, dark theme, emerald accent  
- Cloudflare Edge Worker with rate limiting + caching (KV: 22a3042625f04224895f59e3de9d6954)
- Supabase analytics Edge Function (lensgigs-analytics) + fk_events table
- 10 assets live on Cloudinary (cloud: dddgabu7o, folder: visualhub/)
- Demo seed: 4 providers + 1 client auto-seeded on first boot
- Docker Compose + Railway + Render deployment configs
- Figma UI kit generator script

Demo: client@demo.com / demo123" 2>/dev/null || echo "✅ Already committed (no changes)"

echo ""

# 6. Create GitHub repo + push
if [ "$GH_CLI" = true ]; then
  echo "📦 Creating GitHub repo '$REPO_NAME'..."
  gh repo create "$REPO_NAME" \
    --public \
    --description "India's premier visual arts marketplace — photographers, videographers, drone operators & editors" \
    --source=. \
    --remote=origin \
    --push
  echo ""
  echo "🎉 Done! Repo live at: https://github.com/$GITHUB_USER/$REPO_NAME"
else
  echo "📋 Manual steps:"
  echo ""
  echo "  1. Go to https://github.com/new"
  echo "  2. Repository name: $REPO_NAME"
  echo "  3. Description: India's premier visual arts marketplace"
  echo "  4. Set to Public, skip initialising (no README)"
  echo "  5. Click 'Create repository'"
  echo "  6. Then run:"
  echo ""
  echo "     git remote add origin https://github.com/$GITHUB_USER/$REPO_NAME.git"
  echo "     git branch -M main"
  echo "     git push -u origin main"
  echo ""
fi

echo ""
echo "📌 What's live after push:"
echo "  • GitHub:   https://github.com/$GITHUB_USER/$REPO_NAME"
echo "  • Cloudinary assets: res.cloudinary.com/dddgabu7o (10 files)"  
echo "  • Supabase analytics fn: https://bzabxhnovshznqqodvij.supabase.co/functions/v1/lensgigs-analytics"
echo "  • Cloudflare KV: LENSGIGS_RL_KV (id: 22a3042625f04224895f59e3de9d6954)"
echo ""
echo "📋 Next: Deploy backend to Railway, set env vars from backend/.env.example"
echo ""
