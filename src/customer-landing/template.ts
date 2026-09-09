export function renderCustomerLanding(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="description" content="Content Online connects institutions with journals, standards, eBooks and professional learning.">
    <meta name="robots" content="noindex,nofollow">
    <title>Content Online · Knowledge connected</title>
    <link rel="stylesheet" href="/customer-landing/assets/style.css">
    <script defer src="/customer-landing/assets/client.js"></script>
  </head>
  <body data-page="customer-landing">
    <a class="skip-link" href="#main-content">Skip to content</a>

    <header class="landing-header" id="landing-header">
      <a class="landing-brand" href="#top" aria-label="Content Online home">
        <span class="landing-brand-mark"><img src="/admin/assets/co-logo.png" alt="" width="96" height="96"></span>
        <span class="landing-brand-name">CONTENT <strong>online</strong></span>
      </a>

      <nav class="landing-nav" id="landing-nav" aria-label="Main navigation" data-open="false">
        <a href="#offer">What we offer</a>
        <a href="#institutions">For institutions</a>
        <a href="#contact">Contact</a>
        <a class="landing-nav-login" href="/login">Log in</a>
      </nav>

      <div class="landing-header-actions">
        <a class="landing-login" href="/login" data-customer-login>LOG IN <span aria-hidden="true">↗</span></a>
        <button class="landing-menu-button" id="landing-menu-button" type="button" aria-controls="landing-nav" aria-expanded="false">
          <span class="sr-only">Open menu</span>
          <span aria-hidden="true"></span><span aria-hidden="true"></span>
        </button>
      </div>
    </header>

    <main id="main-content">
      <section class="landing-hero" id="top" aria-labelledby="landing-title">
        <img class="landing-hero-image" src="/customer-landing/hero-wide.png" alt="" width="1024" height="1024" fetchpriority="high" aria-hidden="true">
        <div class="landing-hero-shade" aria-hidden="true"></div>
        <div class="landing-hero-grid" aria-hidden="true"></div>

        <div class="landing-hero-content">
          <p class="landing-kicker">KNOWLEDGE. CONNECTED.</p>
          <h1 id="landing-title">UNLOCK<br><span>WORLD-CLASS</span><br>RESEARCH</h1>
          <div class="landing-hero-foot">
            <p>One considered route to the journals, standards, eBooks and learning your institution relies on.</p>
            <a class="landing-circle-link" href="#offer" aria-label="Explore what Content Online offers"><span>EXPLORE</span><span aria-hidden="true">↓</span></a>
          </div>
        </div>
      </section>

      <section class="landing-intro" id="offer" aria-labelledby="offer-title">
        <div class="landing-section-label"><span>01</span><p>THE OFFER</p></div>
        <div class="landing-intro-copy">
          <p class="landing-eyebrow">ACCESS WITH PURPOSE</p>
          <h2 id="offer-title">Essential knowledge,<br><em>made easier to reach.</em></h2>
          <p class="landing-lead">Content Online brings specialist information into one clear relationship — shaped around the needs of universities, companies and public institutions.</p>
        </div>
        <div class="landing-offer-grid">
          <article>
            <span>01</span>
            <h3>Journals</h3>
            <p>Research collections selected for the disciplines and teams that use them.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Standards</h3>
            <p>Trusted technical references for engineering, quality and innovation.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Books & learning</h3>
            <p>Digital books and professional learning gathered alongside your subscriptions.</p>
          </article>
        </div>
      </section>

      <section class="landing-statement" id="institutions" aria-labelledby="institutions-title">
        <div class="landing-statement-rule" aria-hidden="true"></div>
        <p class="landing-eyebrow">BUILT AROUND YOUR INSTITUTION</p>
        <h2 id="institutions-title">ONE RELATIONSHIP.<br>THE RIGHT <span>COLLECTIONS.</span></h2>
        <div class="landing-statement-copy">
          <p>Access is organised around your institution, while each verified member reaches only the customer portal assigned to them.</p>
          <a href="/login" data-customer-login>Enter customer access <span aria-hidden="true">→</span></a>
        </div>
      </section>

      <section class="landing-band" aria-label="Content formats">
        <p>JOURNALS</p><span aria-hidden="true">·</span><p>STANDARDS</p><span aria-hidden="true">·</span><p>EBOOKS</p><span aria-hidden="true">·</span><p>ELEARNING</p>
      </section>
    </main>

    <footer class="landing-footer" id="contact">
      <div class="landing-footer-main">
        <div>
          <span class="landing-footer-mark"><img src="/admin/assets/co-logo.png" alt="" width="160" height="160"></span>
          <p class="landing-kicker">CONTENT ONLINE</p>
        </div>
        <p class="landing-footer-title">KNOWLEDGE<br><span>CONNECTED.</span></p>
      </div>
      <div class="landing-footer-row">
        <p>© 2026 Content Online</p>
        <nav aria-label="Access links"><a href="/login" data-customer-login>Customer log in</a><a href="/admin/login">Staff administration</a></nav>
      </div>
    </footer>
  </body>
</html>`;
}
