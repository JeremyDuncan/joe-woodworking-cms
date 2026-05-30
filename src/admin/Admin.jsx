import React, {useEffect, useRef, useState} from 'react';
import {Edit3, ImagePlus, Lock, LogOut, Menu} from 'lucide-react';
import {WorkForm} from './WorkForm.jsx';
import {WorkList} from './WorkList.jsx';
import {SettingsForm} from './SettingsForm.jsx';
import {PasswordForm} from './PasswordForm.jsx';

export function Admin({works, settings, reload, reloadSettings}) {
    const [me, setMe] = useState(null), [login, setLogin] = useState({
        username: '',
        password: ''
    }), [editing, setEditing] = useState(null), [msg, setMsg] = useState(''), [tab, setTab] = useState('work'), [notice, setNotice] = useState(null);
    const formRef = useRef(null);
    useEffect(() => {
        fetch('/api/admin/me').then(r => r.json()).then(setMe)
    }, []);

    async function doLogin(e) {
        e.preventDefault();
        setMsg('');
        const r = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(login)
        });
        const j = await r.json();
        if (!r.ok) return setMsg(j.error || 'Login failed');
        setMe({isAdmin: true, user: j.user});
    }

    async function logout() {
        await fetch('/api/admin/logout', {method: 'POST'});
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
            <h1>Joe’s Flags Admin</h1><p>Hidden login for adding/removing photos, videos, descriptions, prices, and
                website text.</p><input placeholder="Username" value={login.username}
                                        onChange={e => setLogin({...login, username: e.target.value})}/><input
                placeholder="Password" type="password" value={login.password}
                onChange={e => setLogin({...login, password: e.target.value})}/>{msg && <p className="error">{msg}</p>}
            <button className="button button-primary">Login</button>
        </form>
    </main>;
    return <main className="admin-shell admin-dashboard">
        <header>
            <div><p className="eyebrow"><Edit3 size={15}/> CMS Dashboard</p><h1>Manage Joe’s website</h1></div>
            <button onClick={logout} className="button button-ghost"><LogOut size={17}/> Logout</button>
        </header>
        {notice && <div className={`admin-notice admin-notice--${notice.type}`}>{notice.text}</div>}
        <div className="admin-tabs">
            <button className={tab === 'work' ? 'active' : ''} onClick={() => setTab('work')}><ImagePlus
                size={16}/> Work
            </button>
            <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}><Menu
                size={16}/> Text & Pages
            </button>
            <button className={tab === 'password' ? 'active' : ''} onClick={() => setTab('password')}><Lock
                size={16}/> Password
            </button>
        </div>
        {tab === 'work' && <><WorkForm formRef={formRef} editing={editing} setEditing={setEditing} reload={reload}
                                       setNotice={setNotice}/><WorkList works={works} setEditing={setEditing}
                                                                        reload={reload}
                                                                        startEdit={startEdit}/></>}{tab === 'settings' &&
        <SettingsForm settings={settings} reloadSettings={reloadSettings}/>} {tab === 'password' && <PasswordForm/>}
    </main>
}
