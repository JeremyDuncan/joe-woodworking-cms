import React, {useState} from 'react';
import {fallbackGallery} from '../data/defaults.js';
import {SiteHeader} from '../components/SiteHeader.jsx';
import {ImageModal} from '../components/ImageModal.jsx';
import {HomePage} from './HomePage.jsx';
import {WorkPage} from './WorkPage.jsx';
import {OptionsPage} from './OptionsPage.jsx';
import {ProcessPage} from './ProcessPage.jsx';
import {ContactPage} from './ContactPage.jsx';

export function PublicSite({works, settings, route}) {
    const [modalImage, setModalImage] = useState(null);
    const gallery = works ?? fallbackGallery;

    const featured = gallery.find(w => w.featured) || gallery.find(w => w.media?.length) || gallery[0];
    let page = <HomePage settings={settings} gallery={gallery} featured={featured} onImageOpen={setModalImage}/>;
    if (route === '/work') page = <WorkPage settings={settings} gallery={gallery} onImageOpen={setModalImage}/>;
    if (route === '/options') page = <OptionsPage settings={settings} featured={featured} onImageOpen={setModalImage}/>;
    if (route === '/process') page = <ProcessPage settings={settings}/>;
    if (route === '/contact') page = <ContactPage settings={settings}/>;
    return <main><SiteHeader settings={settings}/>{page}<ImageModal image={modalImage}
                                                                    onClose={() => setModalImage(null)}/></main>
}
