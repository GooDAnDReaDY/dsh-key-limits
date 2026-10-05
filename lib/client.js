window.__ModuleLoader__.load({id:"@goodandready/dsh-key-limits",factory:(require)=>{var module={exports:{}},exports=module.exports,React=require("react"),ReactDOM=require("react-dom/client"),createPortal=require("react-dom").createPortal,jsx=require("react/jsx-runtime").jsx,jsxs=require("react/jsx-runtime").jsxs,useState=React.useState,useEffect=React.useEffect,useCallback=React.useCallback,useRef=React.useRef,API="/dsh-key-limits",NS="dsh-key-limits",PKG="@goodandready/dsh-key-limits",ROW_ID="dsh-key-limits",ROW_CONFIG_KEY=PKG+"#"+ROW_ID,REFRESH_MS=60000,WARN=30,DANGER=15,POS_KEY="kl-chip-pos",klCtx=null;

var css = `
@keyframes kl-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes kl-zoom-in { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
@keyframes kl-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes kl-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

/* Floating Drag Chip */
.kl-floatWrap {
  position: fixed;
  z-index: 9990;
  touch-action: none;
}
.kl-float {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  min-width: 52px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--dsw-alias-border-l2);
  background: color-mix(in srgb, var(--dsw-alias-bg-base) 82%, transparent);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  cursor: grab;
  user-select: none;
  box-shadow: 0 10px 30px color-mix(in srgb, var(--dsw-alias-bg-base) 40%, transparent);
  transition: transform 0.16s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.16s ease, border-color 0.16s ease;
}
.kl-float:hover {
  transform: translateY(-2px);
  border-color: var(--dsw-alias-border-l1);
  box-shadow: 0 14px 36px color-mix(in srgb, var(--dsw-alias-bg-base) 50%, transparent);
}
.kl-float:active {
  cursor: grabbing;
  transform: scale(0.96);
}
.kl-float-ok {
  border-color: var(--dsw-alias-state-success);
  color: var(--dsw-alias-state-success);
}
.kl-float-ok .kl-dot { background: var(--dsw-alias-state-success); box-shadow: 0 0 8px var(--dsw-alias-state-success); }
.kl-float-warn {
  border-color: var(--dsw-alias-state-warning);
  color: var(--dsw-alias-state-warning);
}
.kl-float-warn .kl-dot { background: var(--dsw-alias-state-warning); box-shadow: 0 0 8px var(--dsw-alias-state-warning); }
.kl-float-danger {
  border-color: var(--dsw-alias-state-danger);
  color: var(--dsw-alias-state-danger);
}
.kl-float-danger .kl-dot { background: var(--dsw-alias-state-danger); box-shadow: 0 0 8px var(--dsw-alias-state-danger); }
.kl-float-muted {
  color: var(--dsw-alias-label-secondary);
  border-color: var(--dsw-alias-border-l2);
}
.kl-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--dsw-alias-label-tertiary);
}

/* Modal Overlay & Outer Panel */
.kl-overlay {
  position: fixed;
  inset: 0;
  z-index: 10050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: color-mix(in srgb, var(--dsw-alias-bg-base) 75%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  animation: kl-fade-in 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}
.kl-panel {
  box-sizing: border-box;
  width: min(720px, 95vw);
  max-height: min(88vh, 800px);
  display: flex;
  flex-direction: column;
  background: var(--dsw-alias-bg-layer-1);
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 24px;
  box-shadow: 0 32px 80px color-mix(in srgb, var(--dsw-alias-bg-base) 60%, transparent);
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  line-height: 1.5;
  animation: kl-zoom-in 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}
.kl-panelNarrow { width: min(460px, 94vw); }

/* Modal Header */
.kl-panelHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-2);
}
.kl-eyebrow {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--dsw-alias-label-tertiary);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.kl-panelTitle {
  font-size: 17px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--dsw-alias-label-primary);
  display: flex;
  align-items: center;
  gap: 10px;
}
.kl-countBadge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-3);
  border: 1px solid var(--dsw-alias-border-l2);
  color: var(--dsw-alias-label-secondary);
}
.kl-panelBody {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.kl-panelFoot {
  padding: 14px 24px;
  border-top: 1px solid var(--dsw-alias-border-l2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  background: var(--dsw-alias-bg-layer-2);
}

/* Stats / Metrics Bar */
.kl-statsBar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
  padding-bottom: 4px;
}
.kl-statCard {
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-2);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.kl-statLabel {
  font-size: 11px;
  font-weight: 600;
  color: var(--dsw-alias-label-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.kl-statVal {
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--dsw-alias-label-primary);
  display: flex;
  align-items: baseline;
  gap: 6px;
}

/* Filters & Tabs */
.kl-filterTabs {
  display: flex;
  align-items: center;
  gap: 6px;
}
.kl-tabBtn {
  appearance: none;
  font: inherit;
  cursor: pointer;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  font-weight: 600;
  transition: all 0.15s ease;
}
.kl-tabBtn:hover {
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-bg-layer-2);
}
.kl-tabBtn.active {
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-bg-layer-3);
  border-color: var(--dsw-alias-border-l2);
}

/* Subscription List */
.kl-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Subscription Cards */
.kl-subCard {
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 14px;
  padding: 14px 16px;
  background: var(--dsw-alias-bg-layer-2);
  box-shadow: 0 2px 10px color-mix(in srgb, var(--dsw-alias-bg-base) 20%, transparent);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: border-color 0.16s ease, transform 0.16s ease;
}
.kl-subCard:hover {
  border-color: var(--dsw-alias-border-l1);
}
.kl-subHead {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.kl-provPill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.02em;
  background: var(--dsw-alias-bg-layer-3);
  border: 1px solid var(--dsw-alias-border-l2);
  color: var(--dsw-alias-label-secondary);
}
.kl-prov-opencode-go,
.kl-prov-deepseek,
.kl-prov-openrouter,
.kl-prov-minimax,
.kl-prov-cline,
.kl-prov-qwen,
.kl-prov-ollama,
.kl-prov-commandcode,
.kl-prov-siliconflow,
.kl-prov-anthropic,
.kl-prov-groq,
.kl-prov-gemini {
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, var(--dsw-alias-bg-layer-3));
  border-color: var(--dsw-alias-border-l2);
  color: var(--dsw-alias-label-primary);
}

/* Docked mode & Danger Toast */
.kl-float-docked {
  right: 16px !important;
  bottom: 16px !important;
  left: auto !important;
  top: auto !important;
  box-shadow: 0 4px 14px color-mix(in srgb, var(--dsw-alias-bg-base) 45%, transparent);
}
.kl-dock-btn {
  background: transparent;
  border: 0;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--dsw-alias-label-tertiary);
  cursor: pointer;
  border-radius: 4px;
  transition: color 0.15s ease;
}
.kl-dock-btn:hover {
  color: var(--dsw-alias-label-primary);
}
.kl-danger-toast {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 10090;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--dsw-alias-bg-base) 88%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--dsw-alias-state-danger);
  color: var(--dsw-alias-state-danger);
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 12px 32px color-mix(in srgb, var(--dsw-alias-state-danger) 25%, transparent);
  animation: kl-zoom-in 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
}
.kl-danger-toast-text {
  color: var(--dsw-alias-label-primary);
  font-weight: 500;
}

.kl-subTitle {
  font-size: 14px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary);
  margin-bottom: 2px;
}
.kl-subMeta {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary);
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Quota Windows Bento Grid */
.kl-bentoGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 8px;
}
.kl-bentoCell {
  padding: 8px 10px;
  border-radius: 9px;
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-3);
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.kl-bentoHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.kl-bentoLabel {
  font-size: 11px;
  font-weight: 500;
  color: var(--dsw-alias-label-secondary);
}
.kl-bentoPct {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.kl-normal { color: var(--dsw-alias-label-primary); }
.kl-warn { color: var(--dsw-alias-state-warning); }
.kl-danger { color: var(--dsw-alias-state-danger); }
.kl-muted { color: var(--dsw-alias-label-tertiary); }

.kl-bentoReset {
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary);
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Progress Bars */
.kl-progBar {
  height: 5px;
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-3);
  overflow: hidden;
}
.kl-progFill {
  height: 100%;
  border-radius: 999px;
  background: var(--dsw-alias-state-success);
  transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.kl-progWarn .kl-progFill { background: var(--dsw-alias-state-warning); }
.kl-progDanger .kl-progFill { background: var(--dsw-alias-state-danger); }

/* Account Reordering List */
.kl-orderItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2);
  margin-bottom: 6px;
}
.kl-orderBtns {
  display: flex;
  gap: 4px;
}
.kl-orderBtn {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-3);
  color: var(--dsw-alias-label-primary);
  cursor: pointer;
  padding: 0;
  font-size: 11px;
}
.kl-orderBtn:hover:not(:disabled) {
  background: var(--dsw-alias-bg-layer-1);
}
.kl-orderBtn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

/* Balance Highlight Display */
.kl-balanceBox {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-2);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.kl-balanceAmt {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--dsw-alias-brand-primary);
  font-variant-numeric: tabular-nums;
}

/* Buttons */
.kl-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 34px;
  padding: 0 15px;
  border-radius: 10px;
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;
}
.kl-btn:hover:not(:disabled) {
  background: var(--dsw-alias-bg-layer-3);
  border-color: var(--dsw-alias-border-l1);
  transform: translateY(-1px);
}
.kl-btn:active:not(:disabled) { transform: scale(0.97); }
.kl-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.kl-btnPrimary {
  background: var(--dsw-alias-brand-primary);
  color: var(--dsw-alias-bg-base);
  border-color: var(--dsw-alias-brand-primary);
  font-weight: 700;
}
.kl-btnPrimary:hover:not(:disabled) {
  opacity: 0.92;
}

.kl-btnIcon {
  width: 30px;
  height: 30px;
  padding: 0;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}
.kl-btnIcon:hover {
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
}
.kl-btnDanger:hover {
  background: color-mix(in srgb, var(--dsw-alias-state-danger) 15%, transparent);
  color: var(--dsw-alias-state-danger);
}

.kl-close {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}
.kl-close:hover {
  background: var(--dsw-alias-bg-layer-3);
  color: var(--dsw-alias-label-primary);
}

/* Empty State */
.kl-emptyBox {
  padding: 48px 24px;
  border: 1px dashed var(--dsw-alias-border-l2);
  border-radius: 18px;
  background: var(--dsw-alias-bg-layer-2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
}
.kl-emptyTitle {
  font-size: 15px;
  font-weight: 700;
  color: var(--dsw-alias-label-primary);
}
.kl-emptyText {
  font-size: 12.5px;
  color: var(--dsw-alias-label-tertiary);
  max-width: 320px;
}

/* Error Banner */
.kl-errBanner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--dsw-alias-state-danger) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-danger) 28%, transparent);
  color: var(--dsw-alias-state-danger);
  font-size: 12.5px;
}

.kl-spinning { animation: kl-spin 0.9s linear infinite; }

/* Pool Health & Predictive Analytics */
.kl-pool-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-2);
  border: 1px solid var(--dsw-alias-border-l2);
  font-size: 11px;
  font-weight: 600;
  color: var(--dsw-alias-label-secondary);
}
.kl-pool-ok { color: var(--dsw-alias-state-success); }
.kl-pool-warn { color: var(--dsw-alias-state-warning); }
.kl-pool-danger { color: var(--dsw-alias-state-danger); }

.kl-burn-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-3);
  color: var(--dsw-alias-label-secondary);
  border: 1px solid var(--dsw-alias-border-l2);
}

.kl-sparkline-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 100px;
}
.kl-sparkline {
  overflow: visible;
  display: block;
}
.kl-spark-stroke-ok {
  stroke: var(--dsw-alias-state-success);
}
.kl-spark-stroke-warn {
  stroke: var(--dsw-alias-state-warning);
}
.kl-spark-stroke-danger {
  stroke: var(--dsw-alias-state-danger);
}
.kl-spark-area-ok {
  fill: color-mix(in srgb, var(--dsw-alias-state-success) 14%, transparent);
}
.kl-spark-area-warn {
  fill: color-mix(in srgb, var(--dsw-alias-state-warning) 14%, transparent);
}
.kl-spark-area-danger {
  fill: color-mix(in srgb, var(--dsw-alias-state-danger) 14%, transparent);
}

/* Settings Plugin Card */
.kl-item {
  list-style: none;
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-3);
  border-radius: 12px;
}
.kl-head {
  appearance: none;
  width: 100%;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}
.kl-head:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: -2px;
}
.kl-grow {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 4px;
  min-width: 0;
}
.kl-title {
  color: var(--dsw-alias-label-primary);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
}
.kl-sub {
  color: var(--dsw-alias-label-secondary);
  font-size: 13px;
}
.kl-chev {
  margin-left: auto;
  flex: none;
  color: var(--dsw-alias-label-tertiary);
  transition: transform 0.16s ease;
  display: flex;
  align-items: center;
}
.kl-chev-open {
  transform: rotate(180deg);
}
.kl-body {
  border-top: 1px solid var(--dsw-alias-border-l2);
  margin: 0 16px;
  padding: 12px 0 16px;
}
/* Row seat page (plugins.row.config): the host page draws the title, icon and
   crumb and provides its own padding, so the form renders bare — no card
   chrome, no border, only the vertical rhythm between its own sections. */
.kl-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
`;

function ensureKeyLimitsStyles(){
  if(typeof document==="undefined")return function(){};
  var existing=document.querySelector('style[data-dsh-plugin="dsh-key-limits"]');
  if(existing){
    return function(){
      try { existing.remove(); } catch (err) { void err; }
    };
  }
  var tag=document.createElement("style");
  tag.dataset.dshPlugin="dsh-key-limits";
  tag.setAttribute("data-dsh-plugin","dsh-key-limits");
  tag.textContent=css;
  document.head.appendChild(tag);
  return function(){
    try { tag.remove(); } catch (err) { void err; }
  };
}

var DEFAULT_CLIENT_TIMEOUT_MS = 15000;
function fetchWithTimeout(url, opts, timeoutMs) {
  var ms = typeof timeoutMs === "number" ? timeoutMs : DEFAULT_CLIENT_TIMEOUT_MS;
  var options = opts || {};
  if (options.signal) {
    return fetch(url, options);
  }
  if (typeof AbortController !== "undefined") {
    var controller = new AbortController();
    var timer = setTimeout(function() {
      try { controller.abort(); } catch(e) { /* best-effort: abort may fail if already completed or unmounted */ }
    }, ms);
    var newOpts = Object.assign({}, options, { signal: controller.signal });
    return fetch(url, newOpts).finally(function() {
      clearTimeout(timer);
    });
  }
  return fetch(url, options);
}

function fetchJson(url, opts, timeoutMs) {
  return fetchWithTimeout(url, opts, timeoutMs).then(function(res){
    return res.json().catch(function(){
      return { error: "HTTP " + res.status + " " + (res.statusText || "") };
    }).then(function(data){
      if (!res.ok) {
        var msg = (data && data.error) ? data.error : ("HTTP " + res.status);
        var err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
      }
      return data;
    });
  });
}
var KL_en={
  activeSessionEyebrow: "ACTIVE SESSION LIMIT",
  hubEyebrow: "KEY LIMITS & SUBSCRIPTION HUB",
  prov_label_opencode_go: "OpenCode GO",
  prov_label_ollama: "Ollama Cloud",
  prov_label_qwen: "Qwen Cloud",
  prov_label_kimi: "Kimi for Coding",
  prov_label_glm: "GLM (Z.ai)",
  prov_label_minimax: "MiniMax",
  prov_label_cline: "Cline",
  prov_label_deepseek: "DeepSeek",
  prov_label_commandcode: "Command Code",
  prov_label_openrouter: "OpenRouter",
  prov_label_siliconflow: "SiliconFlow",
  prov_label_anthropic: "Anthropic",
  prov_label_groq: "Groq",
  prov_label_gemini: "Google Gemini",
  prov_hint_opencode_go: "DevTools -> Application -> Cookies on opencode.ai: auth cookie value. Workspace is the ID or full URL to /go.",
  prov_hint_ollama: "Ollama Cloud API key + session cookie from ollama.com. Key is used for POST /api/me, cookie for usage on /settings.",
  prov_hint_qwen: "Cookie from curl -b or Request Headers -> cookie on home.qwencloud.com/analytics/token-plan/individual",
  prov_hint_kimi: "Kimi for Coding API key (sk-kimi-...). JWT/cookie is not currently supported.",
  prov_hint_glm: "API key from personal account on z.ai (sent in Authorization header without Bearer).",
  prov_hint_minimax: "MiniMax Coding Plan API key (sk-cp-...).",
  prov_hint_cline: "Bearer API key from cline.bot. Quotas: 5h / week / month (usage-limits).",
  prov_hint_deepseek: "API key -- remaining balance in $ (GET api.deepseek.com/user/balance; CNY is converted to USD).",
  prov_hint_commandcode: "Command Code API key (user_... or COMMANDCODE_API_KEY). Quotas: 5h / weekly window.",
  prov_hint_openrouter: "OpenRouter API key -- shows $ balance (credits - usage).",
  prov_hint_siliconflow: "SiliconFlow (SiliconCloud) API key (sk-...). Shows balance in ¥ and $.",
  prov_hint_anthropic: "Anthropic Console API key (sk-ant-...). Validates key and monitors rate limits.",
  prov_hint_groq: "Groq API key (gsk_...). Shows live rate limit windows and tokens remaining.",
  prov_hint_gemini: "Google Gemini API key from Google AI Studio (AIzaSy...).",
  storageDir:"Storage directory",
  totalAccounts:"Total accounts",
  activeOnTop:"Active account always on top",
  accountOrder:"Account display order",
  moveUp:"Move up",
  moveDown:"Move down",refreshHours:"Refresh hours",floatChip:"Float chip",composerBar:"Composer bar",saved:"Saved",

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
  field_secret:"Secret / key",field_extra:"Extra",
  refreshTimeout:"Refresh timed out",
  prov_field_opencode_go_secret:"Session cookie (auth=...)",
  prov_field_opencode_go_extra:"Workspace ID or URL",
  prov_field_ollama_secret:"API key",
  prov_field_ollama_extra:"Session cookie",
  prov_field_qwen_secret:"Session cookie",
  prov_field_qwen_extra:"sec_token (optional)",
  fillFields:"Fill in: ",saveError:"save error",
  deleteConfirm:"Delete key «",
  uiHint:"Float chip and composer bar — cordis ui.*",
  dataPath:"Data: ~/.dsh/storages/dsh-key-limits/",
  storageDirRestartNote:"(read-only, configured in settings.yaml, requires restart)",
  errTitle:"Key Limits: UI error",retry:"Retry",
  balance:"Balance",remaining:"remaining",
  pickDash:"— choose —",

  // Updater
  checkForUpdates:"Check for updates",
  checkingUpdates:"Checking…",
  updateAvailable:"Update available: ",
  upToDate:"Up to date",
  updateNow:"Update now",
  updating:"Updating…",
  updateSuccess:"Updated to ",
  restartRequired:" (restart required)",
  updateFailed:"Update failed: ",
  checkUpdateFailed:"Failed to check for updates",
  checkFailed:"Check failed",
  manualUpdateCmd:"Manual update: pnpm update @goodandready/dsh-key-limits",
  minRemaining:"Min. quota",
  balanceUsd:"Balance ($)",
  tabAll:"All",
  tabQuotas:"Quotas",
  tabBalances:"Balances",
  emptySettingsHint:"Add provider keys and tokens in plugin settings to track live quotas and balances.",
  activeBadge:" active",
  poolHealth:"Pool health",
  healthyCount:"healthy",
  warningCount:"warning",
  exhaustedCount:"exhausted",
  burnRate:"Burn rate",
  burnRateIdle:"idle",
  hoursLeft:"left",
  resetsIn:"Resets in ",
  usageTrend:"24h usage trend",
  dockedMode:"Docked mode",
  dock:"Dock to corner",
  undock:"Undock to float",
  hotkeyHint:"Alt+K to toggle",
  dangerToast:"Active quota critical",
  dangerRemaining:"remaining",
  refreshAll:"Refresh All",
  refreshing:"Refreshing…",
  refreshed:"Refreshed",
  exportBackup:"Export Backup",
  importBackup:"Import Backup",
  enterPassphrase:"Enter encryption passphrase",
  exportSuccess:"Backup exported",
  importSuccess:"Imported keys: ",
  importError:"Import failed: ",
};

var KL_zh={
  activeSessionEyebrow: "当前会话额度",
  hubEyebrow: "密钥与订阅控制台",
  prov_label_opencode_go: "OpenCode GO",
  prov_label_ollama: "Ollama Cloud",
  prov_label_qwen: "通义千问云 (Qwen)",
  prov_label_kimi: "Kimi for Coding",
  prov_label_glm: "智谱清言 (GLM / Z.ai)",
  prov_label_minimax: "MiniMax",
  prov_label_cline: "Cline",
  prov_label_deepseek: "DeepSeek (深度求索)",
  prov_label_commandcode: "Command Code",
  prov_label_openrouter: "OpenRouter",
  prov_label_siliconflow: "硅基流动 (SiliconFlow)",
  prov_label_anthropic: "Anthropic (Claude)",
  prov_label_groq: "Groq",
  prov_label_gemini: "Google Gemini",
  prov_hint_opencode_go: "在 opencode.ai 打开开发者工具 -> Application -> Cookies: 复制 auth cookie 的值。工作区填写 ID 或 /go 完整地址。",
  prov_hint_ollama: "Ollama Cloud API 密钥 + 来自 ollama.com 的会话 Cookie。密钥用于查询身份，Cookie 用于额度展示。",
  prov_hint_qwen: "来自 home.qwencloud.com/analytics/token-plan/individual 的请求头 Cookie 字符串。",
  prov_hint_kimi: "Kimi for Coding API 密钥 (sk-kimi-...)。暂不支持纯 JWT/Cookie 鉴权。",
  prov_hint_glm: "来自 z.ai 个人控制台的 API 密钥。",
  prov_hint_minimax: "MiniMax Coding Plan API 密钥 (sk-cp-...)。",
  prov_hint_cline: "来自 cline.bot 的 Bearer API 密钥。监控 5小时 / 周 / 月 额度。",
  prov_hint_deepseek: "DeepSeek API 密钥 -- 监控账户剩余美元余额与人民币余额。",
  prov_hint_commandcode: "Command Code API 密钥 (user_... 或 COMMANDCODE_API_KEY)。监控 5小时与周度额度。",
  prov_hint_openrouter: "OpenRouter API 密钥 -- 显示美元可用余额。",
  prov_hint_siliconflow: "SiliconFlow (硅基流动) API 密钥 (sk-...)。显示人民币与美元余额。",
  prov_hint_anthropic: "Anthropic Console API 密钥 (sk-ant-...)。验证密钥并监控速率限制窗口。",
  prov_hint_groq: "Groq API 密钥 (gsk_...)。监控实时速率限制与剩余 Token 窗口。",
  prov_hint_gemini: "Google AI Studio 申请的 Gemini API 密钥 (AIzaSy...)。",
  storageDir:"数据目录",
  totalAccounts:"总账户数",
  activeOnTop:"活跃账户置顶",
  accountOrder:"账户显示顺序",
  moveUp:"上移",
  moveDown:"下移",refreshHours:"刷新间隔(小时)",floatChip:"悬浮胶囊",composerBar:"输入栏按钮",saved:"已保存",

  title:"密钥额度",subtitle:"API 密钥与订阅额度监控",
  loading:"加载中…",close:"关闭",cancel:"取消",save:"保存",add:"添加",
  refresh:"刷新",refreshAll:"全部刷新",refreshing:"刷新中…",
  delete:"删除",noSubs:"暂无密钥",noQuota:"暂无额度数据",
  stale:"已过期",pctLeft:" 剩余",updated:"已更新 ",
  activeNone:"—",activeNoSession:"会话",
  floatTitle:"密钥额度 — 点击查看全部，拖拽移动",
  allTitle:"订阅额度",allSub:"全部密钥",
  oneTitle:"当前活跃密钥额度",
  addKey:"添加密钥",pickProvider:"选择提供商",
  labelOptional:"备注名称 (可选)",secret:"密钥 / 凭证",extra:"附加参数",
  field_secret:"密钥 / 凭据",field_extra:"附加参数",
  refreshTimeout:"刷新超时",
  prov_field_opencode_go_secret:"会话 Cookie (auth=...)",
  prov_field_opencode_go_extra:"工作区 ID 或 URL",
  prov_field_ollama_secret:"API 密钥",
  prov_field_ollama_extra:"会话 Cookie",
  prov_field_qwen_secret:"会话 Cookie",
  prov_field_qwen_extra:"sec_token (可选)",
  fillFields:"请填写: ",saveError:"保存失败",
  deleteConfirm:"确定删除密钥 «",
  uiHint:"悬浮胶囊与输入栏按钮 — cordis ui.*",
  dataPath:"数据路径: ~/.dsh/storages/dsh-key-limits/",
  storageDirRestartNote:"(只读，在 settings.yaml 中配置，修改后需重启)",
  errTitle:"密钥额度: 界面错误",retry:"重试",
  balance:"余额",remaining:"剩余",
  pickDash:"— 请选择 —",

  // Updater
  checkForUpdates:"检查更新",
  checkingUpdates:"正在检查…",
  updateAvailable:"发现新版本: ",
  upToDate:"已是最新版本",
  updateNow:"立即更新",
  updating:"正在更新…",
  updateSuccess:"已成功更新至 ",
  restartRequired:" (需重启 DSH)",
  updateFailed:"更新失败: ",
  checkUpdateFailed:"检查更新失败",
  checkFailed:"检查失败",
  manualUpdateCmd:"手动更新: pnpm update @goodandready/dsh-key-limits",
  minRemaining:"最低额度",
  balanceUsd:"余额 ($)",
  tabAll:"全部",
  tabQuotas:"配额",
  tabBalances:"余额",
  emptySettingsHint:"请在插件设置中添加提供商密钥，以实时监控配额与余额。",
  activeBadge:" 个活跃",
  poolHealth:"连接池健康度",
  healthyCount:"健康",
  warningCount:"预警",
  exhaustedCount:"耗尽",
  burnRate:"消耗速率",
  burnRateIdle:"空闲",
  hoursLeft:"剩余可用",
  resetsIn:"重置倒计时: ",
  usageTrend:"24小时消耗趋势",
  dockedMode:"固定模式",
  dock:"固定到右下角",
  undock:"解除固定",
  hotkeyHint:"快捷键 Alt+K 快速打开",
  dangerToast:"当前活跃配额告急",
  dangerRemaining:"剩余",
  refreshed:"已刷新",
  exportBackup:"导出备份",
  importBackup:"导入备份",
  enterPassphrase:"输入加密密码",
  exportSuccess:"备份文件已导出",
  importSuccess:"已导入密钥数: ",
  importError:"导入失败: ",
};


function klLang(){
  try{
    if (klCtx && klCtx.locale) {
      if (typeof klCtx.locale.getSnapshot === "function") {
        var snap = klCtx.locale.getSnapshot();
        if (snap && snap.active) {
          var sa = String(snap.active).toLowerCase();
          return sa.indexOf("zh") === 0 ? "zh" : (sa.indexOf("ru") === 0 ? "ru" : "en");
        }
      }
      if (klCtx.locale.locale) {
        var l = String(klCtx.locale.locale).toLowerCase();
        return l.indexOf("zh") === 0 ? "zh" : (l.indexOf("ru") === 0 ? "ru" : "en");
      }
    }
    return "en";
  }catch(e){return "en"}
}

function klT(key){
  if (klCtx && klCtx.locale && typeof klCtx.locale.bind === "function") {
    try {
      var boundT = klCtx.locale.bind("dsh-key-limits");
      if (typeof boundT === "function") {
        var res = boundT(key);
        if (res && res !== key) return res;
      }
    } catch (err) { void err; }
  }
  var lang = klLang();
  var dict = lang === "zh" ? KL_zh : KL_en;
  return dict[key] != null ? dict[key] : (KL_en[key] != null ? KL_en[key] : key);
}

function makeT(dict, fb){
  return function(k){
    if (klCtx && klCtx.locale && typeof klCtx.locale.bind === "function") {
      try {
        var boundT = klCtx.locale.bind("dsh-key-limits");
        if (typeof boundT === "function") {
          var res = boundT(k);
          if (res && res !== k) return res;
        }
      } catch (err) {
        /* best-effort locale binding fallback */
        void err;
      }
    }
    return dict[k] != null ? dict[k] : (fb[k] != null ? fb[k] : k);
  };
}

function useActiveLocale(ctx){
  var st = useState(function(){
    try {
      if (ctx && ctx.locale && typeof ctx.locale.getSnapshot === "function") {
        var snap = ctx.locale.getSnapshot();
        if (snap && snap.active) return snap.active;
      }
      return (ctx && ctx.locale && ctx.locale.locale) || "en";
    } catch(e) { return "en"; }
  });
  useEffect(function(){
    if (!ctx || !ctx.locale) return;
    if (typeof ctx.locale.subscribe === "function") {
      return ctx.locale.subscribe(function(){
        try {
          var snap = ctx.locale.getSnapshot();
          if (snap && snap.active) st[1](snap.active);
        } catch (err) { void err; }
      });
    }
    if (typeof ctx.locale.watch === "function") {
      return ctx.locale.watch(function(l){ st[1](l); });
    }
  }, [ctx]);
  var active = String(st[0] || "").toLowerCase();
  return active.indexOf("zh") === 0 ? "zh" : (active.indexOf("ru") === 0 ? "ru" : "en");
}
function sid(p){return p&&(p.sessionId||(p.session&&(p.session.sessionId||p.session.id)))||""}
function sessionIdFromCtx(){
  try{
    var s = null;
    if (klCtx && typeof klCtx.get === 'function') {
      var sess = klCtx.get('sessions');
      s = sess && sess.list && typeof sess.list.getSnapshot === 'function' ? sess.list.getSnapshot() : null;
    } else if (klCtx && klCtx.sessions && klCtx.sessions.list) {
      s = typeof klCtx.sessions.list.getSnapshot === 'function' ? klCtx.sessions.list.getSnapshot() : null;
    }
    return (s && s.current) || "";
  }catch(e){
    return "";
  }
}
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
    var s = list[i] || {};
    var p = s.provider || "unknown";
    if (!byProvider[p]) byProvider[p] = { total: 0, healthy: 0, warning: 0, exhausted: 0 };
    byProvider[p].total++;
    var isErr = !!(s.quota && s.quota.error);
    if (isErr) {
      exhausted++;
      byProvider[p].exhausted++;
      continue;
    }
    if (s.balance && s.balance.remaining != null) {
      var bRem = Number(s.balance.remaining);
      if (!Number.isFinite(bRem) || bRem <= 0) {
        exhausted++;
        byProvider[p].exhausted++;
      } else if (bRem <= 1) {
        warning++;
        byProvider[p].warning++;
      } else {
        healthy++;
        byProvider[p].healthy++;
      }
      continue;
    }
    var wins = (s.quota && s.quota.windows) || [];
    var rem = minRemaining(wins);
    if (rem != null) {
      if (rem <= DANGER) {
        exhausted++;
        byProvider[p].exhausted++;
      } else if (rem <= WARN) {
        warning++;
        byProvider[p].warning++;
      } else {
        healthy++;
        byProvider[p].healthy++;
      }
    } else {
      exhausted++;
      byProvider[p].exhausted++;
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
var MAX_HIST_POINTS = 144;
var HIST_BUCKET_MS = 10 * 60000;

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

function recordUsageSnapshot(worst, subId){
  if (typeof localStorage === "undefined" || worst == null) return;
  var q = Number(worst);
  if (!Number.isFinite(q)) return;
  try {
    var now = Date.now();
    var history = loadUsageHistory();
    var roundedQ = Math.round(q * 10) / 10;
    var sid = subId || null;
    var bucketTime = Math.floor(now / HIST_BUCKET_MS) * HIST_BUCKET_MS;
    if (history.length > 0) {
      var last = history[history.length - 1];
      var lastBucket = Math.floor(last.t / HIST_BUCKET_MS) * HIST_BUCKET_MS;
      if (bucketTime === lastBucket) {
        last.q = roundedQ;
        if (sid) last.subId = sid;
      } else {
        var entry = { t: bucketTime, q: roundedQ };
        if (sid) entry.subId = sid;
        history.push(entry);
      }
    } else {
      var firstEntry = { t: bucketTime, q: roundedQ };
      if (sid) firstEntry.subId = sid;
      history.push(firstEntry);
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
  var raw = Array.isArray(history) ? history : [];
  if (raw.length < 2) return { rate: 0, hoursLeft: null, idle: true };

  var lastSubId = raw[raw.length - 1] && raw[raw.length - 1].subId;
  var pts = [];
  for (var i = 0; i < raw.length; i++) {
    var p = raw[i];
    if (!lastSubId || !p.subId || p.subId === lastSubId) {
      pts.push(p);
    }
  }
  if (pts.length < 2) return { rate: 0, hoursLeft: null, idle: true };

  var startIdx = 0;
  for (var j = 1; j < pts.length; j++) {
    if (pts[j].q > pts[j - 1].q + 5) {
      startIdx = j;
    }
  }
  var slice = pts.slice(startIdx);
  if (slice.length < 2) return { rate: 0, hoursLeft: null, idle: true };

  var first = slice[0];
  var last = slice[slice.length - 1];
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
  var t = (props && props.t) || klT;
  var history = Array.isArray(props.history) ? props.history : [];
  var w = props.width || 100;
  var h = props.height || 26;
  if (history.length < 2) {
    return jsxs("div", {
      className: "kl-sparkline-wrap",
      children: [
        jsx("div", { className: "kl-statLabel", children: t("usageTrend") }),
        jsx("div", { className: "kl-meta", children: t("burnRateIdle") })
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
      jsx("div", { className: "kl-statLabel", children: t("usageTrend") }),
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
  var prevFocusRef = useRef(null);
  var containerRef = useRef(null);

  useEffect(function(){
    if (typeof document !== "undefined") {
      prevFocusRef.current = document.activeElement;
      function setInitialFocus(){
        if (!containerRef.current) return;
        var auto = containerRef.current.querySelector('[autofocus]');
        if (auto && typeof auto.focus === "function") {
          try { auto.focus(); return; } catch (e) { void e; }
        }
        var focusable = containerRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length && typeof focusable[0].focus === "function") {
          try { focusable[0].focus(); return; } catch (e) { void e; }
        }
        if (typeof containerRef.current.focus === "function") {
          try { containerRef.current.focus(); } catch (e) { void e; }
        }
      }
      setInitialFocus();
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(setInitialFocus);
      }
    }
    return function(){
      if (prevFocusRef.current && typeof prevFocusRef.current.focus === "function") {
        try { prevFocusRef.current.focus(); } catch (err) { void err; }
      }
    };
  }, []);

  useEffect(function(){
    if (typeof window === "undefined") return;
    function onKeyDown(e){
      if (e.key === "Escape" && props.onClose) {
        e.preventDefault();
        props.onClose();
        return;
      }
      if (e.key === "Tab" && containerRef.current) {
        var focusable = containerRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) {
          e.preventDefault();
          return;
        }
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first || !containerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !containerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return function(){ window.removeEventListener("keydown", onKeyDown); };
  }, [props.onClose]);

  if (typeof document === "undefined") return null;
  var ariaLabel = props.ariaLabel || props["aria-label"] || "Dialog";
  return createPortal(
    jsx("div", {
      ref: containerRef,
      role: "dialog",
      tabIndex: -1,
      "aria-modal": "true",
      "aria-label": ariaLabel,
      className: "kl-modal-container",
      children: props.children
    }),
    document.body
  );
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
function SvgDownload(props){
  return jsx("svg",{width:props.size||13,height:props.size||13,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round",className:props.className,style:props.style,children:[
    jsx("path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"}),
    jsx("polyline",{points:"7 10 12 15 17 10"}),
    jsx("line",{x1:12,x2:12,y1:15,y2:3})
  ]});
}
function SvgUpload(props){
  return jsx("svg",{width:props.size||13,height:props.size||13,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round",className:props.className,style:props.style,children:[
    jsx("path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"}),
    jsx("polyline",{points:"17 8 12 3 7 8"}),
    jsx("line",{x1:12,x2:12,y1:3,y2:15})
  ]});
}
function QuotaBars(props){
  var t = (props && props.t) || klT;
  var wins = props.windows || [];
  if (!wins.length) return jsx("div", { className: "kl-empty", children: props.empty || t("noQuota") });
  return jsx("div", {
    className: "kl-bentoGrid",
    children: wins.map(function(w){
      var rem = Number(w.remainingPercent) || 0;
      var pcls = rem <= DANGER ? "kl-progDanger" : (rem <= WARN ? "kl-progWarn" : "");
      return jsxs("div", {
        key: w.id,
        className: "kl-bentoCell",
        children: [
          jsxs("div", {
            className: "kl-bentoHead",
            children: [
              jsx("div", { className: "kl-bentoLabel", children: w.label || w.id }),
              jsx("div", {
                className: "kl-bentoPct",
                style: { color: rem <= DANGER ? "var(--dsw-alias-state-danger)" : (rem <= WARN ? "var(--dsw-alias-state-warning)" : "var(--dsw-alias-state-success)") },
                children: fmtPct(rem)
              })
            ]
          }),
          jsx("div", {
            className: "kl-progBar " + pcls,
            children: jsx("div", { className: "kl-progFill", style: { width: Math.min(100, Math.max(0, rem)) + "%" } })
          }),
          w.resetsAt ? jsxs("div", {
            className: "kl-bentoReset",
            children: [jsx(SvgClock, { size: 11 }), jsx("span", { children: fmtReset(w.resetsAt) })]
          }) : null
        ]
      });
    })
  });
}

function BalanceBlock(props){
  var t = (props && props.t) || klT;
  var b = props.balance;
  if (!b) return null;
  var cur = b.currency || "$";
  var rem = b.cnyRemaining != null ? ("¥" + Number(b.cnyRemaining).toFixed(2)) : (b.remaining != null ? (cur + Number(b.remaining).toFixed(2)) : "—");
  return jsxs("div", {
    className: "kl-balanceBox",
    children: [
      jsxs("div", {
        children: [
          jsx("div", { className: "kl-bentoLabel", children: t("balance") }),
          b.message ? jsx("div", { className: "kl-meta", style: { marginTop: 2 }, children: b.message }) : null
        ]
      }),
      jsx("div", { className: "kl-balanceAmt", children: rem })
    ]
  });
}

function OneLimitModal(props){
  var d = props.data, onClose = props.onClose;
  if (!d) return null;
  var ctx = (props && props.ctx) || klCtx;
  var lang = useActiveLocale(ctx);
  var boundT = (ctx && ctx.locale && typeof ctx.locale.bind === "function") ? ctx.locale.bind(NS) : null;
  var dict = lang === "zh" ? KL_zh : KL_en;
  var t = (typeof props.t === "function") ? props.t : (typeof boundT === "function" ? boundT : makeT(dict, KL_en));

  var sub = d.sub || {}, wins = (d.quota && d.quota.windows) || [], title = providerLabel(sub.provider || (d.route && d.route.provider)), subline = (sub.label || "").trim();
  return jsx(PortalModal, {
    ariaLabel: title || t("activeSessionEyebrow"),
    onClose: onClose,
    children: jsx("div", {
      className: "kl-overlay",
      onClick: onClose,
      children: jsxs("div", {
        className: "kl-panel kl-panelNarrow",
        onClick: function(e){ e.stopPropagation(); },
        children: [
          jsxs("div", {
            className: "kl-panelHead",
            children: [
              jsxs("div", {
                children: [
                  jsx("div", { className: "kl-eyebrow", children: [jsx(SvgKey, { size: 11 }), t("activeSessionEyebrow") || klT("activeSessionEyebrow")] }),
                  jsx("div", { className: "kl-panelTitle", children: title }),
                  subline ? jsx("div", { className: "kl-panelSub", children: subline }) : null
                ]
              }),
              jsx("button", { type: "button", className: "kl-close", "aria-label": t("close") || "Close", onClick: onClose, children: jsx(SvgClose, {}) })
            ]
          }),
          jsxs("div", {
            className: "kl-panelBody",
            children: [
              d.quota && d.quota.error ? jsxs("div", { className: "kl-errBanner", children: [jsx(SvgAlert, {}), jsx("span", { children: String(d.quota.error) })] }) : null,
              d.quota && d.quota.stale ? jsx("span", { className: "kl-stale", children: t("stale") }) : null,
              d.balance ? jsx(BalanceBlock, { balance: d.balance, t: t }) : jsx(QuotaBars, { windows: wins, t: t }),
              d.quota && d.quota.fetchedAt ? jsx("div", { className: "kl-meta", children: t("updated") + new Date(d.quota.fetchedAt).toLocaleString() }) : null
            ]
          }),
          jsx("div", {
            className: "kl-panelFoot",
            children: jsx("button", { type: "button", className: "kl-btn kl-btnPrimary", onClick: onClose, children: t("close") })
          })
        ]
      })
    })
  });
}

function SubCard(props){
  var t = (props && props.t) || klT;
  var s = props.sub, onRefresh = props.onRefresh, onDelete = props.onDelete, busy = props.busy;
  var wins = (s.quota && s.quota.windows) || [], bal = s.balance;
  var pCls = providerClass(s.provider);
  return jsxs("div", {
    className: "kl-subCard",
    children: [
      jsxs("div", {
        className: "kl-subHead",
        children: [
          jsxs("div", {
            style: { minWidth: 0, flex: 1 },
            children: [
              jsxs("div", {
                style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 },
                children: [
                  jsx("span", { className: "kl-provPill " + pCls, children: s.provider }),
                  s.plan ? jsx("span", { className: "kl-meta", style: { fontWeight: 600 }, children: s.plan }) : null,
                  s.status === "ok" ? jsx("span", { className: "kl-dot", style: { background: "var(--dsw-alias-state-success)" } }) : null,
                  (function(){
                    var nr = findNearestReset([s]);
                    return nr ? jsxs("span", { className: "kl-burn-tag", title: t("resetsIn") + fmtReset(nr), children: [jsx(SvgClock, { size: 10 }), fmtReset(nr)] }) : null;
                  })()
                ]
              }),
              jsx("div", { className: "kl-subTitle", children: s.label || s.id })
            ]
          }),
          jsxs("div", {
            style: { display: "flex", gap: 6, alignItems: "center" },
            children: [
              onRefresh ? jsx("button", {
                type: "button",
                className: "kl-btnIcon",
                disabled: busy,
                title: t("refresh"),
                "aria-label": t("refresh") || "Refresh",
                onClick: function(){ onRefresh(s.id); },
                children: jsx(SvgRefresh, { className: busy ? "kl-spinning" : "" })
              }) : null,
              onDelete ? jsx("button", {
                type: "button",
                className: "kl-btnIcon kl-btnDanger",
                title: t("delete"),
                "aria-label": t("delete") || "Delete",
                onClick: function(){ onDelete(s.id, s.label || s.id); },
                children: jsx(SvgTrash, {})
              }) : null
            ]
          })
        ]
      }),
      s.quota && s.quota.stale ? jsx("span", { className: "kl-stale", children: t("stale") }) : null,
      bal ? jsx(BalanceBlock, { balance: bal, t: t }) : jsx(QuotaBars, { windows: wins, t: t }),
      s.quota && s.quota.error ? jsxs("div", { className: "kl-errBanner", children: [jsx(SvgAlert, {}), jsx("span", { children: String(s.quota.error) })] }) : null
    ]
  });
}

function AllLimitsModal(props){
  var onClose = props.onClose, allowEdit = props.allowEdit;
  var ctx = (props && props.ctx) || klCtx;
  var lang = useActiveLocale(ctx);
  var boundT = (ctx && ctx.locale && typeof ctx.locale.bind === "function") ? ctx.locale.bind(NS) : null;
  var dict = lang === "zh" ? KL_zh : KL_en;
  var t = (typeof props.t === "function") ? props.t : (typeof boundT === "function" ? boundT : makeT(dict, KL_en));

  var st = useState({ loading: true, subscriptions: [], refreshing: false, err: "", tab: "all" });
  var state = st[0], setSt = st[1];

  var load = useCallback(function(refresh){
    var q = refresh ? "?refresh=1" : "";
    if (refresh) setSt(function(s){ return Object.assign({}, s, { refreshing: true }); });
    Promise.all([
      fetchJson(API + "/config", { cache: "no-store" }).catch(function(){ return {}; }),
      fetchJson(API + "/subs" + q, { cache: "no-store" }),
      fetchJson(API + "/active-sub?sessionId=" + encodeURIComponent(sessionIdFromCtx()), { cache: "no-store" }).catch(function(){ return null; })
    ]).then(function(res){
      var cfg = res[0] || {};
      var j = res[1] || {};
      var act = res[2] || {};
      var ui = cfg.ui || {};
      setSt(function(s){
        return Object.assign({}, s, {
          loading: false,
          subscriptions: Array.isArray(j.subscriptions) ? j.subscriptions : s.subscriptions,
          refreshing: !!j.refreshing,
          order: Array.isArray(ui.order) ? ui.order : [],
          activeOnTop: ui.activeOnTop !== false,
          activeSubId: (act && act.subId) || null,
          err: ""
        });
      });
    }).catch(function(e){
      setSt(function(s){
        return Object.assign({}, s, {
          loading: false,
          refreshing: false,
          err: String((e && e.message) || e)
        });
      });
    });
  }, []);

  useEffect(function(){
    load(false);
    var tInterval = setInterval(function(){ load(false); }, REFRESH_MS);
    return function(){ clearInterval(tInterval); };
  }, [load]);

  function refreshOne(id){
    setSt(function(s){ return Object.assign({}, s, { refreshing: true }); });
    fetchJson(API + "/subs?refresh=1&id=" + encodeURIComponent(id), { cache: "no-store" })
      .then(function(j){
        setSt(function(s){
          return Object.assign({}, s, {
            loading: false,
            subscriptions: Array.isArray(j.subscriptions) ? j.subscriptions : s.subscriptions,
            refreshing: !!j.refreshing,
            err: ""
          });
        });
      })
      .catch(function(e){
        setSt(function(s){
          return Object.assign({}, s, {
            refreshing: false,
            err: String((e && e.message) || e)
          });
        });
      });
  }

  function refreshAll(){
    setSt(function(s){ return Object.assign({}, s, { refreshing: true }); });
    fetchJson(API + "/refresh-all", {
      method: "POST",
      headers: { "x-dsh-internal-auth": "1" }
    })
      .then(function(){ load(false); })
      .catch(function(e){
        setSt(function(s){
          return Object.assign({}, s, {
            refreshing: false,
            err: String((e && e.message) || e)
          });
        });
      });
  }

  function deleteOne(id, label){
    if (!confirm(t("deleteConfirm") + label + "»?")) return;
    fetchJson(API + "/subs?id=" + encodeURIComponent(id), { method: "DELETE" })
      .then(function(){ load(false); })
      .catch(function(e){
        setSt(function(s){
          return Object.assign({}, s, { err: String((e && e.message) || e) });
        });
      });
  }

  var subs = state.subscriptions || [];
  var quotaCount = 0, balCount = 0, worstQuota = null, totalBalUSD = 0;
  for (var i = 0; i < subs.length; i++) {
    var sub = subs[i];
    if (sub.balance && sub.balance.remaining != null) {
      balCount++;
      totalBalUSD += Number(sub.balance.remaining) || 0;
    }
    if (sub.quota && sub.quota.windows && sub.quota.windows.length) {
      quotaCount++;
      var wMin = minRemaining(sub.quota.windows);
      if (wMin != null && (worstQuota === null || wMin < worstQuota)) worstQuota = wMin;
    }
  }

  var pool = poolStats(subs);
  var history = loadUsageHistory();
  var burn = calcBurnRate(history);

  var filtered = subs.filter(function(s){
    if (state.tab === "quota") return s.quota && s.quota.windows && s.quota.windows.length;
    if (state.tab === "balance") return !!s.balance;
    return true;
  });

  var sorted = filtered.slice();
  var orderMap = {};
  if (Array.isArray(state.order)) {
    for (var oi = 0; oi < state.order.length; oi++) orderMap[state.order[oi]] = oi + 1;
  }
  sorted.sort(function(a, b){
    if (state.activeOnTop && state.activeSubId) {
      if (a.id === state.activeSubId) return -1;
      if (b.id === state.activeSubId) return 1;
    }
    var pA = orderMap[a.id] || 9999;
    var pB = orderMap[b.id] || 9999;
    if (pA !== pB) return pA - pB;
    return 0;
  });

  return jsx(PortalModal, {
    ariaLabel: t("allTitle"),
    onClose: onClose,
    children: jsx("div", {
      className: "kl-overlay",
      onClick: onClose,
      children: jsxs("div", {
        className: "kl-panel",
        onClick: function(e){ e.stopPropagation(); },
        children: [
          jsxs("div", {
            className: "kl-panelHead",
            children: [
              jsxs("div", {
                children: [
                  jsx("div", { className: "kl-eyebrow", children: [jsx(SvgKey, { size: 11 }), t("hubEyebrow") || klT("hubEyebrow")] }),
                  jsxs("div", {
                    className: "kl-panelTitle",
                    children: [
                      t("allTitle"),
                      jsx("span", { className: "kl-countBadge", children: subs.length ? subs.length + t("activeBadge") : "0" })
                    ]
                  })
                ]
              }),
              jsxs("div", {
                style: { display: "flex", alignItems: "center", gap: 8 },
                children: [
                  jsx("button", {
                    type: "button",
                    className: "kl-btn kl-btn-ghost kl-btn-refresh-all",
                    title: t("refreshAll"),
                    "aria-label": t("refreshAll"),
                    onClick: refreshAll,
                    disabled: state.refreshing,
                    children: [
                      jsx(SvgRefresh, { size: 13, className: state.refreshing ? "kl-spin" : "" }),
                      jsx("span", { style: { marginLeft: 5 }, children: state.refreshing ? t("refreshing") : t("refreshAll") })
                    ]
                  }),
                  jsx("button", { type: "button", className: "kl-close", "aria-label": t("close") || "Close", onClick: onClose, children: jsx(SvgClose, {}) })
                ]
              })
            ]
          }),
          jsxs("div", {
            className: "kl-panelBody",
            children: [
              subs.length ? jsxs("div", {
                className: "kl-statsBar",
                children: [
                  jsxs("div", {
                    className: "kl-statCard",
                    children: [
                      jsx("div", { className: "kl-statLabel", children: t("poolHealth") }),
                      jsxs("div", {
                        className: "kl-statVal",
                        style: { color: pool.exhausted > 0 ? "var(--dsw-alias-state-danger)" : (pool.warning > 0 ? "var(--dsw-alias-state-warning)" : "var(--dsw-alias-state-success)") },
                        children: [
                          jsx("span", { className: "kl-dot", style: { background: pool.exhausted > 0 ? "var(--dsw-alias-state-danger)" : (pool.warning > 0 ? "var(--dsw-alias-state-warning)" : "var(--dsw-alias-state-success)") } }),
                          pool.healthy + "/" + pool.total
                        ]
                      })
                    ]
                  }),
                  jsxs("div", {
                    className: "kl-statCard",
                    children: [
                      jsx("div", { className: "kl-statLabel", children: t("minRemaining") }),
                      jsx("div", {
                        className: "kl-statVal",
                        style: { color: worstQuota != null ? (worstQuota <= DANGER ? "var(--dsw-alias-state-danger)" : (worstQuota <= WARN ? "var(--dsw-alias-state-warning)" : "var(--dsw-alias-state-success)")) : "inherit" },
                        children: worstQuota != null ? fmtPct(worstQuota) : "—"
                      })
                    ]
                  }),
                  jsxs("div", {
                    className: "kl-statCard",
                    children: [
                      jsx("div", { className: "kl-statLabel", children: t("burnRate") }),
                      jsxs("div", {
                        className: "kl-statVal",
                        children: [
                          burn.idle ? t("burnRateIdle") : (burn.rate + "%/h")
                        ]
                      })
                    ]
                  }),
                  jsxs("div", {
                    className: "kl-statCard",
                    children: [
                      jsx("div", { className: "kl-statLabel", children: t("balanceUsd") }),
                      jsx("div", { className: "kl-statVal", style: { color: "var(--dsw-alias-brand-primary)" }, children: "$" + totalBalUSD.toFixed(2) })
                    ]
                  }),
                  jsxs("div", {
                    className: "kl-statCard",
                    children: [
                      jsx(UsageSparkline, { history: history, t: t })
                    ]
                  })
                ]
              }) : null,

              jsxs("div", {
                style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" },
                children: [
                  jsxs("div", {
                    className: "kl-filterTabs",
                    children: [
                      jsx("button", {
                        type: "button",
                        className: "kl-tabBtn " + (state.tab === "all" ? "active" : ""),
                        onClick: function(){ setSt(function(s){ return Object.assign({}, s, { tab: "all" }); }); },
                        children: t("tabAll") + " (" + subs.length + ")"
                      }),
                      jsx("button", {
                        type: "button",
                        className: "kl-tabBtn " + (state.tab === "quota" ? "active" : ""),
                        onClick: function(){ setSt(function(s){ return Object.assign({}, s, { tab: "quota" }); }); },
                        children: t("tabQuotas") + " (" + quotaCount + ")"
                      }),
                      jsx("button", {
                        type: "button",
                        className: "kl-tabBtn " + (state.tab === "balance" ? "active" : ""),
                        onClick: function(){ setSt(function(s){ return Object.assign({}, s, { tab: "balance" }); }); },
                        children: t("tabBalances") + " (" + balCount + ")"
                      })
                    ]
                  }),
                  jsxs("button", {
                    type: "button",
                    className: "kl-btn",
                    disabled: state.refreshing,
                    "aria-label": t("refreshAll"),
                    onClick: refreshAll,
                    children: [
                      jsx(SvgRefresh, { className: state.refreshing ? "kl-spinning" : "" }),
                      state.refreshing ? t("refreshing") : t("refreshAll")
                    ]
                  })
                ]
              }),

              state.loading ? jsx("div", { className: "kl-meta", style: { textAlign: "center", padding: "20px 0" }, children: t("loading") }) : null,

              !state.loading && !filtered.length ? jsxs("div", {
                className: "kl-emptyBox",
                children: [
                  jsx(SvgKey, { size: 36, style: { color: "var(--dsw-alias-border-l1)" } }),
                  jsx("div", { className: "kl-emptyTitle", children: t("noSubs") }),
                  jsx("div", { className: "kl-emptyText", children: t("emptySettingsHint") })
                ]
              }) : null,

              jsx("div", {
                className: "kl-list",
                children: sorted.map(function(s){
                  return jsx(SubCard, {
                    key: s.id,
                    sub: s,
                    busy: state.refreshing,
                    t: t,
                    onRefresh: refreshOne,
                    onDelete: allowEdit ? deleteOne : null
                  });
                })
              }),

              state.err ? jsxs("div", {
                className: "kl-errBanner",
                children: [
                  jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [jsx(SvgAlert, {}), jsx("span", { children: state.err })] }),
                  jsx("button", { type: "button", className: "kl-btn", style: { height: 26, fontSize: 11, padding: "0 10px" }, onClick: function(){ load(false); }, children: t("retry") })
                ]
              }) : null
            ]
          }),
          jsxs("div", {
            className: "kl-panelFoot",
            children: [
              jsx("div", { className: "kl-meta", children: "~/.dsh/storages/dsh-key-limits/" }),
              jsx("button", { type: "button", className: "kl-btn kl-btnPrimary", onClick: onClose, children: t("close") })
            ]
          })
        ]
      })
    })
  });
}
function ActiveKeyBound(props){
  var id=sid(props)||sessionIdFromCtx();
  return jsx(ActiveKeyButton,{sessionId:id,ctx:(props&&props.ctx)||klCtx});
}

function ActiveKeyButton(props){
  var sessionId=props.sessionId||"";
  var ctx=(props&&props.ctx)||klCtx;
  var lang=useActiveLocale(ctx);
  var boundT=(ctx&&ctx.locale&&typeof ctx.locale.bind==="function")?ctx.locale.bind(NS):null;
  var dict=lang==="zh"?KL_zh:KL_en;
  var t=(typeof props.t==="function")?props.t:(typeof boundT==="function"?boundT:makeT(dict,KL_en));

  var st=useState({loading:true,data:null,open:false});
  var data=st[0].data,loading=st[0].loading,open=st[0].open,setSt=st[1];
  var load=useCallback(function(){
    if(!sessionId){setSt(function(s){return{loading:false,data:null,open:s.open}});return}
    fetchJson(API+"/active-sub?sessionId="+encodeURIComponent(sessionId),{cache:"no-store"}).then(function(j){
      setSt(function(s){return{loading:false,data:j,open:s.open}});
    }).catch(function(){setSt(function(s){return{loading:false,data:null,open:s.open}})});
  },[sessionId]);
  useEffect(function(){load();var t=setInterval(load,REFRESH_MS);return function(){clearInterval(t)}},[load]);

  function openModal(){setSt(function(s){return Object.assign({},s,{open:true})})}
  function closeModal(){setSt(function(s){return Object.assign({},s,{open:false})})}

  if(data && data.ui && data.ui.composerBar === false){
    return null;
  }
  if(loading&&!data){
    return jsx("button",{type:"button",className:"kl-chip kl-muted",title:t("loading"),children:"…"});
  }
  if(!sessionId){
    return jsx("button",{type:"button",className:"kl-chip kl-muted",title:t("activeNoSession"),children:t("activeNone")});
  }
  if(!data||!data.subId){
    return jsx("button",{type:"button",className:"kl-chip kl-muted",title:(data&&data.error)||t("activeNone"),children:t("activeNone")});
  }
  var wins=(data.quota&&data.quota.windows)||[],rem=minRemaining(wins);
  if(data.balance){
    var label=data.balance.cnyRemaining!=null?("¥"+Number(data.balance.cnyRemaining).toFixed(0)):(data.balance.remaining!=null?String(Math.round(Number(data.balance.remaining))):t("balance"));
    return jsxs(React.Fragment,{children:[
      jsxs("button",{type:"button",className:"kl-chip kl-ok",title:(data.sub&&data.sub.label)||"",onClick:openModal,children:[
        jsx(SvgKey,{size:11}),
        jsx("span",{children:label})
      ]}),
      open?jsx(OneLimitModal,{data:data,onClose:closeModal,ctx:ctx,t:t}):null
    ]});
  }
  var cls="kl-chip "+pctClass(rem)+(data.quota&&data.quota.stale?" kl-stale":"");
  return jsxs(React.Fragment,{children:[
    jsxs("button",{type:"button",className:cls,title:(data.sub&&data.sub.label)||providerLabel(data.sub&&data.sub.provider),onClick:openModal,children:[
      jsx(SvgKey,{size:11}),
      jsx("span",{children:rem!=null?fmtPct(rem):"—"})
    ]}),
    open?jsx(OneLimitModal,{data:data,onClose:closeModal,ctx:ctx,t:t}):null
  ]});
}
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
function FloatChip(props){
  var ctx=(props&&props.ctx)||klCtx;
  var lang=useActiveLocale(ctx);
  var boundT=(ctx&&ctx.locale&&typeof ctx.locale.bind==="function")?ctx.locale.bind(NS):null;
  var dict=lang==="zh"?KL_zh:KL_en;
  var t=(typeof props.t==="function")?props.t:(typeof boundT==="function"?boundT:makeT(dict,KL_en));

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
          var text=n?(wMin!=null?fmtPct(wMin):String(n)):t("activeNone");
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
    pull();var tInterval=setInterval(pull,REFRESH_MS);return function(){clearInterval(tInterval)};
  },[t]);
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
  var chipTitle = t("floatTitle");
  if(nearestReset){
    var rStr = fmtReset(nearestReset);
    if(rStr) chipTitle += " (" + t("resetsIn") + rStr + ")";
  }
  chipTitle += " [" + t("hotkeyHint") + "]";

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
          children: [t("dangerToast") + ": ", fmtPct(toastSt[0].rem) + " " + t("dangerRemaining")]
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
            title:docked ? t("undock") : t("dock"),
            onClick:toggleDock,
            children:jsx(SvgDock,{size:11})
          })
        ]
      })
    }),
    open?jsx(AllLimitsModal,{onClose:function(){setSt(function(s){return Object.assign({},s,{open:false})})},allowEdit:false,ctx:ctx,t:t}):null
  ]});
}

function BodyRoot(props){
  return jsx(FloatChip,props||{});
}
function AddKeyModal(props){
  var onClose=props.onClose,onSaved=props.onSaved;
  var t=(props&&props.t)||klT;
  var st=useState({loading:true,schemas:{},provider:"",label:"",secret:"",extra:"",err:"",saving:false});
  var s=st[0],setSt=st[1];
  useEffect(function(){
    fetchJson(API+"/config",{cache:"no-store"}).then(function(cfg){
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
        var pFieldKey = "prov_field_" + s.provider.replace(/-/g, "_") + "_" + f.key;
        var fieldKey = "field_" + f.key;
        var labelText = (f.labelKey && t(f.labelKey)) || t(pFieldKey) || t(fieldKey) || t(f.key) || (f.label && t(f.label)) || f.label || (f.key === "extra" ? t("extra") : t("secret"));
        setSt(function(x){return Object.assign({},x,{err:t("fillFields")+labelText})});
        return;
      }
    }
    setSt(function(x){return Object.assign({},x,{saving:true,err:""})});
    fetchJson(API+"/subs",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({provider:s.provider,secret:s.secret,extra:s.extra,label:s.label})}).then(function(j){
      if(j.error){setSt(function(x){return Object.assign({},x,{saving:false,err:j.error})});return}
      onSaved&&onSaved();onClose&&onClose();
    }).catch(function(e){setSt(function(x){return Object.assign({},x,{saving:false,err:String(e&&e.message||e)||t("saveError")})})});
  }
  var providerHint = schema ? (t("prov_hint_" + s.provider.replace(/-/g, "_")) || schema.hint) : null;
  return jsx(PortalModal,{ariaLabel:t("addKey"),onClose:onClose,children:jsx("div",{className:"kl-overlay",onClick:onClose,children:
    jsxs("div",{className:"kl-panel",onClick:function(e){e.stopPropagation()},children:[
      jsxs("div",{className:"kl-panelHead",children:[
        jsxs("div",{children:[
          jsxs("div",{className:"kl-panelTitle",children:[
            jsx(SvgPlus,{size:15}),
            t("addKey")
          ]}),
          jsx("div",{className:"kl-panelSub",children:t("pickProvider")})
        ]}),
        jsx("button",{type:"button",className:"kl-close","aria-label":t("close")||"Close",onClick:onClose,children:jsx(SvgClose,{})})
      ]}),
      jsx("div",{className:"kl-panelBody",children:s.loading?jsx("div",{className:"kl-meta",children:t("loading")}):jsxs(React.Fragment,{children:[
        jsxs("div",{className:"kl-field",children:[
          jsx("div",{className:"kl-fieldLabel",children:t("pickProvider")}),
          jsxs("select",{className:"kl-input","aria-label":t("pickProvider"),value:s.provider,onChange:function(e){
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
        jsxs("div",{className:"kl-field",children:[jsx("div",{className:"kl-fieldLabel",children:t("labelOptional")}),jsx("input",{className:"kl-input","aria-label":t("labelOptional"),value:s.label,onChange:function(e){setSt(function(x){return Object.assign({},x,{label:e.target.value})})}})]}),
        fields.map(function(f){
          var isSec = f.secret !== false;
          var val = f.key === "extra" ? s.extra : s.secret;
          var pFieldKey = "prov_field_" + s.provider.replace(/-/g, "_") + "_" + f.key;
          var fieldKey = "field_" + f.key;
          var labelText = (f.labelKey && t(f.labelKey)) || t(pFieldKey) || t(fieldKey) || t(f.key) || (f.label && t(f.label)) || f.label || (f.key === "extra" ? t("extra") : t("secret"));
          return jsxs("div",{key:f.key,className:"kl-field",children:[
            jsx("div",{className:"kl-fieldLabel",children:labelText}),
            jsx("input",{
              className:"kl-input",
              "aria-label": labelText,
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
  var pollTimerRef = useRef(null);
  var pollCountRef = useRef(0);

  function schedulePoll(){
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    if (pollCountRef.current >= 30) {
      pollCountRef.current = 0;
      fetchJson(API+"/subs",{cache:"no-store"}).then(function(j){
        var isRef = !!j.refreshing;
        setSt(function(s){
          return {
            loading: false,
            subscriptions: Array.isArray(j.subscriptions) ? j.subscriptions : s.subscriptions,
            refreshing: false,
            err: isRef ? t("refreshTimeout") : ""
          };
        });
      }).catch(function(e){
        setSt(function(s){
          return Object.assign({}, s, {
            refreshing: false,
            err: String((e && e.message) || e) || t("refreshTimeout")
          });
        });
      });
      return;
    }
    pollCountRef.current++;
    pollTimerRef.current = setTimeout(function(){
      load(false);
    }, 1000);
  }

  function load(refresh){
    fetchJson(API+"/subs"+(refresh?"?refresh=1":""),{cache:"no-store"}).then(function(j){
      var isRef = !!j.refreshing;
      setSt(function(s){
        return {
          loading: false,
          subscriptions: Array.isArray(j.subscriptions) ? j.subscriptions : s.subscriptions,
          refreshing: isRef,
          err: ""
        };
      });
      if (isRef) {
        schedulePoll();
      } else {
        pollCountRef.current = 0;
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      }
    }).catch(function(e){
      pollCountRef.current = 0;
      setSt(function(s){
        return Object.assign({}, s, {
          loading: false,
          refreshing: false,
          err: String((e && e.message) || e)
        });
      });
    });
  }

  useEffect(function(){
    load(false);
    return function(){
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  function del(id,label){
    if(!confirm(t("deleteConfirm")+label+"»?"))return;
    fetchJson(API+"/subs?id="+encodeURIComponent(id),{method:"DELETE"})
      .then(function(){ load(false); })
      .catch(function(e){
        setSt(function(s){
          return Object.assign({}, s, { err: String((e && e.message) || e) });
        });
      });
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
      return jsx(SubCard,{
        key:s.id,
        sub:s,
        busy:state.refreshing,
        onRefresh:function(id){
          setSt(function(s){ return Object.assign({}, s, { refreshing: true, err: "" }); });
          fetchJson(API+"/subs?refresh=1&id="+encodeURIComponent(id),{cache:"no-store"})
            .then(function(){ load(false); })
            .catch(function(e){
              setSt(function(s){
                return Object.assign({}, s, { refreshing: false, err: String((e && e.message) || e) });
              });
            });
        },
        onDelete:del
      });
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
  var subsListRef = useRef([]);
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
      var subsList = (subs !== undefined && subs !== null) ? subs : (subsListRef.current || []);
      subsListRef.current = subsList;
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
        if (currentSnap) applySnapshot(currentSnap, subsListRef.current);
      });
    }

    var initialSnap = typeof scope.getSnapshot === "function" ? scope.getSnapshot() : null;
    fetchJson(API + "/subs", { cache: "no-store" })
      .then(function(subsData){
        if (cancelled) return;
        var subs = Array.isArray(subsData && subsData.subscriptions) ? subsData.subscriptions : (subsListRef.current || []);
        subsListRef.current = subs;
        var snap = (typeof scope.getSnapshot === "function") ? scope.getSnapshot() : initialSnap;
        applySnapshot(snap, subs);
      })
      .catch(function(err){
        if (cancelled) return;
        var snap = (typeof scope.getSnapshot === "function") ? scope.getSnapshot() : initialSnap;
        applySnapshot(snap, subsListRef.current);
        setSt(function(x){ return Object.assign({}, x, { msg: String((err && err.message) || err) }); });
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
      { op: "set", path: ["ui", "activeOnTop"], value: !!s.activeOnTop },
      { op: "set", path: ["ui", "order"], value: Array.isArray(s.order) ? s.order : [] }
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
        scope.set("ui", { floatChip: !!s.floatChip, composerBar: !!s.composerBar, activeOnTop: !!s.activeOnTop, order: Array.isArray(s.order) ? s.order : [] })
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
    jsxs("div",{className:"kl-field",children:[
      jsx("div",{className:"kl-fieldLabel",children:t("storageDir")}),
      jsx("input",{className:"kl-input",value:s.storageDir,readOnly:true,disabled:true,style:{opacity:0.75,cursor:"not-allowed"}}),
      jsx("div",{className:"kl-meta",style:{fontSize:11,marginTop:3},children:t("storageDirRestartNote")||"(read-only, configured in settings.yaml, requires restart)"})
    ]}),
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

  var showRetry = s.data && s.data.latestCheckFailed;
  var showUpdateBtn = s.data && s.data.updateAvailable && s.data.canAutoUpdate !== false;
  var showManualNotice = s.data && s.data.updateAvailable && s.data.canAutoUpdate === false;
  var showUpToDate = s.data && !s.data.updateAvailable && !s.data.latestCheckFailed;

  return jsxs("div",{style:{marginTop:16,paddingTop:12,borderTop:"1px solid var(--dsw-alias-border-l2)"},children:[
    jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between"},children:[
      jsxs("div",{className:"kl-meta",children:[
        s.data ? ("v" + s.data.currentVersion) : "",
        s.data && s.data.updateAvailable ? (" → v" + s.data.latestVersion) : ""
      ]}),
      jsx("div",{children:
        showUpdateBtn ?
          jsx("button",{type:"button",className:"kl-btn kl-btnPrimary",disabled:s.updating,onClick:triggerUpdate,children:s.updating ? t("updating") : t("updateNow")}) :
        showRetry ?
          jsx("button",{type:"button",className:"kl-btn",disabled:s.checking,onClick:check,children:s.checking ? t("checkingUpdates") : (t("checkFailed") + " (" + t("retry") + ")")}) :
          jsx("button",{type:"button",className:"kl-btn",disabled:s.checking,onClick:check,children:s.checking ? t("checkingUpdates") : (showUpToDate ? t("upToDate") : t("checkForUpdates"))})
      })
    ]}),
    showManualNotice ? jsx("div",{className:"kl-meta",style:{color:"var(--dsw-alias-state-warning)",marginTop:6},children:t("manualUpdateCmd")}):null,
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
    return function () { undo.forEach(function (off) { try { off(); } catch (err) { void err; } }); };
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
      unreg.forEach(function(fn){ try { fn(); } catch (err) { void err; } });
    };
  }, "key-limits: settings slots");
}
function apply(ctx){
  klCtx=ctx;
  ctx.effect(function(){
    return ensureKeyLimitsStyles();
  },"key-limits: style mount");
  registerKeyLimitsSettings(ctx);
  ctx.effect(function(){
    var off = null;
    try {
      off = ctx.slots.inject("conversation.composer.bar",function(){
        return ctx.slots.register({name:"conversation.composer.bar",id:"key-limits-active",priority:10},ActiveKeyBound);
      });
    } catch (err) { void err; }
    return function(){
      if (typeof off === "function") try { off(); } catch (err) { void err; }
    };
  }, "key-limits: composer bar slot");
  ctx.effect(function(){
    var el=document.createElement("div");el.id="dsh-key-limits-root";document.body.appendChild(el);
    var root=ReactDOM.createRoot(el);
    root.render(jsx(BodyRoot,{ctx:ctx}));
    return function(){root.unmount();el.remove()};
  },"key-limits: body mount");
}
exports.apply=apply;exports.inject=["slots","locale","configForms"];return module.exports}})
