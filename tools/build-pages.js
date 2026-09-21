// Gives every page its own address: about/, product/, vision/, contact/ — and the same under en/.
// Each is a copy of a home page (index.html or en/index.html) that opens straight on its page,
// with its own title, share preview and language links.
// Usage: node tools/build-pages.js [site-folder]   (runs in the deploy workflow before upload)
const fs = require('fs');
const path = require('path');

const SITE = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const ORIGIN = 'https://alcofix.co.kr/';

const LANGS = [
    {
        lang: 'ko', home: 'index.html', base: '',
        pages: [
            { id: 'about', title: '기업소개 | ALCOFIX 알코픽스',
              desc: '주식회사 알코픽스(ALCOFIX Inc.) 기업소개 — 건강한 음주문화를 선도하는 알코올 토탈 솔루션 기업의 사업 현황, 연혁, 소식, 대표자를 소개합니다.' },
            { id: 'product', title: '제품소개 | ALCOFIX 알코픽스',
              desc: '17종 한방원료로 만든 3mm 환형 숙취해소제 확깨유와 개발 중인 알코픽스 제품 라인업을 소개합니다.' },
            { id: 'vision', title: '비전 | ALCOFIX 알코픽스',
              desc: 'ALCOHOL + FIX = ALCOFIX. 알코픽스의 사명, 미션·비전, 핵심가치를 소개합니다.' },
            { id: 'contact', title: '문의하기 | ALCOFIX 알코픽스',
              desc: '제품·제휴·수출 문의는 알코픽스 홈페이지 문의 양식으로 보내주세요.' }
        ]
    },
    {
        lang: 'en', home: 'en/index.html', base: 'en/',
        pages: [
            { id: 'about', title: 'About | ALCOFIX',
              desc: 'ALCOFIX Inc. is an alcohol total solution company leading a healthier drinking culture. Our business, history, news and founder.' },
            { id: 'product', title: 'Products | ALCOFIX',
              desc: 'Hwakggaeu (Wakie): 3mm herbal pills made from 17 herbal ingredients, and the ALCOFIX product line in development.' },
            { id: 'vision', title: 'Vision | ALCOFIX',
              desc: 'ALCOHOL + FIX = ALCOFIX. Our name, mission, vision and core values.' },
            { id: 'contact', title: 'Contact | ALCOFIX',
              desc: 'Product, partnership and export enquiries for ALCOFIX Inc.' }
        ]
    }
];

const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
function setAttr(h, re, value, label) {
    if (!re.test(h)) throw new Error('missing ' + label);
    return h.replace(re, (m, a, b) => a + esc(value) + b);
}
// the same page in each language, for the hreflang links
const pageUrl = (base, id) => ORIGIN + base + (id ? id + '/' : '');

const built = [];
for (const L of LANGS) {
    const file = path.join(SITE, L.home);
    if (!fs.existsSync(file)) { console.log('skipped (no ' + L.home + ')'); continue; }
    const home = fs.readFileSync(file, 'utf8');

    for (const pg of L.pages) {
        let h = home;
        const url = pageUrl(L.base, pg.id);
        h = h.replace(/<title>[^<]*<\/title>/, '<title>' + pg.title + '</title>');
        h = setAttr(h, /(<meta name="description" content=")[^"]*(")/, pg.desc, 'description');
        h = setAttr(h, /(<link rel="canonical" href=")[^"]*(")/, url, 'canonical');
        h = setAttr(h, /(<meta property="og:url" content=")[^"]*(")/, url, 'og:url');
        h = setAttr(h, /(<meta property="og:title" content=")[^"]*(")/, pg.title, 'og:title');
        h = setAttr(h, /(<meta property="og:description" content=")[^"]*(")/, pg.desc, 'og:description');
        h = setAttr(h, /(<meta name="twitter:title" content=")[^"]*(")/, pg.title, 'twitter:title');
        h = setAttr(h, /(<meta name="twitter:description" content=")[^"]*(")/, pg.desc, 'twitter:description');
        h = h.replace(/(<link rel="alternate" hreflang="ko" href=")[^"]*(")/, '$1' + pageUrl('', pg.id) + '$2');
        h = h.replace(/(<link rel="alternate" hreflang="en" href=")[^"]*(")/, '$1' + pageUrl('en/', pg.id) + '$2');
        h = h.replace(/(<link rel="alternate" hreflang="x-default" href=")[^"]*(")/, '$1' + pageUrl('', pg.id) + '$2');
        // one folder down: every shared file is one more level up, and the page to open
        h = h.replace(/((?:src|href|data-img)=")(?=(?:\.\.\/)*(?:(?:images|css|js|files)\/|privacy\.html|terms\.html))/g, '$1../');
        h = h.replace(/<body([^>]*)data-root="\.\/"/, '<body$1data-root="../" data-page="' + pg.id + '"');
        if (!h.includes('data-page="' + pg.id + '"')) throw new Error(L.home + ': body data-root missing');
        const dir = path.join(SITE, L.base, pg.id);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'index.html'), h);
        built.push(L.base + pg.id + '/');
    }
}
console.log('pages built:', built.join(' '));
