# DCANP Cloudflare Fix (/api/gas)

1) Add this file to your repo:
   functions/api/gas.js

2) Cloudflare Pages -> Settings -> Environment variables:
   GAS_WEBAPP_URL = https://script.google.com/macros/s/AKfycbxtnA_nSCxGPl4ArmLE0_UaODYB-VE1ak3CH8jN97iWVVAXDIsnAr6JnzrKMXq1YpvzBw/exec
   DCANP_SECRET   = (optional) same as Apps Script Script Property DCANP_SECRET

3) Deploy. Test:
   fetch("/api/gas", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({fn:"ping", args:[]})})
     .then(r=>r.text()).then(console.log).catch(console.error);
