import type { BodySlot, CreatureStats } from '../../shared/types.ts';

import type { AbilityDefinition } from './mechanics.ts';

export interface DnaDefinition {
  id: string;
  autopsyName: string;
  family: 'tactical' | 'cosmetic' | 'liability';
  slot: BodySlot;
  mechanicalIntent: string;
  targets: BodySlot[];
  renderSlot: BodySlot;
  clueId: string;
  deltas: Partial<CreatureStats>;
  abilities: AbilityDefinition[];
}

/** Server-only design catalogue. Executable step 5 catalogue. Client projections never include these effects. */
export const DNA_CATALOGUE: readonly DnaDefinition[] = [
  { id: 'titan-fibers', autopsyName: 'Titan Fibers', family: 'tactical', slot: 'body', mechanicalIntent: 'More melee power; slightly slower', targets: ["body"], renderSlot: "skin", clueId: "clue.c01", deltas: {"power": 4, "agility": -1}, abilities: [] },
  { id: 'spring-tendons', autopsyName: 'Spring Tendons', family: 'tactical', slot: 'lower-limbs', mechanicalIntent: 'Faster movement and attack cadence', targets: ["lower-limbs"], renderSlot: "lower-limbs", clueId: "clue.c02", deltas: {"agility": 3}, abilities: [{"kind": "cadence", "magnitude": 0.08, "unit": "ratio"}] },
  { id: 'razor-talons', autopsyName: 'Razor Talons', family: 'tactical', slot: 'forelimb-left', mechanicalIntent: 'Slashing attack with a brief bleed', targets: ["forelimb-left", "forelimb-right"], renderSlot: "forelimb-left", clueId: "clue.c03", deltas: {"power": 2}, abilities: [{"kind": "bleed", "magnitude": 2, "unit": "damage/second", "lifetimeMs": 3000}] },
  { id: 'guillotine-teeth', autopsyName: 'Guillotine Teeth', family: 'tactical', slot: 'mouth', mechanicalIntent: 'Stronger bite; more vulnerable after a miss', targets: ["mouth"], renderSlot: "mouth", clueId: "clue.c04", deltas: {"power": 4}, abilities: [{"kind": "miss-vulnerability", "magnitude": 0.04, "unit": "ratio"}] },
  { id: 'ossified-plates', autopsyName: 'Ossified Plates', family: 'tactical', slot: 'skin', mechanicalIntent: 'More protection; less speed', targets: ["skin"], renderSlot: "skin", clueId: "clue.c05", deltas: {"protection": 4, "agility": -1}, abilities: [] },
  { id: 'auxiliary-heart', autopsyName: 'Auxiliary Heart', family: 'tactical', slot: 'body', mechanicalIntent: 'More vitality; added instability', targets: ["body"], renderSlot: "appendages", clueId: "clue.c06", deltas: {"vitality": 16, "instability": 3}, abilities: [] },
  { id: 'reweaving-tissue', autopsyName: 'Reweaving Tissue', family: 'tactical', slot: 'skin', mechanicalIntent: 'Slow regeneration', targets: ["skin"], renderSlot: "skin", clueId: "clue.c07", deltas: {"regeneration": 1.5}, abilities: [] },
  { id: 'hook-tentacles', autopsyName: 'Hook Tentacles', family: 'tactical', slot: 'appendages', mechanicalIntent: 'Brief restraint; reduced direct power', targets: ["appendages"], renderSlot: "appendages", clueId: "clue.c08", deltas: {"power": -1}, abilities: [{"kind": "restraint", "magnitude": 0.75, "unit": "seconds"}] },
  { id: 'venom-glands', autopsyName: 'Venom Glands', family: 'tactical', slot: 'mouth', mechanicalIntent: 'Poison attack', targets: ["mouth"], renderSlot: "appendages", clueId: "clue.c09", deltas: {}, abilities: [{"kind": "poison", "magnitude": 2, "unit": "damage/second", "lifetimeMs": 4000}] },
  { id: 'storm-organ', autopsyName: 'Storm Organ', family: 'tactical', slot: 'appendages', mechanicalIntent: 'Electrical strike; extra instability', targets: ["appendages"], renderSlot: "head-growth", clueId: "clue.c10", deltas: {"instability": 4}, abilities: [{"kind": "electric-strike", "magnitude": 5, "unit": "damage"}] },
  { id: 'acid-bladder', autopsyName: 'Acid Bladder', family: 'tactical', slot: 'body', mechanicalIntent: 'Corrosive spit that weakens armor', targets: ["body"], renderSlot: "appendages", clueId: "clue.c11", deltas: {}, abilities: [{"kind": "armor-reduction", "magnitude": 3, "unit": "protection", "lifetimeMs": 4000}] },
  { id: 'barbed-hide', autopsyName: 'Barbed Hide', family: 'tactical', slot: 'skin', mechanicalIntent: 'Limited contact retaliation', targets: ["skin"], renderSlot: "skin", clueId: "clue.c12", deltas: {"protection": 1}, abilities: [{"kind": "contact-retaliation", "magnitude": 2, "unit": "damage"}] },
  { id: 'all-seeing-cluster', autopsyName: 'All-Seeing Cluster', family: 'tactical', slot: 'eyes', mechanicalIntent: 'Better accuracy; less vitality', targets: ["eyes"], renderSlot: "eyes", clueId: "clue.c13", deltas: {"vitality": -8}, abilities: [{"kind": "accuracy", "magnitude": 0.04, "unit": "ratio"}] },
  { id: 'bellows-lung', autopsyName: 'Bellows Lung', family: 'tactical', slot: 'body', mechanicalIntent: 'Roar that briefly delays a rival', targets: ["body"], renderSlot: "skin", clueId: "clue.c14", deltas: {}, abilities: [{"kind": "attack-delay", "magnitude": 0.5, "unit": "seconds"}] },
  { id: 'counterweight-tail', autopsyName: 'Counterweight Tail', family: 'tactical', slot: 'appendages', mechanicalIntent: 'Better balance and resistance to restraint', targets: ["appendages"], renderSlot: "appendages", clueId: "clue.c15", deltas: {"agility": 1}, abilities: [{"kind": "restraint-resistance", "magnitude": 0.1, "unit": "ratio"}] },
  { id: 'funeral-mane', autopsyName: 'Funeral Mane', family: 'cosmetic', slot: 'head-growth', mechanicalIntent: 'Cosmetic; reacts to motion', targets: ["head-growth"], renderSlot: "head-growth", clueId: "clue.c16", deltas: {}, abilities: [] },
  { id: 'cathedral-horns', autopsyName: 'Cathedral Horns', family: 'cosmetic', slot: 'head-growth', mechanicalIntent: 'Cosmetic silhouette', targets: ["head-growth"], renderSlot: "head-growth", clueId: "clue.c17", deltas: {}, abilities: [] },
  { id: 'mourning-veil', autopsyName: 'Mourning Veil', family: 'cosmetic', slot: 'appendages', mechanicalIntent: 'Cosmetic flutter', targets: ["appendages"], renderSlot: "skin", clueId: "clue.c18", deltas: {}, abilities: [] },
  { id: 'lantern-eyes', autopsyName: 'Lantern Eyes', family: 'cosmetic', slot: 'eyes', mechanicalIntent: 'Cosmetic gaze and light', targets: ["eyes"], renderSlot: "eyes", clueId: "clue.c19", deltas: {}, abilities: [] },
  { id: 'ink-bloom', autopsyName: 'Ink Bloom', family: 'cosmetic', slot: 'skin', mechanicalIntent: 'Cosmetic spreading pattern', targets: ["skin"], renderSlot: "skin", clueId: "clue.c20", deltas: {}, abilities: [] },
  { id: 'false-halo', autopsyName: 'False Halo', family: 'cosmetic', slot: 'head-growth', mechanicalIntent: 'Cosmetic oscillation', targets: ["head-growth"], renderSlot: "head-growth", clueId: "clue.c21", deltas: {}, abilities: [] },
  { id: 'too-many-smiles', autopsyName: 'Too Many Smiles', family: 'cosmetic', slot: 'skin', mechanicalIntent: 'Cosmetic twitching and murmurs', targets: ["skin"], renderSlot: "skin", clueId: "clue.c22", deltas: {}, abilities: [] },
  { id: 'kitten-paws', autopsyName: 'Kitten Paws', family: 'liability', slot: 'forelimb-left', mechanicalIntent: 'Replaces talons; less claw damage, better landing recovery', targets: ["forelimb-left", "forelimb-right"], renderSlot: "forelimb-left", clueId: "clue.c23", deltas: {"power": -2}, abilities: [{"kind": "landing-recovery", "magnitude": 0.1, "unit": "ratio"}] },
  { id: 'candle-flesh', autopsyName: 'Candle Flesh', family: 'liability', slot: 'skin', mechanicalIntent: 'Less protection; leaves a slowing slick', targets: ["skin"], renderSlot: "body", clueId: "clue.c24", deltas: {"protection": -4}, abilities: [{"kind": "slowing-slick", "magnitude": 0.1, "unit": "ratio", "lifetimeMs": 2000}] },
  { id: 'brittle-skeleton', autopsyName: 'Brittle Skeleton', family: 'liability', slot: 'body', mechanicalIntent: 'Lower vitality; some speed gain', targets: ["body"], renderSlot: "body", clueId: "clue.c25", deltas: {"vitality": -16, "agility": 2}, abilities: [] },
  { id: 'wandering-limb', autopsyName: 'Wandering Limb', family: 'liability', slot: 'forelimb-right', mechanicalIntent: 'Lower melee power; brief crawling distraction', targets: ["forelimb-right"], renderSlot: "forelimb-left", clueId: "clue.c26", deltas: {"power": -2}, abilities: [{"kind": "crawling-distraction", "magnitude": 0.5, "unit": "seconds"}] },
  { id: 'tremor-ganglia', autopsyName: 'Tremor Ganglia', family: 'liability', slot: 'body', mechanicalIntent: 'Erratic aim; occasional accelerated attack', targets: ["body"], renderSlot: "appendages", clueId: "clue.c27", deltas: {}, abilities: [{"kind": "accuracy", "magnitude": -0.06, "unit": "ratio"}, {"kind": "accelerated-attack", "magnitude": 0.08, "unit": "ratio"}] },
  { id: 'porcelain-teeth', autopsyName: 'Porcelain Teeth', family: 'liability', slot: 'mouth', mechanicalIntent: 'Weaker bite; minor shard retaliation', targets: ["mouth"], renderSlot: "mouth", clueId: "clue.c28", deltas: {"power": -3}, abilities: [{"kind": "shard-retaliation", "magnitude": 1, "unit": "damage"}] },
  { id: 'excessive-viscera', autopsyName: 'Excessive Viscera', family: 'liability', slot: 'body', mechanicalIntent: 'Higher vitality; slower movement', targets: ["body"], renderSlot: "appendages", clueId: "clue.c29", deltas: {"vitality": 12, "agility": -2}, abilities: [] },
  { id: 'existential-organ', autopsyName: 'Existential Organ', family: 'liability', slot: 'body', mechanicalIntent: 'Instability and occasional lost actions', targets: ["body"], renderSlot: "appendages", clueId: "clue.c30", deltas: {"instability": 5}, abilities: [{"kind": "lost-action", "magnitude": 0.06, "unit": "ratio"}] },
];
