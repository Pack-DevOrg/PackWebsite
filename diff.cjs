const {PNG}=require('pngjs');const fs=require('fs');
let pm;try{pm=require('pixelmatch');pm=pm.default||pm}catch(e){}
const S='/private/tmp/claude-501/-Users-noahmitsuhashi-Code-PackAll/6923bb0b-34a7-4dc7-8399-a4f55db0aafa/scratchpad';
for(const [g,w] of [['what-pack-does-1','demo-first(Past)'],['what-pack-does-2','demo-present'],['what-pack-does-3','demo-message-stage'],['verify','verify-phone'],]){
 const a=PNG.sync.read(fs.readFileSync(S+'/g390/'+g+'.png')),b=PNG.sync.read(fs.readFileSync(S+'/snaps-web-web/'+g+'-chromium-mobile-darwin.png'));
 if(a.width!==b.width||a.height!==b.height){console.log(w,'size',a.width,a.height,b.width,b.height);continue}
 const n=pm(a.data,b.data,null,a.width,a.height,{threshold:0.2});console.log(w,(n/(a.width*a.height)).toFixed(3));}
