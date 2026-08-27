/* modals */
function QuotaBars(props){
  var wins=props.windows||[];
  if(!wins.length)return jsx("div",{className:"kl-empty",children:props.empty||klT("noQuota")});
  return jsx("div",{className:"kl-quotaGrid",children:wins.map(function(w){
    var rem=Number(w.remainingPercent)||0;
    return jsxs("div",{key:w.id,className:"kl-row",children:[
      jsxs("div",{className:"kl-rowHead",children:[jsx("div",{className:"kl-rowLabel",children:w.label}),jsx("div",{className:"kl-rowPct",children:fmtPct(rem)+klT("pctLeft")})]}),
      jsx("div",{className:barClass(rem),children:jsx("div",{className:"kl-barFill",style:{width:rem+"%"}})}),
      w.resetsAt?jsx("div",{className:"kl-meta",children:fmtReset(w.resetsAt)}):null
    ]});
  })});
}

function BalanceBlock(props){
  var b=props.balance;if(!b)return null;
  var cur=b.currency||"$";
  var rem=b.cnyRemaining!=null?("¥"+Number(b.cnyRemaining).toFixed(2)):(b.remaining!=null?(cur+Number(b.remaining).toFixed(2)):null);
  return jsxs("div",{className:"kl-row",children:[
    jsx("div",{className:"kl-rowLabel",children:klT("balance")}),
    rem?jsx("div",{className:"kl-rowPct",children:rem}):null,
    b.message?jsx("div",{className:"kl-meta",children:b.message}):null
  ]});
}

function OneLimitModal(props){
  var d=props.data,onClose=props.onClose;
  if(!d)return null;
  var sub=d.sub||{},wins=(d.quota&&d.quota.windows)||[],title=providerLabel(sub.provider|| (d.route&&d.route.provider)),subline=(sub.label||"").trim();
  return jsx(PortalModal,{children:jsx("div",{className:"kl-overlay",onClick:onClose,children:
    jsxs("div",{className:"kl-panel",onClick:function(e){e.stopPropagation()},children:[
      jsxs("div",{className:"kl-panelHead",children:[
        jsxs("div",{children:[jsx("div",{className:"kl-panelTitle",children:title}),subline?jsx("div",{className:"kl-panelSub",children:subline}):jsx("div",{className:"kl-panelSub",children:klT("oneTitle")})]}),
        jsx("button",{type:"button",className:"kl-close",onClick:onClose,children:"✕"})
      ]}),
      jsxs("div",{className:"kl-panelBody",children:[
        d.quota&&d.quota.error?jsx("div",{className:"kl-meta kl-err",children:String(d.quota.error)}):null,
        d.quota&&d.quota.stale?jsx("span",{className:"kl-stale",children:klT("stale")}):null,
        d.balance?jsx(BalanceBlock,{balance:d.balance}):jsx(QuotaBars,{windows:wins}),
        d.quota&&d.quota.fetchedAt?jsx("div",{className:"kl-meta",children:klT("updated")+new Date(d.quota.fetchedAt).toLocaleString()}):null
      ]}),
      jsx("div",{className:"kl-panelFoot",children:jsx("button",{type:"button",className:"kl-btn",onClick:onClose,children:klT("close")})})
    ]})
  })});
}

function SubCard(props){
  var s=props.sub,onRefresh=props.onRefresh,onDelete=props.onDelete,busy=props.busy;
  var wins=(s.quota&&s.quota.windows)||[],bal=s.balance;
  return jsxs("div",{className:"kl-card",children:[
    jsxs("div",{style:{display:"flex",justifyContent:"space-between",gap:8,alignItems:"flex-start"},children:[
      jsxs("div",{style:{minWidth:0,flex:1},children:[
        jsx("div",{className:"kl-cardTitle",children:s.label||s.id}),
        jsx("div",{className:"kl-meta",children:[s.provider,s.plan?" · "+s.plan:"",s.status?" · "+s.status:""].join("")})
      ]}),
      jsxs("div",{style:{display:"flex",gap:4},children:[
        onRefresh?jsx("button",{type:"button",className:"kl-btn",disabled:busy,onClick:function(){onRefresh(s.id)},children:"↻"}):null,
        onDelete?jsx("button",{type:"button",className:"kl-del",title:klT("delete"),onClick:function(){onDelete(s.id,s.label||s.id)},children:"✕"}):null
      ]})
    ]}),
    s.quota&&s.quota.stale?jsx("span",{className:"kl-stale",children:klT("stale")}):null,
    bal?jsx(BalanceBlock,{balance:bal}):jsx(QuotaBars,{windows:wins}),
    s.quota&&s.quota.error?jsx("div",{className:"kl-meta kl-err",children:String(s.quota.error)}):null
  ]});
}

function AllLimitsModal(props){
  var onClose=props.onClose,allowEdit=props.allowEdit;
  var st=useState({loading:true,subscriptions:[],refreshing:false,err:""});
  var state=st[0],setSt=st[1];
  var load=useCallback(function(refresh){
    var q=refresh?"?refresh=1":"";
    if(refresh)setSt(function(s){return Object.assign({},s,{refreshing:true})});
    fetch(API+"/subs"+q,{cache:"no-store"}).then(function(r){return r.json()}).then(function(j){
      setSt({loading:false,subscriptions:j.subscriptions||[],refreshing:!!j.refreshing,err:""});
    }).catch(function(e){setSt(function(s){return Object.assign({},s,{loading:false,refreshing:false,err:String(e&&e.message||e)})})});
  },[]);
  useEffect(function(){load(false);var t=setInterval(function(){load(false)},REFRESH_MS);return function(){clearInterval(t)}},[load]);
  function refreshOne(id){
    setSt(function(s){return Object.assign({},s,{refreshing:true})});
    fetch(API+"/subs?refresh=1&id="+encodeURIComponent(id),{cache:"no-store"}).then(function(r){return r.json()}).then(function(j){
      setSt({loading:false,subscriptions:j.subscriptions||[],refreshing:!!j.refreshing,err:""});
    }).catch(function(e){setSt(function(s){return Object.assign({},s,{refreshing:false,err:String(e&&e.message||e)})})});
  }
  function deleteOne(id,label){
    if(!confirm(klT("deleteConfirm")+label+"»?"))return;
    fetch(API+"/subs?id="+encodeURIComponent(id),{method:"DELETE"}).then(function(){load(false)}).catch(function(e){
      setSt(function(s){return Object.assign({},s,{err:String(e&&e.message||e)})});
    });
  }
  return jsx(PortalModal,{children:jsx("div",{className:"kl-overlay",onClick:onClose,children:
    jsxs("div",{className:"kl-panel kl-panelWide",onClick:function(e){e.stopPropagation()},children:[
      jsxs("div",{className:"kl-panelHead",children:[
        jsxs("div",{children:[jsx("div",{className:"kl-panelTitle",children:klT("allTitle")}),jsx("div",{className:"kl-panelSub",children:klT("allSub")})]}),
        jsx("button",{type:"button",className:"kl-close",onClick:onClose,children:"✕"})
      ]}),
      jsxs("div",{className:"kl-panelBody",children:[
        jsxs("div",{className:"kl-toolbar",children:[
          jsx("button",{type:"button",className:"kl-btn",disabled:state.refreshing,onClick:function(){load(true)},children:state.refreshing?klT("refreshing"):klT("refreshAll")})
        ]}),
        state.loading?jsx("div",{className:"kl-meta",children:klT("loading")}):null,
        !state.loading&&!state.subscriptions.length?jsx("div",{className:"kl-empty",children:klT("noSubs")}):null,
        jsx("div",{className:"kl-list",children:state.subscriptions.map(function(s){
          return jsx(SubCard,{key:s.id,sub:s,busy:state.refreshing,onRefresh:refreshOne,onDelete:allowEdit?deleteOne:null});
        })}),
        state.err?jsx("div",{className:"kl-meta kl-err",children:state.err}):null
      ]}),
      jsx("div",{className:"kl-panelFoot",children:jsx("button",{type:"button",className:"kl-btn",onClick:onClose,children:klT("close")})})
    ]})
  })});
}
