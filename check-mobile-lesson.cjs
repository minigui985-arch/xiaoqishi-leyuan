/* Mobile-sized exercise regression for the bundled web app. */
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const {chromium}=require('C:/Users/asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pathToFileURL(path.join(__dirname,'mobile/android/app/src/main/assets/public/index.html')).href);
  await page.evaluate(()=>{go('moves');hideGuide();});
  const task=await page.evaluate(()=>({from:movesLesson.pos,to:movesLesson.task.to}));
  await page.locator(`#mvBoardWrap [data-idx="${task.from}"]`).click();
  await page.locator(`#mvBoardWrap [data-idx="${task.to}"]`).click();
  await page.waitForTimeout(550);
  assert.equal(await page.locator(`#mvBoardWrap [data-idx="${task.to}"] .piece`).count(),1);
  assert.equal(await page.locator(`#mvBoardWrap [data-idx="${task.from}"] .piece`).count(),0);
  assert.match(await page.locator('#mvStep').textContent(),/走对了/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.getByRole('button',{name:'使用反馈'}).filter({visible:true}).first().click();
  assert.equal(await page.locator('#feedbackForm [type="submit"]').isVisible(),false);
  assert.equal(await page.getByRole('button',{name:'复制反馈'}).isVisible(),true);
  assert.deepEqual(errors,[]);
  console.log('PASS: Android bundle at phone width shows the moved piece; feedback offers copy instead of a missing API.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

