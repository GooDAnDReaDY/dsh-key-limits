/* prelude */
var module={exports:{}},exports=module.exports,React=require("react"),ReactDOM=require("react-dom/client"),createPortal=require("react-dom").createPortal,jsx=require("react/jsx-runtime").jsx,jsxs=require("react/jsx-runtime").jsxs,useState=React.useState,useEffect=React.useEffect,useCallback=React.useCallback,useRef=React.useRef,API="/dsh-key-limits",NS="dsh-key-limits",PKG="@goodandready/dsh-key-limits",ROW_ID="dsh-key-limits",ROW_CONFIG_KEY=PKG+"#"+ROW_ID,REFRESH_MS=60000,WARN=30,DANGER=15,POS_KEY="kl-chip-pos",klCtx=null;

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
.kl-prov-commandcode {
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, var(--dsw-alias-bg-layer-3));
  border-color: var(--dsw-alias-border-l2);
  color: var(--dsw-alias-label-primary);
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
  if(existing)return function(){};
  var tag=document.createElement("style");
  tag.dataset.dshPlugin="dsh-key-limits";
  tag.setAttribute("data-dsh-plugin","dsh-key-limits");
  tag.textContent=css;
  document.head.appendChild(tag);
  return function(){tag.remove()};
}
ensureKeyLimitsStyles();

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
      try { controller.abort(); } catch(e) {}
    }, ms);
    var newOpts = Object.assign({}, options, { signal: controller.signal });
    return fetch(url, newOpts).finally(function() {
      clearTimeout(timer);
    });
  }
  return fetch(url, options);
}

