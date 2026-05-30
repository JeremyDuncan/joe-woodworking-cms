import React from 'react';

export function ProcessPage({settings}) {
    return <section className="page section process-section">
        <div className="section-heading narrow"><p className="eyebrow">{settings.process.eyebrow}</p>
            <h2>{settings.process.title}</h2></div>
        <div className="process-grid">{(settings.process.steps || []).map((step, i) => <article key={i}>
            <span>{String(i + 1).padStart(2, '0')}</span><h3>{step.title}</h3><p>{step.body}</p></article>)}</div>
    </section>
}
