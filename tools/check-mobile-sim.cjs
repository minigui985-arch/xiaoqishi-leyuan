const {chromium}=require('C:/Users/asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const cases=[
 ['Huawei',360,780,'Mozilla/5.0 (Linux; Android 14; HUAWEI P60 Pro) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36'],
 ['Samsung',384,854,'Mozilla/5.0 (Linux; Android 14; SM-S9280) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36'],
 ['iPhone-layout',393,852,'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1']
];
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{for(const [name,width,height,userAgent] of cases){const context=await browser.newContext({viewport:{width,height},userAgent,hasTouch:true,isMobile:true}),page=await context.newPage();await page.goto('http://127.0.0.1:8787');await page.evaluate(()=>{go('play');hideGuide();document.querySelector('[data-mode="local"]').click();document.querySelector('#playBoardWrap [data-idx="12"]').click();document.querySelector('#playBoardWrap [data-idx="28"]').click();});console.log(name,await page.evaluate(()=>({moves:battle.history.length,turn:battle.turn,overflow:document.documentElement.scrollWidth>innerWidth})));await context.close();}}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
