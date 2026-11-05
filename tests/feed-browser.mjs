import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:1280,height:900}});
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await fs.mkdir('test-results', {recursive:true});
try {
 await page.goto('http://127.0.0.1:4173/#/feed');
 await page.locator('.feed-card').first().waitFor();
 assert.equal(await page.locator('.feed-card').count(),130);
 await page.screenshot({path:'test-results/feed-desktop.png'});
 for(const [label,kind,count] of [['论文','paper',50],['资讯','news',50],['有趣项目','project',30]]) {
  const button=page.getByRole('button',{name:label,exact:true});
  await button.click(); await button.click();
  assert.equal(await button.getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.feed-card').count(),count);
  assert.ok(page.url().endsWith(`type=${kind}`));
 }
 await page.goBack();
 await page.waitForURL('**type=news');
 assert.equal(await page.getByRole('button',{name:'资讯',exact:true}).getAttribute('aria-pressed'),'true');
 await page.goForward();await page.waitForURL('**type=project');
 await page.reload();await page.locator('.feed-card').first().waitFor();
 assert.equal(await page.locator('.feed-card').count(),30);
 const search=page.getByRole('searchbox');
 await search.fill('zzzz_no_results');
 assert.equal(await page.locator('.feed-card').count(),0);
 assert.equal(await page.getByText('没有匹配内容，试试其他分类或关键词。').isVisible(),true);
 await search.fill('');
 assert.equal(await page.locator('.feed-card').count(),30);
 assert.equal(await page.locator('.feed-warning').isVisible(),true);
 for(const width of [375,320]) {
  await page.setViewportSize({width,height:812});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.getByRole('button',{name:'论文',exact:true}).click();
  assert.equal(await page.locator('.feed-card').count(),50);
  await page.screenshot({path:`test-results/feed-mobile-${width}.png`});
 }
 const firstLink=page.locator('.feed-card h2 a').first();
 assert.ok((await firstLink.getAttribute('href')).startsWith('https://'));
 assert.equal(await firstLink.getAttribute('target'),'_blank');
 await page.route('**/feed.json',route=>route.abort());
 await page.reload();await page.getByRole('alert').waitFor();
 await page.unroute('**/feed.json');
 await page.getByRole('button',{name:'重试'}).click();
 await page.locator('.feed-card').first().waitFor();
 await page.route('**/feed.json',route=>route.fulfill({json:{updatedAt:null,sources:[],items:[]}}));
 await page.reload();await page.getByText('暂无内容。首次成功抓取后将在这里显示真实来源的信息。').waitFor();
 await page.unroute('**/feed.json');
 await page.getByRole('link',{name:'Home',exact:true}).click();
 await page.locator('.terminal').waitFor();
 await page.getByRole('link',{name:'Feed',exact:true}).click();
 await page.locator('.feed-card').first().waitFor();
 assert.deepEqual(errors,[]);
 console.log('PASS: category filters, repeated clicks, Back/Forward, refresh, search/clear, stale warning, empty state, network retry, homepage navigation, HTTPS links, 375px/320px overflow, console errors.');
} finally {await browser.close();}
