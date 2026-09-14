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

    /* ===== Panels ===== */
    var pages = [
        { id: 'about',    en: 'We are ALCOFIX', ko: '기업 소개' },
        { id: 'product',  en: 'Our Product',    ko: '제품 소개' },
        { id: 'vision',   en: 'Our Vision',     ko: '비전' },
        { id: 'contact',  en: 'Contact Us',     ko: '문의하기' }
    ];

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
        return p + ' > :not(section):not(ol):not(ul):not(.grid-2):not(.grid-3):not(.contact-grid):not(.subpage):not(.subtabs):not(.subtabs-anchor):not(.vs-item),' +
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

    function showPanel(panel) {
        panel.scrollTop = 0;
        panel.classList.add('open', 'is-current');
        armReveals(panel);
    }

    function openPanel(id) {
        var target = document.getElementById('panel-' + id);
        if (!target) return;
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

    function closePanels() {
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
        nav.setAttribute('aria-label', '페이지 선택');
        pages.forEach(function(pg) {
            var a = document.createElement('a');
            a.className = 'pn' + (pg.id === current ? ' active' : '');
            a.dataset.go = pg.id;
            a.href = '#' + pg.id;
            if (pg.id === current) a.setAttribute('aria-current', 'page');
            a.innerHTML = '<span class="pn-en">' + pg.en + '</span>' +
                          '<span class="pn-ko">' + pg.ko + '</span>';
            nav.appendChild(a);
        });
        bar.appendChild(nav);

        nav.addEventListener('click', function(e) {
            var link = e.target.closest('.pn');
            if (!link) return;
            e.preventDefault();
            if (!link.classList.contains('active')) openPanel(link.dataset.go);
        });
    });

    var hoverReset = null;
    document.querySelectorAll('.mi').forEach(function(item) {
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

    /* ===== Vision: blocks rise in as they scroll into view, and the counter follows along ===== */
    var vs = document.querySelector('.vs');
    var vPanel = document.getElementById('panel-vision');
    if (vs && vPanel && 'IntersectionObserver' in window) {
        var vBar = vPanel.querySelector('.panel-bar');
        var vCount = vs.querySelector('.vs-count b');
        var setBarHeight = function() {
            if (vBar) vPanel.style.setProperty('--bar-h', vBar.offsetHeight + 'px');
        };
        setBarHeight();
        window.addEventListener('resize', setBarHeight);

        vs.classList.add('reveal');
        var vObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('in');
                if (vCount) vCount.textContent = entry.target.dataset.n;
            });
        }, { root: vPanel, threshold: 0.35 });
        vs.querySelectorAll('.vs-item').forEach(function(item) { vObserver.observe(item); });

        // Safety net: if the observer has not fired shortly after the page opens, just show everything
        new MutationObserver(function() {
            if (!vPanel.classList.contains('open')) return;
            setBarHeight();
            setTimeout(function() {
                if (!vs.querySelector('.vs-item.in')) {
                    vs.querySelectorAll('.vs-item').forEach(function(item) { item.classList.add('in'); });
                }
            }, 1600);
        }).observe(vPanel, { attributes: true, attributeFilter: ['class'] });
    }

    var form = document.getElementById('cForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var fd = new FormData(form);
            var subj = encodeURIComponent('[알코픽스 문의] ' + fd.get('type') + ' - ' + fd.get('name'));
            var body = encodeURIComponent(
                '이름/회사명: ' + fd.get('name') +
                '\n이메일: ' + fd.get('email') +
                '\n문의 유형: ' + fd.get('type') +
                '\n\n' + fd.get('message')
            );
            window.open('mailto:alcofixkorea@gmail.com?subject=' + subj + '&body=' + body, '_self');
        });
    }

    startIntro();

})();
