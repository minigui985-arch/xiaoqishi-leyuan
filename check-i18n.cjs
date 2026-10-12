/* 原始开发者：不疾不徐 | v0.8.1 十语离线验收 */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const files=['locales/zh-CN.js','locales/en-US.js','locales/ru-RU.js','locales/es-ES.js','locales/de-DE.js','locales/fr-FR.js','locales/pt-BR.js','locales/hi-IN.js','locales/ja-JP.js','locales/ko-KR.js','locales/content.js'];
const context={window:{KNIGHT_LOCALES:{}}};vm.createContext(context);
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const packs=context.window.KNIGHT_LOCALES,codes=['zh-CN','en-US','ru-RU','es-ES','de-DE','fr-FR','pt-BR','hi-IN','ja-JP','ko-KR'];
assert.deepEqual(Object.keys(packs).sort(),codes.slice().sort());
const required=['meta.title','language.label','brand.name','home.learn','nav.play','board.title','pieces.title','moves.title','play.title','theme.child','replay.move','replay.mate','replay.better'];
for(const code of codes){for(const key of required)assert.ok(packs[code].messages[key],`${code} missing ${key}`);assert.ok(packs[code].label);}
for(const code of codes.slice(1)){for(const source of ['国王','王后','车','象','马','兵','十字军步兵','明军火铳手','国际标准赛事规则','邀请好友 · 真人对弈','历史名局 · 行军档案','安装到手机'])assert.ok(packs[code].text[source]||packs['en-US'].text[source],`${code} missing text or English fallback: ${source}`);}
const html=fs.readFileSync('小骑士乐园-统一主题版.html','utf8');let last=-1;for(const file of [...files,'i18n.js']){const index=html.indexOf(`src="${file}"`);assert.ok(index>last,`script order: ${file}`);last=index;}
const runtime=fs.readFileSync('i18n.js','utf8');assert.match(runtime,/select\.id='languageSelect'/);assert.match(runtime,/select\.className='language-select'/);assert.match(html,/utterance\.lang=window\.KnightI18n\.locale/);assert.doesNotMatch(html,/utterance\.lang='zh-CN'/);
const sw=fs.readFileSync('service-worker.js','utf8');for(const file of ['i18n.js',...files])assert.ok(sw.includes(`./${file}`),`offline cache missing ${file}`);
for(const build of ['build-edgeone.cjs','build-release.cjs']){const source=fs.readFileSync(build,'utf8');for(const file of ['i18n.js',...files])assert.ok(source.includes(file),`${build} missing ${file}`);}
console.log('PASS: 10 offline language packs, runtime switch, localized replay voice, offline cache and release packaging.');
