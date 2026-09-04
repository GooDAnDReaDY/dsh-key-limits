/* float chip — all keys */
function FloatChip(){
  var st=useState({enabled:true,label:"…",worst:null,open:false});
  var enabled=st[0].enabled,label=st[0].label,worst=st[0].worst,open=st[0].open,setSt=st[1];
  var pos=useState(readPos()),drag=useRef({active:false,dx:0,dy:0,moved:false});
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
  var p=pos[0],style={left:p&&p.x!=null?p.x+"px":"auto",top:p&&p.y!=null?p.y+"px":"auto",right:p&&p.x!=null?"auto":"16px",bottom:p&&p.y!=null?"auto":"16px"};
  var floatCls = "kl-float " + floatPctClass(worst);
  return jsxs(React.Fragment,{children:[
    jsx("div",{className:"kl-floatWrap",style:style,
      onPointerMove:function(e){if(!drag.current.active)return;drag.current.moved=true;pos[1]({x:e.clientX-drag.current.dx,y:e.clientY-drag.current.dy})},
      onPointerUp:function(e){if(!drag.current.active)return;drag.current.active=false;var cp=pos[0];if(cp)savePos(cp.x,cp.y);try{e.currentTarget.releasePointerCapture(e.pointerId)}catch(err){}},
      children:jsxs("div",{title:klT("floatTitle"),className:floatCls,
        onPointerDown:function(e){if(e.button!==0)return;drag.current.moved=false;var rect=e.currentTarget.parentElement.getBoundingClientRect();drag.current.active=true;drag.current.dx=e.clientX-rect.left;drag.current.dy=e.clientY-rect.top;e.currentTarget.setPointerCapture(e.pointerId)},
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
