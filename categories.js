/* ZELQIO categories - single source of truth for slugs, labels and display order.
   Used by index.html (shop) and publish.html (publishing). */
(function(){
var ORDER=["desk-mats","cushions","dining","puzzles","planners","totes","drinkware","apparel","cards","wall-art","accessories"];
var LABEL={"desk-mats":"Desk Mats","cushions":"Cushions","dining":"Dining and table","puzzles":"Puzzles","planners":"Planners","totes":"Totes","drinkware":"Bottles and mugs","apparel":"T-shirts and hoodies","cards":"Greeting cards","wall-art":"Posters and wall art","accessories":"Accessories and small gifts"};
/* Known other spellings -> valid slug */
var ALIAS={
"desk-mat":"desk-mats","deskmat":"desk-mats","deskmats":"desk-mats","mousepad":"desk-mats","mousepads":"desk-mats","mouse-pad":"desk-mats","mouse-pads":"desk-mats",
"cushion":"cushions","cushion-cover":"cushions","cushion-covers":"cushions","pillow":"cushions","pillows":"cushions","pillow-covers":"cushions",
"table-runner":"dining","table-runners":"dining","runner":"dining","placemat":"dining","placemats":"dining","coaster":"dining","coasters":"dining","tableware":"dining","table-linen":"dining",
"puzzle":"puzzles","jigsaw":"puzzles","jigsaws":"puzzles","jigsaw-puzzle":"puzzles","jigsaw-puzzles":"puzzles",
"planner":"planners","diary":"planners","diaries":"planners","notebook":"planners","notebooks":"planners","journal":"planners","journals":"planners","calendar":"planners","calendars":"planners",
"tote":"totes","tote-bag":"totes","tote-bags":"totes","bag":"totes","bags":"totes",
"bottle":"drinkware","bottles":"drinkware","sipper":"drinkware","sippers":"drinkware","sipper-bottle":"drinkware","mug":"drinkware","mugs":"drinkware","tumbler":"drinkware","tumblers":"drinkware","cup":"drinkware","cups":"drinkware",
"tshirt":"apparel","tshirts":"apparel","t-shirt":"apparel","t-shirts":"apparel","tee":"apparel","tees":"apparel","hoodie":"apparel","hoodies":"apparel","sweatshirt":"apparel","sweatshirts":"apparel","stole":"apparel","stoles":"apparel","clothing":"apparel","clothes":"apparel",
"card":"cards","greeting-card":"cards","greeting-cards":"cards","greetings":"cards",
"poster":"wall-art","posters":"wall-art","wall-chart":"wall-art","wall-charts":"wall-art","chart":"wall-art","charts":"wall-art","print":"wall-art","prints":"wall-art","framed-print":"wall-art","framed-prints":"wall-art","tapestry":"wall-art","tapestries":"wall-art","wallart":"wall-art","wall-decor":"wall-art",
"accessory":"accessories","phone-case":"accessories","phone-cases":"accessories","phonecase":"accessories","phonecases":"accessories","case":"accessories","cases":"accessories","magnet":"accessories","magnets":"accessories","fridge-magnet":"accessories","fridge-magnets":"accessories","keychain":"accessories","keychains":"accessories","key-chain":"accessories","key-chains":"accessories"
};
var FALLBACK="accessories";
function norm(c){return String(c==null?"":c).toLowerCase().trim().replace(/&/g,"and").replace(/[\s_\/]+/g,"-").replace(/[^a-z0-9-]/g,"").replace(/-+/g,"-").replace(/^-|-$/g,"")}
function valid(c){return ORDER.indexOf(c)>=0}
/* Exact slug or known alias only - never guesses (used for URL anchors). */
function strict(c){var n=norm(c);if(valid(n))return n;return ALIAS[n]||null}
/* Words from text, each checked against the slug and alias lists. Longer phrases first. */
function guess(text){
var w=norm(text).split("-").filter(Boolean),i,j;
for(j=3;j>=1;j--)for(i=0;i+j<=w.length;i++){var ph=w.slice(i,i+j).join("-");if(valid(ph))return ph;if(ALIAS[ph])return ALIAS[ph]}
return null}
/* Always returns a valid slug. ok=false means the incoming category was not a valid slug. */
function resolve(cat,p){
var n=norm(cat);
if(valid(n))return {slug:n,ok:String(cat)===n,from:cat};
var s=ALIAS[n]||guess(cat);
if(!s&&p){s=guess(p.name||"")||guess((p.tags||[]).join(" "))}
return {slug:s||FALLBACK,ok:false,from:cat};
}
window.ZCAT={order:ORDER.slice(),label:function(k){return LABEL[k]||k},valid:valid,strict:strict,resolve:resolve};
})();
