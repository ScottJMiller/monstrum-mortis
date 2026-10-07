import { useEffect, useRef, useState } from 'react';
import type { ControllerSnapshot, RoomSnapshot } from '../shared/types.ts';
import clues from '../assets/specimen-clues.json' with { type: 'json' };

export function DnaController({ room, own, connected, pending, now, inject, unleash }: {
  room: RoomSnapshot; own: ControllerSnapshot; connected: boolean; pending: boolean; now: number;
  inject: (specimenId: string) => void; unleash: () => void;
}) {
  const [selected, select] = useState<string | null>(null);
  const action = useRef<HTMLHeadingElement>(null);
  const previousSelection = useRef<string | null>(null);
  useEffect(() => {
    if (selected && !own.tray.some(s => s.specimenId === selected)) {
      select(null); if (previousSelection.current) action.current?.focus();
    }
    previousSelection.current = selected;
  }, [own.tray, selected]);
  useEffect(() => { select(null); }, [own.attemptId]);
  const me = room.players.find(p => p.playerId === own.playerId);
  const cooldown = Math.max(0, Math.ceil((own.nextInjectionAtMs - now) / 1000));
  const live = connected && room.phase === 'experiment' && !room.recoveryDeadlineMs && !me?.waitingForNextRound && !me?.finishedThisRound && room.phaseDeadlineMs !== null && now < room.phaseDeadlineMs;
  const ready = live && !pending && cooldown === 0;
  const reason = !connected ? 'Reconnect to synchronize your specimens.' : room.recoveryDeadlineMs ? 'Experiment paused for reconnection.' : me?.waitingForNextRound ? 'You are watching until the next experiment.' : own.switchPulled ? 'Your switch is pulled. Remaining doses are forfeited.' : me?.finishedThisRound ? 'Your injections have ended for this experiment.' : room.phase !== 'experiment' ? 'Injections open during the experiment.' : cooldown ? `Cooldown: ${cooldown} seconds.` : pending ? 'Waiting for server confirmation.' : own.remainingDoses === 0 ? 'Six doses spent. Pull the switch when you are ready.' : 'Select a specimen, then press Inject.';
  return <section className="dna-controller" aria-labelledby="specimen-tray-heading">
    <h3 ref={action} tabIndex={-1} id="specimen-tray-heading">Your private specimens</h3>
    <p className="dose-reading">Doses remaining: <strong>{own.remainingDoses}</strong> / 6</p>
    <p id="dna-instructions">{reason}</p>
    <div className="specimen-tray" role="group" aria-label="Choose a private specimen" aria-describedby="dna-instructions">
      {own.tray.map(s => <button type="button" key={s.specimenId} className="specimen-button" aria-pressed={selected === s.specimenId} disabled={!live || pending || own.remainingDoses === 0} onClick={() => select(s.specimenId)}>
        <img src={clues.find(c => c.id === s.clueAssetId)?.url} alt="" /><span>{s.accession}</span><span className="specimen-clue">{s.accessibleClue}</span>
      </button>)}
    </div>
    <button className="primary-injection" disabled={!ready || !selected || own.remainingDoses === 0} onClick={() => { if (selected) inject(selected); }}>Inject selected specimen</button>
    <button className="unleash-switch" disabled={!ready || (me?.injectionsThisRound ?? 0) < 1} onClick={unleash}>Unleash the Creature!</button>
    <p className="note">Unleash permanently ends your injections and forfeits unused doses. Spending all six doses does not pull your switch.</p>
    {pending && <p role="status">Your intention is awaiting confirmation. Your dose and creature change only after acceptance.</p>}
  </section>;
}
