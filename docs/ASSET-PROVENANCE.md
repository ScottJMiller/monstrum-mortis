# Step 4 asset provenance and production

The chamber, starter body/eyes/mouth and 30 mutation modules were produced with the built-in OpenAI image-generation tool on 6 October 2026. They are generated project illustrations, not third-party stock or human-painted artwork. No external reference images were supplied; each request used a written production brief. The tool did not expose its underlying model identifier, so no model name is inferred.

Exact prompts, source files, hashes, creator/tool, dimensions, runtime bytes, placement anchors, pivots, layer order, mirroring and optimization instructions are recorded in [assets/provenance.json](../assets/provenance.json). Unchanged selected PNG masters are in [assets/source](../assets/source). The lightweight client render index is [src/assets/production.json](../src/assets/production.json); it excludes prompts, creator metadata and source paths. Same-origin runtime WebP derivatives are in [public/assets/laboratory](../public/assets/laboratory).

The provider's [Terms of Use](https://openai.com/policies/terms-of-use/) were reviewed at production time. They describe rights in generated output between the user and OpenAI, and state that outputs may be similar to other users' outputs. These files are not represented as exclusive artwork or assigned an invented Creative Commons license. Applicable account/service terms continue to govern their use; no third-party asset license is claimed.

## Attachment and render contract

Each transparent module has a calibrated normalized placement within the 600 × 720 creature area, a centered pivot, measured derivative dimensions and a stable render order. Body is the base layer; eyes/mouth and chest growths render above it; tails may sit behind. Forelimb modules support left/right mirroring. Positions and sizes are bounded inside the chamber. These are visual metadata, not mutation selection, replacement, dose, combat or attribution rules.

Every mutation has one produced visual module. Additional authored shape variants are not produced in this milestone. The local renderer draws only the public part list; the server catalogue is never imported. The gallery is a development fixture, not a source of authoritative specimens or hidden DNA previews in the player flow.

All 30 modules were inspected together for style, alpha edges, complete anatomy and recognizable appearances. Runtime attachment combinations can be reviewed at `/art-gallery` with `npm run dev`; this entry is removed from the production bundle. The manifest marks only actual produced files ready. Rival creatures, audio, card frame, bundled fonts and specimen-clue artwork remain planned for later milestones.

## Rebuild optimized derivatives

Requires Python 3 and ImageMagick with WebP support. The original masters are retained unchanged.

```sh
python3 scripts/prepare-art.py --from-masters
npm run check
npm run build
```

The script trims transparent margins for creature modules, scales them to at most 640 × 640, strips metadata and writes quality-82 WebP. Chamber derivatives are 1024 × 1536 at quality 82 and 576 × 864 at quality 78. Exact bytes may differ across ImageMagick versions; this session used ImageMagick 6.9.12-98. It also refreshes provenance measurements and the client render index.

For newly selected built-in outputs, `python3 scripts/prepare-art.py /path/to/local-inventory.json` takes an uncommitted inventory with source paths, exact prompts and render metadata. Do not commit machine-specific generator-output paths. Asset production is offline; the game needs no image-generation service, API key or credential.

## Measured payload

At the completed-art baseline, core chamber/blob artwork is 330,460 bytes for desktop and 186,696 bytes for phones. The 34 main runtime artwork files total 2,226,130 bytes; the phone chamber is an additional derivative. Mutation files load only when selected by a composition or local gallery. Source masters total approximately 68 MB and are not deployed.

All production JavaScript chunks together measure 231,771 bytes gzipped at this baseline; the initial interface chunk is about 84 KB gzipped, with the renderer loaded separately. These are file measurements, not observed Cloudflare transfer or a phone frame-rate benchmark. Runtime source/version changes may alter the figures; rerun the build to obtain current measurements.
