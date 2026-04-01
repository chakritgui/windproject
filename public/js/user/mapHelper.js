async function openPoles(poleId) {
    const $modal  = $('#windModal');
    const $dialog = $modal.find('.modal-dialog');
    const $body   = $modal.find('.modal-body');
    const $header = $modal.find('.modal-header');
    const $footer = $modal.find('.modal-footer');
    $dialog.removeClass('modal-fullscreen');
    $header.html(`
        <h5 class="modal-title"></h5>
        <div class="ms-auto d-flex align-items-center gap-2">
            <button type="button" class="btn btn-sm poles-ctrl-btn" id="btn-fullscreen" title="Fullscreen">
                <i class="fa-regular fa-window-maximize"></i>
            </button>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>`);
    $body.html(`
        <div class="poles-skeleton">
            <div class="sk-cover"></div>
            <div style="padding:24px 20px">
                <div class="sk-line" style="width:55%;height:22px;margin-bottom:10px"></div>
                <div class="sk-line" style="width:28%;height:14px;margin-bottom:24px"></div>
                <div class="sk-line" style="height:12px;margin-bottom:8px"></div>
                <div class="sk-line" style="height:12px;margin-bottom:8px"></div>
                <div class="sk-line" style="width:80%;height:12px"></div>
            </div>
        </div>`);
    $footer.html(`
        <button type="button" class="poles-btn-primary" onclick="openFilterModal(${poleId})" data-i18n="view_report"></button>
        <button type="button" class="poles-btn-ghost" data-bs-dismiss="modal" data-i18n="close"></button>`);
    bootstrap.Modal.getOrCreateInstance($modal[0]).show();
    $modal.find('#btn-fullscreen').off('click').on('click', function () {
        $dialog.toggleClass('modal-fullscreen');
        $(this).find('i').toggleClass('fa-window-maximize fa-window-restore');
    });
    try {
        const res  = await fetch(`${BASE_URL}/api/poles.info`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ id: poleId })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const data = json.poles_id ? json : json.data;
        if (!data?.poles_id) {
            $body.html(renderErrorAlert('warning', langData['no_data_found'] || 'No data found'));
            return;
        }
        const lang     = typeof currentLang !== 'undefined' ? currentLang : 'th';
        const fullBase = BASE_URL.replace(/\/$/, '');
        const hasContent = !!data.content;
        const title      = hasContent ? (data.content.title[lang] || data.content.title['th']) : data.installations_name;
        let bodyContent = '';
        if (hasContent && data.content?.content) {
            const co  = data.content.content;
            const ord = [lang, ...['en', 'lo', 'th'].filter(l => l !== lang)];
            for (const l of ord) {
                if (co[l]?.trim()) { bodyContent = co[l]; break; }
            }
        }
        bodyContent = bodyContent.replace(/src="(?!(http|https|\/\/))/g, `src="${fullBase}/`);
        const bg       = data.project_bg || {};
        const projBg   = bg.project_background;
        const opacity  = bg.project_opacity > 0 ? bg.project_opacity / 100 : 1;
        const fadeVal  = 1 - opacity;
        const bgStyle  = projBg
            ? `background-image:linear-gradient(rgba(255,255,255,${fadeVal}),rgba(255,255,255,${fadeVal})),url('${fullBase}/${projBg}');background-size:cover;background-position:top center;background-repeat:no-repeat;`
            : '';
        const coverHtml = (hasContent && data.content?.cover && data.content?.cover_display === 'yes')
            ? `<div class="poles-cover-wrap">
                   <img src="${fullBase}/${data.content.cover}" alt="cover" loading="lazy" class="poles-cover-img">
                   <div class="poles-cover-overlay"></div>
               </div>`
            : '';
        const chip = (iconClass, color, labelKey, value) => `
            <div class="poles-chip">
                <div class="poles-chip-icon" style="color:${color}"><i class="${iconClass}"></i></div>
                <div>
                    <div class="poles-chip-label" data-i18n="${labelKey}"></div>
                    <div class="poles-chip-value">${value}</div>
                </div>
            </div>`;
        $body.html(`
        <div class="poles-detail animate__animated animate__fadeIn">
            <div class="poles-header-card">
                <div class="poles-header-left">
                    <div class="poles-avatar"><i class="fas fa-broadcast-tower"></i></div>
                    <div>
                        <div class="poles-name">
                            ${data.installations_name}
                            <span class="poles-code">#${data.poles_code}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="poles-chips">
                ${chip('fa-solid fa-diagram-project', '#2d7fc1', 'project',  data.project_name)}
                ${chip('fa-solid fa-arrows-alt-v',    '#0891b2', 'level',    data.height_name)}
                ${chip('fa-solid fa-map-marker-alt',  '#059669', 'location', `${data.poles_lat}, ${data.poles_lng}`)}
            </div>
            <div class="poles-content-section" style="${bgStyle}">
                ${data.content_id ? `
                    ${coverHtml}
                    ${data.content.presentation?.length ? renderPresentationShow(data.content.presentation) : ''}
                    <article class="poles-article">
                        <h4 class="poles-article-title">${title}</h4>
                        <div class="poles-article-meta">
                            <i class="fa-regular fa-calendar-check"></i>
                            ${data.updated_at || data.created_at || ''}
                        </div>
                        <div class="poles-article-body article-content">${bodyContent}</div>
                    </article>
                    <div class="multimedia-container px-1">${renderMultimedia(data.content, lang, fullBase)}</div>
                ` : `
                    ${!projBg ? `
                        <div class="poles-empty">
                            <i class="fa-regular fa-file-lines"></i>
                            <div class="poles-empty-title">${langData['no_content_available'] || 'No content available'}</div>
                            <div class="poles-empty-sub">${langData['content_nothing_hear'] || "It looks like there's nothing here."}</div>
                        </div>` : '<div style="padding:40px 0"></div>'}
                `}
            </div>
        </div>`);
        $header.find('.modal-title').html(`
            <span class="project-status">
                <i class="fa-solid fa-circle-dot status-pulse me-2"
                   style="color:${data.project_status_color || '#ccc'};font-size:0.8em"></i>
                <span class="fw-bold" style="font-size:0.9rem;color:#444">
                    ${data.project_status_name || '—'}
                </span>
            </span>`);
        if (typeof updateText === 'function') updateText($body[0]);
        $body.find('.article-content img').each(function () {
            const $img = $(this);
            const src  = $img.attr('src');
            if (!src) return;
            $img.removeAttr('width height');
            let style = ($img.attr('style') || '')
                .replace(/width\s*:\s*[^;]+;?/gi, '')
                .replace(/height\s*:\s*[^;]+;?/gi, '');
            $img.attr({ style: style.trim(), loading: 'lazy' });
            if (!$img.parent('a').length) {
                $img.wrap(`<a href="${src}" data-fancybox="content-images" class="content-img-link"></a>`);
            }
            $img.css({ cursor: 'zoom-in', transition: 'opacity 0.2s' }).addClass('hover-opacity');
        });
        if (typeof Fancybox !== 'undefined') {
            Fancybox.bind('[data-fancybox]', {
                Hash:    false,
                Toolbar: { display: { left: ['infobar'], right: ['close'] } }
            });
        }
    } catch (err) {
        console.error('openPoles error:', err);
        $body.html(renderErrorAlert('danger', langData['cannot_load'] || 'Failed to load data. Please try again later.'));
    }
}
function renderMultimedia(content, lang, baseUrl) {
    if (!content) return '';
    let html = '';
    if (content.images360?.length) {
        html += `
        <div class="mm-section">
            <div class="mm-section-header">
                <div class="mm-section-icon" style="background:rgba(6,182,212,0.12);color:#0891b2">
                    <i class="fa-solid fa-street-view"></i>
                </div>
                <span>${langData['vr_experience'] || '360° Experience'}</span>
            </div>
            <div class="mm-grid">
                ${content.images360.map(vr => `
                    <div class="mm-thumb" onclick="openVRModal('${baseUrl}/${vr.url}')">
                        <img src="${baseUrl}/${vr.url}" loading="lazy">
                        <div class="mm-vr-badge"><i class="fa-solid fa-rotate fa-spin"></i> 360°</div>
                        <div class="mm-thumb-overlay"><i class="fa-solid fa-expand"></i></div>
                    </div>`).join('')}
            </div>
        </div>`;
    }
    if (content.images?.length) {
        html += `
        <div class="mm-section">
            <div class="mm-section-header">
                <div class="mm-section-icon" style="background:rgba(45,127,193,0.12);color:#2d7fc1">
                    <i class="fa-solid fa-images"></i>
                </div>
                <span>${langData['gallery'] || 'Gallery'}</span>
            </div>
            <div class="mm-grid">
                ${content.images.map(img => `
                    <a href="${baseUrl}/${img.url}" data-fancybox="pole-gallery" class="mm-thumb">
                        <img src="${baseUrl}/${img.url}" loading="lazy">
                        <div class="mm-thumb-overlay"><i class="fa-solid fa-magnifying-glass-plus"></i></div>
                    </a>`).join('')}
            </div>
        </div>`;
    }
    if (content.attachments?.length) {
        html += `
        <div class="mm-section">
            <div class="mm-section-header">
                <div class="mm-section-icon" style="background:rgba(220,38,38,0.10);color:#dc2626">
                    <i class="fa-solid fa-paperclip"></i>
                </div>
                <span>${langData['attachments'] || 'Attachments'}</span>
            </div>
            <div class="mm-attachments">
                ${content.attachments.map(file => {
                    const isPdf = file.url.toLowerCase().endsWith('.pdf');
                    const ext   = file.url.split('.').pop().toUpperCase();
                    return `
                    <a href="${baseUrl}/${file.url}" download class="mm-att-item">
                        <div class="mm-att-icon ${isPdf ? 'mm-att-pdf' : 'mm-att-file'}">
                            <i class="fa-solid ${isPdf ? 'fa-file-pdf' : 'fa-file-lines'}"></i>
                        </div>
                        <div class="mm-att-info">
                            <div class="mm-att-name">${file.name}</div>
                            <div class="mm-att-ext">${ext} File</div>
                        </div>
                        <div class="mm-att-dl"><i class="fa-solid fa-download"></i></div>
                    </a>`;
                }).join('')}
            </div>
        </div>`;
    }
    return html;
}
async function openProject(project_id) {
    if (!project_id) return;
    try {
        const res = await fetch(`${BASE_URL}/api/project.poles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_id })
        });
        const data = await res.json();
        if (!data?.poles?.length) {
            console.warn('No poles data for project', project_id);
            return;
        }
        document.getElementById('pp-name').textContent = data.project_name || 'Unknown Project';
        document.getElementById('pp-count').textContent = data.poles.length;
        const statusColor = data.status_color || '#ccc';
        const statusName = (data.project_status || 'UNKNOWN').toUpperCase();
        const dot = document.getElementById('pp-status-dot');
        const pill = document.getElementById('pp-status');
        dot.style.backgroundColor = statusColor;
        pill.style.backgroundColor = statusColor;
        pill.style.color = '#fff';
        pill.textContent = statusName;
        const unit = getCurrentUnit();
        document.getElementById('pp-body').innerHTML = data.poles.map(p => {
            const isEven = p.type_id % 2 === 0;
            const color  = isEven ? '#5bb8f5' : '#f39c12';
            const color2 = isEven ? '#2d7fc1' : '#d68910';
            const animName = `wspin_${p.poles_id}`;
            const extra = !isEven
                ? `<line x1="3" y1="32" x2="-5" y2="32" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
                   <circle cx="-5" cy="32" r="1.8" fill="${color2}" stroke="#ffffff" stroke-width="0.8"/>`
                : '';
            return `
            <div class="pole-row" onclick="openPoles(${p.poles_id})">
                <div class="pole-index">
                    <svg width="20" height="52" viewBox="0 0 20 52" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">
                        <circle cx="3" cy="49" r="3.5" fill="rgba(255,255,255,0.85)" stroke="${color}" stroke-width="1.5"/>
                        <line x1="3" y1="46" x2="3" y2="3"  stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
                        <line x1="3" y1="5"  x2="15" y2="5"  stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
                        <line x1="3" y1="14" x2="11" y2="14" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
                        ${extra}
                        <circle cx="15" cy="5"  r="2.2" fill="${color}"  stroke="#ffffff" stroke-width="0.8"/>
                        <circle cx="11" cy="14" r="1.8" fill="${color2}" stroke="#ffffff" stroke-width="0.8"/>
                    </svg>
                </div>
                <div class="pole-info">
                    <div class="pole-title">
                        <strong>${p.type_name || 'N/A'}</strong>
                        <div class="small">${p.installations_name || 'N/A'}</div>
                    </div>
                    <div class="pole-coords"><i class="fa-solid fa-location-dot me-1"></i>${p.lat}° N, ${p.lng}° E</div>
                    <div class="pole-bar-wrap">
                        <div class="pole-bar" id="bar-${p.poles_id}" style="width:0%;transition:width 0.6s ease, background-color 0.3s"></div>
                    </div>
                </div>
                <div class="pole-wind-box">
                    <i class="fa-solid fa-location-arrow wind-arrow" id="wind-arrow-${p.poles_id}"></i>
                    <span class="pole-wind" id="wind-val-${p.poles_id}" data-raw="0">-- <small>${unit.label}</small></span>
                </div>
            </div>`;
        }).join('');
        bootstrap.Offcanvas.getOrCreateInstance(document.getElementById('projectCanvas')).show();
        const lats = data.poles.map(p => p.lat).join(',');
        const lngs = data.poles.map(p => p.lng).join(',');
        const weatherRes = await fetch(`${OPEN_METEO}?latitude=${lats}&longitude=${lngs}&current=wind_speed_100m&wind_speed_unit=ms`);
        const weatherData = await weatherRes.json();
        const results = Array.isArray(weatherData) ? weatherData : [weatherData];
        let totalWind = 0;
        data.poles.forEach((p, i) => {
            const speed = results[i]?.current?.wind_speed_100m || 0;
            totalWind += speed;
            const elWind  = document.getElementById(`wind-val-${p.poles_id}`);
            const elArrow = document.getElementById(`wind-arrow-${p.poles_id}`);
            const elBar   = document.getElementById(`bar-${p.poles_id}`);
            const elRotor = document.getElementById(`rotor-${p.poles_id}`);
            if (!elWind || !elBar) return;
            const activeColor  = getWindColor(speed);
            const displaySpeed = (speed * unit.factor).toFixed(1);
            elWind.dataset.raw = speed;
            elWind.style.color = activeColor;
            elWind.innerHTML = `${displaySpeed} <small>${unit.label}</small>`;
            if (elArrow) elArrow.style.color = activeColor;
            const pct = Math.min((speed / 25) * 100, 100);
            requestAnimationFrame(() => {
                elBar.style.width = `${pct}%`;
                elBar.style.backgroundColor = activeColor;
            });
            if (elRotor) {
                const dur = speed > 0
                    ? Math.max(0.6, 4 - speed * 0.3).toFixed(2)
                    : '2.5';
                elRotor.style.animationDuration = `${dur}s`;
            }
        });
        const avgSpeed = totalWind / data.poles.length;
        const avgEl = document.getElementById('pp-avg-wind');
        if (avgEl) {
            avgEl.textContent = `${(avgSpeed * unit.factor).toFixed(1)} ${unit.label}`;
            avgEl.style.color = getWindColor(avgSpeed);
        }
    } catch (err) {
        console.error('openProject error:', err);
    }
}
function updateWindUI() {
    const unit = getCurrentUnit();
    updateButtonStyles();
    const legendUnit = document.getElementById('legend-unit-label');
    if (legendUnit) legendUnit.textContent = unit.label;
    const steps = [0, 2, 5, 10, 15, 20, 25];
    steps.forEach((ms) => {
        const el = document.getElementById(`legend-${ms}`);
        if (!el) return;
        const val = Math.round(ms * unit.factor);
        el.textContent = (ms === 25) ? `${val}+` : val;
    });
    const bar = document.querySelector('.legend-bar');
    if (bar) {
        const gradient = WINDY_COLORS.map(c => c.color).join(', ');
        bar.style.background = `linear-gradient(to right, ${gradient})`;
    }
    Object.values(poleMarkers).forEach(p => {
        const el = document.getElementById(p.windId);
        if (!el) return;
        const ms = parseFloat(el.dataset.raw);
        if (isNaN(ms)) return;
        const activeColor = getWindColor(ms);
        const displayVal = (ms * unit.factor).toFixed(1);
        el.textContent = `${displayVal} ${unit.label}`;
        el.setAttribute('fill', activeColor);
        el.style.fontWeight = '700';
        const arrow = document.getElementById(p.arrowId);
        if (arrow) {
            const arrowIcon = arrow.querySelector('text');
            if (arrowIcon) arrowIcon.setAttribute('fill', activeColor);
        }
    });
    if (typeof customPickerMarker !== 'undefined' && customPickerMarker && customPickerMarker.isPopupOpen()) {
        const popupPane = customPickerMarker.getPopup().getElement();
        if (popupPane) {
            const speedValEl = popupPane.querySelector('#picker-wind-value');
            const speedWrap = popupPane.querySelector('#picker-speed-wrap');
            const unitLabel = popupPane.querySelector('#picker-unit-label');
            const arrowG = popupPane.querySelector('#picker-arrow-g');
            if (speedValEl) {
                const ms = parseFloat(speedValEl.dataset.raw);
                const color = getWindColor(ms); 
                speedValEl.textContent = (ms * unit.factor).toFixed(1);
                if (speedWrap) speedWrap.style.color = color;
                if (unitLabel) unitLabel.textContent = unit.label;
                if (arrowG) {
                    arrowG.querySelectorAll('line, polygon, circle').forEach(shape => {
                        const attr = (shape.tagName === 'line') ? 'stroke' : 'fill';
                        shape.setAttribute(attr, color);
                    });
                }
            }
            const gustValEl = popupPane.querySelector('#picker-gust-value');
            const gustWrap = popupPane.querySelector('#picker-gust-wrap');
            if (gustValEl) {
                const gMs = parseFloat(gustValEl.dataset.raw);
                gustValEl.textContent = `${(gMs * unit.factor).toFixed(1)} ${unit.label}`;
                if (gustWrap) gustWrap.style.color = getWindColor(gMs);
            }
        }
    }
    if (typeof updateWindDashboardUnit === 'function') {
        updateWindDashboardUnit(unit);
    }
}
function setWindUnit(idx) {
    currentUnitIdx = idx;
    localStorage.setItem('windUnit', currentUnitIdx);
    updateWindUI();
    updateButtonStyles();
}
function updateButtonStyles() {
    const buttons = document.querySelectorAll('.btn-unit-select');
    buttons.forEach((btn, index) => {
        if (index === currentUnitIdx) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}
function initWindUnit() {
    updateWindUI();
}
function updateWindDashboardUnit(unit) {
    document.querySelectorAll('.stat-unit-label').forEach(el => {
        el.textContent = unit.label;
    });
    const max = windSummary.max ?? 0;
    const min = windSummary.min ?? 0;
    const avg = windSummary.avg ?? 0;
    $('.stat-max-wind-val').text((max * unit.factor).toFixed(1));
    $('.stat-min-wind-val').text((min * unit.factor).toFixed(1));
    $('.stat-avg-wind-val').text((avg * unit.factor).toFixed(1));
}
Fancybox.bind("[data-fancybox='gallery']", {
    Hash:    false,
    Thumbs:  { autoStart: false },
    Toolbar: {
        display: { left: ['infobar'], middle: [], right: ['iterateZoom', 'close'] }
    }
});
function getWindColor(ms) {
    for (let i = WINDY_COLORS.length - 1; i >= 0; i--) {
        if (ms >= WINDY_COLORS[i].ms) return WINDY_COLORS[i].color;
    }
    return WINDY_COLORS[0].color;
}
let currentUnitIdx = (() => {
    const saved = localStorage.getItem('windUnit');
    return saved !== null ? parseInt(saved) : 0;
})();
function getCurrentUnit() {
    return WIND_UNITS[currentUnitIdx];
}
$('#mapFilter').on('click', function (e) {
    e.stopPropagation();
    const firstPanel = $('#menu-level-1');
    if (firstPanel.is(':visible')) {
        $('.menu-panel').fadeOut();
    } else {
        menuState = {};
        loadMenuLevel(1);
    }
});
function handleStationClick(lat, lng, id, el) {
    if (isNaN(lat) || isNaN(lng)) return;
    $('.station-item').removeClass('selected');
    $(el).addClass('selected');
    $('.menu-panel').fadeOut();
    openPoles(id);
}
function selectItem(level, id, el) {
    $(el).addClass('selected').siblings().removeClass('selected');
    menuState[MENU_LEVELS[level].key] = id;
    loadMenuLevel(level + 1);
}
function degToCompass(deg) {
    return COMPASS_DIRS[Math.round(deg / 22.5) % 16];
}
function getLocalBool(key, fallback = false) {
    const val = localStorage.getItem(key);
    if (val === 'true')  return true;
    if (val === 'false') return false;
    return fallback;
}
async function fetchJSON(url, body = {}) {
    const res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
    return res.json();
}
function hideWindLoading() {
    const el = document.getElementById('wind-loading');
    if (!el) return;
    el.style.pointerEvents = 'none';
    el.style.transition    = 'opacity 0.3s ease-out';
    el.style.opacity       = 0;
    el.addEventListener('transitionend', () => el.remove(), { once: true });
}
function toggleAnimation(isOn) {
    if(isOn) {
        $("#windy #map-container .leaflet-tile-pane .particles-layer").css("z-index", 500);
    } else {
        $("#windy #map-container .leaflet-tile-pane .particles-layer").css("z-index", 0);   
    }
}
function toggleEquipment(isOn) {
    if (!map || !poleLayerGroup) return;
    if (isOn) {
        if (!map.hasLayer(poleLayerGroup)) {
            poleLayerGroup.addTo(map);
        }
        Object.values(poleMarkers).forEach(p => {
            if (p.marker) p.marker.setOpacity(1);
            if (p.labelMarker) p.labelMarker.setOpacity(windOn ? 1 : 0);
        });
    } else {
        Object.values(poleMarkers).forEach(p => {
            if (p.marker) p.marker.setOpacity(0);
            if (p.labelMarker) p.labelMarker.setOpacity(0);
        });
        $('#toggle-wind-values').prop('checked', false);
        windOn = false;
    }
}
function _applyWindState(isOn) {
    windOn = isOn;
    if (windyAPI?.store) {
        windyAPI.store.set('overlay', isOn ? 'wind' : ''); 
    }
    Object.values(poleMarkers).forEach(p => {
        const isPoleVisible = p.marker && p.marker.options.opacity > 0;
        p.labelMarker?.setOpacity((isOn && isPoleVisible) ? 1 : 0);
    });
    $('#wind-status-icon').toggleClass('spinning', isOn);
    $('.map-wind-label').stop().fadeTo(300, isOn ? 1 : 0);
    clearInterval(windRefreshTimer);
    windRefreshTimer = null;
    if (isOn) {
        refreshAllWindData();
        windRefreshTimer = setInterval(refreshAllWindData, WIND_REFRESH);
    }
}
function toggleWind(isOn) {
    const equipmentIsOff = $('#toggle-equipment').prop('checked') === false;
    if (isOn && equipmentIsOff) {
        $('#toggle-equipment').prop('checked', true);
        toggleEquipment(true);
    }
    _applyWindState(isOn);
}
function toggleFocus(isOn) {
    focusOn = isOn;
    if (!map.getPane('focusPane')) {
        const pane = map.createPane('focusPane');
        pane.style.zIndex = 450; 
        pane.style.pointerEvents = 'none';
    }
    if (focusMaskLayer) {
        map.removeLayer(focusMaskLayer);
        focusMaskLayer = null;
    }
    map.eachLayer(layer => {
        if (layer.options && layer.options.id === 'focus-mask-layer') {
            map.removeLayer(layer);
        }
    });
    if (isOn && geoDataGlobal) {
        const world = [[90, -180], [90, 180], [-90, 180], [-90, -180]];
        const countryHoles = [];
        geoDataGlobal.features.forEach(feature => {
            const geometry = feature.geometry;
            if (geometry.type === 'Polygon') {
                geometry.coordinates.forEach(ring => {
                    countryHoles.push(ring.map(c => [c[1], c[0]]));
                });
            } else if (geometry.type === 'MultiPolygon') {
                geometry.coordinates.forEach(polygon => {
                    polygon.forEach(ring => {
                        countryHoles.push(ring.map(c => [c[1], c[0]]));
                    });
                });
            }
        });
        focusMaskLayer = L.polygon([world, ...countryHoles], {
            id: 'focus-mask-layer',
            fillColor: '#161616',
            fillOpacity: 0.5,
            stroke: false,
            interactive: false,
            pane: 'focusPane',
            smoothFactor: 1
        }).addTo(map);
    }
}
function toggleHoles(show, allHoles = []) {
    if (show) {
        if (maskLayer) return;
        const world = [
            [90, -180],
            [90, 180],
            [-90, 180],
            [-90, -180]
        ];
        maskLayer = L.polygon([world, ...allHoles], {
            fillColor: '#C0C0C0',
            fillOpacity: 0.75,
            stroke: false,
            interactive: false,
            pane: 'overlayPane',
            smoothFactor: 0.1,
            noClip: true
        }).addTo(map);
        maskLayer.bringToBack();
        maskLayer._zoomHandler = () => {
            maskLayer && maskLayer.bringToBack();
        };
        map.on('zoomend', maskLayer._zoomHandler);
    } else {
        if (maskLayer) {
            map.off('zoomend', maskLayer._zoomHandler);
            map.removeLayer(maskLayer);
            maskLayer = null;
        }
    }
}
function toggleLabel(isOn) {
    if (!labelStyleEl) {
        labelStyleEl = document.getElementById('hide-labels-style') || (() => {
            const el = document.createElement('style');
            el.id = 'hide-labels-style';
            document.head.appendChild(el);
            return el;
        })();
    }
    labelStyleEl.innerHTML = isOn ? '' : `
        .leaflet-label-pane,.windy-layer-labels,.labels-layer {
            display:none!important;pointer-events:none!important;
        }
        canvas.vector-field-layer { display:block!important; }`;
}
function toggleWindTurbine(isOn) {
    turbineMarkers.forEach(marker => {
        if (isOn) {
            if (!poleLayerGroup.hasLayer(marker)) marker.addTo(poleLayerGroup);
        } else {
            if (poleLayerGroup.hasLayer(marker)) poleLayerGroup.removeLayer(marker);
        }
    });
}
function toggleSatellite(isOn) {
    if (!map) return;
    if (isOn) {
        if (!satelliteLayer) {
            satelliteLayer = L.tileLayer(
                'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
                { 
                    subdomains: ['0','1','2','3'], 
                    detectRetina: true, 
                    crossOrigin: true, 
                    keepBuffer: 4, 
                    maxZoom: 18,
                    maxNativeZoom: 20
                }
            );
        }
        if (!map.hasLayer(satelliteLayer)) satelliteLayer.addTo(map);
        windyAPI?.store.set('overlay', ''); 
        windyAPI?.store.set('graticule', false);
        map.setMaxZoom(18); 
        if (allHoles.length > 0) toggleHoles(false, allHoles);
    } else {
        if (satelliteLayer && map.hasLayer(satelliteLayer)) map.removeLayer(satelliteLayer);
        windyAPI?.store.set('graticule', false);
        windyAPI?.store.set('overlay', 'wind');
        map.setMaxZoom(11); 
        if (allHoles.length > 0) toggleHoles(true, allHoles);
    }
}
// function _buildTurbineIcon(turbine, size = 24) {
//     if (turbine.icon?.trim()) {
//         return L.icon({
//             iconUrl: turbine.icon,
//             iconSize: [size, size],
//             iconAnchor: [size / 2, size], 
//             popupAnchor: [0, -size]
//         });
//     }
//     const w = Math.round(size * 0.75);
//     const h = size;
//     return L.divIcon({
//         className: 'turbine-icon-wrap',
//         iconSize: [w, h],
//         iconAnchor: [w / 2, h],
//         html: `
//         <style>
//             @keyframes spin {
//                 from { transform: rotate(0deg); }
//                 to   { transform: rotate(360deg); }
//             }
//         </style>
//         <svg width="${w}" height="${h}" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
//             <path d="M13 38 L17 38 L16 15 L14 15 Z" fill="#b1c0d1"/>
//             <path d="M14 38 L16 38 L15.5 15 L14.5 15 Z" fill="#cbd5e0"/>
//             <g style="transform-origin: 15px 15px; animation: spin 3s linear infinite;">
//                 <circle cx="15" cy="15" r="2" fill="#4a5568"/>
//                 <path d="M15 15 L15 2 L17 15 Z" fill="#5bb8f5"/>
//                 <path d="M15 15 L26.3 21.5 L15 17 Z" fill="#5bb8f5" transform="rotate(120,15,15)"/>
//                 <path d="M15 15 L3.7 21.5 L15 17 Z"  fill="#5bb8f5" transform="rotate(240,15,15)"/>
//             </g>
//             <circle cx="15" cy="15" r="1" fill="#fff"/>
//         </svg>`
//     });
// }
function _buildTurbineIcon(turbine) { 
    const smallSize = 8; 
    return L.divIcon({
        className: 'turbine-small-dot', 
        iconSize: [smallSize, smallSize],
        iconAnchor: [smallSize / 2, smallSize / 2], 
        popupAnchor: [0, -smallSize / 2],
        html: `
            <div style=" width: ${smallSize}px; height: ${smallSize}px; background-color: #000000; border: 1px solid #ffffff; border-radius: 50%; box-shadow: 0 0 2px rgba(0,0,0,0.3);"></div>
        `
    });
}
function resetView() {
    if (!initialBounds) return;
    map.flyToBounds(initialBounds, {
        ...initialPadding,
        duration: 1.25,
        easeLinearity: 0.25,
        noMoveStart: true,
        animate: true
    });
}
function highlightAreaItem(index) {
    document.querySelectorAll('.ap-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`ap-item-${index}`)?.classList.add('active');
}
function toggleAreaPanel() {
    document.getElementById('area-panel')?.classList.toggle('collapsed');
}