# Lumen Garden — original responsive HTML5 mobile arcade

An original, AI-assisted, dependency-free Canvas2D one-touch arcade game authored by VM5 Delivery Lab for a truthful external HTML5 publisher review. This is NOT an awarded commission or proven commercial sale.

The player swipes or uses arrow/A-D keys to move a firefly flower, catch twelve gold blossoms and dodge pink thorns. Three lives; title plus pictographic controls, hearts and energy petals; no other visible in-game text. Full viewport, dynamic high-DPI Canvas2D rendering, touch/mouse/keyboard, landscape and portrait, original geometric artwork, optional WebAudio synthesized sounds. No external images, fonts, analytics, cookie IDs, ads, user login, JavaScript dependencies or network requests.

Start or retry with the large triangular play control. Fullsource accessible only to the original owner. No exclusive IP licence, derivative sublicence or commercial contract is granted to any outside company without separate clear written terms. All generated content is AI-assisted; no fabricated human-only attribution.

When publicly hosted and validated, candidate URL: https://livastic-vm5-primary-20260911.github.io/last-one-3d-survival-demo/lumen-garden/

Target is Famobi's genuine original-game commercial program at https://famobi.com/developers/ . Its linked official submission form https://forms.monday.com/forms/f388b2266952f6a4de05eff0bcd82c1d currently explicitly requires full portrait and landscape, responsive mobile and desktop, dynamic UI, no text except the game title. Acceptance, payment terms, legal payout and whether this game will be bought remain unverified.

No user currency principal, MetaMask gas, wallet signature, capital or subscription spent.
## Reproducible local QA

Use Node 22 or newer and an installed Chrome browser. Run npm ci --include=dev --ignore-scripts, then CHROME_BIN=/path/to/chrome npm test. QA checks desktop, portrait, landscape, compact touch, no external requests, and complete deterministic win and loss rounds. The static game has no npm runtime dependencies. Screenshots stay ignored and local.

## Current observed local QA

2026-10-20 VM5 Chrome: four real browser sizes PASS (desktop 1200x750, mobile portrait 390x844, mobile landscape 896x414, compact 320x568); touch/keyboard controls, Canvas pixels, no external requests, no console errors. Separate deterministic full-match tests PASS for garden complete (12 lights, 3 lives) and game-over (0 lives, no lights). Tests are repeatable with included Playwright dev-only dependency; no monetization or buyer inferred from local QA.
