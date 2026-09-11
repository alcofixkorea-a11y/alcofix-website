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

    function showDeco(key) {
        var target = decoImgs[key] || decoImgs.main;
        Object.keys(decoImgs).forEach(function(k) {
            if (decoImgs[k]) decoImgs[k].classList.toggle('is-on', decoImgs[k] === target);
        });
    }

    /* ===== Panels ===== */
    var pages = [
        { id: 'about',    en: 'We are ALCOFIX', ko: '기업 소개' },
        { id: 'product',  en: 'Our Product',    ko: '제품 소개' },
        { id: 'vision',   en: 'Our Vision',     ko: '비전' },
        { id: 'business', en: 'Business Area',  ko: '사업 분야' },
        { id: 'contact',  en: 'Contact Us',     ko: '문의하기' }
    ];

    /* Hovering a word only changes the photo; a click slides the page in from the right */
    var canHover = window.matchMedia('(hover: hover)').matches;

    function openPanel(id) {
        showDeco(id);

        document.querySelectorAll('.panel').forEach(function(p) {
            var on = p.id === 'panel-' + id;
            p.classList.toggle('open', on);
            if (!on) p.scrollTop = 0;
        });

        menuScreen.dataset.mode = 'locked';
        document.body.style.overflow = 'hidden';
    }

    function closePanels() {
        document.querySelectorAll('.panel').forEach(function(p) {
            p.classList.remove('open');
            p.scrollTop = 0;
        });
        showDeco('main');
        menuScreen.dataset.mode = 'scatter';
        document.body.style.overflow = '';
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

    document.querySelectorAll('.mi').forEach(function(item) {
        if (canHover) {
            item.addEventListener('mouseenter', function() { showDeco(this.dataset.panel); });
            item.addEventListener('mouseleave', function() {
                if (!document.querySelector('.panel.open')) showDeco('main');
            });
        }
        item.addEventListener('click', function(e) {
            e.preventDefault();
            openPanel(this.dataset.panel);
        });
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
