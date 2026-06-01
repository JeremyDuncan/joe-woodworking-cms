import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';
import {defaultSettings, mergeSettings} from './data/defaults.js';
import {applyTheme} from './lib/theme.js';
import {DialogHost} from './lib/dialog.jsx';
import {PublicSite} from './pages/PublicSite.jsx';
import {Admin} from './admin/Admin.jsx';

// Catches render-time errors anywhere below it so one broken component shows a
// recoverable message instead of a blank white screen, and logs the component
// stack so the offending component is identifiable.
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {error: null};
    }

    static getDerivedStateFromError(error) {
        return {error};
    }

    componentDidCatch(error, info) {
        console.error('App crashed:', error, '\nComponent stack:', info?.componentStack);
    }

    render() {
        if (this.state.error) {
            return <div className="app-fallback">
                <h1>Something went wrong</h1>
                <p>{String(this.state.error?.message || this.state.error)}</p>
                <button type="button" className="button button-primary"
                        onClick={() => location.reload()}>Reload the page
                </button>
            </div>;
        }
        return this.props.children;
    }
}

function App() {
    const [works, setWorks] = useState([]);
    const [config, setConfig] = useState(null);
    const [configError, setConfigError] = useState(false);
    const [settings, setSettings] = useState(defaultSettings);
    const [route, setRoute] = useState(location.pathname);
    const isAdminRoute = useMemo(
        () => config && (route === config.adminPath || route.startsWith(config.adminPath + '/')), [route, config]);

    const reload = () => fetch('/api/works?ts=' + Date.now()).then(r => r.json()).then(setWorks).catch(() => {});
    const reloadSettings = () => fetch('/api/settings?ts=' + Date.now())
        .then(r => r.json()).then(s => setSettings(mergeSettings(s))).catch(() => {});
    // Only this fetch gates the whole app, so guard it: on failure, surface a retry
    // path and — importantly — never clear an already-loaded config (so a transient
    // refetch while editing can't blank the page).
    const reloadConfig = () => fetch('/api/config')
        .then(r => {
            if (!r.ok) throw new Error('config request failed (' + r.status + ')');
            return r.json();
        })
        .then(c => {
            setConfig(c);
            setConfigError(false);
        })
        .catch(err => {
            console.error('Failed to load /api/config:', err);
            setConfigError(true);
        });

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

    if (!config) {
        return <div className="app-fallback">
            {configError
                ? <>
                    <h1>Can’t reach the server</h1>
                    <p>The site configuration failed to load.</p>
                    <button type="button" className="button button-primary"
                            onClick={() => {
                                setConfigError(false);
                                reloadConfig();
                            }}>Retry
                    </button>
                </>
                : <p className="app-loading">Loading…</p>}
        </div>;
    }
    return <>
        {isAdminRoute
            ? <Admin works={works} reload={reload} onAuthChange={reloadConfig}/>
            : <PublicSite works={works} settings={settings} route={route}
                          isAdmin={config.isAdmin} adminPath={config.adminPath} reloadSettings={reloadSettings}
                          reloadWorks={reload}/>}
        <DialogHost/>
    </>;
}

createRoot(document.getElementById('root')).render(<ErrorBoundary><App/></ErrorBoundary>);
