export const assistantCss = String.raw`
[hidden]{display:none!important}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.assistant-launcher{position:fixed;right:20px;bottom:20px;z-index:60;display:grid;place-items:center;width:48px;height:48px;padding:0;border:1px solid #ffffff2b;border-radius:14px;background:#12384b;color:#fff;box-shadow:0 12px 30px #0a253747;transition:transform .16s ease,box-shadow .16s ease,opacity .16s ease}
.assistant-launcher:hover{transform:translateY(-2px);box-shadow:0 16px 34px #0a253752}
.assistant-launcher[aria-expanded=true]{opacity:0;pointer-events:none}
.assistant-launcher-mark,.assistant-avatar{display:grid;place-items:center;background:#35bfd2;color:#082c3e;font-weight:850;letter-spacing:-.03em}
.assistant-launcher-mark{width:34px;height:34px;border-radius:10px;font-size:11px}
.assistant-panel{position:fixed;right:20px;bottom:20px;z-index:70;width:min(380px,calc(100vw - 24px));height:min(560px,calc(100vh - 40px));overflow:hidden;border:1px solid #d8e2e8;border-radius:17px;background:#f8fafb;color:#193344;box-shadow:0 24px 72px #0a253743,0 4px 14px #0a25371c}
.assistant-topbar{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:13px 14px;background:#12384b;color:#fff}
.assistant-avatar{width:34px;height:34px;border-radius:10px;font-size:10px}
.assistant-topbar h2{margin:0;font:700 16px/1.2 Manrope,Arial,sans-serif;letter-spacing:-.02em}
.assistant-topbar p{margin:3px 0 0;color:#b9ccd5;font-size:11px;line-height:1.25}
.assistant-close{display:grid;place-items:center;width:30px;height:30px;padding:0;border:0;border-radius:9px;background:#ffffff12;color:#fff;font-size:21px;line-height:1}
.assistant-locked{display:grid;place-items:center;height:calc(100% - 60px);padding:24px;text-align:center}
.assistant-state{margin:0;color:#59717e;font-size:13px}
.assistant-app{height:calc(100% - 60px);display:flex;flex-direction:column;gap:9px;padding:13px}
.assistant-messages{flex:1;min-height:120px;overflow:auto;padding:1px;scrollbar-width:thin}
.assistant-message{display:flex;margin:7px 0}
.assistant-message>div{max-width:88%;padding:10px 12px;border-radius:13px;background:#fff;border:1px solid #dfe7eb;color:#263f4d;font-size:14px;line-height:1.5;white-space:pre-wrap}
.assistant-message.user{justify-content:flex-end}
.assistant-message.user>div{border-color:#174b63;background:#174b63;color:#fff}
.assistant-sources{display:flex;gap:5px;flex-wrap:wrap;margin:5px 0 2px 2px}
.assistant-sources span{padding:3px 6px;border-radius:5px;background:#eaf0f3;color:#5b7180;font-size:10px}
.assistant-answer-mode{display:block;margin-bottom:6px;color:#315f73;font-size:11px;line-height:1.35}
.assistant-prompts{display:flex;gap:6px;overflow:auto;padding:1px 0}
.assistant-prompts button{flex:0 0 auto;padding:6px 9px;border:1px solid #d6e2e7;border-radius:999px;background:#eef3f5;color:#31586a;font-size:11px}
.assistant-form{display:grid;grid-template-columns:1fr auto;align-items:end;gap:7px;padding:6px;border:1px solid #cbd9df;border-radius:12px;background:#fff;box-shadow:0 5px 16px #12384b0d}
.assistant-form textarea{min-width:0;max-height:100px;resize:none;padding:7px 6px;border:0;outline:0;background:transparent;color:#19394a;font:inherit;font-size:16px;line-height:1.4}
.assistant-form button{display:grid;place-items:center;width:36px;height:36px;padding:0;border:0;border-radius:9px;background:#126b6a;color:#fff;font-size:19px}
.assistant-form button:disabled{cursor:wait;opacity:.55}
.assistant-footnote{margin:0;color:#637783;text-align:center;font-size:10px;line-height:1.4}
.assistant-panel button:focus-visible,.assistant-panel textarea:focus-visible,.assistant-launcher:focus-visible{outline:3px solid #56cabb;outline-offset:3px}
@media(max-width:520px){.assistant-launcher{right:12px;bottom:12px}.assistant-panel{right:8px;bottom:8px;width:calc(100vw - 16px);height:calc(100dvh - 16px);border-radius:14px}}
@media(prefers-reduced-motion:reduce){.assistant-launcher{transition:none}}
`;
