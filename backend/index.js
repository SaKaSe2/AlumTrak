const express = require('express');
const cors = require('cors');
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Activate stealth plugin
puppeteerExtra.use(StealthPlugin());

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ status: 'Simawa OSINT Backend Active', engine: 'Puppeteer Stealth' });
});

app.get('/api/tracer', async (req, res) => {
    const { nim, target } = req.query;

    if (!nim) {
        return res.status(400).json({ success: false, error: 'Parameter nim wajib diisi' });
    }

    let browser = null;
    try {
        // Launch Puppeteer locally or in Docker
        browser = await puppeteerExtra.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ],
            defaultViewport: { width: 1920, height: 1080 }
        });

        const page = await browser.newPage();
        
        // Timeout protection for Koyeb (Heroku-style 30s timeout)
        let timeoutTriggered = false;
        const pageTimeout = setTimeout(() => timeoutTriggered = true, 28000);

        await page.goto('https://simawa.umm.ac.id/tracermhs', { waitUntil: 'domcontentloaded', timeout: 15000 });

        await page.waitForSelector('input[name="nim"]', { timeout: 10000 });
        await page.type('input[name="nim"]', nim);

        await page.click('button[type="submit"]');

        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});

        // Cek target tabel
        const isFound = await page.evaluate(() => {
            return document.querySelector('.alert-success') !== null && document.body.innerText.includes('Data Alumni Ditemukan');
        });

        if (isFound) {
            const nextUrl = await page.evaluate(() => {
                const btn = document.querySelector('a.btn-info');
                return btn ? btn.href : null;
            });

            if (nextUrl) {
                await page.goto(nextUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
            }

            const profileData = await page.evaluate(() => {
                const emailInput = document.querySelector('input[type="email"], input[name*="email"]');
                const hpInput = document.querySelector('input[name*="hp"], input[name*="wa"], input[name*="telp"]');
                
                // Cari dari TextBox langsung kalau ada
                const companyInput = document.querySelector('input[name*="instansi"], input[name*="perusahaan"], input[name*="tempat_kerja"], textarea[name*="instansi"]');
                const jobInput = document.querySelector('input[name*="jabatan"], input[name*="posisi"], input[name*="pekerjaan"]');

                return {
                    email: emailInput ? emailInput.value : '',
                    hp: hpInput ? hpInput.value : '',
                    companyInput: companyInput ? companyInput.value : '',
                    jobInput: jobInput ? jobInput.value : ''
                };
            });

            const textContent = await page.evaluate(() => document.body.innerText);
            
            // Regex anti-bocor: Hanya membaca spasi biasa (bukan baris baru/Enter) dan membatasi teks 2-50 karakter
            const ptMatch = textContent.match(/(?:PT\.|PT|CV\.|CV|Dinas|Bank)[ \t]+([A-Za-z0-9 \,\.\&]{3,50})/i);
            const jobMatch = textContent.match(/(?:Sebagai|Posisi|Jabatan)[ \t]*:?[ \t]*([A-Za-z0-9 \,\.\&]{3,50})/i);
            
            // Prioritaskan input form, jika kosong baru tebak pakai Regex, jika Regex memakan opsi jawaban, beri default
            let guessedPt = ptMatch ? (ptMatch[0].length > 45 ? 'Perusahaan/Instansi' : ptMatch[0].trim()) : 'Perusahaan/Instansi (Reg)';
            let guessedJob = jobMatch ? (jobMatch[1].length > 45 ? 'Alumni' : jobMatch[1].trim()) : 'Alumni Simawa (Reg)';

            let instansi = profileData.companyInput || guessedPt;
            let jabatan = profileData.jobInput || guessedJob;

            clearTimeout(pageTimeout);
            return res.json({
                success: true,
                data: {
                    nama: target || 'Simawa Subject',
                    tahun_lulus: 2023,
                    status_pekerjaan: 'Tervalidasi Simawa UMM',
                    instansi: instansi,
                    jabatan: jabatan,
                    email: profileData.email,
                    no_hp: profileData.hp,
                    keselarasan_bidang: 'Tervalidasi Akun',
                    sumber: 'Direktori Simawa (Tracer Backend)'
                }
            });
        } else {
            clearTimeout(pageTimeout);
            return res.json({ success: false, error: 'Data tidak ditemukan di Simawa UMM' });
        }
    } catch (error) {
        console.error('[SIMAWA Backend] Error:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    } finally {
        if (browser) await browser.close();
    }
});

// Endpoint debug: test login LinkedIn dan report hasilnya
app.get('/api/linkedin-debug', async (req, res) => {
    let browser = null;
    const logs = [];
    try {
        browser = await puppeteerExtra.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process', '--disable-gpu'],
            defaultViewport: { width: 1280, height: 800 }
        });
        const page = await browser.newPage();

        const liEmail = process.env.LINKEDIN_EMAIL;
        const liPassword = process.env.LINKEDIN_PASSWORD;
        logs.push(`Email: ${liEmail ? liEmail.substring(0, 5) + '***' : 'NOT SET'}`);
        logs.push(`Password: ${liPassword ? '***set***' : 'NOT SET'}`);

        // Test login
        await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded', timeout: 20000 });
        logs.push(`Login page title: "${await page.title()}"`);

        if (liEmail && liPassword) {
            await page.type('#username', liEmail, { delay: 30 });
            await page.type('#password', liPassword, { delay: 30 });
            await page.click('button[type="submit"]');
            await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
            await new Promise(r => setTimeout(r, 3000));
        }

        const url = page.url();
        const title = await page.title();
        const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 1000) || '');
        
        logs.push(`After login URL: ${url}`);
        logs.push(`After login title: "${title}"`);
        logs.push(`Has /feed: ${url.includes('/feed')}`);
        logs.push(`Has /checkpoint: ${url.includes('/checkpoint')}`);
        logs.push(`Has /challenge: ${url.includes('/challenge')}`);
        logs.push(`Body snippet: ${bodyText.substring(0, 500)}`);

        return res.json({ success: true, logs });
    } catch (err) {
        logs.push(`Error: ${err.message}`);
        return res.json({ success: false, logs, error: err.message });
    } finally {
        if (browser) await browser.close();
    }
});

// Endpoint LinkedIn: Navigasi ke halaman alumni UMM, lalu cari nama target
app.get('/api/linkedin', async (req, res) => {
    const { target } = req.query;

    if (!target) {
        return res.status(400).json({ success: false, error: 'Parameter target wajib diisi' });
    }

    let browser = null;
    try {
        const targetWords = target.toLowerCase().split(/\s+/);
        let candidates = [];

        // Helper: score matching nama
        const scoreName = (profileName) => {
            const nameLower = profileName.toLowerCase();
            let matchCount = 0;
            for (const word of targetWords) {
                if (word.length >= 3 && nameLower.includes(word)) matchCount++;
            }
            return targetWords.length > 0 ? Math.round((matchCount / targetWords.length) * 100) : 0;
        };

        // PARSE DARI TEKS GOOGLE/SERPER SNIPPET
        const parseFromSnippet = (title, snippet) => {
            let name = '', headline = '', company = '', location = '';
            
            // Format title: "Agus Santoso - Software Engineer - PT Jaya ..."
            const parts = title.split(' - ');
            name = parts[0]?.trim() || '';
            if (parts.length > 1) {
                headline = parts.slice(1).join(' - ').split(' | LinkedIn')[0].trim();
            }

            // Coba parsing dengan delimiter middle-dot khas Google HTML
            const snippetParts = snippet.split('·').map(s => s.trim());
            
            if (snippetParts.length >= 3) {
                location = snippetParts[0];
                if (!headline) headline = snippetParts[1];
                company = snippetParts[2];
            } else if (snippetParts.length === 2) {
                location = snippetParts[0];
                if (!company) company = snippetParts[1];
            }

            // Jika middle-dot tidak berhasil (Serper API format beda),
            // cari pattern company dan lokasi langsung dari teks snippet
            if (!company) {
                const companyMatch = snippet.match(/\b(PT\.?\s+[A-Z][A-Za-z\s\.]+|CV\.?\s+[A-Z][A-Za-z\s\.]+|UD\.?\s+[A-Z][A-Za-z\s\.]+)/);
                if (companyMatch) {
                    company = companyMatch[1].trim();
                    company = company.replace(/\s+(University|Universitas|Kota|Malang|Jakarta|Surabaya).*$/i, '').trim();
                }
            }

            if (!location) {
                const locMatch = snippet.match(/(Kota\s+[A-Za-z]+(?:,\s*[A-Za-z\s]+)?(?:,\s*Indonesia)?|[A-Za-z\s]+,\s*Indonesia|Malang|Jakarta|Surabaya|Sorong|West Papua|East Java|Jawa Timur)/i);
                if (locMatch) {
                    location = locMatch[1].trim();
                }
            }

            // Fallback parsing company dari headline jika belum dapat
            if (!company && headline) {
                const atMatch = headline.match(/\bat\s+(.+)/i);
                if (atMatch) company = atMatch[1].trim();
                if (!company) {
                    const hParts = headline.split(/\s*[\|]\s*/);
                    if (hParts.length >= 2) company = hParts[hParts.length - 1].trim();
                }
            }

            // Clean up name
            name = name.replace(/LinkedIn/gi, '').trim();

            return { name, headline, company, location, snippet };
        };

        console.log('[LinkedIn] Mencari profil via Serper.dev Google Search API...');
        
        const SERPER_KEY = process.env.SERPER_API_KEY;

        if (!SERPER_KEY) {
            console.error('[LinkedIn] SERPER_API_KEY tidak ditemukan di Environment Variables!');
             return res.json({ 
                success: false, 
                error: 'Sistem Belum Dikonfigurasi: Harap masukkan SERPER_API_KEY pada Dashboard Environment Variables Server Anda.'
            });
        }

        const query = `site:linkedin.com/in "${target}" ("Muhammadiyah" OR "UMM")`;

        try {
            console.log(`[LinkedIn] HTTP Fetching Serper API: "${query}"`);
            const response = await fetch('https://google.serper.dev/search', {
                method: 'POST',
                headers: {
                    'X-API-KEY': SERPER_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ q: query, num: 10 })
            });
            
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(`Serper API melempar status ${response.status}: ${errData?.message || 'Unknown Error'}`);
            }

            const data = await response.json();
            const organicResults = data.organic || [];

            if (organicResults.length > 0) {
                console.log(`[LinkedIn] Ditemukan ${organicResults.length} hasil profil dari Serper API.`);
                
                for (const item of organicResults) {
                    if (!item.link.includes('linkedin.com/in/')) continue;

                    const parsedData = parseFromSnippet(item.title, item.snippet || '');
                    const matchScore = scoreName(parsedData.name);

                    if (!parsedData.company && parsedData.headline.toLowerCase().includes('officer')) {
                        parsedData.company = "Detail tidak terlihat (Hidden)";
                    }

                    const allText = (item.title + ' ' + (item.snippet || '')).toLowerCase();
                    const hasMuhammadiyah = allText.includes('muhammadiyah') || allText.includes('umm');

                    // Hard validation Muhammadiyah
                    if (hasMuhammadiyah) {
                        candidates.push({
                            url: item.link.split('?')[0],
                            name: parsedData.name,
                            headline: parsedData.headline,
                            company: parsedData.company,
                            location: parsedData.location,
                            matchScore,
                            hasUniHint: true
                        });
                        console.log(`[LinkedIn] Serper API: ${parsedData.name} | Muhammadiyah Validated! | Score: ${matchScore}%`);
                    } else {
                        console.log(`[LinkedIn] Ditolak: ${parsedData.name} (Bukan Muhammadiyah)`);
                    }
                }
            } else {
                console.log('[LinkedIn] Serper API me-return 0 hasil.');
            }

        } catch (err) {
            console.warn(`[LinkedIn] Kesalahan menghubungi Serper API: ${err.message}`);
             return res.json({ 
                success: false, 
                error: `Error Internal Serper API: ${err.message}`
            });
        }

        if (candidates.length === 0) {
            return res.json({ 
                success: false, 
                error: 'Tidak ditemukan profil LinkedIn dari hasil pencarian.'
            });
        }
        // Filter kandidat yang relevan (skor di atas 50%)
        const validCandidates = candidates.filter(c => c.matchScore >= 50);

        if (validCandidates.length === 0) {
             return res.json({ success: false, error: 'Profil ditemukan tetapi nama tidak relevan / matchScore rendah.' });
        }

        // Pilih best match
        validCandidates.sort((a, b) => {
            if (a.hasUniHint && !b.hasUniHint) return -1;
            if (!a.hasUniHint && b.hasUniHint) return 1;
            return b.matchScore - a.matchScore;
        });

        const best = validCandidates[0];
        let physicalAddress = null;
        let physicalWebsite = null;

        if (best.company && !best.company.toLowerCase().includes('hidden')) {
            try {
                console.log(`[Google Places] Mencari alamat fisik untuk: "${best.company}"`);
                const reqPlaces = await fetch('https://google.serper.dev/places', {
                    method: 'POST',
                    headers: {
                        'X-API-KEY': SERPER_KEY,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ q: best.company })
                });

                if (reqPlaces.ok) {
                    const placeData = await reqPlaces.json();
                    if (placeData.places && placeData.places.length > 0) {
                        physicalAddress = placeData.places[0].address;
                        physicalWebsite = placeData.places[0].website || null;
                        console.log(`[Google Places] Alamat Fisik Ditemukan: ${physicalAddress}`);
                    }
                }
            } catch (err) {
                console.error(`[Google Places] Gagal:`, err.message);
            }
        }

        return res.json({
            success: true,
            data: {
                url: best.url,
                name: best.name,
                headline: best.headline,
                company: best.company,
                location: best.location,
                physicalAddress: physicalAddress,
                physicalWebsite: physicalWebsite,
                matchScore: best.matchScore,
                hasUniHint: best.hasUniHint,
                totalChecked: candidates.length
            }
        });

    } catch (error) {
        console.error('[LinkedIn Backend] Error:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    } finally {
        if (browser) await browser.close();
    }
});

// Endpoint pencarian sosial media (Facebook & Instagram) via Serper
app.get('/api/social-search', async (req, res) => {
    const { target, platform } = req.query;

    if (!target || !platform) {
        return res.status(400).json({ success: false, error: 'Parameter target dan platform wajib diisi' });
    }

    const SERPER_KEY = process.env.SERPER_API_KEY;
    if (!SERPER_KEY) {
        return res.json({ success: false, error: 'SERPER_API_KEY tidak ditemukan' });
    }

    // Konfigurasi per platform
    const config = {
        facebook: {
            siteFilter: 'site:facebook.com',
            urlPattern: /facebook\.com\/[a-zA-Z0-9._-]+/i,
            excludePatterns: ['/pages/', '/groups/', '/events/', '/watch/', '/marketplace/']
        },
        instagram: {
            siteFilter: 'site:instagram.com',
            urlPattern: /instagram\.com\/[a-zA-Z0-9._]+/i,
            excludePatterns: ['/p/', '/reel/', '/explore/', '/stories/']
        }
    };

    const cfg = config[platform];
    if (!cfg) {
        return res.json({ success: false, error: 'Platform tidak didukung. Gunakan: facebook atau instagram' });
    }

    try {
        console.log(`[${platform}] Mencari profil "${target}" via Serper...`);
        const query = `${cfg.siteFilter} "${target}"`;

        const response = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
                'X-API-KEY': SERPER_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ q: query, num: 5 })
        });

        if (!response.ok) {
            throw new Error(`Serper API error: ${response.status}`);
        }

        const data = await response.json();
        const results = data.organic || [];

        // Ambil hasil pertama yang merupakan profil (bukan post/group/page)
        for (const item of results) {
            const url = item.link || '';
            const isExcluded = cfg.excludePatterns.some(p => url.includes(p));
            if (!isExcluded && cfg.urlPattern.test(url)) {
                console.log(`[${platform}] Profil ditemukan: ${url}`);
                return res.json({
                    success: true,
                    data: {
                        url: url,
                        title: item.title || '',
                        snippet: item.snippet || '',
                        platform: platform
                    }
                });
            }
        }

        console.log(`[${platform}] Tidak ditemukan profil untuk "${target}"`);
        return res.json({ success: false, error: `Profil ${platform} tidak ditemukan` });

    } catch (error) {
        console.error(`[${platform}] Error:`, error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
});

// Keep-alive: Ping diri sendiri setiap 14 menit agar Render free tier tidak tidur
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`OSINT Backend berjalan di http://localhost:${PORT}`);
    
    // Self-ping setiap 14 menit untuk mencegah cold start
    if (process.env.RENDER_EXTERNAL_URL) {
        setInterval(() => {
            fetch(process.env.RENDER_EXTERNAL_URL)
                .then(() => console.log('[Keep-Alive] Ping OK'))
                .catch(() => {});
        }, 14 * 60 * 1000);
    }
});
