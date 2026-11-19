/* ZELQIO admin: Products tab (bulk publish up to 50 per batch, delist / relist / delete / replace). Owner only. */
(function(){
var T="zat",BATCH=50,LIVE=[],ROWS=[],SEL={},opened=false,fq="",fc="all",fs="all";
function $(i){return document.getElementById(i)}
function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function tok(){return sessionStorage.getItem(T)}
function post(o){o.idToken=tok();return fetch(window.ZCFG.backendUrl,{method:"POST",body:JSON.stringify(o)}).then(function(r){return r.json()}).then(function(j){if(!j.ok)throw new Error(j.error||"Failed");return j})}
function authFail(x){if(/sign in|not allowed/i.test((x&&x.message)||"")){sessionStorage.removeItem(T);if(window.gate)gate("Please sign in again ("+x.message+")");return true}return false}
function say(m){if(window.toast)toast(m)}
function offer(m,d){return Math.round(m*(1-Math.min(90,Math.max(0,d))/100))}
function lab(s){try{return ZCAT.label(s)}catch(e){return s}}
function imgUrl(u){u=String(u||"");return u.indexOf("http")===0?u:(u?"/"+u:"")}

var css='.tabs{display:flex;gap:8px;margin-bottom:18px}.tabs .pill{padding:9px 20px;font-size:.9rem}'+
'.pc2{background:var(--card);border:1px solid var(--bd);border-radius:18px;padding:18px;margin-bottom:16px}.pc2 h2{margin:0 0 4px;font-size:1.15rem}.pc2 h2 small{color:var(--mut);font-weight:400;font-size:.8rem;margin-left:6px}.pc2 p.m{color:var(--mut);font-size:.85rem;margin:4px 0 12px}'+
'.ta{width:100%;min-height:90px;background:#12121c;color:#fff;border:1px solid var(--bd);border-radius:10px;padding:10px;font-family:monospace;font-size:.8rem;margin-top:10px}'+
'.row2{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px}.row2 .gb{padding:9px 16px}.ni{width:84px;background:#12121c;color:#fff;border:1px solid var(--bd);border-radius:8px;padding:7px 8px}.mut{color:var(--mut);font-size:.8rem}'+
'.bt{width:100%;border-collapse:collapse;margin-top:12px;font-size:.82rem}.bt th{text-align:left;color:var(--mut);font-weight:600;padding:6px 6px;border-bottom:1px solid var(--bd);white-space:nowrap}.bt td{padding:7px 6px;border-bottom:1px solid var(--bd);vertical-align:middle}.bt tr.bad td{opacity:.55}.bt small{display:block;color:var(--mut);font-size:.7rem}'+
'.bx{display:inline-block;font-size:.68rem;font-weight:700;padding:2px 9px;border-radius:999px;white-space:nowrap}.bx.n{background:#0d3a2b;color:#3dffb0}.bx.r{background:#3a2a0d;color:#ffb020}.bx.e{background:#3a0d1a;color:#ff6b8a}.bx.d{background:#26263a;color:#b9b9d6}'+
'.pr{display:flex;gap:12px;align-items:center;padding:10px 4px;border-bottom:1px solid var(--bd);flex-wrap:wrap}.pr img{width:46px;height:46px;border-radius:8px;object-fit:contain;background:#fff;flex:none}.pr .pt{flex:1;min-width:160px}.pr .pt small{display:block;color:var(--mut);font-size:.72rem;word-break:break-all}.pr.off .pt b{opacity:.55}.pa{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.pa .gb{padding:6px 12px;font-size:.76rem}.gb.d{border-color:#ff6b8a;color:#ff9aae}'+
'.px{padding:10px 4px 14px;border-bottom:1px solid var(--bd);background:#0d0d17;border-radius:0 0 12px 12px}.sf{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.sf input,.sf select{background:#12121c;color:#fff;border:1px solid var(--bd);border-radius:999px;padding:9px 14px}.sf input{flex:1;min-width:180px}'+
'.okc{color:#3dffb0}.erc{color:#ff8aa0}.bulk{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 12px;background:#161628;border:1px solid #7c5cff;border-radius:12px;margin:10px 0}@media(max-width:720px){.bt .hm{display:none}}';
var st=document.createElement("style");st.textContent=css;document.head.appendChild(st);

function html(){return ''+
'<div class="pc2"><h2>Add products in bulk <small>up to '+BATCH+' per batch, bigger pastes are split automatically</small></h2>'+
'<p class="m">In ZELQIO Studio tap <b>Copy for website</b> for each product. Paste them here one after another (or a whole list). Check the prices, then publish. A product whose id is already live is replaced, anything else is added.</p>'+
'<div class="row2" style="margin-top:0"><button class="gb p" id="bpc">Paste from clipboard</button><button class="gb" id="bpa">Add another from clipboard</button><button class="gb" id="bcl">Clear</button></div>'+
'<textarea class="ta" id="bpt" placeholder="Paste product JSON here. Several products back to back are fine."></textarea>'+
'<div class="row2"><span class="mut">Discount % for all</span><input class="ni" id="bdis" type="number" min="0" max="90" value="30"><button class="gb" id="bap">Apply to all rows</button><span class="mut" id="bsum"></span></div>'+
'<div id="btab"></div><div class="row2"><button class="gb p" id="bgo" disabled>Publish</button><span id="bmsg" class="mut"></span></div></div>'+
'<div class="pc2"><h2>Live on zelqio.in <small id="lcnt"></small></h2>'+
'<p class="m"><b>Delist</b> hides a product from shoppers (and blocks ordering) but keeps everything so you can <b>Relist</b> it later. <b>Delete</b> removes it for good (photos stay in GitHub). <b>Replace</b> puts a new product exactly in the old one\'s place.</p>'+
'<div class="sf"><input id="lq" placeholder="Search name or id"><select id="lcat"></select><select id="lst"><option value="all">All</option><option value="live">Live only</option><option value="off">Delisted only</option></select></div>'+
'<div class="row2" style="margin-top:0"><label class="mut"><input type="checkbox" id="lall"> Select all shown</label><button class="gb" id="lrf">Refresh</button><button class="gb" id="lcsv">Download catalogue CSV (for Amazon / Meesho)</button></div>'+
'<div id="lbulk"></div><div id="plist"><p class="mut">Loading...</p></div></div>'}

/* ---------- parsing ---------- */
function parseMany(t){
t=String(t||"").trim();if(!t)return[];
var out=[];
function add(x){if(Array.isArray(x))x.forEach(add);else if(x&&typeof x==="object"){if(Array.isArray(x.products))x.products.forEach(add);else out.push(x)}}
try{add(JSON.parse(t));return out}catch(e){}
var depth=0,start=-1,inStr=false,bs=false;
for(var i=0;i<t.length;i++){var c=t.charAt(i);
if(depth>0&&inStr){if(bs)bs=false;else if(c==="\\")bs=true;else if(c==='"')inStr=false;continue}
if(depth>0&&c==='"'){inStr=true;continue}
if(c==="{"){if(depth===0)start=i;depth++}
else if(c==="}"&&depth>0){depth--;if(depth===0&&start>=0){try{add(JSON.parse(t.slice(start,i+1)))}catch(e2){out.push({__bad:1})}start=-1}}}
if(depth>0)out.push({__bad:1});
return out}

function mk(p){
var r={q:p,err:"",note:"",on:true};
if(p.__bad){r.err="Could not read this part of the pasted text";r.name="(unreadable)";r.id="";r.mrp=0;r.disc=0;r.cat="";r.on=false;return r}
r.id=String(p.id||"").trim().toLowerCase();r.name=p.name||r.id||"(no name)";
var m=Number(p.mrp||p.price)||0,d=Number($("bdis").value);if(!isFinite(d))d=30;
if(p.offerPrice&&m)d=Math.round((1-Number(p.offerPrice)/m)*100);
r.mrp=Math.round(m);r.disc=Math.min(90,Math.max(0,d));
var rs={ok:true,slug:p.category};try{rs=ZCAT.resolve(p.category,p)}catch(e){}
r.cat=rs.slug;if(!rs.ok)r.note='category "'+(rs.from==null||rs.from===""?"blank":rs.from)+'" moved to '+lab(rs.slug);
if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(r.id)||r.id.length>120)r.err="Invalid id (lowercase letters, numbers, hyphens)";
else if(!p.name)r.err="Missing name";
else if(!(m>0))r.err="Missing price";
if(r.err)r.on=false;
return r}
function build(){
var list=parseMany($("bpt").value);ROWS=list.map(mk);if(list.length)$("bmsg").textContent="";
var last={};ROWS.forEach(function(r,i){if(r.id)last[r.id]=i});
ROWS.forEach(function(r,i){if(r.id&&last[r.id]!==i){r.err="Pasted twice, the later copy is used";r.on=false}});
drawRows()}
function liveHas(id){for(var i=0;i<LIVE.length;i++)if(String(LIVE[i].id).toLowerCase()===id)return true;return false}
function drawRows(){
var el=$("btab");
if(!ROWS.length){el.innerHTML="";$("bsum").textContent="";$("bgo").disabled=true;$("bgo").textContent="Publish";return}
var h='<div style="overflow-x:auto"><table class="bt"><thead><tr><th></th><th>Product</th><th class="hm">Category</th><th>MRP</th><th>Disc %</th><th>Offer</th><th>Status</th></tr></thead><tbody>';
ROWS.forEach(function(r,i){
var stt=r.err?'<span class="bx e">'+esc(r.err)+'</span>':(liveHas(r.id)?'<span class="bx r">Replaces live</span>':'<span class="bx n">New</span>');
h+='<tr class="'+(r.err?'bad':'')+'"><td><input type="checkbox" data-i="'+i+'" class="rc"'+(r.on?' checked':'')+(r.err?' disabled':'')+'></td><td><b>'+esc(r.name)+'</b><small>'+esc(r.id)+'</small></td><td class="hm">'+esc(lab(r.cat))+(r.note?'<small class="erc">'+esc(r.note)+'</small>':'')+'</td>'+
'<td><input class="ni rm" type="number" min="1" data-i="'+i+'" value="'+r.mrp+'"'+(r.err?' disabled':'')+'></td><td><input class="ni rd" type="number" min="0" max="90" data-i="'+i+'" value="'+r.disc+'"'+(r.err?' disabled':'')+'></td><td><b id="of'+i+'">'+(r.err?'':'Rs '+offer(r.mrp,r.disc))+'</b></td><td>'+stt+'</td></tr>'});
el.innerHTML=h+'</tbody></table></div>';sum()}
function sum(){
var ok=ROWS.filter(function(r){return r.on&&!r.err&&r.mrp>0}),bad=ROWS.filter(function(r){return r.err}).length;
var nw=ok.filter(function(r){return !liveHas(r.id)}).length;
$("bsum").textContent=ROWS.length+" found · "+nw+" new · "+(ok.length-nw)+" replace"+(bad?" · "+bad+" skipped":"");
var nb=Math.ceil(ok.length/BATCH);
$("bgo").disabled=!ok.length;$("bgo").textContent=ok.length?"Publish "+ok.length+" product"+(ok.length>1?"s":"")+(nb>1?" in "+nb+" batches":""):"Publish"}
function offerOf(r){return offer(r.mrp,r.disc)}
function item(r){var q={};for(var k in r.q)if(k.indexOf("__")!==0&&k!=="hidden")q[k]=r.q[k];q.id=r.id;q.category=r.cat;q.price=r.mrp;q.mrp=r.mrp;q.offerPrice=offerOf(r);return q}

/* ---------- bulk publish ---------- */
function publishAll(){
var rows=ROWS.filter(function(r){return r.on&&!r.err&&r.mrp>0&&offerOf(r)>=1});
if(!rows.length)return;
var chunks=[];for(var i=0;i<rows.length;i+=BATCH)chunks.push(rows.slice(i,i+BATCH));
var added=0,updated=0,failed=[],b=$("bgo"),m=$("bmsg");b.disabled=true;
function next(n){
if(n>=chunks.length)return Promise.resolve();
m.className="mut";m.textContent="Publishing batch "+(n+1)+" of "+chunks.length+"...";
return post({action:"publishBatch",products:chunks[n].map(item)}).then(function(j){added+=j.added||0;updated+=j.updated||0;(j.failed||[]).forEach(function(f){failed.push(f)})}).then(function(){return next(n+1)})}
next(0).then(function(){
var msg=added+" added, "+updated+" replaced.";
if(failed.length)msg+=" "+failed.length+" could not be published: "+failed.map(function(f){return (f.name||f.id||"#"+(f.index+1))+" ("+f.error+")"}).join("; ");
m.className=failed.length?"erc":"okc";m.textContent=msg+" Visible on zelqio.in in about a minute.";
if(!failed.length){$("bpt").value="";ROWS=[];drawRows()}
say("Published: "+added+" added, "+updated+" replaced");loadLive()
}).catch(function(x){if(!authFail(x)){m.className="erc";m.textContent=(added||updated?"Stopped after "+added+" added, "+updated+" replaced. ":"")+"Error: "+x.message}}).then(function(){sum()})}

/* ---------- live list ---------- */
function loadLive(){post({action:"listProducts"}).then(function(j){LIVE=j.products||[];cats();drawLive();if(ROWS.length)drawRows()}).catch(function(x){if(!authFail(x))$("plist").innerHTML='<p class="erc">Could not load the list: '+esc(x.message)+'</p>'})}
function cats(){var s=$("lcat"),cur=s.value||fc,seen={};LIVE.forEach(function(p){seen[p.category]=1});var h='<option value="all">All categories</option>';Object.keys(seen).sort().forEach(function(c){h+='<option value="'+esc(c)+'">'+esc(lab(c))+'</option>'});s.innerHTML=h;s.value=seen[cur]?cur:"all";fc=s.value}
function shown(){return LIVE.filter(function(p){if(fc!=="all"&&p.category!==fc)return false;if(fs==="live"&&p.hidden)return false;if(fs==="off"&&!p.hidden)return false;if(fq){var h=(p.name+" "+p.id).toLowerCase();if(h.indexOf(fq)<0)return false}return true})}
function drawLive(){
var off=LIVE.filter(function(p){return p.hidden}).length;
$("lcnt").textContent="("+(LIVE.length-off)+" live"+(off?", "+off+" delisted":"")+")";
var l=shown();
if(!LIVE.length){$("plist").innerHTML='<p class="mut">Nothing is published yet.</p>';bulk();return}
if(!l.length){$("plist").innerHTML='<p class="mut">No products match.</p>';bulk();return}
$("plist").innerHTML=l.map(function(p){var u=imgUrl(p.image);
return '<div class="pr'+(p.hidden?' off':'')+'" data-id="'+esc(p.id)+'"><input type="checkbox" class="sc"'+(SEL[p.id]?' checked':'')+'>'+(u?'<img loading="lazy" decoding="async" width="46" height="46" alt="" src="'+esc(u)+'">':'<img alt="" width="46" height="46">')+
'<div class="pt"><b>'+esc(p.name)+'</b><small>'+esc(lab(p.category))+' · Rs '+esc(p.offerPrice||p.price)+(p.mrp&&p.offerPrice?' (MRP Rs '+esc(p.mrp)+')':'')+' · '+esc(p.id)+'</small></div>'+
'<span class="bx '+(p.hidden?'d':'n')+'">'+(p.hidden?'Delisted':'Live')+'</span><span class="pa"><button class="gb" data-a="tog">'+(p.hidden?'Relist':'Delist')+'</button><button class="gb" data-a="rep">Replace</button><button class="gb d" data-a="del">Delete</button></span></div><div class="px" id="px_'+esc(p.id)+'" style="display:none"></div>'}).join("");
bulk()}
function selIds(){return Object.keys(SEL).filter(function(k){return SEL[k]})}
function bulk(){
var n=selIds().length,el=$("lbulk");
if(!n){el.innerHTML="";return}
el.innerHTML='<div class="bulk"><b>'+n+' selected</b><button class="gb" data-b="off">Delist</button><button class="gb" data-b="on">Relist</button><button class="gb d" data-b="del">Delete</button><span id="bcf"></span><button class="gb" data-b="clr">Clear selection</button></div>'}
function chunked(ids,fn){var p=Promise.resolve(),tot=0;for(var i=0;i<ids.length;i+=BATCH){(function(part){p=p.then(function(){return fn(part)}).then(function(j){tot+=(j.changed!=null?j.changed:(j.deleted||0))})})(ids.slice(i,i+BATCH))}return p.then(function(){return tot})}
function doList(ids,listed){return chunked(ids,function(part){return post({action:"setListed",ids:part,listed:listed})}).then(function(n){say((listed?"Relisted ":"Delisted ")+n+" product"+(n===1?"":"s")+". Updates on zelqio.in in about a minute.");loadLive()}).catch(function(x){if(!authFail(x))say("Could not update: "+x.message)})}
function doDel(ids){return chunked(ids,function(part){return post({action:"deleteProducts",ids:part})}).then(function(n){ids.forEach(function(i){delete SEL[i]});say("Deleted "+n+" product"+(n===1?"":"s")+". Gone from zelqio.in in about a minute.");loadLive()}).catch(function(x){if(!authFail(x))say("Could not delete: "+x.message)})}

/* ---------- replace one product ---------- */
function openRep(id){
var p=LIVE.filter(function(x){return x.id===id})[0],box=$("px_"+id);if(!p||!box)return;
if(box.style.display!=="none"){box.style.display="none";return}
box.style.display="block";
box.innerHTML='<p class="mut" style="margin:0 0 6px">Paste the new product from Studio. It takes the exact place of <b>'+esc(p.name)+'</b>, which is removed.</p><div class="row2" style="margin-top:0"><button class="gb p" data-r="paste">Paste from clipboard</button></div><textarea class="ta" data-r="ta" placeholder="product JSON"></textarea><div data-r="info" class="mut" style="margin-top:8px"></div><div data-r="form" style="display:none" class="row2"><span class="mut">MRP</span><input class="ni" type="number" min="1" data-r="mrp"><span class="mut">Disc %</span><input class="ni" type="number" min="0" max="90" data-r="dis"><b data-r="off"></b><button class="gb p" data-r="go">Replace</button></div>'}
function repLoad(box,txt,old){
var info=box.querySelector('[data-r="info"]'),form=box.querySelector('[data-r="form"]');
var l=parseMany(txt).filter(function(x){return !x.__bad});
if(!l.length){info.className="erc mut";info.textContent=txt.trim()?"That is not valid product JSON.":"";form.style.display="none";return}
var r=mk(l[0]);box._r=r;
if(r.err){info.className="erc mut";info.textContent=r.err;form.style.display="none";return}
info.className="mut";info.innerHTML='New product: <b>'+esc(r.name)+'</b> · '+esc(lab(r.cat))+' · id '+esc(r.id)+(r.note?' <span class="erc">('+esc(r.note)+')</span>':'')+(l.length>1?' <span class="erc">(only the first of '+l.length+' pasted products is used)</span>':'');
form.style.display="flex";box.querySelector('[data-r="mrp"]').value=r.mrp;box.querySelector('[data-r="dis"]').value=r.disc;repOff(box)}
function repOff(box){var r=box._r;if(!r)return;r.mrp=Math.round(Number(box.querySelector('[data-r="mrp"]').value)||0);r.disc=Math.min(90,Math.max(0,Number(box.querySelector('[data-r="dis"]').value)||0));box.querySelector('[data-r="off"]').textContent="Rs "+offer(r.mrp,r.disc)}

/* ---------- catalogue CSV ---------- */
function csv(){
fetch("products.json?v="+Date.now()).then(function(r){return r.json()}).then(function(j){
var h=["id","name","category","mrp","offer_price","status","description","tags","main_image","image_2","image_3","image_4","image_5","image_6","image_7","image_8"],L=[h.join(",")];
(j.products||[]).forEach(function(p){var m=Number(p.mrp||p.price)||0,o=p.offerPrice?Number(p.offerPrice):Math.round(m*(1-(typeof j.discountPercent==="number"?j.discountPercent:15)/100));var im=(p.images||[]).filter(function(u){return u&&u!==p.image});
var row=[p.id,p.name,p.category,m,o,p.hidden?"delisted":"live",p.description||"",(p.tags||[]).join("|"),p.image||""].concat(im.slice(0,7));while(row.length<h.length)row.push("");
L.push(row.map(function(v){return '"'+String(v==null?"":v).replace(/"/g,'""')+'"'}).join(","))});
var b=new Blob([L.join("\n")],{type:"text/csv"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="zelqio-catalogue.csv";a.click()}).catch(function(){say("Could not build the CSV")})}

/* ---------- wiring ---------- */
function clip(append){navigator.clipboard.readText().then(function(t){var v=$("bpt").value;$("bpt").value=append&&v.trim()?v.replace(/\s+$/,"")+"\n"+t:t;build()}).catch(function(){say("Clipboard blocked. Paste into the box instead.")})}
function wire(){
$("bpc").onclick=function(){clip(false)};$("bpa").onclick=function(){clip(true)};
$("bcl").onclick=function(){$("bpt").value="";ROWS=[];$("bmsg").textContent="";drawRows()};
$("bpt").addEventListener("input",build);
$("bap").onclick=function(){var d=Math.min(90,Math.max(0,Number($("bdis").value)||0));ROWS.forEach(function(r){if(!r.err)r.disc=d});drawRows()};
$("btab").addEventListener("input",function(e){var t=e.target,i=+t.getAttribute("data-i");if(isNaN(i)||!ROWS[i])return;var r=ROWS[i];
if(t.classList.contains("rm"))r.mrp=Math.round(Number(t.value)||0);else if(t.classList.contains("rd"))r.disc=Math.min(90,Math.max(0,Number(t.value)||0));
var o=$("of"+i);if(o)o.textContent=r.mrp>0?"Rs "+offerOf(r):"";sum()});
$("btab").addEventListener("change",function(e){var t=e.target;if(t.classList.contains("rc")){ROWS[+t.getAttribute("data-i")].on=t.checked;sum()}});
$("bgo").onclick=publishAll;
$("lq").addEventListener("input",function(){fq=this.value.trim().toLowerCase();drawLive()});
$("lcat").onchange=function(){fc=this.value;drawLive()};$("lst").onchange=function(){fs=this.value;drawLive()};
$("lrf").onclick=loadLive;$("lcsv").onclick=csv;
$("lall").onchange=function(){var on=this.checked;shown().forEach(function(p){SEL[p.id]=on});drawLive()};
$("plist").addEventListener("change",function(e){var t=e.target;if(t.classList.contains("sc")){var id=t.closest(".pr").getAttribute("data-id");SEL[id]=t.checked;bulk()}});
$("plist").addEventListener("click",function(e){var t=e.target,a=t.getAttribute&&t.getAttribute("data-a"),r=t.getAttribute&&t.getAttribute("data-r");
var row=t.closest&&t.closest(".pr"),box=t.closest&&t.closest(".px");
if(a&&row){var id=row.getAttribute("data-id"),p=LIVE.filter(function(x){return x.id===id})[0];if(!p)return;
if(a==="tog"){t.disabled=true;doList([id],!!p.hidden)}
else if(a==="rep")openRep(id);
else if(a==="del"){var pa=row.querySelector(".pa");pa.innerHTML='<span class="erc">Delete for good?</span><button class="gb d" data-a="yes">Yes, delete</button><button class="gb" data-a="no">Cancel</button>'}
else if(a==="no"){drawLive()}
else if(a==="yes"){t.disabled=true;t.textContent="Deleting...";doDel([id])}}
else if(r&&box){var oid=box.id.slice(3),op=LIVE.filter(function(x){return x.id===oid})[0];
if(r==="paste"){navigator.clipboard.readText().then(function(tx){box.querySelector('[data-r="ta"]').value=tx;repLoad(box,tx,op)}).catch(function(){say("Clipboard blocked. Paste into the box instead.")})}
else if(r==="go"){var nr=box._r;if(!nr||nr.err||!(nr.mrp>0)){say("Enter a valid price");return}t.disabled=true;t.textContent="Replacing...";
post({action:"replaceProduct",oldId:oid,product:item(nr)}).then(function(j){say("Replaced with "+j.name+". Updates on zelqio.in in about a minute.");delete SEL[oid];loadLive()}).catch(function(x){t.disabled=false;t.textContent="Replace";if(!authFail(x)){var inf=box.querySelector('[data-r="info"]');inf.className="erc mut";inf.textContent=x.message}})}}});
$("plist").addEventListener("input",function(e){var t=e.target,box=t.closest&&t.closest(".px");if(!box)return;var r=t.getAttribute("data-r");
if(r==="ta")repLoad(box,t.value);else if(r==="mrp"||r==="dis")repOff(box)});
$("lbulk").addEventListener("click",function(e){var b=e.target.getAttribute&&e.target.getAttribute("data-b");if(!b)return;var ids=selIds();
if(b==="clr"){SEL={};$("lall").checked=false;drawLive()}
else if(b==="off"){doList(ids,false)}else if(b==="on"){doList(ids,true)}
else if(b==="del"){$("bcf").innerHTML='<span class="erc">Delete '+ids.length+' for good?</span> <button class="gb d" data-b="yes">Yes, delete</button> <button class="gb" data-b="no">Cancel</button>'}
else if(b==="no"){$("bcf").innerHTML=""}
else if(b==="yes"){e.target.disabled=true;doDel(ids)}})}

function show(which){
var po=which==="p";$("otab").style.display=po?"none":"block";$("ptab").style.display=po?"block":"none";
$("tbo").classList.toggle("on",!po);$("tbp").classList.toggle("on",po);
if(po&&!opened){opened=true;$("ptab").innerHTML=html();wire();loadLive()}else if(po){loadLive()}}
document.addEventListener("DOMContentLoaded",function(){});
if($("tbo")){$("tbo").onclick=function(){show("o")};$("tbp").onclick=function(){show("p")}}
window.ZADM={parseMany:parseMany};
})();
