(function(){
    'use strict';

    var intro = document.getElementById('intro');
    var menuScreen = document.getElementById('menuScreen');
    var skipBtn = document.getElementById('skipBtn');
    var logoPhase = document.getElementById('logoPhase');
    var sloganPhase = document.getElementById('sloganPhase');

    var introTimeout = [];

    function schedule(fn, ms) {
        var t = setTimeout(fn, ms);
        introTimeout.push(t);
        return t;
    }

    /* Two-second intro: logo, slogan, then the menu */
    function startIntro() {
        logoPhase.classList.add('active');

        var logo = logoPhase.querySelector('.intro-logo');
        if (logo) schedule(function(){ logo.classList.add('show'); }, 60);

        schedule(function() {
            logoPhase.classList.remove('active');
            sloganPhase.classList.add('active');
            schedule(function() {
                sloganPhase.querySelector('.slogan-en').classList.add('show');
            }, 60);
            schedule(function() {
                sloganPhase.querySelector('.slogan-ko').classList.add('show');
            }, 200);
        }, 850);

        schedule(showMenu, 1600);
    }

    function revealMenu() {
        menuScreen.classList.add('active');
        menuScreen.dataset.mode = 'scatter';
    }

    function showMenu() {
        intro.style.transition = 'opacity 0.4s ease';
        intro.style.opacity = '0';
        skipBtn.style.transition = 'opacity 0.3s';
        skipBtn.style.opacity = '0';

        schedule(function() {
            intro.style.display = 'none';
            skipBtn.style.display = 'none';
            revealMenu();

            var items = menuScreen.querySelectorAll('.mi');
            items.forEach(function(item, i) {
                setTimeout(function() {
                    item.classList.add('show');
                }, 60 + i * 70);
            });
        }, 400);
    }

    function skipIntro() {
        introTimeout.forEach(clearTimeout);
        introTimeout = [];
        intro.style.display = 'none';
        skipBtn.style.display = 'none';
        revealMenu();
        var items = menuScreen.querySelectorAll('.mi');
        items.forEach(function(item) { item.classList.add('show'); });
    }

    skipBtn.addEventListener('click', skipIntro);

    /* ===== Half-screen photo: each menu word swaps in its own page's photo ===== */
    var decoCard = document.getElementById('decoCard');
    var decoImgs = {};
    if (decoCard) {
        decoImgs.main = decoCard.querySelector('img');
        document.querySelectorAll('.mi[data-img]').forEach(function(item) {
            var img = document.createElement('img');
            img.src = item.dataset.img;          // loading it here doubles as a preload
            img.alt = '';
            img.dataset.key = item.dataset.panel;
            decoCard.appendChild(img);
            decoImgs[item.dataset.panel] = img;
        });
    }

    // Moving between pages rewrites the address bar, and any photo fetched after that would
    // read its relative path against the new address (images/use-1.jpg -> /product/images/use-1.jpg,
    // which does not exist). Pin every photo to its full address while the first address still applies.
    document.querySelectorAll('img[src]').forEach(function(img) {
        img.setAttribute('src', img.src);
    });
    // the same goes for links to files, such as the brochures
    document.querySelectorAll('a[href]').forEach(function(a) {
        var href = a.getAttribute('href');
        if (href && href.charAt(0) !== '#') a.setAttribute('href', a.href);
    });

    var decoKey = 'main';
    function showDeco(key) {
        decoKey = decoImgs[key] ? key : 'main';
        var target = decoImgs[decoKey];
        if (!decoCard) return;
        decoCard.querySelectorAll('img').forEach(function(img) {
            img.classList.toggle('is-on', img === target);
        });
    }

    /* ===== Main photo: the main photographs take turns while nobody is hovering a menu word ===== */
    var mainSlides = decoCard ? Array.prototype.slice.call(decoCard.querySelectorAll('img[data-key="main"]')) : [];
    if (mainSlides.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setInterval(function() {
            if (decoKey !== 'main' || document.hidden) return;
            // only photographs that actually loaded join the rotation
            var ready = mainSlides.filter(function(img) { return img.complete && img.naturalWidth > 0; });
            if (ready.length < 2) return;
            decoImgs.main = ready[(ready.indexOf(decoImgs.main) + 1) % ready.length];
            showDeco('main');
        }, 7000);
    }

    /* ===== Core message follows the hovered page ===== */
    var heroCopy = document.querySelector('.hero-copy');
    var copyText = {};
    if (heroCopy) {
        copyText.main = {
            eb: heroCopy.querySelector('.hero-eb').textContent,
            h: heroCopy.querySelector('.hero-h').textContent
        };
        document.querySelectorAll('.mi[data-copy]').forEach(function(item) {
            copyText[item.dataset.panel] = { eb: item.dataset.copyEb || copyText.main.eb, h: item.dataset.copy };
        });
    }
    var copyKey = 'main';
    var copyTimer = null;

    function showCopy(key) {
        if (!heroCopy) return;
        if (!copyText[key]) key = 'main';
        if (key === copyKey) return;
        copyKey = key;
        clearTimeout(copyTimer);
        heroCopy.classList.add('is-out');
        copyTimer = setTimeout(function() {
            heroCopy.querySelector('.hero-eb').textContent = copyText[copyKey].eb;
            heroCopy.querySelector('.hero-h').textContent = copyText[copyKey].h;
            heroCopy.classList.remove('is-out');
        }, 170);
    }

    /* ===== Language: the English pages under /en/ run this same script ===== */
    var EN = (document.documentElement.lang || '').slice(0, 2) === 'en';
    var T = EN ? {
        pagesNav: 'Pages',
        sending: 'Sending…',
        wait: 'Sending your message.',
        ok: 'Thank you. We have received your message and will reply to the email address you entered.',
        fail: 'Your message could not be sent. Please try again later, or email us at ',
        failTail: '.',
        send: 'Send message',
        subject: '[알코픽스 홈페이지 문의 · EN] ',
        langNav: 'Language'
    } : {
        pagesNav: '페이지 선택',
        sending: '보내는 중…',
        wait: '문의를 보내고 있습니다.',
        ok: '문의가 접수되었습니다. 확인 후 입력하신 이메일로 답변드리겠습니다.',
        fail: '문의를 보내지 못했습니다. 잠시 후 다시 시도하시거나 ',
        failTail: '으로 보내주세요.',
        send: '문의하기',
        subject: '[알코픽스 홈페이지 문의] ',
        langNav: '언어 선택'
    };

    /* ===== Panels ===== */
    var pages = [
        { id: 'about',    en: 'We are ALCOFIX', ko: EN ? 'Company'  : '기업 소개' },
        { id: 'product',  en: 'Our Product',    ko: EN ? 'Products' : '제품 소개' },
        { id: 'vision',   en: 'Our Vision',     ko: EN ? 'Vision'   : '비전' },
        { id: 'contact',  en: 'Contact Us',     ko: EN ? 'Contact'  : '문의하기' }
    ];

    /* ===== Page addresses: every page has its own link (about/, product/, vision/, contact/) ===== */
    var ROOT = document.body.dataset.root || './';
    // the site's own address, worked out once. reading it from location.href later would stack
    // the pages up as /product/about/vision/ , because moving between pages rewrites the address.
    var SITE = new URL(ROOT, location.href).href;
    var pageIds = pages.map(function(p) { return p.id; });
    function pageUrl(id) { return new URL(id ? id + '/' : '', SITE).href; }
    function pageFromLocation() {
        var base = new URL(SITE).pathname;
        var rest = location.pathname.indexOf(base) === 0 ? location.pathname.slice(base.length) : '';
        rest = rest.replace(/index\.html$/, '').replace(/\/$/, '');
        if (pageIds.indexOf(rest) >= 0) return rest;
        // older links such as alcofix.co.kr/#product
        var hash = location.hash.slice(1);
        return (!rest && pageIds.indexOf(hash) >= 0) ? hash : '';
    }
    var PAGE_TITLES = EN
        ? { '': 'ALCOFIX | Alcohol Total Solution Company for a Healthier Drinking Culture', about: 'About | ALCOFIX', product: 'Products | ALCOFIX', vision: 'Vision | ALCOFIX', contact: 'Contact | ALCOFIX' }
        : { '': 'ALCOFIX 알코픽스 | 건강한 음주문화를 선도하는 알코올 토탈 솔루션 기업', about: '기업소개 | ALCOFIX 알코픽스', product: '제품소개 | ALCOFIX 알코픽스', vision: '비전 | ALCOFIX 알코픽스', contact: '문의하기 | ALCOFIX 알코픽스' };
    function remember(id) {
        document.title = PAGE_TITLES[id] || PAGE_TITLES[''];
        var url = pageUrl(id);
        if (location.href !== url && window.history && history.pushState) history.pushState({ page: id }, '', url);
        updateLangLinks();
    }

    /* ===== Language switch: KR · EN, pointing at the same page in the other language ===== */
    var OTHER_ROOT = new URL(EN ? '../' : 'en/', SITE).href;
    function otherLangUrl() {
        var id = pageFromLocation();
        return new URL(id ? id + '/' : '', OTHER_ROOT).href + location.hash;
    }
    function langSwitch() {
        var wrap = document.createElement('nav');
        wrap.className = 'lang';
        wrap.setAttribute('aria-label', T.langNav);
        wrap.innerHTML =
            '<a lang="ko" hreflang="ko" data-lang="ko"' + (EN ? '' : ' aria-current="true"') + '>KR</a>' +
            '<i aria-hidden="true"></i>' +
            '<a lang="en" hreflang="en" data-lang="en"' + (EN ? ' aria-current="true"' : '') + '>EN</a>';
        return wrap;
    }
    function updateLangLinks() {
        var target = otherLangUrl();
        document.querySelectorAll('.lang a').forEach(function(a) {
            a.href = a.hasAttribute('aria-current') ? location.href : target;
        });
    }
    document.addEventListener('click', function(e) {
        var a = e.target.closest && e.target.closest('.lang a');
        if (!a) return;
        e.preventDefault();
        if (!a.hasAttribute('aria-current')) location.href = otherLangUrl();
    });
    var menuHeader = document.querySelector('.menu-header');
    if (menuHeader) menuHeader.appendChild(langSwitch());

    /* Hovering a word only changes the photo; a click opens the page.
       Moving between pages: the current content clears away while the top bar stays,
       then the next page fades in and its content rises. Nothing slides sideways. */
    var canHover = window.matchMedia('(hover: hover)').matches;
    var panels = document.querySelectorAll('.panel');
    var CLEAR_MS = 250;         // .panel.leaving content fade
    var FADE_MS = 450;          // .panel opacity fade, with a little room
    var timers = [];
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function clearLater() { timers.forEach(clearTimeout); timers = []; }

    /* Page content rises into place as it comes into view, again on every visit */
    function revealIn(p) {
        return p + ' > :not(section):not(ol):not(ul):not(.grid-2):not(.grid-3):not(.contact-grid):not(.subpage):not(.subtabs):not(.subtabs-anchor),' +
               p + ' > section > *, ' + p + ' > ol > li, ' + p + ' > ul > li, ' + p + ' > .grid-2 > *, ' + p + ' > .grid-3 > *';
    }
    var REVEAL = revealIn('.panel-inner') + ',' + revealIn('.subpage') + ', .panel-inner .contact-grid > *';
    var canReveal = 'IntersectionObserver' in window &&
                    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (canReveal) {
        panels.forEach(function(panel) {
            panel.querySelectorAll(REVEAL).forEach(function(el) {
                var i = Array.prototype.indexOf.call(el.parentNode.children, el);
                el.classList.add('rv');
                el.style.setProperty('--rv-d', (i % 4) * 80 + 'ms');
            });
            panel._rv = new IntersectionObserver(function(entries, obs) {
                entries.forEach(function(entry) {
                    if (!entry.isIntersecting || !panel.classList.contains('open')) return;
                    // what is on screen when the page opens waits for the page to appear first
                    var wait = Math.max(0, 300 - (Date.now() - (panel._openedAt || 0)));
                    entry.target.style.setProperty('--rv-base', wait + 'ms');
                    entry.target.classList.add('in');
                    obs.unobserve(entry.target);
                });
            }, { root: panel, rootMargin: '0px 0px -6% 0px' });
        });
    }

    function armReveals(panel) {
        panel._openedAt = Date.now();
        if (!panel._rv) return;
        panel.querySelectorAll('.rv:not(.in)').forEach(function(el) {
            panel._rv.unobserve(el);
            panel._rv.observe(el);
        });
        // Safety net: if the browser never reports what is in view, simply show the page
        clearTimeout(panel._rvSafety);
        panel._rvSafety = setTimeout(function() {
            if (panel.classList.contains('open') && !panel.querySelector('.rv.in')) {
                panel.querySelectorAll('.rv').forEach(function(el) { el.classList.add('in'); });
            }
        }, 1500);
    }

    /* ===== Pages within a page: tabs under the cover switch between sections ===== */
    function setSub(panel, key) {
        panel.querySelectorAll('.st').forEach(function(tab) {
            var on = tab.dataset.sub === key;
            tab.classList.toggle('active', on);
            tab.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        panel.querySelectorAll('.subpage').forEach(function(sub) { sub.hidden = sub.dataset.sub !== key; });
    }
    function selectSubFromHash(panel) {
        var key = location.hash.slice(1);
        if (panel && key && panel.querySelector('.st[data-sub="' + key + '"]')) setSub(panel, key);
    }
    function resetSubs(panel) {
        var first = panel.querySelector('.st');
        if (first) setSub(panel, first.dataset.sub);
    }
    panels.forEach(function(panel) {
        var nav = panel.querySelector('.subtabs');
        if (!nav) return;
        var bar = panel.querySelector('.panel-bar');
        var setBar = function() {
            if (bar && bar.offsetHeight) panel.style.setProperty('--bar-h', bar.offsetHeight + 'px');
        };
        setBar();
        window.addEventListener('resize', setBar);
        nav.addEventListener('click', function(e) {
            var tab = e.target.closest('.st');
            if (!tab || tab.classList.contains('active')) return;
            setBar();
            setSub(panel, tab.dataset.sub);
            // the chosen tab goes into the address, so this exact section can be shared
            var clean = location.href.split('#')[0];
            if (window.history && history.replaceState) {
                history.replaceState(history.state, '', tab === nav.querySelector('.st') ? clean : clean + '#' + tab.dataset.sub);
            }
            // on narrow screens keep the chosen tab in sight inside the bar
            nav.scrollLeft += tab.getBoundingClientRect().left - nav.getBoundingClientRect().left -
                              (nav.clientWidth - tab.offsetWidth) / 2;
            // reading further down: bring the tabs back to the top of the view
            var anchor = panel.querySelector('.subtabs-anchor');
            if (anchor) {
                var top = anchor.getBoundingClientRect().top - panel.getBoundingClientRect().top +
                          panel.scrollTop - (bar ? bar.offsetHeight : 0);
                if (panel.scrollTop > top) panel.scrollTop = top;
            }
            // the new section rises in, just like a page opening
            var shown = panel.querySelector('.subpage[data-sub="' + tab.dataset.sub + '"]');
            if (shown && panel._rv) {
                shown.querySelectorAll('.rv').forEach(function(el) {
                    el.classList.remove('in');
                    el.style.setProperty('--rv-base', '0ms');
                    panel._rv.unobserve(el);
                    panel._rv.observe(el);
                });
            }
        });
    });

    function setActiveLink(panel, id) {
        panel.querySelectorAll('.pn').forEach(function(link) {
            var on = link.dataset.go === id;
            link.classList.toggle('active', on);
            if (on) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });
    }

    // Put a page away once it can no longer be seen: back to the top, content ready to rise again
    function resetPanel(panel) {
        panel.classList.remove('open', 'is-current', 'leaving');
        panel.scrollTop = 0;
        setActiveLink(panel, panel.id.replace('panel-', ''));
        resetSubs(panel);
        panel.querySelectorAll('.rv.in').forEach(function(el) { el.classList.remove('in'); });
    }

    // some browsers and security tools drop the deferred requests that loading="lazy" makes,
    // which leaves broken photos behind. once a page is opened, fetch its photos the normal way.
    function loadImages(panel) {
        panel.querySelectorAll('img[loading="lazy"]').forEach(function(img) {
            img.loading = 'eager';
            if (!img.complete || img.naturalWidth === 0) img.src = img.src;
        });
    }

    // one silent retry if a photo still fails to arrive
    document.addEventListener('error', function(e) {
        var img = e.target;
        if (!img || img.tagName !== 'IMG' || img.dataset.retried) return;
        img.dataset.retried = '1';
        var base = img.src.split('#')[0].split('?')[0];
        setTimeout(function() { img.src = base + '?r=1'; }, 400);
    }, true);

    function showPanel(panel) {
        panel.scrollTop = 0;
        panel.classList.add('open', 'is-current');
        armReveals(panel);
        loadImages(panel);
    }

    function openPanel(id, fromHistory) {
        var target = document.getElementById('panel-' + id);
        if (!target) return;
        if (fromHistory !== true) remember(id);
        else document.title = PAGE_TITLES[id];
        clearLater();

        var prev = document.querySelector('.panel.is-current');
        panels.forEach(function(p) { if (p !== prev) resetPanel(p); });
        if (prev === target) {
            target.classList.remove('leaving');
            setActiveLink(target, id);
            return;
        }

        showDeco(id);
        menuScreen.dataset.mode = 'locked';
        document.body.style.overflow = 'hidden';

        if (!prev) { showPanel(target); return; }

        // the bar stays where it is; the underline moves to the chosen page while the content clears
        prev.classList.add('leaving');
        setActiveLink(prev, id);
        later(function() {
            prev.classList.remove('is-current');
            showPanel(target);
            later(function() { resetPanel(prev); }, FADE_MS);
        }, CLEAR_MS);
    }

    function closePanels(fromHistory) {
        if (fromHistory !== true) remember('');
        else document.title = PAGE_TITLES[''];
        clearLater();
        var shown = Array.prototype.slice.call(document.querySelectorAll('.panel.open'));
        panels.forEach(function(p) { if (shown.indexOf(p) < 0) resetPanel(p); });
        shown.forEach(function(p) { p.classList.add('leaving'); p.classList.remove('is-current'); });

        showDeco('main');
        showCopy('main');
        menuScreen.dataset.mode = 'scatter';
        document.body.style.overflow = '';

        // content clears first, then the empty page fades away to the main screen
        later(function() {
            shown.forEach(function(p) { p.classList.remove('open'); });
            later(function() { shown.forEach(resetPanel); }, FADE_MS);
        }, CLEAR_MS);
    }

    /* Every page gets the same bar: back on the left, the five pages centred */
    document.querySelectorAll('.panel').forEach(function(panel) {
        var current = panel.id.replace('panel-', '');
        var bar = panel.querySelector('.panel-bar');
        if (!bar) return;

        var label = bar.querySelector('.panel-label');
        if (label) label.remove();

        var nav = document.createElement('nav');
        nav.className = 'panel-nav';
        nav.setAttribute('aria-label', T.pagesNav);
        pages.forEach(function(pg) {
            var a = document.createElement('a');
            a.className = 'pn' + (pg.id === current ? ' active' : '');
            a.dataset.go = pg.id;
            a.href = pageUrl(pg.id);
            if (pg.id === current) a.setAttribute('aria-current', 'page');
            a.innerHTML = '<span class="pn-en">' + pg.en + '</span>' +
                          '<span class="pn-ko">' + pg.ko + '</span>';
            nav.appendChild(a);
        });
        bar.appendChild(nav);
        bar.appendChild(langSwitch());

        nav.addEventListener('click', function(e) {
            var link = e.target.closest('.pn');
            if (!link) return;
            e.preventDefault();
            if (!link.classList.contains('active')) openPanel(link.dataset.go);
        });
    });

    var hoverReset = null;
    document.querySelectorAll('.mi').forEach(function(item) {
        item.href = pageUrl(item.dataset.panel);
        if (canHover) {
            item.addEventListener('mouseenter', function() {
                clearTimeout(hoverReset);
                showDeco(this.dataset.panel);
                showCopy(this.dataset.panel);
            });
            item.addEventListener('mouseleave', function() {
                // a short pause, so gliding from one word to the next does not flash back to the main screen
                clearTimeout(hoverReset);
                hoverReset = setTimeout(function() {
                    if (document.querySelector('.panel.open')) return;
                    showDeco('main');
                    showCopy('main');
                }, 220);
            });
        }
        item.addEventListener('click', function(e) {
            e.preventDefault();
            clearTimeout(hoverReset);
            openPanel(this.dataset.panel);
        });
    });

    /* ===== Footer band: shared by the main screen and the bottom of every page ===== */
    var mainFoot = menuScreen.querySelector('.menu-footer');
    if (mainFoot) {
        panels.forEach(function(panel) { panel.appendChild(mainFoot.cloneNode(true)); });
        document.querySelectorAll('.foot-contact').forEach(function(a) { a.href = pageUrl('contact'); });

        // the drifting words and the page heights make room for the band
        var setFootHeight = function() {
            document.documentElement.style.setProperty('--foot-h', mainFoot.offsetHeight + 'px');
        };
        setFootHeight();
        window.addEventListener('resize', setFootHeight);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(setFootHeight);
    }

    document.addEventListener('click', function(e) {
        var contact = e.target.closest('.foot-contact');
        if (contact) {
            e.preventDefault();
            var current = document.querySelector('.panel.is-current');
            if (current && current.id === 'panel-contact') current.scrollTo({ top: 0, behavior: 'smooth' });
            else openPanel('contact');
            return;
        }
        var go = e.target.closest('.foot-go');
        if (go) {
            var select = go.parentNode.querySelector('.foot-select');
            if (select && select.value) window.open(select.value, '_blank', 'noopener');
            else if (select) select.focus();
        }
    });

    document.querySelectorAll('.panel-back').forEach(function(btn) {
        btn.addEventListener('click', closePanels);
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.querySelector('.panel.open')) closePanels();
    });

    /* ===== Back and forward buttons move between pages ===== */
    window.addEventListener('popstate', function() {
        var id = pageFromLocation();
        if (id) {
            openPanel(id, true);
            selectSubFromHash(document.getElementById('panel-' + id));
        } else if (document.querySelector('.panel.open')) {
            closePanels(true);
        }
    });

    /* ===== Contact form: sent straight to the company mailbox ===== */
    var FORM_ENDPOINT = 'https://formsubmit.co/ajax/alcofixkorea@gmail.com';
    var form = document.getElementById('cForm');
    if (form) {
        var formStatus = form.querySelector('.form-status');
        var sendBtn = form.querySelector('.btn-send');
        var say = function(kind, html) {
            formStatus.className = 'form-status is-' + kind;
            formStatus.innerHTML = html;
        };
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!form.checkValidity()) { form.reportValidity(); return; }
            var fd = new FormData(form);
            if (fd.get('_honey')) return;       // filled in only by bots
            sendBtn.disabled = true;
            sendBtn.textContent = T.sending;
            say('wait', T.wait);
            fetch(FORM_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    '이름/회사명': fd.get('name'),
                    '이메일': fd.get('email'),
                    '문의 유형': fd.get('type'),
                    '문의 내용': fd.get('message'),
                    '개인정보 동의': '동의함',
                    _subject: T.subject + fd.get('type') + ' - ' + fd.get('name'),
                    _replyto: fd.get('email'),
                    _template: 'table',
                    _captcha: 'false'
                })
            })
                .then(function(r) { return r.json().catch(function() { return {}; }); })
                .then(function(res) {
                    if (String(res.success) !== 'true') throw new Error(res.message || 'not sent');
                    form.reset();
                    say('ok', T.ok);
                })
                .catch(function() {
                    say('error', T.fail +
                        '<a href="mailto:alcofixkorea@gmail.com">alcofixkorea@gmail.com</a>' + T.failTail);
                })
                .then(function() {
                    sendBtn.disabled = false;
                    sendBtn.textContent = T.send;
                });
        });
    }

    /* ===== Start: a page address opens that page directly, the home address plays the intro ===== */
    if (decoCard) loadImages(decoCard);
    var startPage = document.body.dataset.page || pageFromLocation();
    if (startPage) {
        document.documentElement.classList.add('no-motion');
        skipIntro();
        openPanel(startPage, true);
        selectSubFromHash(document.getElementById('panel-' + startPage));
        if (window.history && history.replaceState) {
            history.replaceState({ page: startPage }, '', document.body.dataset.page ? location.href : pageUrl(startPage));
        }
        requestAnimationFrame(function() {
            requestAnimationFrame(function() { document.documentElement.classList.remove('no-motion'); });
        });
    } else {
        startIntro();
    }
    updateLangLinks();
    // back and forward move between pages too; keep the language switch on the same page
    window.addEventListener('popstate', updateLangLinks);

})();

/* ===== 확깨유를 나타내는 숫자: click a number to open its story ===== */
(function(){
    'use strict';
    document.querySelectorAll('.kf').forEach(function(kf) {
        var tabs = Array.prototype.slice.call(kf.querySelectorAll('.kf-num'));
        function choose(tab, focus) {
            tabs.forEach(function(t) {
                var on = t === tab;
                t.classList.toggle('active', on);
                t.setAttribute('aria-selected', on ? 'true' : 'false');
                t.tabIndex = on ? 0 : -1;
            });
            kf.querySelectorAll('.kf-panel').forEach(function(p) { p.hidden = p.dataset.kf !== tab.dataset.kf; });
            if (focus) tab.focus();
        }
        tabs.forEach(function(t, i) { t.tabIndex = i ? -1 : 0; });
        kf.addEventListener('click', function(e) {
            var tab = e.target.closest('.kf-num');
            if (tab) choose(tab);
        });
        kf.addEventListener('keydown', function(e) {
            var i = tabs.indexOf(document.activeElement);
            if (i < 0) return;
            var next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
            if (next === null) return;
            e.preventDefault();
            choose(tabs[(next + tabs.length) % tabs.length], true);
        });
    });
})();
