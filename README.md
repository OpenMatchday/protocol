# Open Matchday -- protocol

Versioned pairing, session, command, event, and layout schemas with generated TypeScript clients.

Part of the [OpenMatchday](https://github.com/OpenMatchday) organization.

## Version

Wire SemVer is `0.1.0` (`VERSION`, `package.json`, `PROTOCOL_VERSION` in generated clients). MAJOR bumps break wire compatibility per [REPOS.md](https://github.com/OpenMatchday/docs) versioning policy and [Semantic Versioning](https://semver.org/).

## Schemas

Dialect: [JSON Schema 2020-12](https://json-schema.org/draft/2020-12/schema).

| File | Covers |
|---|---|
| `schemas/v0/pairing.json` | AC-1.1–AC-1.4 pairing shapes (QR/manual offers; media wifi/ethernet only; `approved_by_director: true`) |
| `schemas/v0/session.json` | AC-1.5 roles, AC-2.7/2.8 health, AC-5.5 snapshots (`fields` / FieldState) |
| `schemas/v0/command.json` | AC-2.* director commands, AC-3.9 layout apply, AC-5.5 idempotency/undo |
| `schemas/v0/event.json` | AC-5.5 append-only event log |
| `schemas/v0/layout.json` | AC-3.9 draft/applied layout documents, AC-3.10 scoreboard source |

Catalog: `schemas/catalog.json`. This repository contains schemas and generated clients only — no business logic.

## Clients

Generated TypeScript types live in `clients/typescript/` (committed). Regenerate after schema edits:

```bash
npm install
npm run generate
npm run check
npm test
npm run typecheck
```

## License

MIT. See [LICENSE](LICENSE).
