import React from 'react';
import {Mail} from 'lucide-react';
import {normalizePhone} from '../lib/format.js';

export function ContactPage({settings}) {
    return <section className="page section cta-section">
        <div className="cta-card">
            <div><p className="eyebrow">{settings.contact.eyebrow}</p><h2>{settings.contact.title}</h2>
                <p>{settings.contact.body}</p></div>
            <div className="contact-panel"><a className="button button-primary"
                                              href={`mailto:${settings.email}?subject=Custom%20American%20Flag%20Inquiry`}><Mail
                size={18}/> Email Joe</a><a className="button button-ghost"
                                            href={`tel:${normalizePhone(settings.phone)}`}>{settings.phone}</a><p
                className="small-note">Email <strong>{settings.email}</strong> or call/text with your design idea, logo,
                branch, team, or reference image.</p></div>
        </div>
    </section>
}
