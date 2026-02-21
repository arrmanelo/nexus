import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSources, uploadSource, deleteSource, sendMessage, generateArtifact } from '../lib/api'
import UploadModal from '../components/UploadModal'

function getDisplayName(name = '') {
  const parts = name.split('/')
  const filename = parts[parts.length - 1]
  const clean = filename.replace(/^[a-f0-9\-]{36}_?/i, '')
  return clean || filename
}

function getFileExt(name = '') {
  return (name.split('.').pop() || 'file').toUpperCase()
}

function formatMessage(text) {
  if (!text) return ''
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
    .replace(/\n{2,}/g, '</p><p>')
}

const NAV = [
  { id: 'sources', label: 'My Sources' },
  { id: 'chat', label: 'Chat' },
  { id: 'studio', label: 'Studio' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
]

const STUDIO_TOOLS = [
  { type: 'summary', label: 'Summary', desc: 'Quick overview' },
  { type: 'test', label: 'Quiz', desc: 'Test your knowledge' },
  { type: 'cards', label: 'Flashcards', desc: 'For memorization' },
  { type: 'mindmap', label: 'Mind Map', desc: 'Visual structure' },
  { type: 'presentation', label: 'Presentation', desc: 'Slide deck' },
  { type: 'report', label: 'Report', desc: 'Deep analysis' },
]

const SUGGESTED = [
  'What were the main risks mentioned?',
  'Summarize the key findings',
  'What are the action items?',
]

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --void:#050810;
  --card:#0f1628;
  --rim:rgba(74,255,218,0.08);
  --rim2:rgba(255,255,255,0.05);
  --cyan:#4affda;
  --blue:#2eb8f0;
  --fg:#e8edff;
  --fg2:rgba(232,237,255,0.5);
  --fg3:rgba(232,237,255,0.2);
}
html,body,#root{height:100%;overflow:hidden;}
body{background:var(--void);color:var(--fg);font-family:'Outfit',sans-serif;}

/* STARS */
.stars{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;}
.star{position:absolute;border-radius:50%;background:#fff;animation:twinkle var(--d,3s) var(--delay,0s) infinite;}
@keyframes twinkle{0%,100%{opacity:var(--min,.1)}50%{opacity:var(--max,.8)}}

/* LAYOUT */
.db{position:relative;z-index:1;display:flex;height:100vh;}

/* OVERLAY for mobile */

/* SIDEBAR */
.sidebar{
  width:180px;flex-shrink:0;
  background:rgba(8,13,26,0.92);
  border-right:1px solid var(--rim2);
  display:flex;flex-direction:column;
  padding:20px 0;
  backdrop-filter:blur(20px);
  transition:transform .3s ease;
  z-index:200;
}
.sb-logo{
  padding:0 20px 24px;
  font-family:'DM Serif Display',serif;
  font-size:1.3rem;color:var(--fg);
  display:flex;align-items:center;gap:8px;
  border-bottom:1px solid var(--rim2);
  margin-bottom:16px;
}
.sb-close{
  display:none;margin-left:auto;background:none;border:none;
  color:var(--fg3);cursor:pointer;font-size:.9rem;padding:2px 4px;
}
@media(max-width:640px){.sb-close{display:block;}}
.sb-dot{
  width:8px;height:8px;border-radius:50%;
  background:var(--cyan);box-shadow:0 0 10px var(--cyan);
  animation:pulse 2s infinite;flex-shrink:0;
}
@keyframes pulse{0%,100%{box-shadow:0 0 6px var(--cyan)}50%{box-shadow:0 0 16px var(--cyan),0 0 24px rgba(74,255,218,0.3)}}

.nav-item{
  display:flex;align-items:center;
  padding:10px 20px;font-size:.82rem;font-weight:500;
  color:var(--fg3);cursor:pointer;transition:all .2s;
  border-left:2px solid transparent;letter-spacing:.02em;
  position:relative;z-index:1001;
}
.nav-item:hover{color:var(--fg2);background:rgba(74,255,218,0.04);}
.nav-item.active{color:var(--fg);background:rgba(74,255,218,0.08);border-left-color:var(--cyan);}

.sb-footer{margin-top:auto;padding:16px 20px;}
.sb-email{font-family:'JetBrains Mono',monospace;font-size:.62rem;color:var(--fg3);word-break:break-all;margin-bottom:10px;}
.sb-logout{
  width:100%;background:rgba(255,80,80,0.08);
  border:1px solid rgba(255,80,80,0.15);
  color:rgba(255,120,120,0.7);padding:7px;border-radius:6px;
  font-size:.75rem;cursor:pointer;transition:all .2s;font-family:'Outfit',sans-serif;
}
.sb-logout:hover{background:rgba(255,80,80,0.15);color:rgba(255,140,140,0.9);}

/* MOBILE TOPBAR */
.mob-bar{
  display:none;height:50px;flex-shrink:0;
  background:rgba(8,13,26,0.95);border-bottom:1px solid var(--rim2);
  align-items:center;padding:0 16px;gap:12px;
  position:sticky;top:0;z-index:50;
}
.mob-burger{
  background:none;border:1px solid var(--rim2);
  color:var(--fg2);width:34px;height:34px;border-radius:6px;
  cursor:pointer;font-size:1rem;
  display:flex;align-items:center;justify-content:center;
}
.mob-title{font-family:'DM Serif Display',serif;font-size:1rem;color:var(--fg);}

/* MAIN */
.main{flex:1;overflow:hidden;display:flex;flex-direction:column;min-width:0;}

/* VIEWS */
.view{flex:1;overflow-y:auto;padding:28px 24px;}
.view::-webkit-scrollbar{width:3px;}
.view::-webkit-scrollbar-thumb{background:var(--rim);}
.view-title{font-family:'DM Serif Display',serif;font-size:1.5rem;color:var(--fg);margin-bottom:6px;}
.view-sub{font-size:.82rem;color:var(--fg3);margin-bottom:24px;font-weight:300;}

/* SOURCE CARDS */
.src-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-bottom:24px;}

.src-card{
  background:var(--card);border:1px solid var(--rim2);
  border-radius:12px;padding:16px;
  cursor:pointer;transition:all .25s;position:relative;overflow:hidden;
}
.src-card::before{
  content:'';position:absolute;inset:0;
  background:linear-gradient(135deg,rgba(74,255,218,0.04),transparent);
  opacity:0;transition:opacity .25s;
}
.src-card:hover{border-color:rgba(74,255,218,0.2);transform:translateY(-2px);}
.src-card:hover::before{opacity:1;}
.src-card.selected{border-color:rgba(74,255,218,0.35);background:rgba(74,255,218,0.06);}

.src-card-top{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:10px;
}
.src-card-ext{
  font-family:'JetBrains Mono',monospace;font-size:.6rem;font-weight:500;
  color:var(--cyan);background:rgba(74,255,218,0.1);
  border:1px solid rgba(74,255,218,0.15);padding:3px 7px;border-radius:4px;
}
.src-card-check{
  width:18px;height:18px;border-radius:4px;
  border:1px solid var(--rim2);flex-shrink:0;
  display:flex;align-items:center;justify-content:center;font-size:.6rem;
  transition:all .2s;
}
.src-card.selected .src-card-check{background:var(--cyan);border-color:var(--cyan);color:#050810;}

.src-card-name{
  font-size:.8rem;font-weight:500;color:var(--fg);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  margin-bottom:6px;
  /* оставляем место чтобы кнопка не перекрывала */
  padding-right:0;
}
.src-card-meta{font-size:.7rem;color:var(--fg3);}
.src-card-indexed{color:var(--cyan);font-size:.68rem;}

/* Кнопка удаления — снизу карточки, не поверх текста */
.src-card-actions{
  display:flex;justify-content:flex-end;
  margin-top:10px;padding-top:8px;
  border-top:1px solid rgba(255,255,255,0.04);
  opacity:0;transition:opacity .2s;
}
.src-card:hover .src-card-actions{opacity:1;}
.src-card-del{
  background:rgba(255,80,80,0.1);border:1px solid rgba(255,80,80,0.15);
  color:rgba(255,100,100,0.7);padding:3px 10px;border-radius:4px;
  cursor:pointer;font-size:.7rem;transition:all .2s;
  font-family:'Outfit',sans-serif;
}
.src-card-del:hover{background:rgba(255,80,80,0.2);color:rgba(255,130,130,0.9);}

.btn-upload{
  display:inline-flex;align-items:center;gap:8px;
  background:rgba(74,255,218,0.08);border:1px solid rgba(74,255,218,0.2);
  color:var(--cyan);padding:10px 20px;border-radius:8px;
  font-size:.82rem;font-weight:600;cursor:pointer;
  transition:all .2s;font-family:'Outfit',sans-serif;
}
.btn-upload:hover{background:rgba(74,255,218,0.14);box-shadow:0 0 20px rgba(74,255,218,0.1);}

.src-empty-state{grid-column:1/-1;text-align:center;padding:48px 24px;color:var(--fg3);}
.src-empty-icon{font-size:2.5rem;margin-bottom:12px;opacity:.3;}
.src-empty-title{font-family:'DM Serif Display',serif;font-size:1.1rem;color:var(--fg2);margin-bottom:6px;}
.src-empty-sub{font-size:.8rem;font-weight:300;}

/* CHAT */
.chat-view{flex:1;display:flex;flex-direction:column;overflow:hidden;}
.chat-hdr{
  padding:14px 24px;border-bottom:1px solid var(--rim2);
  display:flex;align-items:center;gap:12px;flex-shrink:0;
}
.chat-hdr-title{font-family:'DM Serif Display',serif;font-size:1rem;color:var(--fg);}
.chat-hdr-cnt{
  font-family:'JetBrains Mono',monospace;font-size:.65rem;
  color:var(--cyan);background:rgba(74,255,218,0.1);
  padding:3px 8px;border-radius:10px;
}
.chat-msgs{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:14px;}
.chat-msgs::-webkit-scrollbar{width:3px;}
.chat-msgs::-webkit-scrollbar-thumb{background:var(--rim);}
.chat-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;}
.chat-empty-title{font-family:'DM Serif Display',serif;font-style:italic;font-size:1.3rem;color:var(--fg2);text-align:center;}
.suggestions{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-width:480px;}
.suggest-btn{
  background:var(--card);border:1px solid var(--rim2);
  padding:7px 14px;border-radius:20px;
  font-size:.78rem;color:var(--fg2);cursor:pointer;transition:all .2s;
}
.suggest-btn:hover{border-color:rgba(74,255,218,0.3);color:var(--fg);background:rgba(74,255,218,0.06);}

.msg{display:flex;gap:10px;max-width:680px;}
.msg.user{flex-direction:row-reverse;align-self:flex-end;}
.msg-av{
  width:26px;height:26px;border-radius:6px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  font-size:.58rem;font-weight:700;font-family:'JetBrains Mono',monospace;
}
.msg.user .msg-av{background:linear-gradient(135deg,var(--cyan),var(--blue));color:#050810;}
.msg.ai .msg-av{background:var(--card);border:1px solid var(--rim2);color:var(--cyan);}
.msg-bubble{padding:10px 14px;border-radius:10px;font-size:.875rem;max-width:520px;line-height:1.7;}
.msg.user .msg-bubble{background:rgba(74,255,218,0.08);border:1px solid rgba(74,255,218,0.15);color:var(--fg);}
.msg.ai .msg-bubble{background:var(--card);border:1px solid var(--rim2);color:var(--fg2);}
.msg-text p{margin-bottom:8px;}.msg-text p:last-child{margin-bottom:0;}
.msg-text strong{color:var(--fg);font-weight:600;}
.msg-text h3{font-family:'DM Serif Display',serif;color:var(--fg);margin:10px 0 4px;}
.msg-text li{margin-left:16px;margin-bottom:3px;}
.typing{display:flex;gap:4px;align-items:center;padding:2px 0;}
.typing span{width:5px;height:5px;border-radius:50%;background:var(--cyan);opacity:.3;animation:tp 1.2s infinite;}
.typing span:nth-child(2){animation-delay:.2s;}.typing span:nth-child(3){animation-delay:.4s;}
@keyframes tp{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}

.chat-in{padding:14px 24px;border-top:1px solid var(--rim2);flex-shrink:0;}
.chat-in-box{
  display:flex;align-items:flex-end;gap:10px;
  background:var(--card);border:1px solid var(--rim2);
  border-radius:10px;padding:10px 14px;transition:border-color .2s;
}
.chat-in-box:focus-within{border-color:rgba(74,255,218,0.25);}
.chat-in-box textarea{
  flex:1;background:none;border:none;outline:none;
  color:var(--fg);font-family:'Outfit',sans-serif;
  font-size:.875rem;font-weight:300;line-height:1.6;
  resize:none;min-height:22px;max-height:100px;
}
.chat-in-box textarea::placeholder{color:var(--fg3);}
.btn-send{
  width:32px;height:32px;border-radius:7px;flex-shrink:0;
  background:linear-gradient(135deg,#1a6b8a,var(--cyan));
  border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;
  transition:all .2s;
}
.btn-send:hover{transform:scale(1.08);box-shadow:0 0 14px rgba(74,255,218,0.3);}
.btn-send:disabled{opacity:.3;cursor:not-allowed;transform:none;}
.chat-in-meta{margin-top:6px;font-family:'JetBrains Mono',monospace;font-size:.65rem;color:var(--fg3);}
.chat-in-meta span{color:var(--cyan);}

/* STUDIO */
.studio-view{flex:1;overflow-y:auto;padding:28px 24px;}
.studio-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-bottom:20px;}
.st-card{
  background:var(--card);border:1px solid var(--rim2);
  border-radius:10px;padding:14px;cursor:pointer;
  transition:all .25s;text-align:left;font-family:'Outfit',sans-serif;
}
.st-card:hover{border-color:rgba(74,255,218,0.25);background:rgba(74,255,218,0.05);transform:translateY(-2px);}
.st-card.active{border-color:var(--cyan);background:rgba(74,255,218,0.08);}
.st-card-label{font-family:'DM Serif Display',serif;font-size:.9rem;color:var(--fg);display:block;margin-bottom:2px;}
.st-card-desc{font-size:.68rem;color:var(--fg3);font-weight:300;}
.studio-result-box{background:var(--card);border:1px solid var(--rim2);border-radius:12px;padding:18px;}
.studio-result-tag{font-family:'JetBrains Mono',monospace;font-size:.6rem;letter-spacing:2px;text-transform:uppercase;color:var(--cyan);margin-bottom:10px;display:block;}
.studio-result-text{font-size:.82rem;color:var(--fg2);line-height:1.8;white-space:pre-wrap;font-weight:300;}
.studio-empty{color:var(--fg3);font-size:.8rem;font-weight:300;text-align:center;padding:28px;}

.upload-progress{height:2px;background:linear-gradient(90deg,var(--cyan),var(--blue));animation:upbar 1.2s ease-in-out infinite;flex-shrink:0;}
@keyframes upbar{0%,100%{opacity:.4}50%{opacity:1}}

/* ── MOBILE ── */
@media(max-width:640px){
  .sidebar{
    position:fixed;left:0;top:0;bottom:0;
    transform:translateX(-100%);
    width:220px;
    z-index:1000;
  }
  .sidebar.open{transform:translateX(0);}
  .mob-bar{display:flex;}
  .src-grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));}
  .msg{max-width:100%;}
  .msg-bubble{max-width:100%;}
  .chat-msgs{padding:14px 14px;}
  .chat-in{padding:10px 14px;}
  .view{padding:20px 16px;}
}
`

function Stars() {
  const stars = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    x: Math.random() * 100, y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    delay: Math.random() * 4, dur: Math.random() * 3 + 2,
    min: Math.random() * 0.15, max: Math.random() * 0.6 + 0.3,
  }))
  return (
    <div className="stars">
      {stars.map(s => (
        <div key={s.id} className="star" style={{
          left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size,
          '--d': `${s.dur}s`, '--delay': `${s.delay}s`, '--min': s.min, '--max': s.max,
        }} />
      ))}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const msgsEndRef = useRef(null)

  const [activeNav, setActiveNav] = useState('sources')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sources, setSources] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [studioResult, setStudioResult] = useState(null)
  const [studioLoading, setStudioLoading] = useState(false)
  const [activeStudio, setActiveStudio] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => { loadSources() }, [])
  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const loadSources = async () => {
    try { setSources(await getSources()) } catch { }
  }

  const handleFiles = async (files) => {
    setUploading(true)
    for (const file of files) {
      try {
        const s = await uploadSource(file)
        setSources(p => [...p, s])
        setSelectedIds(p => [...p, s.id])
      } catch (err) { alert('Ошибка: ' + err.message) }
    }
    setUploading(false)
  }

  const handleSend = async (text) => {
    const msg = (text || input).trim()
    if (!msg || sending) return
    setInput('')
    setMessages(p => [...p, { role: 'user', text: msg }, { role: 'ai', text: null }])
    setSending(true)
    try {
      const res = await sendMessage(msg, selectedIds)
      setMessages(p => { const c = [...p]; c[c.length - 1] = { role: 'ai', text: res.answer }; return c })
    } catch (err) {
      setMessages(p => { const c = [...p]; c[c.length - 1] = { role: 'ai', text: '⚠️ ' + err.message }; return c })
    } finally { setSending(false) }
  }

  const handleStudio = async (type) => {
    if (!selectedIds.length) { alert('Select at least one source'); return }
    setActiveStudio(type); setStudioLoading(true); setStudioResult(null)
    try { setStudioResult(await generateArtifact(type, selectedIds)) }
    catch (err) { setStudioResult({ artifact_type: type, content: { error: err.message } }) }
    finally { setStudioLoading(false) }
  }

  const navTo = (id) => { setActiveNav(id); setSidebarOpen(false) }
  const email = localStorage.getItem('email') || ''

  return (
    <>
      <style>{css}</style>
      <Stars />

      <div className="db">
        {/* SIDEBAR */}
        <div className={`sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="sb-logo">
            <span className="sb-dot" />
            NEXUS
            <button className="sb-close" onClick={() => setSidebarOpen(false)}>✕</button>
          </div>
          {NAV.map(n => (
            <div key={n.id} className={`nav-item${activeNav === n.id ? ' active' : ''}`} onClick={() => navTo(n.id)}>
              {n.label}
            </div>
          ))}
          <div className="sb-footer">
            {email && <div className="sb-email">{email}</div>}
            <button className="sb-logout" onClick={() => { localStorage.clear(); navigate('/') }}>
              Sign out
            </button>
          </div>
        </div>

        {/* MAIN */}
        <div className="main">
          {/* Mobile topbar */}
          <div className="mob-bar">
            <button className="mob-burger" onClick={() => setSidebarOpen(v => !v)}>☰</button>
            <span className="mob-title">NEXUS</span>
          </div>

          {uploading && <div className="upload-progress" />}

          {/* SOURCES */}
          {activeNav === 'sources' && (
            <div className="view">
              <h1 className="view-title">My Sources</h1>
              <p className="view-sub">
                {selectedIds.length > 0
                  ? `${selectedIds.length} of ${sources.length} selected`
                  : `${sources.length} documents indexed`}
              </p>
              <div className="src-grid">
                {sources.length === 0 ? (
                  <div className="src-empty-state">
                    <div className="src-empty-icon">◈</div>
                    <div className="src-empty-title">No sources yet</div>
                    <div className="src-empty-sub">Upload documents to get started</div>
                  </div>
                ) : sources.map(s => (
                  <div
                    key={s.id}
                    className={`src-card${selectedIds.includes(s.id) ? ' selected' : ''}`}
                    onClick={() => setSelectedIds(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])}
                  >
                    <div className="src-card-top">
                      <span className="src-card-ext">{getFileExt(s.name)}</span>
                      <div className="src-card-check">{selectedIds.includes(s.id) && '✓'}</div>
                    </div>
                    <div className="src-card-name" title={s.name}>{getDisplayName(s.name)}</div>
                    <div className="src-card-meta">
                      <span className="src-card-indexed">✓ indexed</span>
                    </div>
                    {/* Кнопка удаления СНИЗУ — не перекрывает текст */}
                    <div className="src-card-actions">
                      <button
                        className="src-card-del"
                        onClick={e => {
                          e.stopPropagation()
                          deleteSource(s.id)
                          setSources(p => p.filter(x => x.id !== s.id))
                          setSelectedIds(p => p.filter(x => x !== s.id))
                        }}
                      >Remove</button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn-upload" onClick={() => setShowModal(true)}>
                + Add Sources
              </button>
            </div>
          )}

          {/* CHAT */}
          {activeNav === 'chat' && (
            <div className="chat-view">
              <div className="chat-hdr">
                <span className="chat-hdr-title">Chat</span>
                {selectedIds.length > 0 && (
                  <span className="chat-hdr-cnt">{selectedIds.length} sources</span>
                )}
              </div>
              <div className="chat-msgs">
                {messages.length === 0 ? (
                  <div className="chat-empty">
                    <p className="chat-empty-title">Ask anything about<br />your documents</p>
                    <div className="suggestions">
                      {SUGGESTED.map(s => (
                        <button key={s} className="suggest-btn" onClick={() => handleSend(s)}>{s}</button>
                      ))}
                    </div>
                  </div>
                ) : messages.map((m, i) => (
                  <div key={i} className={`msg ${m.role}`}>
                    <div className="msg-av">{m.role === 'user' ? 'ME' : '◈'}</div>
                    <div className="msg-bubble">
                      {m.text === null
                        ? <div className="typing"><span /><span /><span /></div>
                        : <div className="msg-text" dangerouslySetInnerHTML={{ __html: `<p>${formatMessage(m.text)}</p>` }} />
                      }
                    </div>
                  </div>
                ))}
                <div ref={msgsEndRef} />
              </div>
              <div className="chat-in">
                <div className="chat-in-box">
                  <textarea
                    placeholder="Ask a question... (Enter to send)"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    rows={1}
                    onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                  />
                  <button className="btn-send" onClick={() => handleSend()} disabled={sending || !input.trim()}>
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7h10M8 3l4 4-4 4" stroke="#050810" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
                <div className="chat-in-meta">
                  {selectedIds.length > 0
                    ? <><span>{selectedIds.length}</span> sources selected</>
                    : 'Go to My Sources to select documents'}
                </div>
              </div>
            </div>
          )}

          {/* STUDIO */}
          {activeNav === 'studio' && (
            <div className="studio-view">
              <h1 className="view-title">Studio</h1>
              <p className="view-sub">Generate content from your sources</p>
              <div className="studio-grid">
                {STUDIO_TOOLS.map(t => (
                  <button key={t.type} className={`st-card${activeStudio === t.type ? ' active' : ''}`} onClick={() => handleStudio(t.type)}>
                    <span className="st-card-label">{t.label}</span>
                    <span className="st-card-desc">{t.desc}</span>
                  </button>
                ))}
              </div>
              <div className="studio-result-box">
                {!studioResult
                  ? <div className="studio-empty">{studioLoading ? '⏳ Generating...' : 'Select sources and click a tool above'}</div>
                  : <>
                    <span className="studio-result-tag">{studioResult.artifact_type}</span>
                    <div className="studio-result-text">{JSON.stringify(studioResult.content, null, 2)}</div>
                  </>
                }
              </div>
            </div>
          )}

          {activeNav === 'history' && (
            <div className="view">
              <h1 className="view-title">History</h1>
              <p className="view-sub">Coming soon</p>
            </div>
          )}

          {activeNav === 'settings' && (
            <div className="view">
              <h1 className="view-title">Settings</h1>
              <p className="view-sub">Coming soon</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <UploadModal onClose={() => setShowModal(false)} onFiles={handleFiles} sourcesCount={sources.length} />
      )}
    </>
  )
}