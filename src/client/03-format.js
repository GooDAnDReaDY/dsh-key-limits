/* format */
function sid(p){return p&&(p.sessionId||(p.session&&(p.session.sessionId||p.session.id)))||""}
function sessionIdFromCtx(){try{var s=klCtx&&klCtx.sessions&&klCtx.sessions.list&&klCtx.sessions.list.getSnapshot();return s&&s.current||""}catch(e){return ""}}
function fmtPct(n){var x=Number(n);return Number.isFinite(x)?Math.round(x)+"%":"—"}
function fmtReset(resetsAt){
  if(!resetsAt)return"";
  var t=typeof resetsAt==="number"?resetsAt:Date.parse(resetsAt);
  if(!Number.isFinite(t))return"";
  var ms=t-Date.now();
  if(ms<=0)return klT("refresh");
  var h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000);
  return (h?h+"h ":"")+m+"m";
}
function minRemaining(wins){if(!wins||!wins.length)return null;var m=null;for(var i=0;i<wins.length;i++){var r=Number(wins[i].remainingPercent);if(!Number.isFinite(r))continue;if(m===null||r<m)m=r}return m}
function pctClass(rem){if(rem==null)return"kl-muted";if(rem<=DANGER)return"kl-danger";if(rem<=WARN)return"kl-warn";return"kl-ok"}
function floatPctClass(rem){if(rem==null)return"kl-float-muted";if(rem<=DANGER)return"kl-float-danger";if(rem<=WARN)return"kl-float-warn";return"kl-float-ok"}
function progBarClass(rem){var b="kl-progBar";if(rem<=DANGER)b+=" kl-progDanger";else if(rem<=WARN)b+=" kl-progWarn";return b}
function readPos(){try{var r=JSON.parse(localStorage.getItem(POS_KEY)||"null");if(r&&typeof r.x==="number"&&typeof r.y==="number")return r}catch(e){}return null}
function savePos(x,y){try{localStorage.setItem(POS_KEY,JSON.stringify({x:x,y:y}))}catch(e){}}
function PortalModal(props){
  useEffect(function(){
    if(typeof window==="undefined"||!props.onClose)return;
    function onKey(e){if(e.key==="Escape")props.onClose()}
    window.addEventListener("keydown",onKey);
    return function(){window.removeEventListener("keydown",onKey)};
  },[props.onClose]);
  return createPortal(props.children,document.body);
}
function providerLabel(p){return p||"?"}
function providerClass(p){
  var s=String(p||"").toLowerCase();
  if(s.indexOf("opencode")!==-1)return "kl-prov-opencode-go";
  if(s.indexOf("deepseek")!==-1)return "kl-prov-deepseek";
  if(s.indexOf("openrouter")!==-1)return "kl-prov-openrouter";
  if(s.indexOf("minimax")!==-1)return "kl-prov-minimax";
  if(s.indexOf("cline")!==-1)return "kl-prov-cline";
  if(s.indexOf("qwen")!==-1)return "kl-prov-qwen";
  if(s.indexOf("ollama")!==-1)return "kl-prov-ollama";
  return "";
}

function SvgKey(props){
  return jsx("svg",{width:props.size||14,height:props.size||14,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2.2,strokeLinecap:"round",strokeLinejoin:"round",className:props.className,style:props.style,children:[
    jsx("circle",{cx:7.5,cy:15.5,r:5.5}),
    jsx("path",{d:"m21 2-9.6 9.6"}),
    jsx("path",{d:"m15.5 7.5 3 3"})
  ]});
}
function SvgRefresh(props){
  return jsx("svg",{width:props.size||13,height:props.size||13,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2.2,strokeLinecap:"round",strokeLinejoin:"round",className:props.className,style:props.style,children:[
    jsx("path",{d:"M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"}),
    jsx("path",{d:"M3 3v5h5"}),
    jsx("path",{d:"M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"}),
    jsx("path",{d:"M16 16h5v5"})
  ]});
}
function SvgTrash(props){
  return jsx("svg",{width:props.size||13,height:props.size||13,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round",className:props.className,style:props.style,children:[
    jsx("path",{d:"M3 6h18"}),
    jsx("path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"}),
    jsx("path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"})
  ]});
}
function SvgClose(props){
  return jsx("svg",{width:props.size||14,height:props.size||14,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2.2,strokeLinecap:"round",strokeLinejoin:"round",className:props.className,style:props.style,children:[
    jsx("path",{d:"M18 6 6 18"}),
    jsx("path",{d:"m6 6 12 12"})
  ]});
}
function SvgAlert(props){
  return jsx("svg",{width:props.size||15,height:props.size||15,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2.2,strokeLinecap:"round",strokeLinejoin:"round",className:props.className,style:props.style,children:[
    jsx("circle",{cx:12,cy:12,r:10}),
    jsx("line",{x1:12,x2:12,y1:8,y2:12}),
    jsx("line",{x1:12,x2:12.01,y1:16,y2:16})
  ]});
}
function SvgPlus(props){
  return jsx("svg",{width:props.size||13,height:props.size||13,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2.4,strokeLinecap:"round",strokeLinejoin:"round",className:props.className,style:props.style,children:[
    jsx("line",{x1:12,x2:12,y1:5,y2:19}),
    jsx("line",{x1:5,x2:19,y1:12,y2:12})
  ]});
}
function SvgClock(props){
  return jsx("svg",{width:props.size||12,height:props.size||12,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round",className:props.className,style:props.style,children:[
    jsx("circle",{cx:12,cy:12,r:10}),
    jsx("polyline",{points:"12 6 12 12 16 14"})
  ]});
}
