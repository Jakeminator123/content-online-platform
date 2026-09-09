import { workspaceCss as foundationCss } from './workspace-foundation-style.js';
import { loginCss } from './login-style.js';
import { statisticsCss } from './statistics-style.js';

export const workspaceCss = foundationCss + '\n' + statisticsCss + '\n' + loginCss + String.raw`
.registry-form{display:flex;flex-wrap:wrap;align-items:end;gap:14px;padding:20px 0;border-bottom:1px solid #dde5eb;margin-bottom:16px}
.registry-form label{display:block;font-size:14px;font-weight:600}
.registry-input{display:block;width:100%;padding:11px;border:1px solid #c8d5df;border-radius:7px;background:#fff;color:#172f3e;margin-top:6px}
.registry-form fieldset{border:1px solid #d5e1e8;border-radius:8px;padding:14px}
.registry-check{padding:5px}.registry-check input{margin-right:8px}
.registry-actions{display:flex;flex-wrap:wrap;gap:8px}
#registry-panel{margin-bottom:28px}#registry-panel .list-item{flex-wrap:wrap}#registry-panel .body{min-width:220px}
#registry-status{color:#125e51;font-weight:600}
.registry-overview{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:18px 0}.registry-overview div{padding:16px;border:1px solid #dbe5ea;border-radius:9px;background:#f8fafb}.registry-overview strong,.registry-overview span{display:block}.registry-overview strong{font-size:24px;color:#183746}.registry-overview span{margin-top:4px;font-size:11px;color:#6b808c}
.registry-customer{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:center;padding:17px 0;border-bottom:1px solid #e3e9ed}.registry-customer-main{display:flex;align-items:flex-start;gap:13px;min-width:0}.registry-customer .body{display:grid;gap:4px;min-width:0}.registry-customer .body small{overflow-wrap:anywhere}.registry-swatch{display:flex;width:46px;height:46px;flex:none;overflow:hidden;border:1px solid #d5e1e7;border-radius:10px}.registry-swatch i{width:50%;height:100%}
.registry-editor-card{margin-top:22px;padding:22px;border:1px solid #bcd1d8;border-radius:12px;background:#f7fafb;box-shadow:0 12px 35px #17384a0c}.registry-editor-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding-bottom:16px;border-bottom:1px solid #dce6ea}.registry-editor-head h3{margin:4px 0;font-size:22px}.registry-editor-head p{margin:0;color:#667d89}.registry-editor-card>.soft-box{display:grid;gap:3px;margin-top:16px}.registry-editor-card>.soft-box a{font-weight:600;overflow-wrap:anywhere}.registry-editor-card>.soft-box small{display:block}.registry-editor-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:start}.registry-editor-form h4,.registry-editor-form fieldset,.registry-editor-form>button,.registry-editor-form>.registry-color-row,.registry-editor-form>.registry-agent,.registry-editor-form>details{grid-column:1/-1}.registry-editor-form h4{margin:0;font-size:15px}.registry-editor-form details{border:1px solid #d5e1e8;border-radius:8px;background:#fff;padding:13px 14px}.registry-editor-form summary{cursor:pointer;color:#315e5a;font-size:12px;font-weight:700}.registry-editor-form details[open] summary{margin-bottom:14px}.registry-hint{display:block;margin-top:5px;color:#70848f;font-size:10px;font-weight:400;line-height:1.45}.registry-color-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.registry-color{height:44px;padding:5px}.registry-agent{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;background:#fff}.registry-agent legend{font-weight:700}.registry-agent>.registry-switch,.registry-agent>.registry-tools,.registry-agent>.registry-domain-note,.registry-agent>.registry-hint,.registry-agent>details{grid-column:1/-1}.registry-switch{display:flex!important;align-items:center;gap:9px}.registry-switch input{width:18px;height:18px}.registry-range{padding:3px 0;border:0}.registry-tools{display:grid;gap:4px;padding-top:6px}.registry-domain-note{margin:0;padding:12px;border-radius:8px;background:#edf5f4;color:#315e5a;font-size:11px}.registry-create{background:#fbfcfd;padding-left:14px;padding-right:14px;border-radius:10px}
@media(max-width:850px){.registry-overview{grid-template-columns:repeat(2,minmax(0,1fr))}.registry-customer{grid-template-columns:1fr}.registry-editor-form,.registry-agent{grid-template-columns:1fr}.registry-editor-form h4,.registry-editor-form fieldset,.registry-editor-form>button,.registry-editor-form>.registry-color-row,.registry-editor-form>.registry-agent,.registry-agent>.registry-switch,.registry-agent>.registry-tools,.registry-agent>.registry-domain-note,.registry-agent>.registry-hint{grid-column:1}.registry-color-row{grid-template-columns:1fr 1fr}}
@media(max-width:520px){.registry-overview,.registry-color-row{grid-template-columns:1fr}.registry-actions .button,.registry-actions a{width:100%;justify-content:center}}
.salesforce-hero{display:flex;align-items:center;justify-content:space-between;gap:28px;padding:25px 27px;margin-bottom:20px;border:1px solid #cfe4f3;border-radius:12px;background:linear-gradient(118deg,#f4fbff 0%,#eaf6fd 58%,#f8fbfd 100%)}
.salesforce-brand{display:flex;align-items:center;gap:17px;min-width:0}.salesforce-brand>div{min-width:0}.salesforce-brand h2{font-size:22px;margin:5px 0 6px}.salesforce-brand p{font-size:13px;color:#526f82;margin:0;max-width:520px}
.salesforce-mark{width:54px;height:54px;flex:none;display:grid;place-items:center;border-radius:15px;background:#0b72b9;color:#fff;box-shadow:0 10px 24px #0b72b929}.salesforce-mark svg{width:27px;height:27px}
.salesforce-actions{display:flex;align-items:center;align-self:flex-start;gap:13px;flex:none}.button.salesforce-button{background:#0b72b9;color:#fff}.button.salesforce-button:hover{background:#075d98}
.salesforce-primary{margin-top:13px}
.salesforce-import{padding:20px;border:1px solid #d7e7ef;border-radius:11px;background:#fbfdfe}.salesforce-import .card-head{padding:0 0 12px}.salesforce-import .registry-form{margin:0 0 8px;padding:10px 0}.salesforce-results{display:grid;gap:8px}.salesforce-results .list-item{background:#fff;border:1px solid #e1eaef;border-radius:8px;padding:13px 14px}
.salesforce-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:20px}.sf-metric{padding:18px 19px;border:1px solid var(--line);border-radius:10px;background:#fff}.sf-metric>span{display:block;font-size:11px;color:#718494}.sf-metric>strong{display:block;font-family:Manrope,Arial,sans-serif;font-size:25px;color:#17394f;margin:9px 0 5px}.sf-metric>small{display:block;color:#81909b;font-size:10px;line-height:1.5}
.review-card{background:#fbfdff}.review-steps{list-style:none;padding:0;margin:0}.review-steps li{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #edf0f3}.review-steps li:last-child{border:0}.review-steps li>span{width:27px;height:27px;flex:none;display:grid;place-items:center;border-radius:50%;background:#e7f3fb;color:#0b72b9;font-weight:700;font-size:11px}.review-steps strong,.review-steps small{display:block}.review-steps strong{font-size:12px}.review-steps small{font-size:11px;color:#778995;margin-top:4px;line-height:1.5}
.salesforce-inline{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:16px 17px;border:1px solid #d8eaf5;border-radius:9px;background:#f4faff}.salesforce-inline strong,.salesforce-inline small{display:block}.salesforce-inline strong{font-size:12px}.salesforce-inline small{font-size:10px;color:#708897;margin-top:4px}
.salesforce-review-status{display:flex;align-items:center;gap:10px;margin:19px 0}.salesforce-review-status>span:last-child{font-size:12px;color:#617684}
.review-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:14px}.review-summary>div{padding:16px;border:1px solid #e2e9ee;border-radius:8px;background:#fafcfd}.review-summary span,.review-summary small{display:block;color:#7a8b96;font-size:10px}.review-summary strong{display:block;font-family:Manrope,Arial,sans-serif;font-size:20px;color:#18384d;margin:7px 0}
.setup-flow{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.setup-flow>div{position:relative;padding:17px 16px 17px 53px;border:1px solid #e0e8ed;border-radius:9px;background:#fafcfd}.setup-flow span{position:absolute;left:16px;top:16px;width:25px;height:25px;display:grid;place-items:center;border-radius:50%;background:#e6f2fa;color:#0b72b9;font-size:11px;font-weight:700}.setup-flow strong,.setup-flow small{display:block}.setup-flow strong{font-size:12px}.setup-flow small{font-size:11px;color:#748793;line-height:1.5;margin-top:4px}
table code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11px;color:#315f7c;background:#edf5fa;padding:4px 6px;border-radius:4px}
@media(max-width:1050px){.salesforce-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.salesforce-hero{align-items:flex-start}.salesforce-actions{flex-direction:column;align-items:flex-start}}
@media(max-width:650px){.salesforce-hero{flex-direction:column}.salesforce-brand{align-items:flex-start}.salesforce-actions{width:100%}.salesforce-actions .button{width:100%}.salesforce-metrics,.review-summary,.setup-flow{grid-template-columns:1fr}.salesforce-inline{align-items:flex-start;flex-direction:column}}

/* Restrained admin hierarchy: literal headings, grouped navigation and local data labels. */
.sidebar{padding-top:25px}
.nav{gap:4px}
.nav-section{display:grid;gap:2px}
.nav-section.has-active>button{color:#fff}
.nav-sub{display:grid;gap:1px;margin:0 0 7px 26px;padding-left:11px;border-left:1px solid #ffffff18}
.nav .nav-sub button{min-height:30px;padding:6px 9px;border-radius:6px;color:#9fb1bc;font-size:12px;font-weight:500;gap:7px}
.nav .nav-sub button:hover{background:#ffffff08;color:#fff}
.nav .nav-sub button[aria-current=page]{background:#ffffff0d;color:#fff;box-shadow:none}
.nav .nav-sub button:disabled{cursor:not-allowed;color:#718793;opacity:1}
.nav .nav-sub button small{margin-left:auto;color:#718793;font-size:9px;font-weight:500}
.topbar{height:64px;padding-inline:32px}
.breadcrumbs{font-size:13px}
.breadcrumbs strong{font-weight:600}
.page{padding:27px 32px 46px}
.page-heading{align-items:start;margin-bottom:22px}
.page-heading h1{margin:0 0 7px;font-size:clamp(27px,2.4vw,34px);line-height:1.2;letter-spacing:-.035em;font-weight:750}
.lead{font-size:14px;line-height:1.55}
.toolbar{justify-content:flex-start;margin-bottom:17px}
.search{max-width:400px;padding:10px 12px}
.search input{font-size:14px}
.demo-context{display:flex;align-items:center;gap:9px;margin:0 0 17px;color:#617481;font-size:12px;line-height:1.45}
.button{font-size:13px}
.card{border-color:#e1e7eb;border-radius:12px}
.card-head p{font-size:12px}
th{font-size:11px}
td{font-size:13px}
.entity strong,.list-item strong{font-size:13px}
.entity small,.list-item small{font-size:11px}
.text-link{font-size:12px}
#registry-panel{margin-bottom:22px}
#registry-panel>.card-body{padding-bottom:20px}
.registry-overview div{background:#fafbfc}
@media(max-width:800px){.topbar{height:60px;padding-inline:18px}.page{padding:22px 18px 38px}.nav-sub{margin-left:24px}.page-heading{margin-bottom:18px}}
`;
