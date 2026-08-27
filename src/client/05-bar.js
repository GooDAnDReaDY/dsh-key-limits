/* composer bar — active key only */
function ActiveKeyButton(props){
  var sessionId=props.sessionId||sid(props)||sessionIdFromCtx();
  var st=useState({loading:true,data:null,open:false});
  var data=st[0].data,loading=st[0].loading,open=st[0].open,setSt=st[1];
  var load=useCallback(function(){
    if(!sessionId){setSt(function(s){return{loading:false,data:null,open:s.open}});return}
    fetch(API+"/active-sub?sessionId="+encodeURIComponent(sessionId),{cache:"no-store"}).then(function(r){return r.json()}).then(function(j){
      setSt(function(s){return{loading:false,data:j,open:s.open}});
    }).catch(function(){setSt(function(s){return{loading:false,open:s.open}})});
  },[sessionId]);
  useEffect(function(){load();var t=setInterval(load,REFRESH_MS);return function(){clearInterval(t)}},[load]);
  if(loading&&!data)return jsx("button",{type:"button",className:"kl-chip",disabled:true,children:"…"});
  if(!sessionId)return jsx("button",{type:"button",className:"kl-chip kl-muted kl-stale",disabled:true,children:klT("activeNoSession")});
  if(!data||!data.subId){
    return jsx("button",{type:"button",className:"kl-chip kl-muted",title:data&&data.error||"",disabled:true,children:klT("activeNone")});
  }
  var wins=(data.quota&&data.quota.windows)||[],rem=minRemaining(wins);
  if(data.balance){
    var label=data.balance.cnyRemaining!=null?("¥"+Number(data.balance.cnyRemaining).toFixed(0)):(data.balance.remaining!=null?String(Math.round(Number(data.balance.remaining))):klT("balance"));
    return jsxs(React.Fragment,{children:[
      jsx("button",{type:"button",className:"kl-chip kl-ok",title:(data.sub&&data.sub.label)||"",onClick:function(){setSt(function(s){return Object.assign({},s,{open:true})})},children:label}),
      open?jsx(OneLimitModal,{data:data,onClose:function(){setSt(function(s){return Object.assign({},s,{open:false})})}}):null
    ]});
  }
  var cls="kl-chip "+pctClass(rem)+(data.quota&&data.quota.stale?" kl-stale":"");
  return jsxs(React.Fragment,{children:[
    jsx("button",{type:"button",className:cls,title:(data.sub&&data.sub.label)||providerLabel(data.sub&&data.sub.provider),onClick:function(){setSt(function(s){return Object.assign({},s,{open:true})})},children:rem!=null?fmtPct(rem):"—"}),
    open?jsx(OneLimitModal,{data:data,onClose:function(){setSt(function(s){return Object.assign({},s,{open:false})})}}):null
  ]});
}
