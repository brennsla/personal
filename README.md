# personal
For personal tests

## SUV Challenge — illustrated São Paulo edition

Browser-based Three.js racing game with a dense hilly city, a flat racing corridor,
nine vehicle choices, qualifying, day/night lighting, rain and turbo effects.
This project opens the latest illustrated game at `/`, not the older prototype.

### Local development

Use Node.js 22.12 or newer. Run `npm install`, then `npm run dev`.
Build with `npm run build`; inspect the production build with `npm run preview`.
The production website is generated in `dist/`.

### Vercel

Import `brennsla/personal` and use the repository root directory.
The included `vercel.json` selects Vite, `npm install`, `npm run build` and `dist`.
No environment variables or backend are required. Rendering runs on the player's
device; hosting does not reduce the game's graphics requirements.

### Assets

See `ASSET-CREDITS.md`, `ENVIRONMENT-CREDITS.md`, `IMPORTED-CAR-PACK.md`
and `licenses/`. Third-party assets retain their individual licenses; this
repository does not grant a blanket license to redistribute them.
The six CGTrader pack vehicles were supplied by the project owner; their
redistribution terms have not been independently verified.
Bus and van: Free Low Poly Vehicles Pack by Rgsdev (Raphael Gonçalves), CC0,
https://opengameart.org/content/free-low-poly-vehicles-pack.

Source is limited to the production module graph, illustrated roster and terrain
city. Old standalone builds, unused models, raw import archives and dependencies
are deliberately excluded. Historical credit documents also mention earlier
assets which are not included in this upload.
