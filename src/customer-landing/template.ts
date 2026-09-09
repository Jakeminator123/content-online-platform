export type CustomerLandingAccess = {
  configured: boolean;
  host: string | null;
  publishableKey: string;
};

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (character) => entities[character] ?? character);
}

export function renderCustomerLanding(access: CustomerLandingAccess = {
  configured: false,
  host: null,
  publishableKey: "",
}): string {
  const customerAccessConfigured = Boolean(access.configured && access.host && access.publishableKey);
  const customerAccessScripts = customerAccessConfigured
    ? `<script defer crossorigin="anonymous" src="https://${escapeHtml(access.host!)}/npm/@clerk/ui@1/dist/ui.browser.js"></script><script defer crossorigin="anonymous" data-clerk-publishable-key="${escapeHtml(access.publishableKey)}" src="https://${escapeHtml(access.host!)}/npm/@clerk/clerk-js@6/dist/clerk.browser.js"></script><script defer src="/customer-portal/assets/access.js"></script>`
    : "";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="description" content="Content Online connects institutions with journals, standards, eBooks and professional learning.">
    <meta name="robots" content="noindex,nofollow">
    <meta name="theme-color" content="#0f1e33">
    <title>Content Online · Unlock world-class research</title>
    <link rel="preload" href="/customer-landing/hero-wide.jpg" as="image" imagesrcset="/customer-landing/hero-wide-640.jpg 640w, /customer-landing/hero-wide.jpg 1024w" imagesizes="100vw" fetchpriority="high">
    <link rel="stylesheet" href="/customer-landing/assets/style.css">
    <script defer src="/customer-landing/assets/client.js"></script>
    ${customerAccessScripts}
    <script defer src="https://cdn.vercel-insights.com/v1/script.js"></script>
  </head>
  <body data-page="customer-landing">
    <a class="skip-link" href="#main-content">Skip to content</a>

    <header class="landing-header" id="landing-header">
      <a class="landing-brand" href="#top" aria-label="Content Online home">
        <span class="landing-brand-mark"><img src="/admin/assets/co-logo.png" alt="" width="96" height="96"></span>
        <span class="landing-brand-name">CONTENT <strong>online</strong></span>
      </a>

      <nav class="landing-nav" id="landing-nav" aria-label="Main navigation" data-open="false">
        <a href="#mission">Mission</a>
        <a href="#resources">Resources</a>
        <a href="#institutions">Institutions</a>
        <a href="#contact">Contact</a>
        <a class="landing-nav-login" href="/login" data-customer-login>Customer log in</a>
      </nav>

      <div class="landing-header-actions">
        <a class="landing-login" href="/login" aria-label="Customer log in" data-customer-login>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17"><path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>LOG IN</span>
        </a>
        <button class="landing-menu-button" id="landing-menu-button" type="button" aria-controls="landing-nav" aria-expanded="false">
          <span class="sr-only">Open menu</span>
          <span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>
        </button>
      </div>
    </header>

    <main id="main-content">
      <section class="landing-hero-scroll" id="top" aria-labelledby="landing-title">
        <div class="landing-hero-stage" id="landing-hero-stage">
          <div class="landing-marquee" aria-hidden="true">
            <div class="landing-marquee-line landing-marquee-line-a"><span>UNLOCK RESEARCH&nbsp; UNLOCK RESEARCH&nbsp; UNLOCK RESEARCH&nbsp;</span><span>UNLOCK RESEARCH&nbsp; UNLOCK RESEARCH&nbsp; UNLOCK RESEARCH&nbsp;</span></div>
            <div class="landing-marquee-line landing-marquee-line-b"><span>JOURNALS · STANDARDS · EBOOKS · ELEARNING ·&nbsp;</span><span>JOURNALS · STANDARDS · EBOOKS · ELEARNING ·&nbsp;</span></div>
          </div>

          <div class="landing-portrait" id="landing-portrait">
            <img class="landing-hero-image" src="/customer-landing/hero-wide.jpg" srcset="/customer-landing/hero-wide-640.jpg 640w, /customer-landing/hero-wide.jpg 1024w" sizes="100vw" alt="Researcher standing between library shelves" width="1024" height="1024" fetchpriority="high">
            <div class="landing-hero-reveal-aura" aria-hidden="true"></div>
            <canvas class="landing-hero-reveal" id="landing-hero-reveal" width="1" height="1" aria-hidden="true"></canvas>
            <div class="landing-hero-vignette" aria-hidden="true"></div>
            <h1 id="landing-title">UNLOCK WORLD-CLASS RESEARCH</h1>
            <p class="landing-scroll-cue"><span aria-hidden="true">↓</span> Scroll to explore</p>
          </div>
        </div>
      </section>

      <section class="landing-mission landing-reveal-section" id="mission" aria-labelledby="mission-title">
        <svg class="landing-book-icon" aria-hidden="true" viewBox="0 0 64 64"><path d="M32 16c-6-6-14-8-23-7v38c9-1 17 1 23 7 6-6 14-8 23-7V9c-9-1-17 1-23 7Zm0 0v38" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <h2 id="mission-title"><span>UNLOCKING</span> KNOWLEDGE,<br>CONNECTING <span>RESEARCHERS</span><br>TO THE JOURNALS,<br>STANDARDS AND EBOOKS<br>THAT <span>MOVE</span> SCIENCE,<br>INDUSTRY AND<br>EDUCATION FORWARD.</h2>
      </section>

      <section class="landing-gallery landing-reveal-section" aria-labelledby="gallery-title">
        <div class="landing-section-heading">
          <p>ACCESS WITH PURPOSE</p>
          <h2 id="gallery-title">KNOWLEDGE<br><span>IN MOTION.</span></h2>
        </div>
        <div class="landing-gallery-grid">
          <figure class="landing-gallery-card landing-gallery-card-tall"><img src="/customer-landing/lab.jpg" srcset="/customer-landing/lab-640.jpg 640w, /customer-landing/lab.jpg 1024w" sizes="(max-width: 680px) calc(100vw - 36px), 27vw" alt="Researchers working together in a laboratory" width="1024" height="1024" loading="lazy"><figcaption>Research</figcaption></figure>
          <figure class="landing-gallery-card"><img src="/customer-landing/engineer.jpg" srcset="/customer-landing/engineer-640.jpg 640w, /customer-landing/engineer.jpg 1024w" sizes="(max-width: 680px) calc(100vw - 36px), 36vw" alt="Engineer consulting technical material" width="1024" height="1024" loading="lazy"><figcaption>Standards</figcaption></figure>
          <figure class="landing-gallery-card landing-gallery-card-offset"><img src="/customer-landing/students.jpg" srcset="/customer-landing/students-640.jpg 640w, /customer-landing/students.jpg 1024w" sizes="(max-width: 680px) calc(100vw - 36px), 30vw" alt="Students collaborating at an academic institution" width="1024" height="1024" loading="lazy"><figcaption>Learning</figcaption></figure>
          <figure class="landing-gallery-card landing-gallery-card-wide"><img src="/customer-landing/corporate.jpg" srcset="/customer-landing/corporate-640.jpg 640w, /customer-landing/corporate.jpg 1024w" sizes="(max-width: 680px) calc(100vw - 36px), 66vw" alt="Professional research team in discussion" width="1024" height="1024" loading="lazy"><figcaption>Industry</figcaption></figure>
        </div>
      </section>

      <section class="landing-resources landing-reveal-section" id="resources" aria-labelledby="resources-title">
        <div class="landing-resources-heading">
          <p>WHAT WE CONNECT</p>
          <h2 id="resources-title"><span>THE</span><br>RESOURCES</h2>
          <p class="landing-resources-intro">A considered route to the specialist information your institution relies on.</p>
        </div>

        <div class="landing-resource-explorer" data-resource-explorer>
          <div class="landing-resource-visual">
            <img src="/customer-landing/platform.jpg" srcset="/customer-landing/platform-640.jpg 640w, /customer-landing/platform.jpg 1024w" sizes="(max-width: 980px) calc(100vw - 36px), 56vw" alt="Research desk with books, journals and a laptop" width="1024" height="1024" loading="lazy">
            <div class="landing-resource-hotspots" role="group" aria-label="Explore the resource types on the image">
              <button type="button" class="landing-resource-hotspot" data-resource-hotspot="journals" aria-label="Show journals" aria-pressed="true" style="--spot-x:22%;--spot-y:55%"><span aria-hidden="true"></span></button>
              <button type="button" class="landing-resource-hotspot" data-resource-hotspot="standards" aria-label="Show standards" aria-pressed="false" style="--spot-x:78%;--spot-y:60%"><span aria-hidden="true"></span></button>
              <button type="button" class="landing-resource-hotspot" data-resource-hotspot="books" aria-label="Show eBooks" aria-pressed="false" style="--spot-x:50%;--spot-y:45%"><span aria-hidden="true"></span></button>
              <button type="button" class="landing-resource-hotspot" data-resource-hotspot="learning" aria-label="Show eLearning" aria-pressed="false" style="--spot-x:62%;--spot-y:82%"><span aria-hidden="true"></span></button>
            </div>
          </div>
          <div class="landing-resource-content">
            <div class="landing-resource-tabs" role="tablist" aria-label="Resource types">
              <button type="button" role="tab" id="resource-tab-journals" aria-controls="resource-panel-journals" aria-selected="true" data-resource-tab="journals"><span>01</span>Journals</button>
              <button type="button" role="tab" id="resource-tab-standards" aria-controls="resource-panel-standards" aria-selected="false" data-resource-tab="standards" tabindex="-1"><span>02</span>Standards</button>
              <button type="button" role="tab" id="resource-tab-books" aria-controls="resource-panel-books" aria-selected="false" data-resource-tab="books" tabindex="-1"><span>03</span>eBooks</button>
              <button type="button" role="tab" id="resource-tab-learning" aria-controls="resource-panel-learning" aria-selected="false" data-resource-tab="learning" tabindex="-1"><span>04</span>eLearning</button>
            </div>
            <div class="landing-resource-panels">
              <article role="tabpanel" id="resource-panel-journals" aria-labelledby="resource-tab-journals" data-resource-panel="journals"><p class="landing-resource-number">01 / 04</p><h3>Journals</h3><p>Peer-reviewed research collections selected around the disciplines and teams that use them.</p></article>
              <article role="tabpanel" id="resource-panel-standards" aria-labelledby="resource-tab-standards" data-resource-panel="standards" hidden><p class="landing-resource-number">02 / 04</p><h3>Standards</h3><p>Trusted technical references for engineering, compliance, quality and innovation.</p></article>
              <article role="tabpanel" id="resource-panel-books" aria-labelledby="resource-tab-books" data-resource-panel="books" hidden><p class="landing-resource-number">03 / 04</p><h3>eBooks</h3><p>Digital reference works gathered alongside your institution's research subscriptions.</p></article>
              <article role="tabpanel" id="resource-panel-learning" aria-labelledby="resource-tab-learning" data-resource-panel="learning" hidden><p class="landing-resource-number">04 / 04</p><h3>eLearning</h3><p>Professional learning that helps specialists keep their knowledge current and useful.</p></article>
            </div>
          </div>
        </div>
      </section>

      <section class="landing-collections landing-reveal-section" aria-labelledby="collections-title">
        <div class="landing-collections-heading">
          <p>ONE CLEAR RELATIONSHIP</p>
          <h2 id="collections-title">COLLECTIONS<br><span>SHAPED AROUND YOU.</span></h2>
        </div>
        <div class="landing-collections-grid">
          <article><span>01</span><h3>Academic research</h3><p>Access aligned with teaching, discovery and institutional priorities.</p></article>
          <article><span>02</span><h3>Technical practice</h3><p>Standards and specialist material for work that must be precise.</p></article>
          <article><span>03</span><h3>Professional learning</h3><p>Resources that follow teams from first study to continued development.</p></article>
          <article><span>04</span><h3>Usage insight</h3><p>A customer portal that makes assigned products and reporting easier to understand.</p></article>
        </div>
      </section>

      <section class="landing-clean landing-reveal-section" aria-labelledby="clean-title">
        <div class="landing-clean-inner">
          <div class="landing-clean-copy">
            <p>ACCESS, REVEALED</p>
            <h2 id="clean-title">FROM <span>OBSCURED</span><br>TO CLEAR.</h2>
            <p>One connected route from specialist content to the people who need it.</p>
          </div>
          <figure class="landing-clean-frame" id="landing-clean-frame">
            <img class="landing-clean-image" src="/customer-landing/reveal.jpg" alt="Research book and a tablet on a study desk" width="1024" height="1024" loading="lazy">
            <canvas class="landing-clean-canvas" id="landing-clean-canvas" width="1" height="1" aria-hidden="true"></canvas>
            <span class="landing-clean-brush" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 11V8a4 4 0 0 1 8 0v3m-9 0h10v9H7zM10 11V8a2 2 0 0 1 4 0v3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
            <button class="landing-clean-toggle" type="button" aria-pressed="false">View clear</button>
            <figcaption><span class="landing-clean-pointer-hint">Move across the image to bring it into focus.</span><span class="landing-clean-static-hint">Connected research, brought into focus.</span></figcaption>
          </figure>
        </div>
      </section>

      <section class="landing-institutions landing-reveal-section" id="institutions" aria-labelledby="institutions-title">
        <div class="landing-institutions-heading">
          <p>WHO WE WORK WITH</p>
          <h2 id="institutions-title">BUILT FOR<br><span>INSTITUTIONS.</span></h2>
        </div>
        <div class="landing-card-fan" aria-label="Institution types">
          <figure><img src="/customer-landing/students.jpg" srcset="/customer-landing/students-640.jpg 640w, /customer-landing/students.jpg 1024w" sizes="(max-width: 680px) 50vw, 28vw" alt="Students collaborating" width="1024" height="1024" loading="lazy"><figcaption>Academic</figcaption></figure>
          <figure><img src="/customer-landing/lab.jpg" srcset="/customer-landing/lab-640.jpg 640w, /customer-landing/lab.jpg 1024w" sizes="(max-width: 680px) 50vw, 28vw" alt="Laboratory researchers" width="1024" height="1024" loading="lazy"><figcaption>Medical</figcaption></figure>
          <figure><img src="/customer-landing/engineer.jpg" srcset="/customer-landing/engineer-640.jpg 640w, /customer-landing/engineer.jpg 1024w" sizes="(max-width: 680px) 50vw, 28vw" alt="Engineering professional" width="1024" height="1024" loading="lazy"><figcaption>Technical</figcaption></figure>
          <figure><img src="/customer-landing/corporate.jpg" srcset="/customer-landing/corporate-640.jpg 640w, /customer-landing/corporate.jpg 1024w" sizes="(max-width: 680px) 50vw, 28vw" alt="Corporate research team" width="1024" height="1024" loading="lazy"><figcaption>Corporate</figcaption></figure>
          <figure><img src="/customer-landing/hero-wide.jpg" srcset="/customer-landing/hero-wide-640.jpg 640w, /customer-landing/hero-wide.jpg 1024w" sizes="(max-width: 680px) 50vw, 28vw" alt="Researcher in a library" width="1024" height="1024" loading="lazy"><figcaption>Public sector</figcaption></figure>
        </div>
      </section>

      <section class="landing-access landing-reveal-section" aria-labelledby="access-title">
        <p>YOUR ORGANISATION. YOUR ACCESS.</p>
        <h2 id="access-title">READY TO ENTER<br><span>YOUR CUSTOMER PORTAL?</span></h2>
        <a href="/login" data-customer-login>Customer log in <span aria-hidden="true">↗</span></a>
      </section>
    </main>

    <footer class="landing-footer" id="contact">
      <div class="landing-footer-card">
        <nav class="landing-footer-nav" aria-label="Footer navigation">
          <a href="#top">Home</a><a href="#mission">Mission</a><a href="#resources">Resources</a><a href="#institutions">Institutions</a>
        </nav>
        <div class="landing-footer-center">
          <p>UNLOCK<br><span>WORLD-CLASS</span><br>RESEARCH.</p>
          <a class="landing-footer-logo" href="#top" aria-label="Back to top"><img src="/admin/assets/co-logo.png" alt="Content Online" width="400" height="400"></a>
        </div>
        <div class="landing-footer-access">
          <a href="/login" data-customer-login>Customer log in</a>
          <a href="/admin/login">Staff administration</a>
        </div>
      </div>
      <div class="landing-footer-row"><p>© 2026 Content Online</p><p>Knowledge connected.</p></div>
    </footer>

    <dialog class="landing-auth-dialog" id="customer-login-dialog" aria-labelledby="customer-login-title">
      <div class="landing-auth-shell">
        <form method="dialog" class="landing-auth-close-form">
          <button class="landing-auth-close" type="submit" aria-label="Close customer login"><span aria-hidden="true">×</span></button>
        </form>
        <div class="landing-auth-brand" aria-hidden="true">
          <span><img src="/admin/assets/co-logo.png" alt="" width="96" height="96"></span>
          <strong>CONTENT <em>online</em></strong>
        </div>
        <section class="landing-auth-card" id="customer-access" data-customer-access-mode="login" data-customer-access-autostart="false" data-customer-access-return-url="/?login=1">
          <h2 id="customer-login-title">Customer sign in.</h2>
          <p class="landing-auth-intro">Sign in with the account connected to your organisation.</p>
          <p class="customer-access-message" id="customer-access-message" role="status">${customerAccessConfigured ? "Loading secure sign-in…" : "Customer sign-in is not configured."}</p>
          ${customerAccessConfigured ? `<div id="customer-auth-widget"></div>` : ""}
          <section class="portal-chooser" id="portal-chooser" aria-labelledby="portal-chooser-title" hidden><h3 id="portal-chooser-title">Your customer portals</h3><div class="portal-entry-list" id="portal-entry-list"></div></section>
          <div class="customer-account" id="customer-account" hidden><button class="landing-auth-secondary" id="customer-sign-out" type="button" hidden>Sign out and switch account</button></div>
        </section>
      </div>
    </dialog>
  </body>
</html>`;
}
