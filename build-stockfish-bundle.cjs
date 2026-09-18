const fs=require('node:fs'),path=require('node:path');
const root=__dirname,dir=path.join(root,'vendor','stockfish'),js=fs.readFileSync(path.join(dir,'stockfish-18-lite-single.js'),'utf8'),wasm=fs.readFileSync(path.join(dir,'stockfish-18-lite-single.wasm')),target=path.join(dir,'stockfish-18-lite-bundle.js'),factory=path.join(dir,'stockfish-18-lite-factory.js');
fs.writeFileSync(target,'/* Generated from Stockfish.js 18 lite; GPL-3.0, see COPYING. */\nwindow.KNIGHT_STOCKFISH_WASM="'+wasm.toString('base64')+'";\n');
const marker='"object"==typeof document&&document.currentScript?document.currentScript._exports=t():t())';
const bridge='"object"==typeof document&&document.currentScript?document.currentScript._exports=function(config){o=[];n=[];r=config;return t()(r).then(l).then(function(){return r})}:t())';
const factorySource=js.replace(marker,bridge);if(factorySource===js)throw new Error('Stockfish browser marker was not found');
fs.writeFileSync(factory,'/* Generated browser bridge; GPL-3.0, see COPYING. */\n'+factorySource);
console.log(`${path.basename(target)} ${fs.statSync(target).size} bytes; ${path.basename(factory)} ${fs.statSync(factory).size} bytes`);
