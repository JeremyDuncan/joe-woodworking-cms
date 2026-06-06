import React, {createContext, useContext, useEffect, useMemo, useRef, useState} from 'react';

// Tracks which uploaded videos are still being transcoded in the background. Video URLs are
// stable (the server overwrites the file in place when done), so we only need this to show an
// "optimizing" badge and to reload the element once the optimized version is ready.
const ProcessingContext = createContext({keys: new Set(), progress: {}, refresh: () => {}});

export function useProcessing() {
    return useContext(ProcessingContext);
}

// The stored key is the last path segment of an /uploads/<key> URL.
export function keyFromUrl(url) {
    return url ? String(url).split('/').pop() : '';
}

export function ProcessingProvider({active, children}) {
    const [keys, setKeys] = useState(() => new Set());
    const [progress, setProgress] = useState({});
    const refreshRef = useRef(() => {});

    useEffect(() => {
        if (!active) {
            setKeys(new Set());
            setProgress({});
            return;
        }
        let alive = true;
        let timer;
        const tick = async () => {
            try {
                const r = await fetch('/api/admin/transcode-status');
                const d = r.ok ? await r.json() : {keys: [], progress: {}};
                if (!alive) return;
                const next = new Set(d.keys || []);
                setKeys(next);
                setProgress(d.progress || {});
                // Poll briskly while encoding (so the % feels live), lazily when idle.
                timer = setTimeout(tick, next.size ? 1500 : 20000);
            } catch {
                if (alive) timer = setTimeout(tick, 20000);
            }
        };
        refreshRef.current = () => {
            clearTimeout(timer);
            tick();
        };
        tick();
        return () => {
            alive = false;
            clearTimeout(timer);
        };
    }, [active]);

    const value = useMemo(() => ({keys, progress, refresh: () => refreshRef.current()}), [keys, progress]);
    return <ProcessingContext.Provider value={value}>{children}</ProcessingContext.Provider>;
}
