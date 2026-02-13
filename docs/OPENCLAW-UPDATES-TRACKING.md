# OPENCLAW UPDATE MONITOR - ACTIVE

## Status: MONITORING ACTIVE
**Last Check:** 2026-02-13 21:30 UTC
**Latest Version:** 2026.2.12 (Feb 12, 2026)
**Current Status:** Tracking releases

---

## 🔥 CRITICAL UPDATE - Feb 12, 2026 (v2026.2.12)

### BREAKING CHANGES
⚠️ **Hooks Security:** POST /hooks/agent now rejects payload sessionKey overrides by default
- Impact: Affects custom hook implementations
- Action: Set hooks.defaultSessionKey for fixed hook context

### MAJOR NEW FEATURES
✅ **CLI:** `openclaw logs --local-time` - Display timestamps in local timezone
✅ **Telegram:** Blockquotes now render as native tags
✅ **Config:** Fixed maxTokens redaction issues

### SECURITY PATCHES (16 total)
🔒 **HIGH PRIORITY:**
- SSRF protection for URL-based input_file/input_image handling
- Fixed unauthenticated Nostr profile API vulnerability
- Removed bundled soul-evil hook (security risk)
- Added hook session-routing hardening
- Sandboxed skill sync destinations
- Web tools content treated as untrusted by default
- Webhook verification with constant-time comparison
- Browser control auth requirements
- Session transcript path hardening
- And 7 more security fixes

### CRON SYSTEM FIXES (8 fixes)
- Fixed cron job scheduling reliability
- Prevent duplicate fires
- Isolate scheduler errors
- Honor stored session model overrides
- Fixed one-shot job re-firing issues
- Prevented reminder notification spam

---

## Previous Updates

### v2026.2.9 (Feb 9, 2026)
- ✅ iOS alpha node app + setup-code onboarding
- ✅ BlueBubbles channel support
- ✅ Device pairing + phone control plugins
- ✅ Grok (xAI) as web_search provider
- ✅ Agent management RPC for web UI
- ✅ Token usage dashboard

### v2026.2.6 (Feb 6, 2026)
- ✅ Anthropic Opus 4.6 support
- ✅ OpenAI Codex gpt-5.3-codex
- ✅ xAI (Grok) provider support
- ✅ Native Voyage AI for memory
- ✅ Cron scheduling fixes

### v2026.2.3 (Feb 3, 2026)
- ✅ Feishu/Lark plugin support
- ✅ Agents dashboard in web UI
- ✅ QMD backend for workspace memory
- ✅ Cloudflare AI Gateway provider

### v2026.2.2 (Feb 2, 2026)
- ✅ Security: operator.approvals for gateway /approve
- ✅ Security: Matrix allowlist hardening
- ✅ Security: Windows exec allowlist fixes
- ✅ Security: Voice call hardening
- ✅ Media understanding SSRF guards

### v2026.2.1 (Feb 1, 2026)
- ✅ Shell completion for Zsh/Bash/PowerShell/Fish
- ✅ Kimi K2.5 model support
- ✅ MiniMax OAuth plugin
- ✅ Tsdown + tsgo build system

### v2026.1.30 (Jan 31, 2026)
- ✅ CLI completion command
- ✅ Rebrand to OpenClaw
- ✅ Venice API key support

---

## 📊 MONITORING CHECKLIST

- [x] Latest version checked: 2026.2.12
- [x] Security patches reviewed
- [x] Breaking changes documented
- [x] Cron fixes noted (relevant to our use case)
- [ ] Check if update needed for our deployment
- [ ] Review gateway auth changes impact

---

## 🎯 ACTION ITEMS

### IMMEDIATE:
1. Review hook security changes - may affect our cron jobs
2. Check gateway auth configuration
3. Consider updating to 2026.2.12 for security patches

### THIS WEEK:
1. Monitor for 2026.2.13 release
2. Check Discord for announcements
3. Review new features for CoExAI integration

---

## 🔗 MONITORING SOURCES

- GitHub: https://github.com/openclaw/openclaw/releases
- Docs: https://docs.openclaw.ai
- Discord: https://discord.com/invite/clawd
- NPM: https://www.npmjs.com/package/openclaw

**Next Check:** 22:00 UTC (in 30 minutes)
