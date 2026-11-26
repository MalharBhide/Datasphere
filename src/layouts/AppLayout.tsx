import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  {
    to: '/',
    end: true,
    label: 'Overview',
    icon: (
      <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/clean',
    end: false,
    label: 'Data Cleaning',
    icon: (
      <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
  },
  {
    to: '/visualize',
    end: false,
    label: 'Data Visualization',
    icon: (
      <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    to: '/predict',
    end: false,
    label: 'Predictive Analytics',
    icon: (
      <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
]

// ── Logo mark ──────────────────────────────────────────────────────────────

function LogoMark() {
  return (
    <div className="w-7 h-7 rounded-lg bg-[#3B5BDB] flex items-center justify-center shrink-0">
      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    </div>
  )
}

// ── Sidebar nav item ───────────────────────────────────────────────────────

function NavItem({ to, end, label, icon }: (typeof navItems)[0]) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150 cursor-pointer',
          isActive
            ? 'bg-[#3B5BDB] text-white'
            : 'text-slate-300 hover:bg-[#2A2F45] hover:text-white',
        ].join(' ')
      }
    >
      {icon}
      {label}
    </NavLink>
  )
}

// ── AppLayout ──────────────────────────────────────────────────────────────

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--ds-bg)' }}>

      {/* ── Desktop sidebar ───────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-56 shrink-0"
        style={{ background: 'var(--ds-sidebar)' }}
        aria-label="Application navigation"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-white/[0.06] shrink-0">
          <LogoMark />
          <span
            className="font-semibold text-[15px] tracking-tight"
            style={{ color: 'var(--ds-text-on-dark)' }}
          >
            Datasphere
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto" aria-label="Main">
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 select-none">
            Workspace
          </p>
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/[0.06] shrink-0">
          <p className="text-[11px] text-slate-500">IBM Challenge · v0.1.0</p>
        </div>
      </aside>

      {/* ── Mobile top bar ────────────────────────── */}
      <div
        className="md:hidden fixed top-0 inset-x-0 z-20 flex items-center justify-between px-4 h-12 border-b border-white/[0.08]"
        style={{ background: 'var(--ds-sidebar)' }}
      >
        <div className="flex items-center gap-2">
          <LogoMark />
          <span
            className="font-semibold text-sm tracking-tight"
            style={{ color: 'var(--ds-text-on-dark)' }}
          >
            Datasphere
          </span>
        </div>
        <nav className="flex gap-0.5" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-[#3B5BDB] text-white'
                    : 'text-slate-300 hover:bg-[#2A2F45] hover:text-white',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ── Main content area ─────────────────────── */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-12">
        <Outlet />
      </main>
    </div>
  )
}
