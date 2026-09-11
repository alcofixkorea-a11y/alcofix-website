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

    function startIntro() {
        logoPhase.classList.add('active');

        var logo = logoPhase.querySelector('.intro-logo');
        if (logo) schedule(function(){ logo.classList.add('show'); }, 260);

        schedule(function() {
            logoPhase.classList.remove('active');
            sloganPhase.classList.add('active');
            schedule(function() {
                sloganPhase.querySelector('.slogan-en').classList.add('show');
            }, 200);
            schedule(function() {
                sloganPhase.querySelector('.slogan-ko').classList.add('show');
            }, 600);
        }, 2400);

        schedule(showMenu, 5400);
    }

    function revealMenu() {
        menuScreen.classList.add('active');
        menuScreen.dataset.mode = 'scatter';
        preloadMenuPhotos();
    }

    function preloadMenuPhotos() {
        document.querySelectorAll('.mi[data-img]').forEach(function(item) {
            var pre = new Image();
            pre.src = item.dataset.img;
        });
    }

    function showMenu() {
        intro.style.transition = 'opacity 0.7s ease';
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
                }, 100 + i * 110);
            });
        }, 700);
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

    /* ===== Panels ===== */
    var pages = [
        { id: 'about',    en: 'We are ALCOFIX', ko: '기업 소개' },
        { id: 'product',  en: 'Our Product',    ko: '제품 소개' },
        { id: 'vision',   en: 'Our Vision',     ko: '비전' },
        { id: 'business', en: 'Business Area',  ko: '사업 분야' },
        { id: 'contact',  en: 'Contact Us',     ko: '문의하기' }
    ];

    /* Hover previews a page beside the docked menu; a click pins it there.
       Touch devices have no hover, so there the first tap pins straight away. */
    var canHover = window.matchMedia('(hover: hover)').matches;
    var menuPhoto = document.getElementById('menuPhoto');
    var pinned = false;
    var exitTimer = null;

    function paintPhoto(item) {
        if (!menuPhoto || !item) return;
        var src = item.dataset.img;
        if (!src) return;
        menuPhoto.style.backgroundImage = 'url("' + src + '")';
        menuPhoto.style.backgroundSize = item.dataset.fit || 'cover';
        menuPhoto.classList.add('lit');
    }

    function openPanel(id, pin) {
        clearTimeout(exitTimer);
        if (pin) pinned = true;

        var item = document.querySelector('.mi[data-panel="' + id + '"]');
        paintPhoto(item);

        document.querySelectorAll('.mi').forEach(function(m) {
            m.classList.toggle('on', m.dataset.panel === id);
        });

        document.querySelectorAll('.panel').forEach(function(p) {
            var on = p.id === 'panel-' + id;
            p.classList.toggle('dock', canHover);
            p.classList.toggle('pinned', pinned);
            p.classList.toggle('open', on);
            if (!on) p.scrollTop = 0;
        });

        menuScreen.dataset.mode = pinned ? 'locked' : 'preview';
        document.body.style.overflow = 'hidden';
    }

    function closePanels() {
        clearTimeout(exitTimer);
        pinned = false;
        document.querySelectorAll('.panel').forEach(function(p) {
            p.classList.remove('open', 'pinned');
            p.scrollTop = 0;
        });
        document.querySelectorAll('.mi').forEach(function(m) { m.classList.remove('on'); });
        if (menuPhoto) menuPhoto.classList.remove('lit');
        menuScreen.dataset.mode = 'scatter';
        document.body.style.overflow = '';
    }

    function scheduleClose() {
        if (pinned) return;
        clearTimeout(exitTimer);
        exitTimer = setTimeout(closePanels, 430);
    }
    function cancelClose() { clearTimeout(exitTimer); }

    /* Give every panel the same category bar, current page marked */
    document.querySelectorAll('.panel').forEach(function(panel) {
        var current = panel.id.replace('panel-', '');
        var bar = panel.querySelector('.panel-bar');
        if (!bar) return;

        var label = bar.querySelector('.panel-label');
        if (label) label.remove();

        var nav = document.createElement('nav');
        nav.className = 'panel-nav';
        pages.forEach(function(pg) {
            var a = document.createElement('a');
            a.className = 'pn' + (pg.id === current ? ' active' : '');
            a.dataset.go = pg.id;
            if (pg.id === current) a.setAttribute('aria-current', 'page');
            a.innerHTML = '<span class="pn-en">' + pg.en + '</span>' +
                          '<span class="pn-ko">' + pg.ko + '</span>';
            nav.appendChild(a);
        });
        bar.appendChild(nav);

        nav.addEventListener('click', function(e) {
            var link = e.target.closest('.pn');
            if (!link || link.classList.contains('active')) return;
            openPanel(link.dataset.go, true);
        });

        // Reading the page keeps the preview alive
        panel.addEventListener('mouseenter', cancelClose);
        panel.addEventListener('mouseleave', scheduleClose);
    });

    document.querySelectorAll('.mi').forEach(function(item) {
        if (canHover) {
            item.addEventListener('mouseenter', function() {
                openPanel(this.dataset.panel, pinned);
            });
        }
        item.addEventListener('click', function(e) {
            e.preventDefault();
            openPanel(this.dataset.panel, true);
        });
    });

    var menuNav = document.getElementById('menuNav');
    if (menuNav && canHover) {
        menuNav.addEventListener('mouseenter', cancelClose);
        menuNav.addEventListener('mouseleave', scheduleClose);
    }

    document.querySelectorAll('.panel-back').forEach(function(btn) {
        btn.addEventListener('click', closePanels);
    });

    var toMain = document.getElementById('toMain');
    if (toMain) {
        toMain.addEventListener('click', closePanels);
        toMain.addEventListener('mouseenter', cancelClose);
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.querySelector('.panel.open')) closePanels();
    });

    /* Vision: blocks rise in as they scroll into view, and the counter follows along */
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
