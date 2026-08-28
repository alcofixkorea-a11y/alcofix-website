(function(){
    'use strict';

    var intro = document.getElementById('intro');
    var menuScreen = document.getElementById('menuScreen');
    var menuAmbient = document.getElementById('menuAmbient');
    var skipBtn = document.getElementById('skipBtn');
    var logoPhase = document.getElementById('logoPhase');
    var sloganPhase = document.getElementById('sloganPhase');
    var netCanvas = document.getElementById('netCanvas');

    // Supporting keywords: quiet background texture, no animation sequence
    var ambientKeywords = [
        'HEALTH', 'HANGOVER CURE', 'NATURAL', 'INNOVATION', 'GLOBAL',
        'WELLNESS', 'SCIENCE', 'PATENT', 'DETOX', 'LIVER CARE',
        'SUPPLEMENT', 'BEAUTY', 'COSMETIC', 'EXPORT', 'ASIA MARKET',
        'GMP', 'HERBAL', 'RESEARCH', 'VITALITY', 'TRUST'
    ];
    var ambientPositions = [
        {x:'3%', y:'12%'}, {x:'22%', y:'6%'}, {x:'46%', y:'4%'}, {x:'70%', y:'8%'}, {x:'88%', y:'14%'},
        {x:'94%', y:'32%'}, {x:'2%', y:'34%'}, {x:'91%', y:'52%'}, {x:'5%', y:'54%'}, {x:'86%', y:'70%'},
        {x:'8%', y:'72%'}, {x:'30%', y:'93%'}, {x:'52%', y:'96%'}, {x:'74%', y:'92%'}, {x:'93%', y:'86%'},
        {x:'16%', y:'90%'}, {x:'38%', y:'34%'}, {x:'62%', y:'62%'}, {x:'27%', y:'62%'}, {x:'66%', y:'30%'}
    ];

    var introTimeout = [];

    function schedule(fn, ms) {
        var t = setTimeout(fn, ms);
        introTimeout.push(t);
        return t;
    }

    function rand(min, max) {
        return Math.random() * (max - min) + min;
    }

    function startIntro() {
        logoPhase.classList.add('active');
        var letters = logoPhase.querySelectorAll('.lt');
        letters.forEach(function(l, i) {
            schedule(function(){ l.classList.add('show'); }, 400 + i * 140);
        });

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

    function spawnAmbientKeywords() {
        if (!menuAmbient || menuAmbient.childElementCount) return;
        ambientKeywords.forEach(function(word, i) {
            var pos = ambientPositions[i % ambientPositions.length];
            var el = document.createElement('span');
            el.className = 'kw-ambient';
            el.textContent = word;
            el.style.left = pos.x;
            el.style.top = pos.y;
            el.style.setProperty('--ad', rand(0, 4).toFixed(2) + 's');
            el.style.setProperty('--op', rand(0.16, 0.32).toFixed(2));
            menuAmbient.appendChild(el);
            setTimeout(function() {
                el.classList.add('show');
            }, 200 + i * 60);
        });
    }

    /* ===== Network backdrop: glowing nodes linked by soft arcs ===== */
    function initNetwork() {
        if (!netCanvas) return;
        var ctx = netCanvas.getContext('2d');
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var w = 0, h = 0;
        var nodes = [];
        var links = [];
        var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function resize() {
            w = window.innerWidth;
            h = window.innerHeight;
            netCanvas.width = w * dpr;
            netCanvas.height = h * dpr;
            netCanvas.style.width = w + 'px';
            netCanvas.style.height = h + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            build();
        }

        function build() {
            var count = w < 700 ? 14 : (w < 1200 ? 20 : 28);
            nodes = [];
            for (var i = 0; i < count; i++) {
                nodes.push({
                    x: rand(0.04, 0.96) * w,
                    y: rand(0.06, 0.94) * h,
                    r: rand(1.4, 3.4),
                    phase: rand(0, Math.PI * 2),
                    speed: rand(0.4, 1.1),
                    dx: rand(-0.09, 0.09),
                    dy: rand(-0.07, 0.07),
                    hub: Math.random() < 0.22
                });
            }
            // Link each node to its 2 nearest neighbours (organic web, no clutter)
            links = [];
            nodes.forEach(function(n, i) {
                var others = nodes
                    .map(function(m, j) { return { j: j, d: Math.hypot(m.x - n.x, m.y - n.y) }; })
                    .filter(function(o) { return o.j !== i; })
                    .sort(function(a, b) { return a.d - b.d; });
                others.slice(0, 2).forEach(function(o) {
                    var key = i < o.j ? i + '-' + o.j : o.j + '-' + i;
                    if (links.indexOf(key) === -1) links.push(key);
                });
            });
        }

        function drawArc(a, b) {
            // Curved connector, bowed perpendicular to the chord
            var mx = (a.x + b.x) / 2;
            var my = (a.y + b.y) / 2;
            var vx = b.x - a.x, vy = b.y - a.y;
            var len = Math.hypot(vx, vy) || 1;
            var bow = Math.min(len * 0.18, 70);
            var cx = mx - (vy / len) * bow;
            var cy = my + (vx / len) * bow;

            var grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            grad.addColorStop(0, 'rgba(0,168,143,0.05)');
            grad.addColorStop(0.5, 'rgba(0,150,126,0.34)');
            grad.addColorStop(1, 'rgba(0,168,143,0.05)');

            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.quadraticCurveTo(cx, cy, b.x, b.y);
            ctx.stroke();
        }

        function frame(t) {
            ctx.clearRect(0, 0, w, h);
            var time = t / 1000;

            if (!reduced) {
                nodes.forEach(function(n) {
                    n.x += n.dx * 0.35;
                    n.y += n.dy * 0.35;
                    if (n.x < 20 || n.x > w - 20) n.dx *= -1;
                    if (n.y < 20 || n.y > h - 20) n.dy *= -1;
                });
            }

            links.forEach(function(key) {
                var p = key.split('-');
                drawArc(nodes[+p[0]], nodes[+p[1]]);
            });

            nodes.forEach(function(n) {
                var pulse = reduced ? 0.6 : 0.5 + 0.5 * Math.sin(time * n.speed + n.phase);
                var r = n.r * (n.hub ? 1.5 : 1);
                var glow = r * (n.hub ? 8 : 5.5);

                // Soft halo — tinted, not white, so it reads on the light ground
                var g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glow);
                g.addColorStop(0, 'rgba(0,168,143,' + (0.3 * pulse + 0.14).toFixed(3) + ')');
                g.addColorStop(0.4, 'rgba(0,168,143,' + (0.13 * pulse + 0.04).toFixed(3) + ')');
                g.addColorStop(1, 'rgba(0,168,143,0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(n.x, n.y, glow, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = 'rgba(0,150,126,' + (0.6 + 0.3 * pulse).toFixed(3) + ')';
                ctx.beginPath();
                ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
                ctx.fill();

                // Hub nodes wear a segmented HUD ring, echoing the reference art
                if (n.hub) {
                    var rr = r + 9 + pulse * 5;
                    var spin = reduced ? 0 : time * 0.35 * (n.dx > 0 ? 1 : -1);
                    ctx.strokeStyle = 'rgba(0,168,143,' + (0.42 * pulse + 0.16).toFixed(3) + ')';
                    ctx.lineWidth = 1.4;
                    for (var s = 0; s < 3; s++) {
                        var a0 = spin + s * (Math.PI * 2 / 3);
                        ctx.beginPath();
                        ctx.arc(n.x, n.y, rr, a0, a0 + 1.35);
                        ctx.stroke();
                    }
                    ctx.strokeStyle = 'rgba(27,107,49,' + (0.16 * pulse + 0.05).toFixed(3) + ')';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, rr + 8 + pulse * 6, 0, Math.PI * 2);
                    ctx.stroke();
                }
            });

            requestAnimationFrame(frame);
        }

        resize();
        window.addEventListener('resize', resize);
        requestAnimationFrame(frame);
        netCanvas.classList.add('show');
    }

    /* Hovering a word paints its photo across the whole screen */
    function initPhotoReveal() {
        var nav = document.getElementById('menuNav');
        var photo = document.getElementById('menuPhoto');
        if (!nav || !photo) return;

        nav.querySelectorAll('.mi').forEach(function(item) {
            var src = item.dataset.img;
            if (!src) return;
            item.addEventListener('mouseenter', function() {
                photo.style.backgroundImage = 'url("' + src + '")';
                photo.classList.add('lit');
            });
            // Preload so the first hover does not flash
            var pre = new Image();
            pre.src = src;
        });

        nav.addEventListener('mouseleave', function() {
            photo.classList.remove('lit');
        });
    }

    function revealMenu() {
        menuScreen.classList.add('active');
        spawnAmbientKeywords();
        initNetwork();
        initPhotoReveal();
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

    document.querySelectorAll('.mi').forEach(function(item) {
        item.addEventListener('click', function() {
            var id = 'panel-' + this.dataset.panel;
            var panel = document.getElementById(id);
            if (panel) {
                panel.classList.add('open');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    document.querySelectorAll('.panel-back').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var panel = this.closest('.panel');
            panel.classList.remove('open');
            panel.scrollTop = 0;
            document.body.style.overflow = '';
        });
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            var open = document.querySelector('.panel.open');
            if (open) {
                open.classList.remove('open');
                open.scrollTop = 0;
                document.body.style.overflow = '';
            }
        }
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
