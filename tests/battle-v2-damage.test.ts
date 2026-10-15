import test from 'node:test';
import assert from 'node:assert/strict';
import { damageFrame } from '../src/client/battle-v2/damage.ts';
import { readFileSync } from 'node:fs';
import type { BattleTimeline } from '../src/shared/types.ts';
const base=JSON.parse(readFileSync('src/assets/battle-v2/fixtures.json','utf8')).fixtures[0].timeline as BattleTimeline;
test('damage starts at exact accepted event timestamps, remains side-specific and persists across recovery without altering input',()=>{
 const events=[['candle-flesh',12000],['wandering-limb',12000],['porcelain-teeth',18000]].map(([id,time],i)=>({...base.events[0]!,sequence:i+1,offsetMs:Number(time),kind:'detach' as const,actor:'team' as const,target:'team' as const,mutationId:String(id),teamHealth:50,rivalHealth:90}));
 events.push({...events[2]!,sequence:4,offsetMs:19000,kind:'regeneration' as never,mutationId:'reweaving-tissue',teamHealth:90});
 const timeline={...base,events};const before=structuredClone(timeline);
 assert.deepEqual(damageFrame(timeline,11999,'team'),{severity:0,melted:false,limbLost:false,teethLost:false});
 assert.deepEqual(damageFrame(timeline,12000,'team'),{severity:1,melted:true,limbLost:true,teethLost:false});
 assert.deepEqual(damageFrame(timeline,18000,'team'),{severity:1,melted:true,limbLost:true,teethLost:true});
 assert.deepEqual(damageFrame(timeline,19000,'team'),{severity:0,melted:true,limbLost:true,teethLost:true});
 assert.deepEqual(damageFrame(timeline,19000,'rival'),{severity:0,melted:false,limbLost:false,teethLost:false});
 assert.deepEqual(timeline,before);assert.deepEqual(damageFrame(timeline,18000,'team'),damageFrame(timeline,18000,'team'));
});
test('damage marks derive from health thresholds, not attack frequency or drawn body anatomy',()=>{
 for(const [health,severity]of [[66,0],[65,1],[30,2],[0,2]]){const timeline={...base,events:[{...base.events[0]!,teamHealth:health,rivalHealth:100}]};assert.equal(damageFrame(timeline,timeline.events[0]!.offsetMs,'team').severity,severity);assert.equal(damageFrame(timeline,timeline.events[0]!.offsetMs,'rival').severity,0);}
});
