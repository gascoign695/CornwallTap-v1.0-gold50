const fs = require("fs");
const vm = require("vm");
const context = {};
vm.runInNewContext(fs.readFileSync("locations.js", "utf8") + ";globalThis.__locations=locations;", context);
const locations = context.__locations;
const bands=[[1,2],[3,4],[5,6],[7,8],[7,10]], excluded=[20,45,46,47,50];
const protect=19, minKm=15, epoch="2026-08-14", version="v3";
function seed(t){let s=0;for(let i=0;i<t.length;i++)s=(s*31+t.charCodeAt(i))>>>0;return s;}
function dist(a,b){const R=6371,rad=x=>x*Math.PI/180,dLat=rad(b.lat-a.lat),dLon=rad(b.lon-a.lon);const q=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(q));}
const pools=bands.map(([lo,hi])=>locations.filter(x=>x.difficulty>=lo&&x.difficulty<=hi&&!excluded.includes(x.id)).sort((a,b)=>seed(`cornwalltap-${version}-band-${lo}-${hi}-location-${a.id}`)-seed(`cornwalltap-${version}-band-${lo}-${hi}-location-${b.id}`)||a.id-b.id));
function key(n){let d=new Date(epoch+"T00:00:00Z");d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
function generate(days){let recent=[], out=[];for(let day=0;day<days;day++){let ch=[];for(let r=0;r<5;r++){let used=new Set(recent.map(c=>c[r]).filter(Boolean).map(x=>x.id));let p=pools[r], start=(day+seed(`${version}-round-${r+1}`))%p.length, pick=null;for(let o=0;o<p.length;o++){let c=p[(start+o)%p.length];if(used.has(c.id)||ch.some(x=>x.id===c.id)||ch.some(x=>dist(c,x)<minKm))continue;pick=c;break;}if(!pick)throw new Error(`FAIL ${key(day)} round ${r+1}`);ch.push(pick);}out.push(ch);recent.push(ch);while(recent.length>protect)recent.shift();}return out;}
const days=Number(process.argv[2]||120), all=generate(days);let errors=[];
for(let d=0;d<all.length;d++){let ids=all[d].map(x=>x.id);if(new Set(ids).size!==5)errors.push(`${key(d)} duplicate`);for(let r=0;r<5;r++){let x=all[d][r],[lo,hi]=bands[r];if(x.difficulty<lo||x.difficulty>hi)errors.push(`${key(d)} band r${r+1}`);for(let j=0;j<r;j++)if(dist(x,all[d][j])<minKm)errors.push(`${key(d)} separation`);for(let back=Math.max(0,d-protect);back<d;back++)if(all[back][r]&&all[back][r].id===x.id)errors.push(`${key(d)} repeat r${r+1} ${x.name}`);}}
console.log(`Checked ${days} days (${days*5} rounds). Errors: ${errors.length}`);if(errors.length)console.log(errors.slice(0,20).join("\n"));for(let d=0;d<Math.min(days,10);d++)console.log(key(d), all[d].map(x=>`${x.name} [${x.difficulty}]`).join(" | "));process.exit(errors.length?1:0);
