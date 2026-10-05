/* settings card */
function AddKeyModal(props){
  var onClose=props.onClose,onSaved=props.onSaved;
  var t=(props&&props.t)||klT;
  var st=useState({loading:true,schemas:{},provider:"",label:"",secret:"",extra:"",err:"",saving:false});
  var s=st[0],setSt=st[1];
  useEffect(function(){
    fetchWithTimeout(API+"/config",{cache:"no-store"}).then(function(r){return r.json()}).then(function(cfg){
      var sc=cfg.schemas||{};
      var first=Object.keys(sc)[0]||"";
      setSt(function(x){return Object.assign({},x,{loading:false,schemas:sc,provider:first})});
    }).catch(function(e){setSt(function(x){return Object.assign({},x,{loading:false,err:String(e&&e.message||e)})})});
  },[]);
  var schema=s.schemas[s.provider]||null;
  var providers=Object.keys(s.schemas);

  var fields = (schema && Array.isArray(schema.fields) && schema.fields.length > 0)
    ? schema.fields
    : [{ key: "secret", label: t("secret"), secret: true, required: true }];

  function save(){
    if(!s.provider){
      setSt(function(x){return Object.assign({},x,{err:t("fillFields")+t("pickProvider")})});
      return;
    }
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      var val = f.key === "extra" ? s.extra : s.secret;
      if (f.required && !String(val || "").trim()) {
        setSt(function(x){return Object.assign({},x,{err:t("fillFields")+(f.label || f.key)})});
        return;
      }
    }
    setSt(function(x){return Object.assign({},x,{saving:true,err:""})});
    fetchWithTimeout(API+"/subs",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({provider:s.provider,secret:s.secret,extra:s.extra,label:s.label})}).then(function(r){return r.json()}).then(function(j){
      if(j.error){setSt(function(x){return Object.assign({},x,{saving:false,err:j.error})});return}
      onSaved&&onSaved();onClose&&onClose();
    }).catch(function(e){setSt(function(x){return Object.assign({},x,{saving:false,err:String(e&&e.message||e)||t("saveError")})})});
  }
  var providerHint = schema ? (t("prov_hint_" + s.provider.replace(/-/g, "_")) || schema.hint) : null;
  return jsx(PortalModal,{onClose:onClose,children:jsx("div",{className:"kl-overlay",onClick:onClose,children:
    jsxs("div",{className:"kl-panel",onClick:function(e){e.stopPropagation()},children:[
      jsxs("div",{className:"kl-panelHead",children:[
        jsxs("div",{children:[
          jsxs("div",{className:"kl-panelTitle",children:[
            jsx(SvgPlus,{size:15}),
            t("addKey")
          ]}),
          jsx("div",{className:"kl-panelSub",children:t("pickProvider")})
        ]}),
        jsx("button",{type:"button",className:"kl-close",onClick:onClose,children:jsx(SvgClose,{})})
      ]}),
      jsx("div",{className:"kl-panelBody",children:s.loading?jsx("div",{className:"kl-meta",children:t("loading")}):jsxs(React.Fragment,{children:[
        jsxs("div",{className:"kl-field",children:[
          jsx("div",{className:"kl-fieldLabel",children:t("pickProvider")}),
          jsxs("select",{className:"kl-input",value:s.provider,onChange:function(e){
            var np = e.target.value;
            setSt(function(x){return Object.assign({},x,{provider:np,secret:"",extra:"",err:""})});
          },children:[
            jsx("option",{value:"",children:t("pickDash")}),
            providers.map(function(p){
              var pKey = "prov_label_" + p.replace(/-/g, "_");
              var pLabel = t(pKey) || (s.schemas[p] && s.schemas[p].label) || p;
              return jsx("option",{key:p,value:p,children:pLabel});
            })
          ]})
        ]}),
        providerHint?jsx("div",{className:"kl-meta",children:providerHint}):null,
        jsxs("div",{className:"kl-field",children:[jsx("div",{className:"kl-fieldLabel",children:t("labelOptional")}),jsx("input",{className:"kl-input",value:s.label,onChange:function(e){setSt(function(x){return Object.assign({},x,{label:e.target.value})})}})]}),
        fields.map(function(f){
          var isSec = f.secret !== false;
          var val = f.key === "extra" ? s.extra : s.secret;
          var labelText = f.label || (f.key === "extra" ? t("extra") : t("secret"));
          return jsxs("div",{key:f.key,className:"kl-field",children:[
            jsx("div",{className:"kl-fieldLabel",children:labelText}),
            jsx("input",{
              className:"kl-input",
              type: isSec ? "password" : "text",
              placeholder: f.placeholder || "",
              value: val,
              onChange: function(e){
                var v = e.target.value;
                setSt(function(x){return Object.assign({},x,f.key === "extra" ? {extra:v} : {secret:v})});
              }
            })
          ]});
        }),
        s.err?jsxs("div",{className:"kl-alertError",children:[jsx(SvgAlert,{}),jsx("span",{children:s.err})]}):null
      ]})}),
      jsxs("div",{className:"kl-panelFoot",children:[
        jsx("button",{type:"button",className:"kl-btn",onClick:onClose,children:t("cancel")}),
        jsx("button",{type:"button",className:"kl-btn kl-btnPrimary",disabled:s.saving,onClick:save,children:s.saving?t("loading"):t("save")})
      ]})
    ]})
  })});
}

function KeysSettingsBody(props){
  var t=(props&&props.t)||klT;
  var st=useState({addOpen:false,tick:0});
  var addOpen=st[0].addOpen,setSt=st[1];
  return jsxs("div",{children:[
    jsxs("div",{className:"kl-toolbar",style:{marginBottom:12},children:[
      jsxs("button",{type:"button",className:"kl-btn kl-btnPrimary",onClick:function(){setSt(function(s){return Object.assign({},s,{addOpen:true})})},children:[
        jsx(SvgPlus,{size:13}),
        t("add")
      ]})
    ]}),
    jsx(KeysInlineList,{key:st[0].tick,t:t}),
    addOpen?jsx(AddKeyModal,{t:t,onClose:function(){setSt(function(s){return Object.assign({},s,{addOpen:false})})},onSaved:function(){setSt(function(s){return Object.assign({},s,{addOpen:false,tick:s.tick+1})})}}):null,
    jsx("div",{className:"kl-meta",style:{marginTop:14},children:t("uiHint")}),
    jsx("div",{className:"kl-meta",children:t("dataPath")})
  ]});
}

function KeysInlineList(props){
  var t=(props&&props.t)||klT;
  var st=useState({loading:true,subscriptions:[],refreshing:false,err:""});
  var state=st[0],setSt=st[1];
  function load(refresh){
    fetchWithTimeout(API+"/subs"+(refresh?"?refresh=1":""),{cache:"no-store"}).then(function(r){return r.json()}).then(function(j){
      setSt({loading:false,subscriptions:j.subscriptions||[],refreshing:!!j.refreshing,err:""});
    }).catch(function(e){setSt(function(s){return Object.assign({},s,{loading:false,err:String(e&&e.message||e)})})});
  }
  useEffect(function(){load(false)},[]);
  function del(id,label){
    if(!confirm(t("deleteConfirm")+label+"»?"))return;
    fetchWithTimeout(API+"/subs?id="+encodeURIComponent(id),{method:"DELETE"}).then(function(){load(false)});
  }
  return jsxs("div",{children:[
    jsxs("div",{className:"kl-toolbar",style:{marginBottom:10},children:[
      jsxs("button",{type:"button",className:"kl-btn",disabled:state.refreshing,onClick:function(){load(true)},children:[
        jsx(SvgRefresh,{className:state.refreshing?"kl-spinning":""}),
        state.refreshing?t("refreshing"):t("refreshAll")
      ]})
    ]}),
    state.loading?jsx("div",{className:"kl-meta",children:t("loading")}):null,
    !state.loading&&!state.subscriptions.length?jsxs("div",{className:"kl-empty",children:[
      jsx(SvgKey,{size:24,className:"kl-emptyIcon"}),
      jsx("div",{children:t("noSubs")})
    ]}):null,
    jsx("div",{className:"kl-list",children:state.subscriptions.map(function(s){
      return jsx(SubCard,{key:s.id,sub:s,busy:state.refreshing,onRefresh:function(id){fetchWithTimeout(API+"/subs?refresh=1&id="+encodeURIComponent(id),{cache:"no-store"}).then(function(){load(false)})},onDelete:del});
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
  if (!scopeRef.current && ctx && ctx.configForms && ctx.configForms.get) {
    try { scopeRef.current = ctx.configForms.get("dsh-key-limits"); } catch (e) { scopeRef.current = null; }
  }
  useEffect(function(){
    var scope = scopeRef.current;
    if (!scope) { setSt(function(x){ return Object.assign({}, x, { status: "unavailable" }); }); return; }
    var cancelled = false;

    function applySnapshot(snap, subs) {
      if (!snap) {
        setSt(function(x){ return Object.assign({}, x, { status: "unavailable" }); });
        return;
      }
      if (snap.status === "loading") {
        setSt(function(x){ return Object.assign({}, x, { status: "loading" }); });
        return;
      }
      if (snap.status === "unavailable") {
        setSt(function(x){ return Object.assign({}, x, { status: "unavailable" }); });
        return;
      }
      var vals = (snap.value !== undefined) ? snap.value : ((snap.values !== undefined) ? snap.values : snap);
      var ui = (vals && vals.ui) || {};
      var existingOrder = Array.isArray(ui.order) ? ui.order.slice() : [];
      var subsList = subs || [];
      var subsIds = subsList.map(function(x){ return x.id; });
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
        subsList: subsList
      }); });
    }

    var unsub = null;
    if (typeof scope.subscribe === "function") {
      unsub = scope.subscribe(function(){
        if (cancelled) return;
        var currentSnap = typeof scope.getSnapshot === "function" ? scope.getSnapshot() : null;
        if (currentSnap) applySnapshot(currentSnap, s.subsList);
      });
    }

    var initialSnap = typeof scope.getSnapshot === "function" ? scope.getSnapshot() : null;
    fetchWithTimeout(API + "/subs", { cache: "no-store" })
      .then(function(r){ return r.json(); })
      .then(function(subsData){
        if (cancelled) return;
        var subs = subsData.subscriptions || [];
        var snap = (typeof scope.getSnapshot === "function") ? scope.getSnapshot() : initialSnap;
        applySnapshot(snap, subs);
      })
      .catch(function(){
        if (cancelled) return;
        var snap = (typeof scope.getSnapshot === "function") ? scope.getSnapshot() : initialSnap;
        applySnapshot(snap, []);
      });

    return function(){
      cancelled = true;
      if (typeof unsub === "function") unsub();
    };
  }, [ctx]);

  function save(){
    var scope = scopeRef.current;
    if (!scope) { setSt(function(x){ return Object.assign({}, x, { msg: "configForms unavailable" }); }); return; }
    setSt(function(x){ return Object.assign({}, x, { saving: true, msg: "" }); });
    var ops = [
      { op: "set", path: ["refreshHours"], value: Number(s.refreshHours) || 24 },
      { op: "set", path: ["ui", "floatChip"], value: !!s.floatChip },
      { op: "set", path: ["ui", "composerBar"], value: !!s.composerBar },
      { op: "set", path: ["ui", "activeOnTop"], value: !!s.activeOnTop }
    ];
    if (typeof scope.mutate === "function") {
      scope.mutate(ops).then(function(ok){
        if (ok === false) {
          setSt(function(x){ return Object.assign({}, x, { saving: false, msg: t("saveError") || "Save rejected" }); });
          return;
        }
        setSt(function(x){ return Object.assign({}, x, { saving: false, msg: t("saved") || "Saved" }); });
      }).catch(function(e){
        setSt(function(x){ return Object.assign({}, x, { saving: false, msg: String(e && e.message || e) }); });
      });
    } else if (typeof scope.set === "function") {
      Promise.all([
        scope.set("refreshHours", Number(s.refreshHours) || 24),
        scope.set("ui", { floatChip: !!s.floatChip, composerBar: !!s.composerBar, activeOnTop: !!s.activeOnTop, order: s.order || [] })
      ]).then(function(){
        setSt(function(x){ return Object.assign({}, x, { saving: false, msg: t("saved") || "Saved" }); });
      }).catch(function(e){
        setSt(function(x){ return Object.assign({}, x, { saving: false, msg: String(e && e.message || e) }); });
      });
    }
  }

  if (s.status === "loading") return jsx("div",{className:"kl-meta",children:t("loading")});
  if (s.status === "unavailable") return jsx("div",{className:"kl-meta",children:"configForms unavailable"});

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
    fetchWithTimeout(API + "/update", { cache: "no-store" })
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
    fetchWithTimeout(API + "/update", {
      method: "POST",
      headers: { "x-dsh-plugin-update": "1" }
    }, 60000)
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

function BackupSection(props){
  var t = props.t || klT;
  var st = useState({ status: "", error: "", busy: false });
  var s = st[0], setSt = st[1];
  var fileInputRef = useRef(null);

  function handleExport(){
    var pwd = prompt(t("enterPassphrase") + " (min 4 chars):");
    if (!pwd) return;
    if (pwd.length < 4) {
      alert(t("enterPassphrase"));
      return;
    }
    setSt(function(x){ return Object.assign({}, x, { busy: true, error: "", status: "" }); });
    fetchWithTimeout(API + "/export", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-dsh-internal-auth": "1" },
      body: JSON.stringify({ passphrase: pwd })
    })
      .then(function(r){ return r.json(); })
      .then(function(data){
        if (data.error) throw new Error(data.error);
        var blob = new Blob([JSON.stringify(data.backup, null, 2)], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "dsh-key-limits-backup-" + new Date().toISOString().slice(0, 10) + ".json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSt(function(x){ return Object.assign({}, x, { busy: false, status: t("exportSuccess") }); });
      })
      .catch(function(err){
        setSt(function(x){ return Object.assign({}, x, { busy: false, error: err.message || String(err) }); });
      });
  }

  function handleImportFile(e){
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(evt){
      try {
        var parsed = JSON.parse(evt.target.result);
        var pwd = prompt(t("enterPassphrase") + ":");
        if (!pwd) return;
        setSt(function(x){ return Object.assign({}, x, { busy: true, error: "", status: "" }); });
        fetchWithTimeout(API + "/import", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-dsh-internal-auth": "1" },
          body: JSON.stringify({ passphrase: pwd, backup: parsed })
        })
          .then(function(r){ return r.json(); })
          .then(function(data){
            if (data.error) throw new Error(data.error);
            setSt(function(x){ return Object.assign({}, x, { busy: false, status: t("importSuccess") + data.importedCount }); });
          })
          .catch(function(err){
            setSt(function(x){ return Object.assign({}, x, { busy: false, error: t("importError") + (err.message || String(err)) }); });
          });
      } catch (parseErr) {
        setSt(function(x){ return Object.assign({}, x, { error: t("importError") + (parseErr.message || String(parseErr)) }); });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return jsxs("div", {
    style: { marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--dsw-alias-border-l2)" },
    children: [
      jsxs("div", {
        style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
        children: [
          jsx("div", { className: "kl-meta", children: t("exportBackup") + " / " + t("importBackup") }),
          jsxs("div", {
            style: { display: "flex", gap: 8 },
            children: [
              jsx("button", {
                type: "button",
                className: "kl-btn",
                disabled: s.busy,
                onClick: handleExport,
                children: jsxs("span", { style: { display: "inline-flex", alignItems: "center", gap: 4 }, children: [jsx(SvgDownload, { size: 12 }), t("exportBackup")] })
              }),
              jsx("button", {
                type: "button",
                className: "kl-btn",
                disabled: s.busy,
                onClick: function(){ if (fileInputRef.current) fileInputRef.current.click(); },
                children: jsxs("span", { style: { display: "inline-flex", alignItems: "center", gap: 4 }, children: [jsx(SvgUpload, { size: 12 }), t("importBackup")] })
              }),
              jsx("input", {
                type: "file",
                accept: ".json,application/json",
                ref: fileInputRef,
                style: { display: "none" },
                onChange: handleImportFile
              })
            ]
          })
        ]
      }),
      s.status ? jsx("div", { className: "kl-meta", style: { color: "var(--dsw-alias-state-success)", marginTop: 6 }, children: s.status }) : null,
      s.error ? jsx("div", { className: "kl-meta", style: { color: "var(--dsw-alias-state-danger)", marginTop: 6 }, children: s.error }) : null
    ]
  });
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
      boundT=(ctx&&ctx.locale&&typeof ctx.locale.bind==="function")?ctx.locale.bind(NS):null,
      dict=lang==="zh"?KL_zh:KL_en,
      t=(typeof props.t==="function")?props.t:(typeof boundT==="function"?boundT:makeT(dict,KL_en));
  return jsxs("div",{className:"kl-page",children:[
    jsx(ConfigFields,{ctx:ctx,t:t}),
    jsx(KeysSettingsBody,{t:t}),
    jsx(BackupSection,{ctx:ctx,t:t}),
    jsx(UpdaterSection,{ctx:ctx,t:t})
  ]});
}

// View-aware entry for every seat this plugin can land in. Hooks run before any
// branch so the hook order stays stable whether the host asks for the summary
// one-liner or the full page.
function KeyLimitsPluginCard(props){
  var ctx = (props && props.ctx) || klCtx;
  var lang = useActiveLocale(ctx),
      boundT = (ctx && ctx.locale && typeof ctx.locale.bind === "function") ? ctx.locale.bind(NS) : null,
      dict = lang === "zh" ? KL_zh : KL_en,
      t = (typeof props.t === "function") ? props.t : (typeof boundT === "function" ? boundT : makeT(dict, KL_en)),
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
      jsx(KeysSettingsBody,{t:t}),
      jsx(BackupSection,{ctx:ctx,t:t}),
      jsx(UpdaterSection,{ctx:ctx,t:t})
    ]}):null
  ]});
}

function registerKeyLimitsSettings(ctx){
  function addLocale(locale, dictionary) {
    try {
      if (ctx && ctx.locale && typeof ctx.locale.register === "function") {
        return ctx.locale.register(NS, locale, dictionary);
      }
      return function () {};
    } catch (alreadyTaken) {
      return function () {};
    }
  }
  ctx.effect(function () {
    var undo = [addLocale('en', KL_en), addLocale('zh', KL_zh)];
    return function () { undo.forEach(function (off) { try { off(); } catch (_) {} }); };
  }, "key-limits: locale");
  function loc(){return useActiveLocale(ctx)}
  // Register into the seats the host actually renders, newest first:
  // - 'plugins.item' — the plugin-LIST seat and the one the current core
  //   (0.1.6-alpha.2) renders as the plugin's own page with its configuration
  //   (the host draws the title, icon, crumb and padding and asks for view
  //   'summary' or view 'page'). The label must stay a static string: it is
  //   resolved while the page renders, and a locale lookup there would take the
  //   whole client batch down with it.
  // - 'plugins.row.config' — the plugin's own row on the Plugins page, keyed
  //   '<package name>#<row id from cordis.patch.yml>', kept as a fallback.
  // - 'settings.plugin.item' (#11) — older cores' Settings > Plugins card slot,
  //   kept as a fallback. It is NOT rendered by the current core.
  function trySlot(name, register){
    try{
      if(typeof ctx.slots.inject==="function") return ctx.slots.inject(name,register);
      else return register();
    }catch(e){
      if(ctx.logger&&typeof ctx.logger.warn==="function")ctx.logger.warn("[dsh-key-limits] slot registration failed for "+name+": "+(e&&e.message));
      return function(){};
    }
  }
  ctx.effect(function(){
    var unreg = [];
    var off1 = trySlot("plugins.item",function(){
      return ctx.slots.register({name:"plugins.item",id:ROW_ID,order:60,label:function(){return "Key Limits"},locale:NS,inject:function(){return{ctx}}},function(p){
        return jsx(KeyLimitsPluginCard,{...p,locale:loc()});
      });
    });
    if (typeof off1 === "function") unreg.push(off1);
    var off2 = trySlot("plugins.row.config",function(){
      return ctx.slots.register({name:"plugins.row.config",key:ROW_CONFIG_KEY,locale:NS,inject:function(){return{ctx}}},function(p){
        return jsx(KeyLimitsPluginCard,{...p,locale:loc()});
      });
    });
    if (typeof off2 === "function") unreg.push(off2);
    var off3 = trySlot("settings.plugin.item",function(){
      return ctx.slots.register({name:"settings.plugin.item",key:NS,locale:NS,inject:function(){return{ctx}}},function(p){
        return jsx(KeyLimitsPluginCard,{...p,locale:loc()});
      });
    });
    if (typeof off3 === "function") unreg.push(off3);
    return function(){
      unreg.forEach(function(fn){ try { fn(); } catch(_) {} });
    };
  }, "key-limits: settings slots");
}
