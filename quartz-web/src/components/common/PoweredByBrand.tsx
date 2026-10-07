import './rainbow-fill.css';
import './PoweredByBrand.css';

export function PoweredByBrand(): React.ReactElement {
  return (
    <div id="quartz-brandmark">
      <p className="quartz-brandmark__caption">Powered by</p>
      <div className="quartz-brandmark__logo" role="img" aria-label="Quartz">
        <div className="quartz-brandmark__aura quartz-rainbow-fill" aria-hidden="true" />
        <div className="quartz-brandmark__fill quartz-rainbow-fill" aria-hidden="true" />
      </div>
    </div>
  );
}
