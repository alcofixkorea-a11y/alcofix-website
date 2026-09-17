// Gives every page its own address: about/, product/, vision/, contact/.
// Each is a copy of index.html that opens straight on its page, with its own title and share preview.
// Usage: node tools/build-pages.js [site-folder]   (runs in the deploy workflow before upload)
const fs = require('fs');
const path = require('path');

const SITE = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const ORIGIN = 'https://alcofix.co.kr/';

const PAGES = [
    { id: 'about', title: '기업소개 | ALCOFIX 알코픽스',
      desc: '주식회사 알코픽스(ALCOFIX Inc.) 기업소개 — 건강한 음주문화를 선도하는 알코올 토탈 솔루션 기업의 사업 현황, 대표자, 협력사를 소개합니다.' },
    { id: 'product', title: '제품소개 | ALCOFIX 알코픽스',
      desc: '17종 한방원료로 만든 3mm 환형 숙취해소제 확깨유와 개발 중인 알코픽스 제품 라인업을 소개합니다.' },
    { id: 'vision', title: '비전 | ALCOFIX 알코픽스',
      desc: 'ALCOHOL + FIX = ALCOFIX. 알코픽스의 사명, 미션·비전, 핵심가치를 소개합니다.' },
    { id: 'contact', title: '문의하기 | ALCOFIX 알코픽스',
      desc: '제품·제휴·수출 문의는 알코픽스 홈페이지 문의 양식으로 보내주세요.' }
];

const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
function setAttr(h, re, value, label) {
    if (!re.test(h)) throw new Error('missing ' + label);
    return h.replace(re, (m, a, b) => a + esc(value) + b);
}

const home = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');

for (const pg of PAGES) {
    let h = home;
    const url = ORIGIN + pg.id + '/';
    h = h.replace(/<title>[^<]*<\/title>/, '<title>' + pg.title + '</title>');
    h = setAttr(h, /(<meta name="description" content=")[^"]*(")/, pg.desc, 'description');
    h = setAttr(h, /(<link rel="canonical" href=")[^"]*(")/, url, 'canonical');
    h = setAttr(h, /(<meta property="og:url" content=")[^"]*(")/, url, 'og:url');
    h = setAttr(h, /(<meta property="og:title" content=")[^"]*(")/, pg.title, 'og:title');
    h = setAttr(h, /(<meta property="og:description" content=")[^"]*(")/, pg.desc, 'og:description');
    h = setAttr(h, /(<meta name="twitter:title" content=")[^"]*(")/, pg.title, 'twitter:title');
    h = setAttr(h, /(<meta name="twitter:description" content=")[^"]*(")/, pg.desc, 'twitter:description');
    // one folder down: files one level up, and the page to open
    h = h.replace(/((?:src|href|data-img)=")(?=(?:images|css|js)\/|privacy\.html|terms\.html)/g, '$1../');
    h = h.replace(/<body([^>]*)data-root="\.\/"/, '<body$1data-root="../" data-page="' + pg.id + '"');
    if (!h.includes('data-page="' + pg.id + '"')) throw new Error('body data-root missing');
    fs.mkdirSync(path.join(SITE, pg.id), { recursive: true });
    fs.writeFileSync(path.join(SITE, pg.id, 'index.html'), h);
}
console.log('pages built:', PAGES.map(p => p.id + '/').join(' '));
