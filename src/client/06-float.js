function clampPos(x, y) {
  if (typeof window === "undefined") return { x: x, y: y };
  var pad = 8;
  var maxW = Math.max(pad, (window.innerWidth || 1024) - 90);
  var maxH = Math.max(pad, (window.innerHeight || 768) - 50);
  return {
    x: Math.max(pad, Math.min(maxW, x)),
    y: Math.max(pad, Math.min(maxH, y)),
  };
}

/* float chip — all keys */
function FloatChip(){
  var st=useState({enabled:true,label:"…",worst:null,open:false});
  var enabled=st[0].enabled,label=st[0].label,worst=st[0].worst,open=st[0].open,nearestReset=st[0].nearestReset,setSt=st[1];
  var initialPos = readPos();
  var pos=useState(initialPos ? clampPos(initialPos.x, initialPos.y) : null);
  var drag=useRef({active:false,dx:0,dy:0,moved:false});
  var lastPosRef=useRef(pos[0]);

  var dockedSt = useState(function(){
    try { return localStorage.getItem("kl-chip-docked") === "true"; } catch(e){ return false; }
  });
  var docked = dockedSt[0], setDocked = dockedSt[1];

  var toastSt = useState(null);

  // Alt+K Hotkey (#78)
  useEffect(function(){
    if (typeof window === "undefined") return;
    function onKey(e){
      if (e.altKey && (e.key === "k" || e.key === "K" || e.code === "KeyK")) {
        e.preventDefault();
        setSt(function(s){ return Object.assign({}, s, { open: !s.open }); });
      }
    }
    window.addEventListener("keydown", onKey);
    return function(){ window.removeEventListener("keydown", onKey); };
  }, []);

  useEffect(function(){
    function pull(){
      fetchJson(API+"/config",{cache:"no-store"}).then(function(cfg){
        var on=!(cfg.ui&&cfg.ui.floatChip===false);
        if(!on){setSt(function(s){return Object.assign({},s,{enabled:false})});return}
        var curSid = sessionIdFromCtx();
        var subsPromise = fetchJson(API+"/subs",{cache:"no-store"});
        var activePromise = curSid ? fetchJson(API+"/active-sub?sessionId="+encodeURIComponent(curSid),{cache:"no-store"}).catch(function(){ return null; }) : Promise.resolve(null);
        Promise.all([subsPromise, activePromise]).then(function(res){
          var j = res[0] || {};
          var activeData = res[1] || null;
          var subs=j.subscriptions||[],wMin=null,n=subs.length;
          for(var i=0;i<subs.length;i++){
            var w=(subs[i].quota&&subs[i].quota.windows)||[];
            var m=minRemaining(w);
            if(m!=null&&(wMin===null||m<wMin))wMin=m;
          }
          if(wMin!=null) recordUsageSnapshot(wMin, activeData ? activeData.subId : null);
          var nr = findNearestReset(subs);
          var text=n?(wMin!=null?fmtPct(wMin):String(n)):klT("activeNone");
          setSt(function(s){return Object.assign({},s,{enabled:true,label:text,worst:wMin,nearestReset:nr})});

          // Danger Toast (#79 & issue 114): Scoped to active session subscription only
          if(activeData && activeData.subId){
            var isCrit = false;
            var toastRem = null;
            if(activeData.balance){
              var bRem = Number(activeData.balance.remaining);
              if(!Number.isFinite(bRem) || bRem <= 0){
                isCrit = true;
                toastRem = 0;
              }
            } else {
              var aWins = (activeData.quota && activeData.quota.windows) || [];
              var aRem = minRemaining(aWins);
              if(aRem != null && aRem <= DANGER){
                isCrit = true;
                toastRem = aRem;
              }
            }
            if(isCrit){
              try {
                var toastKey = "kl-last-danger-toast-" + activeData.subId;
                var lastToast = Number(sessionStorage.getItem(toastKey) || 0);
                if (Date.now() - lastToast > 30 * 60000) {
                  sessionStorage.setItem(toastKey, String(Date.now()));
                  toastSt[1]({ rem: toastRem != null ? toastRem : 0, label: (activeData.sub && activeData.sub.label) || activeData.subId });
                  setTimeout(function(){ toastSt[1](null); }, 6000);
                }
              } catch(err) {
                /* best-effort */
              }
            }
          }
        }).catch(function(){/* best-effort */});
      }).catch(function(){/* best-effort */});
    }
    pull();var t=setInterval(pull,REFRESH_MS);return function(){clearInterval(t)};
  },[]);
  if(!enabled)return null;

  function toggleDock(e){
    e.stopPropagation();
    var next = !docked;
    setDocked(next);
    try { localStorage.setItem("kl-chip-docked", String(next)); } catch(err) {/* best-effort: localStorage failed */}
  }

  var p=pos[0]?clampPos(pos[0].x,pos[0].y):null;
  var style = docked ? {} : {left:p&&p.x!=null?p.x+"px":"auto",top:p&&p.y!=null?p.y+"px":"auto",right:p&&p.x!=null?"auto":"16px",bottom:p&&p.y!=null?"auto":"16px"};
  var wrapCls = "kl-floatWrap" + (docked ? " kl-float-docked" : "");
  var floatCls = "kl-float " + floatPctClass(worst);
  var chipTitle = klT("floatTitle");
  if(nearestReset){
    var rStr = fmtReset(nearestReset);
    if(rStr) chipTitle += " (" + klT("resetsIn") + rStr + ")";
  }
  chipTitle += " [" + klT("hotkeyHint") + "]";

  return jsxs(React.Fragment,{children:[
    toastSt[0] ? jsxs("div", {
      className: "kl-danger-toast",
      onClick: function(){
        toastSt[1](null);
        setSt(function(s){ return Object.assign({}, s, { open: true }); });
      },
      children: [
        jsx(SvgAlert, { size: 16 }),
        jsxs("span", {
          className: "kl-danger-toast-text",
          children: [klT("dangerToast") + ": ", fmtPct(toastSt[0].rem) + " " + klT("dangerRemaining")]
        })
      ]
    }) : null,
    jsx("div",{className:wrapCls,style:style,
      onPointerMove:function(e){
        if(docked || !drag.current.active)return;
        drag.current.moved=true;
        var next=clampPos(e.clientX-drag.current.dx, e.clientY-drag.current.dy);
        lastPosRef.current=next;
        pos[1](next);
      },
      onPointerUp:function(e){
        if(docked || !drag.current.active)return;
        drag.current.active=false;
        var cp=lastPosRef.current;
        if(cp)savePos(cp.x,cp.y);
        try{e.currentTarget.releasePointerCapture(e.pointerId)}catch(err){/* best-effort: pointer capture might have already been released */}
      },
      children:jsxs("div",{title:chipTitle,className:floatCls,
        onPointerDown:function(e){
          if(docked || e.button!==0)return;
          drag.current.moved=false;
          var rect=e.currentTarget.parentElement.getBoundingClientRect();
          drag.current.active=true;
          drag.current.dx=e.clientX-rect.left;
          drag.current.dy=e.clientY-rect.top;
          e.currentTarget.setPointerCapture(e.pointerId);
        },
        onClick:function(){if(!drag.current.moved)setSt(function(s){return Object.assign({},s,{open:true})})},
        children:[
          jsx(SvgKey,{size:13,className:"kl-icon"}),
          jsx("span",{children:label}),
          jsx("button",{
            type:"button",
            className:"kl-dock-btn",
            title:docked ? klT("undock") : klT("dock"),
            onClick:toggleDock,
            children:jsx(SvgDock,{size:11})
          })
        ]
      })
    }),
    open?jsx(AllLimitsModal,{onClose:function(){setSt(function(s){return Object.assign({},s,{open:false})})},allowEdit:false}):null
  ]});
}

function BodyRoot(){
  return jsx(FloatChip,{});
}
