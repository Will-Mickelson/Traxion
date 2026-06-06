import { useEffect, useState } from 'react'

export default function PRToast({ prs, onDone }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 400) }, 3500)
    return () => clearTimeout(t)
  }, [])

  if (!prs?.length) return null

  return (
    <div style={{
      position: 'fixed', top: 24, left: '50%', transform: `translateX(-50%) translateY(${visible ? 0 : '-120px'})`,
      transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      background: '#c8f135', color: '#000', borderRadius: 20, padding: '14px 20px',
      zIndex: 999, boxShadow: '0 8px 32px rgba(200,241,53,0.3)',
      display: 'flex', alignItems: 'center', gap: 10, maxWidth: 320, width: 'calc(100vw - 48px)'
    }}>
      <span style={{ fontSize: 28 }}>🏆</span>
      <div>
        <div style={{ fontWeight: 800, fontSize: 14 }}>New Personal Record!</div>
        <div style={{ fontSize: 12, marginTop: 2 }}>{prs.join(', ')} — +50 XP each</div>
      </div>
    </div>
  )
}
