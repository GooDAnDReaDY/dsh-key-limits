/* locale */
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
    } catch (_) {}
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
      } catch (_) {}
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
        } catch (_) {}
      });
    }
    if (typeof ctx.locale.watch === "function") {
      return ctx.locale.watch(function(l){ st[1](l); });
    }
  }, [ctx]);
  var active = String(st[0] || "").toLowerCase();
  return active.indexOf("zh") === 0 ? "zh" : (active.indexOf("ru") === 0 ? "ru" : "en");
}
