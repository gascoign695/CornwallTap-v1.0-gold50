const fs = require("fs");
const path = require("path");
const vm = require("vm");

const locationsPath = path.resolve(__dirname, "..", "js", "locations.js");
const fallbackPath = path.resolve(__dirname, "locations.js");
const sourcePath = fs.existsSync(locationsPath) ? locationsPath : fallbackPath;

const context = {};
vm.runInNewContext(
    fs.readFileSync(sourcePath, "utf8") + ";globalThis.__locations=locations;",
    context
);
const locations = context.__locations;

const bands = [[1,2],[3,4],[5,6],[7,8],[9,10]];
const excluded = [];
const sameRoundProtect = 27;
const minKm = 15;

const v4Epoch = "2026-10-28";

function seed(t){let s=0;for(let i=0;i<t.length;i++)s=(s*31+t.charCodeAt(i))>>>0;return s;}
function dist(a,b){const R=6371,rad=x=>x*Math.PI/180,dLat=rad(b.lat-a.lat),dLon=rad(b.lon-a.lon);const q=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(q));}
function addDays(key,n){const d=new Date(key+"T00:00:00Z");d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}

function pools(version){return bands.map(([lo,hi])=>locations.filter(x=>x.difficulty>=lo&&x.difficulty<=hi&&!excluded.includes(x.id)).sort((a,b)=>seed(`cornwalltap-${version}-band-${lo}-${hi}-location-${a.id}`)-seed(`cornwalltap-${version}-band-${lo}-${hi}-location-${b.id}`)||a.id-b.id));}
function farEnough(c,ch){return ch.every(x=>dist(c,x)>=minKm);}

const v3History = [
  [136,77,122,125,49],
  [151,102,131,126,50],
  [152,107,134,121,59],
  [175,113,141,123,68],
  [195,158,140,127,79],
  [1,108,139,130,84],
  [2,109,144,137,87],
  [3,120,153,132,89],
  [4,135,154,147,100],
  [5,165,155,148,110],
  [21,176,142,163,111],
  [22,177,156,164,116],
  [23,178,159,149,117],
  [24,181,157,172,119],
  [25,183,160,171,128],
  [26,184,161,170,129],
  [32,185,166,179,133],
  [52,192,167,189,138],
  [57,196,180,199,143],
  [56,6,182,200,145],
  [63,7,188,198,146],
  [65,8,190,13,150],
  [66,9,186,14,162],
  [67,11,197,18,168],
  [73,27,193,36,169],
  [74,28,191,48,173],
  [136,29,12,38,174],
  [98,31,194,70,17]
].map(day => day.map(id => locations.find(x => x.id === id)));

function generateV4(days){
    const p=pools("v4"), recent=[...v3History], out=[];
    for(let day=0;day<days;day++){
        const ch=[];
        for(let r=0;r<5;r++){
            const hist = recent.slice(-sameRoundProtect);
const used = new Set(
    hist.flatMap(day => day).filter(Boolean).map(x => x.id)
);
            const ordered=p[r], start=(day+seed(`v4-round-${r+1}`))%ordered.length;
            let pick=null;
            for(let o=0;o<ordered.length;o++){
                const c=ordered[(start+o)%ordered.length];
                if(used.has(c.id)||ch.some(x=>x.id===c.id)||!farEnough(c,ch))continue;
                pick=c;break;
            }
            if(!pick)throw new Error(`v4 failed ${addDays(v4Epoch,day)} round ${r+1}`);
            ch.push(pick);
        }
        out.push(ch);recent.push(ch);while(recent.length>sameRoundProtect)recent.shift();
    }
    return out;
}

const days=Number(process.argv[2]||365), all=generateV4(days), errors=[];
const history=[...v3History];
for(let d=0;d<all.length;d++){
    const date=addDays(v4Epoch,d), ch=all[d];
    if(new Set(ch.map(x=>x.id)).size!==5)errors.push(`${date}: duplicate within game`);
    for(let r=0;r<5;r++){
        const x=ch[r],[lo,hi]=bands[r];
        if(x.difficulty<lo||x.difficulty>hi)errors.push(`${date}: wrong band round ${r+1}`);
        for(let j=0;j<r;j++)if(dist(x,ch[j])<minKm)errors.push(`${date}: <15 km rounds ${j+1}/${r+1}`);
        const hist = history.slice(-sameRoundProtect);
if(
    hist.some(prev =>
        prev.some(y => y && y.id === x.id)
    )
){
    errors.push(`${date}: global repeat ${x.name}`);
}
    }
    history.push(ch);
}

console.log(`Checked ${days} v4 days (${days*5} rounds). Errors: ${errors.length}`);
if(errors.length)console.log(errors.slice(0,30).join("\n"));
for(let d=0;d<Math.min(days,10);d++)console.log(addDays(v4Epoch,d),all[d].map(x=>`${x.name} [${x.difficulty}]`).join(" | "));
process.exit(errors.length?1:0);
