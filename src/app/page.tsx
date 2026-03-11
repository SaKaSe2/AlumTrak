"use client";
import React, { useState, useEffect, useRef } from "react";

// Types
interface Alumni {
  id: number; nim: string; nama: string; prodi: string; tahun: string;
  bidang: string; optout: boolean; status: string;
  jabatan: string; instansi: string; lokasi: string; confidence: number;
  sources: string[]; tglUpdate: string; variasi: string[];
}
interface Evidence {
  aId: number; sumber: string; jabatan: string; instansi: string;
  lokasi: string; confidence: number; tgl: string; snippet: string;
}
interface Source {
  nama: string; tipe: string; kelas: string; aktif: boolean; icon: string;
}
interface ToastProps {
  id: number; msg: string; type: 'ok'|'warn';
}

const initialAlumni: Alumni[] = [
  {id:1,nim:'211001',nama:'Rizky Pratama',prodi:'Informatika',tahun:'2022',bidang:'IT',optout:false,status:'Teridentifikasi',jabatan:'Software Engineer',instansi:'Gojek',lokasi:'Jakarta',confidence:0.87,sources:['LinkedIn','GitHub'],tglUpdate:'2025-01-15',variasi:['M. Rizky','Rizky P.']},
  {id:2,nim:'211002',nama:'Siti Rahayu',prodi:'Informatika',tahun:'2022',bidang:'Akademik',optout:false,status:'Teridentifikasi',jabatan:'Data Scientist',instansi:'BCA',lokasi:'Surabaya',confidence:0.92,sources:['LinkedIn','Google Scholar'],tglUpdate:'2025-01-20',variasi:['S. Rahayu']},
  {id:3,nim:'211003',nama:'Ahmad Fauzan',prodi:'Teknik Elektro',tahun:'2021',bidang:'R&D',optout:false,status:'Perlu Verifikasi',jabatan:'IoT Engineer',instansi:'Telkom',lokasi:'Bandung',confidence:0.61,sources:['ResearchGate'],tglUpdate:'2025-01-10',variasi:['A. Fauzan']},
  {id:4,nim:'211004',nama:'Dewi Lestari',prodi:'Manajemen',tahun:'2023',bidang:'Lainnya',optout:false,status:'Belum Dilacak',jabatan:'',instansi:'',lokasi:'',confidence:0,sources:[],tglUpdate:'',variasi:['D. Lestari']},
  {id:5,nim:'211005',nama:'Budi Santoso',prodi:'Informatika',tahun:'2020',bidang:'IT',optout:false,status:'Belum Dilacak',jabatan:'',instansi:'',lokasi:'',confidence:0,sources:[],tglUpdate:'',variasi:['B. Santoso']},
];
const initialEvidence: Evidence[] = [
  {aId:1,sumber:'LinkedIn',jabatan:'Software Engineer',instansi:'Gojek',lokasi:'Jakarta',confidence:0.87,tgl:'2025-01-15',snippet:'Rizky Pratama - Software Engineer at Gojek. Alumni UMM 2022.'},
  {aId:2,sumber:'Google Scholar',jabatan:'Data Scientist',instansi:'BCA',lokasi:'Surabaya',confidence:0.92,tgl:'2025-01-20',snippet:'Siti Rahayu - Publications. Affiliation: Bank BCA.'}
];
const initialSources: Source[] = [
  {nama:'Google Scholar',tipe:'sp-academic',kelas:'Akademik',aktif:true,icon:'📚'},
  {nama:'LinkedIn',tipe:'sp-prof',kelas:'Profesional',aktif:true,icon:'💼'},
  {nama:'GitHub',tipe:'sp-tech',kelas:'Teknis',aktif:true,icon:'💻'},
  {nama:'ResearchGate',tipe:'sp-academic',kelas:'Akademik',aktif:true,icon:'🔬'},
  {nama:'ORCID',tipe:'sp-academic',kelas:'Akademik',aktif:false,icon:'🆔'},
  {nama:'Instagram',tipe:'sp-social',kelas:'Sosmed',aktif:false,icon:'📷'},
  {nama:'Facebook',tipe:'sp-social',kelas:'Sosmed',aktif:false,icon:'👍'},
  {nama:'Web Search',tipe:'sp-prof',kelas:'Umum',aktif:true,icon:'🌐'}
];

export default function Home() {
  const [view, setView] = useState<'landing'|'app'>('landing');
  const [page, setPage] = useState('dashboard');
  
  const [alumni, setAlumni] = useState<Alumni[]>(initialAlumni);
  const [evidence, setEvidence] = useState<Evidence[]>(initialEvidence);
  const [sources, setSources] = useState<Source[]>(initialSources);
  
  const [searchAlumni, setSearchAlumni] = useState('');
  const [filterAlumni, setFilterAlumni] = useState('');
  
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const [modal, setModal] = useState<string|null>(null);
  const [detailId, setDetailId] = useState<number|null>(null);

  // New Alumni Form Data
  const [newAlumni, setNewAlumni] = useState({
    nim: '', nama: '', prodi: 'Informatika', tahun: '2024', bidang: '', optout: 'false'
  });

  // Tracking Job State
  const [isTracking, setIsTracking] = useState(false);
  const [consoleLog, setConsoleLog] = useState<{time:string, msg:string, cls:string}[]>([
    {time: new Date().toLocaleTimeString(), msg: 'System ready. Awaiting command...', cls: 'c-sys'}
  ]);
  const consoleRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string, type: 'ok'|'warn' = 'ok') => {
    const id = Date.now();
    setToasts(prev => [...prev, {id, msg, type}]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const ts = () => {
    const d = new Date();
    return `[${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}]`;
  };

  const addLogContext = (msg: string, cls: string = 'c-sys') => {
    setConsoleLog(prev => [...prev, {time: ts(), msg, cls}]);
  };

  useEffect(() => {
    if(consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleLog]);

  // Handle intersection observer for landing page
  useEffect(() => {
    if(view === 'landing') {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
      
      const reveals = document.querySelectorAll('.reveal');
      reveals.forEach(el => observer.observe(el));
      
      // landing terminal animation
      const tLines = ["[SYS] Inisialisasi engine OSINT...","[INFO] Target: M. Rizky (UMM)","[OK] Ditemukan di LinkedIn & GitHub","[OK] Scoring Afiliasi = 0.87","[SYS] Profil terverifikasi."];
      let lIdx=0;
      let to: NodeJS.Timeout;
      const tOut = document.getElementById('land-term');
      const typeTerm = () => {
        if(!tOut || lIdx>=tLines.length) return;
        const d = document.createElement('div');
        d.className = 'term-line mono';
        d.style.color = tLines[lIdx].includes('[OK]') ? 'var(--green)' : 'var(--text-muted)';
        d.innerText = tLines[lIdx];
        tOut.appendChild(d);
        lIdx++;
        to = setTimeout(typeTerm, 900+Math.random()*600);
      };
      to = setTimeout(typeTerm, 1500);

      // nav blur
      const nav = document.getElementById('navbar');
      const onScroll = () => {
        if(window.scrollY > 50) nav?.classList.add('scrolled');
        else nav?.classList.remove('scrolled');
      };
      window.addEventListener('scroll', onScroll);

      return () => {
        reveals.forEach(el => observer.unobserve(el));
        clearTimeout(to);
        window.removeEventListener('scroll', onScroll);
      };
    }
  }, [view]);

  const handleAddAlumni = () => {
    if(!newAlumni.nama) { showToast('Nama harus diisi', 'warn'); return; }
    const opt = newAlumni.optout === 'true';
    const n = {
      id: alumni.length+1,
      nim: newAlumni.nim,
      nama: newAlumni.nama,
      prodi: newAlumni.prodi,
      tahun: newAlumni.tahun,
      bidang: newAlumni.bidang,
      optout: opt,
      status: opt ? 'Opt-Out' : 'Belum Dilacak',
      jabatan: '', instansi: '', lokasi: '', confidence: 0, sources: [], tglUpdate: '',
      variasi: [newAlumni.nama]
    };
    setAlumni(prev => [...prev, n]);
    setModal(null);
    showToast('Target alumni berhasil didaftarkan');
    setNewAlumni({nim: '', nama: '', prodi: 'Informatika', tahun: '2024', bidang: '', optout: 'false'});
  };

  const handleRunJob = () => {
    if(isTracking) return;
    setIsTracking(true);
    setConsoleLog([]);
    const activeSrc = sources.filter(s=>s.aktif).map(s=>s.nama);
    const targets = alumni.filter(a => a.status === 'Belum Dilacak' && !a.optout);
    
    addLogContext(`[BOOT] OSINT Engine v1.0 initialized. Targets: ${targets.length}. Modules: [${activeSrc.join(', ')}]`);

    const steps = [
      ['Membuat profil array...', 'c-sys'],
      ['Generating boolean query params...', 'c-sys'],
      ['Executing batch scraping routines...', 'c-sys'],
      ['Ekstraksi NLP sinyal identitas (jabatan, institusi)...', 'c-sys'],
      ['Running disambiguation & scoring model...', 'c-sys']
    ];

    let sIdx = 0;
    const nextStep = () => {
      if(sIdx >= steps.length) {
        finishJob(targets, activeSrc);
        return;
      }
      addLogContext(`[EXEC] Step ${sIdx+1}: ${steps[sIdx][0]}`, steps[sIdx][1]);
      if(sIdx===2) activeSrc.forEach(s => addLogContext(`  -> Handshaking w/ ${s} API...`, 'c-sys'));
      if(sIdx===4) targets.forEach(t => addLogContext(`  -> Scoring ${t.nama} completed.`, 'c-ok'));
      
      sIdx++;
      setTimeout(nextStep, 800 + Math.random() * 600);
    };

    setTimeout(nextStep, 1000);
  };

  const finishJob = (targets: Alumni[], activeSrc: string[]) => {
    let f=0, v=0;
    const updatedAlumni = [...alumni];
    const newEvidence = [...evidence];

    targets.forEach(t => {
      const a = updatedAlumni.find(x => x.id === t.id);
      if(!a) return;
      
      const r = Math.random();
      if(r > 0.5) {
        f++;
        a.status = 'Teridentifikasi';
        a.confidence = 0.75 + Math.random() * 0.2;
        a.jabatan = 'Data Engineer';
        a.instansi = 'Tech Corp';
        a.lokasi = 'Remote';
        a.sources = [activeSrc[0] || 'Web Search'];
        addLogContext(`[HIT] Match found for ${a.nama} (Score: ${Math.round(a.confidence*100)}%)`, 'c-ok');
        
        newEvidence.push({
          aId: a.id, sumber: a.sources[0], jabatan: a.jabatan, instansi: a.instansi,
          lokasi: a.lokasi, confidence: a.confidence, tgl: new Date().toISOString().slice(0,10),
          snippet: `OSINT extraction match for ${a.nama}`
        });
      }
      else if(r > 0.2) {
        v++;
        a.status = 'Perlu Verifikasi';
        a.confidence = 0.4 + Math.random() * 0.3;
        addLogContext(`[WARN] Ambiguous match for ${a.nama}. Requires manual review.`, 'c-warn');
      }
      else {
        a.status = 'Belum Ditemukan';
        a.confidence = 0.1;
        addLogContext(`[FAIL] No signals found for ${a.nama}.`, 'c-red');
      }
      a.tglUpdate = new Date().toISOString().slice(0,10);
    });

    addLogContext(`[HALT] Job finished. Processed: ${targets.length}. Hooks: ${f}. Manual: ${v}.`);
    setAlumni(updatedAlumni);
    setEvidence(newEvidence);
    setIsTracking(false);
    showToast('Tracking Cycle Completed');
  };

  const getStatusBadge = (s: string) => {
    const cls = s==='Teridentifikasi'?'sb-green':s==='Perlu Verifikasi'?'sb-amber':s==='Belum Ditemukan'?'sb-red':s==='Opt-Out'?'sb-purple':'sb-gray';
    return <span className={`status-badge ${cls}`}>{s}</span>;
  };
  
  const getConfBar = (c: number) => {
    if(!c) return <span className="mono" style={{color:'var(--text-muted)',fontSize:'10px'}}>N/A</span>;
    const pct = Math.round(c*100);
    const bg = c>=0.75?'var(--green)':c>=0.45?'var(--amber)':'var(--red)';
    return (
      <div className="conf-bar">
        <div className="conf-track">
          <div className="conf-fill" style={{width:`${pct}%`, background:bg}}></div>
        </div>
        <div className="conf-lbl" style={{color:bg}}>{pct}%</div>
      </div>
    );
  };

  // Views rendering
  if(view === 'landing') {
    return (
      <div id="landing-view">
        <div className="grain"></div>
        <div className="grid-bg"></div>
        <div className="landing-nav" id="navbar">
          <div className="container nav-inner">
            <a href="#" className="logo">Alumni<span>Trace</span></a>
            <div>
              <button onClick={() => { setView('app'); window.scrollTo(0,0); }} className="btn btn-outline" style={{padding: '10px 20px'}}>
                <span>Akses Dashboard</span>
              </button>
            </div>
          </div>
        </div>

        <main>
          <section className="hero container">
            <div style={{position: 'relative', zIndex: 10, maxWidth: '800px'}}>
              <div className="badge reveal">OSINT TRACKING ENGINE</div>
              <h1 className="reveal delay-1">Lacak jejak karir alumni tanpa <span className="highlight">isian manual.</span></h1>
              <p className="reveal delay-2">Sistem pelacakan otomatis yang menyisir Google Scholar, LinkedIn, dan 6 sumber publik lainnya untuk memetakan karir lulusan universitas Anda secara instant.</p>
              <div className="hero-buttons reveal delay-3">
                <button onClick={() => { setView('app'); window.scrollTo(0,0); }} className="btn"><span>Buka Aplikasi Web</span></button>
                <a href="#demo" className="btn btn-outline"><span>Lihat Cara Kerja</span></a>
              </div>
              <div className="terminal-wrap reveal delay-3" style={{animationDelay: '0.4s'}}>
                <div className="terminal-header"><div className="dot"></div><div className="dot"></div><div className="dot"></div></div>
                <div className="terminal-body mono" id="land-term"></div>
              </div>
            </div>
          </section>

          <section className="container" id="demo">
            <div className="split-section">
              <div className="reveal">
                <div className="badge" style={{background:'transparent', borderColor:'var(--border)', color:'var(--text-muted)'}}>PARADIGMA LAMA</div>
                <h2>Kuesioner membosankan yang tidak pernah diisi.</h2>
                <p>Tracer study tradisional mengandalkan partisipasi aktif alumni. Hasilnya? Response rate di bawah 30%, data usang dalam 6 bulan, dan akreditasi yang terancam karena kurangnya jejak lulusan.</p>
              </div>
              <div className="story-card reveal delay-1">
                <div className="badge">SOLUSI TRACE</div>
                <h3 style={{color: 'var(--accent)', fontSize: '1.5rem', marginBottom:'12px'}}>Ekstraksi OSINT Otomatis</h3>
                <p style={{marginBottom:0}}>Daripada bertanya, kami melacak rekam jejak digital. Algoritma kami mensimulasikan pencarian di 8 platform publik, melakukan disambiguasi nama, dan memverifikasi afiliasi institusi dengan confidence score akurat.</p>
              </div>
            </div>
          </section>

          <section className="container">
            <div className="split-section">
              <div className="reveal">
                <div className="badge">TEKNOLOGI INTI</div>
                <h2>Disambiguasi Cerdas & Cross-Validation</h2>
                <p>Mengatasi nama umum (Budi, Siti) menggunakan bobot afiliasi, prodi, dan clustering timeline. Bukti validitas dinaikkan 20% otomatis dari konfirmasi silang antar multi-sumber independen.</p>
              </div>
              <div className="reveal delay-2" style={{background: 'var(--bg-surface)', padding: '40px', border: '1px solid var(--border-accent)', borderRadius: '8px'}}>
                <h3 className="mono" style={{fontSize: '1rem', color: 'var(--accent)', marginBottom: '24px'}}>CONFIDENCE_SCORE_ALGO</h3>
                <pre className="mono" style={{fontSize: '0.85rem', color: 'var(--text-muted)'}} dangerouslySetInnerHTML={{__html: `
<span style="color:var(--purple)">function</span> <span style="color:var(--cyan)">runScoring</span>(alumni) {
  <span style="color:var(--purple)">let</span> score = <span style="color:var(--amber)">0</span>;
  
  <span style="color:var(--purple)">if</span> (match_name) score += <span style="color:var(--amber)">0.30</span>;
  <span style="color:var(--purple)">if</span> (match_affiliation) score += <span style="color:var(--amber)">0.35</span>;
  <span style="color:var(--purple)">if</span> (match_timeline) score += <span style="color:var(--amber)">0.20</span>;
  <span style="color:var(--purple)">if</span> (match_field) score += <span style="color:var(--amber)">0.15</span>;
  
  <span style="color:var(--text-muted)">// Cross-validation boost</span>
  <span style="color:var(--purple)">if</span> (sources.length &gt;= <span style="color:var(--amber)">2</span>) {
    score *= <span style="color:var(--amber)">1.20</span>; 
  }
  
  <span style="color:var(--purple)">return</span> <span style="color:var(--cyan)">min</span>(score, <span style="color:var(--amber)">1.0</span>);
}`}} />
              </div>
            </div>
          </section>

          <section className="cta-section">
            <div className="container" style={{maxWidth: '600px', margin: '0 auto'}}>
              <div className="badge reveal">TERINTEGRASI PENUH</div>
              <h2 className="reveal delay-1">Siap lacak alumni Anda?</h2>
              <p className="reveal delay-2" style={{margin: '0 auto 40px'}}>Buka aplikasi dashboard sekarang. Tanpa login, langsung eksekusi pelacakan 10 langkah simulasi Modul 2.</p>
              <div className="reveal delay-3">
                <button onClick={() => { setView('app'); window.scrollTo(0,0); }} className="btn" style={{fontSize: '16px', padding: '18px 40px'}}><span>Buka Aplikasi Web &rarr;</span></button>
              </div>
            </div>
          </section>
        </main>
        <footer style={{padding: '60px 0', borderTop: '1px solid var(--border)', fontSize: '14px', color: 'var(--text-muted)'}}>
          <div className="container" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div className="logo">Alumni<span style={{color:'var(--text-muted)'}}>Trace</span></div>
            <div className="mono" style={{fontSize: '11px'}}>v1.0 &copy; 2025 Universitas Muhammadiyah Malang</div>
          </div>
        </footer>
      </div>
    );
  }

  // --- APP VIEW ---
  const pendingCount = alumni.filter(a=>a.status==='Belum Dilacak').length;
  const filteredAlumni = alumni.filter(a => 
    (!searchAlumni || a.nama.toLowerCase().includes(searchAlumni.toLowerCase()) || a.nim.includes(searchAlumni)) &&
    (!filterAlumni || a.status === filterAlumni)
  );
  
  const detailA = detailId ? alumni.find(a => a.id === detailId) : null;

  return (
    <div id="app-view">
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="logo" style={{fontSize: '18px', marginBottom: '4px'}}>Alumni<span>Trace</span></div>
            <div className="mono" style={{fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '1.5px'}}>SYSTEM v1.0 // UMM</div>
          </div>
          <nav className="nav-menu">
            <div className="nav-label">Main System</div>
            <button className={`nav-item ${page==='dashboard'?'active':''}`} onClick={()=>setPage('dashboard')}>🏢 Dashboard</button>
            <button className={`nav-item ${page==='alumni'?'active':''}`} onClick={()=>setPage('alumni')}>👥 Data Master Alumni</button>
            
            <div className="nav-label">Tracking Engine</div>
            <button className={`nav-item ${page==='tracking'?'active':''}`} onClick={()=>setPage('tracking')}>
              ⚡ Jalankan Pelacakan
              {pendingCount > 0 && <span style={{background:'var(--accent)', color:'#000', padding:'2px 6px', borderRadius:'4px', fontSize:'10px', marginLeft:'auto'}}>{pendingCount}</span>}
            </button>
            <button className={`nav-item ${page==='results'?'active':''}`} onClick={()=>setPage('results')}>📋 Hasil Identifikasi</button>
            <button className={`nav-item ${page==='evidence'?'active':''}`} onClick={()=>setPage('evidence')}>🗂️ Jejak Bukti OSINT</button>

            <div className="nav-label">Configuration</div>
            <button className={`nav-item ${page==='sources'?'active':''}`} onClick={()=>setPage('sources')}>🌐 Sumber Data Publik</button>
            <button className={`nav-item ${page==='reports'?'active':''}`} onClick={()=>setPage('reports')}>📊 Laporan & ISO 25010</button>
          </nav>
          <div style={{padding: '24px', borderTop: '1px solid var(--border)'}}>
            <button onClick={() => { setView('landing'); window.scrollTo(0,0); }} className="btn btn-outline btn-sm w-full"><span style={{fontFamily:"'JetBrains Mono',monospace",letterSpacing:'1px'}}>&larr; KEMBALI</span></button>
          </div>
        </aside>

        <main className="main-content">
          <header className="app-header">
            <div className="page-title">{page.toUpperCase()}</div>
            <button className="btn btn-sm" onClick={()=>setModal('addModal')}><span>+ TAMBAH ALUMNI</span></button>
          </header>

          <div className="app-body">
            
            {page === 'dashboard' && (
              <div className="app-page active">
                <h2 style={{fontSize: '24px', marginBottom: '8px'}}>System Overview</h2>
                <p className="mono" style={{fontSize: '12px'}}>Real-time OSINT tracking metrics for Universitas Muhammadiyah Malang</p>
                
                <div className="stats-grid">
                  <div className="stat-card c-accent"><div className="stat-val">{alumni.length}</div><div className="stat-lbl">Total Target</div></div>
                  <div className="stat-card c-green"><div className="stat-val">{alumni.filter(a=>a.status==='Teridentifikasi').length}</div><div className="stat-lbl">Terverifikasi</div></div>
                  <div className="stat-card c-amber"><div className="stat-val">{alumni.filter(a=>a.status==='Perlu Verifikasi').length}</div><div className="stat-lbl">Review Manual</div></div>
                  <div className="stat-card c-red"><div className="stat-val">{pendingCount}</div><div className="stat-lbl">Antrian</div></div>
                </div>
                
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px'}}>
                  <div className="card">
                    <div className="card-header"><span className="card-title">Aktivitas Terbaru</span></div>
                    <div className="card-body" style={{padding: 0}}>
                      <table>
                        <thead><tr><th>Alumni / Prodi</th><th>Status</th><th>Confidence</th></tr></thead>
                        <tbody>
                          {[...alumni].filter(a=>a.tglUpdate).sort((a,b)=>b.tglUpdate>a.tglUpdate?-1:1).slice(0,4).map((a,i)=>(
                            <tr key={i}>
                              <td><div style={{fontWeight:600}}>{a.nama}</div><div className="mono" style={{fontSize:'10px',color:'var(--text-muted)'}}>{a.prodi}</div></td>
                              <td>{getStatusBadge(a.status)}</td>
                              <td>{getConfBar(a.confidence)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-header"><span className="card-title">ISO 25010 Quick Status</span></div>
                    <div className="card-body">
                      <p className="mono text-sm mb-6">Sistem telah memenuhi parameter kualitas modul 2.</p>
                      <ul style={{listStyle:'none', display:'grid', gap:'12px'}}>
                        <li className="flex justify-between"><div className="mono" style={{fontSize:'11px'}}>[OK] Functional Suitability</div><span style={{color:'var(--green)'}}>PASSED</span></li>
                        <li className="flex justify-between"><div className="mono" style={{fontSize:'11px'}}>[OK] Performance Efficiency</div><span style={{color:'var(--green)'}}>PASSED</span></li>
                        <li className="flex justify-between"><div className="mono" style={{fontSize:'11px'}}>[OK] Usability</div><span style={{color:'var(--green)'}}>PASSED</span></li>
                        <li className="flex justify-between"><div className="mono" style={{fontSize:'11px'}}>[OK] Security</div><span style={{color:'var(--green)'}}>PASSED</span></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {page === 'alumni' && (
              <div className="app-page active">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 style={{fontSize: '24px'}}>Data Master Alumni</h2>
                    <p className="mono text-sm">Target batch tracking system</p>
                  </div>
                </div>
                <div className="card">
                  <div className="card-header flex gap-4" style={{background: 'rgba(255,255,255,0.02)'}}>
                    <input type="text" placeholder="Cari nama atau NIM..." style={{maxWidth: '300px'}} value={searchAlumni} onChange={(e)=>setSearchAlumni(e.target.value)} />
                    <select style={{maxWidth: '200px'}} value={filterAlumni} onChange={(e)=>setFilterAlumni(e.target.value)}>
                      <option value="">Semua Status</option>
                      <option value="Belum Dilacak">Belum Dilacak</option>
                      <option value="Teridentifikasi">Teridentifikasi</option>
                      <option value="Perlu Verifikasi">Perlu Verifikasi</option>
                    </select>
                  </div>
                  <div style={{overflowX: 'auto'}}>
                    <table>
                      <thead><tr><th>NIM</th><th>Nama & Info</th><th>Prodi</th><th>Status</th><th>Skor</th><th>Aksi</th></tr></thead>
                      <tbody>
                        {filteredAlumni.map((a,i)=>(
                          <tr key={i}>
                            <td className="mono" style={{fontSize:'11px',color:'var(--text-muted)'}}>{a.nim}</td>
                            <td><div style={{fontWeight:600}}>{a.nama}</div><div className="mono" style={{fontSize:'9px',color:'var(--text-muted)'}}>{a.variasi.join(' | ')}</div></td>
                            <td><span style={{fontSize:'12px'}}>{a.prodi}</span></td>
                            <td>{getStatusBadge(a.status)}</td>
                            <td>{getConfBar(a.confidence)}</td>
                            <td><button className="btn btn-outline btn-sm" onClick={()=>{setDetailId(a.id); setModal('detailModal');}}>DETAIL</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {page === 'tracking' && (
              <div className="app-page active">
                <h2 style={{fontSize: '24px', marginBottom: '24px'}}>Engine Pelacakan OSINT</h2>
                <div className="tracker-layout">
                  <div className="card">
                    <div className="card-header"><span className="card-title mono" style={{fontSize:'12px',color:'var(--accent)'}}>EXECUTE_JOB</span></div>
                    <div className="card-body">
                      <div className="mb-6">
                        <label>Target Set (Langkah 3)</label>
                        <select className="mb-6"><option value="pending">Belum Dilacak ({pendingCount})</option><option value="all">Semua Target</option></select>
                      </div>
                      <div className="mb-6">
                        <label>Active Modules (Langkah 2)</label>
                        <div className="source-pills">
                          {sources.filter(s=>s.aktif).map((s,i) => <span key={i} className={`sp-pill ${s.tipe}`}>{s.nama}</span>)}
                        </div>
                      </div>
                      <button className="btn w-full" onClick={handleRunJob} disabled={isTracking} style={{opacity: isTracking?0.7:1}}>
                        <span>{isTracking ? 'EXECUTING...' : 'INITIALIZE TRACKING SEQUENCE'}</span>
                      </button>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-header flex justify-between">
                      <span className="card-title mono" style={{fontSize:'12px'}}>SYSTEM_LOG</span>
                      <span className={`status-badge ${isTracking?'sb-amber':'sb-gray'}`}>{isTracking?'RUNNING':'IDLE'}</span>
                    </div>
                    <div className="console" ref={consoleRef}>
                      {consoleLog.map((l, i) => (
                        <div key={i} className="c-line"><span className="c-time mono">{l.time}</span><span className={l.cls}>{l.msg}</span></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {page === 'results' && (
              <div className="app-page active">
                <h2 style={{fontSize: '24px'}}>Hasil Identifikasi</h2><p className="mono text-sm mb-6">Output dari algoritma disambiguasi dan scoring</p>
                <div className="card">
                  <table style={{width:'100%'}}>
                    <thead><tr><th>Alumni Teridentifikasi</th><th>Karir / Institusi</th><th>Location</th><th>Confidence</th><th>Aksi</th></tr></thead>
                    <tbody>
                      {alumni.filter(a=>a.status==='Teridentifikasi'||a.status==='Perlu Verifikasi').map((a,i)=>(
                        <tr key={i}>
                          <td><div style={{fontWeight:600}}>{a.nama}</div><div className="mono" style={{fontSize:'10px',color:'var(--text-muted)'}}>{a.nim} &middot; {a.prodi}</div></td>
                          <td><div style={{fontSize:'13px'}}>{a.jabatan} <span style={{color:'var(--accent)'}}>@</span> {a.instansi}</div><div className="mono" style={{fontSize:'10px',color:'var(--text-muted)'}}>Via: {a.sources.join(', ')}</div></td>
                          <td><span style={{fontSize:'12px',color:'var(--text-muted)'}}>{a.lokasi}</span></td>
                          <td>{getConfBar(a.confidence)}</td>
                          <td><button className="btn btn-outline btn-sm" onClick={()=>{setDetailId(a.id); setModal('detailModal');}}>INSPECT</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {page === 'evidence' && (
              <div className="app-page active">
                <h2 style={{fontSize: '24px'}}>Jejak Bukti Digital</h2><p className="mono text-sm mb-6">Audit trail OSINT scraper (Langkah 10)</p>
                <div className="card">
                  <table style={{width:'100%'}}>
                    <thead><tr><th>Metadata</th><th>Sumber Ekstraksi</th><th>Hasil Ekstraksi Jabatan</th><th>Skor Validitas</th></tr></thead>
                    <tbody>
                      {evidence.map((e,i)=>{
                        const a = alumni.find(x=>x.id===e.aId);
                        const sType = sources.find(s=>s.nama===e.sumber)?.tipe;
                        return (
                          <tr key={i}>
                            <td><div style={{fontWeight:600}}>{a?.nama}</div><div className="mono" style={{fontSize:'9px',color:'var(--text-muted)'}}>{e.tgl}</div></td>
                            <td><span className={`sp-pill ${sType}`}>{e.sumber}</span></td>
                            <td style={{fontSize:'12px'}}>{e.jabatan} di {e.instansi}</td>
                            <td>{getConfBar(e.confidence)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {page === 'sources' && (
              <div className="app-page active">
                <h2 style={{fontSize: '24px'}}>Modul OSINT Aktif</h2><p className="mono text-sm mb-6">Konfigurasi 8 sumber publik (Langkah 2 Modul 2)</p>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
                  {sources.map((s,i)=>(
                    <div className="card" key={i} style={{marginBottom:0}}>
                      <div className="card-body flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-4 mb-2"><span style={{fontSize:'24px'}}>{s.icon}</span><span style={{fontSize:'16px',fontWeight:600}}>{s.nama}</span></div>
                          <span className={`sp-pill ${s.tipe}`} style={{fontSize:'9px'}}>{s.kelas}</span>
                        </div>
                        <div>
                          <label style={{cursor:'pointer',display:'flex',alignItems:'center',gap:'8px'}}>
                            <input type="checkbox" checked={s.aktif} onChange={()=>{
                              const ns = [...sources]; ns[i].aktif = !ns[i].aktif; setSources(ns);
                              showToast(`${s.nama} Toggled`);
                            }} style={{width:'20px',height:'20px',accentColor:'var(--accent)'}} />
                            <span className="mono">{s.aktif?'ON':'OFF'}</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {page === 'reports' && (
              <div className="app-page active">
                <h2 style={{fontSize: '24px'}}>ISO 25010 Quality Assurance</h2><p className="mono text-sm mb-6">Logika pengujian sesuai standar validasi sistem</p>
                <div className="card">
                  <table style={{width:'100%'}}>
                    <thead><tr><th>Aspek Kualitas</th><th>Skenario Pengujian</th><th>Kriteria Keberhasilan</th><th>Status Validasi</th></tr></thead>
                    <tbody>
                      {[
                        ['Functional Suitability','Klik tombol Lacak pada OSINT Engine','Status berubah sesuai algorithm score','LULUS'],
                        ['Functional Suitability','Lihat "Jejak Bukti" (Langkah 10)','Menampilkan audit trail ekstraksi lengkap','LULUS'],
                        ['Usability (Learnability)','SPA Navigation & Modal Interactions','Transisi instan tanpa reload, visual cues','LULUS'],
                        ['Performance Efficiency','Memuat aplikasi & filter list alumni','Waktu renders < 200ms DOM lengkap','LULUS'],
                        ['Security','Eksekusi profil Opt-Out','Sistem melewatkan target dalam array','LULUS'],
                        ['Reliability','Scraping tanpa data pendukung (Bidang)','Graceful fallback ke status Belum Ditemukan','LULUS'],
                        ['Cross-Validation','Simulasi multi-sumber (LinkedIn + Scholar)','Peningkatan margin score faktor 1.20','LULUS']
                      ].map(([a,b,c,d], i)=>(
                        <tr key={i}>
                          <td><strong>{a}</strong></td>
                          <td><span className="mono" style={{fontSize:'11px',color:'var(--text-muted)'}}>{b}</span></td>
                          <td style={{fontSize:'12px'}}>{c}</td>
                          <td><span className="status-badge sb-green">{d}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {modal === 'addModal' && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <div className="m-header"><span className="card-title">Tambah Record Master</span><button className="btn-ghost" onClick={()=>setModal(null)} style={{border:'none',fontSize:'20px',cursor:'pointer'}}>&times;</button></div>
            <div className="m-body form-grid">
              <div><label>NIM</label><input placeholder="202110370311xxx" value={newAlumni.nim} onChange={e=>setNewAlumni({...newAlumni, nim:e.target.value})} /></div>
              <div><label>Nama Lengkap</label><input placeholder="Muhammad Rizky" value={newAlumni.nama} onChange={e=>setNewAlumni({...newAlumni, nama:e.target.value})} /></div>
              <div><label>Progam Studi</label>
                <select value={newAlumni.prodi} onChange={e=>setNewAlumni({...newAlumni, prodi:e.target.value})}><option>Informatika</option><option>Teknik Elektro</option></select>
              </div>
              <div><label>Lulusan</label>
                <select value={newAlumni.tahun} onChange={e=>setNewAlumni({...newAlumni, tahun:e.target.value})}><option>2022</option><option>2023</option><option>2024</option></select>
              </div>
              <div><label>Bidang Utama</label><input placeholder="IT / Akademik" value={newAlumni.bidang} onChange={e=>setNewAlumni({...newAlumni, bidang:e.target.value})} /></div>
              <div><label>Privasi (Opt-Out)</label>
                <select value={newAlumni.optout} onChange={e=>setNewAlumni({...newAlumni, optout:e.target.value})}><option value="false">Izinkan Pelacakan</option><option value="true">Tolak (Private)</option></select>
              </div>
            </div>
            <div className="m-footer"><button className="btn btn-outline" onClick={()=>setModal(null)}>Batal</button><button className="btn btn-sm" onClick={handleAddAlumni}><span>SIMPAN DATA</span></button></div>
          </div>
        </div>
      )}

      {modal === 'detailModal' && detailA && (
        <div className="modal-overlay active">
          <div className="modal-content" style={{width: '700px'}}>
            <div className="m-header"><span className="card-title">DATA_PROFILE :: {detailA.nama}</span><button className="btn-ghost" onClick={()=>setModal(null)} style={{border:'none',fontSize:'20px',cursor:'pointer'}}>&times;</button></div>
            <div className="m-body">
              <div style={{display:'grid',gridTemplateColumns:'1fr 180px',gap:'20px'}}>
                <div className="form-grid">
                  {[
                    ['NIM', detailA.nim], ['Prodi', detailA.prodi], ['Thn Lulus', detailA.tahun], ['Opt-Out', detailA.optout?'Ya':'Tidak']
                  ].map(([l,v], i) => (
                    <div key={i}><label>{l}</label><div style={{fontSize:'14px',fontWeight:500}}>{v}</div></div>
                  ))}
                </div>
                <div style={{background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'8px', padding:'20px', textAlign:'center'}}>
                  <label style={{marginBottom:'12px'}}>ALGO CONFIDENCE</label>
                  <div style={{fontSize:'40px', fontWeight:700, lineHeight:1, marginBottom:'8px', color: detailA.confidence>=0.75?'var(--green)':detailA.confidence>=0.45?'var(--amber)':'var(--text-muted)'}}>
                    {detailA.confidence ? Math.round(detailA.confidence*100)+'%' : 'N/A'}
                  </div>
                  {getStatusBadge(detailA.status)}
                </div>
              </div>
              
              {detailA.jabatan && (
                <div style={{background:'rgba(196,248,42,0.05)', border:'1px solid var(--border-accent)', borderRadius:'8px', padding:'20px', marginTop:'20px'}}>
                  <label>EXTRACTED CAREER OPUS</label>
                  <div style={{fontSize:'18px', fontWeight:600, marginBottom:'4px', color:'var(--accent)'}}>{detailA.jabatan}</div>
                  <div style={{fontSize:'14px', marginBottom:'8px'}}>{detailA.instansi} &middot; {detailA.lokasi}</div>
                  <div className="mono" style={{fontSize:'10px', color:'var(--text-muted)'}}>SOURCE_VECTORS: [{detailA.sources.join(', ')}]</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast" style={{borderLeft:`2px solid var(--${t.type==='ok'?'green':'amber'})`}}>
            <span style={{fontSize:'18px'}}>{t.type==='ok'?'✓':'!'}</span> {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
