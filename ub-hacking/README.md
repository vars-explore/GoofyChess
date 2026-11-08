# Goofy Chess

Goofy Chess is a browser chess game where real board events and hidden Stockfish analysis trigger playful reactions. Play a friend online, pass the device, face the Stockfish bot, or try prepared positions in Meme Lab. After a game, Stockfish reviews the moves and Gemini writes a recap you can read or hear.

## Features

- **Online friend matches:** create a room, share an invite, and reconnect to a saved seat.
- **Pass and play:** take turns on one device.
- **Stockfish bot:** choose Easy, Medium, Hard, or Expert and play as either color.
- **Meme Lab:** explore prepared positions and try suggested moves. See [SCENARIOS.md](SCENARIOS.md).
- **Live reactions:** board-event and engine-evaluation reactions, animated memes, combat effects, and a checkmate finale.
- **Game controls:** promotion selection, board flip, move history, captured pieces, draw offers, resignations, resets, and rematches.
- **Post-game recap:** Stockfish evaluates the game and Gemini summarizes the result and notable swings. Listen to the recap with speech playback.
- **Voice moves:** speak a legal chess move using the microphone control.
- **User controls:** sound volume, mute, reactions on/off, and reduced motion.

No account is required. Engine scores and best-move analysis are never shown during a game.

## Requirements

- Node.js **22.12 or later** and npm
- Internet access for initial dependency installation, Gemini recaps, voice features, and uncached remote media
- Optional API credentials: `GEMINI_API_KEY` for recaps and `ELEVENLABS_API_KEY` for speech playback and voice move transcription

Stockfish is supplied by the `stockfish` npm package and runs locally in a Node child process. The game and bot can still run without Gemini; voice features need ElevenLabs credentials and microphone access over HTTPS or localhost.

## Run in development

From this repository directory:

```powershell
npm ci
npm run dev
```

Open **http://localhost:5173**. Vite serves the React app and proxies Socket.IO and `/api` requests to the Node server on port **3001**. The Vite server listens on all network interfaces; access from another device depends on the host firewall and accepted origin.

To play online, create a room and open its invite in a separate browser profile, incognito window, or another device. A second tab may share session storage in some browsers, so use a separate browser context for the second seat.

## Run in production mode

```powershell
npm run build
npm start
```

Open **http://localhost:3001**. Express serves the built frontend and multiplayer server together. Deploy the Node server on a persistent host that supports WebSockets. Static hosting of `dist/` alone does not support games. Configure HTTPS and allowed browser origins when running behind a reverse proxy.

## Configuration

Copy `.env.example` to `.env` and configure only the features you need. Keep credentials in ignored local environment files or your deployment host's secret manager; never commit API keys.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | Node server port. If changed in development, update the Vite proxy target in `vite.config.ts`. |
| `ANALYSIS_MS` | `300` | Live Stockfish evaluation time per position, clamped to 100–1500 ms. Post-game review uses its own short searches. |
| `STOCKFISH_PATH` | bundled Stockfish.js WASM | Optional path to a native Stockfish executable. |
| `GEMINI_API_KEY` | unset | Enables Gemini post-game recaps. Without it, games still work and the recap is unavailable. |
| `ELEVENLABS_API_KEY` | unset | Enables recap speech playback and voice-move transcription. Use `npx -y @elevenlabs/cli@latest onboard init` to configure it in the gitignored `.env.local`. |
| `ALLOWED_ORIGINS` | same-host origin check | Optional comma-separated list of exact allowed browser origins, e.g. `https://chess.example.com,https://www.chess.example.com`. Do not add spaces around entries. |

Gemini receives the game result, algebraic moves, and sampled Stockfish evaluations. Player names and seat tokens are not included. Long games are sampled at up to 180 move positions, including the final position.

## How it works

### Browser and server

The frontend is React and TypeScript, built by Vite. It uses `chess.js` to preview legal destinations and render the position. The Node server is authoritative: it validates submitted moves with `chess.js`, updates the room, and broadcasts snapshots through Socket.IO.

Moves include a game ID and position version. The server rejects stale moves, invalid seats, out-of-turn moves, and moves made before both online players connect. Seat recovery uses a server-held token stored for that browser session.

### Stockfish and reactions

`server/engine.ts` starts a lightweight, single-threaded Stockfish process and communicates with it using UCI commands. The engine serializes searches, caches scores, and coalesces obsolete queued work by room. Bot difficulty uses different Stockfish settings; if the engine is unavailable, the bot can choose a legal fallback move.

`shared/reactions.ts` detects board events such as checkmate, forks, promotions, captures, and castling. It maps evaluation changes to reactions using White-perspective scores, separate mate scores, thresholds, and cooldowns. The server emits at most one main reaction per move for each player. Stale analysis results are discarded by room, game ID, and position version.

### Post-game recap and voice

When a game ends, the server evaluates the recorded positions and sends the result, moves, and score samples to Gemini (`gemini-3-flash-preview`). The result card shows a pending state, then the recap or an unavailable message. Recaps are included in room snapshots for reconnecting players. Resetting or starting a rematch clears the previous recap.

ElevenLabs powers recap speech and voice-move transcription when configured. API keys stay on the server. Microphone access requires HTTPS or localhost and browser permission.

### Media and sound

`shared/media.ts` maps reaction kinds to meme and sound sources. `/api/media/:id` serves bundled local sounds or fetches configured remote assets, validates their media type and size, and caches successful downloads under `.media-cache/`. Meme catalog URLs may refresh from Imgflip when the server starts. Remote media can fall back to its source URL if fetching or caching fails.

Move sounds are synthesized in the browser with Web Audio. Reaction sounds use configured audio assets. Browsers require a user interaction before audio playback can begin. Add custom meme files under `public/memes/` and reference them from `shared/reactions.ts`; missing images fall back to the reaction card. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) before redistribution.

## Repository map

| Path | Responsibility |
| --- | --- |
| `src/main.tsx` | React app, lobby, board input, room controls, settings, and reactions |
| `src/Piece.tsx`, `src/MoveAnimation.tsx`, `src/CombatEffect.tsx`, `src/CheckmateScene.tsx` | Chess-piece SVGs, move and combat effects, and checkmate finale |
| `src/audio.ts`, `src/voice.ts`, `src/Meme.tsx` | Browser audio, voice controls, and meme presentation |
| `server/index.ts` | Express app, Socket.IO rooms, reconnects, bot turns, and reaction delivery |
| `server/game.ts` | Authoritative game state, legal moves, results, and snapshots |
| `server/engine.ts` | Stockfish process, search queue, cache, bot moves, and review evaluations |
| `server/review.ts` | Gemini recap and voice service integration |
| `server/media.ts` | Local/remote media serving, validation, and cache |
| `shared/reactions.ts` | Board-event priority and evaluation-to-reaction rules |
| `shared/demos.ts` | Scenario positions, setup moves, and hints |
| `shared/types.ts` | Shared game, socket, and reaction types |
| `tests/` | Chess rules, multiplayer, bot, reaction, scenario, motion, review, voice, and engine tests |

## Validation

```powershell
npm test
npm run test:engine
npm run build
```

`npm test` runs the unit and multiplayer integration tests. `npm run test:engine` launches Stockfish and checks an engine evaluation; it requires the engine dependency. `npm run build` runs TypeScript checking and builds the production frontend.

## Limits

- Rooms and recaps are stored in process memory. A server restart clears them; run one server process rather than unshared replicas.
- Disconnected rooms expire after two hours. The server retains up to 100 rooms.
- Stockfish uses one analysis process. Under load, obsolete reaction work may be skipped to keep gameplay responsive.
- Threefold repetition and the fifty-move condition are automatically adjudicated as draws instead of requiring a player claim.
- There are no clocks, matchmaking, accounts, persistent game records, spectators, or post-game highlight reels.
- Touch users should use click-to-move.
- If Stockfish is unavailable, legal gameplay and immediate board-event reactions continue. The bot can use fallback moves; evaluation-based reactions and Stockfish-backed recaps are unavailable.
- Gemini and ElevenLabs features depend on valid credentials, model/service availability, network connectivity, and quota.

## Scenarios and third-party notices

- [SCENARIOS.md](SCENARIOS.md) describes reaction triggers, precedence, and demo examples.
- [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) lists dependency licenses and redistribution notes.