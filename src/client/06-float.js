/* float chip — all keys */
function FloatChip(){
  var st=useState({enabled:true,label:"…",open:false});
  var enabled=st[0].enabled,label=st[0].label,open=st[0].open,setSt=st[1];
  var pos=useState(readPos()),drag=useRef({active:false,dx:0,dy:0,moved:false});
  useEffect(function(){
    function pull(){
      fetch(API+"/config",{cache:"no-store"}).then(function(r){return r.json()}).then(function(cfg){
        var on=!(cfg.ui&&cfg.ui.floatChip===false);
        if(!on){setSt(function(s){return Object.assign({},s,{enabled:false})});return}
        fetch(API+"/subs",{cache:"no-store"}).then(function(r){return r.json()}).then(function(j){
          var subs=j.subscriptions||[],worst=null,n=subs.length;
          for(var i=0;i<subs.length;i++){
            var w=(subs[i].quota&&subs[i].quota.windows)||[];
            var m=minRemaining(w);
            if(m!=null&&(worst===null||m<worst))worst=m;
          }
          var text=n? (worst!=null?fmtPct(worst):String(n)):klT("activeNone");
          setSt(function(s){return Object.assign({},s,{enabled:true,label:text})});
        }).catch(function(){});
      }).catch(function(){});
    }
    pull();var t=setInterval(pull,REFRESH_MS);return function(){clearInterval(t)};
  },[]);
  if(!enabled)return null;
  var p=pos[0],style={left:p&&p.x!=null?p.x:"auto",top:p&&p.y!=null?p.y:"auto",right:p&&p.x!=null?"auto":16,bottom:p&&p.y!=null?"auto":16};
  return jsxs(React.Fragment,{children:[
    jsx("div",{className:"kl-floatWrap",style:style,
      onPointerMove:function(e){if(!drag.current.active)return;drag.current.moved=true;pos[1]({x:e.clientX-drag.current.dx,y:e.clientY-drag.current.dy})},
      onPointerUp:function(e){if(!drag.current.active)return;drag.current.active=false;var cp=pos[0];if(cp)savePos(cp.x,cp.y);try{e.currentTarget.releasePointerCapture(e.pointerId)}catch(err){}},
      children:jsx("div",{title:klT("floatTitle"),className:"kl-float",
        onPointerDown:function(e){if(e.button!==0)return;drag.current.moved=false;var rect=e.currentTarget.parentElement.getBoundingClientRect();drag.current.active=true;drag.current.dx=e.clientX-rect.left;drag.current.dy=e.clientY-rect.top;e.currentTarget.setPointerCapture(e.pointerId)},
        onClick:function(){if(!drag.current.moved)setSt(function(s){return Object.assign({},s,{open:true})})},
        children:label
      })
    }),
    open?jsx(AllLimitsModal,{onClose:function(){setSt(function(s){return Object.assign({},s,{open:false})})},allowEdit:false}):null
  ]});
}

function KlErrorBoundary(props){
  return React.createElement(KlEBInner,props);
}
function KlEBInner(props){
  var st=useState({err:null});
  if(st[0].err){
    return jsxs("div",{className:"kl-errBox",children:[
      jsx("div",{style:{fontWeight:600,marginBottom:6},children:klT("errTitle")}),
      jsx("div",{className:"kl-meta",children:String(st[0].err.message||st[0].err)}),
      jsx("button",{type:"button",className:"kl-btn",style:{marginTop:10},onClick:function(){st[1]({err:null})},children:klT("retry")})
    ]});
  }
  return props.children;
}
// class-less error boundary via unstable — use simple wrapper with componentDidCatch pattern
var KlEB=/*#__PURE__*/(function(_React$Component){
  function KlEB(props){React.Component.call(this,props);this.state={err:null}}
  KlEB.prototype=Object.create(React.Component.prototype);KlEB.prototype.constructor=KlEB;
  KlEB.getDerivedStateFromError=function(err){return{err:err}};
  KlEB.prototype.componentDidCatch=function(){};
  KlEB.prototype.render=function(){
    var self=this;
    if(self.state.err){
      return jsxs("div",{className:"kl-errBox",children:[
        jsx("div",{style:{fontWeight:600,marginBottom:6},children:klT("errTitle")}),
        jsx("div",{className:"kl-meta",children:String(self.state.err&&self.state.err.message||self.state.err)}),
        jsx("button",{type:"button",className:"kl-btn",style:{marginTop:10},onClick:function(){self.setState({err:null})},children:klT("retry")})
      ]});
    }
    return self.props.children;
  };
  return KlEB;
})();

function BodyRoot(){
  return jsx(KlEB,{children:jsx(FloatChip,{})});
}
