import { useEffect, useState } from 'react';
import { site } from '../config';

export default function EmailContact() {
  const email = site.links.email.replace('mailto:', '');
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (status !== 'copied') return;
    const timeout = window.setTimeout(() => setStatus('idle'), 2500);
    return () => window.clearTimeout(timeout);
  }, [status]);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
  }

  return (
    <span className="email-contact">
      <span>Email: <a href={site.links.email}>{email}</a></span>
      <button type="button" className="copy-email" onClick={copyEmail} aria-label={status === 'copied' ? 'Email copied' : 'Copy email address'} title={status === 'copied' ? 'Copied' : 'Copy email address'}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          {status === 'copied' ? <path d="m5 12 4 4L19 6" /> : <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V4H4v12h4" /></>}
        </svg>
      </button>
      <span role="status" className={status === 'failed' ? 'copy-feedback' : 'sr-only'}>{status === 'copied' ? 'Email address copied.' : status === 'failed' ? 'Please select and copy the email address manually.' : ''}</span>
    </span>
  );
}
