/* format */
function sid(props){return props&&(props.sessionId||(props.session&&props.session.id)||(props.ctx&&props.ctx.session&&props.ctx.session.id))||""}
function sessionIdFromCtx(){try{if(klCtx&&klCtx.sessions&&klCtx.sessions.active){var a=klCtx.sessions.active;return a.id||a||""}}catch(e){}return""}
function fmtPct(n){var x=Number(n);return Number.isFinite(x)?Math.round(x)+"%":"—"}
function fmtReset(resetsAt){if(!resetsAt)return"";var t=Date.parse(resetsAt);if(!Number.isFinite(t))return"";var ms=t-Date.now();if(ms<=0)return klT("refresh");var h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000);return (h?h+"h ":"")+m+"m"}
function minRemaining(wins){if(!wins||!wins.length)return null;var m=null;for(var i=0;i<wins.length;i++){var r=Number(wins[i].remainingPercent);if(!Number.isFinite(r))continue;if(m===null||r<m)m=r}return m}
function pctClass(rem){if(rem==null)return"kl-muted";if(rem<=DANGER)return"kl-danger";if(rem<=WARN)return"kl-warn";return"kl-ok"}
function barClass(rem){var b="kl-bar";if(rem<=DANGER)b+=" kl-barDanger";else if(rem<=WARN)b+=" kl-barWarn";return b}
function readPos(){try{var r=JSON.parse(localStorage.getItem(POS_KEY)||"null");if(r&&typeof r.x==="number"&&typeof r.y==="number")return r}catch(e){}return null}
function savePos(x,y){try{localStorage.setItem(POS_KEY,JSON.stringify({x:x,y:y}))}catch(e){}}
function PortalModal(props){return createPortal(props.children,document.body)}
function providerLabel(p){return p||"?"}
