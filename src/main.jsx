import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';
import {defaultSettings, mergeSettings} from './data/defaults.js';
import {applyTheme} from './lib/theme.js';
import {PublicSite} from './pages/PublicSite.jsx';
import {Admin} from './admin/Admin.jsx';

function App() {
    const [works, setWorks] = useState([]), [config, setConfig] = useState(null), [settings, setSettings] = useState(defaultSettings), [route, setRoute] = useState(location.pathname);
    const isAdminRoute = useMemo(() => config && (route === config.adminPath || route.startsWith(config.adminPath + '/')), [route, config]);
    const reload = () => fetch('/api/works?ts=' + Date.now()).then(r => r.json()).then(setWorks);
    const reloadSettings = () => fetch('/api/settings?ts=' + Date.now()).then(r => r.json()).then(s => setSettings(mergeSettings(s)));
    const reloadConfig = () => fetch('/api/config').then(r => r.json()).then(setConfig);
    useEffect(() => {
        reloadConfig();
        reload();
        reloadSettings();
        const onPop = () => setRoute(location.pathname);
        addEventListener('popstate', onPop);
        return () => removeEventListener('popstate', onPop);
    }, []);
    useEffect(() => {
        applyTheme(settings.theme);
    }, [settings.theme]);
    if (!config) return null;
    return isAdminRoute ? <Admin works={works} reload={reload} onAuthChange={reloadConfig}/> :
        <PublicSite works={works} settings={settings} route={route}
                    isAdmin={config.isAdmin} adminPath={config.adminPath} reloadSettings={reloadSettings}
                    reloadWorks={reload}/>
}

createRoot(document.getElementById('root')).render(<App/>);
