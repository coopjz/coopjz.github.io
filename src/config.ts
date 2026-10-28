/**
 * 全站个人信息配置 —— 改内容只需编辑这个文件和 src/posts/ 下的 Markdown。
 */

export interface TerminalScriptLine {
  cmd: string;
  output: string[];
}

export const site = {
  title: 'Cedric Luo',
  description: "Cedric Luo's personal website & blog",
  owner: {
    name: 'Cedric Luo',
    tagline: 'Developer · Open Source Enthusiast',
    about: [
      '你好，我是 Cedric。这里是我的个人网站，记录我感兴趣的技术、项目和想法。',
      '把 src/config.ts 里的这段文字换成你自己的介绍即可。',
    ],
  },
  links: {
    github: 'https://github.com/cedricluo',
    email: 'mailto:hi@example.com',
  },
  terminal: {
    user: 'cedric',
    host: 'blog',
    script: [
      { cmd: 'whoami', output: ['Cedric Luo'] },
      {
        cmd: 'cat about.txt',
        output: [
          'Developer · Open Source Enthusiast',
          '写代码，写博客，偶尔开源。',
        ],
      },
      {
        cmd: 'ls ~/links',
        output: ['github.com/cedricluo', 'hi@example.com'],
      },
    ] as TerminalScriptLine[],
  },
};
