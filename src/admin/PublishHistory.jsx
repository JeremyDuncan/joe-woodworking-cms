import React, {useEffect, useMemo, useState} from 'react';
import {ArrowDown, ArrowUp, ExternalLink, History, Search} from 'lucide-react';
import {lastSegment, pageLabel, samePage} from '../lib/pages.js';
import {buildLinkSources, pageStatus} from '../lib/links.js';
import {navigate} from '../lib/navigation.jsx';
import {SectionHeader} from './SectionHeader.jsx';

// Published (live), modified (live but has newer unpublished edits), or unpublished (not live).
function pubStatus(path, published, layout) {
    const pub = published?.[path];
    if (!pub) return 'unpublished';
    return samePage(pub, layout?.[path]) ? 'published' : 'modified';
}

const PUB_LABEL = {published: 'Published', modified: 'Edited', unpublished: 'Unpublished'};

function Caret({active, dir}) {
    if (!active) return null;
    return dir === 'asc' ? <ArrowUp size={13}/> : <ArrowDown size={13}/>;
}

export function PublishHistory() {
    const [settings, setSettings] = useState(null);
    const [query, setQuery] = useState('');
    const [pSort, setPSort] = useState({key: 'label', dir: 'asc'});
    const [lSort, setLSort] = useState({key: 'at', dir: 'desc'});

    useEffect(() => {
        fetch('/api/admin/settings').then(r => r.json()).then(setSettings).catch(() => setSettings({}));
    }, []);

    const linkSources = useMemo(() => settings ? buildLinkSources(settings.layout, settings.nav) : {}, [settings]);

    const pages = useMemo(() => {
        if (!settings) return [];
        const published = settings.published || {};
        const layout = settings.layout || {};
        return (settings.nav || []).filter(n => n.path).map(n => ({
            path: n.path,
            label: pageLabel(n) || lastSegment(n.path) || n.path,
            publish: pubStatus(n.path, published, layout),
            link: pageStatus(n, linkSources)
        }));
    }, [settings, linkSources]);

    const q = query.trim().toLowerCase();
    const sortBy = (arr, {key, dir}) => [...arr].sort((a, b) => {
        const cmp = String(a[key] ?? '').localeCompare(String(b[key] ?? ''), undefined, {numeric: true});
        return dir === 'asc' ? cmp : -cmp;
    });
    const toggle = setter => key => setter(s => ({key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc'}));
    const sortPages = toggle(setPSort);
    const sortLog = toggle(setLSort);

    const shownPages = useMemo(() => sortBy(
        pages.filter(p => !q || `${p.label} ${p.path}`.toLowerCase().includes(q)), pSort), [pages, pSort, q]);
    const shownLog = useMemo(() => sortBy(
        (settings?.publishLog || []).filter(r => !q || `${r.label || ''} ${r.path || ''} ${r.action || ''}`.toLowerCase().includes(q)),
        lSort), [settings, lSort, q]);

    if (!settings) return <p className="ph-empty">Loading…</p>;

    const open = path => navigate(path);
    const PageBtn = ({path, children}) => <button type="button" className="ph-page-link" onClick={() => open(path)}>
        {children} <ExternalLink size={12}/>
    </button>;
    const Sort = ({onClick, active, dir, children}) => <th>
        <button type="button" className="ph-sort" onClick={onClick}>{children} <Caret active={active} dir={dir}/></button>
    </th>;

    return <div className="publish-history">
        <SectionHeader icon={History} title="Publishing">
            Visitors only see published pages. Click a page to open it; publish or unpublish from the site editor.
        </SectionHeader>

        <div className="ph-search">
            <Search size={15}/>
            <input type="text" placeholder="Search pages and history…" value={query}
                   onChange={e => setQuery(e.target.value)}/>
            {query && <button type="button" className="ph-search-clear" onClick={() => setQuery('')}>×</button>}
        </div>

        <h3 className="ph-subhead">Pages <span className="ph-count">{shownPages.length}</span></h3>
        <div className="ph-table-wrap ph-scroll">
            <table className="ph-table">
                <thead>
                    <tr>
                        <Sort onClick={() => sortPages('label')} active={pSort.key === 'label'} dir={pSort.dir}>Page</Sort>
                        <Sort onClick={() => sortPages('path')} active={pSort.key === 'path'} dir={pSort.dir}>Address</Sort>
                        <Sort onClick={() => sortPages('publish')} active={pSort.key === 'publish'} dir={pSort.dir}>Status</Sort>
                        <Sort onClick={() => sortPages('link')} active={pSort.key === 'link'} dir={pSort.dir}>Links</Sort>
                    </tr>
                </thead>
                <tbody>
                    {shownPages.length === 0
                        ? <tr><td colSpan={4} className="ph-empty">No pages match.</td></tr>
                        : shownPages.map(p => <tr key={p.path}>
                            <td><PageBtn path={p.path}>{p.label}</PageBtn></td>
                            <td className="ph-path">{p.path}</td>
                            <td><span className={`publish-badge ${p.publish}`}>{PUB_LABEL[p.publish]}</span></td>
                            <td><span className={`page-status ${p.link}`}>{p.link}</span></td>
                        </tr>)}
                </tbody>
            </table>
        </div>

        <h3 className="ph-subhead">Activity log <span className="ph-count">{shownLog.length}</span></h3>
        <div className="ph-table-wrap ph-scroll">
            <table className="ph-table">
                <thead>
                    <tr>
                        <Sort onClick={() => sortLog('at')} active={lSort.key === 'at'} dir={lSort.dir}>When</Sort>
                        <Sort onClick={() => sortLog('label')} active={lSort.key === 'label'} dir={lSort.dir}>Page</Sort>
                        <Sort onClick={() => sortLog('path')} active={lSort.key === 'path'} dir={lSort.dir}>Address</Sort>
                        <Sort onClick={() => sortLog('action')} active={lSort.key === 'action'} dir={lSort.dir}>Action</Sort>
                    </tr>
                </thead>
                <tbody>
                    {shownLog.length === 0
                        ? <tr><td colSpan={4} className="ph-empty">No publish activity{q ? ' matches' : ' yet'}.</td></tr>
                        : shownLog.map((r, i) => <tr key={i}>
                            <td>{r.at ? new Date(r.at).toLocaleString() : '—'}</td>
                            <td><PageBtn path={r.path}>{r.label || '—'}</PageBtn></td>
                            <td className="ph-path">{r.path}</td>
                            <td><span className={`ph-action ${r.action}`}>{r.action}</span></td>
                        </tr>)}
                </tbody>
            </table>
        </div>
    </div>;
}
