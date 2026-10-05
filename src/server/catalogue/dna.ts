import type { BodySlot } from '../../shared/types.ts';

export interface DnaDefinition {
  id: string;
  autopsyName: string;
  family: 'tactical' | 'cosmetic' | 'liability';
  slot: BodySlot;
  mechanicalIntent: string;
}

/** Server-only design catalogue. Numerical effects are calibrated in step 5. */
export const DNA_CATALOGUE: readonly DnaDefinition[] = [
  { id: 'titan-fibers', autopsyName: 'Titan Fibers', family: 'tactical', slot: 'body', mechanicalIntent: 'More melee power; slightly slower' },
  { id: 'spring-tendons', autopsyName: 'Spring Tendons', family: 'tactical', slot: 'lower-limbs', mechanicalIntent: 'Faster movement and attack cadence' },
  { id: 'razor-talons', autopsyName: 'Razor Talons', family: 'tactical', slot: 'forelimb-left', mechanicalIntent: 'Slashing attack with a brief bleed' },
  { id: 'guillotine-teeth', autopsyName: 'Guillotine Teeth', family: 'tactical', slot: 'mouth', mechanicalIntent: 'Stronger bite; more vulnerable after a miss' },
  { id: 'ossified-plates', autopsyName: 'Ossified Plates', family: 'tactical', slot: 'skin', mechanicalIntent: 'More protection; less speed' },
  { id: 'auxiliary-heart', autopsyName: 'Auxiliary Heart', family: 'tactical', slot: 'body', mechanicalIntent: 'More vitality; added instability' },
  { id: 'reweaving-tissue', autopsyName: 'Reweaving Tissue', family: 'tactical', slot: 'skin', mechanicalIntent: 'Slow regeneration' },
  { id: 'hook-tentacles', autopsyName: 'Hook Tentacles', family: 'tactical', slot: 'appendages', mechanicalIntent: 'Brief restraint; reduced direct power' },
  { id: 'venom-glands', autopsyName: 'Venom Glands', family: 'tactical', slot: 'mouth', mechanicalIntent: 'Poison attack' },
  { id: 'storm-organ', autopsyName: 'Storm Organ', family: 'tactical', slot: 'appendages', mechanicalIntent: 'Electrical strike; extra instability' },
  { id: 'acid-bladder', autopsyName: 'Acid Bladder', family: 'tactical', slot: 'body', mechanicalIntent: 'Corrosive spit that weakens armor' },
  { id: 'barbed-hide', autopsyName: 'Barbed Hide', family: 'tactical', slot: 'skin', mechanicalIntent: 'Limited contact retaliation' },
  { id: 'all-seeing-cluster', autopsyName: 'All-Seeing Cluster', family: 'tactical', slot: 'eyes', mechanicalIntent: 'Better accuracy; less vitality' },
  { id: 'bellows-lung', autopsyName: 'Bellows Lung', family: 'tactical', slot: 'body', mechanicalIntent: 'Roar that briefly delays a rival' },
  { id: 'counterweight-tail', autopsyName: 'Counterweight Tail', family: 'tactical', slot: 'appendages', mechanicalIntent: 'Better balance and resistance to restraint' },
  { id: 'funeral-mane', autopsyName: 'Funeral Mane', family: 'cosmetic', slot: 'head-growth', mechanicalIntent: 'Cosmetic; reacts to motion' },
  { id: 'cathedral-horns', autopsyName: 'Cathedral Horns', family: 'cosmetic', slot: 'head-growth', mechanicalIntent: 'Cosmetic silhouette' },
  { id: 'mourning-veil', autopsyName: 'Mourning Veil', family: 'cosmetic', slot: 'appendages', mechanicalIntent: 'Cosmetic flutter' },
  { id: 'lantern-eyes', autopsyName: 'Lantern Eyes', family: 'cosmetic', slot: 'eyes', mechanicalIntent: 'Cosmetic gaze and light' },
  { id: 'ink-bloom', autopsyName: 'Ink Bloom', family: 'cosmetic', slot: 'skin', mechanicalIntent: 'Cosmetic spreading pattern' },
  { id: 'false-halo', autopsyName: 'False Halo', family: 'cosmetic', slot: 'head-growth', mechanicalIntent: 'Cosmetic oscillation' },
  { id: 'too-many-smiles', autopsyName: 'Too Many Smiles', family: 'cosmetic', slot: 'skin', mechanicalIntent: 'Cosmetic twitching and murmurs' },
  { id: 'kitten-paws', autopsyName: 'Kitten Paws', family: 'liability', slot: 'forelimb-left', mechanicalIntent: 'Replaces talons; less claw damage, better landing recovery' },
  { id: 'candle-flesh', autopsyName: 'Candle Flesh', family: 'liability', slot: 'skin', mechanicalIntent: 'Less protection; leaves a slowing slick' },
  { id: 'brittle-skeleton', autopsyName: 'Brittle Skeleton', family: 'liability', slot: 'body', mechanicalIntent: 'Lower vitality; some speed gain' },
  { id: 'wandering-limb', autopsyName: 'Wandering Limb', family: 'liability', slot: 'forelimb-right', mechanicalIntent: 'Lower melee power; brief crawling distraction' },
  { id: 'tremor-ganglia', autopsyName: 'Tremor Ganglia', family: 'liability', slot: 'body', mechanicalIntent: 'Erratic aim; occasional accelerated attack' },
  { id: 'porcelain-teeth', autopsyName: 'Porcelain Teeth', family: 'liability', slot: 'mouth', mechanicalIntent: 'Weaker bite; minor shard retaliation' },
  { id: 'excessive-viscera', autopsyName: 'Excessive Viscera', family: 'liability', slot: 'body', mechanicalIntent: 'Higher vitality; slower movement' },
  { id: 'existential-organ', autopsyName: 'Existential Organ', family: 'liability', slot: 'body', mechanicalIntent: 'Instability and occasional lost actions' },
];
