(function(){
    'use strict';

    // Header scroll + scroll-to-top
    var hdr = document.getElementById('hdr');
    var btnTop = document.getElementById('btnTop');
    window.addEventListener('scroll', function(){
        hdr.classList.toggle('scrolled', window.scrollY > 60);
        if (btnTop) btnTop.classList.toggle('show', window.scrollY > 400);
    });
    if (btnTop) {
        btnTop.addEventListener('click', function(){
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Mobile menu
    var mobBtn = document.getElementById('mobBtn');
    var navEl = document.getElementById('navEl');
    mobBtn.addEventListener('click', function(){ navEl.classList.toggle('open'); });

    document.querySelectorAll('.nav a').forEach(function(a){
        a.addEventListener('click', function(e){
            e.preventDefault();
            var target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            navEl.classList.remove('open');
        });
    });

    // Scroll reveal
    var reveals = document.querySelectorAll('.reveal, .reveal-l, .reveal-r');
    var obs = new IntersectionObserver(function(entries){
        entries.forEach(function(en){
            if (en.isIntersecting) en.target.classList.add('vis');
        });
    }, { threshold: 0.12 });
    reveals.forEach(function(el){ obs.observe(el); });

    // Side dot navigation
    var sideNav = document.getElementById('sideNav');
    if (sideNav) {
        var dots = sideNav.querySelectorAll('a');
        var sections = [];
        dots.forEach(function(d){
            var sec = document.querySelector(d.getAttribute('href'));
            if (sec) sections.push({ el: sec, dot: d, id: d.dataset.section });
        });
        var darkSections = { about: true, business: true, product: true, news: true, contact: true };
        var secObs = new IntersectionObserver(function(entries){
            entries.forEach(function(en){
                if (en.isIntersecting && en.intersectionRatio >= 0.4) {
                    var id = en.target.id;
                    dots.forEach(function(d){ d.classList.remove('active'); });
                    var match = sideNav.querySelector('[data-section="' + id + '"]');
                    if (match) match.classList.add('active');
                    sideNav.classList.toggle('dark', !!darkSections[id]);
                }
            });
        }, { threshold: 0.4 });
        sections.forEach(function(s){ secObs.observe(s.el); });

        dots.forEach(function(d){
            d.addEventListener('click', function(e){
                e.preventDefault();
                var target = document.querySelector(this.getAttribute('href'));
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    }

    // Product carousel
    var carousel = document.getElementById('prodCarousel');
    if (carousel) {
        var imgs = carousel.querySelectorAll('.carousel-img');
        var prevBtn = document.getElementById('carPrev');
        var nextBtn = document.getElementById('carNext');
        var counter = document.getElementById('carCur');
        var current = 0;

        function showSlide(idx) {
            imgs[current].classList.remove('active');
            current = (idx + imgs.length) % imgs.length;
            imgs[current].classList.add('active');
            counter.textContent = current + 1;
        }

        prevBtn.addEventListener('click', function(){ showSlide(current - 1); });
        nextBtn.addEventListener('click', function(){ showSlide(current + 1); });
    }

    // Contact form
    var form = document.getElementById('cForm');
    form.addEventListener('submit', function(e){
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

    // Admin editor (Ctrl+Shift+E)
    var panel = document.getElementById('adminPanel');
    var adminBody = document.getElementById('adminBody');

    document.addEventListener('keydown', function(e){
        if (e.ctrlKey && e.shiftKey && e.key === 'E') {
            e.preventDefault();
            toggleAdmin();
        }
    });

    document.getElementById('adminClose').addEventListener('click', function(){ panel.classList.remove('open'); });

    function toggleAdmin() {
        if (panel.classList.contains('open')) {
            panel.classList.remove('open');
            return;
        }
        adminBody.innerHTML = '';
        var editables = document.querySelectorAll('[data-edit]');
        editables.forEach(function(el){
            var key = el.dataset.edit;
            var div = document.createElement('div');
            div.className = 'admin-field';
            var label = document.createElement('label');
            label.textContent = key;
            var ta = document.createElement('textarea');
            ta.value = el.innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
            ta.dataset.target = key;
            ta.addEventListener('focus', function(){ el.classList.add('editing'); });
            ta.addEventListener('blur', function(){ el.classList.remove('editing'); });
            div.appendChild(label);
            div.appendChild(ta);
            adminBody.appendChild(div);
        });
        panel.classList.add('open');
    }

    document.getElementById('adminApply').addEventListener('click', function(){
        var fields = adminBody.querySelectorAll('textarea');
        fields.forEach(function(ta){
            var target = document.querySelector('[data-edit="' + ta.dataset.target + '"]');
            if (target) {
                var lines = ta.value.split('\n');
                target.innerHTML = lines.join('<br>');
            }
        });
    });

})();
