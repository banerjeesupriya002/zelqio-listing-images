/*
 ZELQIO checkout backend (Google Apps Script, free). NO SECRETS IN THIS FILE.
 Setup (once):
 1. Create a Google Sheet named ZELQIO Orders. Open Extensions > Apps Script and paste this file.
 2. Project Settings > Script properties, add: GOOGLE_CLIENT_ID, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET (type the secret yourself, never share it).
 3. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Copy the Web app URL into config.js as backendUrl.
 4. Put your Google OAuth client ID into config.js as googleClientId.
*/
var PRODUCTS_URL='https://raw.githubusercontent.com/banerjeesupriya002/zelqio-listing-images/main/products.json';
function prop(k){return PropertiesService.getScriptProperties().getProperty(k)}
function out(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}
function doGet(){return out({ok:true,service:'ZELQIO checkout'})}
function doPost(e){
 try{
  var b=JSON.parse(e.postData.contents);
  if(b.action==='createOrder')return out(createOrder(b));
  if(b.action==='verify')return out(verify(b));
  return out({ok:false,error:'Unknown request'});
 }catch(err){return out({ok:false,error:String(err.message||err)})}
}
function who(idToken){
 var r=UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token='+encodeURIComponent(idToken||''),{muteHttpExceptions:true});
 var j=JSON.parse(r.getContentText());
 if(r.getResponseCode()!==200||j.aud!==prop('GOOGLE_CLIENT_ID')||String(j.email_verified)!=='true')throw new Error('Please sign in with Google again.');
 return j;
}
function sheet(){
 var s=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
 if(!s){s=SpreadsheetApp.getActiveSpreadsheet().insertSheet('Orders');s.appendRow(['Time','Razorpay order','Status','Email','Name','Phone','Address','City','State','PIN','Product ID','Product','Qty','Amount INR','Payment ID'])}
 return s;
}
function offer(p,d){var mrp=Number(p.mrp||p.price);return p.offerPrice?Number(p.offerPrice):Math.round(mrp*(1-d/100))}
function createOrder(b){
 var u=who(b.idToken);
 var all=JSON.parse(UrlFetchApp.fetch(PRODUCTS_URL+'?t='+Date.now()).getContentText());
 var d=typeof all.discountPercent==='number'?all.discountPercent:15;
 var p=all.products.filter(function(x){return x.id===b.productId})[0];
 if(!p)throw new Error('Product not found');
 var qty=Math.max(1,Math.min(10,parseInt(b.qty,10)||1));
 var c=b.customer||{};
 ['name','phone','address','city','state','pin'].forEach(function(k){if(!c[k])throw new Error('Please fill all delivery details.')});
 var amount=offer(p,d)*qty*100;
 var res=UrlFetchApp.fetch('https://api.razorpay.com/v1/orders',{method:'post',contentType:'application/json',muteHttpExceptions:true,
  headers:{Authorization:'Basic '+Utilities.base64Encode(prop('RAZORPAY_KEY_ID')+':'+prop('RAZORPAY_KEY_SECRET'))},
  payload:JSON.stringify({amount:amount,currency:'INR',receipt:'ZQ'+Date.now(),notes:{product:p.name,qty:qty,email:u.email}})});
 var o=JSON.parse(res.getContentText());
 if(res.getResponseCode()>=300)throw new Error('Payment could not be started. Please try again.');
 sheet().appendRow([new Date(),o.id,'CREATED',u.email,c.name,c.phone,c.address,c.city,c.state,c.pin,p.id,p.name,qty,amount/100,'']);
 return {ok:true,orderId:o.id,amount:amount,keyId:prop('RAZORPAY_KEY_ID')};
}
function verify(b){
 var u=who(b.idToken);
 var raw=Utilities.computeHmacSha256Signature(b.razorpay_order_id+'|'+b.razorpay_payment_id,prop('RAZORPAY_KEY_SECRET'));
 var hex=raw.map(function(x){return ('0'+(x&255).toString(16)).slice(-2)}).join('');
 if(hex!==b.razorpay_signature)throw new Error('Payment verification failed');
 var s=sheet(),rows=s.getDataRange().getValues(),row=-1;
 for(var i=1;i<rows.length;i++){if(rows[i][1]===b.razorpay_order_id&&rows[i][3]===u.email){row=i+1;break}}
 if(row<0)throw new Error('Order not found');
 s.getRange(row,3).setValue('PAID');s.getRange(row,15).setValue(b.razorpay_payment_id);
 var r=rows[row-1];
 var body='<p>Thank you for your order with ZELQIO.</p><p><b>Order:</b> '+b.razorpay_order_id+'<br><b>Item:</b> '+r[11]+' x '+r[12]+'<br><b>Amount paid:</b> INR '+r[13]+'<br><b>Payment ID:</b> '+b.razorpay_payment_id+'</p><p>Your order is made to order and will be dispatched within 4 working days. Shipping address: '+r[6]+', '+r[7]+', '+r[8]+' '+r[9]+'.</p><p>No returns or exchanges apply. Damaged or wrong items: write to us within 48 hours of delivery.</p><p>ZELQIO, operated by Joy Guru Fashions, India. https://zelqio.in</p>';
 MailApp.sendEmail({to:u.email,subject:'ZELQIO order confirmed - '+b.razorpay_order_id,htmlBody:body});
 MailApp.sendEmail({to:Session.getEffectiveUser().getEmail(),subject:'New ZELQIO order '+b.razorpay_order_id,htmlBody:body+'<p>Customer: '+r[4]+' / '+r[5]+' / '+u.email+'</p>'});
 return {ok:true};
}
