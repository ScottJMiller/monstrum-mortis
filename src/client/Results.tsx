import type { AwardSummary, ContributionSummary, RoomSnapshot } from '../shared/types.ts';
const AWARDS: Record<string,string>={'instrument-of-ruin':'Instrument of Ruin','keeper-of-the-unkillable':'Keeper of the Unkillable','architect-of-inconvenience':'Architect of Inconvenience','most-questionable-science':'Most Questionable Science','anatomical-liability':'Anatomical Liability','curator-of-the-unnecessary':'Curator of the Unnecessary'};
function Commendations({awards,people}:{awards:AwardSummary[];people:ContributionSummary[]}){
 return <><h3>Personal commendations</h3>{awards.length?<ul>{awards.map(a=><li key={a.awardId}><strong>{AWARDS[a.awardId]}</strong> — {a.recipientIds.map(id=>people.find(p=>p.playerId===id)?.alias??'Former accomplice').join(', ')}{a.recipientIds.length>1?' (shared)':''}</li>)}</ul>:<p>No qualifying commendations were observed.</p>}<p className="note">Evidence records observed activity. It does not assign personal credit for a team victory.</p></>;
}
export function Results({room,playerId}:{room:RoomSnapshot;playerId:string|null}){
 const result=room.result;if(!result)return null;
 const session=room.phase==='session-results', people=session?room.session?.contributions??[]:result.contributions, own=people.find(p=>p.playerId===playerId);
 return <section className="autopsy" aria-label="Authoritative results"><p className="eyebrow">{session?'Session report':'Autopsy / specimen report'}</p><h3>{session?'Three experiments concluded':`${result.outcome[0]!.toUpperCase()+result.outcome.slice(1)} against ${result.rival.name}`}</h3>
  <p>Team score: <strong>{room.teamScore}/300</strong></p>
  {room.session&&<ol className="round-results">{room.session.completed.map(r=><li key={r.battleId}>Round {r.round} · {r.rival.name} · <strong>{r.outcome}</strong></li>)}</ol>}
  <Commendations awards={session?room.session?.awards??[]:result.awards} people={people} />
  {playerId&&<><h4>Your contribution summary</h4>{own?<p>{own.damage.toFixed(1)} attributed damage · {(own.protection+own.healing).toFixed(1)} healing/protection · {own.inconvenience.toFixed(1)} successful interference · {own.liabilityDoses} questionable doses · {own.malfunction.toFixed(1)} malfunction evidence · {own.cosmeticDoses} cosmetic mutations.</p>:<p>No contributions recorded for your seat {session?'in this session':'in this round'}. Late arrivals receive no earlier personal credit.</p>}</>}
  <details open={!session}><summary>Released specimen: final readings and traits</summary><dl className="final-stats">{Object.entries(result.stats).map(([name,value])=><div key={name}><dt>{name}</dt><dd>{value.toFixed(2)}</dd></div>)}</dl><ul className="revealed-traits" tabIndex={0} aria-label="Revealed trait details">{result.traits.map((t,i)=><li key={i}><strong>{t.name}</strong> ({t.status}) — {t.description}</li>)}</ul></details>
 </section>;
}
