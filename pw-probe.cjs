const {chromium}=require('@playwright/test');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
p.on('pageerror',e=>console.log('PAGEERR',String(e).slice(0,400)));p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text().slice(0,300))});
await p.goto('http://127.0.0.1:4173/onboard');await p.waitForTimeout(5000);await b.close()})();
