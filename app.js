const START = [
  {id:1,customer:"Northstar Studio",date:"2026-09-17",channel:"Website",amount:1250,status:"Paid",visits:84},
  {id:2,customer:"Elm & Co.",date:"2026-09-15",channel:"Referral",amount:690,status:"Paid",visits:47},
  {id:3,customer:"Copper Finch",date:"2026-09-10",channel:"Social",amount:420,status:"Paid",visits:63},
  {id:4,customer:"Blue Harbor",date:"2026-09-05",channel:"Website",amount:980,status:"Paid",visits:72},
  {id:5,customer:"Willow Works",date:"2026-08-29",channel:"Email",amount:310,status:"Pending",visits:45},
  {id:6,customer:"Lumen Home",date:"2026-08-23",channel:"Website",amount:760,status:"Paid",visits:90},
  {id:7,customer:"Paperplane Co.",date:"2026-08-18",channel:"Referral",amount:540,status:"Refunded",visits:64},
  {id:8,customer:"Oakline Labs",date:"2026-08-05",channel:"Social",amount:890,status:"Paid",visits:78},
  {id:9,customer:"Delta Supply",date:"2026-07-21",channel:"Website",amount:1450,status:"Paid",visits:91},
  {id:10,customer:"Field & Form",date:"2026-07-10",channel:"Email",amount:510,status:"Paid",visits:62},
  {id:11,customer:"Red Fern",date:"2026-06-11",channel:"Referral",amount:620,status:"Paid",visits:57},
  {id:12,customer:"Tidewell",date:"2026-05-03",channel:"Website",amount:1130,status:"Paid",visits:81}
];
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
const today=new Date("2026-09-22T12:00:00Z");
const data=START;
function filtered(){
  const period=$("period").value;
  if(period==="all")return data;
  const cutoff=new Date(today);cutoff.setUTCDate(cutoff.getUTCDate()-Number(period));
  return data.filter(item=>new Date(item.date+"T00:00:00Z")>=cutoff);
}
function render(){
  const items=filtered();
  const paid=items.filter(x=>x.status==="Paid");
  const revenue=paid.reduce((sum,x)=>sum+x.amount,0);
  const visits=items.reduce((sum,x)=>sum+x.visits,0);
  $("revenue").textContent=money(revenue);
  $("orders").textContent=String(paid.length);
  $("average").textContent=money(paid.length?revenue/paid.length:0);
  $("conversion").textContent=(visits?paid.length/visits*100:0).toFixed(1)+"%";
  $("revenue-change").textContent=$("period").selectedOptions[0].text;
  $("orders-change").textContent=items.length+" transaction"+(items.length===1?"":"s")+" in period";
  const months=[];
  for(let i=5;i>=0;i--){const date=new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth()-i,1));months.push({key:date.toISOString().slice(0,7),label:date.toLocaleString("en-US",{month:"short",timeZone:"UTC"})});}
  const totals=months.map(m=>paid.filter(x=>x.date.startsWith(m.key)).reduce((sum,x)=>sum+x.amount,0));
  const max=Math.max(...totals,1);
  $("chart").replaceChildren(...totals.map((value,i)=>{
    const wrapper=document.createElement("div");wrapper.className="bar-wrap";
    const bar=document.createElement("div");bar.className="bar"+(i===totals.length-1?" current":"");bar.style.height=Math.max(2,Math.round(value/max*100))+"%";bar.title=months[i].label+": "+money(value);wrapper.append(bar);return wrapper;
  }));
  $("chart-axis").replaceChildren(...months.map(m=>{const span=document.createElement("span");span.textContent=m.label;return span}));
  $("chart").setAttribute("aria-label","Monthly paid revenue: "+months.map((m,i)=>m.label+" "+money(totals[i])).join(", "));
  const counts=Object.entries(paid.reduce((acc,x)=>(acc[x.channel]=(acc[x.channel]||0)+x.amount,acc),{})).sort((a,b)=>b[1]-a[1]);
  $("channels").replaceChildren(...counts.map(([name,value])=>{
    const share=revenue?Math.round(value/revenue*100):0;
    const div=document.createElement("div");div.className="channel";
    const top=document.createElement("div");top.className="channel-top";
    const label=document.createElement("span");label.textContent=name;
    const percent=document.createElement("span");percent.textContent=share+"%";
    top.append(label,percent);
    const track=document.createElement("div");track.className="track";
    const fill=document.createElement("span");fill.style.width=share+"%";track.append(fill);
    div.append(top,track);return div;
  }));
  if(!counts.length)$("channels").textContent="No paid transactions in this period.";
  const query=$("search").value.trim().toLowerCase();
  const matches=items.filter(x=>(x.customer+" "+x.channel+" "+x.status).toLowerCase().includes(query)).sort((a,b)=>b.date.localeCompare(a.date));
  $("rows").replaceChildren(...matches.map(item=>{
    const tr=document.createElement("tr");
    [item.customer,new Date(item.date+"T00:00:00Z").toLocaleDateString("en-US",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}),item.channel,item.status,money(item.amount)].forEach((value,i)=>{
      const td=document.createElement("td");if(i===4)td.className="num";
      if(i===3){const badge=document.createElement("span");badge.className="badge "+(item.status==="Paid"?"":item.status.toLowerCase());badge.textContent=value;td.append(badge)}else td.textContent=value;
      tr.append(td);
    });return tr;
  }));
  if(!matches.length){const tr=document.createElement("tr");const td=document.createElement("td");td.colSpan=5;td.className="empty";td.textContent="No matching transactions.";tr.append(td);$("rows").append(tr)}
  $("count").textContent=matches.length+" of "+items.length+" transactions";
}
$("period").addEventListener("change",render);
$("search").addEventListener("input",render);
$("reset").addEventListener("click",()=>{$("period").value="30";$("search").value="";render()});
$("export").addEventListener("click",()=>{
  const values=[["Customer","Date","Channel","Status","Amount (USD)","Visits"],...filtered().map(x=>[x.customer,x.date,x.channel,x.status,x.amount,x.visits])];
  const csv=values.map(row=>row.map(value=>'"'+String(value).replaceAll('"','""')+'"').join(",")).join("\r\n");
  const link=document.createElement("a");link.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));link.download="aethermetrics-transactions.csv";link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);
});
render();
