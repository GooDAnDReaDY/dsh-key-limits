/* settings card */
function AddKeyModal(props){
  var onClose=props.onClose,onSaved=props.onSaved;
  var st=useState({loading:true,schemas:{},provider:"",label:"",secret:"",extra:"",err:"",saving:false});
  var s=st[0],setSt=st[1];
  useEffect(function(){
    fetch(API+"/config",{cache:"no-store"}).then(function(r){return r.json()}).then(function(cfg){
      var sc=cfg.schemas||{};
      var first=Object.keys(sc)[0]||"";
      setSt(function(x){return Object.assign({},x,{loading:false,schemas:sc,provider:first})});
    }).catch(function(e){setSt(function(x){return Object.assign({},x,{loading:false,err:String(e&&e.message||e)})})});
  },[]);
  var schema=s.schemas[s.provider]||null;
  var providers=Object.keys(s.schemas);

  function save(){
    if(!s.provider||!s.secret){
      setSt(function(x){return Object.assign({},x,{err:klT("fillFields")+(!s.provider?klT("pickProvider"):klT("secret"))})});
      return;
    }
    setSt(function(x){return Object.assign({},x,{saving:true,err:""})});
    fetch(API+"/subs",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({provider:s.provider,secret:s.secret,extra:s.extra,label:s.label})}).then(function(r){return r.json()}).then(function(j){
      if(j.error){setSt(function(x){return Object.assign({},x,{saving:false,err:j.error})});return}
      onSaved&&onSaved();onClose&&onClose();
    }).catch(function(e){setSt(function(x){return Object.assign({},x,{saving:false,err:String(e&&e.message||e)||klT("saveError")})})});
  }
  return jsx(PortalModal,{onClose:onClose,children:jsx("div",{className:"kl-overlay",onClick:onClose,children:
    jsxs("div",{className:"kl-panel",onClick:function(e){e.stopPropagation()},children:[
      jsxs("div",{className:"kl-panelHead",children:[
        jsxs("div",{children:[
          jsxs("div",{className:"kl-panelTitle",children:[
            jsx(SvgPlus,{size:15}),
            klT("addKey")
          ]}),
          jsx("div",{className:"kl-panelSub",children:klT("pickProvider")})
        ]}),
        jsx("button",{type:"button",className:"kl-close",onClick:onClose,children:jsx(SvgClose,{})})
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
        jsxs("div",{className:"kl-field",children:[jsx("div",{className:"kl-fieldLabel",children:klT("labelOptional")}),jsx("input",{className:"kl-input",value:s.label,onChange:function(e){setSt(function(x){return Object.assign({},x,{label:e.target.value})})}})]}),
        jsxs("div",{className:"kl-field",children:[jsx("div",{className:"kl-fieldLabel",children:klT("secret")}),jsx("input",{className:"kl-input",type:"password",value:s.secret,onChange:function(e){setSt(function(x){return Object.assign({},x,{secret:e.target.value})})}})]}),
        schema&&schema.extra?jsxs("div",{className:"kl-field",children:[jsx("div",{className:"kl-fieldLabel",children:klT("extra")}),jsx("input",{className:"kl-input",value:s.extra,onChange:function(e){setSt(function(x){return Object.assign({},x,{extra:e.target.value})})}})]}):null,
        s.err?jsxs("div",{className:"kl-alertError",children:[jsx(SvgAlert,{}),jsx("span",{children:s.err})]}):null
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
    jsxs("div",{className:"kl-toolbar",style:{marginBottom:12},children:[
      jsxs("button",{type:"button",className:"kl-btn kl-btnPrimary",onClick:function(){setSt(function(s){return Object.assign({},s,{addOpen:true})})},children:[
        jsx(SvgPlus,{size:13}),
        klT("add")
      ]})
    ]}),
    jsx(KeysInlineList,{key:st[0].tick}),
    addOpen?jsx(AddKeyModal,{onClose:function(){setSt(function(s){return Object.assign({},s,{addOpen:false})})},onSaved:function(){setSt(function(s){return Object.assign({},s,{addOpen:false,tick:s.tick+1})})}}):null,
    jsx("div",{className:"kl-meta",style:{marginTop:14},children:klT("uiHint")}),
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
    jsxs("div",{className:"kl-toolbar",style:{marginBottom:10},children:[
      jsxs("button",{type:"button",className:"kl-btn",disabled:state.refreshing,onClick:function(){load(true)},children:[
        jsx(SvgRefresh,{className:state.refreshing?"kl-spinning":""}),
        state.refreshing?klT("refreshing"):klT("refreshAll")
      ]})
    ]}),
    state.loading?jsx("div",{className:"kl-meta",children:klT("loading")}):null,
    !state.loading&&!state.subscriptions.length?jsxs("div",{className:"kl-empty",children:[
      jsx(SvgKey,{size:24,className:"kl-emptyIcon"}),
      jsx("div",{children:klT("noSubs")})
    ]}):null,
    jsx("div",{className:"kl-list",children:state.subscriptions.map(function(s){
      return jsx(SubCard,{key:s.id,sub:s,busy:state.refreshing,onRefresh:function(id){fetch(API+"/subs?refresh=1&id="+encodeURIComponent(id),{cache:"no-store"}).then(function(){load(false)})},onDelete:del});
    })}),
    state.err?jsxs("div",{className:"kl-alertError",children:[jsx(SvgAlert,{}),jsx("span",{children:state.err})]}):null
  ]});
}

function ConfigFields(props){
  var t = props.t || klT;
  var ctx = props.ctx || klCtx;
  var st = useState({
    status: "loading",
    storageDir: "",
    refreshHours: 24,
    floatChip: true,
    composerBar: true,
    activeOnTop: true,
    order: [],
    subsList: [],
    msg: "",
    saving: false
  });
  var s = st[0], setSt = st[1];
  var scopeRef = useRef(null);
  if (!scopeRef.current && ctx && ctx.settingsScope && ctx.settingsScope.bind) {
    try { scopeRef.current = ctx.settingsScope.bind({ namespace: "dsh-key-limits" }); } catch (e) { scopeRef.current = null; }
  }
  useEffect(function(){
    var scope = scopeRef.current;
    if (!scope) { setSt(function(x){ return Object.assign({}, x, { status: "unavailable" }); }); return; }
    var cancelled = false;
    Promise.all([
      Promise.resolve(scope.get()),
      fetch(API + "/subs", { cache: "no-store" }).then(function(r){ return r.json(); }).catch(function(){ return {}; })
    ]).then(function(res){
      if (cancelled) return;
      var snap = res[0];
      var subsData = res[1] || {};
      var subs = subsData.subscriptions || [];
      if (snap && typeof snap === "object" && "status" in snap) {
        if (snap.status === "loading") { setSt(function(x){ return Object.assign({}, x, { status: "loading" }); }); return; }
        if (snap.status === "unavailable") { setSt(function(x){ return Object.assign({}, x, { status: "unavailable" }); }); return; }
      }
      var vals = (snap && snap.values) ? snap.values : snap;
      var ui = (vals && vals.ui) || {};
      var existingOrder = Array.isArray(ui.order) ? ui.order.slice() : [];
      var subsIds = subs.map(function(x){ return x.id; });
      for (var i = 0; i < subsIds.length; i++) {
        if (existingOrder.indexOf(subsIds[i]) === -1) existingOrder.push(subsIds[i]);
      }
      existingOrder = existingOrder.filter(function(id){ return subsIds.indexOf(id) !== -1; });
      setSt(function(x){ return Object.assign({}, x, {
        status: "ready",
        storageDir: (vals && vals.storageDir) || "",
        refreshHours: (vals && vals.refreshHours) != null ? vals.refreshHours : 24,
        floatChip: ui.floatChip !== false,
        composerBar: ui.composerBar !== false,
        activeOnTop: ui.activeOnTop !== false,
        order: existingOrder,
        subsList: subs
      }); });
    }).catch(function(){ if (!cancelled) setSt(function(x){ return Object.assign({}, x, { status: "unavailable" }); }); });
    return function(){ cancelled = true; };
  }, [ctx]);

  function save(){
    var scope = scopeRef.current;
    if (!scope) { setSt(function(x){ return Object.assign({}, x, { msg: "settingsScope unavailable" }); }); return; }
    setSt(function(x){ return Object.assign({}, x, { saving: true, msg: "" }); });
    var payload = {
      storageDir: String(s.storageDir || ""),
      refreshHours: Number(s.refreshHours) || 24,
      ui: {
        floatChip: !!s.floatChip,
        composerBar: !!s.composerBar,
        activeOnTop: !!s.activeOnTop,
        order: s.order || []
      },
    };
    Promise.all(Object.keys(payload).map(function(k){ return scope.set(k, payload[k]); })).then(function(){
      setSt(function(x){ return Object.assign({}, x, { saving: false, msg: t("saved") || "Saved" }); });
    }).catch(function(e){
      setSt(function(x){ return Object.assign({}, x, { saving: false, msg: String(e && e.message || e) }); });
    });
  }

  if (s.status === "loading") return jsx("div",{className:"kl-meta",children:t("loading")});
  if (s.status === "unavailable") return jsx("div",{className:"kl-meta",children:"settingsScope unavailable"});

  return jsxs("div",{style:{marginBottom:16,paddingBottom:12,borderBottom:"1px solid var(--dsw-alias-border-l2)"},children:[
    jsxs("div",{className:"kl-field",children:[jsx("div",{className:"kl-fieldLabel",children:t("storageDir")}),jsx("input",{className:"kl-input",value:s.storageDir,onChange:function(e){setSt(function(x){return Object.assign({},x,{storageDir:e.target.value})})}})]}),
    jsxs("div",{className:"kl-field",children:[jsx("div",{className:"kl-fieldLabel",children:t("refreshHours")}),jsx("input",{className:"kl-input",type:"number",value:s.refreshHours,onChange:function(e){setSt(function(x){return Object.assign({},x,{refreshHours:e.target.value})})}})]}),
    jsxs("label",{className:"kl-meta",style:{display:"flex",gap:8,alignItems:"center",marginBottom:6},children:[jsx("input",{type:"checkbox",checked:!!s.floatChip,onChange:function(e){setSt(function(x){return Object.assign({},x,{floatChip:e.target.checked})})}}), t("floatChip")]}),
    jsxs("label",{className:"kl-meta",style:{display:"flex",gap:8,alignItems:"center",marginBottom:6},children:[jsx("input",{type:"checkbox",checked:!!s.composerBar,onChange:function(e){setSt(function(x){return Object.assign({},x,{composerBar:e.target.checked})})}}), t("composerBar")]}),
    jsxs("label",{className:"kl-meta",style:{display:"flex",gap:8,alignItems:"center",marginBottom:12},children:[jsx("input",{type:"checkbox",checked:!!s.activeOnTop,onChange:function(e){setSt(function(x){return Object.assign({},x,{activeOnTop:e.target.checked})})}}), t("activeOnTop") || "Active account always on top"]}),
    s.order && s.order.length ? jsxs("div",{style:{marginTop:10,marginBottom:12},children:[
      jsx("div",{className:"kl-fieldLabel",style:{marginBottom:6},children:t("accountOrder") || "Account display order"}),
      s.order.map(function(id, idx){
        var item = s.subsList.find(function(x){ return x.id === id; });
        var label = (item && item.label) || id;
        var prov = (item && item.provider) || "";
        return jsxs("div",{key:id,className:"kl-orderItem",children:[
          jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[
            jsx("span",{style:{fontSize:11,color:"var(--dsw-alias-label-tertiary)",width:16},children:(idx+1)+"."}),
            jsx("span",{style:{fontWeight:500,fontSize:12.5},children:label}),
            prov?jsx("span",{className:"kl-provPill "+providerClass(prov),children:prov}):null
          ]}),
          jsxs("div",{className:"kl-orderBtns",children:[
            jsx("button",{type:"button",className:"kl-orderBtn",disabled:idx===0,title:t("moveUp")||"▲",onClick:function(){
              var nextOrder = s.order.slice();
              var tmp = nextOrder[idx - 1];
              nextOrder[idx - 1] = nextOrder[idx];
              nextOrder[idx] = tmp;
              setSt(function(x){ return Object.assign({}, x, { order: nextOrder }); });
            },children:"▲"}),
            jsx("button",{type:"button",className:"kl-orderBtn",disabled:idx===s.order.length-1,title:t("moveDown")||"▼",onClick:function(){
              var nextOrder = s.order.slice();
              var tmp = nextOrder[idx + 1];
              nextOrder[idx + 1] = nextOrder[idx];
              nextOrder[idx] = tmp;
              setSt(function(x){ return Object.assign({}, x, { order: nextOrder }); });
            },children:"▼"})
          ]})
        ]});
      })
    ]}):null,
    s.msg?jsx("div",{className:"kl-meta",children:s.msg}):null,
    jsx("div",{style:{marginTop:8},children:jsx("button",{type:"button",className:"kl-btn kl-btnPrimary",disabled:s.saving,onClick:save,children:s.saving?t("loading"):t("save")})})
  ]});
}

function UpdaterSection(props){
  var t = props.t || klT;
  var st = useState({ checking: false, updating: false, data: null, error: "", notice: "" });
  var s = st[0], setSt = st[1];

  function check(){
    setSt(function(x){ return Object.assign({}, x, { checking: true, error: "", notice: "" }); });
    fetch(API + "/update", { cache: "no-store" })
      .then(function(res){
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function(data){
        setSt(function(x){ return Object.assign({}, x, { checking: false, data: data }); });
      })
      .catch(function(err){
        setSt(function(x){ return Object.assign({}, x, { checking: false, error: t("checkUpdateFailed") }); });
      });
  }

  function triggerUpdate(){
    if (s.updating) return;
    setSt(function(x){ return Object.assign({}, x, { updating: true, error: "", notice: "" }); });
    fetch(API + "/update", {
      method: "POST",
      headers: { "x-dsh-plugin-update": "1" }
    })
      .then(function(res){ return res.json(); })
      .then(function(resData){
        if (resData.error) throw new Error(resData.error);
        setSt(function(x){
          var cur = resData.updatedVersion || (x.data && x.data.latestVersion) || "";
          var nextData = Object.assign({}, x.data, { currentVersion: cur, updateAvailable: false });
          return Object.assign({}, x, {
            updating: false,
            data: nextData,
            notice: t("updateSuccess") + cur + (resData.restartRequired ? t("restartRequired") : "")
          });
        });
      })
      .catch(function(err){
        setSt(function(x){ return Object.assign({}, x, { updating: false, error: t("updateFailed") + (err.message || String(err)) }); });
      });
  }

  return jsxs("div",{style:{marginTop:16,paddingTop:12,borderTop:"1px solid var(--dsw-alias-border-l2)"},children:[
    jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between"},children:[
      jsxs("div",{className:"kl-meta",children:[
        s.data ? ("v" + s.data.currentVersion) : "",
        s.data && s.data.updateAvailable ? (" → v" + s.data.latestVersion) : ""
      ]}),
      jsx("div",{children:
        s.data && s.data.updateAvailable ?
          jsx("button",{type:"button",className:"kl-btn kl-btnPrimary",disabled:s.updating,onClick:triggerUpdate,children:s.updating ? t("updating") : t("updateNow")}) :
          jsx("button",{type:"button",className:"kl-btn",disabled:s.checking,onClick:check,children:s.checking ? t("checkingUpdates") : (s.data ? t("upToDate") : t("checkForUpdates"))})
      })
    ]}),
    s.notice ? jsx("div",{className:"kl-meta",style:{color:"var(--dsw-alias-state-success)",marginTop:6},children:s.notice}) : null,
    s.error ? jsx("div",{className:"kl-alertError",style:{marginTop:6},children:s.error}) : null
  ]});
}

var ChevronIcon = null;
try {
  var primitives = require("@deepseek-ai/dsh-client-ui-primitives");
  ChevronIcon = primitives && (primitives.IconChevronDownOutline14 || primitives.IconChevronDown);
} catch (_) {
  ChevronIcon = null;
}

// Bare settings form. The row seat page (plugins.row.config) draws its own
// title, icon, crumb and padding around the entry, so this component must not
// add a card of its own — a second frame doubles the border and shifts the
// block out of the page's content area.
function KeyLimitsSettingsForm(props){
  var ctx=(props&&props.ctx)||klCtx;
  var lang=useActiveLocale(ctx),
      dict=lang==="zh"?KL_zh:KL_en,
      t=(typeof props.t==="function")?props.t:makeT(dict,KL_en);
  return jsxs("div",{className:"kl-page",children:[
    jsx(ConfigFields,{ctx:ctx,t:t}),
    jsx(KeysSettingsBody,{}),
    jsx(UpdaterSection,{ctx:ctx,t:t})
  ]});
}

// View-aware entry for every seat this plugin can land in. Hooks run before any
// branch so the hook order stays stable whether the host asks for the summary
// one-liner or the full page.
function KeyLimitsPluginCard(props){
  var ctx = (props && props.ctx) || klCtx;
  var lang = useActiveLocale(ctx),
      dict = lang === "zh" ? KL_zh : KL_en,
      t = (typeof props.t === "function") ? props.t : makeT(dict, KL_en),
      st = useState(false),
      open = st[0],
      setOpen = st[1];
  if(props && props.view === "summary"){
    return jsx("div",{className:"kl-sub",children:t("subtitle")});
  }
  if(props && props.view === "page"){
    return jsx(KeyLimitsSettingsForm,{ctx:ctx,t:t});
  }
  return jsxs("li",{className:"kl-item",children:[
    jsxs("button",{type:"button",className:"kl-head","aria-expanded":!!open,onClick:function(){setOpen(!open)},children:[
      jsxs("div",{className:"kl-grow",children:[
        jsx("div",{className:"kl-title",children:t("title")}),
        jsx("div",{className:"kl-sub",children:t("subtitle")})
      ]}),
      jsx("span",{className:"kl-chev"+(open?" kl-chev-open":""),"aria-hidden":"true",children:ChevronIcon?jsx(ChevronIcon,{style:{display:"block",width:14,height:14}}):jsx("svg",{width:14,height:14,viewBox:"0 0 14 14",fill:"none",stroke:"currentColor",strokeWidth:1.5,style:{display:"block"},children:jsx("path",{d:"M3.5 5.25L7 8.75L10.5 5.25"})})})
    ]}),
    open?jsxs("div",{className:"kl-body",children:[
      jsx(ConfigFields,{ctx:ctx,t:t}),
      jsx(KeysSettingsBody,{}),
      jsx(UpdaterSection,{ctx:ctx,t:t})
    ]}):null
  ]});
}

function registerKeyLimitsSettings(ctx){
  function addLocale(locale, dictionary) {
    try {
      return ctx.locale.register(NS, locale, dictionary)
    } catch (alreadyTaken) {
      return function () {}
    }
  }
  ctx.effect(function () {
    var undo = [addLocale('en', KL_en), addLocale('zh', KL_zh)]
    return function () { undo.forEach(function (off) { off() }) }
  }, "key-limits: locale");
  function loc(){return useActiveLocale(ctx)}
  // Register into the seats the host actually renders, newest first:
  // - 'plugins.row.config' — the plugin's own row on the Plugins page
  //   (DSH 0.1.6-alpha.2): keyed '<package name>#<row id from cordis.patch.yml>'.
  //   The row gains a configure control that opens the entry's page, and the
  //   page asks for view:'summary' and view:'page'.
  // - 'settings.plugin.item' (#11) — older cores' Settings > Plugins card slot,
  //   kept as a fallback. It is NOT rendered by the current core, so it must
  //   never be the only seat.
  function trySlot(name, register){
    try{
      if(typeof ctx.slots.inject==="function")ctx.slots.inject(name,register);
      else register();
    }catch(e){
      if(ctx.logger&&typeof ctx.logger.warn==="function")ctx.logger.warn("[dsh-key-limits] slot registration failed for "+name+": "+(e&&e.message));
    }
  }
  trySlot("plugins.row.config",function(){
    return ctx.slots.register({name:"plugins.row.config",key:ROW_CONFIG_KEY,locale:NS,inject:function(){return{ctx}}},function(p){
      return jsx(KeyLimitsPluginCard,{...p,locale:loc()});
    });
  });
  trySlot("settings.plugin.item",function(){
    return ctx.slots.register({name:"settings.plugin.item",key:NS,locale:NS,inject:function(){return{ctx}}},function(p){
      return jsx(KeyLimitsPluginCard,{...p,locale:loc()});
    });
  });
}
