<p align="center">
  <img src="src-tauri/icons/logo.svg" alt="Codex Switcher" width="128" height="128">
</p>

<h1 align="center">Codex Switcher</h1>

<p align="center">
  A Desktop Application for Managing Multiple OpenAI <a href="https://github.com/openai/codex">Codex CLI</a> Accounts<br>
  Easily switch between accounts, monitor usage limits, and stay in control of your quota
</p>

## Features

- **Multi-Account Management** – Add and manage multiple Codex accounts in one place
- **Quick Switching** – Switch between accounts with a single click
- **Usage Monitoring** – View real-time usage for both 5-hour and weekly limits
- **Dual Login Mode** – OAuth authentication or import existing `auth.json` files
- **Secure Credential Storage** – Account secrets are stored in the OS keychain; `accounts.json` keeps only redacted metadata

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)
- [Rust](https://rustup.rs/)

### Build from Source

```bash
# Clone the repository
git clone https://github.com/Lampese/codex-switcher.git
cd codex-switcher

# Install dependencies
pnpm install

# Run in development mode
pnpm tauri dev

# Build for production
pnpm tauri build
```

The built application will be in `src-tauri/target/release/bundle/`.

For macOS app-only output (without DMG), use:

```bash
pnpm tauri build --bundles app
```

This outputs `src-tauri/target/release/bundle/macos/Codex Switcher.app`.

## Development Quality Checks

```bash
# TypeScript strict check
pnpm exec tsc --noEmit

# Frontend tests
pnpm test

# Run one test file
pnpm test -- src/components/__tests__/AccountCard.test.tsx

# Full UI quality gate (types + tests + build)
pnpm run check:ui
```

## Architecture Docs

- Docs index: `docs/README.md`
- Engineering standards: `docs/engineering-standards.md`
- UI architecture contract: `docs/ui-ux-architecture.md`
- Agent operating guide: `AGENTS.md`

## Security Notes

- Credentials are stored in the OS keychain (Keychain on macOS, Credential Manager on Windows, Secret Service on Linux).
- Existing plaintext credentials in `~/.codex-switcher/accounts.json` are migrated automatically on first load and then redacted on disk.
- If an account metadata record exists but its keychain secret is missing, the app now auto-removes that stale record at startup instead of blocking the entire account list.

## Disclaimer

This tool is designed **exclusively for individuals who personally own multiple OpenAI/ChatGPT accounts**. It is intended to help users manage their own accounts more conveniently.

**This tool is NOT intended for:**
- Sharing accounts between multiple users
- Circumventing OpenAI's terms of service
- Any form of account pooling or credential sharing

By using this software, you agree that you are the rightful owner of all accounts you add to the application. The authors are not responsible for any misuse or violations of OpenAI's terms of service.
