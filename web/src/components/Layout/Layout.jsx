import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useStore } from '../../stores/useStore'

const NAV = [
  { to: '/',           label: 'Главная'    },
  { to: '/calendar',   label: 'Расписание' },
  { to: '/patients',   label: 'Пациенты'   },
  { to: '/price-list', label: 'Прайс'      },
  { to: '/settings',   label: 'Настройки'  },
]

function ToothIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C9.5 2 7 3.5 6 6c-.5 1.3-.7 2.7-.5 4 .3 1.7 1.2 3 1.5 4.5.3 1.3.3 2.5.5 3.5.3 1.5 1 3 2 3 .8 0 1.3-1 1.5-2 .2-1 .5-2 1-2s.8 1 1 2c.2 1 .7 2 1.5 2 1 0 1.7-1.5 2-3 .2-1 .2-2.2.5-3.5.3-1.5 1.2-2.8 1.5-4.5.2-1.3 0-2.7-.5-4C17 3.5 14.5 2 12 2z"/>
    </svg>
  )
}

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const settings = useStore(s => s.settings)
  const location = useLocation()

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fb' }}>

      {/* Top bar */}
      <header style={{ background: '#111827', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>

          {/* Logo */}
          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#fff' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1f6feb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ToothIcon />
            </div>
            <span style={{ fontWeight: 700, fontSize: 16 }}>SmilePlan</span>
            {settings.clinicName && (
              <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 4 }}>{settings.clinicName}</span>
            )}
          </NavLink>

          {/* Desktop nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="desktop-nav">
            {NAV.map(item => {
              const isActive = item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to)
              return (
                <NavLink key={item.to} to={item.to} style={{
                  color: isActive ? '#fff' : '#94a3b8',
                  textDecoration: 'none',
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                  transition: 'all 0.15s',
                }}>
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          {/* Doctor chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1f6feb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
              {(settings.doctorName || settings.clinicName || 'Д')[0].toUpperCase()}
            </div>
            <span style={{ color: '#e2e8f0', fontSize: 13, display: 'none' }} className="doctor-name">
              {settings.doctorName || 'Врач'}
            </span>

            {/* Burger for mobile */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{ display: 'none', background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 4 }}
              className="burger-btn">
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div style={{ background: '#1e293b', borderTop: '1px solid #334155' }} className="mobile-menu">
            {NAV.map(item => {
              const isActive = item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to)
              return (
                <NavLink key={item.to} to={item.to}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'block',
                    color: isActive ? '#fff' : '#94a3b8',
                    textDecoration: 'none',
                    padding: '12px 16px',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: 15,
                    background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                  }}>
                  {item.label}
                </NavLink>
              )
            })}
          </div>
        )}
      </header>

      {/* Main */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        {children}
      </main>
    </div>
  )
}
