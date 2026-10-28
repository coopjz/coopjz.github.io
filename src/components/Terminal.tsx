import { useEffect, useState } from 'react';
import { site, type TerminalScriptLine } from '../config';

/** Git branch 图标（内联 SVG，避免依赖 Powerline/Nerd 字体导致访客看到方框） */
function BranchIcon() {
  return (
    <svg viewBox="0 0 16 16" width="0.85em" height="0.85em" fill="currentColor" aria-hidden="true">
      <path d="M11.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zm-2.25.75a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25zM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zM3.5 3.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0z" />
    </svg>
  );
}

/** agnoster 风格分段提示符：段间箭头用 CSS clip-path 绘制 */
function Prompt() {
  const { user, host } = site.terminal;
  return (
    <span className="prompt">
      <span className="seg seg-context">
        {user}@{host}
      </span>
      <span className="arrow arrow-context" />
      <span className="seg seg-dir">~</span>
      <span className="arrow arrow-dir" />
      <span className="seg seg-git">
        <BranchIcon /> main
      </span>
      <span className="arrow arrow-git" />
    </span>
  );
}

function Cursor() {
  return <span className="cursor" />;
}

/** 打字机终端：依次执行 script 中的命令，展示输出，结束后停在闪烁光标 */
export default function Terminal() {
  const script: TerminalScriptLine[] = site.terminal.script;
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [outIdx, setOutIdx] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'output' | 'done'>('typing');

  useEffect(() => {
    if (phase === 'done') return;
    const line = script[lineIdx];

    if (phase === 'typing') {
      if (charIdx <= line.cmd.length) {
        const t = setTimeout(() => setCharIdx((c) => c + 1), 45 + Math.random() * 55);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => {
        setPhase('output');
        setOutIdx(0);
      }, 350);
      return () => clearTimeout(t);
    }

    // phase === 'output'
    if (outIdx < line.output.length) {
      const t = setTimeout(() => setOutIdx((o) => o + 1), 220);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      if (lineIdx + 1 >= script.length) {
        setPhase('done');
      } else {
        setLineIdx((i) => i + 1);
        setCharIdx(0);
        setOutIdx(0);
        setPhase('typing');
      }
    }, 650);
    return () => clearTimeout(t);
  }, [phase, lineIdx, charIdx, outIdx, script]);

  const finished = phase === 'done' ? script : script.slice(0, lineIdx);
  const current = script[lineIdx];

  return (
    <div className="terminal">
      <div className="terminal-header">
        <span className="dot dot-red" />
        <span className="dot dot-yellow" />
        <span className="dot dot-green" />
        <span className="terminal-title">
          zsh — {site.terminal.user}@{site.terminal.host}
        </span>
      </div>
      <div className="terminal-body">
        {finished.map((line, i) => (
          <div key={i}>
            <div className="term-line">
              <Prompt />
              <span className="term-cmd">{line.cmd}</span>
            </div>
            {line.output.map((o, j) => (
              <div key={j} className="term-out">
                {o}
              </div>
            ))}
          </div>
        ))}

        {phase === 'done' ? (
          <div className="term-line">
            <Prompt />
            <Cursor />
          </div>
        ) : (
          <div>
            <div className="term-line">
              <Prompt />
              <span className="term-cmd">{current.cmd.slice(0, charIdx)}</span>
              {phase === 'typing' && <Cursor />}
            </div>
            {current.output.slice(0, outIdx).map((o, j) => (
              <div key={j} className="term-out">
                {o}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
