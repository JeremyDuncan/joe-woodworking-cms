import React, {useEffect, useRef, useState} from 'react';
import {Archive, Edit3, ImagePlus, Lock, LogOut} from 'lucide-react';
import {navigate} from '../lib/navigation.jsx';
import {WorkForm} from './WorkForm.jsx';
import {WorkList} from './WorkList.jsx';
import {PasswordForm} from './PasswordForm.jsx';
import {BackupPanel} from './BackupPanel.jsx';

export function Admin({works, reload, onAuthChange}) {
    const [me, setMe] = useState(null), [login, setLogin] = useState({
        username: '',
        password: ''
    }), [editing, setEditing] = useState(null), [msg, setMsg] = useState(''), [tab, setTab] = useState('work'), [notice, setNotice] = useState(null);
    const formRef = useRef(null);
    useEffect(() => {
        fetch('/api/admin/me').then(r => r.json()).then(setMe).catch(() => setMe({isAdmin: false}));
    }, []);

    async function doLogin(e) {
        e.preventDefault();
        setMsg('');
        try {
            const r = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(login)
            });
            const j = await r.json().catch(() => ({}));
            if (!r.ok) return setMsg(j.error || 'Login failed');
            if (onAuthChange) await onAuthChange();
            navigate('/'); // land on the editable home page with the admin edit bar
        } catch {
            setMsg('Network error. Please try again.');
        }
    }

    async function logout() {
        try {
            await fetch('/api/admin/logout', {method: 'POST'});
        } catch {
            // Even if the request fails, drop the local admin state.
        }
        if (onAuthChange) await onAuthChange();
        setMe({isAdmin: false});
    }

    function startEdit(work) {
        setTab('work');
        setEditing(work);
        setNotice(null);
        setTimeout(() => formRef.current?.scrollIntoView({behavior: 'smooth', block: 'start'}), 50);
    }

    if (!me?.isAdmin) return <main className="admin-shell">
        <form className="login-card" onSubmit={doLogin}><p className="eyebrow"><Lock size={15}/> Private CMS</p>
            <h1>Admin Login</h1><p>Hidden login for managing photos, videos, descriptions, prices, and website
                text.</p><input placeholder="Username" value={login.username}
                                onChange={e => setLogin({...login, username: e.target.value})}/><input
                placeholder="Password" type="password" value={login.password}
                onChange={e => setLogin({...login, password: e.target.value})}/>{msg && <p className="error">{msg}</p>}
            <button className="button button-primary">Login</button>
        </form>
    </main>;
    return <main className="admin-shell admin-dashboard">
        <header>
            <div><p className="eyebrow"><Edit3 size={15}/> CMS Dashboard</p><h1>Manage Website</h1></div>
            <div className="admin-header-actions">
                <a className="button button-ghost" href="/">View &amp; edit site</a>
                <button onClick={logout} className="button button-ghost"><LogOut size={17}/> Logout</button>
            </div>
        </header>
        {notice && <div className={`admin-notice admin-notice--${notice.type}`}>{notice.text}</div>}
        <div className="admin-tabs">
            <button className={tab === 'work' ? 'active' : ''} onClick={() => setTab('work')}><ImagePlus
                size={16}/> Item
            </button>
            <button className={tab === 'password' ? 'active' : ''} onClick={() => setTab('password')}><Lock
                size={16}/> Password
            </button>
            <button className={tab === 'backup' ? 'active' : ''} onClick={() => setTab('backup')}><Archive
                size={16}/> Backup
            </button>
        </div>
        {tab === 'work' && <><WorkForm formRef={formRef} editing={editing} setEditing={setEditing} reload={reload}
                                       setNotice={setNotice}/><WorkList works={works} setEditing={setEditing}
                                                                        reload={reload} startEdit={startEdit}/></>}
        {tab === 'password' && <PasswordForm/>}
        {tab === 'backup' && <BackupPanel reload={reload}/>}
    </main>
}
