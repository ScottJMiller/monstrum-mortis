import { useState } from 'react';

export function InvitationLink({value}:{value:string}) {
 const [notice,setNotice]=useState('');
 async function copy(){
  try { await navigator.clipboard.writeText(value);setNotice('Copied'); }
  catch { setNotice('Select the link below to copy it manually.'); }
 }
 return <div className="invitation-link"><div className="invitation-label"><label htmlFor="player-invitation">Player invitation link</label><button type="button" className="copy-invitation" aria-label="Copy player invitation link" onClick={()=>void copy()}><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M15 8V3H3v13h5"/></svg></button></div><input id="player-invitation" readOnly value={value} onFocus={e=>e.target.select()}/><span className="copy-notice" role="status">{notice}</span></div>;
}
