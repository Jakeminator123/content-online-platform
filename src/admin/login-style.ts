export const loginCss = String.raw`
.brand-logo{overflow:hidden;background:#1fb7d6;border-color:#ffffff38}
.brand-logo img{display:block;width:100%;height:100%;object-fit:cover}
.sidebar .portal-brand{gap:13px;margin:-7px 0 2px;padding:7px 8px 22px;border-bottom:1px solid #ffffff16}
.sidebar .portal-brand .brand-logo{width:62px;height:62px;flex:0 0 62px;border-radius:16px;border-color:#c8f7ff38;box-shadow:0 13px 32px #071a2766;transition:transform .28s ease,box-shadow .28s ease}
.sidebar .portal-brand-copy{min-width:0}
.sidebar .portal-brand-copy strong{display:block;color:#fff;font-family:Manrope,Arial,sans-serif;font-size:16px;line-height:1.22;letter-spacing:-.35px}
.sidebar .portal-brand-copy small{margin-top:7px;color:#8fc8cf;font-size:9px;line-height:1.45;letter-spacing:1.55px}
.sidebar .portal-brand:hover .brand-logo,.sidebar .portal-brand:focus-visible .brand-logo{transform:translateY(-2px);box-shadow:0 17px 38px #071a2780,0 0 0 1px #7de7f03d}
.sidebar .portal-brand+.nav-label{margin-top:25px}

body[data-mode=login],body[data-mode=register]{background:#061c2b;color:#152d3d}
.auth-shell{min-height:100dvh;display:grid;grid-template-columns:minmax(0,1.08fr) minmax(430px,.92fr);background:#f4f8fa}
.auth-showcase{position:relative;isolation:isolate;overflow:hidden;display:grid;place-items:center;min-height:100dvh;background:#06293d;color:#fff}
.auth-showcase:before{content:'';position:absolute;z-index:-1;inset:0;background:linear-gradient(140deg,#041b2be8 8%,#0a4053ba 48%,#16a9c6a6 100%),radial-gradient(circle at 78% 18%,#43d9ed55,transparent 37%)}
.auth-showcase:after{content:'';position:absolute;inset:24px;border:1px solid #b8f4ff2e;border-radius:28px;pointer-events:none}
.auth-showcase-video{position:absolute;z-index:-2;inset:-4%;width:108%;height:108%;object-fit:cover;opacity:.42;filter:saturate(.58) contrast(1.04) brightness(.72);animation:auth-video-drift 20s ease-in-out infinite alternate}
.auth-showcase-inner{--dock-space:clamp(38px,5vw,72px);width:min(72%,420px);display:flex;flex-direction:column;align-items:flex-start;position:absolute;z-index:1;top:50%;left:50%;transform:translate(-50%,-50%);animation:brand-dock 1.05s 1s cubic-bezier(.2,.78,.2,1) forwards}
.auth-logo-stage{display:block;width:min(100%,390px);aspect-ratio:1;position:relative;border-radius:32px;overflow:hidden;box-shadow:0 34px 90px #020d1680,0 0 0 1px #d8f9ff38;transition:transform .5s cubic-bezier(.2,.75,.2,1),box-shadow .5s ease}
.auth-logo-stage:hover,.auth-logo-stage:focus-visible{transform:translateY(-5px) rotate(-.25deg);box-shadow:0 44px 110px #020d1699,0 0 0 1px #d8f9ff70}
.auth-logo-reveal{display:block;width:100%;height:100%;position:relative;overflow:hidden}
.auth-logo-image{display:block;width:100%;height:100%;object-fit:cover;animation:logo-draw-in 1.25s cubic-bezier(.16,.82,.25,1) both}
.auth-orbit-cover{position:absolute;z-index:2;left:79.4%;top:18.3%;width:5.1%;aspect-ratio:1;border-radius:50%;background:#27b8d3;opacity:0;transition:opacity .08s;pointer-events:none}
.auth-orbit{position:absolute;z-index:3;inset:15% 8% 16% 8%;transform:rotate(-34deg);pointer-events:none}
.auth-orbit-dot{position:absolute;display:block;width:clamp(8px,3.2%,14px);aspect-ratio:1;border-radius:50%;background:#fff;box-shadow:0 0 0 4px #ffffff2e,0 0 18px #dffbff;opacity:0;offset-path:ellipse(50% 50% at 50% 50%);offset-distance:0;transform:rotate(34deg)}
.auth-logo-stage:hover .auth-orbit-cover,.auth-logo-stage:focus-visible .auth-orbit-cover{opacity:1}
.auth-logo-stage:hover .auth-orbit-dot,.auth-logo-stage:focus-visible .auth-orbit-dot{animation:orbit-dot-lap 1.25s cubic-bezier(.22,.72,.2,1) both}
.auth-tagline{margin:24px 0 0;font-family:Manrope,Arial,sans-serif;font-size:12px;line-height:1;letter-spacing:.32em;font-weight:700;color:#dffbff}
.auth-main{min-width:0;min-height:100dvh;padding:30px clamp(28px,5vw,76px);display:grid;grid-template-rows:auto 1fr auto;background:linear-gradient(145deg,#fbfdfe,#f0f6f8);position:relative}
.auth-main:before{content:'';position:absolute;right:0;top:0;width:48%;height:32%;background:radial-gradient(circle at 100% 0,#26bdd51a,transparent 67%);pointer-events:none}
.auth-main-header{display:flex;align-items:center;justify-content:space-between;gap:18px;position:relative;z-index:1}
.auth-main-header .pill{background:#e5f7fa;color:#087d92;letter-spacing:.08em}
.auth-main .auth-card{align-self:center;width:min(100%,500px);max-width:none;margin:34px auto;background:#ffffffed;border:1px solid #dce8ed;border-radius:24px;padding:clamp(30px,4vw,48px);box-shadow:0 24px 70px #0c354617;backdrop-filter:blur(16px)}
.auth-main .auth-card h1{font-size:clamp(32px,4vw,44px);line-height:1.08;letter-spacing:-1.7px;margin:12px 0 18px}
.auth-main .auth-card .lead{font-size:15px;line-height:1.7;margin-bottom:24px;color:#5c7180}
.auth-main .auth-card .eyebrow{color:#087f99}
.auth-main .auth-card #message{min-height:21px;margin-bottom:10px}
.auth-main .auth-card #auth-widget{min-height:170px}
.auth-main .quiet-row{justify-content:flex-start;padding-top:2px;border-top:1px solid #e5ecef}
.auth-main .quiet-row a{font-weight:600;color:#176c7f}
.auth-footer{align-self:end;text-align:center;font-size:11px;line-height:1.6;color:#758b96;margin:0}

@keyframes logo-draw-in{0%{clip-path:inset(0 100% 0 0);filter:saturate(.65) brightness(1.2) blur(3px);transform:scale(1.025)}65%{filter:saturate(.85) brightness(1.08) blur(0)}100%{clip-path:inset(0 0 0 0);filter:none;transform:scale(1)}}
@keyframes auth-video-drift{from{transform:scale(1.02) translate3d(-.4%,0,0)}to{transform:scale(1.08) translate3d(.8%,-.7%,0)}}
@keyframes brand-dock{to{top:var(--dock-space);left:var(--dock-space);width:clamp(180px,18vw,230px);transform:translate(0,0)}}
@keyframes orbit-dot-lap{0%{offset-distance:0;opacity:0;transform:scale(.7) rotate(34deg)}9%,88%{opacity:1}100%{offset-distance:100%;opacity:0;transform:scale(1) rotate(34deg)}}

@media(max-width:940px){.auth-shell{grid-template-columns:1fr}.auth-showcase{min-height:clamp(260px,42vh,430px);padding:60px 26px}.auth-showcase:after{inset:14px;border-radius:22px}.auth-showcase-inner{--dock-space:32px;width:min(62%,290px);align-items:flex-start}.auth-logo-stage{width:min(100%,250px);border-radius:23px}.auth-tagline{margin-top:17px;font-size:10px}.auth-main{min-height:auto;padding:25px clamp(20px,7vw,64px) 30px}.auth-main .auth-card{margin:38px auto}.auth-footer{margin-top:8px}@keyframes brand-dock{to{top:var(--dock-space);left:var(--dock-space);width:clamp(145px,34vw,185px);transform:translate(0,0)}}}
@media(max-width:520px){.auth-showcase{min-height:225px;padding:42px 24px}.auth-showcase-inner{--dock-space:27px;width:170px}.auth-logo-stage{border-radius:18px}.auth-tagline{font-size:9px;letter-spacing:.24em;white-space:nowrap}.auth-main{padding:22px 18px 26px}.auth-main-header{align-items:flex-start}.auth-main .auth-card{margin:28px auto;padding:28px 23px;border-radius:20px}.auth-main .auth-card h1{font-size:32px}.auth-main .auth-card .lead{font-size:14px}.auth-main .quiet-row{flex-direction:column;align-items:flex-start;gap:10px}}
@media(prefers-reduced-motion:reduce){.auth-showcase-video{display:none}.auth-showcase-inner{animation:none;top:var(--dock-space);left:var(--dock-space);width:clamp(180px,18vw,230px);transform:none}.auth-logo-image{clip-path:none;filter:none}.auth-orbit-dot{display:none}.auth-logo-stage:hover,.auth-logo-stage:focus-visible{transform:none}}
`;
