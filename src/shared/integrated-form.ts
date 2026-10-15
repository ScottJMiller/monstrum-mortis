/** Battle v2's sole operative presentation mapping. No hidden effects or catalogue import. */
export const VOTED_FAMILIES = [1,2,3,4,5,'blob'] as const;
export type VotedFamily = typeof VOTED_FAMILIES[number];
export type BodyFamily = VotedFamily;
export type Modifier = 'titan' | 'red' | 'green' | 'barbs' | 'veins' | 'mouths' | 'growth' | 'tremor';
export const INTEGRATED_RULES: Readonly<Record<string, { vote: VotedFamily | null; modifier?: Modifier }>> = Object.freeze({
 'titan-fibers': { vote: null, modifier: 'titan' },
 'spring-tendons': { vote: 1 }, 'razor-talons': { vote: 'blob' }, 'guillotine-teeth': { vote: 1 }, 'ossified-plates': { vote: 1 },
 'auxiliary-heart': { vote: null, modifier: 'red' }, 'reweaving-tissue': { vote: null, modifier: 'green' },
 'hook-tentacles': { vote: 2 }, 'venom-glands': { vote: null }, 'storm-organ': { vote: null }, 'acid-bladder': { vote: null },
 'barbed-hide': { vote: null, modifier: 'barbs' }, 'all-seeing-cluster': { vote: 2 }, 'bellows-lung': { vote: null },
 'counterweight-tail': { vote: 'blob' }, 'funeral-mane': { vote: 5 }, 'cathedral-horns': { vote: 3 }, 'mourning-veil': { vote: 5 },
 'lantern-eyes': { vote: 3 }, 'ink-bloom': { vote: null, modifier: 'veins' }, 'false-halo': { vote: 4 },
 'too-many-smiles': { vote: null, modifier: 'mouths' }, 'kitten-paws': { vote: 3 }, 'candle-flesh': { vote: 4 },
 'brittle-skeleton': { vote: 5 }, 'wandering-limb': { vote: 4 }, 'tremor-ganglia': { vote: null, modifier: 'tremor' },
 'porcelain-teeth': { vote: null }, 'excessive-viscera': { vote: 2 }, 'existential-organ': { vote: null, modifier: 'growth' },
});
export interface IntegratedModifiers { scale: 1 | 1.1; tint: 'none' | 'red' | 'green' | 'combined'; overlay: 'none' | 'barbs' | 'veins' | 'mouths'; growth: boolean; tremor: boolean }
export interface IntegratedForm {
 version: 'battle-v2-b2'; attemptId: string; family: BodyFamily;
 votes: Record<VotedFamily, number>; modifiers: IntegratedModifiers;
 integration: { startsAtMs: number; endsAtMs: number };
}
/** Fixed sRGB palettes, 50% treatment, never injection-order filter composition. */
export const TINT_PALETTES = Object.freeze({ red: [153, 77, 69], green: [91, 133, 82], combined: [137, 116, 68] } as const);
