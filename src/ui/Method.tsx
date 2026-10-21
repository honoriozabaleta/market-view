import { COMMON_LABEL, SCORE_STEPS, scoreKey, type Voice } from '../domain/catalog';
import { CONSENSUS_SHARE, LEANING_AVG, MIN_VIEWS, STALE_AFTER_DAYS } from '../domain/consensus';
import type { EditionModel } from '../domain/model';
import { Reveal, SectionHead, stanceClass } from './primitives';

const VOICES: { id: Voice; name: string; sub: string }[] = [
  { id: 'research', name: 'Research', sub: 'Forecasts for institutional clients' },
  { id: 'wealth', name: 'Wealth management', sub: 'Advice for private clients' },
  { id: 'am', name: 'Asset management', sub: "Fund managers' allocation views" },
];

export function MethodSection({ model }: { model: EditionModel }) {
  const pct = Math.round(CONSENSUS_SHARE * 100);
  return (
    <section className="section" id="method" aria-labelledby="method-title">
      <div className="wrap">
        <SectionHead
          id="method"
          kicker="07 · Method"
          title="How we reconcile"
          sub="Banks speak with several voices and different vocabularies. Three rules keep the comparison honest."
        />
        <div className="steps">
          <Reveal className="step">
            <span className="step-n">1</span>
            <h3>One voice per house</h3>
            <p>
              Each group has research, wealth and asset management teams. For positioning we read
              the team that publishes an explicit allocation, so every house gets exactly one vote.
            </p>
          </Reveal>
          <Reveal className="step" delay={0.1}>
            <span className="step-n">2</span>
            <h3>One common scale</h3>
            <p>
              We compare relative positioning: over- or underweight versus each house's own
              benchmark or strategic allocation. “Overweight”, “equal weight” or a “+” tilt all land
              on the same five-step scale, with the original wording one click away.
            </p>
          </Reveal>
          <Reveal className="step" delay={0.2}>
            <span className="step-n">3</span>
            <h3>Every call has a source</h3>
            <p>
              Each call carries its publication, date and link. Missing views stay missing: no view
              is never counted as neutral.
            </p>
          </Reveal>
        </div>

        <Reveal className="tbl-wrap">
          <table className="tbl">
            <caption>
              Which report we read for each house
              <small>
                The highlighted column feeds positioning. Research outlooks feed “The numbers”.
              </small>
            </caption>
            <thead>
              <tr>
                <th scope="col">House</th>
                {VOICES.map((v) => (
                  <th scope="col" key={v.id}>
                    {v.name}
                    <small>{v.sub}</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {model.houses.map(({ house }) => (
                <tr key={house.id}>
                  <th scope="row">{house.name}</th>
                  {VOICES.map((v) => {
                    const used = house.positioningVoice === v.id;
                    const text = house.voices[v.id];
                    return (
                      <td
                        key={v.id}
                        className={used ? 'use' : text.startsWith('—') ? 'dim' : undefined}
                      >
                        {used && (
                          <>
                            <b>Positioning</b>
                            <br />
                          </>
                        )}
                        {text}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>

        <Reveal className="tbl-wrap">
          <table className="tbl">
            <caption>
              One scale, {model.houses.length} vocabularies
              <small>How each house's original wording maps onto the common scale.</small>
            </caption>
            <thead>
              <tr>
                <th scope="col">Common scale</th>
                {model.houses.map(({ house }) => (
                  <th scope="col" key={house.id}>
                    {house.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SCORE_STEPS.map((s) => (
                <tr key={s}>
                  <th scope="row">
                    <span className={`chip ${stanceClass(s)}`}>{COMMON_LABEL[scoreKey(s)]}</span>
                  </th>
                  {model.houses.map((row) => (
                    <td key={row.house.id}>{row.scale[scoreKey(s)]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>

        <Reveal>
          <ul className="rules" aria-label="How the consensus is measured">
            <li>
              <strong>Relative, not absolute</strong>
              When a house publishes both absolute views (“attractive”) and tilts versus its
              strategic allocation, we use the tilts, so every house answers the same question.
            </li>
            <li>
              <strong>Categories (≈)</strong>
              When a house's row is broader or narrower than ours, such as “international developed
              equities” for Europe and Japan, we use it and mark the call with ≈ and the house's own
              row.
            </li>
            <li>
              <strong>Counting</strong>
              Each asset shows how many houses are overweight, neutral and underweight, plus the
              average call (◆) on the −2 to +2 scale.
            </li>
            <li>
              <strong>Consensus</strong>
              At least {pct}% of the houses with a view on the same side. Otherwise “leaning” when
              the average is beyond ±{LEANING_AVG}, and “split” when they spread across both sides.
            </li>
            <li>
              <strong>Coverage</strong>
              Fewer than {MIN_VIEWS} explicit views and we say “too few views” instead of inventing
              a consensus.
            </li>
            <li>
              <strong>Freshness</strong>
              We use each house's latest publication before the cut-off. Sources older than{' '}
              {STALE_AFTER_DAYS} days are flagged.
            </li>
          </ul>
        </Reveal>

        <Reveal className="disclaimer">
          <span aria-hidden="true">⚠</span>
          <p>
            <strong>Not investment advice.</strong> Market View is an independent research project
            with no affiliation to the institutions shown. Calls are our own summary of public
            publications, each with its source and date.
            {model.edition.status === 'illustrative' &&
              ' In this preview every view, number and quote is illustrative.'}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
