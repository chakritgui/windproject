(function generateSkyParticles() {
    const sky = document.getElementById('skyWrap');
    if (!sky) return;
    for (let i = 0; i < 12; i++) {
        const el  = document.createElement('div');
        el.className = 'wind-line';
        const top = 5 + Math.random() * 90;
        const w   = 80 + Math.random() * 180;
        const dur = 3 + Math.random() * 5;
        const del = Math.random() * -8;
        el.style.cssText = `top:${top}%;width:${w}px;animation-duration:${dur}s;animation-delay:${del}s;`;
        sky.appendChild(el);
    }
    for (let i = 0; i < 18; i++) {
        const el  = document.createElement('div');
        el.className = 'particle';
        const sz  = 4 + Math.random() * 12;
        const x   = Math.random() * 100;
        const y   = Math.random() * 100;
        const dur = 3 + Math.random() * 5;
        const del = Math.random() * -6;
        el.style.cssText = `width:${sz}px;height:${sz}px;left:${x}%;top:${y}%;animation-duration:${dur}s;animation-delay:${del}s;`;
        sky.appendChild(el);
    }
})();