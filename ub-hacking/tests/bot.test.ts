import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../server/game';

test('bot mode rejects moving when it is not the player turn', () => {
 const g = new Game('bot', undefined, 'easy');
 g.players.w = { name: 'Player', socket: 'user-socket', token: 'token-1' };
 g.players.b = { name: 'Noob Bot', socket: null, token: 'bot' };

 // Black (bot) cannot be moved via the user's socket
 assert.throws(() => g.move('user-socket', {
  gameId: g.gameId,
  version: g.version,
  from: 'e7',
  to: 'e5',
 }));

 // White moves legally
 g.move('user-socket', {
  gameId: g.gameId,
  version: g.version,
  from: 'e2',
  to: 'e4',
 });
 assert.equal(g.version, 1);
 assert.equal(g.chess.turn(), 'b');

 // User cannot move again because it is the bot turn
 assert.throws(() => g.move('user-socket', {
  gameId: g.gameId,
  version: g.version,
  from: 'd2',
  to: 'd4',
 }));

 // Bot moves successfully via moveAsBot
 g.moveAsBot({ from: 'e7', to: 'e5' });
 assert.equal(g.version, 2);
 assert.equal(g.chess.turn(), 'w');
});

test('bot mode snapshot exposes bot difficulty and seat names', () => {
 const g = new Game('bot', undefined, 'expert');
 g.players.w = { name: 'Player', socket: 's1', token: 't1' };
 g.players.b = { name: 'Grandmaster Stockfish 🤖', socket: null, token: 'bot' };

 const snap = g.snapshot();
 assert.equal(snap.mode, 'bot');
 assert.equal(snap.difficulty, 'expert');
 assert.equal(snap.players.b?.name, 'Grandmaster Stockfish 🤖');
 assert.equal(snap.players.b?.connected, false);
});

