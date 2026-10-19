import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {createServer} from "node:http";
import {chromium} from "playwright-core";
const root=path.resolve(import.meta.dirname,"..");
const names={"/":"index.html","/game.js":"game.js","/style.css":"style.css","/favicon.svg":"favicon.svg"};
const server=createServer((req,res)=>{
 const file=names[new URL(req.url,"http://localhost").pathname];
 if(!file){res.writeHead(404).end();return}
 res.end(fs.readFileSync(path.join(root,file)));
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const url="http://127.0.0.1:"+server.address().port;
let browser;const verdicts=[];
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/opt/google/chrome/chrome",args:["--no-sandbox","--disable-dev-shm-usage"],timeout:25000});
 for(const expected of ["win","loss"]){
  const p=await browser.newPage({viewport:{width:390,height:844}});
  await p.addInitScript({content:expected==="win"?"Math.random = () => .5":"Math.random = () => .1"});
  const errors=[];p.on("pageerror",e=>errors.push(String(e)));
  await p.goto(url,{waitUntil:"load",timeout:18000});
  await p.waitForFunction(()=>window.__LUMEN_GARDEN_STATE__);
  await p.locator("#start").click();
  if(expected==="loss"){
   await p.mouse.move(62,650);await p.mouse.down();
   await p.waitForTimeout(330);await p.mouse.up();
  }
  await p.waitForFunction(kind=>window.__LUMEN_GARDEN_STATE__().stage===kind,expected,{timeout:28000});
  await p.waitForTimeout(450);
  const state=await p.evaluate(()=>window.__LUMEN_GARDEN_STATE__());
  assert.equal(state.stage,expected);
  if(expected==="win"){assert.equal(state.petals,12);assert.ok(state.life>0)}
  if(expected==="loss"){assert.equal(state.life,0);assert.ok(state.petals<12)}
  assert.equal((await p.locator("body").innerText()).trim().replace(/\s+/g," "),"LUMEN GARDEN");
  assert.deepEqual(errors,[]);
  await p.screenshot({path:path.join(root,"qa",expected+"-complete.jpg"),type:"jpeg",quality:71});
  verdicts.push({kind:expected,state:"PASS",petals:state.petals,life:state.life,errors:0});
  await p.close();
 }
 console.log(JSON.stringify({status:"PASS",fullRoundOutcomeTest:verdicts,screenshots:2}));
}catch(e){console.error(JSON.stringify({status:"FAIL",error:String(e.stack||e),alreadyPassed:verdicts}));process.exitCode=1}
finally{await browser?.close();await new Promise(ok=>server.close(ok))}
