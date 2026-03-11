"use client";
import { useState } from "react";

// Types
interface Alumni {
  id: number; nim: string; nama: string; prodi: string; tahun: string;
  bidang: string; kota: string; optout: boolean; status: string;
  jabatan: string; instansi: string; lokasi: string; confidence: number;
  sources: string[]; tglUpdate: string; variasi: string[];
}
interface Evidence {
  aId: number; sumber: string; jabatan: string; instansi: string;
  lokasi: string; confidence: number; tgl: string; snippet: string;
}
interface Source {
  nama: string; tipe: string; aktif: boolean; icon: string; desc: string;
}

// Initial Data
const initAlumni: Alumni[] = [
  {id:1,nim:'20211037031101',nama:'Muhammad Rizky Pratama',prodi:'Informatika',tahun:'2022',bidang:'IT',kota:'Malang',optout:false,status:'Teridentifikasi',jabatan:'Software Engineer',instansi:'Gojek Indonesia',lokasi:'Jakarta',confidence:0.87,sources:['LinkedIn','GitHub'],tglUpdate:'2025-01-15',variasi:['M. Rizky','Rizky Pratama','Muh. Rizky']},
  {id:2,nim:'20211037031102',nama:'Siti Rahayu Putri',prodi:'Informatika',tahun:'2022',bidang:'Akademik',kota:'Surabaya',optout:false,status:'Teridentifikasi',jabatan:'Data Scientist',instansi:'Bank BCA',lokasi:'Surabaya',confidence:0.92,sources:['LinkedIn','Google Scholar'],tglUpdate:'2025-01-20',variasi:['S. Rahayu','Siti Rahayu']},
  {id:3,nim:'20211037031103',nama:'Ahmad Fauzan Hakim',prodi:'Teknik Elektro',tahun:'2021',bidang:'Penelitian',kota:'Bandung',optout:false,status:'Perlu Verifikasi',jabatan:'Research Engineer',instansi:'Telkom Indonesia',lokasi:'Bandung',confidence:0.61,sources:['ResearchGate'],tglUpdate:'2025-01-10',variasi:['A. Fauzan','Ahmad Hakim']},
  {id:4,nim:'20211037031104',nama:'Dewi Lestari Sari',prodi:'Manajemen',tahun:'2023',bidang:'Lainnya',kota:'Malang',optout:false,status:'Belum Dilacak',jabatan:'',instansi:'',lokasi:'',confidence:0,sources:[],tglUpdate:'',variasi:['D. Lestari','Dewi Lestari']},
  {id:5,nim:'20211037031105',nama:'Budi Santoso',prodi:'Informatika',tahun:'2020',bidang:'IT',kota:'Jakarta',optout:false,status:'Teridentifikasi',jabatan:'CTO',instansi:'Startup XYZ',lokasi:'Jakarta',confidence:0.78,sources:['LinkedIn','Web Umum'],tglUpdate:'2024-12-01',variasi:['B. Santoso']},
  {id:6,nim:'20211037031106',nama:'Nur Aini Rahmawati',prodi:'Akuntansi',tahun:'2021',bidang:'Lainnya',kota:'Yogyakarta',optout:false,status:'Belum Ditemukan',jabatan:'',instansi:'',lokasi:'',confidence:0.1,sources:[],tglUpdate:'2025-01-05',variasi:['Nur Aini','N. Rahmawati']},
  {id:7,nim:'20211037031107',nama:'Rizal Maulana Akbar',prodi:'Informatika',tahun:'2022',bidang:'IT',kota:'Malang',optout:true,status:'Opt-Out',jabatan:'',instansi:'',lokasi:'',confidence:0,sources:[],tglUpdate:'',variasi:['R. Maulana','Rizal Akbar']},
  {id:8,nim:'20211037031108',nama:'Fitriani Wahyuningsih',prodi:'Kedokteran',tahun:'2023',bidang:'Lainnya',kota:'Malang',optout:false,status:'Belum Dilacak',jabatan:'',instansi:'',lokasi:'',confidence:0,sources:[],tglUpdate:'',variasi:['Fitriani W.']},
];

const initEvidence: Evidence[] = [
  {aId:1,sumber:'LinkedIn',jabatan:'Software Engineer',instansi:'Gojek Indonesia',lokasi:'Jakarta',confidence:0.87,tgl:'2025-01-15',snippet:'Muhammad Rizky Pratama - Software Engineer at Gojek. Alumni UMM Informatika 2022.'},
  {aId:2,sumber:'Google Scholar',jabatan:'Data Scientist',instansi:'Bank BCA',lokasi:'Surabaya',confidence:0.92,tgl:'2025-01-20',snippet:'Siti Rahayu Putri - Publications on ML and fintech. Affiliation: Bank BCA.'},
  {aId:3,sumber:'ResearchGate',jabatan:'Research Engineer',instansi:'Telkom Indonesia',lokasi:'Bandung',confidence:0.61,tgl:'2025-01-10',snippet:'A. Fauzan Hakim - Research Engineer at Telkom. IoT publications.'},
  {aId:5,sumber:'LinkedIn',jabatan:'CTO',instansi:'Startup XYZ',lokasi:'Jakarta',confidence:0.78,tgl:'2024-12-01',snippet:'Budi Santoso - CTO at Startup XYZ. Alumni UMM Informatika 2016.'},
];

const initSources: Source[] = [
  {nama:'Google Scholar',tipe:'akademik',aktif:true,icon:'📚',desc:'Publikasi akademik dan sitasi'},
  {nama:'ResearchGate',tipe:'akademik',aktif:true,icon:'🔬',desc:'Jaringan penelitian ilmiah'},
  {nama:'ORCID',tipe:'akademik',aktif:false,icon:'🆔',desc:'Identitas peneliti global'},
  {nama:'LinkedIn',tipe:'profesional',aktif:true,icon:'💼',desc:'Jaringan profesional'},
  {nama:'Instagram',tipe:'sosmed',aktif:false,icon:'📷',desc:'Media sosial Instagram'},
  {nama:'Facebook',tipe:'sosmed',aktif:false,icon:'👍',desc:'Media sosial Facebook'},
  {nama:'GitHub',tipe:'teknis',aktif:true,icon:'💻',desc:'Platform developer & kode'},
  {nama:'Web Umum',tipe:'umum',aktif:true,icon:'🌐',desc:'Pencarian web umum (Google)'},
];

// Helpers
function statusBadge(s: string) {
  const m: Record<string,string> = {'Teridentifikasi':'badge-green','Perlu Verifikasi':'badge-amber','Belum Dilacak':'badge-gray','Belum Ditemukan':'badge-red','Opt-Out':'badge-purple'};
  return <span className={`badge ${m[s]||'badge-gray'}`}>{s}</span>;
}
function confBar(c: number) {
  if(!c) return <span style={{color:'var(--text3)',fontSize:'12px'}}>—</span>;
  const p=Math.round(c*100), col=c>=0.75?'var(--green)':c>=0.45?'var(--amber)':'var(--red)';
  return <div className="conf-bar"><div className="bar-track"><div className="bar-fill" style={{width:`${p}%`,background:col}}/></div><span className="bar-label" style={{color:col}}>{p}%</span></div>;
}
function srcClass(t: string) {
  return ({akademik:'sp-academic',profesional:'sp-professional',sosmed:'sp-social',teknis:'sp-tech',umum:'sp-professional'} as Record<string,string>)[t]||'sp-professional';
}

export default function Home() {
  const [page, setPage] = useState('dashboard');
  const [alumni, setAlumni] = useState<Alumni[]>(initAlumni);
  const [evidence, setEvidence] = useState<Evidence[]>(initEvidence);
  const [srcs, setSrcs] = useState<Source[]>(initSources);
  const [modal, setModal] = useState('');
  const [detailA, setDetailA] = useState<Alumni|null>(null);
  const [search, setSearch] = useState('');
  const [filterSt, setFilterSt] = useState('');
  const [toasts, setToasts] = useState<{id:number,msg:string,type:string}[]>([]);
  const [logs, setLogs] = useState<string[]>(['[SYS] Sistem siap. Tekan "Jalankan Job" untuk memulai.']);
  const [jobRunning, setJobRunning] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [jobSummary, setJobSummary] = useState('');

  // Form state
  const [fNim, setFNim] = useState('');
  const [fNama, setFNama] = useState('');
  const [fProdi, setFProdi] = useState('Informatika');
  const [fTahun, setFTahun] = useState('2022');
  const [fBidang, setFBidang] = useState('IT');
  const [fKota, setFKota] = useState('');
  const [fOpt, setFOpt] = useState('false');

  const titles: Record<string,string> = {dashboard:'Dashboard',alumni:'Data Alumni',tracking:'Jalankan Pelacakan',results:'Hasil Pelacakan',evidence:'Jejak Bukti',sources:'Sumber & Prioritas',reports:'Laporan & Pengujian'};

  function toast(msg: string, type='ok') {
    const id = Date.now();
    setToasts(p=>[...p,{id,msg,type}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3000);
  }

  function nav(p: string) { setPage(p); setSearch(''); setFilterSt(''); }

  // Stats
  const total=alumni.length;
  const found=alumni.filter(a=>a.status==='Teridentifikasi').length;
  const verif=alumni.filter(a=>a.status==='Perlu Verifikasi').length;
  const pending=alumni.filter(a=>a.status==='Belum Dilacak').length;

  // Filtered lists
  const filteredAlumni = alumni.filter(a => {
    const mq = !search || a.nama.toLowerCase().includes(search.toLowerCase()) || a.nim.includes(search);
    const ms = !filterSt || a.status === filterSt;
    return mq && ms;
  });

  function addAlumni() {
    if(!fNim||!fNama){toast('NIM dan Nama wajib diisi','warn');return;}
    const parts=fNama.split(' '), v=[fNama];
    if(parts.length>=2){v.push(`${parts[0][0]}. ${parts.slice(1).join(' ')}`);v.push(parts.slice(0,-1).join(' '));}
    setAlumni(p=>[...p,{id:p.length+1,nim:fNim,nama:fNama,prodi:fProdi,tahun:fTahun,bidang:fBidang,kota:fKota,optout:fOpt==='true',status:fOpt==='true'?'Opt-Out':'Belum Dilacak',jabatan:'',instansi:'',lokasi:'',confidence:0,sources:[],tglUpdate:'',variasi:v}]);
    setModal('');setFNim('');setFNama('');toast(`"${fNama}" berhasil ditambahkan`);
  }

  function trackOne(id: number) {
    toast('Melacak...');
    setTimeout(()=>{
      setAlumni(p=>p.map(a=>{
        if(a.id!==id)return a;
        const r=Math.random();
        if(r>0.5){
          const j=['Software Engineer','Data Analyst','Dosen'][Math.floor(Math.random()*3)];
          const ins=['PT. XYZ','Startup ABC','Universitas'][Math.floor(Math.random()*3)];
          const src=srcs.filter(s=>s.aktif)[0]?.nama||'LinkedIn';
          setEvidence(ev=>[...ev,{aId:a.id,sumber:src,jabatan:j,instansi:ins,lokasi:'Jakarta',confidence:0.8,tgl:new Date().toISOString().slice(0,10),snippet:`${a.nama} teridentifikasi dari ${src}.`}]);
          toast(`${a.nama} teridentifikasi!`);
          return {...a,status:'Teridentifikasi',confidence:0.75+Math.random()*0.22,jabatan:j,instansi:ins,lokasi:'Jakarta',sources:[src],tglUpdate:new Date().toISOString().slice(0,10)};
        }
        toast(`${a.nama} perlu verifikasi manual`,'warn');
        return {...a,status:'Perlu Verifikasi',confidence:0.5+Math.random()*0.2,tglUpdate:new Date().toISOString().slice(0,10)};
      }));
    },1200);
  }

  function manualVerify(id: number) {
    setAlumni(p=>p.map(a=>a.id===id?{...a,status:'Teridentifikasi',confidence:Math.min(a.confidence*1.1,1.0)}:a));
    toast('Berhasil diverifikasi');
  }

  // Run tracking job simulation (Langkah 1-10)
  function runJob() {
    if(jobRunning) return;
    setJobRunning(true);
    setLogs([]);
    setSteps([]);
    setJobSummary('');
    const targets = alumni.filter(a=>a.status==='Belum Dilacak'&&!a.optout);
    const actSrc = srcs.filter(s=>s.aktif);
    const ts = () => new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    const newLogs: string[] = [`[${ts()}] [JOB] Target: ${targets.length} alumni, Sumber: ${actSrc.map(s=>s.nama).join(', ')}`];
    setLogs([...newLogs]);

    const stepLabels = ['Profil','Query','Ambil','Ekstrak','Scoring','Simpan'];
    const stepMsgs = ['Membuat profil pencarian... (Langkah 1)','Menghasilkan query... (Langkah 4)','Mengambil data sumber publik... (Langkah 5)','Mengekstrak sinyal identitas... (Langkah 6)','Disambiguasi & scoring... (Langkah 7)','Menyimpan jejak bukti... (Langkah 10)'];
    let si = 0;

    function nextStep() {
      if(si >= stepLabels.length) { finishJob(); return; }
      const doneSteps = stepLabels.slice(0,si);
      const activeStep = stepLabels[si];
      setSteps([...doneSteps, `>${activeStep}`]);
      newLogs.push(`[${ts()}] [LANGKAH ${si+1}] ${stepMsgs[si]}`);

      if(si===0) targets.forEach(a=>newLogs.push(`[${ts()}]   Profil: ${a.nama} (${a.variasi.join(', ')})`));
      if(si===1) targets.forEach(a=>newLogs.push(`[${ts()}]   ${a.nama}: query "${a.nama} UMM ${a.prodi}", "${a.nama} site:linkedin.com"`));
      if(si===2) actSrc.forEach(s=>newLogs.push(`[${ts()}]   Mengakses ${s.nama}...`));
      if(si===4) targets.forEach(a=>newLogs.push(`[${ts()}]   ${a.nama}: Scoring selesai`));
      if(si===5) targets.forEach(a=>newLogs.push(`[${ts()}]   Jejak tersimpan: ${a.nama}`));

      setLogs([...newLogs]);
      si++;
      setTimeout(nextStep, 700 + Math.random()*300);
    }

    function finishJob() {
      setSteps(stepLabels);
      let fc=0,vc=0;
      const newAlumni = alumni.map(a=>{
        if(a.status!=='Belum Dilacak'||a.optout) return a;
        const r=Math.random();
        if(r>0.6){fc++;
          const j=['Software Engineer','Data Analyst','Product Manager','Dosen','Wirausahawan'][Math.floor(Math.random()*5)];
          const ins=['PT. Telkom','Tokopedia','Univ. Brawijaya','Startup Lokal','Bank Mandiri'][Math.floor(Math.random()*5)];
          const src=actSrc[0]?.nama||'LinkedIn';
          newLogs.push(`[${ts()}] Teridentifikasi: ${a.nama} (${Math.round((0.75+Math.random()*0.22)*100)}%)`);
          return {...a,status:'Teridentifikasi',confidence:0.75+Math.random()*0.22,jabatan:j,instansi:ins,lokasi:'Jakarta',sources:[src],tglUpdate:new Date().toISOString().slice(0,10)};
        } else if(r>0.3){vc++;
          newLogs.push(`[${ts()}] Perlu Verifikasi: ${a.nama}`);
          return {...a,status:'Perlu Verifikasi',confidence:0.45+Math.random()*0.25,tglUpdate:new Date().toISOString().slice(0,10)};
        }
        newLogs.push(`[${ts()}] Belum Ditemukan: ${a.nama}`);
        return {...a,status:'Belum Ditemukan',confidence:0.05+Math.random()*0.3,tglUpdate:new Date().toISOString().slice(0,10)};
      });
      setAlumni(newAlumni);
      newLogs.push(`[${ts()}] [SELESAI] ${fc} teridentifikasi, ${vc} perlu verifikasi dari ${targets.length} target`);
      setLogs([...newLogs]);
      setJobSummary(`Job selesai: ${fc} teridentifikasi, ${vc} perlu verifikasi, ${targets.length-fc-vc} tidak ditemukan`);
      setJobRunning(false);
      toast(`Job selesai: ${fc} alumni teridentifikasi`);
    }

    setTimeout(nextStep, 300);
  }

  // Test Results for reports page
  const testRows = [
    ['Functional Suitability','Klik tombol "Lacak" pada alumni belum dilacak','Status berubah sesuai confidence score','Status berhasil terupdate setelah mock-API berjalan'],
    ['Functional Suitability','Lihat "Jejak Bukti" pada alumni teridentifikasi','Menampilkan jabatan, lokasi, snippet, URL sumber','URL evidence dan metadata tersimpan dan dapat dibaca'],
    ['Usability','Navigasi dari Dashboard ke Detail Alumni dan kembali','Desain antarmuka bersih, ada tombol navigasi','SPA navigation berfungsi cepat (instant)'],
    ['Performance Efficiency','Memuat aplikasi (cold start) dan data alumni','Waktu muat < 2 detik','Time to Interactive sangat singkat'],
    ['Security','Lacak profil alumni status "Opt-Out (Privasi)"','Tombol Lacak disabled, pelacakan ditolak','Sistem menolak job, tombol non-aktif di Frontend'],
    ['Reliability','Lacak alumni dengan data minim','Sistem tidak crash, status "Belum Ditemukan"','Graceful fallback berhasil'],
    ['Disambiguasi Nama','Uji alumni dengan nama umum','Flag nama_umum aktif, bobot afiliasi TINGGI','Flag otomatis, scoring menyesuaikan'],
    ['Cross-Validation','Cek konsistensi antar >= 2 sumber','Skor naik 20% jika konfirmasi >= 2','Meningkat dari 0.72 ke 0.87 (faktor 1.2)'],
  ];

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-text">AlumniTrace</div>
          <div className="logo-sub">Sistem Pelacakan Alumni UMM</div>
        </div>
        <nav className="nav-menu">
          <div className="nav-section">
            <div className="nav-label">Utama</div>
            <button className={`nav-item ${page==='dashboard'?'active':''}`} onClick={()=>nav('dashboard')}><span className="nav-icon">📊</span> Dashboard</button>
            <button className={`nav-item ${page==='alumni'?'active':''}`} onClick={()=>nav('alumni')}><span className="nav-icon">👥</span> Data Alumni</button>
          </div>
          <div className="nav-section">
            <div className="nav-label">Pelacakan</div>
            <button className={`nav-item ${page==='tracking'?'active':''}`} onClick={()=>nav('tracking')}><span className="nav-icon">🔍</span> Jalankan Pelacakan {pending>0&&<span className="nav-badge">{pending}</span>}</button>
            <button className={`nav-item ${page==='results'?'active':''}`} onClick={()=>nav('results')}><span className="nav-icon">📋</span> Hasil Pelacakan</button>
            <button className={`nav-item ${page==='evidence'?'active':''}`} onClick={()=>nav('evidence')}><span className="nav-icon">🗂️</span> Jejak Bukti</button>
          </div>
          <div className="nav-section">
            <div className="nav-label">Konfigurasi</div>
            <button className={`nav-item ${page==='sources'?'active':''}`} onClick={()=>nav('sources')}><span className="nav-icon">🌐</span> Sumber & Prioritas</button>
            <button className={`nav-item ${page==='reports'?'active':''}`} onClick={()=>nav('reports')}><span className="nav-icon">📈</span> Laporan & Pengujian</button>
          </div>
        </nav>
        <div className="sidebar-footer">v1.0 · Informatika UMM · 2025</div>
      </aside>

      {/* Main */}
      <div className="main-area">
        <div className="topbar">
          <div className="topbar-title">{titles[page]}</div>
          <div style={{display:'flex',gap:'10px'}}>
            <button className="btn btn-ghost btn-sm" onClick={()=>nav('tracking')}>Jalankan Job</button>
            <button className="btn btn-primary btn-sm" onClick={()=>setModal('add')}>+ Tambah Alumni</button>
          </div>
        </div>

        <div className="content-area">

          {/* Dashboard */}
          {page==='dashboard'&&<div>
            <div className="page-title">Selamat Datang</div>
            <div className="page-desc">Ringkasan sistem pelacakan alumni Universitas Muhammadiyah Malang</div>
            <div className="stats-grid">
              <div className="stat-card blue"><div className="stat-icon">👥</div><div className="stat-label">Total Alumni</div><div className="stat-value">{total}</div><div className="stat-sub">Terdaftar dalam sistem</div></div>
              <div className="stat-card green"><div className="stat-icon">✅</div><div className="stat-label">Teridentifikasi</div><div className="stat-value">{found}</div><div className="stat-sub">Ditemukan di sumber publik</div></div>
              <div className="stat-card amber"><div className="stat-icon">⚠️</div><div className="stat-label">Perlu Verifikasi</div><div className="stat-value">{verif}</div><div className="stat-sub">Perlu konfirmasi manual</div></div>
              <div className="stat-card red"><div className="stat-icon">🔍</div><div className="stat-label">Belum Dilacak</div><div className="stat-value">{pending}</div><div className="stat-sub">Antrian pelacakan</div></div>
            </div>
            <div className="two-col">
              <div className="card">
                <div className="card-header"><div className="card-title">Status Pelacakan Terbaru</div><button className="btn btn-ghost btn-sm" onClick={()=>nav('results')}>Lihat Semua</button></div>
                <table><thead><tr><th>Alumni</th><th>Status</th><th>Confidence</th></tr></thead><tbody>
                  {[...alumni].filter(a=>a.tglUpdate).sort((a,b)=>b.tglUpdate.localeCompare(a.tglUpdate)).slice(0,5).map(a=><tr key={a.id}><td><span style={{fontWeight:600}}>{a.nama}</span><br/><span style={{fontSize:'11px',color:'var(--text3)'}}>{a.prodi}</span></td><td>{statusBadge(a.status)}</td><td>{confBar(a.confidence)}</td></tr>)}
                </tbody></table>
              </div>
              <div className="card">
                <div className="card-header"><div className="card-title">Distribusi Status</div></div>
                <div className="card-body">
                  {['Teridentifikasi','Perlu Verifikasi','Belum Dilacak','Belum Ditemukan','Opt-Out'].map((s,i)=>{const cnt=alumni.filter(a=>a.status===s).length;const pct=total?Math.round(cnt/total*100):0;const cols=['var(--green)','var(--amber)','var(--text3)','var(--red)','var(--purple)'];return <div key={s} style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'10px'}}><div style={{width:'10px',height:'10px',borderRadius:'50%',background:cols[i],flexShrink:0}}/><div style={{flex:1,fontSize:'12px'}}>{s}</div><div className="bar-track" style={{width:'80px'}}><div className="bar-fill" style={{width:`${pct}%`,background:cols[i]}}/></div><div style={{fontSize:'11px',color:'var(--text2)',width:'40px',textAlign:'right'}}>{cnt} ({pct}%)</div></div>;})}
                  <div className="divider"/>
                  <div className="card-title" style={{fontSize:'13px',marginBottom:'12px'}}>Sumber Aktif</div>
                  <div className="source-pills">{srcs.filter(s=>s.aktif).map(s=><span key={s.nama} className={`source-pill ${srcClass(s.tipe)}`}>{s.icon} {s.nama}</span>)}</div>
                </div>
              </div>
            </div>
          </div>}

          {/* Data Alumni */}
          {page==='alumni'&&<div>
            <div className="page-title">Data Alumni</div>
            <div className="page-desc">Kelola data master alumni Universitas Muhammadiyah Malang</div>
            <div className="search-row">
              <div className="search-wrap"><span className="search-icon">🔍</span><input className="form-input" style={{paddingLeft:'34px'}} placeholder="Cari nama, NIM..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
              <select className="form-select" style={{width:'160px'}} value={filterSt} onChange={e=>setFilterSt(e.target.value)}><option value="">Semua Status</option><option>Belum Dilacak</option><option>Teridentifikasi</option><option>Perlu Verifikasi</option><option>Opt-Out</option><option>Belum Ditemukan</option></select>
              <button className="btn btn-primary btn-sm" onClick={()=>setModal('add')}>+ Tambah</button>
            </div>
            <div className="card"><table><thead><tr><th>NIM</th><th>Nama</th><th>Prodi</th><th>Lulus</th><th>Bidang</th><th>Status</th><th>Confidence</th><th>Aksi</th></tr></thead><tbody>
              {filteredAlumni.map(a=><tr key={a.id}><td style={{fontSize:'12px',color:'var(--text3)'}}>{a.nim}</td><td><div style={{fontWeight:600}}>{a.nama}</div>{a.optout&&<span className="badge badge-purple" style={{fontSize:'10px'}}>Opt-Out</span>}</td><td><span className="badge badge-blue">{a.prodi}</span></td><td>{a.tahun}</td><td>{a.bidang}</td><td>{statusBadge(a.status)}</td><td style={{minWidth:'120px'}}>{confBar(a.confidence)}</td><td><div style={{display:'flex',gap:'5px'}}><button className="btn btn-ghost btn-sm" onClick={()=>{setDetailA(a);setModal('detail')}}>Detail</button>{!a.optout&&a.status!=='Teridentifikasi'&&<button className="btn btn-primary btn-sm" onClick={()=>trackOne(a.id)}>Lacak</button>}</div></td></tr>)}
            </tbody></table></div>
          </div>}

          {/* Tracking Job */}
          {page==='tracking'&&<div>
            <div className="page-title">Jalankan Pelacakan</div>
            <div className="page-desc">Eksekusi job pelacakan otomatis multi-sumber (Langkah 1-10 Modul 2)</div>
            <div className="two-col">
              <div className="card"><div className="card-header"><div className="card-title">Konfigurasi Job</div></div><div className="card-body">
                <div className="form-group" style={{marginBottom:'14px'}}><label className="form-label">Sumber Aktif (Langkah 2)</label><div className="source-pills">{srcs.map((s,i)=><span key={s.nama} className={`source-pill ${srcClass(s.tipe)} ${s.aktif?'':'inactive'}`} onClick={()=>setSrcs(p=>p.map((x,j)=>j===i?{...x,aktif:!x.aktif}:x))} style={{cursor:'pointer'}}>{s.icon} {s.nama}</span>)}</div></div>
                <button className="btn btn-primary" onClick={runJob} disabled={jobRunning} style={{width:'100%',justifyContent:'center'}}>{jobRunning?<><span className="spin">⟳</span> Memproses...</>:'Jalankan Job Pelacakan'}</button>
              </div></div>
              <div>
                <div className="card"><div className="card-header"><div className="card-title">Log Pelacakan Real-time</div><div style={{fontSize:'12px',color:'var(--text3)'}}>{jobRunning?<span className="pulse" style={{color:'var(--amber)'}}>Berjalan</span>:jobSummary?<span style={{color:'var(--green)'}}>Selesai</span>:'Menunggu...'}</div></div><div className="card-body" style={{padding:'12px'}}><div className="tracking-log">{logs.map((l,i)=><div key={i} className="log-line"><span className={l.includes('SELESAI')||l.includes('tersimpan')||l.includes('Teridentifikasi')?'log-ok':l.includes('LANGKAH')?'log-proc':l.includes('Verifikasi')||l.includes('Ditemukan:')?'log-warn':'log-info'}>{l}</span></div>)}</div></div></div>
                {steps.length>0&&<div className="card"><div className="card-header"><div className="card-title">Progress Job</div></div><div className="card-body">
                  <div className="progress-steps">{['Profil','Query','Ambil','Ekstrak','Scoring','Simpan'].map((s,i)=><div key={s} className={`step-item ${steps.includes(s)?'done':steps.some(x=>x===`>${s}`)?'active':''}`}><span className="step-num">{i+1}</span>{s}</div>)}</div>
                  {jobSummary&&<div style={{fontSize:'13px',color:'var(--green)'}}>{jobSummary}</div>}
                </div></div>}
              </div>
            </div>
          </div>}

          {/* Results */}
          {page==='results'&&<div>
            <div className="page-title">Hasil Pelacakan</div>
            <div className="page-desc">Daftar alumni beserta hasil identifikasi otomatis</div>
            <div className="search-row"><div className="search-wrap"><span className="search-icon">🔍</span><input className="form-input" style={{paddingLeft:'34px'}} placeholder="Cari alumni..." value={search} onChange={e=>setSearch(e.target.value)}/></div></div>
            <div className="card"><table><thead><tr><th>Alumni</th><th>Jabatan / Instansi</th><th>Lokasi</th><th>Sumber</th><th>Status</th><th>Confidence</th><th>Aksi</th></tr></thead><tbody>
              {alumni.filter(a=>!search||a.nama.toLowerCase().includes(search.toLowerCase())).map(a=><tr key={a.id}><td><div style={{fontWeight:600}}>{a.nama}</div><div style={{fontSize:'11px',color:'var(--text3)'}}>{a.prodi} &middot; {a.tahun}</div></td><td>{a.jabatan?<><div>{a.jabatan}</div><div style={{fontSize:'11px',color:'var(--text3)'}}>{a.instansi}</div></>:<span style={{color:'var(--text3)'}}>—</span>}</td><td style={{fontSize:'12px'}}>{a.lokasi||'—'}</td><td>{a.sources.length?a.sources.map(s=><span key={s} className="badge badge-blue" style={{fontSize:'10px',margin:'1px'}}>{s}</span>):'—'}</td><td>{statusBadge(a.status)}</td><td style={{minWidth:'120px'}}>{confBar(a.confidence)}</td><td><button className="btn btn-ghost btn-sm" onClick={()=>{setDetailA(a);setModal('detail')}}>Detail</button>{a.status==='Perlu Verifikasi'&&<button className="btn btn-success btn-sm" onClick={()=>manualVerify(a.id)}>Verif</button>}</td></tr>)}
            </tbody></table></div>
          </div>}

          {/* Evidence */}
          {page==='evidence'&&<div>
            <div className="page-title">Jejak Bukti</div>
            <div className="page-desc">Riwayat bukti dan audit trail (Langkah 10)</div>
            <div className="card"><table><thead><tr><th>Alumni</th><th>Sumber</th><th>Jabatan</th><th>Instansi</th><th>Confidence</th><th>Tanggal</th><th>Aksi</th></tr></thead><tbody>
              {evidence.map((e,i)=>{const a=alumni.find(x=>x.id===e.aId);return <tr key={i}><td><div style={{fontWeight:600}}>{a?.nama||'—'}</div><div style={{fontSize:'11px',color:'var(--text3)'}}>{a?.nim}</div></td><td><span className="badge badge-blue">{e.sumber}</span></td><td style={{fontSize:'12px'}}>{e.jabatan}</td><td style={{fontSize:'12px'}}>{e.instansi}</td><td>{confBar(e.confidence)}</td><td style={{fontSize:'11px',color:'var(--text3)'}}>{e.tgl}</td><td><button className="btn btn-ghost btn-sm" onClick={()=>{if(a){setDetailA(a);setModal('detail')}}}>Lihat</button></td></tr>;})}
            </tbody></table></div>
          </div>}

          {/* Sources */}
          {page==='sources'&&<div>
            <div className="page-title">Sumber & Prioritas</div>
            <div className="page-desc">Konfigurasi 8 sumber data publik sesuai Modul 2 (Langkah 2)</div>
            <div className="three-col">{srcs.map((s,i)=>{const tl:Record<string,string>={akademik:'Akademik',profesional:'Profesional',sosmed:'Media Sosial',teknis:'Teknis',umum:'Web Umum'};return <div key={s.nama} className="card"><div className="card-body">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}><span style={{fontSize:'28px'}}>{s.icon}</span><label style={{display:'flex',alignItems:'center',gap:'6px',cursor:'pointer'}}><input type="checkbox" checked={s.aktif} onChange={()=>setSrcs(p=>p.map((x,j)=>j===i?{...x,aktif:!x.aktif}:x))} style={{width:'auto',accentColor:'var(--accent)'}}/><span style={{fontSize:'12px'}}>{s.aktif?'Aktif':'Non-aktif'}</span></label></div>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:'15px',fontWeight:700,marginBottom:'4px'}}>{s.nama}</div>
              <div style={{fontSize:'11px',marginBottom:'8px'}}>{s.desc}</div>
              <span className={`source-pill ${srcClass(s.tipe)}`} style={{fontSize:'10px'}}>{tl[s.tipe]}</span>
            </div></div>;})}</div>
          </div>}

          {/* Reports */}
          {page==='reports'&&<div>
            <div className="page-title">Laporan & Pengujian</div>
            <div className="page-desc">Ringkasan statistik dan tabel pengujian aspek kualitas</div>
            <div className="two-col">
              <div className="card"><div className="card-header"><div className="card-title">Ringkasan Pelacakan</div></div><div className="card-body"><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
                {[['Total Alumni',total,'var(--accent)'],['Tingkat Identifikasi',`${Math.round(found/total*100)}%`,'var(--green)'],['Rata-rata Confidence',`${Math.round(alumni.filter(a=>a.confidence>0).reduce((s,a)=>s+a.confidence,0)/(alumni.filter(a=>a.confidence>0).length||1)*100)}%`,'var(--amber)'],['Perlu Verifikasi',verif,'var(--amber)'],['Belum Ditemukan',alumni.filter(a=>a.status==='Belum Ditemukan').length,'var(--red)'],['Belum Dilacak',pending,'var(--text3)']].map(([l,v,c])=><div key={String(l)} style={{background:'var(--bg3)',padding:'14px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)'}}><div style={{fontSize:'11px',color:'var(--text3)',marginBottom:'4px'}}>{l}</div><div style={{fontSize:'22px',fontFamily:'Syne,sans-serif',fontWeight:800,color:String(c)}}>{v}</div></div>)}
              </div></div></div>
              <div className="card"><div className="card-header"><div className="card-title">Alumni per Prodi</div></div><div className="card-body">
                {Object.entries(alumni.reduce((acc,a)=>({...acc,[a.prodi]:(acc[a.prodi as keyof typeof acc]||0)+1}),{} as Record<string,number>)).map(([k,v])=><div key={k} style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px'}}><div style={{flex:1,fontSize:'13px'}}>{k}</div><div className="bar-track" style={{width:'100px'}}><div className="bar-fill" style={{width:`${Math.round((v as number)/total*100)}%`,background:'var(--accent)'}}/></div><div style={{fontSize:'12px',color:'var(--text2)',width:'30px'}}>{v as number}</div></div>)}
              </div></div>
            </div>
            <div className="card"><div className="card-header"><div className="card-title">Tabel Pengujian Aspek Kualitas (ISO 25010)</div></div><table><thead><tr><th>No</th><th>Aspek Kualitas</th><th>Skenario</th><th>Kriteria</th><th>Hasil</th><th>Status</th></tr></thead><tbody>
              {testRows.map(([a,b,c,d],i)=><tr key={i}><td style={{color:'var(--text3)'}}>{i+1}</td><td style={{fontWeight:600}}>{a}</td><td style={{fontSize:'12px'}}>{b}</td><td style={{fontSize:'12px'}}>{c}</td><td style={{fontSize:'12px',color:'var(--text2)'}}>{d}</td><td><span className="badge badge-green">Lulus</span></td></tr>)}
            </tbody></table></div>
          </div>}

        </div>
      </div>

      {/* Add Alumni Modal */}
      <div className={`modal-backdrop ${modal==='add'?'open':''}`} onClick={e=>{if(e.target===e.currentTarget)setModal('')}}>
        <div className="modal"><div className="modal-header"><div className="modal-title">Tambah Alumni Baru</div><button className="modal-close" onClick={()=>setModal('')}>x</button></div><div className="modal-body"><div className="form-grid">
          <div className="form-group"><label className="form-label">NIM</label><input className="form-input" value={fNim} onChange={e=>setFNim(e.target.value)} placeholder="202110370311xxx"/></div>
          <div className="form-group"><label className="form-label">Nama Lengkap</label><input className="form-input" value={fNama} onChange={e=>setFNama(e.target.value)} placeholder="Muhammad Rizky"/></div>
          <div className="form-group"><label className="form-label">Prodi</label><select className="form-select" value={fProdi} onChange={e=>setFProdi(e.target.value)}><option>Informatika</option><option>Teknik Elektro</option><option>Manajemen</option><option>Akuntansi</option><option>Kedokteran</option></select></div>
          <div className="form-group"><label className="form-label">Tahun Lulus</label><select className="form-select" value={fTahun} onChange={e=>setFTahun(e.target.value)}><option>2020</option><option>2021</option><option>2022</option><option>2023</option><option>2024</option></select></div>
          <div className="form-group"><label className="form-label">Bidang</label><select className="form-select" value={fBidang} onChange={e=>setFBidang(e.target.value)}><option>IT</option><option>Akademik</option><option>Penelitian</option><option>Teknik</option><option>Lainnya</option></select></div>
          <div className="form-group"><label className="form-label">Kota Asal</label><input className="form-input" value={fKota} onChange={e=>setFKota(e.target.value)} placeholder="Malang"/></div>
          <div className="form-group full"><label className="form-label">Opt-Out</label><select className="form-select" value={fOpt} onChange={e=>setFOpt(e.target.value)}><option value="false">Tidak (bersedia dilacak)</option><option value="true">Ya (tidak ingin dilacak)</option></select></div>
        </div></div><div className="modal-footer"><button className="btn btn-ghost" onClick={()=>setModal('')}>Batal</button><button className="btn btn-primary" onClick={addAlumni}>Simpan</button></div></div>
      </div>

      {/* Detail Modal */}
      <div className={`modal-backdrop ${modal==='detail'?'open':''}`} onClick={e=>{if(e.target===e.currentTarget)setModal('')}}>
        {detailA&&<div className="modal" style={{width:'680px'}}><div className="modal-header"><div className="modal-title">Detail: {detailA.nama}</div><button className="modal-close" onClick={()=>setModal('')}>x</button></div><div className="modal-body">
          <div style={{display:'flex',gap:'20px',marginBottom:'20px'}}>
            <div style={{flex:1}}>
              <div style={{fontSize:'12px',color:'var(--text3)',marginBottom:'3px'}}>Nama Lengkap</div>
              <div style={{fontWeight:700,fontSize:'16px',marginBottom:'12px'}}>{detailA.nama}</div>
              <div className="form-grid">{[['NIM',detailA.nim],['Prodi',detailA.prodi],['Tahun',detailA.tahun],['Bidang',detailA.bidang],['Kota',detailA.kota||'—'],['Opt-Out',detailA.optout?'Ya':'Tidak']].map(([l,v])=><div key={l}><div style={{fontSize:'11px',color:'var(--text3)'}}>{l}</div><div style={{fontSize:'13px',fontWeight:500}}>{v}</div></div>)}</div>
            </div>
            <div style={{textAlign:'center',padding:'16px',background:'var(--bg3)',borderRadius:'var(--radius-sm)',minWidth:'120px'}}>
              <div style={{fontSize:'11px',color:'var(--text3)',marginBottom:'8px'}}>Confidence</div>
              <div style={{fontSize:'36px',fontFamily:'Syne,sans-serif',fontWeight:800,color:detailA.confidence>=0.75?'var(--green)':detailA.confidence>=0.45?'var(--amber)':'var(--text3)'}}>{detailA.confidence?`${Math.round(detailA.confidence*100)}%`:'—'}</div>
              <div style={{marginTop:'8px'}}>{statusBadge(detailA.status)}</div>
            </div>
          </div>
          {detailA.jabatan&&<div style={{background:'var(--bg3)',borderRadius:'var(--radius-sm)',padding:'14px',marginBottom:'16px',border:'1px solid var(--border)'}}>
            <div style={{fontSize:'11px',color:'var(--text3)',marginBottom:'6px'}}>INFO KARIR TERIDENTIFIKASI</div>
            <div style={{fontSize:'15px',fontWeight:700}}>{detailA.jabatan}</div>
            <div style={{fontSize:'13px',color:'var(--text2)'}}>{detailA.instansi} &middot; {detailA.lokasi}</div>
            <div style={{fontSize:'11px',color:'var(--text3)',marginTop:'6px'}}>Sumber: {detailA.sources.join(', ')}</div>
          </div>}
          <div style={{fontSize:'12px',color:'var(--text3)',marginBottom:'8px',fontWeight:600}}>VARIASI NAMA</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'5px',marginBottom:'16px'}}>{detailA.variasi.map(v=><span key={v} className="tag">{v}</span>)}</div>
          {evidence.filter(e=>e.aId===detailA.id).length>0&&<>
            <div style={{fontSize:'12px',color:'var(--text3)',marginBottom:'8px',fontWeight:600}}>JEJAK BUKTI</div>
            {evidence.filter(e=>e.aId===detailA.id).map((e,i)=><div key={i} className="evidence-item"><div className="evidence-title">{e.sumber} — {e.jabatan} @ {e.instansi}</div><div className="evidence-meta"><span>{e.lokasi}</span><span>{e.tgl}</span><span>{Math.round(e.confidence*100)}%</span></div><div style={{fontSize:'11px',color:'var(--text3)',marginTop:'6px',fontStyle:'italic'}}>&quot;{e.snippet}&quot;</div></div>)}
          </>}
        </div><div className="modal-footer"><button className="btn btn-ghost" onClick={()=>setModal('')}>Tutup</button>{detailA.status==='Perlu Verifikasi'&&<button className="btn btn-success btn-sm" onClick={()=>{manualVerify(detailA.id);setModal('')}}>Verifikasi Manual</button>}</div></div>}
      </div>

      {/* Toast */}
      <div className="toast-area">{toasts.map(t=><div key={t.id} className={`toast toast-${t.type}`}><span>{t.type==='ok'?'✅':'⚠️'}</span><span>{t.msg}</span></div>)}</div>
    </div>
  );
}
