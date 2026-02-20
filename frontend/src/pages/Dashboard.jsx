import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSources, uploadSource, deleteSource, sendMessage, generateArtifact } from '../lib/api'
import UploadModal from '../components/UploadModal'

function formatMessage(text) {
  if (!text) return ''
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
    .replace(/\n{2,}/g, '</p><p>')
}

function MessageBubble({ text }) {
  return (
    <div
      className="msg-text"
      dangerouslySetInnerHTML={{ __html: `<p>${formatMessage(text)}</p>` }}
    />
  )
}

function getFileIcon(name = '') {
  const ext = (name.split('.').pop() || '').toLowerCase()
  if (ext === 'pdf') return '📄'
  if (['doc','docx'].includes(ext)) return '📝'
  if (['jpg','jpeg','png','gif','webp','avif','bmp','heic'].includes(ext)) return '🖼️'
  if (['mp3','wav','ogg','aac','m4a'].includes(ext)) return '🎵'
  if (['mp4','avi','mov','mpeg'].includes(ext)) return '🎬'
  if (['csv','xlsx'].includes(ext)) return '📊'
  if (['txt','md'].includes(ext)) return '📃'
  return '📎'
}

// Берём только оригинальное имя файла без uuid-префиксов
function getDisplayName(name = '') {
  // Supabase иногда добавляет uuid_ спереди — убираем
  const parts = name.split('/')
  const filename = parts[parts.length - 1]
  // Убираем uuid- префикс типа "abc123-filename.pdf"
  const clean = filename.replace(/^[a-f0-9\-]{36}_?/i, '')
  return clean || filename
}

const STUDIO_TOOLS = [
  { type: 'audio',        label: 'Аудиопересказ',    sub: 'Подкаст из документа' },
  { type: 'video',        label: 'Видеопересказ',     sub: 'Видеообзор материала' },
  { type: 'mindmap',      label: 'Ментальная карта',  sub: 'Структура знаний' },
  { type: 'test',         label: 'Тест',              sub: 'Вопросы и ответы' },
  { type: 'cards',        label: 'Карточки',          sub: 'Для запоминания' },
  { type: 'summary',      label: 'Резюме',            sub: 'Краткое изложение' },
  { type: 'presentation', label: 'Презентация',       sub: 'Слайды по теме' },
  { type: 'infographic',  label: 'Инфографика',       sub: 'Визуальная схема' },
  { type: 'report',       label: 'Отчёт',             sub: 'Подробный анализ' },
]

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=Inter:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');

  *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:      #060a14;
    --bg2:     #090e1c;
    --bg3:     #0d1426;
    --border:  rgba(255,255,255,0.07);
    --accent:  #4affda;
    --accent2: #2eb8f0;
    --fg:      #f0f2ff;
    --fg2:     rgba(240,242,255,0.55);
    --fg3:     rgba(240,242,255,0.22);
    --glow:    rgba(74,255,218,0.15);
  }
  html, body, #root { height: 100%; }
  body { background: var(--bg); color: var(--fg); font-family: 'Inter', sans-serif; overflow: hidden; }

  /* ── TOPBAR ── */
  .tb {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 22px; height: 52px;
    border-bottom: 1px solid var(--border);
    background: var(--bg2);
    flex-shrink: 0;
  }
  .tb-logo {
    font-family: 'Syne', sans-serif;
    font-size: 22px; font-weight: 900;
    letter-spacing: 0.15em;
    color: #ffffff; cursor: pointer;
    display: flex; align-items: center; gap: 8px;
    text-decoration: none;
  }
  .tb-logo-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: linear-gradient(135deg, #4affda, #2eb8f0);
    box-shadow: 0 0 8px rgba(74,255,218,0.6);
  }
  .tb-right { display: flex; align-items: center; gap: 10px; }
  .tb-email { font-size: .75rem; color: var(--fg3); font-family: 'Space Mono', monospace; }
  .tb-logout {
    background: transparent; border: 1px solid var(--border);
    color: var(--fg2); padding: 6px 14px; border-radius: 4px;
    font-size: .78rem; cursor: pointer; transition: all .2s;
    font-family: 'Inter', sans-serif;
  }
  .tb-logout:hover { border-color: rgba(255,80,80,.4); color: rgba(255,120,120,.9); }

  /* ── LAYOUT ── */
  .db { display: flex; flex-direction: column; height: 100vh; }
  .db-cols { display: flex; flex: 1; overflow: hidden; }
  .col { display: flex; flex-direction: column; overflow: hidden; position: relative; }

  /* ── SOURCES COL ── */
  .col-sources {
    width: 260px; min-width: 160px; max-width: 420px;
    border-right: 1px solid var(--border);
    background: var(--bg2);
  }
  .col-hdr {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    font-family: 'Space Mono', monospace;
    font-size: .62rem; letter-spacing: 2px; text-transform: uppercase;
    color: var(--fg3);
    display: flex; align-items: center; justify-content: space-between;
    flex-shrink: 0;
  }
  .col-hdr-cnt { color: var(--accent); }

  .btn-add-src {
    margin: 10px 12px;
    background: rgba(74,255,218,0.07);
    border: 1px solid rgba(74,255,218,0.2);
    color: var(--accent);
    padding: 9px 14px; border-radius: 6px;
    font-size: .8rem; font-weight: 600; cursor: pointer;
    transition: all .2s; font-family: 'Inter', sans-serif;
    display: flex; align-items: center; gap: 8px;
    width: calc(100% - 24px);
  }
  .btn-add-src:hover {
    background: rgba(74,255,218,0.13);
    box-shadow: 0 0 20px rgba(74,255,218,0.1);
  }
  .btn-add-src:disabled { opacity: .5; cursor: not-allowed; }

  .upload-bar {
    height: 2px; flex-shrink: 0;
    background: linear-gradient(90deg, #4affda, #2eb8f0);
    animation: upbar 1.2s ease-in-out infinite;
  }
  @keyframes upbar { 0%,100%{opacity:.4} 50%{opacity:1} }

  .src-list { flex: 1; overflow-y: auto; padding: 4px 0; }
  .src-list::-webkit-scrollbar { width: 3px; }
  .src-list::-webkit-scrollbar-thumb { background: var(--border); }

  .src-item {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px; cursor: pointer; transition: background .15s;
  }
  .src-item:hover { background: rgba(74,255,218,0.03); }
  .src-cb {
    width: 14px; height: 14px; border-radius: 3px;
    border: 1px solid var(--border); cursor: pointer;
    accent-color: var(--accent); flex-shrink: 0;
  }
  .src-icon { font-size: .82rem; flex-shrink: 0; }
  .src-name {
    font-size: .78rem; color: var(--fg2); flex: 1;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .src-del {
    background: none; border: none; color: var(--fg3);
    cursor: pointer; font-size: .75rem; padding: 2px 4px;
    opacity: 0; transition: opacity .15s;
  }
  .src-item:hover .src-del { opacity: 1; }
  .src-del:hover { color: rgba(255,100,100,.8); }

  .src-empty {
    padding: 32px 16px; text-align: center;
    color: var(--fg3); font-size: .78rem; line-height: 1.8; font-weight: 300;
  }
  .src-empty-icon { font-size: 1.8rem; display: block; margin-bottom: 10px; opacity: .35; }

  /* ── RESIZER ── */
  .resizer {
    width: 4px; cursor: col-resize;
    background: transparent; transition: background .2s;
    position: absolute; top: 0; bottom: 0; z-index: 10;
  }
  .resizer:hover { background: rgba(74,255,218,0.35); }
  .resizer-r { right: -2px; }
  .resizer-l { left: -2px; }

  /* ── CHAT COL ── */
  .col-chat { flex: 1; min-width: 300px; background: var(--bg); }

  .chat-msgs {
    flex: 1; overflow-y: auto;
    padding: 24px 32px;
    display: flex; flex-direction: column; gap: 18px;
  }
  .chat-msgs::-webkit-scrollbar { width: 3px; }
  .chat-msgs::-webkit-scrollbar-thumb { background: var(--border); }

  .chat-empty {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    color: var(--fg3); text-align: center; gap: 12px;
  }
  .chat-empty-icon { font-size: 2.5rem; opacity: .25; }
  .chat-empty h3 {
    font-family: 'Syne', sans-serif;
    font-size: 1.05rem; font-weight: 700;
    letter-spacing: 0.05em; color: var(--fg2);
  }
  .chat-empty p { font-size: .82rem; max-width: 280px; line-height: 1.75; font-weight: 300; }

  .msg { display: flex; gap: 10px; max-width: 720px; }
  .msg.user { flex-direction: row-reverse; align-self: flex-end; }
  .msg-av {
    width: 28px; height: 28px; border-radius: 4px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: .68rem; font-weight: 700;
    font-family: 'Space Mono', monospace;
  }
  .msg.user .msg-av { background: linear-gradient(135deg,#4affda,#2eb8f0); color: #060a14; }
  .msg.ai .msg-av { background: var(--bg3); border: 1px solid var(--border); color: var(--accent); }

  .msg-bubble {
    padding: 11px 15px; border-radius: 8px;
    font-size: .875rem; max-width: 540px;
  }
  .msg.user .msg-bubble {
    background: rgba(74,255,218,0.08);
    border: 1px solid rgba(74,255,218,0.15);
    color: var(--fg);
  }
  .msg.ai .msg-bubble {
    background: var(--bg3); border: 1px solid var(--border); color: var(--fg2);
  }
  .msg-text p { margin-bottom: 10px; line-height: 1.78; }
  .msg-text p:last-child { margin-bottom: 0; }
  .msg-text h1,.msg-text h2,.msg-text h3 {
    font-family: 'Syne', sans-serif; font-weight: 700;
    color: var(--fg); margin: 14px 0 6px;
  }
  .msg-text h3 { font-size: .95rem; letter-spacing: .03em; }
  .msg-text ul { padding-left: 18px; margin: 6px 0; }
  .msg-text li { margin-bottom: 5px; line-height: 1.7; }
  .msg-text strong { color: var(--fg); font-weight: 600; }
  .msg-text em { color: var(--accent); font-style: italic; }

  .typing { display: flex; gap: 4px; align-items: center; padding: 3px 0; }
  .typing span {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--accent); opacity: .4;
    animation: tp 1.2s infinite;
  }
  .typing span:nth-child(2) { animation-delay: .2s; }
  .typing span:nth-child(3) { animation-delay: .4s; }
  @keyframes tp { 0%,100%{opacity:.3;transform:translateY(0)} 50%{opacity:1;transform:translateY(-3px)} }

  /* CHAT INPUT */
  .chat-in-wrap {
    padding: 12px 28px 16px;
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }
  .chat-in-box {
    display: flex; align-items: flex-end; gap: 10px;
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: 8px; padding: 10px 14px;
    transition: border-color .2s;
  }
  .chat-in-box:focus-within { border-color: rgba(74,255,218,0.3); }
  .chat-in-box textarea {
    flex: 1; background: none; border: none; outline: none;
    color: var(--fg); font-family: 'Inter', sans-serif;
    font-size: .875rem; font-weight: 300;
    line-height: 1.6; resize: none;
    min-height: 22px; max-height: 120px;
  }
  .chat-in-box textarea::placeholder { color: var(--fg3); }
  .chat-in-meta {
    display: flex; align-items: center; margin-top: 6px; padding: 0 2px;
  }
  .chat-src-info {
    font-size: .72rem; color: var(--fg3);
    font-family: 'Space Mono', monospace;
  }
  .chat-src-info span { color: var(--accent); }
  .btn-send {
    width: 32px; height: 32px; border-radius: 6px;
    background: linear-gradient(135deg, #1A6B8A, #4affda);
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all .2s; flex-shrink: 0;
  }
  .btn-send:hover { transform: scale(1.07); box-shadow: 0 0 16px var(--glow); }
  .btn-send:disabled { opacity: .35; cursor: not-allowed; transform: none; }

  /* ── STUDIO COL ── */
  .col-studio {
    width: 240px; min-width: 160px; max-width: 400px;
    border-left: 1px solid var(--border);
    background: var(--bg2);
  }

  .studio-tools { overflow-y: auto; flex-shrink: 0; }
  .studio-tools::-webkit-scrollbar { width: 3px; }

  .st-btn {
    width: 100%; display: flex; align-items: center;
    padding: 0; background: transparent;
    border: none; border-bottom: 1px solid rgba(255,255,255,0.04);
    cursor: pointer; transition: background .2s;
    text-align: left; position: relative; overflow: hidden;
  }
  .st-btn::before {
    content: '';
    position: absolute; left: 0; top: 0; bottom: 0; width: 2px;
    background: linear-gradient(to bottom, #4affda, #2eb8f0);
    opacity: 0; transition: opacity .25s;
  }
  .st-btn:hover { background: rgba(74,255,218,0.04); }
  .st-btn:hover::before { opacity: 1; }
  .st-btn.active { background: rgba(74,255,218,0.07); }
  .st-btn.active::before { opacity: 1; }

  .st-inner { padding: 12px 14px; flex: 1; }
  .st-label {
    font-family: 'Syne', sans-serif;
    font-size: .92rem; font-weight: 700;
    letter-spacing: 0.03em;
    color: var(--fg2); display: block; line-height: 1.2;
    transition: color .2s;
  }
  .st-btn:hover .st-label, .st-btn.active .st-label { color: var(--fg); }
  .st-sub {
    font-family: 'Inter', sans-serif;
    font-size: .68rem; font-weight: 300;
    color: var(--fg3); display: block; margin-top: 2px;
    transition: color .2s;
  }
  .st-btn:hover .st-sub { color: rgba(240,242,255,.4); }

  .studio-out {
    flex: 1; overflow-y: auto;
    padding: 14px; border-top: 1px solid var(--border);
  }
  .studio-out::-webkit-scrollbar { width: 3px; }
  .studio-out-empty {
    color: var(--fg3); font-size: .75rem;
    line-height: 1.8; text-align: center;
    padding-top: 20px; font-weight: 300;
  }
  .studio-result-tag {
    font-family: 'Space Mono', monospace;
    font-size: .6rem; letter-spacing: 2px;
    text-transform: uppercase; color: var(--accent);
    margin-bottom: 10px; display: block;
  }
  .studio-result {
    font-size: .78rem; color: var(--fg2);
    line-height: 1.75; white-space: pre-wrap; font-weight: 300;
  }
`

export default function Dashboard() {
  const navigate = useNavigate()
  const msgsEndRef = useRef(null)
  const sourcesColRef = useRef(null)
  const studioColRef = useRef(null)

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
    try { setSources(await getSources()) } catch {}
  }

  // ── RESIZE ──
  const startResize = (colRef, side) => (e) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = colRef.current.offsetWidth
    const onMove = (ev) => {
      const delta = side === 'right' ? ev.clientX - startX : startX - ev.clientX
      colRef.current.style.width = Math.min(Math.max(startW + delta, 160), 500) + 'px'
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ── UPLOAD ──
  const handleFiles = async (files) => {
    setUploading(true)
    for (const file of files) {
      try {
        const s = await uploadSource(file)
        // s.name должно быть оригинальным именем файла из бэкенда
        setSources(p => [...p, s])
        setSelectedIds(p => [...p, s.id])
      } catch (err) { alert('Ошибка: ' + err.message) }
    }
    setUploading(false)
  }

  // ── CHAT ──
  const handleSend = async () => {
    if (!input.trim() || sending) return
    const text = input.trim(); setInput('')
    setMessages(p => [...p, { role: 'user', text }, { role: 'ai', text: null }])
    setSending(true)
    try {
      const res = await sendMessage(text, selectedIds)
      setMessages(p => { const c=[...p]; c[c.length-1]={role:'ai',text:res.answer}; return c })
    } catch (err) {
      setMessages(p => { const c=[...p]; c[c.length-1]={role:'ai',text:'⚠️ '+err.message}; return c })
    } finally { setSending(false) }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // ── STUDIO ──
  const handleStudio = async (type) => {
    if (!selectedIds.length) { alert('Выберите хотя бы один источник'); return }
    setActiveStudio(type); setStudioLoading(true); setStudioResult(null)
    try { setStudioResult(await generateArtifact(type, selectedIds)) }
    catch (err) { setStudioResult({ artifact_type: type, content: { error: err.message } }) }
    finally { setStudioLoading(false) }
  }

  const email = localStorage.getItem('email') || ''

  return (
    <>
      <style>{css}</style>

      <div className="db">
        {/* TOPBAR */}
        <div className="tb">
          <a href="/" className="tb-logo">
            <span className="tb-logo-dot" />
            NEXUS
          </a>
          <div className="tb-right">
            {email && <span className="tb-email">{email}</span>}
            <button className="tb-logout" onClick={() => { localStorage.clear(); navigate('/') }}>
              Выйти
            </button>
          </div>
        </div>

        <div className="db-cols">

          {/* ── SOURCES ── */}
          <div className="col col-sources" ref={sourcesColRef}>
            <div className="col-hdr">
              <span>Источники</span>
              <span className="col-hdr-cnt">{sources.length}/300</span>
            </div>
            <button className="btn-add-src" onClick={() => setShowModal(true)} disabled={uploading}>
              {uploading ? '⏳ Загружаем...' : '＋  Добавить источники'}
            </button>
            {uploading && <div className="upload-bar" />}
            <div className="src-list">
              {sources.length === 0 ? (
                <div className="src-empty">
                  <span className="src-empty-icon">📂</span>
                  Загрузите PDF, Word,<br />изображения или аудио
                </div>
              ) : sources.map(s => (
                <div
                  className="src-item" key={s.id}
                  onClick={() => setSelectedIds(p =>
                    p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id]
                  )}
                >
                  <input
                    type="checkbox" className="src-cb"
                    checked={selectedIds.includes(s.id)}
                    onChange={() => {}}
                    onClick={e => e.stopPropagation()}
                  />
                  <span className="src-icon">{getFileIcon(s.name)}</span>
                  <span className="src-name" title={s.name}>
                    {getDisplayName(s.name)}
                  </span>
                  <button
                    className="src-del"
                    onClick={e => {
                      e.stopPropagation()
                      deleteSource(s.id)
                      setSources(p => p.filter(x => x.id !== s.id))
                      setSelectedIds(p => p.filter(x => x !== s.id))
                    }}
                  >✕</button>
                </div>
              ))}
            </div>
            <div className="resizer resizer-r" onMouseDown={startResize(sourcesColRef, 'right')} />
          </div>

          {/* ── CHAT ── */}
          <div className="col col-chat">
            <div className="col-hdr"><span>Чат</span></div>
            <div className="chat-msgs">
              {messages.length === 0 ? (
                <div className="chat-empty">
                  <span className="chat-empty-icon">◈</span>
                  <h3>Начните разговор</h3>
                  <p>Загрузите источники слева и задайте вопрос по их содержимому</p>
                </div>
              ) : messages.map((m, i) => (
                <div key={i} className={`msg ${m.role}`}>
                  <div className="msg-av">{m.role === 'user' ? 'ME' : '◈'}</div>
                  <div className="msg-bubble">
                    {m.text === null
                      ? <div className="typing"><span/><span/><span/></div>
                      : <MessageBubble text={m.text} />
                    }
                  </div>
                </div>
              ))}
              <div ref={msgsEndRef} />
            </div>
            <div className="chat-in-wrap">
              <div className="chat-in-box">
                <textarea
                  placeholder="Задайте вопрос по документам... (Enter — отправить)"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  onInput={e => {
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                  }}
                />
                <button className="btn-send" onClick={handleSend} disabled={sending || !input.trim()}>
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7h10M8 3l4 4-4 4" stroke="#060a14" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <div className="chat-in-meta">
                <span className="chat-src-info">
                  {selectedIds.length > 0
                    ? <><span>{selectedIds.length}</span> источн. выбрано</>
                    : 'Выберите источники слева'}
                </span>
              </div>
            </div>
          </div>

          {/* ── STUDIO ── */}
          <div className="col col-studio" ref={studioColRef}>
            <div className="resizer resizer-l" onMouseDown={startResize(studioColRef, 'left')} />
            <div className="col-hdr"><span>Студия</span></div>
            <div className="studio-tools">
              {STUDIO_TOOLS.map(t => (
                <button
                  key={t.type}
                  className={`st-btn${activeStudio === t.type ? ' active' : ''}`}
                  onClick={() => handleStudio(t.type)}
                >
                  <div className="st-inner">
                    <span className="st-label">{t.label}</span>
                    <span className="st-sub">{t.sub}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="studio-out">
              {!studioResult ? (
                <div className="studio-out-empty">
                  {studioLoading ? '⏳ Генерируем...' : 'Выберите источники и нажмите инструмент'}
                </div>
              ) : (
                <div className="studio-result">
                  <span className="studio-result-tag">{studioResult.artifact_type}</span>
                  {JSON.stringify(studioResult.content, null, 2)}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {showModal && (
        <UploadModal
          onClose={() => setShowModal(false)}
          onFiles={handleFiles}
          sourcesCount={sources.length}
        />
      )}
    </>
  )
}