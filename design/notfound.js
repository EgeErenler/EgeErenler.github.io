
// The 404 page: the same liquid band and portrait as the Art mode, with the face standing in for the zero.
function NotFound() {
  const mono = "'IBM Plex Mono', ui-monospace, monospace";
  const btn = 'display: inline-flex; align-items: center; min-height: 48px; padding: 0 22px; border-radius: 999px; text-decoration: none; font-weight: 700; font-size: 15px';
  return html`
  <div style="position: relative; min-height: 100vh; background: #08070A; color: #FFF8EE; font-family: 'Inter Tight', Arial, sans-serif">
    <div aria-hidden="true" style="position: fixed; left: 0; right: 0; top: 0; height: clamp(300px, 46vh, 540px); overflow: hidden">
      <${C.Shader} palette="ember" />
      <div style="position: absolute; inset: 0; background: rgba(8,7,10,.28)"></div>
    </div>
    <div style="position: relative; z-index: 1; max-width: 1280px; min-height: 100vh; margin: 0 auto; padding: 28px clamp(20px, 4vw, 40px) 48px; box-sizing: border-box; display: flex; flex-direction: column; gap: 32px">
      <nav aria-label="Main" style="display: flex; justify-content: space-between; align-items: center; font: 500 13px ${mono}">
        <a href="/" style="color: inherit; text-decoration: none">(EGE_ERENLER)</a>
        <a href="/" style="color: inherit; text-decoration: none">home ↗</a>
      </nav>
      <main style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 28px">
        <p style="margin: 0; font: 500 13px ${mono}; color: #E4DACB">( error 404 · page not found )</p>
        <h1 aria-label="404" style="margin: 0; display: flex; align-items: center; font-size: clamp(120px, 26vw, 340px); font-weight: 900; letter-spacing: -.06em; line-height: .8">
          <span aria-hidden="true">4</span>
          <span aria-hidden="true" style="display: inline-block; width: .74em; aspect-ratio: 400 / 440; margin: 0 .02em">
            <${C.Face} ink="#FFF8EE" paper="#1A0E10" accent="#FF7A35" natural=${true} />
          </span>
          <span aria-hidden="true">4</span>
        </h1>
        <p style="max-width: 720px; margin: 0; font-size: clamp(22px, 2.6vw, 34px); line-height: 1.25; font-weight: 600; letter-spacing: -.02em">This page does not exist, or it has moved. Everything else is still running.</p>
        <div style="display: flex; flex-wrap: wrap; gap: 10px">
          <a href="/" style="${btn}; background: #FF7A35; color: #08070A">Back to the home page</a>
          <a href="/#work" style="${btn}; border: 1px solid rgba(255,248,238,.3); color: #FFF8EE">See my projects</a>
          <a href="/cv/Ege_Erenler_CV.pdf" style="${btn}; border: 1px solid rgba(255,248,238,.3); color: #FFF8EE">Download my CV</a>
        </div>
      </main>
      <footer style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; font: 500 12px ${mono}; color: #E4DACB">
        <span>© 2026 Ege Erenler</span><span>( London, UK )</span>
      </footer>
    </div>
  </div>`;
}
