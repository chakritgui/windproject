let map, windyAPI;
let poleLayerGroup;
let windOn = true;
let poleMarkers = {};
let windUpdateFunctions = {};
let menuState = {};
let show_country_line = 'hide';
let map_labels = 'yes';
let country_layers_data = null;
const isMobile = () => window.innerWidth <= 768;
function initMap() {
    windyInit(options, async api => {
        windyAPI = api;
        map = api.map;
        const { store, picker } = api;
        poleLayerGroup = L.layerGroup().addTo(map);
        store.set('overlay', 'wind');
        store.set('level', DEFAULT_LEVEL);
        try {
            const results = await Promise.allSettled([
                fetchData(`${BASE_URL}/api/master`),
                fetchData(`${BASE_URL}/api/wind.boundary`),
                loadPoles(map, picker)
            ]);
            const masterData = results[0].status === 'fulfilled' ? results[0].value : null;
            const windAreaData = results[1].status === 'fulfilled' ? results[1].value : null;
            if (masterData) applyMasterSettings(map, masterData);
            if (windAreaData) await renderWindAreas(map, picker, windAreaData, masterData);
            show_country_line = masterData?.show_country_line;
            country_layers_data = masterData?.country_layers_data;
            map_labels = masterData?.map_labels;
            if (show_country_line === 'show' && country_layers_data) {
                try {
                    const geoData = typeof country_layers_data === 'string' ? JSON.parse(country_layers_data) : country_layers_data;
                    L.geoJSON(geoData, {
                        style: {
                            color: "#161616",
                            weight: 1,
                            fillOpacity: 0,
                            interactive: false
                        }
                    }).addTo(map);
                } catch (error) {
                    console.error("Error drawing country lines:", error);
                }
            }
            if (map_labels === 'no') {
                const style = document.createElement('style');
                style.id = 'hide-labels-style'; 
                style.innerHTML = `
                    .leaflet-label-pane,
                    .windy-layer-labels,
                    .labels-layer {
                        display: none !important;
                        pointer-events: none !important;
                    }
                    canvas.vector-field-layer {
                        display: block !important;
                    }
                `;
                document.head.appendChild(style);
            }
        } catch (error) {
            console.error("Initialization Error:", error);
        } finally {
            hideWindLoading();
        }
        const windSwitch = document.getElementById('windSwitch');
        if (windSwitch) {
            windSwitch.addEventListener('change', e => toggleWind(e.target.checked));
        }
    });
}
function applyMasterSettings(map, master) {
    if (!master?.center_lat || !master?.center_lng) return;
    const lat = parseFloat(master.center_lat);
    const lng = parseFloat(master.center_lng);
    const defaultZoom = Math.min((parseInt(master.zoom_level) || 10) + 1, 13);
    map.setView([lat, lng], defaultZoom);
    map.setMinZoom(defaultZoom);
}
async function renderWindAreas(map, picker, areaData, masterData) {
    const { polygons = [] } = areaData;
    if (polygons.length === 0) return;
    map.eachLayer(layer => {
        if (layer instanceof L.GeoJSON || (layer instanceof L.Polygon && layer._isMask)) {
            map.removeLayer(layer);
        }
    });
    const isMaskMode = masterData?.polygon_visibility === 'close';
    const featureGroup = L.featureGroup();
    const allHoles = [];
    polygons.forEach(area => {
        if (!area.geo_data) return;
        try {
            const geoJsonData = JSON.parse(area.geo_data);
            const styleData = JSON.parse(area.custom_style || "{}");
            const geoLayer = L.geoJSON(geoJsonData, {
                style: () => {
                    const weight = styleData.weight !== undefined ? parseFloat(styleData.weight) : 2;
                    const fillOpacity = styleData.fillOpacity !== undefined ? parseFloat(styleData.fillOpacity) : 0.2;
                    return {
                        fillColor: styleData.fillColor || "#3388ff",
                        fillOpacity: fillOpacity, 
                        color: styleData.color || "#3388ff",
                        weight: weight,
                        stroke: true,
                        opacity: 1, 
                        interactive: true
                    };
                }
            });
            geoLayer.on('touchend click', function (e) {
                if (!e.latlng) return;
                if (e.originalEvent) {
                    e.originalEvent.stopImmediatePropagation();
                    e.originalEvent.preventDefault();
                }
                if (e.target.getBounds) {
                    map.flyToBounds(e.target.getBounds(), { padding: [50, 50], duration: 0.8 });
                    map.once('moveend', () => {
                        if (typeof handlePickerOpening === 'function') {
                            handlePickerOpening(e.latlng, picker);
                        }
                    });
                }
            });
            geoLayer.addTo(featureGroup);
            if (isMaskMode) {
                geoLayer.eachLayer(layer => {
                    if (layer.getLatLngs) {
                        const latlngs = layer.getLatLngs();
                        const rings = Array.isArray(latlngs[0]) && !(latlngs[0][0] instanceof L.LatLng) ? latlngs.map(inner => inner[0]) : [latlngs[0]];
                        allHoles.push(...rings);
                    }
                });
            }
        } catch (e) { console.error("JSON Parse Error:", e); }
    });
    if (isMaskMode && allHoles.length > 0) {
        const world = [[90, -180], [90, 180], [-90, 180], [-90, -180]];
        const mask = L.polygon([world, ...allHoles], {
            fillColor: '#C0C0C0', 
            fillOpacity: 0.75,
            stroke: false,
            interactive: false
        });
        mask._isMask = true;
        mask.addTo(map);
        mask.bringToBack();
    }
    featureGroup.addTo(map);
    featureGroup.bringToFront();
    if (featureGroup.getBounds().isValid()) {
        const bounds = featureGroup.getBounds();
        map.fitBounds(bounds, { padding: [20, 20] });
        map.setMaxBounds(bounds.pad(0.1)); 
        map.options.minZoom = map.getBoundsZoom(bounds);
    }
}
function handlePickerOpening(latlng, picker) {
    if (!picker || !latlng) return;
    const lat = Number(latlng.lat);
    const lng = Number(latlng.lng ?? latlng.lon);
    if (!isNaN(lat) && !isNaN(lng)) {
        setTimeout(() => {
            picker.open({ lat, lon: lng });
            const markerPane = document.querySelector('.leaflet-marker-pane');
            if (markerPane) {
                markerPane.style.zIndex = 650;
            }
        }, 50);
    }
}
let windRefreshInterval = null;
const refreshAllWindData = async () => {
    const poleIds = Object.keys(poleMarkers);
    if (!windOn || poleIds.length === 0) return;
    const lats = poleIds.map(id => poleMarkers[id].lat).join(',');
    const lngs = poleIds.map(id => poleMarkers[id].lng).join(',');
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=ms`;
        const res = await fetch(url);
        const data = await res.json();
        const weatherResults = Array.isArray(data) ? data : [data];
        poleIds.forEach((id, index) => {
            const weather = weatherResults[index];
            const p = poleMarkers[id];
            if (weather && weather.current) {
                const speed = weather.current.wind_speed_10m;
                const dir = weather.current.wind_direction_10m; 
                const el = document.getElementById(p.windId);
                const arrow = document.getElementById(p.arrowId);
                if (el) el.innerText = `${speed.toFixed(1)} m/s`;
                if (arrow) arrow.style.transform = `rotate(${dir - 90}deg)`;
            }
        });
        console.log("Wind data refreshed");
    } catch (e) {
        console.error("Batch Update Failed:", e);
    }
};
async function loadPoles(map) {
    try {
        const poles = await fetchData(`${BASE_URL}/api/poles.get`);
        if (!Array.isArray(poles)) return;
        poleLayerGroup.clearLayers();
        poleMarkers = {};
        for (const pole of poles) {
            const lat = parseFloat(pole.poles_lat);
            const lng = parseFloat(pole.poles_lng);
            if (isNaN(lat) || isNaN(lng)) continue;
            let markerIcon = (pole.type_icon && pole.type_icon.trim() !== "")
                ? L.icon({
                    iconUrl: pole.type_icon,
                    iconSize: [50, 50],
                    iconAnchor: [25, 50],
                    popupAnchor: [0, -50]
                })
                : getDivIcon(pole.type_id);
            const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(poleLayerGroup);
            const windId = `wind-auto-${pole.poles_id}`;
            const arrowId = `arrow-${pole.poles_id}`;
            poleMarkers[pole.poles_id] = { marker, lat, lng, windId, arrowId };
            marker.bindTooltip(
                `<div class="wind-pill">
                    <span class="arrow-icon" id="${arrowId}" style="display:inline-block; transition: transform 1s ease-in-out;">➤</span>
                    <span class="wind-value" id="${windId}">...</span>
                </div>`,
                { 
                    permanent: true, 
                    direction: 'right',
                    className: 'wind-custom-tooltip', 
                    offset: [20, -15],
                    opacity: 0.9  
                }
            );
            if (!windOn) {
                marker.closeTooltip();
            } else {
                marker.openTooltip();
            }
            marker.on('click', () => openPoles(pole.poles_id));
        }
        if (windOn) {
            refreshAllWindData();
        }

    } catch (err) {
        console.error("LoadPoles Error:", err);
    }
}
function toggleWind(isOn) {
    windOn = isOn;
    if (typeof windyAPI !== 'undefined' && windyAPI.store) {
        windyAPI.store.set('overlay', windOn ? 'wind' : 'none');
    }
    Object.keys(poleMarkers).forEach(id => {
        const p = poleMarkers[id];
        if (p && p.marker) {
            windOn ? p.marker.openTooltip() : p.marker.closeTooltip();
        }
    });
    if (windRefreshInterval) {
        clearInterval(windRefreshInterval);
        windRefreshInterval = null;
    }
    if (windOn) {
        refreshAllWindData();
        windRefreshInterval = setInterval(refreshAllWindData, 60000);
    }
}
function getDivIcon(typeId) {
    const color = typeId == 1 ? '#e74c3c' : (typeId == 2 ? '#2ecc71' : '#3498db');
    return L.divIcon({
        className: 'custom-pole-icon',
        html: `<i class="fa-solid fa-tower-broadcast" style="color: ${color}; font-size: 24px; text-shadow: 1px 1px 2px #000;"></i>`,
        iconSize: [24, 24], iconAnchor: [10, 40]
    });
}
async function fetchData(url, bodyData = {}) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });
        return await response.json();
    } catch (err) { return {}; }
}
function hideWindLoading() {
    const loader = document.getElementById('wind-loading');
    if (!loader) return;
    loader.style.pointerEvents = 'none';
    loader.style.transition = 'opacity 0.3s ease-out';
    loader.style.opacity = 0;
    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
    $("header").show();
}
const MENU_LEVELS = {
    1: { title: 'PROJECT', lang: 'project', endpoint: `${BASE_URL}/api/project.get`, key: 'project_id', label: 'project_name' },
    2: { title: 'WIND MEASUREMENT EQUIPMENT', lang: 'pole_types', endpoint: `${BASE_URL}/api/type.get`, key: 'type_id', label: 'type_name' },
    3: { title: 'INSTALLATION', lang: 'installation', endpoint: `${BASE_URL}/api/installations.get`, key: 'installations_id', label: 'installations_name', isLast: true }
};
async function loadMenuLevel(level) {
    const cfg = MENU_LEVELS[level];
    if (!cfg) return;
    for (let i = level; i <= 3; i++) $(`#menu-level-${i}`).removeClass('active').hide().empty();
    const data = await fetchData(cfg.endpoint, menuState);
    if (!data.length) return;
    let html = `<div class="menu-header" data-i18n="${cfg.lang}">${langData[cfg.lang] || cfg.title}</div>`;
    data.forEach(item => {
        if (cfg.isLast) {
            html += `<div class="menu-item station-item" onclick="handleStationClick(${item.poles_lat}, ${item.poles_lng}, ${item.poles_id}, this)"><span>${item[cfg.label].replace(/\r\n|\n/g, '<br />')}</span><i class="fa-solid fa-location-dot text-info"></i></div>`;
        } else {
            html += `<div class="menu-item" onclick="selectItem(${level}, ${item[cfg.key]}, this)"><span>${item[cfg.label].replace(/\r\n|\n/g, '<br />')}</span><i class="fa-solid fa-chevron-right"></i></div>`;
        }
    });
    const panel = $(`#menu-level-${level}`);
    panel.html(html).addClass('active').fadeIn();
    if (isMobile()) panel[0].scrollIntoView({ behavior: 'smooth' });
}
function selectItem(level, id, el) {
    $(el).addClass('selected').siblings().removeClass('selected');
    menuState[MENU_LEVELS[level].key] = id;
    loadMenuLevel(level + 1);
}
function handleStationClick(lat, lng, id, el) {
    if (isNaN(lat) || isNaN(lng)) return;
    $('.station-item').removeClass('selected');
    $(el).addClass('selected');
    if (windyAPI && windyAPI.picker) {
        handlePickerOpening({ lat, lng }, windyAPI.picker);
    }
    $('.menu-panel').fadeOut();
    openPoles(id);
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
$(document).on('click', function () { $('.menu-panel').fadeOut(); });
$('.menu-panel').on('click', e => e.stopPropagation());
async function openPoles(poleId) {
    const $modal   = $('#windModal');
    const $dialog  = $modal.find('.modal-dialog');
    const $body    = $modal.find('.modal-body');
    const $header  = $modal.find('.modal-header');
    const $footer  = $modal.find('.modal-footer');
    $dialog.removeClass('modal-fullscreen');
    $header.html(`
        <h5 class="modal-title"></h5>
        <div class="ms-auto d-flex align-items-center gap-2">
            <button type="button" class="btn btn-sm poles-ctrl-btn" id="btn-fullscreen" title="Fullscreen">
                <i class="fa-regular fa-window-maximize"></i>
            </button>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
    `);
    $body.html(`
        <div class="poles-skeleton">
            <div class="sk-cover"></div>
            <div style="padding:24px 20px;">
                <div class="sk-line" style="width:55%;height:22px;margin-bottom:10px;"></div>
                <div class="sk-line" style="width:28%;height:14px;margin-bottom:24px;"></div>
                <div class="sk-line" style="height:12px;margin-bottom:8px;"></div>
                <div class="sk-line" style="height:12px;margin-bottom:8px;"></div>
                <div class="sk-line" style="width:80%;height:12px;"></div>
            </div>
        </div>
    `);
    $footer.html(`
        <button type="button" class="poles-btn-primary" onclick="openFilterModal(${poleId});" data-i18n="view_report"></button>
        <button type="button" class="poles-btn-ghost" data-bs-dismiss="modal" data-i18n="close"></button>
    `);
    bootstrap.Modal.getOrCreateInstance($modal[0]).show();
    $modal.find('#btn-fullscreen').off('click').on('click', function () {
        $dialog.toggleClass('modal-fullscreen');
        $(this).find('i').toggleClass('fa-window-maximize fa-window-restore');
    });
    try {
        const res  = await fetch(`${BASE_URL}/api/poles.info`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ id: poleId }),
        });
        if (!res.ok) throw new Error('Network error');
        const json = await res.json();
        const data = json.poles_id ? json : json.data;
        if (!data?.poles_id) {
            $body.html(renderErrorAlert('warning', langData['no_data_found'] || 'No data found'));
            return;
        }
        const lang         = typeof currentLang !== 'undefined' ? currentLang : 'th';
        const fullBase     = BASE_URL.replace(/\/$/, '');
        const hasContent   = !!data.content;
        const title        = hasContent
            ? (data.content.title[lang] || data.content.title['th'])
            : data.installations_name;
        let bodyContent = '';
        if (hasContent && data.content?.content) {
            const co  = data.content.content;
            const ord = [lang, ...['en','lo','th'].filter(l => l !== lang)];
            for (const l of ord) {
                if (co[l]?.trim()) { bodyContent = co[l]; break; }
            }
        }
        bodyContent = bodyContent.replace(
            /src="(?!(http|https|\/\/))/g,
            `src="${fullBase}/`
        );
        const bg = data.project_bg || {};
        const projBg = bg.project_background;
        const opacityVal = bg.project_opacity > 0 ? bg.project_opacity / 100 : 1;
        const bgStyle = projBg
            ? `background-image:linear-gradient(rgba(255,255,255,${1 - opacityVal}),rgba(255,255,255,${1 - opacityVal})),url('${fullBase}/${projBg}');background-size:cover;background-position:top center;background-repeat:no-repeat;`
            : '';
        const coverHtml = (hasContent && data.content?.cover && data.content?.cover_display === 'yes')
            ? `<div class="poles-cover-wrap">
                   <img src="${fullBase}/${data.content.cover}" alt="cover" loading="lazy" class="poles-cover-img">
                   <div class="poles-cover-overlay"></div>
               </div>`
            : '';
        const chip = (iconClass, colorVar, labelKey, value) => `
            <div class="poles-chip">
                <div class="poles-chip-icon" style="color:${colorVar};">
                    <i class="${iconClass}"></i>
                </div>
                <div>
                    <div class="poles-chip-label" data-i18n="${labelKey}"></div>
                    <div class="poles-chip-value">${value}</div>
                </div>
            </div>`;
        const html = `
        <div class="poles-detail animate__animated animate__fadeIn">
            <div class="poles-header-card">
                <div class="poles-header-left">
                    <div class="poles-avatar">
                        <i class="fas fa-broadcast-tower"></i>
                    </div>
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
                    ${(data.content.presentation && data.content.presentation.length > 0) ? 
                        renderPresentationShow(data.content.presentation) : 
                        ``
                    }
                    <article class="poles-article">
                        <h4 class="poles-article-title">${title}</h4>
                        <div class="poles-article-meta">
                            <i class="fa-regular fa-calendar-check"></i>
                            ${data.updated_at || data.created_at || ''}
                        </div>
                        <div class="poles-article-body article-content">
                            ${bodyContent}
                        </div>
                    </article>
                    <div class="multimedia-container px-1">
                        ${renderMultimedia(data.content, lang, fullBase)}
                    </div>
                ` : `
                    ${!projBg ? `
                        <div class="poles-empty">
                            <i class="fa-regular fa-file-lines"></i>
                            <div class="poles-empty-title">${langData['no_content_available'] || 'No content available'}</div>
                            <div class="poles-empty-sub">${langData['content_nothing_hear'] || "It looks like there's nothing here."}</div>
                        </div>
                    ` : '<div style="padding:40px 0;"></div>'}
                `}
            </div>
        </div>`;
        $body.html(html);
        $header.find('.modal-title').html(`
            <span class="project-status">
                <i class="fa-solid fa-circle-dot status-pulse me-2" style="color:${data.project_status_color || '#ccc'}; font-size: 0.8em;"></i>
                <span class="fw-bold" style="font-size: 0.9rem; color: #444;">
                    ${data.project_status_name || '—'}
                </span>
            </span>
        `);
        if (typeof updateText === 'function') updateText($body[0]);
        $body.find('.article-content img').each(function () {
            const $img = $(this);
            const src  = $img.attr('src');
            if (!src) return;
            $img.removeAttr('width height');
            let style = ($img.attr('style') || '').replace(/width\s*:\s*[^;]+;?/gi, '').replace(/height\s*:\s*[^;]+;?/gi, '');
            $img.attr('style', style.trim()).attr('loading', 'lazy');
            if (!$img.parent('a').length) {
                $img.wrap(`<a href="${src}" data-fancybox="content-images" class="content-img-link"></a>`);
            }
            $img.css({ cursor: 'zoom-in', transition: 'opacity 0.2s' }).addClass('hover-opacity');
        });
        if (typeof Fancybox !== 'undefined') {
            Fancybox.bind('[data-fancybox]', {
                Hash: false,
                Toolbar: { display: { left: ['infobar'], right: ['close'] } },
            });
        }
    } catch (err) {
        console.error('OpenPoles Error:', err);
        $body.html(renderErrorAlert('danger', langData['cannot_load'] || 'Failed to load data. Please try again later.'));
    }
}
function renderMultimedia(content, lang, baseUrl) {
    if (!content) return '';
    let html = '';
    if (content.images360?.length > 0) {
        html += `
        <div class="mm-section">
            <div class="mm-section-header">
                <div class="mm-section-icon" style="background:rgba(6,182,212,0.12);color:#0891b2;">
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
                    </div>
                `).join('')}
            </div>
        </div>`;
    }
    if (content.images?.length > 0) {
        html += `
        <div class="mm-section">
            <div class="mm-section-header">
                <div class="mm-section-icon" style="background:rgba(45,127,193,0.12);color:#2d7fc1;">
                    <i class="fa-solid fa-images"></i>
                </div>
                <span>${langData['gallery'] || 'Gallery'}</span>
            </div>
            <div class="mm-grid">
                ${content.images.map(img => `
                    <a href="${baseUrl}/${img.url}" data-fancybox="pole-gallery" class="mm-thumb">
                        <img src="${baseUrl}/${img.url}" loading="lazy">
                        <div class="mm-thumb-overlay"><i class="fa-solid fa-magnifying-glass-plus"></i></div>
                    </a>
                `).join('')}
            </div>
        </div>`;
    }
    if (content.attachments?.length > 0) {
        html += `
        <div class="mm-section">
            <div class="mm-section-header">
                <div class="mm-section-icon" style="background:rgba(220,38,38,0.10);color:#dc2626;">
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
$(document).ready(function () {
    $("header").hide();
    initMap();
});
Fancybox.bind("[data-fancybox='gallery']", {
    Hash: false,
    Thumbs: { autoStart: false },
    Toolbar: {
        display: {
            left: ["infobar"],
            middle: [],
            right: ["iterateZoom", "close"],
        },
    },
});