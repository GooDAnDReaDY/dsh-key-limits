window.__ModuleLoader__.load({id:"@goodandready-private/dsh-key-limits",factory:(require)=>{var module={exports:{}},exports=module.exports,React=require("react"),ReactDOM=require("react-dom/client"),createPortal=require("react-dom").createPortal,jsx=require("react/jsx-runtime").jsx,jsxs=require("react/jsx-runtime").jsxs,useState=React.useState,useEffect=React.useEffect,useCallback=React.useCallback,useRef=React.useRef,API="/dsh-key-limits",NS="dsh-key-limits",REFRESH_MS=60000,WARN=30,DANGER=15,POS_KEY="kl-chip-pos",klCtx=null;
var css=".kl-chip{display:inline-flex;align-items:center;justify-content:center;height:26px;min-width:40px;padding:0 10px;border-radius:999px;border:1px solid transparent;background:transparent;font-size:13px;font-weight:700;line-height:1;cursor:pointer;user-select:none;font-variant-numeric:tabular-nums;white-space:nowrap}.kl-chip:hover{filter:brightness(1.08)}.kl-chip.kl-ok{color:var(--dsw-alias-state-success-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary) 55%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 12%,transparent)}.kl-chip.kl-warn{color:var(--dsw-alias-state-warn-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 55%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 12%,transparent)}.kl-chip.kl-danger{color:var(--dsw-alias-state-error-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 55%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 12%,transparent)}.kl-chip.kl-muted{color:var(--dsw-alias-label-tertiary);border-color:var(--dsw-alias-border-l2);background:transparent}.kl-chip.kl-stale{opacity:.55}.kl-overlay{position:fixed;inset:0;z-index:10050;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--dsw-alias-mask,rgba(0,0,0,.45));backdrop-filter:blur(3px)}.kl-panel{box-sizing:border-box;width:min(420px,94vw);max-height:min(86vh,720px);display:flex;flex-direction:column;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l2);border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,.22);color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.45}.kl-panelWide{width:min(640px,96vw)}.kl-panelHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:16px 18px 12px;border-bottom:1px solid var(--dsw-alias-border-l1)}.kl-panelTitle{font-size:15px;font-weight:600;line-height:1.3}.kl-panelSub{font-size:12px;color:var(--dsw-alias-label-tertiary);margin-top:3px}.kl-panelBody{flex:1;min-height:0;overflow:auto;padding:16px 18px 18px;display:flex;flex-direction:column;gap:14px}.kl-panelFoot{padding:12px 18px;border-top:1px solid var(--dsw-alias-border-l1);display:flex;justify-content:flex-end;gap:10px}.kl-close{width:30px;height:30px;border:none;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:16px}.kl-close:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.kl-meta{font-size:11px;color:var(--dsw-alias-label-tertiary);line-height:1.4}.kl-empty{padding:14px;border:1px dashed var(--dsw-alias-border-l1);border-radius:12px;color:var(--dsw-alias-label-tertiary);font-size:12px;text-align:center}.kl-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:7px 14px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:12px;cursor:pointer}.kl-btnPrimary{border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary) 45%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 12%,transparent)}.kl-row{display:flex;flex-direction:column;gap:6px;padding:12px 14px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-2)}.kl-rowHead{display:flex;align-items:baseline;justify-content:space-between;gap:8px}.kl-rowLabel{font-size:12px;font-weight:500}.kl-rowPct{font-size:12px;font-weight:600;font-variant-numeric:tabular-nums}.kl-bar{height:8px;border-radius:999px;background:var(--dsw-alias-bg-layer-3);overflow:hidden}.kl-barFill{height:100%;border-radius:999px;background:var(--dsw-alias-state-success-primary);transition:width .25s}.kl-barWarn .kl-barFill{background:var(--dsw-alias-state-warn-primary)}.kl-barDanger .kl-barFill{background:var(--dsw-alias-state-error-primary)}.kl-quotaGrid{display:flex;flex-direction:column;gap:12px}.kl-floatWrap{position:fixed;z-index:9990;touch-action:none}.kl-float{display:flex;align-items:center;gap:8px;height:30px;padding:0 14px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:12px;cursor:grab;box-shadow:0 6px 20px rgba(0,0,0,.12);font-variant-numeric:tabular-nums;font-weight:600}.kl-card{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:12px 14px;background:var(--dsw-alias-bg-layer-2)}.kl-cardTitle{font-weight:600;font-size:13px}.kl-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px}.kl-input{width:100%;box-sizing:border-box;height:34px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px}.kl-field{display:flex;flex-direction:column;gap:6px;padding:12px 0}.kl-fieldLabel{font-size:11px;color:var(--dsw-alias-label-tertiary)}.kl-stale{display:inline-flex;padding:2px 8px;border-radius:999px;font-size:10px;color:var(--dsw-alias-state-warn-primary);border:1px solid color-mix(in srgb,var(--dsw-alias-state-warn-primary) 50%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 12%,transparent)}.kl-err{color:var(--dsw-alias-state-error-primary)}.kl-card{list-style:none}.kl-item{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;list-style:none}.kl-head{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:12px;display:flex;align-items:center;gap:12px;padding:14px 16px}.kl-grow{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}.kl-title{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}.kl-sub{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.45}.kl-body{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding-bottom:8px}.kl-chev{margin-left:auto;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.6}.kl-list{display:flex;flex-direction:column;gap:10px}.kl-del{width:28px;height:28px;border:none;border-radius:8px;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer}.kl-del:hover{color:var(--dsw-alias-state-error-primary)}.kl-errBox{padding:16px;border:1px solid color-mix(in srgb,var(--dsw-alias-state-error-primary) 40%,transparent);border-radius:12px;background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 10%,transparent)}";
if(typeof document!=="undefined"&&!document.querySelector("[data-kl-css]")){var tag=document.createElement("style");tag.setAttribute("data-kl-css","1");tag.textContent=css;document.head.appendChild(tag)}
var KL_en={
  title:"Key Limits",subtitle:"API keys and subscription quotas",
  loading:"Loading…",close:"Close",cancel:"Cancel",save:"Save",add:"Add",
  refresh:"Refresh",refreshAll:"Refresh all",refreshing:"Refreshing…",
  delete:"Delete",noSubs:"No keys yet",noQuota:"No quota data",
  stale:"stale",pctLeft:" left",updated:"Updated ",
  activeNone:"—",activeNoSession:"session",
  floatTitle:"Key limits — click: all, drag: move",
  allTitle:"Subscription limits",allSub:"All keys",
  oneTitle:"Active key limits",
  addKey:"Add key",pickProvider:"Choose a provider",
  labelOptional:"Label (optional)",secret:"Secret / key",extra:"Extra",
  fillFields:"Fill in: ",saveError:"save error",
  deleteConfirm:"Delete key «",
  uiHint:"Float chip and composer bar — cordis ui.*",
  dataPath:"Data: ~/.dsh/storages/dsh-key-limits/",
  errTitle:"Key Limits: UI error",retry:"Retry",
  balance:"Balance",remaining:"remaining",
  pickDash:"— choose —"
};
var KL_ru={
  title:"Лимиты ключей",subtitle:"API-ключи и квоты подписок",
  loading:"Загрузка…",close:"Закрыть",cancel:"Отмена",save:"Сохранить",add:"Добавить",
  refresh:"Обновить",refreshAll:"Обновить все",refreshing:"Обновление…",
  delete:"Удалить",noSubs:"Ключей пока нет",noQuota:"Нет данных квоты",
  stale:"устарело",pctLeft:" ост.",updated:"Обновлено ",
  activeNone:"—",activeNoSession:"сессия",
  floatTitle:"Лимиты ключей — клик: все, drag: переместить",
  allTitle:"Лимиты подписок",allSub:"Все ключи",
  oneTitle:"Лимиты активного ключа",
  addKey:"Добавить ключ",pickProvider:"Выберите провайдера",
  labelOptional:"Метка (опционально)",secret:"Секрет / ключ",extra:"Дополнительно",
  fillFields:"Заполните: ",saveError:"ошибка сохранения",
  deleteConfirm:"Удалить ключ «",
  uiHint:"Float chip и кнопка в строке ввода — cordis ui.*",
  dataPath:"Данные: ~/.dsh/storages/dsh-key-limits/",
  errTitle:"Key Limits: ошибка UI",retry:"Повторить",
  balance:"Баланс",remaining:"остаток",
  pickDash:"— выбрать —"
};
function klLang(){try{var l=(klCtx&&klCtx.locale&&klCtx.locale.locale)||(typeof navigator!=="undefined"&&navigator.language)||"en";return String(l).toLowerCase().indexOf("ru")===0?"ru":"en"}catch(e){return"en"}}
function klT(key){var dict=klLang()==="ru"?KL_ru:KL_en;return dict[key]!=null?dict[key]:(KL_en[key]!=null?KL_en[key]:key)}
function makeT(dict,fb){return function(k){return dict[k]!=null?dict[k]:(fb[k]!=null?fb[k]:k)}}
function useActiveLocale(ctx){var st=useState(function(){try{return (ctx.locale&&ctx.locale.locale)||"en"}catch(e){return"en"}});useEffect(function(){if(!ctx||!ctx.locale||!ctx.locale.watch)return;return ctx.locale.watch(function(l){st[1](l)})},[ctx]);return String(st[0]||"").toLowerCase().indexOf("ru")===0?"ru":"en"}
function sid(p){return p&&(p.sessionId||(p.session&&(p.session.sessionId||p.session.id)))||""}
function sessionIdFromCtx(){try{var s=klCtx&&klCtx.sessions&&klCtx.sessions.list&&klCtx.sessions.list.getSnapshot();return s&&s.current||""}catch(e){return ""}}
function fmtPct(n){var x=Number(n);return Number.isFinite(x)?Math.round(x)+"%":"—"}
function fmtReset(resetsAt){if(!resetsAt)return"";var t=Date.parse(resetsAt);if(!Number.isFinite(t))return"";var ms=t-Date.now();if(ms<=0)return klT("refresh");var h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000);return (h?h+"h ":"")+m+"m"}
function minRemaining(wins){if(!wins||!wins.length)return null;var m=null;for(var i=0;i<wins.length;i++){var r=Number(wins[i].remainingPercent);if(!Number.isFinite(r))continue;if(m===null||r<m)m=r}return m}
function pctClass(rem){if(rem==null)return"kl-muted";if(rem<=DANGER)return"kl-danger";if(rem<=WARN)return"kl-warn";return"kl-ok"}
function barClass(rem){var b="kl-bar";if(rem<=DANGER)b+=" kl-barDanger";else if(rem<=WARN)b+=" kl-barWarn";return b}
function readPos(){try{var r=JSON.parse(localStorage.getItem(POS_KEY)||"null");if(r&&typeof r.x==="number"&&typeof r.y==="number")return r}catch(e){}return null}
function savePos(x,y){try{localStorage.setItem(POS_KEY,JSON.stringify({x:x,y:y}))}catch(e){}}
function PortalModal(props){return createPortal(props.children,document.body)}
function providerLabel(p){return p||"?"}
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
function ActiveKeyBound(props){
  var id=sid(props)||sessionIdFromCtx();
  return jsx(ActiveKeyButton,{sessionId:id});
}

function ActiveKeyButton(props){
  var sessionId=props.sessionId||"";
  var st=useState({loading:true,data:null,open:false});
  var data=st[0].data,loading=st[0].loading,open=st[0].open,setSt=st[1];
  var load=useCallback(function(){
    if(!sessionId){setSt(function(s){return{loading:false,data:null,open:s.open}});return}
    fetch(API+"/active-sub?sessionId="+encodeURIComponent(sessionId),{cache:"no-store"}).then(function(r){return r.json()}).then(function(j){
      setSt(function(s){return{loading:false,data:j,open:s.open}});
    }).catch(function(){setSt(function(s){return{loading:false,data:null,open:s.open}})});
  },[sessionId]);
  useEffect(function(){load();var t=setInterval(load,REFRESH_MS);return function(){clearInterval(t)}},[load]);

  function openModal(){setSt(function(s){return Object.assign({},s,{open:true})})}
  function closeModal(){setSt(function(s){return Object.assign({},s,{open:false})})}

  if(loading&&!data){
    return jsx("button",{type:"button",className:"kl-chip kl-muted",title:klT("loading"),children:"…"});
  }
  if(!sessionId){
    return jsx("button",{type:"button",className:"kl-chip kl-muted",title:klT("activeNoSession"),children:klT("activeNone")});
  }
  if(!data||!data.subId){
    // visible placeholder — click still useful once keys matched; show em-dash not disabled hide
    return jsx("button",{type:"button",className:"kl-chip kl-muted",title:(data&&data.error)||klT("activeNone"),children:klT("activeNone")});
  }
  var wins=(data.quota&&data.quota.windows)||[],rem=minRemaining(wins);
  if(data.balance){
    var label=data.balance.cnyRemaining!=null?("¥"+Number(data.balance.cnyRemaining).toFixed(0)):(data.balance.remaining!=null?String(Math.round(Number(data.balance.remaining))):klT("balance"));
    return jsxs(React.Fragment,{children:[
      jsx("button",{type:"button",className:"kl-chip kl-ok",title:(data.sub&&data.sub.label)||"",onClick:openModal,children:label}),
      open?jsx(OneLimitModal,{data:data,onClose:closeModal}):null
    ]});
  }
  var cls="kl-chip "+pctClass(rem)+(data.quota&&data.quota.stale?" kl-stale":"");
  return jsxs(React.Fragment,{children:[
    jsx("button",{type:"button",className:cls,title:(data.sub&&data.sub.label)||providerLabel(data.sub&&data.sub.provider),onClick:openModal,children:rem!=null?fmtPct(rem):"—"}),
    open?jsx(OneLimitModal,{data:data,onClose:closeModal}):null
  ]});
}
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
function AddKeyModal(props){
  var onClose=props.onClose,onSaved=props.onSaved;
  var st=useState({loading:true,schemas:{},provider:"",label:"",secret:"",extra:"",err:"",saving:false});
  var s=st[0],setSt=st[1];
  useEffect(function(){
    fetch(API+"/subs",{cache:"no-store"}).then(function(r){return r.json()}).then(function(j){
      setSt(function(x){return Object.assign({},x,{loading:false,schemas:j.providerSchemas||{}})});
    }).catch(function(e){setSt(function(x){return Object.assign({},x,{loading:false,err:String(e&&e.message||e)})})});
  },[]);
  var providers=Object.keys(s.schemas||{}).sort();
  var schema=s.provider&&s.schemas[s.provider];
  function save(){
    if(!s.provider||!s.secret.trim()){setSt(function(x){return Object.assign({},x,{err:klT("fillFields")+( !s.provider?"provider ":"")+( !s.secret.trim()?"secret":"")})});return}
    setSt(function(x){return Object.assign({},x,{saving:true,err:""})});
    fetch(API+"/subs",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({provider:s.provider,secret:s.secret,extra:s.extra,label:s.label})}).then(function(r){return r.json()}).then(function(j){
      if(j.error){setSt(function(x){return Object.assign({},x,{saving:false,err:j.error})});return}
      onSaved&&onSaved();onClose&&onClose();
    }).catch(function(e){setSt(function(x){return Object.assign({},x,{saving:false,err:String(e&&e.message||e)||klT("saveError")})})});
  }
  return jsx(PortalModal,{children:jsx("div",{className:"kl-overlay",onClick:onClose,children:
    jsxs("div",{className:"kl-panel",onClick:function(e){e.stopPropagation()},children:[
      jsxs("div",{className:"kl-panelHead",children:[
        jsxs("div",{children:[jsx("div",{className:"kl-panelTitle",children:klT("addKey")}),jsx("div",{className:"kl-panelSub",children:klT("pickProvider")})]}),
        jsx("button",{type:"button",className:"kl-close",onClick:onClose,children:"✕"})
      ]}),
      jsx("div",{className:"kl-panelBody",children:s.loading?jsx("div",{className:"kl-meta",children:klT("loading")}):jsxs(React.Fragment,{children:[
        jsxs("div",{className:"kl-field",children:[
          jsx("div",{className:"kl-fieldLabel",children:klT("pickProvider")}),
          jsxs("select",{className:"kl-input",value:s.provider,onChange:function(e){setSt(function(x){return Object.assign({},x,{provider:e.target.value})})},children:[
            jsx("option",{value:"",children:klT("pickDash")}),
            providers.map(function(p){return jsx("option",{key:p,value:p,children:(s.schemas[p]&&s.schemas[p].label)||p})})
          ]})
        ]}),
        schema&&schema.hint?jsx("div",{className:"kl-meta",children:schema.hint}):null,
        jsxs("div",{className:"kl-field",children:[jsx("div",{className:"kl-fieldLabel",children:klT("labelOptional")}),jsx("input",{className:"kl-input",value:s.label,onChange:function(e){setSt(function(x){return Object.assign({},x,{label:e.target.value})})}})]} ),
        jsxs("div",{className:"kl-field",children:[jsx("div",{className:"kl-fieldLabel",children:klT("secret")}),jsx("input",{className:"kl-input",type:"password",value:s.secret,onChange:function(e){setSt(function(x){return Object.assign({},x,{secret:e.target.value})})}})]} ),
        schema&&schema.extra?jsxs("div",{className:"kl-field",children:[jsx("div",{className:"kl-fieldLabel",children:klT("extra")}),jsx("input",{className:"kl-input",value:s.extra,onChange:function(e){setSt(function(x){return Object.assign({},x,{extra:e.target.value})})}})]}):null,
        s.err?jsx("div",{className:"kl-meta kl-err",children:s.err}):null
      ]})}),
      jsxs("div",{className:"kl-panelFoot",children:[
        jsx("button",{type:"button",className:"kl-btn",onClick:onClose,children:klT("cancel")}),
        jsx("button",{type:"button",className:"kl-btn kl-btnPrimary",disabled:s.saving,onClick:save,children:s.saving?klT("loading"):klT("save")})
      ]})
    ]})
  })});
}

function KeysSettingsBody(){
  var st=useState({addOpen:false,tick:0});
  var addOpen=st[0].addOpen,setSt=st[1];
  return jsxs("div",{children:[
    jsxs("div",{className:"kl-toolbar",children:[
      jsx("button",{type:"button",className:"kl-btn kl-btnPrimary",onClick:function(){setSt(function(s){return Object.assign({},s,{addOpen:true})})},children:klT("add")})
    ]}),
    jsx(KeysInlineList,{key:st[0].tick}),
    addOpen?jsx(AddKeyModal,{onClose:function(){setSt(function(s){return Object.assign({},s,{addOpen:false})})},onSaved:function(){setSt(function(s){return Object.assign({},s,{addOpen:false,tick:s.tick+1})})}}):null,
    jsx("div",{className:"kl-meta",style:{marginTop:8},children:klT("uiHint")}),
    jsx("div",{className:"kl-meta",children:klT("dataPath")})
  ]});
}

function KeysInlineList(){
  var st=useState({loading:true,subscriptions:[],refreshing:false,err:""});
  var state=st[0],setSt=st[1];
  function load(refresh){
    fetch(API+"/subs"+(refresh?"?refresh=1":""),{cache:"no-store"}).then(function(r){return r.json()}).then(function(j){
      setSt({loading:false,subscriptions:j.subscriptions||[],refreshing:!!j.refreshing,err:""});
    }).catch(function(e){setSt(function(s){return Object.assign({},s,{loading:false,err:String(e&&e.message||e)})})});
  }
  useEffect(function(){load(false)},[]);
  function del(id,label){
    if(!confirm(klT("deleteConfirm")+label+"»?"))return;
    fetch(API+"/subs?id="+encodeURIComponent(id),{method:"DELETE"}).then(function(){load(false)});
  }
  return jsxs("div",{children:[
    jsxs("div",{className:"kl-toolbar",children:[
      jsx("button",{type:"button",className:"kl-btn",disabled:state.refreshing,onClick:function(){load(true)},children:state.refreshing?klT("refreshing"):klT("refreshAll")})
    ]}),
    state.loading?jsx("div",{className:"kl-meta",children:klT("loading")}):null,
    !state.loading&&!state.subscriptions.length?jsx("div",{className:"kl-empty",children:klT("noSubs")}):null,
    jsx("div",{className:"kl-list",children:state.subscriptions.map(function(s){
      return jsx(SubCard,{key:s.id,sub:s,busy:state.refreshing,onRefresh:function(id){fetch(API+"/subs?refresh=1&id="+encodeURIComponent(id),{cache:"no-store"}).then(function(){load(false)})},onDelete:del});
    })}),
    state.err?jsx("div",{className:"kl-meta kl-err",children:state.err}):null
  ]});
}

function KeyLimitsPluginCard(props){
  var loc=props.locale,dict=loc==="ru"?KL_ru:KL_en,t=makeT(dict,KL_en),st=useState(false),open=st[0],setOpen=st[1];
  return jsxs("li",{className:"kl-item",children:[
    jsxs("button",{type:"button",className:"kl-head","aria-expanded":!!open,onClick:function(){setOpen(!open)},children:[
      jsxs("div",{className:"kl-grow",children:[
        jsx("div",{className:"kl-title",children:t("title")}),
        jsx("div",{className:"kl-sub",children:t("subtitle")})
      ]}),
      jsx("span",{className:"kl-chev",children:open?"\u25B2":"\u25BC"})
    ]}),
    open?jsx("div",{className:"kl-body",children:jsx(KeysSettingsBody,{})}):null
  ]});
}

function registerKeyLimitsSettings(ctx){
  // Язык может принести не только сам плагин: словарные пакеты объявляют
  // русский для чужих пространств. Ядро на повторное объявление той же пары
  // «пространство + язык» бросает исключение, а незащищённый вызов уносит с
  // собой весь плагин — и не только его: в интерфейсе это выглядит как
  // «Failed to load plugins» со списком ни в чём не повинных соседей.
  //
  // Поэтому каждый язык объявляется отдельно и по-хорошему: заняли до нас —
  // уступаем, свой английский при этом всё равно встаёт на место.
  function addLocale(locale, dictionary) {
    try {
      return ctx.locale.register(NS, locale, dictionary)
    } catch (alreadyTaken) {
      return function () {}
    }
  }
  ctx.effect(function () {
    var undo = [addLocale('en', KL_en), addLocale('ru', KL_ru)]
    return function () { undo.forEach(function (off) { off() }) }
  }, "key-limits: locale");
  function loc(){return useActiveLocale(ctx)}
  var placed=false;
  ctx.slots.inject("settings.plugin.item",function(){
    placed=true;
    return ctx.slots.register({name:"settings.plugin.item",key:NS,locale:NS,inject:function(){return{ctx}}},function(p){
      return jsx(KeyLimitsPluginCard,{...p,locale:loc()});
    });
  });
  var timer=setTimeout(function(){
    if(placed)return;
    ctx.slots.inject("settings.section",function(){
      return ctx.slots.register({name:"settings.section",id:"key-limits-settings",order:48,label:function(){return makeT(loc()==="ru"?KL_ru:KL_en,KL_en)("title")}},function(){
        return jsx(KeysSettingsBody,{});
      });
    });
  },3000);
  ctx.effect(function(){return function(){clearTimeout(timer)}},"key-limits: settings fallback");
}
function apply(ctx){
  klCtx=ctx;
  registerKeyLimitsSettings(ctx);
  ctx.slots.inject("conversation.composer.bar",function(){
    return ctx.slots.register({name:"conversation.composer.bar",id:"key-limits-active",priority:10},ActiveKeyBound);
  });
  ctx.effect(function(){
    var el=document.createElement("div");el.id="dsh-key-limits-root";document.body.appendChild(el);
    var root=ReactDOM.createRoot(el);
    root.render(jsx(BodyRoot,{}));
    return function(){root.unmount();el.remove()};
  },"key-limits: body mount");
}
exports.apply=apply;exports.inject=["slots","sessions","locale"];return module.exports}})
