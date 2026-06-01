import React, {useState} from 'react';
import {Lock} from 'lucide-react';

export function PasswordForm() {
    const [form, setForm] = useState({currentPassword: '', newPassword: '', confirm: ''}), [msg, setMsg] = useState('');

    async function save(e) {
        e.preventDefault();
        if (form.newPassword !== form.confirm) return setMsg('New passwords do not match.');
        try {
            const r = await fetch('/api/admin/change-password', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({currentPassword: form.currentPassword, newPassword: form.newPassword})
            });
            const j = await r.json();
            setMsg(r.ok ? 'Password updated. Use it next time you log in.' : j.error || 'Password update failed.');
        } catch (err) {
            setMsg('Network error. Please try again.');
            console.error('Password change failed:', err);
        }
    }

    return <form className="work-form" onSubmit={save}><p className="eyebrow"><Lock size={15}/> Change your password</p>
        <input type="password" placeholder="Current password" value={form.currentPassword}
               onChange={e => setForm({...form, currentPassword: e.target.value})}/><input type="password"
                                                                                           placeholder="New password"
                                                                                           value={form.newPassword}
                                                                                           onChange={e => setForm({
                                                                                               ...form,
                                                                                               newPassword: e.target.value
                                                                                           })}/><input type="password"
                                                                                                       placeholder="Confirm new password"
                                                                                                       value={form.confirm}
                                                                                                       className="password-confirm"
                                                                                                       onChange={e => setForm({
                                                                                                           ...form,
                                                                                                           confirm: e.target.value
                                                                                                       })}/>{msg &&
            <p className={msg.includes('updated') ? 'success' : 'error'}>{msg}</p>}
        <button className="button button-primary">Update password</button>
    </form>
}
