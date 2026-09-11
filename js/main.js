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

    /* Short intro: logo, slogan, then the menu — about three and a half seconds */
    function startIntro() {
        logoPhase.classList.add('active');

        var logo = logoPhase.querySelector('.intro-logo');
        if (logo) schedule(function(){ logo.classList.add('show'); }, 120);

        schedule(function() {
            logoPhase.classList.remove('active');
            sloganPhase.classList.add('active');
            schedule(function() {
                sloganPhase.querySelector('.slogan-en').classList.add('show');
            }, 120);
            schedule(function() {
                sloganPhase.querySelector('.slogan-ko').classList.add('show');
            }, 380);
        }, 1400);

        schedule(showMenu, 3000);
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
        intro.style.transition = 'opacity 0.5s ease';
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
                }, 80 + i * 90);
            });
        }, 500);
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

    /* Hovering a word only tints the backdrop with its photo;
       a click slides the page in from the right, over the whole screen. */
    var canHover = window.matchMedia('(hover: hover)').matches;
    var menuPhoto = document.getElementById('menuPhoto');

    function paintPhoto(item) {
        if (!menuPhoto || !item) return;
        var src = item.dataset.img;
        if (!src) return;
        menuPhoto.style.backgroundImage = 'url("' + src + '")';
        menuPhoto.style.backgroundSize = item.dataset.fit || 'cover';
        menuPhoto.classList.add('lit');
    }

    function clearPhoto() {
        if (menuPhoto) menuPhoto.classList.remove('lit');
    }

    function openPanel(id) {
        paintPhoto(document.querySelector('.mi[data-panel="' + id + '"]'));

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
        clearPhoto();
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
            item.addEventListener('mouseenter', function() { paintPhoto(this); });
            item.addEventListener('mouseleave', function() {
                if (!document.querySelector('.panel.open')) clearPhoto();
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
