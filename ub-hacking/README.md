# Blunder Theater

Live chess with hidden Stockfish analysis, animated meme reactions, and optional sound effects. No commentary, engine scores, or best-move arrows are shown to players.

## Run locally

Requires **Node.js 22.12+** (Node 24 recommended) and an internet connection for the initial install.

```powershell
cd "D:\Ub hacking"
npm install
npm run dev
```

Open **http://localhost:5173**. The Node server runs on port 3001; Vite proxies its Socket.IO connection. The `stockfish` npm dependency supplies the real lite single-threaded WASM engine, executed in a separate Node child process. No API key or external engine service is needed.

For a production build on a Node host:

```powershell
npm run build
npm start
```

Open **http://localhost:3001**. The Node process serves the built frontend and multiplayer connections together. Use a persistent Node host with WebSocket support; uploading only the static frontend will not support games. Public deployment has not been configured.

### Play with a friend

Create a room, copy the invite, and open it in a different browser or an incognito window. A second tab can share copied session storage in some browsers; use a separate browser context for a separate player.

Localhost links work only on the same computer. For another device on the same Wi-Fi, open the site using the host computer's LAN IP and port 5173, then create/copy the invite from that address. Your firewall must allow the development server. Internet play requires deploying the Node server on a reachable host with HTTPS.

### Demo

Choose **The meme lab** or **Skip to the funny part**. Select a scenario and make its suggested move. Each position can be reset. The Stockfish scenario deliberately abandons a queen: move the king from e1 to f1 and allow time for the hidden analysis. Evaluation-dependent reactions are conditional on the actual engine result, never faked.

**Pass & play** lets two people use the same device; it also uses the local server and background engine. Analysis reactions in this mode use the mover's perspective.

Sound is muted initially. Enable it using the speaker button or settings. The current sounds are short synthesized tones, so no sound downloads are required.

## Configuration

Copy `.env.example` to `.env` if you need to change the server port, engine analysis time, allowed browser origins, or native engine location. Values are loaded by the npm scripts.

- `STOCKFISH_PATH`: optional absolute path to a native Stockfish executable. Otherwise the npm WASM build is selected automatically.
- `ANALYSIS_MS`: search time per position, bounded to 100–1500 ms; default 300 ms.
- `GEMINI_API_KEY`: optional Gemini API key. Completed games use Stockfish evaluations to generate a recap when configured.
- `ALLOWED_ORIGINS`: optional comma-separated exact browser origins. Same-origin requests are allowed by default. Include every intended frontend origin if separating frontend and backend.
- `PORT`: backend port, default 3001. If changed during development, also update Vite's proxy target.

## Meme assets

The first version uses animated emoji/text meme cards. These are intentional local placeholders, not downloaded recognizable meme GIFs.

Add images/GIFs to `public/memes/` and set the optional `image` field on the relevant entry in `shared/reactions.ts`, for example:

```ts
check: {
  emoji: '😰',
  captions: ['THIS IS FINE.', 'WHY IS IT HOT IN HERE?'],
  tone: 'bad',
  image: '/memes/sweating.gif',
},
```

Missing images fall back to the card. Three tone families are synthesized in `src/audio.ts`. Replace or extend that module if you want recorded sound assets; the existing mute, volume, and user-interaction controls should remain.

Reaction thresholds, cooldowns, caption variants, duration, and ordinary-capture frequency live in `shared/reactions.ts`. Event precedence is defined in `boardEvent()`.

## Architecture

- `server/game.ts`: authoritative chess state, seat identity, legal moves, game results, public snapshots.
- `server/index.ts`: Socket.IO rooms, reconnects, controls, and reaction delivery.
- `server/engine.ts`: one Stockfish child process, bounded searches, position cache, and a latest-pending-job queue per room.
- `shared/reactions.ts`: board-event detection and evaluation-to-meme rules.
- `shared/demos.ts`: legal-position presets and suggested moves.
- `src/main.tsx`: room lobby, board interactions, settings, and reactions.
- `src/Piece.tsx`: locally drawn SVG chess pieces.
- `src/audio.ts`: short synthesized sound effects.

The move updates immediately. Visible board events may trigger a meme immediately. Stockfish analyzes before/after positions silently, normalizes scores to White's perspective, and chooses separate reactions for each player. Mate scores stay separate from centipawns. Winning/losing state has different entry and exit thresholds to prevent flicker.

At most one main reaction is emitted per move per player. If an immediate event was shown, delayed analysis does not add a second reaction. Every result is checked against its room, game ID, and position version. Reconnect sends game state, not previous memes. Rapid play coalesces pending engine jobs and discards stale results.

The browser never receives evaluation scores. The engine is not used as an opponent.
After a game ends, Stockfish evaluates the recorded positions and Gemini turns the move-by-move scores into a short recap shown on the result card.

## Validation commands

```powershell
npm test
npm run test:engine
npm run build
```

`npm test` covers reaction logic, chess rules and demo positions, server move validation, multiplayer synchronization, seat recovery, draw offers, and rematches. `npm run test:engine` requires the actual installed engine and tests the queen-losing scenario.

The pure reaction tests also run without installing packages on Node 24:

```powershell
node --experimental-strip-types --test tests/reactions.test.ts
```

### Verification performed during creation

- Passed: 8 dependency-free reaction tests.
- Passed: native TypeScript syntax transformation for server, shared, and test files.
- Blocked: npm dependency installation failed with `ENOTFOUND registry.npmjs.org` in the build environment.
- Therefore not yet verified: full type checking, frontend build/rendering, chess/demo tests, two-browser interaction, multiplayer integration tests, and real Stockfish execution. Run the commands above after installation; this source is not being represented as a fully tested deployment.

## MVP limitations

- Rooms live in one server's memory. Restarting clears them; use a single process rather than multiple replicas.
- Inactive disconnected rooms expire after two hours; at most 100 rooms are retained.
- A single analysis process bounds CPU use. Under load it may skip obsolete reactions rather than slow the game.
- Threefold repetition and the fifty-move condition are automatically adjudicated as draws for this casual MVP, rather than requiring a formal player claim.
- No clocks, matchmaking, account system, spectators, AI opponent, persistent records, or postgame highlight reel.
- Native browser drag/drop and click-to-move are provided; touch users should use click-to-move.
- Google Fonts are optional visual enhancements; system fonts work if unavailable.
- If Stockfish fails, gameplay and immediate board reactions continue. The server logs the problem, and `/api/health` reports engine readiness. Evaluation-based reactions are unavailable until the engine is restarted successfully.

## Third-party notices

See `THIRD_PARTY_NOTICES.md` before redistributing the app with dependencies or engine files.
