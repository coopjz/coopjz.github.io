import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { site } from '../config';
import { posts } from '../lib/posts';

function Prompt() {
  return <span className="prompt" aria-hidden="true"><span className="prompt-user">{site.terminal.user}@{site.terminal.host}</span><span>:<span className="prompt-path">~</span>$</span></span>;
}

const banner = String.raw`  ____ ___   ___  ____      _ _____
 / ___/ _ \ / _ \|  _ \    | |__  /
| |  | | | | | | | |_) |_  | | / /
| |__| |_| | |_| |  __/| |_| |/ /_
 \____\___/ \___/|_|    \___//____|`;

function Welcome() {
  return (
    <div className="welcome">
      <pre className="ascii-banner" aria-label="coopjz" role="img">{banner}</pre>
      <h1>Welcome to {site.owner.name}'s Homepage!</h1>
      <div className="welcome-divider" aria-hidden="true">----</div>
      <p>{site.owner.name} <span className="text-separator">|</span> {site.owner.tagline}</p>
      <p>{site.owner.undergraduate}</p>
      <p><span className="field-label">Research:</span> {site.owner.bio}</p>
      <div className="welcome-divider" aria-hidden="true">----</div>
      <div className="welcome-contact"><span>Email: <a href={site.links.email}>{site.links.email.replace('mailto:', '')}</a></span><span className="contact-separator" aria-hidden="true"> | </span><span>GitHub: <a href={site.links.github} target="_blank" rel="noreferrer">github.com/{site.owner.handle}</a></span></div>
      <div className="welcome-divider" aria-hidden="true">----</div>
    </div>
  );
}

const commands = ['welcome', 'help', 'whoami', 'about', 'github', 'email', 'ls', 'pwd', 'clear', 'cat about.md', 'cat links', ...(site.features.blog ? ['blog', 'ls ~/blog', 'cd ~/blog'] : [])];
interface Entry { command: string; output: ReactNode }

export default function Terminal() {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const draft = useRef('');
  const input = useRef<HTMLInputElement>(null);
  const transcript = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight;
  }, [entries, showWelcome]);

  function clear() { setEntries([]); setShowWelcome(false); }

  function execute(raw: string) {
    const command = raw.trim();
    if (!command) return;
    const normalized = command.toLowerCase().replace(/\s+/g, ' ');
    setValue('');
    setHistory((previous) => [...previous, command].slice(-100));
    setHistoryIndex(-1);
    draft.current = '';
    let output: ReactNode;
    switch (normalized) {
      case 'welcome': setShowWelcome(true); setEntries([]); return;
      case 'help':
        output = <div className="help-grid">{[
          ['welcome', 'Show welcome'], ['whoami', 'Name & affiliation'], ['about', 'Basic profile'],
          ...(site.features.blog ? [['blog', 'Read the blog']] : []), ['github', 'GitHub profile'], ['email', 'Get in touch'],
          ['ls', 'List files'], ['pwd', 'Current directory'], ['clear', 'Clear terminal'],
        ].map(([cmd, description]) => <span key={cmd}><button type="button" onClick={() => { execute(cmd); input.current?.focus(); }}>{cmd}</button><span>{description}</span></span>)}<p>↑ / ↓ history · Tab autocomplete · Ctrl + L clear</p></div>;
        break;
      case 'whoami': output = `${site.owner.name}\n${site.owner.tagline}\n${site.owner.undergraduate}`; break;
      case 'about': case 'cat about.md': case 'cat about.txt': output = site.owner.about.join('\n'); break;
      case 'github': output = <a href={site.links.github} target="_blank" rel="noreferrer">{site.links.github.replace('https://', '')}</a>; break;
      case 'email': output = <a href={site.links.email}>{site.links.email.replace('mailto:', '')}</a>; break;
      case 'cat links': case 'ls ~/links':
        output = <><a href={site.links.github} target="_blank" rel="noreferrer">{site.links.github.replace('https://', '')}</a><br /><a href={site.links.email}>{site.links.email.replace('mailto:', '')}</a></>; break;
      case 'blog': case 'cd blog': case 'cd ~/blog': case 'cd /blog':
        if (!site.features.blog) { output = 'No such command or directory.'; break; }
        navigate('/blog'); return;
      case 'ls ~/blog': case 'ls blog':
        if (!site.features.blog) { output = 'No such directory.'; break; }
        output = <div className="terminal-posts">{posts.map((post) => <Link key={post.slug} to={`/blog/${post.slug}`}>{post.title}</Link>)}</div>; break;
      case 'ls': output = <div className="terminal-files"><button onClick={() => execute('about')}>about.md</button>{site.features.blog && <button onClick={() => execute('ls ~/blog')}>blog/</button>}<button onClick={() => execute('cat links')}>links</button></div>; break;
      case 'pwd': output = `/home/${site.terminal.user}`; break;
      case 'clear': clear(); return;
      case 'cat': output = 'Usage: cat about.md or cat links'; break;
      default: output = <span>Command not found: {command}. Type <button className="inline-command" onClick={() => execute('help')}>help</button> for available commands.</span>;
    }
    setEntries((previous) => [...previous, { command, output }].slice(-50));
  }

  function submit(event: FormEvent) { event.preventDefault(); execute(value); }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      if (!history.length) return;
      if (historyIndex === -1) draft.current = value;
      const next = event.key === 'ArrowUp' ? Math.min(historyIndex + 1, history.length - 1) : Math.max(historyIndex - 1, -1);
      setHistoryIndex(next);
      setValue(next === -1 ? draft.current : history[history.length - 1 - next]);
    } else if (event.key === 'Tab') {
      const matches = value.trim() ? commands.filter((cmd) => cmd.startsWith(value.toLowerCase())) : [];
      if (matches.length === 1) { event.preventDefault(); setValue(matches[0]); }
    } else if (event.ctrlKey && event.key.toLowerCase() === 'l') {
      event.preventDefault(); clear();
    } else if (event.ctrlKey && event.key.toLowerCase() === 'c') {
      if (window.getSelection()?.toString()) return;
      event.preventDefault(); setValue(''); setHistoryIndex(-1); draft.current = '';
    }
  }

  return (
    <section className="terminal" aria-label="Interactive terminal">
      <div className="terminal-header"><div className="window-dots" aria-hidden="true"><span className="dot dot-red" /><span className="dot dot-yellow" /><span className="dot dot-green" /></div><span className="terminal-title">{site.owner.handle} — zsh</span></div>
      <div className="terminal-body">
        {showWelcome && <><div className="welcome-command"><Prompt /><span>welcome</span></div><Welcome /><p className="help-hint">Type <button onClick={() => { execute('help'); input.current?.focus(); }}>help</button> to see available commands.</p></>}
        <div className="terminal-transcript" ref={transcript} role="log" aria-label="Command history" aria-live="polite" tabIndex={entries.length ? 0 : -1}>
          {entries.map((entry, i) => <div className="terminal-entry" key={i}><div className="history-command"><Prompt /><span>{entry.command}</span></div><div className="term-out">{entry.output}</div></div>)}
        </div>
        <form className="terminal-input-row" onSubmit={submit} onClick={() => input.current?.focus()}>
          <Prompt />
          <input ref={input} aria-label="Terminal command" type="text" value={value} onChange={(event) => { setValue(event.target.value); setHistoryIndex(-1); }} onKeyDown={onKeyDown} autoComplete="off" autoCapitalize="off" spellCheck={false} enterKeyHint="send" />
          <button className="execute-button" type="submit" aria-label="Run command" disabled={!value.trim()}>↵</button>
        </form>
      </div>
    </section>
  );
}
