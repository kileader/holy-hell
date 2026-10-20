# Phicid Productions browser splash

Jovian Wake uses the existing TypeScript/Vite browser runtime. The Godot scene,
script, UID, and import settings in this folder remain unchanged references.

## Reuse

Copy `phicid_logo.png`, `splash.ts`, and `splash.css` together into another browser
game. The PNG is the original asset; do not crop it or substitute a generated logo.
Import the stylesheet and call `await showStudioSplash()` from the application's
startup entry, then load the game's own opening screen. Vite resolves the logo URL
relative to `splash.ts` and includes it in the production build.

Keep the document black before JavaScript loads. Jovian Wake's `index.html` uses
`data-startup` to keep the background black and `#app` hidden. Its `src/entry.ts`
removes that attribute one frame after the destination and its styles are ready.
Keep destination selection in the game entry, outside these shared studio files.

The complete image fits within 70% of viewport width and height, with smooth
scaling. Only opacity changes: exact sine easing for 450 ms in, 1500 ms held,
and 450 ms out. Playback starts after the image decodes. There is no audio.

Fresh keyboard presses and left/middle/right mouse presses skip. Keyboard repeats
are consumed without skipping. Gamepads use copied button states to detect fresh
presses; buttons already held at startup and stick movement do not skip. A button
on a newly detected controller can skip. A skipped splash stays black while its
press is held, consumes release/click events, and waits a complete frame before
handoff. Disconnecting the skipping controller or losing window focus releases
the gate. Missing logo/gamepad support cannot trap the player in startup.

The component caches its startup promise. Normal voyage and engineering resets
stay in their existing game modules and do not replay the splash. A full page
reload is a new application startup and shows it again.
