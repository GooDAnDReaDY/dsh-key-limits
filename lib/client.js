window.__ModuleLoader__.load({id:"@goodandready/dsh-key-limits",factory:(require)=>{var module={exports:{}},exports=module.exports,React=require("react"),ReactDOM=require("react-dom/client"),createPortal=require("react-dom").createPortal,jsx=require("react/jsx-runtime").jsx,jsxs=require("react/jsx-runtime").jsxs,useState=React.useState,useEffect=React.useEffect,useCallback=React.useCallback,useRef=React.useRef,API="/dsh-key-limits",NS="dsh-key-limits",REFRESH_MS=60000,WARN=30,DANGER=15,POS_KEY="kl-chip-pos",klCtx=null;

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

/* Subscription List */
.kl-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Subscription Cards */
.kl-subCard {
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  padding: 14px 16px;
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-2, #181a22) 85%, transparent);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: border-color 0.16s ease, transform 0.16s ease;
}
.kl-subCard:hover {
  border-color: rgba(255, 255, 255, 0.14);
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
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--dsw-alias-label-secondary, #cbd5e1);
}
.kl-prov-opencode-go { background: rgba(99, 102, 241, 0.1); border-color: rgba(99, 102, 241, 0.25); color: #c7d2fe; }
.kl-prov-deepseek { background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.25); color: #bfdbfe; }
.kl-prov-openrouter { background: rgba(168, 85, 247, 0.1); border-color: rgba(168, 85, 247, 0.25); color: #e9d5ff; }
.kl-prov-minimax { background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.25); color: #fde68a; }
.kl-prov-cline { background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.25); color: #a7f3d0; }
.kl-prov-qwen { background: rgba(236, 72, 153, 0.1); border-color: rgba(236, 72, 153, 0.25); color: #fbcfe8; }
.kl-prov-ollama { background: rgba(14, 165, 233, 0.1); border-color: rgba(14, 165, 233, 0.25); color: #bae6fd; }
.kl-prov-commandcode { background: rgba(139, 92, 246, 0.1); border-color: rgba(139, 92, 246, 0.25); color: #ddd6fe; }

.kl-subTitle {
  font-size: 14px;
  font-weight: 600;
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
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 8px;
}
.kl-bentoCell {
  padding: 8px 10px;
  border-radius: 9px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  background: rgba(0, 0, 0, 0.2);
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
  color: var(--dsw-alias-label-secondary, #94a3b8);
}
.kl-bentoPct {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.kl-normal { color: var(--dsw-alias-label-primary, #f1f5f9); }
.kl-warn { color: #fbbf24; }
.kl-danger { color: #f87171; }
.kl-muted { color: var(--dsw-alias-label-tertiary, #64748b); }

.kl-bentoReset {
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, #94a3b8);
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Progress Bars */
.kl-progBar {
  height: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
}
.kl-progFill {
  height: 100%;
  border-radius: 999px;
  background: #34d399;
  transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.kl-progWarn .kl-progFill { background: #fbbf24; }
.kl-progDanger .kl-progFill { background: #f87171; }

/* Account Reordering List */
.kl-orderItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.08));
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2, rgba(255, 255, 255, 0.02));
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
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: var(--dsw-alias-label-primary, #fff);
  cursor: pointer;
  padding: 0;
  font-size: 11px;
}
.kl-orderBtn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
}
.kl-orderBtn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

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
var KL_en={
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
  fillFields:"Fill in: ",saveError:"save error",
  deleteConfirm:"Delete key «",
  uiHint:"Float chip and composer bar — cordis ui.*",
  dataPath:"Data: ~/.dsh/storages/dsh-key-limits/",
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
  minRemaining:"Min. quota",
  balanceUsd:"Balance ($)",
  tabAll:"All",
  tabQuotas:"Quotas",
  tabBalances:"Balances",
  emptySettingsHint:"Add provider keys and tokens in plugin settings to track live quotas and balances.",
  activeBadge:" active",
};

var KL_zh={
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
  fillFields:"请填写: ",saveError:"保存失败",
  deleteConfirm:"确定删除密钥 «",
  uiHint:"悬浮胶囊与输入栏按钮 — cordis ui.*",
  dataPath:"数据路径: ~/.dsh/storages/dsh-key-limits/",
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
  minRemaining:"最低额度",
  balanceUsd:"余额 ($)",
  tabAll:"全部",
  tabQuotas:"配额",
  tabBalances:"余额",
  emptySettingsHint:"请在插件设置中添加提供商密钥，以实时监控配额与余额。",
  activeBadge:" 个活跃",
};


function klLang(){
  try{
    var l=(klCtx&&klCtx.locale&&klCtx.locale.locale)||"en";
    var s=String(l).toLowerCase();
    if(s.indexOf("zh")===0)return "zh";
    return "en";
  }catch(e){return "en"}
}
function klT(key){
  var lang=klLang();
  var dict=lang==="zh"?KL_zh:KL_en;
  return dict[key]!=null?dict[key]:(KL_en[key]!=null?KL_en[key]:key);
}
function makeT(dict,fb){return function(k){return dict[k]!=null?dict[k]:(fb[k]!=null?fb[k]:k)}}
function useActiveLocale(ctx){var st=useState(function(){try{return (ctx.locale&&ctx.locale.locale)||"en"}catch(e){return"en"}});useEffect(function(){if(!ctx||!ctx.locale||!ctx.locale.watch)return;return ctx.locale.watch(function(l){st[1](l)})},[ctx]);return String(st[0]||"").toLowerCase().indexOf("zh")===0?"zh":"en"}
function sid(p){return p&&(p.sessionId||(p.session&&(p.session.sessionId||p.session.id)))||""}
function sessionIdFromCtx(){try{var s=klCtx&&klCtx.sessions&&klCtx.sessions.list&&klCtx.sessions.list.getSnapshot();return s&&s.current||""}catch(e){return ""}}
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
function readPos(){try{var r=JSON.parse(localStorage.getItem(POS_KEY)||"null");if(r&&typeof r.x==="number"&&typeof r.y==="number")return r}catch(e){}return null}
function savePos(x,y){try{localStorage.setItem(POS_KEY,JSON.stringify({x:x,y:y}))}catch(e){}}
function PortalModal(props){
  useEffect(function(){
    if(typeof window==="undefined"||!props.onClose)return;
    function onKey(e){if(e.key==="Escape")props.onClose()}
    window.addEventListener("keydown",onKey);
    return function(){window.removeEventListener("keydown",onKey)};
  },[props.onClose]);
  return createPortal(props.children,document.body);
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
  return "";
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
function QuotaBars(props){
  var wins = props.windows || [];
  if (!wins.length) return jsx("div", { className: "kl-empty", children: props.empty || klT("noQuota") });
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
                style: { color: rem <= DANGER ? "#ef4444" : (rem <= WARN ? "#f59e0b" : "#10b981") },
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
  var b = props.balance;
  if (!b) return null;
  var cur = b.currency || "$";
  var rem = b.cnyRemaining != null ? ("¥" + Number(b.cnyRemaining).toFixed(2)) : (b.remaining != null ? (cur + Number(b.remaining).toFixed(2)) : "—");
  return jsxs("div", {
    className: "kl-balanceBox",
    children: [
      jsxs("div", {
        children: [
          jsx("div", { className: "kl-bentoLabel", children: klT("balance") }),
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
  var sub = d.sub || {}, wins = (d.quota && d.quota.windows) || [], title = providerLabel(sub.provider || (d.route && d.route.provider)), subline = (sub.label || "").trim();
  return jsx(PortalModal, {
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
                  jsx("div", { className: "kl-eyebrow", children: [jsx(SvgKey, { size: 11 }), "ACTIVE SESSION LIMIT"] }),
                  jsx("div", { className: "kl-panelTitle", children: title }),
                  subline ? jsx("div", { className: "kl-panelSub", children: subline }) : null
                ]
              }),
              jsx("button", { type: "button", className: "kl-close", onClick: onClose, children: jsx(SvgClose, {}) })
            ]
          }),
          jsxs("div", {
            className: "kl-panelBody",
            children: [
              d.quota && d.quota.error ? jsxs("div", { className: "kl-errBanner", children: [jsx(SvgAlert, {}), jsx("span", { children: String(d.quota.error) })] }) : null,
              d.quota && d.quota.stale ? jsx("span", { className: "kl-stale", children: klT("stale") }) : null,
              d.balance ? jsx(BalanceBlock, { balance: d.balance }) : jsx(QuotaBars, { windows: wins }),
              d.quota && d.quota.fetchedAt ? jsx("div", { className: "kl-meta", children: klT("updated") + new Date(d.quota.fetchedAt).toLocaleString() }) : null
            ]
          }),
          jsx("div", {
            className: "kl-panelFoot",
            children: jsx("button", { type: "button", className: "kl-btn kl-btnPrimary", onClick: onClose, children: klT("close") })
          })
        ]
      })
    })
  });
}

function SubCard(props){
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
                  s.status === "ok" ? jsx("span", { className: "kl-dot", style: { background: "#10b981" } }) : null
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
                title: klT("refresh"),
                onClick: function(){ onRefresh(s.id); },
                children: jsx(SvgRefresh, { className: busy ? "kl-spinning" : "" })
              }) : null,
              onDelete ? jsx("button", {
                type: "button",
                className: "kl-btnIcon kl-btnDanger",
                title: klT("delete"),
                onClick: function(){ onDelete(s.id, s.label || s.id); },
                children: jsx(SvgTrash, {})
              }) : null
            ]
          })
        ]
      }),
      s.quota && s.quota.stale ? jsx("span", { className: "kl-stale", children: klT("stale") }) : null,
      bal ? jsx(BalanceBlock, { balance: bal }) : jsx(QuotaBars, { windows: wins }),
      s.quota && s.quota.error ? jsxs("div", { className: "kl-errBanner", children: [jsx(SvgAlert, {}), jsx("span", { children: String(s.quota.error) })] }) : null
    ]
  });
}

function AllLimitsModal(props){
  var onClose = props.onClose, allowEdit = props.allowEdit;
  var st = useState({ loading: true, subscriptions: [], refreshing: false, err: "", tab: "all" });
  var state = st[0], setSt = st[1];

  var load = useCallback(function(refresh){
    var q = refresh ? "?refresh=1" : "";
    if (refresh) setSt(function(s){ return Object.assign({}, s, { refreshing: true }); });
    Promise.all([
      fetch(API + "/config", { cache: "no-store" }).then(function(r){ return r.json(); }).catch(function(){ return {}; }),
      fetch(API + "/subs" + q, { cache: "no-store" }).then(function(r){ return r.json(); }),
      fetch(API + "/active-sub?sessionId=" + encodeURIComponent(sessionIdFromCtx()), { cache: "no-store" }).then(function(r){ return r.json(); }).catch(function(){ return null; })
    ]).then(function(res){
      var cfg = res[0] || {};
      var j = res[1] || {};
      var act = res[2] || {};
      var ui = cfg.ui || {};
      setSt(function(s){
        return Object.assign({}, s, {
          loading: false,
          subscriptions: j.subscriptions || [],
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
          err: String(e && e.message || e)
        });
      });
    });
  }, []);

  useEffect(function(){
    load(false);
    var t = setInterval(function(){ load(false); }, REFRESH_MS);
    return function(){ clearInterval(t); };
  }, [load]);

  function refreshOne(id){
    setSt(function(s){ return Object.assign({}, s, { refreshing: true }); });
    fetch(API + "/subs?refresh=1&id=" + encodeURIComponent(id), { cache: "no-store" })
      .then(function(r){ return r.json(); })
      .then(function(j){
        setSt(function(s){
          return Object.assign({}, s, {
            loading: false,
            subscriptions: j.subscriptions || [],
            refreshing: !!j.refreshing,
            err: ""
          });
        });
      })
      .catch(function(e){
        setSt(function(s){
          return Object.assign({}, s, {
            refreshing: false,
            err: String(e && e.message || e)
          });
        });
      });
  }

  function deleteOne(id, label){
    if (!confirm(klT("deleteConfirm") + label + "»?")) return;
    fetch(API + "/subs?id=" + encodeURIComponent(id), { method: "DELETE" })
      .then(function(){ load(false); })
      .catch(function(e){
        setSt(function(s){
          return Object.assign({}, s, { err: String(e && e.message || e) });
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
                  jsx("div", { className: "kl-eyebrow", children: [jsx(SvgKey, { size: 11 }), "KEY LIMITS & SUBSCRIPTION HUB"] }),
                  jsxs("div", {
                    className: "kl-panelTitle",
                    children: [
                      klT("allTitle"),
                      jsx("span", { className: "kl-countBadge", children: subs.length ? subs.length + klT("activeBadge") : "0" })
                    ]
                  })
                ]
              }),
              jsx("button", { type: "button", className: "kl-close", onClick: onClose, children: jsx(SvgClose, {}) })
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
                      jsx("div", { className: "kl-statLabel", children: klT("totalAccounts") }),
                      jsxs("div", {
                        className: "kl-statVal",
                        children: [
                          jsx("span", { className: "kl-dot", style: { background: "#10b981" } }),
                          subs.length
                        ]
                      })
                    ]
                  }),
                  jsxs("div", {
                    className: "kl-statCard",
                    children: [
                      jsx("div", { className: "kl-statLabel", children: klT("minRemaining") }),
                      jsx("div", {
                        className: "kl-statVal",
                        style: { color: worstQuota != null ? (worstQuota <= DANGER ? "#ef4444" : (worstQuota <= WARN ? "#f59e0b" : "#10b981")) : "inherit" },
                        children: worstQuota != null ? fmtPct(worstQuota) : "—"
                      })
                    ]
                  }),
                  jsxs("div", {
                    className: "kl-statCard",
                    children: [
                      jsx("div", { className: "kl-statLabel", children: klT("balanceUsd") }),
                      jsx("div", { className: "kl-statVal", style: { color: "#38bdf8" }, children: "$" + totalBalUSD.toFixed(2) })
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
                        children: klT("tabAll") + " (" + subs.length + ")"
                      }),
                      jsx("button", {
                        type: "button",
                        className: "kl-tabBtn " + (state.tab === "quota" ? "active" : ""),
                        onClick: function(){ setSt(function(s){ return Object.assign({}, s, { tab: "quota" }); }); },
                        children: klT("tabQuotas") + " (" + quotaCount + ")"
                      }),
                      jsx("button", {
                        type: "button",
                        className: "kl-tabBtn " + (state.tab === "balance" ? "active" : ""),
                        onClick: function(){ setSt(function(s){ return Object.assign({}, s, { tab: "balance" }); }); },
                        children: klT("tabBalances") + " (" + balCount + ")"
                      })
                    ]
                  }),
                  jsxs("button", {
                    type: "button",
                    className: "kl-btn",
                    disabled: state.refreshing,
                    onClick: function(){ load(true); },
                    children: [
                      jsx(SvgRefresh, { className: state.refreshing ? "kl-spinning" : "" }),
                      state.refreshing ? klT("refreshing") : klT("refreshAll")
                    ]
                  })
                ]
              }),

              state.loading ? jsx("div", { className: "kl-meta", style: { textAlign: "center", padding: "20px 0" }, children: klT("loading") }) : null,

              !state.loading && !filtered.length ? jsxs("div", {
                className: "kl-emptyBox",
                children: [
                  jsx(SvgKey, { size: 36, style: { color: "rgba(255,255,255,0.2)" } }),
                  jsx("div", { className: "kl-emptyTitle", children: klT("noSubs") }),
                  jsx("div", { className: "kl-emptyText", children: klT("emptySettingsHint") })
                ]
              }) : null,

              jsx("div", {
                className: "kl-list",
                children: sorted.map(function(s){
                  return jsx(SubCard, {
                    key: s.id,
                    sub: s,
                    busy: state.refreshing,
                    onRefresh: refreshOne,
                    onDelete: allowEdit ? deleteOne : null
                  });
                })
              }),

              state.err ? jsxs("div", {
                className: "kl-errBanner",
                children: [
                  jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [jsx(SvgAlert, {}), jsx("span", { children: state.err })] }),
                  jsx("button", { type: "button", className: "kl-btn", style: { height: 26, fontSize: 11, padding: "0 10px" }, onClick: function(){ load(false); }, children: klT("retry") })
                ]
              }) : null
            ]
          }),
          jsxs("div", {
            className: "kl-panelFoot",
            children: [
              jsx("div", { className: "kl-meta", children: "~/.dsh/storages/dsh-key-limits/" }),
              jsx("button", { type: "button", className: "kl-btn kl-btnPrimary", onClick: onClose, children: klT("close") })
            ]
          })
        ]
      })
    })
  });
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
    return jsx("button",{type:"button",className:"kl-chip kl-muted",title:(data&&data.error)||klT("activeNone"),children:klT("activeNone")});
  }
  var wins=(data.quota&&data.quota.windows)||[],rem=minRemaining(wins);
  if(data.balance){
    var label=data.balance.cnyRemaining!=null?("¥"+Number(data.balance.cnyRemaining).toFixed(0)):(data.balance.remaining!=null?String(Math.round(Number(data.balance.remaining))):klT("balance"));
    return jsxs(React.Fragment,{children:[
      jsxs("button",{type:"button",className:"kl-chip kl-ok",title:(data.sub&&data.sub.label)||"",onClick:openModal,children:[
        jsx(SvgKey,{size:11}),
        jsx("span",{children:label})
      ]}),
      open?jsx(OneLimitModal,{data:data,onClose:closeModal}):null
    ]});
  }
  var cls="kl-chip "+pctClass(rem)+(data.quota&&data.quota.stale?" kl-stale":"");
  return jsxs(React.Fragment,{children:[
    jsxs("button",{type:"button",className:cls,title:(data.sub&&data.sub.label)||providerLabel(data.sub&&data.sub.provider),onClick:openModal,children:[
      jsx(SvgKey,{size:11}),
      jsx("span",{children:rem!=null?fmtPct(rem):"—"})
    ]}),
    open?jsx(OneLimitModal,{data:data,onClose:closeModal}):null
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
function FloatChip(){
  var st=useState({enabled:true,label:"…",worst:null,open:false});
  var enabled=st[0].enabled,label=st[0].label,worst=st[0].worst,open=st[0].open,setSt=st[1];
  var initialPos = readPos();
  var pos=useState(initialPos ? clampPos(initialPos.x, initialPos.y) : null);
  var drag=useRef({active:false,dx:0,dy:0,moved:false});
  var lastPosRef=useRef(pos[0]);
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
  var p=pos[0]?clampPos(pos[0].x,pos[0].y):null,style={left:p&&p.x!=null?p.x+"px":"auto",top:p&&p.y!=null?p.y+"px":"auto",right:p&&p.x!=null?"auto":"16px",bottom:p&&p.y!=null?"auto":"16px"};
  var floatCls = "kl-float " + floatPctClass(worst);
  return jsxs(React.Fragment,{children:[
    jsx("div",{className:"kl-floatWrap",style:style,
      onPointerMove:function(e){
        if(!drag.current.active)return;
        drag.current.moved=true;
        var next=clampPos(e.clientX-drag.current.dx, e.clientY-drag.current.dy);
        lastPosRef.current=next;
        pos[1](next);
      },
      onPointerUp:function(e){
        if(!drag.current.active)return;
        drag.current.active=false;
        var cp=lastPosRef.current;
        if(cp)savePos(cp.x,cp.y);
        try{e.currentTarget.releasePointerCapture(e.pointerId)}catch(err){}
      },
      children:jsxs("div",{title:klT("floatTitle"),className:floatCls,
        onPointerDown:function(e){
          if(e.button!==0)return;
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

  return jsxs("div",{style:{marginBottom:16,paddingBottom:12,borderBottom:"1px solid var(--dsw-alias-border-l2, #333)"},children:[
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
            jsx("span",{style:{fontSize:11,color:"var(--dsw-alias-label-tertiary,#888)",width:16},children:(idx+1)+"."}),
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

  return jsxs("div",{style:{marginTop:16,paddingTop:12,borderTop:"1px solid var(--dsw-alias-border-l2, #333)"},children:[
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
    s.notice ? jsx("div",{className:"kl-meta",style:{color:"#10b981",marginTop:6},children:s.notice}) : null,
    s.error ? jsx("div",{className:"kl-alertError",style:{marginTop:6},children:s.error}) : null
  ]});
}

function KeyLimitsPluginCard(props){
  var ctx = (props && props.ctx) || klCtx;
  var lang = useActiveLocale(ctx),
      dict = lang === "zh" ? KL_zh : KL_en,
      t = (typeof props.t === "function") ? props.t : makeT(dict, KL_en),
      st = useState(false),
      open = st[0],
      setOpen = st[1];
  return jsxs("li",{className:"kl-item",children:[
    jsxs("button",{type:"button",className:"kl-head","aria-expanded":!!open,onClick:function(){setOpen(!open)},children:[
      jsxs("div",{className:"kl-grow",children:[
        jsx("div",{className:"kl-title",children:t("title")}),
        jsx("div",{className:"kl-sub",children:t("subtitle")})
      ]}),
      jsx("span",{className:"kl-chev"+(open?" kl-chev-open":""),"aria-hidden":"true",children:jsx("svg",{width:14,height:14,viewBox:"0 0 14 14",fill:"none",stroke:"currentColor",strokeWidth:1.5,style:{display:"block"},children:jsx("path",{d:"M3.5 5.25L7 8.75L10.5 5.25"})})})
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
  // #11: plugin.item only — no settings.section fallback
  ctx.slots.inject("settings.plugin.item",function(){
    return ctx.slots.register({name:"settings.plugin.item",key:NS,locale:NS,inject:function(){return{ctx}}},function(p){
      return jsx(KeyLimitsPluginCard,{...p,locale:loc()});
    });
  });
}
function apply(ctx){
  klCtx=ctx;
  ctx.effect(function(){
    return ensureKeyLimitsStyles();
  },"key-limits: style mount");
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
exports.apply=apply;exports.inject=["slots","sessions","locale","settingsScope"];return module.exports}})
