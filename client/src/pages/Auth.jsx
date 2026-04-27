import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, ArrowRight, Eye, EyeOff } from 'lucide-react'
import api from '../lib/api'
import { useStore } from '../store'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const { setAuth } = useStore()
  const navigate = useNavigate()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password }
      const res = await api.post(endpoint, payload)
      setAuth(res.data.user, res.data.token)
      navigate('/')
    } catch (e) {
      setError(e.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="fixed inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(#e8ff47 1px, transparent 1px), linear-gradient(90deg, #e8ff47 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center mb-4">
            <Zap size={22} className="text-void" fill="currentColor" />
          </div>
          <h1 className="font-display font-bold text-3xl text-white">ExecOS</h1>
          <p className="text-ghost text-sm mt-1 text-center">
            Your personal ₹1Cr execution system
          </p>
        </div>

        {/* Card */}
        <div className="exec-card">
          {/* Tabs */}
          <div className="flex gap-1 bg-void rounded-lg p-1 mb-6">
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-2 rounded-md text-sm font-display font-semibold transition-all ${
                  mode === m ? 'bg-accent text-void' : 'text-ghost hover:text-white'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-kill/10 border border-kill/30 rounded-lg px-3.5 py-2.5 text-kill text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="text-xs font-mono text-ghost uppercase tracking-wider block mb-1.5">Name</label>
                <input
                  className="exec-input"
                  placeholder="Sahil"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label className="text-xs font-mono text-ghost uppercase tracking-wider block mb-1.5">Email</label>
              <input
                className="exec-input"
                type="email"
                placeholder="sahil@example.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-mono text-ghost uppercase tracking-wider block mb-1.5">Password</label>
              <div className="relative">
                <input
                  className="exec-input pr-10"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ghost hover:text-white">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-exec w-full justify-center py-3 mt-2 disabled:opacity-60"
            >
              {loading ? 'Working...' : mode === 'login' ? 'Enter the OS' : 'Initialize System'}
              <ArrowRight size={16} />
            </button>
          </form>
        </div>

        {/* Motivator */}
        <p className="text-center text-ghost/50 text-xs font-mono mt-6">
          "The ₹1Cr version of you already started."
        </p>
      </div>
    </div>
  )
}
