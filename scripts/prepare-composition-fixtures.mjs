/** Development only. Apply the real server mutation reducer; emit ONLY its public projection. */
import { writeFileSync } from 'node:fs';
import { newExperiment, applyMutation, publicCreature } from '../src/server/dna-mechanics.ts';
import { DNA_CATALOGUE } from '../src/server/catalogue/dna.ts';
import art from '../src/assets/production.json' with { type: 'json' };
const full=['acid-bladder','ossified-plates','razor-talons','spring-tendons','guillotine-teeth','lantern-eyes','funeral-mane','hook-tentacles'];
const rows=[
 ['starter','Starter blob',[]],
 ['light-claws','Light · paired claws',['razor-talons']],
 ['light-heart','Light · heart and eyes',['auxiliary-heart','all-seeing-cluster']],
 ['light-paws','Light · comic paws',['kitten-paws','porcelain-teeth']],
 ['medium-lung','Moderate · lung and facial features',['bellows-lung','guillotine-teeth','lantern-eyes','cathedral-horns']],
 ['medium-tail','Moderate · tail and surface',['counterweight-tail','titan-fibers','razor-talons','all-seeing-cluster']],
 ['medium-tentacles','Moderate · tentacles and head growth',['hook-tentacles','cathedral-horns','tremor-ganglia','lantern-eyes','venom-glands']],
 ['heavy-all-slots','Heavy · all nine ownership slots',full],
 ['heavy-viscera','Heavy · organs, eyes and mouth',['excessive-viscera','guillotine-teeth','all-seeing-cluster','barbed-hide','kitten-paws','spring-tendons','storm-organ','false-halo']],
 ['heavy-veil','Heavy · veil and chest organ',['auxiliary-heart','mourning-veil','false-halo','porcelain-teeth','lantern-eyes','razor-talons','spring-tendons']],
 ['candle','Full body · candle',['candle-flesh','razor-talons','cathedral-horns','all-seeing-cluster','venom-glands','spring-tendons']],
 ['skeleton','Full body · skeleton',['brittle-skeleton','lantern-eyes','guillotine-teeth','kitten-paws','spring-tendons','hook-tentacles','cathedral-horns']],
 ['two-bodies','Full body · skeleton and candle',['brittle-skeleton','candle-flesh','all-seeing-cluster','guillotine-teeth','razor-talons','spring-tendons','counterweight-tail','false-halo']],
 ['replacement-paws','Claws replaced by kitten paws',['razor-talons','kitten-paws','too-many-smiles']],
 ['asymmetric','Mirrored · one wandering limb',['razor-talons','wandering-limb','existential-organ','ink-bloom','lantern-eyes']],
 ['reinforced','Maximum supported reinforcement',full.flatMap(id=>Array(5).fill(id))],
 ['screenshot-case','Reported crowding · viscera and wandering limb',['excessive-viscera','wandering-limb','lantern-eyes']],
 ['surface','Moderate · surface and mouth',['titan-fibers','too-many-smiles','porcelain-teeth','cathedral-horns']],
];
const build=([id,label,mutations])=>{const e=newExperiment();e.id=`gallery-${id}`;e.compositionSeed=id;const n=mutations.length>12?8:2;mutations.forEach((dna,i)=>applyMutation(e,dna,`reviewer-${i%n}`,`Art review ${i%n+1}`,`${id}-${i}`,i*6000,n));return{id,label,creature:publicCreature(e)};};
const result=[...rows.map(build),...DNA_CATALOGUE.map(d=>build([`single-${d.id}`,d.autopsyName,[d.id]]))];
writeFileSync(new URL('../src/assets/composition-fixtures.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(`Prepared ${result.length} public authoritative compositions; no private state emitted.`);
// The user's Photoshop-style art sheet includes simultaneous parts that replace one another in play.
// These twelve explicit art samplers reproduce its layout without changing server ownership rules.
const referenceRows = [
 ['Starter face', []],
 ['Claws, faint lungs, heart', ['razor-talons','bellows-lung','auxiliary-heart','lantern-eyes','guillotine-teeth']],
 ['Eye cluster, hide, bladder', ['all-seeing-cluster','barbed-hide','acid-bladder']],
 ['Skeleton, legs, porcelain grin', ['brittle-skeleton','spring-tendons','lantern-eyes','porcelain-teeth']],
 ['Horns, many smiles, tail', ['cathedral-horns','too-many-smiles','counterweight-tail']],
 ['Mane and small halo', ['funeral-mane','false-halo','lantern-eyes','guillotine-teeth']],
 ['Raised paws, glands, gaze, hooks', ['kitten-paws','venom-glands','existential-organ','hook-tentacles']],
 ['Storm, wandering limb, ink', ['storm-organ','wandering-limb','ink-bloom','lantern-eyes','guillotine-teeth']],
 ['Veil and titan fibers', ['mourning-veil','titan-fibers']],
 ['Candle and tremor nerves', ['candle-flesh','tremor-ganglia','lantern-eyes','guillotine-teeth']],
 ['Ossified plates', ['ossified-plates']],
 ['Viscera and reweaving tissue', ['excessive-viscera','reweaving-tissue','lantern-eyes','guillotine-teeth']],
];
const reference = referenceRows.map(([label, ids], i) => {
 const selected = ids.map(id => art.find(a => a.id === `mutation.${id}`));
 const replaced = new Set(selected.map(a => a.slot));
 // This art-only cell has no central starter mouth in the user's flattened sheet.
 // Production still projects every received part, including any authoritative starter mouth.
 if(i===4)replaced.add('mouth');
 const assets = [...art.filter(a => a.id.startsWith('creature.') && !replaced.has(a.slot)), ...selected];
 const parts = assets.flatMap(a => (a.mirroredSlots.length && a.id !== 'mutation.wandering-limb' ? ['forelimb-left','forelimb-right'] : [a.id === 'mutation.wandering-limb' ? 'forelimb-right' : a.slot]).map(slot => ({instanceId:`reference-${i}-${a.id}-${slot}`,assetId:a.id,slot,variant:0,scale:1,contributorIds:[]})));
 return {id:`reference-${String(i+1).padStart(2,'0')}`,label:`SJM ${i+1}: ${label}`,creature:{compositionSeed:'reference-art-sampler',parts,revealedMutationIds:[]}};
});
writeFileSync(new URL('../src/assets/reference-compositions.json',import.meta.url),JSON.stringify(reference,null,2)+'\n');
console.log('Prepared 12 definitive-sheet art samplers, explicitly separate from authoritative fixtures.');
