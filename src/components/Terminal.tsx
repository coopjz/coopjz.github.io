import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { site } from '../config';
import { posts } from '../lib/posts';
import avatar from '../../public/avatar.txt?raw';
import EmailContact from './EmailContact';

function Prompt() {
  return <span className="prompt" aria-hidden="true"><span className="prompt-user">{site.terminal.user}@{site.terminal.host}</span><span>:<span className="prompt-path">~</span>$</span></span>;
}

function Welcome() {
  const [degree, university] = site.owner.undergraduate.split(' @ ');

  return (
    <div className="welcome">
      <pre className="ascii-avatar" aria-label="Character portrait of Junzhe Wang, based on his GitHub avatar" role="img">{avatar.trimEnd().split('\n').map((line, index) => <span className={index >= 19 ? 'avatar-shirt' : undefined} key={index}>{line}{'\n'}</span>)}</pre>
      <div className="welcome-profile">
        <h1>Welcome to {site.owner.name}'s Homepage!</h1>
        <div className="welcome-divider" aria-hidden="true">----</div>
        <p>{site.owner.name} <span className="text-separator">|</span> {site.owner.tagline}</p>
        <p className="education-line"><span>{degree}</span>{' '}<span>@ {university}</span></p>
        <p><span className="field-label">Research:</span> {site.owner.bio}</p>
        <div className="welcome-divider" aria-hidden="true">----</div>
        <div className="welcome-contact"><EmailContact /><span className="contact-separator" aria-hidden="true"> | </span><span>GitHub: <a href={site.links.github} target="_blank" rel="noreferrer">github.com/{site.owner.handle}</a></span></div>
        <div className="welcome-divider" aria-hidden="true">----</div>
      </div>
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
  const [completions, setCompletions] = useState<string[]>([]);
  const draft = useRef('');
  const input = useRef<HTMLInputElement>(null);
  const transcript = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight;
  }, [entries, showWelcome]);

  function clear() { setEntries([]); setShowWelcome(false); setCompletions([]); }

  function focusOnBlankClick(event: MouseEvent<HTMLDivElement>) {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('a, button, input, pre, [role="log"]') || window.getSelection()?.toString()) return;
    input.current?.focus({ preventScroll: true });
  }

  function complete(command: string) {
    setValue(command);
    setCompletions([]);
    setHistoryIndex(-1);
    input.current?.focus({ preventScroll: true });
  }

  function execute(raw: string) {
    const command = raw.trim();
    if (!command) return;
    input.current?.focus({ preventScroll: true });
    setCompletions([]);
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
        ].map(([cmd, description]) => <span key={cmd}><button type="button" onClick={() => execute(cmd)}>{cmd}</button><span>{description}</span></span>)}<p>↑ / ↓ history · Tab autocomplete · Esc dismiss / reset · Ctrl + L clear</p></div>;
        break;
      case 'whoami': output = `${site.owner.name}\n${site.owner.tagline}\n${site.owner.undergraduate}`; break;
      case 'about': case 'cat about.md': case 'cat about.txt': output = site.owner.about.join('\n'); break;
      case 'github': output = <a href={site.links.github} target="_blank" rel="noreferrer">{site.links.github.replace('https://', '')}</a>; break;
      case 'email': output = <EmailContact />; break;
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
      setCompletions([]);
      if (!history.length) return;
      if (historyIndex === -1) draft.current = value;
      const next = event.key === 'ArrowUp' ? Math.min(historyIndex + 1, history.length - 1) : Math.max(historyIndex - 1, -1);
      setHistoryIndex(next);
      setValue(next === -1 ? draft.current : history[history.length - 1 - next]);
    } else if (event.key === 'Tab') {
      if (event.shiftKey) return;
      const prefix = value.trimStart().toLowerCase().replace(/\s+/g, ' ');
      const matches = prefix.trim() ? commands.filter((cmd) => cmd.startsWith(prefix)) : [];
      if (matches.length) {
        event.preventDefault();
        if (matches.length === 1) complete(matches[0]);
        else {
          const shared = matches.reduce((common, cmd) => {
            let length = 0;
            while (length < common.length && common[length] === cmd[length]) length++;
            return common.slice(0, length);
          });
          setValue(shared);
          setCompletions(matches);
          setHistoryIndex(-1);
        }
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      if (completions.length) setCompletions([]);
      else { setValue(''); setHistoryIndex(-1); draft.current = ''; }
    } else if (event.ctrlKey && event.key.toLowerCase() === 'l') {
      event.preventDefault(); clear();
    } else if (event.ctrlKey && event.key.toLowerCase() === 'c') {
      if (window.getSelection()?.toString()) return;
      event.preventDefault(); setValue(''); setCompletions([]); setHistoryIndex(-1); draft.current = '';
    }
  }

  return (
    <section className="terminal" aria-label="Interactive terminal">
      <div className="terminal-header"><div className="window-dots" aria-hidden="true"><span className="dot dot-red" /><span className="dot dot-yellow" /><span className="dot dot-green" /></div><span className="terminal-title">{site.owner.handle} — zsh</span></div>
      <div className="terminal-body" onClick={focusOnBlankClick}>
        {showWelcome && <><div className="welcome-command"><Prompt /><span>welcome</span></div><Welcome /><p className="help-hint">Type <button onClick={() => { execute('help'); input.current?.focus(); }}>help</button> to see available commands.</p></>}
        <div className="terminal-transcript" ref={transcript} role="log" aria-label="Command history" aria-live="polite" tabIndex={entries.length ? 0 : -1}>
          {entries.map((entry, i) => <div className="terminal-entry" key={i}><div className="history-command"><Prompt /><span>{entry.command}</span></div><div className="term-out">{entry.output}</div></div>)}
        </div>
        {completions.length > 0 && <div className="terminal-completions" role="group" aria-label="Command suggestions">{completions.map((command) => <button type="button" key={command} onClick={() => complete(command)}>{command}</button>)}</div>}
        <form className="terminal-input-row" onSubmit={submit} onClick={() => input.current?.focus()}>
          <Prompt />
          <input ref={input} aria-label="Terminal command" type="text" value={value} onChange={(event) => { setValue(event.target.value); setCompletions([]); setHistoryIndex(-1); }} onKeyDown={onKeyDown} autoComplete="off" autoCapitalize="off" spellCheck={false} enterKeyHint="send" />
          <button className="execute-button" type="submit" aria-label="Run command" disabled={!value.trim()}>↵</button>
        </form>
      </div>
    </section>
  );
}
