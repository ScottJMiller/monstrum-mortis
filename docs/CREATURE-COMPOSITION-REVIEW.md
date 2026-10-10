# Step 5 creature composition review

On 9 October 2026 the user supplied a **2480 × 3508** replacement [definitive contact sheet](visual-reviews/step5-composition/sjm_contact-sheet_definitive.png) and requested another careful pass over every part’s size, independent proportions, stretching and position relative to the blob. This supersedes the earlier lower-resolution calibration. The current reference SHA-256 is `7f43e2eb7a7b96d06dd477fd32e11a2a2f8ce7fdad03a7f8de0c58f84f8c5255`. The supplied replacement is preserved unchanged. Earlier implementation-status entries and screenshots remain historical evidence, rather than being rewritten as current results.

## Composition contract

`creatureLayers` remains a projection of received public parts. It does not choose mutations, restore replaced parts, apply DNA ownership/effects, reveal private state or suppress active instances. Every supported received part produces one layer. All DNA identities, doses, timers, cooldowns, switches, attribution, persistence, admission, matchmaking and the frozen release boundary remain unchanged. No step 6 or deployment is authorized.

The high-resolution pass measures **trimmed image rectangles**, including their translucent edge fringes, rather than guessing dimensions from only the opaque silhouette. `src/assets/reference-calibration.json` records the reference hash, 12 cell crops, original-part transforms, canonical blob frame and review camera. Template registration supplied initial measurements; occluded roots were checked against actual rendered comparisons and visible distal features. Horizontal and vertical dimensions are independent. Obscured parts are registered at the reference’s sampling resolution, masking foreground anatomy; the half-opacity lung fit subtracts the reference blob beneath it. Hook tips and suction cups are independently checked against the resulting rotation/scale. Optional skew supports the slight independently fitted claw pose. Both renderers use the same affine column directions, bounds and real pivot. This corrects the earlier unnecessary flattening of the eyes and porcelain grin, broader hide, short wide plates, shallow veil, compressed thighs, wide mane and individual organ positions. Small original source rotations and left/right asymmetry are retained.

Named sockets and per-part offsets resolve eyes, mouth, shoulders, hips, crown/halo, chest/belly and appendages against the shared 400-unit anatomical frame. Actual trimmed-source pivots anchor scaling and mirroring. The right limb can have its own width, height proportion, rotation and root offset; it is not forced into an approximate symmetric pose. Reinforcement stays rooted. Baseline faces retain their authored proportions; the face cap applies only to additional growth. Transparent facial fringes and organ roots may overlap, as in the reference, while the face stays in front.

The nominal body frame is independent of texture extent. Brittle Skeleton and Candle Flesh now use **deterministic assemblies of the original blob silhouette and original anatomical modules**, with the measured transforms baked into one replacement texture. No new image generation or invented replacement anatomy is used in this pass. Source modules remain unchanged. A taller wax/bone image cannot move the face or limb sockets. Production receives/draws only its authoritative replacement body part; it does not resurrect a separate replaced blob. Server-requested translucent skeleton/candle coexistence is preserved.

Bellows Lung selects the existing isolated lung v2 master at **50% presentation alpha**, matching the clearer reference, multiplied by any server opacity. The original ribbed master and all earlier candidates remain archived. Original Lantern Eyes geometry is restored and color-balanced through a shared sRGB matrix. Starter eyes/mouth and the eye cluster use reference-sampled matrices with unchanged alpha. Color filters inherit the existing bounded renderer resolution, retaining detail on dense displays. Pixi and SVG fallback share the same matrices, pivots, geometry, rotations, mirroring and opacity; filter reuse/disposal remains intact.

Layer order is deliberate: rear hooks and detached growth → body → surface meshes/mantle, attached head growths and the tail graft → organs → limbs → face. Horn and storm-organ roots remain visible over the crown, and the tail graft lies over the flank, as in the reference. The hide’s spines cover the bladder, as in the reference. The veil covers the top of Titan Fibers. Actual rotated corners fit the glass drawing bounds; the former nominal-frame restriction incorrectly shrank raised paws and legs. The adjusted bounds remain bounded, and maximum reinforcement is still fitted without moving roots.

The chamber’s previously edited single upright triangle remains unchanged. There is no new runtime generation, dependency, service, hosting requirement, infrastructure rename or routing change. Manifest **0.3.3** records presentation changes. Protocol 4, rules 0.2.0 and persistence schema 4 remain unchanged.

## All 30 measured parts

Coordinates below are image centers relative to the canonical blob rectangle: `(50, 50)` is its center. Width/height are percentages of that rectangle, **not** percentages of opaque visible pixels. Body-replacement rows describe the original anatomical component inside the assembled texture. These are inspected baseline poses; production additionally projects the server’s reinforcement scale and bounded style descriptors. Paired right-side values are recorded separately in the calibration ledger.

| Part | Center x, y (%) | Width (%) | Height (%) | Rotation | Mirrored source |
| --- | --- | --- | --- | --- | --- |
| Razor Talons (skewed) | 6.2, 64.7 | 31.0 | 51.1 | 5.6° | yes |
| Guillotine Teeth | 53.1, 39.6 | 41.6 | 16.0 | -0.0° | no |
| Lantern Eyes | 52.3, 25.5 | 34.3 | 23.0 | 0.2° | no |
| Bellows Lung | 45.6, 64.5 | 57.3 | 42.0 | 4.9° | no |
| Auxiliary Heart | 69.2, 54.6 | 29.4 | 27.1 | -23.9° | no |
| All Seeing Cluster | 54.1, 26.5 | 50.2 | 24.9 | -0.1° | no |
| Barbed Hide | 52.9, 67.0 | 104.5 | 69.8 | 0.0° | no |
| Acid Bladder | 38.7, 77.1 | 64.5 | 63.4 | -0.1° | no |
| Brittle Skeleton | 51.4, 71.1 | 89.0 | 82.6 | 0.0° | no |
| Spring Tendons | 52.8, 109.4 | 74.5 | 72.0 | 0.0° | no |
| Porcelain Teeth | 53.3, 40.4 | 42.9 | 28.5 | -0.1° | no |
| Cathedral Horns | 52.5, -0.8 | 50.8 | 35.4 | 0.0° | no |
| Too Many Smiles | 53.6, 66.9 | 68.6 | 51.0 | 0.0° | no |
| Counterweight Tail | 102.6, 87.6 | 35.2 | 33.1 | -23.1° | no |
| Funeral Mane | 55.3, 43.3 | 139.9 | 88.6 | 0.0° | no |
| False Halo | 51.7, -2.0 | 36.9 | 14.7 | 0.0° | no |
| Kitten Paws | 5.0, 20.7 | 38.4 | 57.2 | 150.1° | no |
| Hook Tentacles | 8.8, 91.6 | 62.3 | 53.7 | -38.3° | yes |
| Venom Glands | 39.7, 63.0 | 55.0 | 51.5 | 0.4° | no |
| Existential Organ | 71.3, 70.1 | 39.5 | 40.0 | 16.8° | no |
| Storm Organ | 52.8, -3.5 | 52.6 | 48.9 | 0.0° | no |
| Wandering Limb | 93.3, 31.5 | 55.2 | 55.3 | -19.9° | no |
| Ink Bloom | 51.4, 66.2 | 80.8 | 50.4 | 0.0° | no |
| Mourning Veil | 52.7, 57.0 | 97.6 | 47.3 | -0.0° | no |
| Titan Fibers | 52.1, 75.9 | 81.0 | 71.5 | 0.0° | no |
| Candle Flesh | 52.1, 73.7 | 87.7 | 94.6 | 0.0° | no |
| Tremor Ganglia | 53.9, 89.9 | 127.8 | 117.0 | 0.0° | no |
| Ossified Plates | 52.4, 71.9 | 92.0 | 59.1 | -0.1° | no |
| Reweaving Tissue | 50.9, 71.9 | 99.9 | 66.8 | -0.1° | no |
| Excessive Viscera | 41.5, 80.7 | 57.2 | 85.8 | 0.0° | no |

## Reproduction and provenance

```sh
node scripts/prepare-body-art.mjs
python3 scripts/prepare-art.py --from-masters
node scripts/calibrate-composition.mjs
npm run test:composition
node scripts/review-reference-sheet.mjs after
npm run dev
```

Open local `/art-gallery`. Fixture controls are development-only; there is no production debug endpoint. To retain captures under another phase, run `node tests/composition.browser.mjs <phase>` and pass the same phase to `review-reference-sheet.mjs`.

`prepare-body-art.mjs` uses SVG affine composition of original generated masters and the existing Sharp dependency, then records component hashes, source transforms, view box and the reference hash. Selected replacement masters are `mutation.brittle-skeleton-v3.png` and `mutation.candle-flesh-v3.png`. The originals and previously generated v2 candidates remain intact. `assets/provenance.json` retains their original generation prompts/terms and the selected assembly history; current assembly instructions are explicitly identified as assembly, rather than new generation. `prepare-art.py --from-masters` preserves authored canvas extents for these assemblies, uses the established maximum 640px modules/WebP quality 82, and retains both chamber derivatives. `calibrate-composition.mjs` converts inspected cell transforms into stable body-relative roots, using the real anatomical layout.

Main selected raster derivative bytes are recorded in the implementation status; the phone chamber adds **91,288 bytes**. Production JavaScript gzip size is recorded in the implementation status. These are file measurements, not network/GPU/frame-rate measurements.

The gallery contains **48 actual-server public compositions** (30 singles and 18 representative light/moderate/heavy, all-slot, replacement, asymmetric and maximum-reinforcement cases) plus **12 explicitly labeled art samplers** for the sheet. The sheet includes some mechanically competing parts and omits the central starter mouth in cell 5. Its art sampler reproduces those choices solely for visual review. Production continues to draw every received part and does not change any ownership or starter-mouth rule to imitate an unreachable sheet combination.

Retained artifacts:

- [Current high-resolution user reference](visual-reviews/step5-composition/sjm_contact-sheet_definitive.png)
- [Before this higher-resolution pass](visual-reviews/step5-composition/pre-hires-rendered-contact-sheet.png)
- [Current rendered contact sheet](visual-reviews/step5-composition/hires-rendered-contact-sheet.png)
- [All 12 reference/render comparisons](visual-reviews/step5-composition/hires-reference-render-comparison-sheet.png)
- [Current gameplay-reachable compositions](visual-reviews/step5-composition/hires-authoritative-contact-sheet.png)
- Full-resolution individual reference/render pairs are in `visual-reviews/step5-composition/hires-pairs`.
- [Original reported creature](visual-reviews/step5-composition/before.png) and the earlier [chamber-seal comparison](visual-reviews/step5-composition/chamber-emblem-before-after.png) remain available.

Earlier `definitive-*`, `after.png` and `contact-sheet.png` show earlier refinements. Running a phase named `before` now does not reconstruct the old renderer; the preserved files are the evidence.

## Verification and limits

Actual commands and results are recorded in [IMPLEMENTATION-STATUS.md](IMPLEMENTATION-STATUS.md). The current visual check captures all 60 compositions at device scale factor 2, desktop/phone portrait/landscape/display, animated/reduced-motion and forced static fallback. It checks received-instance completeness, bounded textures, page errors/overflow, root/rotated DOM geometry and all 12 canvas/static comparisons. Separate high-resolution contact sheets and 12 reference/render pairs come from **real renderer screenshots**. They were visually inspected; automated assertions alone do not establish artistic quality.

Twelve focused composition tests cover rooted growth/fitting/mirroring, independent paired poses, skewed root/bounds behavior and three visible reference hook landmarks, canonical body frames versus texture extents, baseline facial proportions, foreground facial readability, complete public projection, replacements, opacity multiplication and alpha-preserving color grades. Existing gameplay/client tests remain in the suite.

The reference is a flattened image, without editable layers or exact original color/alpha edits. Geometry and silhouette were calibrated to its visible parts, but **pixel-identical color, edge resampling and hidden occluded pixels are not claimed**. Each mutation still has one authored raster pose. Fine graft/nerve detail remains small on phones; some roots are intentionally hidden by the body. All requested representative cases were inspected, rather than every possible mutation sequence. Physical phones/TVs, Safari/Firefox, manual screen readers and GPU/frame-rate measurements remain outstanding. No deployment, combat, awards, later-round progression or tarot export occurred.
