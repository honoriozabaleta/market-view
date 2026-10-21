import { dataset } from '../../data/load';
import { PageHead, StatusKey } from '../components';

export const methodologySections = [
  ['comparison', 'Comparison contract'],
  ['statuses', 'Status key'],
  ['time', 'Time & revisions'],
  ['sources', 'Coverage & source usage'],
  ['limitations', 'Limitations'],
] as const;

export function Methodology() {
  return (
    <>
      <PageHead kicker={`Methodology ${dataset.methodologyVersion}`} title="Methodology & Sources">
        <p className="lead">
          Market View compares published research streams within a curated coverage set. “Latest”
          means the latest dated, verified and eligible observation in that coverage. It does not
          mean the latest opinion of an entire institution or real-time monitoring.
        </p>
      </PageHead>
      <div className="method-layout">
        <nav className="method-toc" aria-label="On this page">
          <p className="kicker">On this page</p>
          <ol>
            {methodologySections.map(([id, title]) => (
              <li key={id}>
                <a href={`#/methodology/${id}`}>{title}</a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="prose">
          <section id="method-comparison" tabIndex={-1} aria-labelledby="h-comparison">
            <h2 id="h-comparison">Comparison contract</h2>
            <p>
              The matrix prioritizes explicit allocation stance. Favorable, neutral and unfavorable
              require a documented mapping for the source, label, universe, horizon and reference.
              Bullish, attractive, a price target or a Fed forecast does not automatically become an
              allocation recommendation.
            </p>
            <p>
              The initial cohort requires an exact catalog universe, USD currency, a Strategic
              allocation reference and a selected 12- or 3-month horizon. Unknown horizons and
              different universes are excluded. Not disclosed, not comparable, stale and withdrawn
              are distinct from neutral. Narrative and quantitative observations remain available as
              evidence.
            </p>
            <p>
              Counts are descriptive labels from one default stream per institution. At least two
              comparable streams are required. No sentiment score, performance ranking or numerical
              consensus index is produced.
            </p>
          </section>
          <section id="method-statuses" tabIndex={-1} aria-labelledby="h-statuses">
            <h2 id="h-statuses">Status key</h2>
            <p>
              Every matrix cell carries one text status. Colors repeat the label and never carry a
              meaning of their own.
            </p>
            <StatusKey />
          </section>
          <section id="method-time" tabIndex={-1} aria-labelledby="h-time">
            <h2 id="h-time">Time & revisions</h2>
            <p>
              Publication, first observation, verification, editorial approval and first platform
              release are separate dates. Missing publication dates are not ranked as latest.
              Month-only dates enter historical selection only after that month ends. Rechecking a
              website does not renew an old recommendation.
            </p>
            <p>
              A later partial publication does not refresh omitted assets. An explicit withdrawal
              removes the active stance. Historical recorded queries require all availability dates
              at or before the cutoff. Reconstructed archives may use older documents added later;
              the label and creation date make that limit visible.
            </p>
            <dl className="facts facts-wide">
              <dt>Recorded snapshot</dt>
              <dd>Captured at its cutoff; reproduces what the platform had available then.</dd>
              <dt>Reconstructed snapshot</dt>
              <dd>
                Created later for an earlier cutoff. May include older documents incorporated by its
                creation time, never later publications. Not proof of past platform coverage.
              </dd>
              <dt>Computed selection</dt>
              <dd>
                Derived now from records available by a quarter-end cutoff. Not an immutable saved
                snapshot.
              </dd>
              <dt>Open quarter</dt>
              <dd>Capped at the actual query clock, never at a future quarter-end date.</dd>
            </dl>
            <p>
              Closed snapshot entries pin observation IDs and publication versions. Corrections
              append identified revisions and never silently overwrite the archive. Extraction
              corrections are separate from institutional view changes. A change of methodology,
              type, horizon, universe or reference limits comparison.
            </p>
          </section>
          <section id="method-sources" tabIndex={-1} aria-labelledby="h-sources">
            <h2 id="h-sources">Coverage & source usage</h2>
            <p>
              {__DEMO__
                ? 'All institutions, research statements and evidence in this demo are authored fictional fixtures. Review dates simulate a lifecycle and do not represent human review.'
                : 'No real institutional views have been approved for publication. Real-source discovery remains in a separate, unpublished candidate registry.'}
            </p>
            <p>
              Public sources require a human usage assessment: pending review, link only, approved
              scope or excluded. Link-only status does not permit analytical observations.
              Bibliographic evidence can be sufficient; original reports, screenshots and full text
              are not hosted. No third-party logos are used.
            </p>
            <p>
              Source metadata and observations require owner review before promotion to published
              data. Public accessibility and attribution do not establish permission to reuse source
              material.
            </p>
          </section>
          <section id="method-limitations" tabIndex={-1} aria-labelledby="h-limitations">
            <h2 id="h-limitations">Limitations</h2>
            <p>
              Coverage is deliberately small and may omit publications, assets or teams. An absent
              record is not a neutral view. Research labels do not establish actual portfolio
              positions, investment suitability or market-wide agreement. There are no user
              accounts, payments, automated scraping, LLM extraction, trading or backtests in this
              version.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
