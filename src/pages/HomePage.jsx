import React from 'react';
import {ArrowRight, BadgeCheck, Star} from 'lucide-react';
import {Link} from '../lib/navigation.jsx';
import {MediaPreview} from '../components/MediaPreview.jsx';

export function HomePage({settings, featured, onImageOpen}) {
    return <section className="page home section-full">
        <div className="home-bg"/>
        <div className="home-content"><p className="eyebrow"><Star size={15}
                                                                   fill="currentColor"/> {settings.home.eyebrow}</p>
            <h1>{settings.home.title}</h1><p className="home-copy">{settings.home.body}</p>
            <div className="home-actions"><Link to="/contact"
                                                className="button button-primary">{settings.home.primaryCta} <ArrowRight
                size={18}/></Link><Link to="/work" className="button button-ghost">{settings.home.secondaryCta}</Link>
            </div>
            <div className="proof-strip">{(settings.proof || []).map(p => <span key={p}><BadgeCheck
                size={16}/>{p}</span>)}</div>
        </div>
        <div className="home-visual"><MediaPreview media={featured?.media} onImageOpen={onImageOpen}/></div>
    </section>
}
