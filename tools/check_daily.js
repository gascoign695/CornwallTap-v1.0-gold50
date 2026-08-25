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

const bands = [[1,2],[3,4],[5,6],[7,8],[7,10]];
const excluded = [20,45,46,47,50];
const sameRoundProtect = 19;
const r45Protect = 12;
const minKm = 15;
const v3Epoch = "2026-08-14";
const v4Epoch = "2026-08-26";

function seed(t){let s=0;for(let i=0;i<t.length;i++)s=(s*31+t.charCodeAt(i))>>>0;return s;}
function dist(a,b){const R=6371,rad=x=>x*Math.PI/180,dLat=rad(b.lat-a.lat),dLon=rad(b.lon-a.lon);const q=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(q));}
function addDays(key,n){const d=new Date(key+"T00:00:00Z");d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
function dayDiff(key,epoch){return Math.floor((new Date(key+"T00:00:00Z")-new Date(epoch+"T00:00:00Z"))/86400000);}
function pools(version){return bands.map(([lo,hi])=>locations.filter(x=>x.difficulty>=lo&&x.difficulty<=hi&&!excluded.includes(x.id)).sort((a,b)=>seed(`cornwalltap-${version}-band-${lo}-${hi}-location-${a.id}`)-seed(`cornwalltap-${version}-band-${lo}-${hi}-location-${b.id}`)||a.id-b.id));}
function farEnough(c,ch){return ch.every(x=>dist(c,x)>=minKm);}

function generateV3Through(dateKey){
    const p=pools("v3"), target=dayDiff(dateKey,v3Epoch), recent=[], out=[];
    for(let day=0;day<=target;day++){
        const ch=[];
        for(let r=0;r<5;r++){
            const used=new Set(recent.map(c=>c[r]).filter(Boolean).map(x=>x.id));
            const ordered=p[r], start=(day+seed(`v3-round-${r+1}`))%ordered.length;
            let pick=null;
            for(let o=0;o<ordered.length;o++){
                const c=ordered[(start+o)%ordered.length];
                if(used.has(c.id)||ch.some(x=>x.id===c.id)||!farEnough(c,ch))continue;
                pick=c;break;
            }
            if(!pick)throw new Error(`v3 failed ${addDays(v3Epoch,day)} round ${r+1}`);
            ch.push(pick);
        }
        out.push(ch);recent.push(ch);while(recent.length>19)recent.shift();
    }
    return out;
}

const v3History=generateV3Through("2026-08-25");

function generateV4(days){
    const p=pools("v4"), recent=[...v3History], out=[];
    for(let day=0;day<days;day++){
        const ch=[];
        for(let r=0;r<5;r++){
            const hist=r>=3?recent.slice(-r45Protect):recent.slice(-sameRoundProtect);
            const used=new Set((r>=3?hist.flatMap(c=>[c[3],c[4]]):hist.map(c=>c[r])).filter(Boolean).map(x=>x.id));
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
        if(r<3){
            const hist=history.slice(-sameRoundProtect);
            if(hist.some(prev=>prev[r]&&prev[r].id===x.id))errors.push(`${date}: repeat round ${r+1} ${x.name}`);
        }else{
            const hist=history.slice(-r45Protect);
            if(hist.some(prev=>[prev[3],prev[4]].some(y=>y&&y.id===x.id)))errors.push(`${date}: R4/R5 repeat ${x.name}`);
        }
    }
    history.push(ch);
}

console.log(`Checked ${days} v4 days (${days*5} rounds). Errors: ${errors.length}`);
if(errors.length)console.log(errors.slice(0,30).join("\n"));
for(let d=0;d<Math.min(days,10);d++)console.log(addDays(v4Epoch,d),all[d].map(x=>`${x.name} [${x.difficulty}]`).join(" | "));
process.exit(errors.length?1:0);
