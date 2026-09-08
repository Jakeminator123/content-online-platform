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
`;
