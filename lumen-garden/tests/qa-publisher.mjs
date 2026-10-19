import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {createServer} from "node:http";
import {chromium} from "playwright-core";
const root=path.resolve(import.meta.dirname,"..");
const allow=new Map([
 ["/publisher.html",["publisher.html","text/html"]],
 ["/index.html",["index.html","text/html"]],
 ["/",["index.html","text/html"]],
 ["/game.js",["game.js","text/javascript"]],
 ["/style.css",["style.css","text/css"]],
 ["/favicon.svg",["favicon.svg","image/svg+xml"]],
 ...["desktop-gameplay.jpg","portrait-gameplay.jpg","landscape-gameplay.jpg"].map(x=>["/publisher-images/"+x,["publisher-images/"+x,"image/jpeg"]])
]);
const server=createServer((req,res)=>{
 const p=new URL(req.url,"http://localhost").pathname;
 if(!allow.has(p)){res.writeHead(404).end();return}
 const [filename,mime]=allow.get(p);
 res.setHeader("Content-Type",mime);
 res.end(fs.readFileSync(path.join(root,filename)));
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const base="http://127.0.0.1:"+server.address().port;
let browser;
const passed=[],problems=[];
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/opt/google/chrome/chrome",args:["--no-sandbox","--disable-dev-shm-usage"],timeout:25000});
 for(const view of [{name:"desktop",width:1200,height:800},{name:"mobile",width:390,height:844}]){
  const page=await browser.newPage({viewport:{width:view.width,height:view.height}});
  page.on("pageerror",e=>problems.push(String(e)));
  page.on("request",req=>{if(!req.url().startsWith(base))problems.push("external request: "+req.url())});
  const resp=await page.goto(base+"/publisher.html",{waitUntil:"networkidle",timeout:15000});
  assert.equal(resp.status(),200);
  assert.match(await page.title(),/Lumen Garden/);
  const headings=await page.locator("h1").allTextContents();
  assert.match(headings.join(""),/Lumen/);
  assert.match(await page.locator("body").innerText(),/\$95/);
  assert.match(await page.locator("body").innerText(),/Non-exclusive game licensing/);
  assert.match(await page.locator("body").innerText(),/No payment is collected on this page/);
  assert.match(await page.locator("body").innerText(),/not an incorporated game publisher/);
  assert.match(await page.locator("body").innerText(),/signed publisher agreements/);
  assert.match(await page.locator("body").innerText(),/AI-assisted/);
  assert.equal(await page.locator("a[href^='mailto:onecursora1@gmail.com']").count(),2);
  assert.equal(await page.locator("a[href^='https://docs.google.com/forms/']").count(),1);
  assert.equal(await page.locator("a[href='./']").count(),3);
  assert.equal(await page.locator("img[src^='./publisher-images/']").count(),4);
  const images=await page.locator("img[src^='./publisher-images/']").evaluateAll(imgs=>imgs.map(i=>({loaded:i.complete&&i.naturalWidth>0,alt:!!i.alt})));
  assert.ok(images.every(x=>x.loaded&&x.alt));
  const dim=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth,height:innerHeight}));
  assert.ok(dim.width<=dim.viewport+2,"unexpected sideways overflow "+JSON.stringify(dim));
  assert.equal(await page.locator("script:not([type='application/ld+json'])").count(),0,"no executable browser JavaScript is used on seller proposal");
  const jsonLd=await page.locator("script[type='application/ld+json']").textContent();
  const structured=JSON.parse(jsonLd);
  assert.equal(structured["@type"],"WebPage");
  assert.equal(structured.about.isAccessibleForFree,true);
  assert.equal(await page.locator("link[rel='canonical']").getAttribute("href"),"https://livastic-vm5-primary-20260911.github.io/last-one-3d-survival-demo/lumen-garden/publisher.html");
  assert.match(await page.locator("meta[property='og:title']").getAttribute("content"),/Lumen Garden/);
  assert.deepEqual(problems,[]);
  passed.push({name:view.name,html200:true,licensePrice95Visible:true,imagesLoaded4:true,noOutboundHttp:true,privacyNoExecutableScript:true,contactWorks:true,overflowFalse:true});
  await page.close();
 }
 console.log(JSON.stringify({status:"PASS",commercialLandingQA:passed,actualBuyerContracts:0,revenueCreditUSDC:0},null,2));
}catch(e){console.error(JSON.stringify({status:"FAIL",error:String(e.stack||e).slice(0,2200),passed,problems}));process.exitCode=1}
finally{await browser?.close();await new Promise(ok=>server.close(ok))}
