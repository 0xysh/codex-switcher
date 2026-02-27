<p align="center">
  <img src="src-tauri/icons/logo.svg" alt="Codex Usage Inspector" width="128" height="128">
</p>

<h1 align="center">Codex Usage Inspector</h1>

<p align="center">
  A Desktop Application for Managing Multiple OpenAI <a href="https://github.com/openai/codex">Codex CLI</a> Accounts<br>
  Monitor usage, manage local account imports, and keep reliable Codex session snapshots
</p>

## Features

- **Multi-Account Management** – Add and manage multiple Codex accounts in one place
- **Usage Monitoring** – View real-time usage for both 5-hour and weekly limits
- **Dual Login Mode** – OAuth authentication or import existing `auth.json` files
- **Current Session Card** – Refresh current `~/.codex/auth.json` metadata and save snapshots
- **Snapshot Import Flow** – Import from `~/.codex-switcher/snapshots/` with picker default path
- **Local Credential Storage** – Account credentials are stored in `~/.codex-switcher/accounts.json` with restrictive file permissions

## Session Snapshot Workflow

1. Open **Current Codex Session** in the main dashboard.
2. Click **Refresh session** to re-read `~/.codex/auth.json` metadata.
3. Click **Save snapshot** to write a timestamped file in `~/.codex-switcher/snapshots/`.
4. Click **Import snapshot** to open Add Account modal with the picker defaulted to the snapshots folder.

Notes:

- Snapshot and auth files contain sensitive credentials.
- The UI only shows metadata (status, mode, email, plan, file paths, timestamp), never tokens.
- Generic Add Account import defaults to `~/.codex` when current session metadata is available.

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

This outputs `src-tauri/target/release/bundle/macos/Codex Usage Inspector.app`.

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

- Credentials are stored locally in `~/.codex-switcher/accounts.json`.
- The app applies restrictive file permissions (`0600`) on Unix-like systems for this file.
- Session snapshots are stored locally in `~/.codex-switcher/snapshots/` with restrictive permissions (`0700` directory, `0600` files on Unix).
- Legacy placeholder records from previous keychain-backed builds are automatically removed on load.

## Disclaimer

This tool is designed **exclusively for individuals who personally own multiple OpenAI/ChatGPT accounts**. It is intended to help users manage their own accounts more conveniently.

**This tool is NOT intended for:**
- Sharing accounts between multiple users
- Circumventing OpenAI's terms of service
- Any form of account pooling or credential sharing

By using this software, you agree that you are the rightful owner of all accounts you add to the application. The authors are not responsible for any misuse or violations of OpenAI's terms of service.
