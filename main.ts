// Leonida Trophy Atlas — gta6-trophy-guide-01 entry (Node 22, standard library only).
// The guide is the app/ folder beside this file: plain static files a browser opens at
// app/index.html (vanilla JS + CSS, no build step), offline — it loads nothing over the
// network, and its trophy list and guides are app/data/trophies.json. This program hands
// it in: it copies app/ and screenshots/ to /output and writes /output/dossier.json, the
// summary the judge reads, with the vendored make.fun library. Leave
// vendor/makefun-frontend.ts as it is: the scorer requires dossier.json to be byte for
// byte what its own copy writes.
//
// v2: compact scroll-top cover (masthead + audit + filters all in the first frame),
// 6-step cited guide for the cover trophy with a named-sources line, grouped Next Up.
// v3: compressed detail pane + narrower side columns so the cover trophy's full
// cited guide and SOURCES DIFFER dispute box are visible in the 1280x800 cover frame;
// cover trophy is now #17 The Shootist (5 steps + dispute, no warn box) — #28's guide
// plus its LAST CHANCE box cannot fit the frame even fully compressed (measured).
// v4: steps + named-source sidebar side by side on the cover (list column 270px →
// 232px buys the width; the one-line SOURCES line is replaced by a 6-row sidebar:
// site + domain + live-counted claim citations + read date). All 5 steps verbatim
// + full dispute box still in frame — dispute bottom measured at y=776/800.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
console.log(`Leonida Trophy Atlas: app/ + screenshots/ copied to ${out}`);

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the
// others refuse an entry the scorer would refuse (more than 4 screenshots or one over
// 256 KiB; more than 993 files and directories in app/ or 48 MiB of app files).
const dossierPath = join(out, 'dossier.json');
writeFileSync(
  dossierPath,
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
console.log(`dossier.json: ${statSync(dossierPath).size} bytes (cap 1.5 MiB) · ${readdirSync(join(out, 'screenshots')).length} screenshots`);
