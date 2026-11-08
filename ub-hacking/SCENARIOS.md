# Meme scenarios

The existing reactions and custom media are preserved. Ten additional events are available during normal games, bot games, and in **The meme lab**:

| Scenario | Trigger | Example caption | Sound |
| --- | --- | --- | --- |
| Knight fork | The moved knight checks the king and attacks a queen or rook | WHY NOT BOTH? | Anime Wow |
| Double check | Two pieces simultaneously check the king | MAKE THAT DOUBLE. | Vine Boom |
| Revenge capture | Immediately capture the piece that just captured yours | NO U. | Bruh |
| Pawn takes a big piece | A pawn captures a knight, bishop, rook, or queen | the intern just fired the manager | Vine Boom |
| King capture | The king captures a piece | FINE. I WILL DO IT MYSELF. | Sword Slash |
| Underpromotion | Promote to a rook, bishop, or knight | queen? too mainstream. | Bruh |
| Capture streak | The same physical piece completes its third capture | THREE COURSE MEAL. | Anime Wow |
| Promotion immediately captured | Capture the opponent's piece directly after it promotes | promoted. immediately fired. | Local Fahh clip |
| First blood | The first capture in the game | friendship has left the chat | Sword Slash |
| Queen trade | Recapture a queen that just captured your queen | A SOUL FOR A SOUL. | Sad Violin |

Only one main meme is selected per move. Checkmate and stalemate have top priority. More specific events replace generic ones (for example, underpromotion replaces promotion). Checks retain priority over routine recaptures. Routine capture/recapture/king-capture reactions respect the reaction cooldown.

These events describe what actually happened. A sacrifice is not called brilliant just because a valuable piece was offered. Capture streaks track a piece's path through the full move history; they do not combine every piece of the same type.

Some demos start with preparatory moves already played. Those moves are visible in the move history; the hint tells you which move to play next. Reset rebuilds the position and its prerequisite history.

Assets use verified Imgflip template URLs and existing sound sources in `shared/media.ts`. Existing custom images, video, and local sounds are left intact.
