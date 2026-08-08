# rebels-vs-space-fascists

A mobile-first, offline-capable, pass-and-play PWA for a hidden-movement party game: one player
is the Rebel, hiding from the Space Fascist Empire; everyone else is a Fascist trying to hunt them
down before time runs out.

## How it plays

The game moves through three phases on a single shared device:

1. **Name entry** &ndash; everyone types their name in.
2. **Role allocation** &ndash; the phone is passed around so each player can privately see whether
   they are the Rebel or a Space Fascist.
3. **The main game** &ndash; players take turns moving across a board of connected space stations
   spread across several planets:
   - **Monorail** &ndash; one station per turn, free.
   - **Warp gate** &ndash; long-distance travel within the same planet, costs a warp ticket.
   - **Shuttle** &ndash; inter-planetary travel, costs a shuttle ticket.

   The Rebel is invisible to the other players and hacks onto every route for free. The Space
   Fascists can't see the Rebel's position, but after each of their moves they learn how many
   hops away the Rebel currently is. If a Fascist ever lands on the Rebel's station, the Rebel is
   captured and the Empire wins; if the Rebel survives long enough, the Rebels win.

## Development

This is a Vite + React + TypeScript app, built as an installable, offline-first Progressive Web
App via `vite-plugin-pwa`.

```sh
npm install
npm run dev      # start a local dev server
npm run build    # type-check and build the static bundle into dist/
npm run lint     # run eslint
npm run test     # run the vitest suite
```

