/* locale */
var KL_en={
  storageDir:"Storage directory",refreshHours:"Refresh hours",floatChip:"Float chip",composerBar:"Composer bar",saved:"Saved",

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
  checkUpdateFailed:"Failed to check for updates"
};

var KL_zh={
  storageDir:"数据目录",refreshHours:"刷新间隔(小时)",floatChip:"悬浮胶囊",composerBar:"输入栏按钮",saved:"已保存",

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
  checkUpdateFailed:"检查更新失败"
};

function klLang(){try{var l=(klCtx&&klCtx.locale&&klCtx.locale.locale)||(typeof navigator!=="undefined"&&navigator.language)||"en";return String(l).toLowerCase().indexOf("zh")===0?"zh":"en"}catch(e){return"en"}}
function klT(key){var dict=klLang()==="zh"?KL_zh:KL_en;return dict[key]!=null?dict[key]:(KL_en[key]!=null?KL_en[key]:key)}
function makeT(dict,fb){return function(k){return dict[k]!=null?dict[k]:(fb[k]!=null?fb[k]:k)}}
function useActiveLocale(ctx){var st=useState(function(){try{return (ctx.locale&&ctx.locale.locale)||"en"}catch(e){return"en"}});useEffect(function(){if(!ctx||!ctx.locale||!ctx.locale.watch)return;return ctx.locale.watch(function(l){st[1](l)})},[ctx]);return String(st[0]||"").toLowerCase().indexOf("zh")===0?"zh":"en"}
