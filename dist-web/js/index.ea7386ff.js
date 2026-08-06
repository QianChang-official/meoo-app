import{k as M,E as z,m as G,n as W,o as g,p as A,t as b,q as u,V as d,T as U,u as B,v as P,w as k,x as F,y as $,z as q,A as Y,B as K,C as Z,D as J,R as D,_,a as v,F as w}from"./vendors.51378eaf.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))n(a);new MutationObserver(a=>{for(const r of a)if(r.type==="childList")for(const i of r.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&n(i)}).observe(document,{childList:!0,subtree:!0});function t(a){const r={};return a.integrity&&(r.integrity=a.integrity),a.referrerPolicy&&(r.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?r.credentials="include":a.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(a){if(a.ep)return;a.ep=!0;const r=t(a);fetch(a.href,r)}})();var Q=`
/* H5 端隐藏 TabBar 空图标（只隐藏没有 src 的图标） */
.weui-tabbar__icon:not([src]),
.weui-tabbar__icon[src=''] {
  display: none !important;
}

.weui-tabbar__item:has(.weui-tabbar__icon:not([src])) .weui-tabbar__label,
.weui-tabbar__item:has(.weui-tabbar__icon[src='']) .weui-tabbar__label {
  margin-top: 0 !important;
}

/* Vite 错误覆盖层无法选择文本的问题 */
vite-error-overlay {
  /* stylelint-disable-next-line property-no-vendor-prefix */
  -webkit-user-select: text !important;
}

vite-error-overlay::part(window) {
  max-width: 90vw;
  padding: 10px;
}

.taro_page {
  overflow: auto;
}

::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* H5 顶部 navbar / 底部 tabbar 高度变量（无对应栏时为 0） */
body { --navbar-h: 0px; --tabbar-h: 0px; }
body.h5-navbar-visible { --navbar-h: 44px; }
body:not(.no-tabbar) { --tabbar-h: calc(50px + env(safe-area-inset-bottom)); }

/* 模拟真机效果 */
.taro_page {
  box-sizing: border-box;
  border-top: var(--navbar-h) solid transparent;
  border-bottom: var(--tabbar-h) solid transparent;
  transform: translateZ(0);
}

/* min-h-screen / h-screen 这类用 100vh 的内层容器：把锚点从视口换成"可见内容区"，避免被 navbar / tabbar 盖住 */
.taro_page .min-h-screen {
  min-height: calc(100vh - var(--navbar-h) - var(--tabbar-h));
}
.taro_page .h-screen {
  height: calc(100vh - var(--navbar-h) - var(--tabbar-h));
}

/*
 * H5 端 rem 适配：与小程序 rpx 缩放一致
 * 375px 屏幕：1rem = 16px，小程序 32rpx = 16px
 */
html {
    font-size: 4vw !important;
}

/* H5 端组件默认样式修复 */
taro-view-core {
    display: block;
}

taro-text-core {
    display: inline;
}

taro-input-core {
    display: block;
    width: 100%;
}

taro-input-core.taro-otp-hidden-input input {
    color: transparent;
    caret-color: transparent;
    -webkit-text-fill-color: transparent;
}

/* Textarea 关闭浏览器自带 resize 把手（移动端无意义） */
taro-textarea-core > textarea,
.taro-textarea,
textarea.taro-textarea {
    resize: none !important;
}
`;function X(){var o=document.createElement("style");o.innerHTML=Q,document.head.appendChild(o)}function ee(){var o=function(){var n=!!document.querySelector(".taro-tabbar__container");document.body.classList.toggle("no-tabbar",!n)};o();var e=new MutationObserver(o);e.observe(document.body,{childList:!0,subtree:!0})}function te(){X(),ee()}function ne(){var o=M();if(o===z.WEAPP)try{var e=G(),t=e.miniProgram.envVersion;console.log("[Debug] envVersion:",t),t!=="release"&&W({enableDebug:!0})}catch(n){console.error("[Debug] 开启调试模式失败:",n)}}var ae={title:"",bgColor:"#ffffff",textStyle:"black",navStyle:"default",transparent:"none",leftIcon:"none"},re=function(){var e,t=B();return(t==null||(e=t.config)===null||e===void 0?void 0:e.window)||{}},oe=function(){var e,t,n=(e=B())===null||e===void 0||(e=e.config)===null||e===void 0?void 0:e.tabBar;return new Set((n==null||(t=n.list)===null||t===void 0?void 0:t.map(function(a){return a.pagePath}))||[])},S=function(){var e,t=B();return(t==null||(e=t.config)===null||e===void 0||(e=e.pages)===null||e===void 0?void 0:e[0])||"pages/index/index"},h=function(e){return e.replace(/^\//,"")},ie=function(e,t,n,a){if(!e)return"none";var r=h(e),i=h(a),x=r===i,y=t.has(r)||t.has("/".concat(r)),c=n>1;return y||x?"none":c?"back":"home"},ue=function(){var e=g.useState(ae),t=A(e,2),n=t[0],a=t[1],r=g.useState(0),i=A(r,2),x=i[0],y=i[1],c=g.useCallback(function(){var s=b.getCurrentPages();if(s.length!==0){var l=s[s.length-1],T=(l==null?void 0:l.route)||"";if(T){var f=(l==null?void 0:l.config)||{},p=re(),N=oe(),R=S(),I=h(T),V=h(R);a({title:document.title||f.navigationBarTitleText||p.navigationBarTitleText||"",bgColor:f.navigationBarBackgroundColor||p.navigationBarBackgroundColor||"#ffffff",textStyle:f.navigationBarTextStyle||p.navigationBarTextStyle||"black",navStyle:f.navigationStyle||p.navigationStyle||"default",transparent:f.transparentTitle||p.transparentTitle||"none",leftIcon:ie(I,N,s.length,V)})}}},[]);b.useDidShow(function(){c()}),b.usePageScroll(function(s){var l=s.scrollTop;n.transparent==="auto"&&y(Math.min(l/100,1))}),g.useEffect(function(){var s=null,l=new MutationObserver(function(){s&&clearTimeout(s),s=setTimeout(function(){c()},50)});return l.observe(document.head,{subtree:!0,childList:!0,characterData:!0}),c(),function(){l.disconnect(),s&&clearTimeout(s)}},[c]);var E=n.navStyle!=="custom";if(g.useEffect(function(){E?document.body.classList.add("h5-navbar-visible"):document.body.classList.remove("h5-navbar-visible")},[E]),!E)return u.jsx(u.Fragment,{});var C=n.textStyle==="white"?"#fff":"#333",j=n.textStyle==="white"?"text-white":"text-gray-800",H=function(){return n.transparent==="always"?{backgroundColor:"transparent"}:n.transparent==="auto"?{backgroundColor:n.bgColor,opacity:x}:{backgroundColor:n.bgColor}},L=function(){return b.navigateBack()},O=function(){var l=S();b.reLaunch({url:"/".concat(l)})};return u.jsxs(u.Fragment,{children:[u.jsxs(d,{className:"fixed top-0 left-0 right-0 h-11 flex items-center justify-center z-1000",style:H(),children:[n.leftIcon==="back"&&u.jsx(d,{className:"absolute left-2 top-1/2 -translate-y-1/2 p-1 flex items-center justify-center",onClick:L,children:u.jsx(d,{className:"i-lucide-chevron-left w-6 h-6",style:{color:C}})}),n.leftIcon==="home"&&u.jsx(d,{className:"absolute left-2 top-1/2 -translate-y-1/2 p-1 flex items-center justify-center",onClick:O,children:u.jsx(d,{className:"i-lucide-house w-6 h-6",style:{color:C}})}),u.jsx(U,{className:"text-base font-medium max-w-3/5 truncate ".concat(j),children:n.title})]}),u.jsx(d,{className:"h-11 shrink-0"})]})},se=function(e){var t=e.children;return u.jsxs(u.Fragment,{children:[u.jsx(ue,{}),t]})},le=function(e){var t=e.children;return b.useLaunch(function(){ne(),te()}),u.jsx(se,{children:t})},ce=function(e){var t=e.children;return u.jsx(le,{children:t})},m=P.__taroAppConfig={router:{mode:"hash"},pages:["pages/index/index","pages/login/index","pages/memory-edit/index"],window:{backgroundTextStyle:"light",navigationBarBackgroundColor:"#fff",navigationBarTitleText:"记忆笔记",navigationBarTextStyle:"black"}};m.routes=[Object.assign({path:"pages/index/index",load:function(){var o=_(v().m(function t(n,a){var r;return v().w(function(i){for(;;)switch(i.n){case 0:return i.n=1,w(()=>import("./index.9cc7ded3.js"),["./index.9cc7ded3.js","./vendors.51378eaf.js","..\\css\\vendors.8886af03.css","./common.e9f733b6.js"],import.meta.url);case 1:return r=i.v,i.a(2,[r,n,a])}},t)}));function e(t,n){return o.apply(this,arguments)}return e}()},{navigationBarTitleText:"首页"}),Object.assign({path:"pages/login/index",load:function(){var o=_(v().m(function t(n,a){var r;return v().w(function(i){for(;;)switch(i.n){case 0:return i.n=1,w(()=>import("./index.8ae59f1b.js"),["./index.8ae59f1b.js","./vendors.51378eaf.js","..\\css\\vendors.8886af03.css","./common.e9f733b6.js"],import.meta.url);case 1:return r=i.v,i.a(2,[r,n,a])}},t)}));function e(t,n){return o.apply(this,arguments)}return e}()},{navigationBarTitleText:"登录"}),Object.assign({path:"pages/memory-edit/index",load:function(){var o=_(v().m(function t(n,a){var r;return v().w(function(i){for(;;)switch(i.n){case 0:return i.n=1,w(()=>import("./index.ec61f6be.js"),["./index.ec61f6be.js","./vendors.51378eaf.js","..\\css\\vendors.8886af03.css","./common.e9f733b6.js"],import.meta.url);case 1:return r=i.v,i.a(2,[r,n,a])}},t)}));function e(t,n){return o.apply(this,arguments)}return e}()},{navigationBarTitleText:"新建记忆",navigationBarBackgroundColor:"#fff",navigationBarTextStyle:"black"})];Object.assign(k,{findDOMNode:F.findDOMNode,render:F.render,unstable_batchedUpdates:F.unstable_batchedUpdates});$();var de=q(ce,D,k,m),ve=Y({window:P});K(m);Z(ve,de,m,D);J({designWidth:750,deviceRatio:{375:2,640:1.17,750:1,828:.905},baseFontSize:20,unitPrecision:void 0,targetUnit:void 0});
