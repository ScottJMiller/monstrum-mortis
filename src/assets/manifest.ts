import production from './production.json' with { type: 'json' };

export interface AssetDefinition {
  id: string;
  kind: 'texture' | 'creature-part' | 'audio' | 'font' | 'card-frame';
  status: 'planned' | 'ready';
  /** null means not produced yet; never point to imaginary asset files. */
  url: string | null;
  origin: 'original' | 'licensed' | 'generated' | null;
  license: string | null;
  /** Normalized attachment point for creature layers; calibrated with the art. */
  attachment: { x: number; y: number } | null;
}

export const ASSET_MANIFEST_VERSION = '0.2.0';

const planned = (id: string, kind: AssetDefinition['kind']): AssetDefinition => {
  const ready = production.find(a => a.id === id);
  return ready ? {
    id, kind, status: 'ready', url: ready.url, origin: 'generated',
    license: 'Generated project output; applicable OpenAI terms and production details in assets/provenance.json',
    attachment: 'attachment' in ready ? ready.attachment ?? null : null,
  } : { id, kind, status: 'planned', url: null, origin: null, license: null, attachment: null };
};

/** Readiness requires a real selected file and corresponding provenance record. */
export const ASSET_MANIFEST: readonly AssetDefinition[] = [
  planned('lab.chamber', 'texture'),
  planned('lab.iron', 'texture'),
  planned('lab.glass', 'texture'),
  planned('creature.blob', 'creature-part'),
  planned('creature.eyes', 'creature-part'),
  planned('creature.mouth', 'creature-part'),
  planned('card.occult-frame', 'card-frame'),
  planned('font.display', 'font'),
  planned('font.interface', 'font'),
  planned('audio.hum', 'audio'),
  planned('audio.crackle', 'audio'),
  planned('audio.bubbling', 'audio'),
  planned('audio.injection', 'audio'),
  planned('audio.moan', 'audio'),
  planned('audio.growl', 'audio'),
  planned('audio.switch', 'audio'),
  planned('audio.release', 'audio'),
  planned('audio.impact', 'audio'),
  ...[
    'titan-fibers', 'spring-tendons', 'razor-talons', 'guillotine-teeth',
    'ossified-plates', 'auxiliary-heart', 'reweaving-tissue', 'hook-tentacles',
    'venom-glands', 'storm-organ', 'acid-bladder', 'barbed-hide',
    'all-seeing-cluster', 'bellows-lung', 'counterweight-tail', 'funeral-mane',
    'cathedral-horns', 'mourning-veil', 'lantern-eyes', 'ink-bloom',
    'false-halo', 'too-many-smiles', 'kitten-paws', 'candle-flesh',
    'brittle-skeleton', 'wandering-limb', 'tremor-ganglia', 'porcelain-teeth',
    'excessive-viscera', 'existential-organ',
  ].map(id => planned(`mutation.${id}`, 'creature-part')),
  ...['iron-widow', 'gutter-seraph', 'carrion-duke', 'coil-saint', 'maw-engine', 'the-unfinished']
    .map(id => planned(`rival.${id}`, 'creature-part')),
  ...['serrated', 'pulsing', 'branching', 'fuzzy', 'spiral']
    .map(id => planned(`clue.${id}`, 'texture')),
];
