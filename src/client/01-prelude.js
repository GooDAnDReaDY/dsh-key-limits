/* prelude */
var module={exports:{}},exports=module.exports,React=require("react"),ReactDOM=require("react-dom/client"),createPortal=require("react-dom").createPortal,jsx=require("react/jsx-runtime").jsx,jsxs=require("react/jsx-runtime").jsxs,useState=React.useState,useEffect=React.useEffect,useCallback=React.useCallback,useRef=React.useRef,API="/dsh-key-limits",NS="dsh-key-limits",REFRESH_MS=60000,WARN=30,DANGER=15,POS_KEY="kl-chip-pos",klCtx=null;

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
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: color-mix(in srgb, var(--dsw-alias-bg-base, #111) 78%, transparent);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  color: var(--dsw-alias-label-primary, #fff);
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  cursor: grab;
  user-select: none;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.18);
  transition: transform 0.16s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.16s ease, border-color 0.16s ease;
}
.kl-float:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 14px 36px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.25);
}
.kl-float:active {
  cursor: grabbing;
  transform: scale(0.96);
}
.kl-float-ok {
  border-color: color-mix(in srgb, #10b981 50%, transparent);
  color: #10b981;
}
.kl-float-ok .kl-dot { background: #10b981; box-shadow: 0 0 8px #10b981; }
.kl-float-warn {
  border-color: color-mix(in srgb, #f59e0b 50%, transparent);
  color: #f59e0b;
}
.kl-float-warn .kl-dot { background: #f59e0b; box-shadow: 0 0 8px #f59e0b; }
.kl-float-danger {
  border-color: color-mix(in srgb, #ef4444 55%, transparent);
  color: #ef4444;
}
.kl-float-danger .kl-dot { background: #ef4444; box-shadow: 0 0 8px #ef4444; }
.kl-float-muted {
  color: var(--dsw-alias-label-secondary, #999);
  border-color: var(--dsw-alias-border-l2, rgba(255,255,255,0.08));
}
.kl-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--dsw-alias-label-tertiary, #666);
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
  background: rgba(0, 0, 0, 0.72);
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
  background: color-mix(in srgb, var(--dsw-alias-bg-base, #0d0e12) 95%, #000);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.15);
  color: var(--dsw-alias-label-primary, #fff);
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-2, #161820) 40%, transparent);
}
.kl-eyebrow {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--dsw-alias-label-tertiary, #888);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.kl-panelTitle {
  font-size: 17px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--dsw-alias-label-primary, #fff);
  display: flex;
  align-items: center;
  gap: 10px;
}
.kl-countBadge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--dsw-alias-label-secondary, #ccc);
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
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-2, #161820) 50%, transparent);
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
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-2, #161820) 70%, transparent);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.kl-statLabel {
  font-size: 11px;
  font-weight: 600;
  color: var(--dsw-alias-label-tertiary, #888);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.kl-statVal {
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--dsw-alias-label-primary, #fff);
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
  color: var(--dsw-alias-label-tertiary, #888);
  font-size: 12px;
  font-weight: 600;
  transition: all 0.15s ease;
}
.kl-tabBtn:hover {
  color: var(--dsw-alias-label-primary, #fff);
  background: rgba(255, 255, 255, 0.06);
}
.kl-tabBtn.active {
  color: var(--dsw-alias-label-primary, #fff);
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.14);
}

/* Subscription Cards */
.kl-subCard {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 16px 18px;
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-2, #181a22) 80%, transparent);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: border-color 0.16s ease, transform 0.16s ease;
}
.kl-subCard:hover {
  border-color: rgba(255, 255, 255, 0.18);
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
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--dsw-alias-label-primary, #fff);
}
.kl-prov-opencode-go { background: rgba(99, 102, 241, 0.15); border-color: rgba(99, 102, 241, 0.35); color: #a5b4fc; }
.kl-prov-deepseek { background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.35); color: #93c5fd; }
.kl-prov-openrouter { background: rgba(168, 85, 247, 0.15); border-color: rgba(168, 85, 247, 0.35); color: #d8b4fe; }
.kl-prov-minimax { background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.35); color: #fcd34d; }
.kl-prov-cline { background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.35); color: #6ee7b7; }
.kl-prov-qwen { background: rgba(236, 72, 153, 0.15); border-color: rgba(236, 72, 153, 0.35); color: #f472b6; }
.kl-prov-ollama { background: rgba(14, 165, 233, 0.15); border-color: rgba(14, 165, 233, 0.35); color: #7dd3fc; }

.kl-subTitle {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--dsw-alias-label-primary, #fff);
  margin-bottom: 2px;
}
.kl-subMeta {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary, #888);
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Quota Windows Bento Grid */
.kl-bentoGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
}
.kl-bentoCell {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: color-mix(in srgb, var(--dsw-alias-bg-base, #111) 50%, transparent);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.kl-bentoHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.kl-bentoLabel {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--dsw-alias-label-secondary, #aaa);
}
.kl-bentoPct {
  font-size: 13.5px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.kl-bentoReset {
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, #777);
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Progress Bars */
.kl-progBar {
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}
.kl-progFill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #10b981, #34d399);
  transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.kl-progWarn .kl-progFill { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.kl-progDanger .kl-progFill { background: linear-gradient(90deg, #ef4444, #f87171); }

/* Balance Highlight Display */
.kl-balanceBox {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.kl-balanceAmt {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #38bdf8;
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
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: var(--dsw-alias-label-primary, #fff);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;
}
.kl-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.22);
  transform: translateY(-1px);
}
.kl-btn:active:not(:disabled) { transform: scale(0.97); }
.kl-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.kl-btnPrimary {
  background: #fff;
  color: #000;
  border-color: #fff;
  font-weight: 700;
}
.kl-btnPrimary:hover:not(:disabled) {
  background: #e2e8f0;
  opacity: 0.95;
}

.kl-btnIcon {
  width: 30px;
  height: 30px;
  padding: 0;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #aaa);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}
.kl-btnIcon:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}
.kl-btnDanger:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.kl-close {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: var(--dsw-alias-label-secondary, #aaa);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}
.kl-close:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

/* Empty State */
.kl-emptyBox {
  padding: 48px 24px;
  border: 1px dashed rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.02);
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
  color: var(--dsw-alias-label-primary, #fff);
}
.kl-emptyText {
  font-size: 12.5px;
  color: var(--dsw-alias-label-tertiary, #888);
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
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.28);
  color: #f87171;
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
