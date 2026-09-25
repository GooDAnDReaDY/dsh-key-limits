/* apply */
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
