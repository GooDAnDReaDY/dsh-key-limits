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
  pickDash:"— choose —"
};
var KL_ru={
  storageDir:"Каталог данных",refreshHours:"Часы обновления",floatChip:"Float chip",composerBar:"Полоса composer",saved:"Сохранено",

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
