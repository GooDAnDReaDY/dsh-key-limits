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
  var enabled=st[0].enabled,label=st[0].label,worst=st[0].worst,open=st[0].open,setSt=st[1];
  var initialPos = readPos();
  var pos=useState(initialPos ? clampPos(initialPos.x, initialPos.y) : null);
  var drag=useRef({active:false,dx:0,dy:0,moved:false});
  var lastPosRef=useRef(pos[0]);
  useEffect(function(){
    function pull(){
      fetch(API+"/config",{cache:"no-store"}).then(function(r){return r.json()}).then(function(cfg){
        var on=!(cfg.ui&&cfg.ui.floatChip===false);
        if(!on){setSt(function(s){return Object.assign({},s,{enabled:false})});return}
        fetch(API+"/subs",{cache:"no-store"}).then(function(r){return r.json()}).then(function(j){
          var subs=j.subscriptions||[],wMin=null,n=subs.length;
          for(var i=0;i<subs.length;i++){
            var w=(subs[i].quota&&subs[i].quota.windows)||[];
            var m=minRemaining(w);
            if(m!=null&&(wMin===null||m<wMin))wMin=m;
          }
          var text=n?(wMin!=null?fmtPct(wMin):String(n)):klT("activeNone");
          setSt(function(s){return Object.assign({},s,{enabled:true,label:text,worst:wMin})});
        }).catch(function(){});
      }).catch(function(){});
    }
    pull();var t=setInterval(pull,REFRESH_MS);return function(){clearInterval(t)};
  },[]);
  if(!enabled)return null;
  var p=pos[0]?clampPos(pos[0].x,pos[0].y):null,style={left:p&&p.x!=null?p.x+"px":"auto",top:p&&p.y!=null?p.y+"px":"auto",right:p&&p.x!=null?"auto":"16px",bottom:p&&p.y!=null?"auto":"16px"};
  var floatCls = "kl-float " + floatPctClass(worst);
  return jsxs(React.Fragment,{children:[
    jsx("div",{className:"kl-floatWrap",style:style,
      onPointerMove:function(e){
        if(!drag.current.active)return;
        drag.current.moved=true;
        var next=clampPos(e.clientX-drag.current.dx, e.clientY-drag.current.dy);
        lastPosRef.current=next;
        pos[1](next);
      },
      onPointerUp:function(e){
        if(!drag.current.active)return;
        drag.current.active=false;
        var cp=lastPosRef.current;
        if(cp)savePos(cp.x,cp.y);
        try{e.currentTarget.releasePointerCapture(e.pointerId)}catch(err){}
      },
      children:jsxs("div",{title:klT("floatTitle"),className:floatCls,
        onPointerDown:function(e){
          if(e.button!==0)return;
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
          jsx("span",{children:label})
        ]
      })
    }),
    open?jsx(AllLimitsModal,{onClose:function(){setSt(function(s){return Object.assign({},s,{open:false})})},allowEdit:false}):null
  ]});
}

function BodyRoot(){
  return jsx(FloatChip,{});
}
