/* modals */
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
                      jsx("span", { className: "kl-countBadge", children: subs.length ? subs.length + " активных" : "0" })
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
                      jsx("div", { className: "kl-statLabel", children: klT("totalAccounts") || "Всего аккаунтов" }),
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
                      jsx("div", { className: "kl-statLabel", children: "Мин. остаток" }),
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
                      jsx("div", { className: "kl-statLabel", children: "Баланс ($)" }),
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
                        children: "Все (" + subs.length + ")"
                      }),
                      jsx("button", {
                        type: "button",
                        className: "kl-tabBtn " + (state.tab === "quota" ? "active" : ""),
                        onClick: function(){ setSt(function(s){ return Object.assign({}, s, { tab: "quota" }); }); },
                        children: "Квоты (" + quotaCount + ")"
                      }),
                      jsx("button", {
                        type: "button",
                        className: "kl-tabBtn " + (state.tab === "balance" ? "active" : ""),
                        onClick: function(){ setSt(function(s){ return Object.assign({}, s, { tab: "balance" }); }); },
                        children: "Балансы (" + balCount + ")"
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
                  jsx("div", { className: "kl-emptyText", children: "Добавьте ключи и токены провайдеров в настройках плагина, чтобы отслеживать актуальные квоты и балансы." })
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
