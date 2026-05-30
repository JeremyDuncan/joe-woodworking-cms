import React from 'react';
import {Mail} from 'lucide-react';
import {normalizePhone} from '../lib/format.js';
import {Edit, InlineText, useEdit} from '../lib/edit.jsx';

export function ContactPage({settings}) {
    const {editing, setField} = useEdit();
    return <section className="page section cta-section">
        <div className="cta-card">
            <div>
                <Edit as="p" className="eyebrow" path={['contact', 'eyebrow']} value={settings.contact.eyebrow}
                      placeholder="Eyebrow"/>
                <Edit as="h2" path={['contact', 'title']} value={settings.contact.title} placeholder="Title"/>
                <Edit as="p" path={['contact', 'body']} value={settings.contact.body} placeholder="Body"/>
            </div>
            <div className="contact-panel">
                <a className="button button-primary"
                   href={`mailto:${settings.email}?subject=Custom%20American%20Flag%20Inquiry`}><Mail size={18}/> Email
                    Joe</a>
                {editing
                    ? <span className="button button-ghost"><InlineText value={settings.phone} placeholder="Phone number"
                                                                        onChange={v => setField(['phone'], v)}/></span>
                    : <a className="button button-ghost" href={`tel:${normalizePhone(settings.phone)}`}>{settings.phone}</a>}
                <p className="small-note">Email <strong><Edit path={['email']} value={settings.email}
                                                              placeholder="email@example.com"/></strong> or call/text
                    with your design idea, logo, branch, team, or reference image.</p>
            </div>
        </div>
    </section>
}
