/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 | 许可状态见 COPYRIGHT */
let galleryFaction='w';
const MING_MOTTOS={
 p:'我是明军火铳手，向前直走不后退，斜前一格吃对手，起步还能走两格！',
 r:'我是红衣大炮，沿着横线、竖线行进，前路畅通走多格，不拐弯，也不越子！',
 n:'我是明军骑兵，策马走个日字形，还能跃过其他棋子！',
 b:'我是手持笏板的明军文臣，沿斜线运筹，一路不越子，始终行于同色格！',
 q:'我是头戴凤冠的皇后，横线、竖线、斜线都能走，前路畅通行多格！',
 k:'我是身着龙袍的皇帝，四面八方走一格，避开攻击护好自己，被将军时要解围！'
};
const FACTIONS={
 w:{name:'十字军',roles:{p:'十字军步兵',r:'十字军要塞',n:'十字军骑士',b:'十字军主教',q:'十字军王后',k:'十字军国王'},details:{p:'桶盔、锁子甲、十字胸纹、鸢形盾与单手剑。',r:'石墙城垛、拱形十字门与十字战旗。',n:'骑士桶盔、骑枪与带十字纹的战马甲。',b:'主教冠、十字法袍、牧杖与圣经。',q:'十字王冠、贵族长裙、权杖与披风。',k:'十字王冠、大十字王袍与加冕宝剑。'}},
 b:{name:'明军',roles:{p:'明军火铳手',r:'红衣大炮',n:'明军骑兵',b:'明军文臣',q:'明军皇后',k:'明军皇帝'},details:{p:'斗笠盔、鸳鸯战袄、火铳、腰刀与方盾。',r:'炮管、炮架、双轮与点火烟雾。',n:'凤翅盔、红缨、中式鞍、马铃与三眼铳。',b:'带帽翅的乌纱帽、圆领补服、笏板与三绺长髯。',q:'凤凰凤冠、博鬓垂珠、翟衣、披帛、团扇与步摇。',k:'翼善冠、龙纹衮服、玉带、玉圭与披风。'}}
};
const RULE_TEXT={k:'国王每次向任意方向走一格，不能走进受攻击的格子。被将军且无法解围称为将杀；国王不会被实际吃掉。',q:'王后沿横线、竖线或斜线移动任意格，不能越过其他棋子。',r:'车沿横线或竖线移动任意格，不能越子。两方造型不同，走法完全相同。',b:'象沿斜线移动任意格，不能越子；始终停留在同一种颜色的格子。',n:'马走日字：一个方向两格，再垂直一格，可以越过其他棋子。',p:'兵向前直走、斜向前吃子；初始位置可前进两格。到达底线可升变，本教学版本暂自动升后。'};
function characterArt(type,color){
 const mode=window.__chessSkinMode==='adult'?'adult':'child';
 const i=['p','r','n','b','q','k'].indexOf(type);
 // Viewports reuse original concept sheets without altering the raster originals.
 const top=0;
 const split=mode==='adult'?490:508;
 const x=(i%3)*512,y=i<3?top:split;
 const height=i<3?split:1024-split;
 return `<svg class="character-art" data-character="${type}" data-color="${color}" viewBox="0 0 512 ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${FACTIONS[color].roles[type]}"><svg width="512" height="${height}" viewBox="${x} ${y} 512 ${height}" overflow="hidden"><image href="assets/${mode}_${color}_keyed.png" filter="url(#spriteChroma)" width="1536" height="1024"/></svg></svg>`;
}
function applyWorldTheme(){
 const adult=window.__chessSkinMode==='adult';
 document.documentElement.dataset.theme=adult?'adult':'child';
 const btn=$('#skinBtn');btn.textContent=adult?'成人 · 切换':'儿童 · 切换';
 btn.title=adult?'切换为儿童整体主题':'切换为成人整体主题';btn.setAttribute('aria-label',btn.title);btn.setAttribute('aria-pressed',String(adult));
 $('#worldTitle').textContent=adult?'以棋会友，观两方风华':'两支小队，一起学棋';
 $('#worldSubtitle').textContent=adult?'十字军的盾徽，明军的冠服。从规则走向对弈。':'从第一步开始，与十字军和明军小伙伴一起成长。';
 $('#westHero').innerHTML=pieceSVG('n','w');$('#eastHero').innerHTML=pieceSVG('n','b');
 const quote=$('.home-quote');quote.innerHTML=adult?'<b>学棋有序</b> · 认识棋盘，理解子力，再在实战中练习。两方文化服饰，共用同一套国际象棋规则。':'<b>小骑的约定</b> · 先认识棋盘，再认识伙伴。完成练习点亮星星，让十字军和明军陪你一起进步！';
 if($('#conceptDialog').open) updateConceptImage();
}
function updateConceptImage(){
 const color=$('#conceptDialog').dataset.faction||galleryFaction;
 const adult=window.__chessSkinMode==='adult';
 $('#conceptImage').setAttribute('href',`assets/${adult?'adult':'child'}_${color}_keyed.png`);
 $('#conceptTitle').textContent=`${adult?'成人写实':'儿童Q版'} · ${FACTIONS[color].name}六类棋子原画`;
}
function openConcept(color){$('#conceptDialog').dataset.faction=color;updateConceptImage();$('#conceptDialog').showModal();}
function setGalleryFaction(color){
 galleryFaction=color;
 $$('button[data-faction]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.faction===color)));
 renderGallery();showPieceDetail(piecesLesson.active||'p');
}
function initWorldUI(){
 $$('[data-realm]').forEach(b=>b.addEventListener('click',()=>{go('pieces');setGalleryFaction(b.dataset.realm);}));
 $$('button[data-faction]').forEach(b=>b.addEventListener('click',()=>setGalleryFaction(b.dataset.faction)));
 $('#learnNow').addEventListener('click',()=>go('board'));
 $('#exploreNow').addEventListener('click',()=>go('pieces'));
 $('#closeConcept').addEventListener('click',()=>$('#conceptDialog').close());
 $('#conceptDialog').addEventListener('click',e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.currentTarget.close();}});
 $('#conceptImage').addEventListener('error',()=>{ $('#conceptTitle').textContent='原画加载失败，请确认 assets 文件夹与 HTML 位于同一目录'; });
}

