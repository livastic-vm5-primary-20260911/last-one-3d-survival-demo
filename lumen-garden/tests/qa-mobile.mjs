import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {createServer} from "node:http";
import {chromium} from "playwright-core";
const root=path.resolve(import.meta.dirname,"..");
const mapping={"/":"index.html","/index.html":"index.html","/game.js":"game.js","/style.css":"style.css","/favicon.svg":"favicon.svg"};
const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml"};
let requests=0;
const server=createServer((req,res)=>{
 requests++;
 const file=mapping[new URL(req.url,"http://localhost").pathname];
 if(!file){res.writeHead(404).end("not found");return}
 res.setHeader("content-type",mime[path.extname(file)]+"; charset=utf-8");
 res.setHeader("cache-control","no-store");
 res.end(fs.readFileSync(path.join(root,file)));
});
await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve)});
const base="http://127.0.0.1:"+server.address().port;
let browser;let contexts=0;let checked=0;const errors=[];
const qaFolder=path.join(root,"qa");
fs.mkdirSync(qaFolder,{recursive:true});
const sizes=[
 {name:"desktop",width:1200,height:750,deviceScaleFactor:1,isMobile:false,hasTouch:false},
 {name:"portrait",width:390,height:844,deviceScaleFactor:1,isMobile:true,hasTouch:true},
 {name:"landscape",width:896,height:414,deviceScaleFactor:1,isMobile:true,hasTouch:true},
 {name:"compact",width:320,height:568,deviceScaleFactor:1,isMobile:true,hasTouch:true}
];
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/opt/google/chrome/chrome",
  args:["--no-sandbox","--disable-dev-shm-usage","--disable-gpu-sandbox"],timeout:25000});
 for(const sz of sizes){
  const ctx=await browser.newContext({viewport:{width:sz.width,height:sz.height},deviceScaleFactor:sz.deviceScaleFactor,isMobile:sz.isMobile,hasTouch:sz.hasTouch});
  contexts++;
  const page=await ctx.newPage();
  page.on("pageerror",e=>errors.push(sz.name+": "+String(e).slice(0,260)));
  page.on("request",req=>{if(!req.url().startsWith(base))errors.push("external_request "+req.url())});
  const r=await page.goto(base,{waitUntil:"load",timeout:20000});
  assert.equal(r.status(),200);
  await page.waitForFunction(()=>!!window.__LUMEN_GARDEN_STATE__,{timeout:12000});
  const a=await page.evaluate(()=>window.__LUMEN_GARDEN_STATE__());
  assert.equal(a.stage,"menu");assert.equal(a.width,sz.width);assert.equal(a.height,sz.height);
  assert.equal(a.canvasWidth,sz.width);assert.equal(a.canvasHeight,sz.height);
  assert.ok(a.width>a.height === (sz.width>sz.height));
  const text=(await page.locator("body").innerText()).trim().replace(/\s+/g," ");
  assert.equal(text,"LUMEN GARDEN","only title is visibly displayed, got "+text);
  assert.equal(await page.locator("#start").isVisible(),true);
  await page.screenshot({path:path.join(qaFolder,sz.name+"-menu.jpg"),type:"jpeg",quality:72});
  await page.locator("#start").click({timeout:8000});
  await page.waitForTimeout(480);
  const b=await page.evaluate(()=>window.__LUMEN_GARDEN_STATE__());
  assert.equal(b.stage,"playing");
  assert.equal((await page.locator("body").innerText()).trim(),"");
  if(sz.hasTouch){
   const cdp=await ctx.newCDPSession(page);
   const y=Math.round(sz.height*.80);
   await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:sz.width-60,y,id:1}]});
   await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:sz.width-60,y,id:1}]});
   await page.waitForTimeout(350);
   await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
  }else{
   await page.keyboard.down("ArrowRight");
   await page.waitForTimeout(390);
   await page.keyboard.up("ArrowRight");
  }
  const c=await page.evaluate(()=>window.__LUMEN_GARDEN_STATE__());
  assert.ok(c.player>b.player+.035,sz.name+" player should move; "+JSON.stringify({b,c}));
  assert.ok(c.life===3&&c.petals===0,"UI begins with 3 lives and 0 petals");
  assert.ok(c.elapsed>b.elapsed,"animation continues after input");
  const colors=await page.evaluate(()=>{const cv=document.querySelector("canvas");const q=cv.getContext("2d");const d=q.getImageData(Math.round(cv.width*.5),Math.round(cv.height*.25),1,1).data;return [...d]});
  assert.ok(colors[0]+colors[1]+colors[2]>30,sz.name+" game should render visible pixels");
  await page.screenshot({path:path.join(qaFolder,sz.name+"-gameplay.jpg"),type:"jpeg",quality:72});
  checked++;
  await ctx.close();
 }
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({status:"PASS",viewportCases:checked,urlsAndAssetsRequests:requests,errors,mobileTouchQA:3,desktopKeyboardQA:1,screenshotFiles:8,paymentAndExternalCalls:0},null,2));
}catch(err){console.error(JSON.stringify({status:"FAIL",error:String(err.stack||err).slice(0,3400),checked,errors}));process.exitCode=1}
finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
