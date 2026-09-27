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
  var totalMinutes=Math.floor(ms/60000);
  var totalHours=Math.floor(totalMinutes/60);
  var m=totalMinutes%60;
  if(totalHours<24){
    return (totalHours?totalHours+"h ":"")+m+"m";
  }
  var d=Math.floor(totalHours/24);
  var h=totalHours%24;
  return d+"d "+(h?h+"h ":"")+m+"m";
}
function minRemaining(wins){if(!wins||!wins.length)return null;var m=null;for(var i=0;i<wins.length;i++){var r=Number(wins[i].remainingPercent);if(!Number.isFinite(r))continue;if(m===null||r<m)m=r}return m}
function pctClass(rem){if(rem==null)return"kl-muted";if(rem<=DANGER)return"kl-danger";if(rem<=WARN)return"kl-warn";return"kl-normal"}
function floatPctClass(rem){if(rem==null)return"kl-float-muted";if(rem<=DANGER)return"kl-float-danger";if(rem<=WARN)return"kl-float-warn";return"kl-float-ok"}
function progBarClass(rem){var b="kl-progBar";if(rem<=DANGER)b+=" kl-progDanger";else if(rem<=WARN)b+=" kl-progWarn";return b}

function poolStats(subs){
  var list = Array.isArray(subs) ? subs : [];
  var total = list.length, healthy = 0, warning = 0, exhausted = 0;
  var byProvider = {};
  for (var i = 0; i < list.length; i++) {
    var s = list[i];
    var p = s.provider || "unknown";
    if (!byProvider[p]) byProvider[p] = { total: 0, healthy: 0, warning: 0, exhausted: 0 };
    byProvider[p].total++;
    var wins = (s.quota && s.quota.windows) || [];
    var rem = minRemaining(wins);
    var isErr = !!(s.quota && s.quota.error);
    if (isErr || (rem != null && rem <= DANGER)) {
      exhausted++;
      byProvider[p].exhausted++;
    } else if (rem != null && rem <= WARN) {
      warning++;
      byProvider[p].warning++;
    } else {
      healthy++;
      byProvider[p].healthy++;
    }
  }
  return {
    total: total,
    healthy: healthy,
    warning: warning,
    exhausted: exhausted,
    byProvider: byProvider
  };
}

function findNearestReset(subs){
  var list = Array.isArray(subs) ? subs : [];
  var nearest = null;
  var now = Date.now();
  for (var i = 0; i < list.length; i++) {
    var wins = (list[i].quota && list[i].quota.windows) || [];
    for (var j = 0; j < wins.length; j++) {
      var r = wins[j].resetsAt;
      if (!r) continue;
      var t = typeof r === "number" ? r : Date.parse(r);
      if (Number.isFinite(t) && t > now) {
        if (nearest === null || t < nearest) nearest = t;
      }
    }
  }
  return nearest;
}

var USAGE_HIST_KEY = "kl-usage-history";
var MAX_HIST_AGE_MS = 24 * 3600000;
var MAX_HIST_POINTS = 60;

function loadUsageHistory(){
  if (typeof localStorage === "undefined") return [];
  try {
    var raw = localStorage.getItem(USAGE_HIST_KEY);
    if (!raw) return [];
    var arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    var cutoff = Date.now() - MAX_HIST_AGE_MS;
    var valid = [];
    for (var i = 0; i < arr.length; i++) {
      var pt = arr[i];
      if (pt && typeof pt.t === "number" && typeof pt.q === "number" && pt.t >= cutoff) {
        valid.push(pt);
      }
    }
    return valid;
  } catch(e) {
    return [];
  }
}

function recordUsageSnapshot(worst){
  if (typeof localStorage === "undefined" || worst == null) return;
  var q = Number(worst);
  if (!Number.isFinite(q)) return;
  try {
    var now = Date.now();
    var history = loadUsageHistory();
    var roundedQ = Math.round(q * 10) / 10;
    if (history.length > 0) {
      var last = history[history.length - 1];
      if (now - last.t < 60000) {
        last.q = roundedQ;
        last.t = now;
      } else {
        history.push({ t: now, q: roundedQ });
      }
    } else {
      history.push({ t: now, q: roundedQ });
    }
    if (history.length > MAX_HIST_POINTS) {
      history = history.slice(history.length - MAX_HIST_POINTS);
    }
    localStorage.setItem(USAGE_HIST_KEY, JSON.stringify(history));
  } catch(e) {
    /* best-effort: localStorage quota exceeded */
  }
}

function calcBurnRate(history){
  var pts = Array.isArray(history) ? history : [];
  if (pts.length < 2) return { rate: 0, hoursLeft: null, idle: true };
  var first = pts[0];
  var last = pts[pts.length - 1];
  var dtHours = (last.t - first.t) / 3600000;
  if (dtHours < (5 / 60)) return { rate: 0, hoursLeft: null, idle: true };
  var dq = first.q - last.q;
  if (dq <= 0) return { rate: 0, hoursLeft: null, idle: true };
  var rate = dq / dtHours;
  var hoursLeft = rate > 0 ? (last.q / rate) : null;
  return {
    rate: Math.round(rate * 10) / 10,
    hoursLeft: hoursLeft != null ? Math.round(hoursLeft * 10) / 10 : null,
    idle: false
  };
}

function UsageSparkline(props){
  var history = Array.isArray(props.history) ? props.history : [];
  var w = props.width || 100;
  var h = props.height || 26;
  if (history.length < 2) {
    return jsxs("div", {
      className: "kl-sparkline-wrap",
      children: [
        jsx("div", { className: "kl-statLabel", children: klT("usageTrend") }),
        jsx("div", { className: "kl-meta", children: klT("burnRateIdle") })
      ]
    });
  }
  var minT = history[0].t;
  var maxT = history[history.length - 1].t;
  var tRange = Math.max(1, maxT - minT);
  var pad = 2;
  var innerW = w - pad * 2;
  var innerH = h - pad * 2;

  var pts = [];
  for (var i = 0; i < history.length; i++) {
    var p = history[i];
    var x = pad + ((p.t - minT) / tRange) * innerW;
    var y = pad + ((100 - Math.min(100, Math.max(0, p.q))) / 100) * innerH;
    pts.push(x.toFixed(1) + "," + y.toFixed(1));
  }
  var pointsStr = pts.join(" ");
  var lastQ = history[history.length - 1].q;
  var sCls = lastQ <= DANGER ? "kl-spark-stroke-danger" : (lastQ <= WARN ? "kl-spark-stroke-warn" : "kl-spark-stroke-ok");
  var aCls = lastQ <= DANGER ? "kl-spark-area-danger" : (lastQ <= WARN ? "kl-spark-area-warn" : "kl-spark-area-ok");

  var firstPt = pts[0].split(",");
  var lastPt = pts[pts.length - 1].split(",");
  var areaD = "M " + firstPt[0] + " " + (h - pad) + " L " + pointsStr.replace(/,/g, " ") + " L " + lastPt[0] + " " + (h - pad) + " Z";

  return jsxs("div", {
    className: "kl-sparkline-wrap",
    children: [
      jsx("div", { className: "kl-statLabel", children: klT("usageTrend") }),
      jsxs("svg", {
        width: w,
        height: h,
        viewBox: "0 0 " + w + " " + h,
        className: "kl-sparkline",
        children: [
          jsx("path", { d: areaD, className: aCls }),
          jsx("polyline", {
            fill: "none",
            strokeWidth: 1.8,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            points: pointsStr,
            className: sCls
          })
        ]
      })
    ]
  });
}

function readPos(){try{var r=JSON.parse(localStorage.getItem(POS_KEY)||"null");if(r&&typeof r.x==="number"&&typeof r.y==="number")return r}catch(e){/* best-effort: corrupt or restricted localStorage falls back to default pos */}return null}
function savePos(x,y){try{localStorage.setItem(POS_KEY,JSON.stringify({x:x,y:y}))}catch(e){/* best-effort: storage quota exceeded or disabled */}}
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
  if(s.indexOf("commandcode")!==-1)return "kl-prov-commandcode";
  if(s.indexOf("silicon")!==-1)return "kl-prov-siliconflow";
  if(s.indexOf("anthropic")!==-1)return "kl-prov-anthropic";
  if(s.indexOf("groq")!==-1)return "kl-prov-groq";
  if(s.indexOf("gemini")!==-1)return "kl-prov-gemini";
  return "";
}

function SvgDock(props){
  return jsx("svg",{width:props.size||12,height:props.size||12,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2.2,strokeLinecap:"round",strokeLinejoin:"round",className:props.className,style:props.style,children:[
    jsx("rect",{x:3,y:3,width:18,height:18,rx:2}),
    jsx("path",{d:"M15 3v18"})
  ]});
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
