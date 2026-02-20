import { useState, useRef } from 'react'

const ACCEPTED = [
  '.pdf','.txt','.md','.docx','.doc','.csv',
  '.png','.jpg','.jpeg','.webp','.avif','.gif','.bmp','.heic','.heif',
  '.mp4','.avi','.mov','.mpeg','.3gp',
  '.mp3','.wav','.ogg','.aac','.m4a','.aiff',
].join(',')

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&family=Space+Mono&display=swap');

  .um-overlay {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .um-modal {
    width: 100%; max-width: 560px;
    background: #0f1623;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 18px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 40px 80px rgba(0,0,0,0.7);
  }
  .um-close {
    position: absolute; top: 14px; right: 16px;
    background: none; border: none;
    color: rgba(240,242,255,0.4);
    font-size: 1.1rem; cursor: pointer;
    transition: color .2s; z-index: 1; line-height: 1;
  }
  .um-close:hover { color: #f0f2ff; }

  /* TITLE */
  .um-head {
    padding: 30px 28px 0;
    text-align: center;
  }
  .um-title {
    font-family: 'Inter', sans-serif;
    font-size: 1.1rem; font-weight: 400;
    color: #f0f2ff; line-height: 1.6; margin-bottom: 0;
  }
  .um-title em {
    font-style: normal;
    color: #4affda;
  }

  /* SEARCH */
  .um-search {
    margin: 20px 20px 0;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(74,255,218,0.3);
    border-radius: 10px;
    display: flex; align-items: center;
    overflow: hidden;
  }
  .um-search-icon {
    padding: 0 10px 0 14px;
    color: rgba(240,242,255,0.3); font-size: .85rem; flex-shrink: 0;
  }
  .um-search input {
    flex: 1; background: none; border: none; outline: none;
    color: #f0f2ff; font-family: 'Inter', sans-serif;
    font-size: .875rem; font-weight: 300; padding: 12px 0;
  }
  .um-search input::placeholder { color: rgba(240,242,255,0.2); }
  .um-search-right {
    display: flex; align-items: center; gap: 0;
    border-left: 1px solid rgba(255,255,255,0.07);
    padding: 6px 8px; gap: 6px;
  }
  .um-pill {
    display: flex; align-items: center; gap: 5px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 6px; padding: 5px 10px;
    font-family: 'Inter', sans-serif;
    font-size: .72rem; color: rgba(240,242,255,0.45);
    cursor: pointer; transition: all .2s; white-space: nowrap;
  }
  .um-pill:hover { color: #f0f2ff; background: rgba(255,255,255,0.1); }
  .um-arrow {
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.1);
    width: 30px; height: 30px; border-radius: 8px;
    color: rgba(240,242,255,0.5); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: .85rem; transition: all .2s; flex-shrink: 0;
  }
  .um-arrow:hover { background: rgba(74,255,218,0.15); color: #4affda; border-color: rgba(74,255,218,0.3); }

  /* BIG DROP BLOCK */
  .um-block {
    margin: 14px 20px 20px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    overflow: hidden;
  }

  .um-drop {
    padding: 36px 24px 28px;
    text-align: center;
    cursor: pointer;
    transition: background .2s;
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }
  .um-drop:hover, .um-drop.over {
    background: rgba(255,255,255,0.03);
  }
  .um-drop-title {
    font-family: 'Inter', sans-serif;
    font-size: 1rem; font-weight: 400;
    color: rgba(240,242,255,0.75); margin-bottom: 5px;
  }
  .um-drop-sub {
    font-size: .8rem; color: rgba(240,242,255,0.3); line-height: 1.6;
  }
  .um-drop-sub span {
    color: rgba(240,242,255,0.5);
    text-decoration: underline; text-underline-offset: 2px;
    cursor: pointer;
  }

  /* FOUR BUTTONS */
  .um-btns {
    display: flex;
  }
  .um-btn {
    flex: 1;
    background: transparent;
    border: none;
    border-right: 1px solid rgba(255,255,255,0.07);
    padding: 14px 8px;
    text-align: center; cursor: pointer;
    transition: background .2s; font-family: 'Inter', sans-serif;
    display: flex; flex-direction: row; align-items: center;
    justify-content: center; gap: 7px;
  }
  .um-btn:last-child { border-right: none; }
  .um-btn:hover { background: rgba(255,255,255,0.05); }
  .um-btn-icon { font-size: .9rem; flex-shrink: 0; }
  .um-btn-label { font-size: .78rem; color: rgba(240,242,255,0.55); white-space: nowrap; }

  /* FOOTER */
  .um-footer {
    display: flex; align-items: center; gap: 10px;
    padding: 0 20px 16px;
  }
  .um-track {
    flex: 1; height: 3px;
    background: rgba(255,255,255,0.06); border-radius: 2px; overflow: hidden;
  }
  .um-fill {
    height: 100%; background: #4affda;
    border-radius: 2px; transition: width .4s;
  }
  .um-count {
    font-family: 'Space Mono', monospace;
    font-size: .68rem; color: rgba(240,242,255,0.22);
  }
`

export default function UploadModal({ onClose, onFiles, sourcesCount = 0 }) {
  const fileRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const handle = (files) => {
    if (files?.length) { onFiles(Array.from(files)); onClose() }
  }

  return (
    <>
      <style>{css}</style>
      <input ref={fileRef} type="file" multiple accept={ACCEPTED}
        style={{display:'none'}} onChange={e => handle(e.target.files)} />

      <div className="um-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
        <div className="um-modal">
          <button className="um-close" onClick={onClose}>✕</button>

          <div className="um-head">
            <p className="um-title">
              Создавайте аудиопересказы и видеообзоры<br />
              на основе <em>ваших источников</em>
            </p>
          </div>

          <div className="um-search">
            <span className="um-search-icon">🔍</span>
            <input placeholder="Найдите новые источники в интернете" />
            <div className="um-search-right">
              <div className="um-pill">🌐 Интернет ▾</div>
              <div className="um-pill">✦ Быстрый поиск ▾</div>
              <button className="um-arrow">→</button>
            </div>
          </div>

          <div className="um-block">
            <div
              className={`um-drop${dragOver?' over':''}`}
              onClick={() => fileRef.current.click()}
              onDragOver={e=>{e.preventDefault();setDragOver(true)}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={e=>{e.preventDefault();setDragOver(false);handle(e.dataTransfer.files)}}
            >
              <div className="um-drop-title">Также можно перетащить файлы</div>
              <div className="um-drop-sub">
                PDF, изображения, документы, аудио{' '}
                <span onClick={e=>e.stopPropagation()}>и не только</span>
              </div>
            </div>

            <div className="um-btns">
              {[
                {icon:'⬆️', label:'Загрузить файлы',     fn:()=>fileRef.current.click()},
                {icon:'🔗', label:'Сайты',               fn:()=>alert('Скоро')},
                {icon:'☁️', label:'Диск',                fn:()=>alert('Скоро')},
                {icon:'📋', label:'Скопированный текст',  fn:()=>alert('Скоро')},
              ].map(b=>(
                <button key={b.label} className="um-btn" onClick={b.fn}>
                  <span className="um-btn-icon">{b.icon}</span>
                  <span className="um-btn-label">{b.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="um-footer">
            <div className="um-track">
              <div className="um-fill" style={{width:`${Math.min((sourcesCount/300)*100,100)}%`}}/>
            </div>
            <span className="um-count">{sourcesCount}/300</span>
          </div>
        </div>
      </div>
    </>
  )
}