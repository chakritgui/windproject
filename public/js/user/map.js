let map, windyAPI;
let poleLayerGroup;
let windOn = true;
let poleMarkers = {};
let windUpdateFunctions = {};
let menuState = {};
let show_country_line = 'hide';
let map_labels = 'no';
let country_layers_data = null;
const DEFAULT_LEVEL = '100m';
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
                fetchData(`${BASE_URL}/api/wind-area`),
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
            if(map_labels === 'yes') {
                try {
                    const hasLabelsSpec = W.store.dataSpecs && W.store.dataSpecs.some(spec => spec.ident === 'labels');
                    if (hasLabelsSpec) {
                        store.set('labels', false);
                    }
                    const hasBaseSpec = W.store.dataSpecs && W.store.dataSpecs.some(spec => spec.ident === 'base');
                    if (hasBaseSpec) {
                        store.set('base', 'gray'); 
                    }
                } catch (e) {
                    console.warn("Windy premium settings skipped.");
                }
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
    const isMaskMode = masterData?.polygon_visibility === 'close';
    const featureGroup = L.featureGroup();
    const allHoles = [];
    polygons.forEach(area => {
        if (!area.geo_data) return;
        try {
            const geoJsonData = JSON.parse(area.geo_data);
            const styleData = JSON.parse(area.custom_style || "{}");
            const geoLayer = L.geoJSON(geoJsonData, {
                style: () => ({
                    fillColor: styleData.fillColor || "#3388ff",
                    fillOpacity: isMaskMode ? 0.01 : (styleData.fillOpacity || 0.2),
                    color: styleData.color || "#3388ff",
                    weight: styleData.weight || 2,
                    stroke: true,
                    opacity: isMaskMode ? 0.01 : 1,
                    interactive: true
                })
            });
            geoLayer.on('click', (e) => handlePickerOpening(e.latlng, picker));
            if (area.area_name) geoLayer.bindTooltip(area.area_name, { sticky: true });
            geoLayer.addTo(featureGroup);
            if (isMaskMode) {
                geoLayer.eachLayer(layer => {
                    if (layer.getLatLngs) {
                        const latlngs = layer.getLatLngs();
                        const rings = Array.isArray(latlngs[0]) && !(latlngs[0][0] instanceof L.LatLng) 
                            ? latlngs.map(inner => inner[0]) : [latlngs[0]];
                        allHoles.push(...rings);
                    }
                });
            }
        } catch (e) { console.error("JSON Parse Error (Area):", e); }
    });
    featureGroup.addTo(map);
    if (isMaskMode && allHoles.length > 0) {
        const world = [[90, -180], [90, 180], [-90, 180], [-90, -180]];
        L.polygon([world, ...allHoles], {
            fillColor: '#C0C0C0', fillOpacity: 0.75, stroke: false, interactive: false
        }).addTo(map).bringToBack();
    }
    if (featureGroup.getBounds().isValid()) {
        map.setMaxBounds(featureGroup.getBounds().pad(0.3));
        map.options.maxBoundsViscosity = 1.0;
    }
}
function handlePickerOpening(latlng, picker) {
    if (picker) {
        picker.open({ lat: latlng.lat, lon: latlng.lng || latlng.lon });
    }
}
async function loadPoles(map, picker) {
    try {
        const poles = await fetchData(`${BASE_URL}/api/poles-location`);
        if (!Array.isArray(poles)) return;
        poles.forEach(pole => {
            const lat = parseFloat(pole.poles_lat), lng = parseFloat(pole.poles_lng);
            if (isNaN(lat) || isNaN(lng)) return;
            let markerIcon = (pole.type_icon && pole.type_icon.trim() !== "") 
                ? L.icon({
                    iconUrl: pole.type_icon,
                    iconSize: [50, 50],
                    iconAnchor: [20, 60],
                    popupAnchor: [0, -50] 
                }) : getDivIcon(pole.type_id);
            const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(poleLayerGroup);
            const windId = `wind-auto-${pole.poles_id}`;
            poleMarkers[pole.poles_id] = marker;
            marker.bindTooltip(
                `<div class="wind-pill">
                    <span class="arrow-icon" id="arrow-${pole.poles_id}">➤</span>
                    <span class="wind-value" id="${windId}">...</span>
                </div>`, 
                { permanent: true, direction: 'right', className: 'wind-custom-tooltip', offset: [15, -20] }
            ).openTooltip();
            const updateWind = async () => {
                const el = document.getElementById(windId);
                const arrow = document.getElementById(`arrow-${pole.poles_id}`);
                if (!el || !windOn) return;
                try {
                    const currentModel = W.store.get('product') || 'ecmwf';
                    const weather = await W.model.getPoint(currentModel, { lat, lon: lng });
                    if (weather) {
                        const windSpeed = Math.round(weather.wind);
                        const windDir = Math.round(weather.dir);
                        const directionText = getDirectionName(windDir);
                        if (arrow) arrow.style.transform = `rotate(${windDir}deg)`;
                        el.innerText = `${directionText} ${windSpeed}kt`;
                    }
                } catch (e) {
                    console.warn(`Cannot get wind for pole ${pole.poles_id}:`, e);
                    el.innerText = "N/A";
                }
            };
            windUpdateFunctions[pole.poles_id] = updateWind;
            updateWind();
            marker.on('click', () => {
                openPoles(pole.poles_id);
            });
        });
        W.store.on('timestamp', () => {
            Object.values(windUpdateFunctions).forEach(fn => fn());
        });
        W.store.on('product', () => {
            Object.values(windUpdateFunctions).forEach(fn => fn());
        });
    } catch (err) { console.error("LoadPoles Error:", err); }
}
function toggleWind(isOn) {
    if (!windyAPI) return;
    windOn = isOn;
    const { store } = windyAPI;
    store.set('overlay', windOn ? 'wind' : 'none');
    Object.keys(poleMarkers).forEach(id => {
        const marker = poleMarkers[id];
        windOn ? marker.openTooltip() : marker.closeTooltip();
        if (windOn && windUpdateFunctions[id]) windUpdateFunctions[id]();
    });
}
function getDivIcon(typeId) {
    const color = typeId == 1 ? '#e74c3c' : (typeId == 2 ? '#2ecc71' : '#3498db');
    return L.divIcon({
        className: 'custom-pole-icon',
        html: `<i class="fa-solid fa-tower-broadcast" style="color: ${color}; font-size: 18px; text-shadow: 1px 1px 2px #000;"></i>`,
        iconSize: [24, 24], iconAnchor: [12, 24]
    });
}
async function fetchData(url, bodyData = {}) {
    try {
        const isWindyApi = url.includes('windy.com');
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
    1: { title: 'MEASUREMENT STATION', endpoint: `${BASE_URL}/api/contracts`, key: 'contract_id', label: 'contract_name' },
    2: { title: 'PROJECT', endpoint: `${BASE_URL}/api/project`, key: 'project_id', label: 'project_name' },
    3: { title: 'POLE TYPE', endpoint: `${BASE_URL}/api/type`, key: 'type_id', label: 'type_name' },
    4: { title: 'INSTALLATION', endpoint: `${BASE_URL}/api/station`, key: 'installations_id', label: 'installations_name', isLast: true }
};
async function loadMenuLevel(level) {
    const cfg = MENU_LEVELS[level];
    if (!cfg) return;
    for (let i = level; i <= 4; i++) $(`#menu-level-${i}`).removeClass('active').hide().empty();
    const data = await fetchData(cfg.endpoint, menuState);
    if (!data.length) return;
    let html = `<div class="menu-header">${cfg.title}</div>`;
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
    const $modal = $("#windModal");
    const $dialog = $modal.find(".modal-dialog");
    $dialog.addClass("modal-fullscreen");
    const modalBody = $modal.find(".modal-body");
    modalBody.html(`
        <div class="container py-4">
            <div class="skeleton-loader p-0">
                <div class="skeleton-rect mb-4 shadow-sm" style="height: 275px; border-radius: 1.5rem; background: #eee;"></div>
                <div class="skeleton-line mb-3" style="width: 70%; height: 30px; background: #eee; border-radius: 8px;"></div>
                <div class="skeleton-line mb-4" style="width: 30%; height: 20px; background: #eee; border-radius: 8px;"></div>
                <div class="skeleton-line mb-2" style="height: 15px; background: #eee; border-radius: 5px;"></div>
                <div class="skeleton-line mb-2" style="height: 15px; background: #eee; border-radius: 5px;"></div>
                <div class="skeleton-line mb-2" style="width: 90%; height: 15px; background: #eee; border-radius: 5px;"></div>
            </div>
        </div>
    `);
    $modal.find(".modal-header").html(`
        <h5 class="modal-title fw-bold text-dark"></h5>
        <div class="ms-auto d-flex align-items-center">
            <button type="button" class="btn btn-sm btn-light me-2" id="btn-fullscreen">
                <i class="fa-regular fa-window-maximize"></i>
            </button>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
    `);
    $modal.modal('show');
    const modalTitle = $modal.find(".modal-title");
    $modal.find("#btn-fullscreen").off("click").on("click", function() {
        $modal.find(".modal-dialog").toggleClass("modal-fullscreen");
        $(this).find("i").toggleClass("fa-regular fa-window-maximize fa-regular fa-window-restore");
    });
    $modal.find(".modal-footer").html(`
        <button type="button" class="btn btn-outline-primary me-2" onclick="openFilterModal(${poleId});">${currentLang['view_report'] || 'View Report'}</button>
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${langData['close'] || "Close"}</button>
    `);
    const modalInstance = bootstrap.Modal.getOrCreateInstance($modal[0]);
    modalInstance.show();
    try {
        const response = await fetch(`${BASE_URL}/api/pole-details`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: poleId })
        });
        if (!response.ok) throw new Error('Network response was not ok');
        const res = await response.json();
        const data = res.poles_id ? res : res.data;
        if (data && data.poles_id) {
            const lang = typeof currentLang !== 'undefined' ? currentLang : 'th';
            const hasContent = data.content;
            const fullBaseUrl = BASE_URL.replace(/\/$/, "");
            const title = hasContent ? (data.content.title[lang] || data.content.title['th']) : data.installations_name;
            let bodyContent = hasContent ? (data.content.content[lang] || data.content.content['th'] || '') : '';
            bodyContent = bodyContent.replace(/src="(?!(http|https|\/\/))/g, `src="${fullBaseUrl}/`);
            const html = `
                <div class="pole-detail-wrapper animate__animated animate__fadeIn">
                    <div class="card border-0 bg-primary bg-opacity-10 rounded-4 mb-4 p-4 shadow-sm">
                        <div class="row align-items-center">
                            <div class="col-md-12">
                                <span class="badge bg-primary mb-2">${data.type_name}</span>
                                <h3 class="fw-bolder text-primary mb-1">${data.installations_name}</h3>
                                <div class="d-flex flex-wrap gap-3 text-muted">
                                    <span><i class="fa-solid fa-diagram-project me-1"></i>${data.project_name}</span>
                                    <span><i class="fa-solid fa-signal me-1"></i>${data.levels_name}</span>
                                </div>
                                <div class="text-muted"><i class="fa-solid fa-location-dot"></i> ${data.poles_lat}, ${data.poles_lng}</div>
                            </div>
                        </div>
                    </div>
                    ${(data.content_id) ? `
                        <div class="row">
                            <div class="col-lg-12">
                                ${data.content?.cover ? `
                                    <div class="position-relative mb-4 overflow-hidden rounded-4 shadow-sm">
                                        <img src="${fullBaseUrl}/${data.content.cover}" class="w-100 h-100 object-fit-cover" alt="cover" style="max-height: 275px; min-height: 275px;">
                                    </div>
                                ` : ''}
                                <article class="px-2">
                                    <h4 class="fw-bold mb-3">${title}</h4>
                                    <div class="d-flex align-items-center gap-3 text-muted mb-4 pb-3 border-bottom">
                                        <div class="small"><i class="fa-regular fa-calendar-check me-1"></i> ${data.updated_at || data.created_at}</div>
                                    </div>
                                    <div class="article-content lh-lg text-secondary mb-5">
                                        ${bodyContent}
                                    </div>
                                </article>
                            </div>
                        </div>
                        <div class="multimedia-container px-2">
                            ${renderMultimedia(data.content, lang, fullBaseUrl)}
                        </div>
                    ` : `
                        <div class="text-center py-5">
                            <div class="mb-4">
                                <i class="fa-regular fa-file-lines text-light-emphasis" style="font-size: 64px; opacity: 0.5;"></i>
                            </div>
                            <h5 class="fw-bold text-dark">${langData['no_content_available'] || 'No content available'}</h5>
                            <p class="text-muted mb-4">${langData['content_nothing_hear'] || 'It looks like there’s nothing here, or this page has moved.'}</p>
                        </div>
                    `}
                </div>
            `;
            modalBody.html(html);
            modalTitle.text(`${data.poles_code}`);
        } else {
            modalBody.html(renderErrorAlert('warning', currentLang['no_data_found'] || 'No data found'));
        }
    } catch (error) {
        console.error("OpenPoles Error:", error);
        modalBody.html(renderErrorAlert('danger', currentLang['cannot_load'] || 'Failed to load data. Please try again later.'));
    }
}
function renderMultimedia(content, lang, baseUrl) {
    if (!content) return '';
    let html = '';
    if (content.images360?.length > 0) {
        html += `
            <div class="section-title mb-3 mt-4">
                <h5 class="fw-bold d-flex align-items-center text-dark">
                    <i class="fa-solid fa-vr-cardboard text-info me-2"></i> ${currentLang['vr_experience'] || '360° Experience'}
                </h5>
            </div>
            <div class="row g-3 mb-5">
                ${content.images360.map(vr => `
                    <div class="col-6 col-md-2 col-lg-2">
                        <div class="card border-0 shadow-sm rounded-4 overflow-hidden h-100 vr-card cursor-pointer" 
                            onclick="openVRModal('${baseUrl}/${vr.url}')">
                            <div class="position-relative h-100" style="min-height: 150px;">
                                <img src="${baseUrl}/${vr.url}" class="w-100 h-100 object-fit-cover">
                                <div class="position-absolute top-0 start-0 m-2">
                                    <span class="badge rounded-pill bg-dark bg-opacity-75 fw-light">
                                        <i class="fa-solid fa-rotate me-1 fa-spin"></i> 360°
                                    </span>
                                </div>
                                <div class="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-25 d-flex align-items-center justify-content-center">
                                    <div class="btn btn-light btn-sm rounded-pill shadow-sm fw-bold px-3">
                                        <i class="fa-solid fa-expand me-1"></i> ${langData['view'] || 'View'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    if (content.images?.length > 0) {
        html += `
            <div class="section-title mb-3">
                <h5 class="fw-bold d-flex align-items-center text-dark">
                    <i class="fa-solid fa-images text-primary me-2"></i> ${currentLang['gallery'] || 'Gallery'}
                </h5>
            </div>
            <div class="row g-2 mb-5">
                ${content.images.map(img => `
                    <div class="col-4 col-md-2">
                        <a href="${baseUrl}/${img.url}" data-fancybox="pole-gallery" class="gallery-item d-block ratio ratio-1x1 overflow-hidden rounded-3 border bg-light">
                            <img src="${baseUrl}/${img.url}" class="gallery-img" loading="lazy">
                        </a>
                    </div>
                `).join('')}
            </div>
        `;
    }
    if (content.attachments?.length > 0) {
        html += `
            <div class="section-title mb-3">
                <h5 class="fw-bold d-flex align-items-center text-dark">
                    <i class="fa-solid fa-file-pdf text-danger me-2"></i> ${currentLang['attachments'] || 'Attachments'}
                </h5>
            </div>
            <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
                ${content.attachments.map(file => {
                    const isPdf = file.url.toLowerCase().endsWith('.pdf');
                    return `
                        <div class="col">
                            <a href="${baseUrl}/${file.url}" download class="doc-card shadow-sm border rounded-4 p-3 d-flex align-items-center text-decoration-none hover-shadow transition-all">
                                <div class="doc-icon me-3 bg-light rounded-circle d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                                    <i class="fa-solid ${isPdf ? 'fa-file-pdf text-danger' : 'fa-file-lines text-primary'} fs-3"></i>
                                </div>
                                <div class="doc-info text-truncate">
                                    <div class="fw-bold text-dark text-truncate">${file.name}</div>
                                    <div class="small text-muted text-uppercase">${file.url.split('.').pop()} File</div>
                                </div>
                                <i class="fa-solid fa-download ms-auto fa-2x text-muted"></i>
                            </a>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    return html;
}
function renderErrorAlert(type, message) {
    return `<div class="p-5 text-center"><div class="alert alert-${type} shadow-sm rounded-4">${message}</div></div>`;
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
let vrViewer = null;
function openVRModal(imgUrl) {
    const modal = new bootstrap.Modal(document.getElementById('vrModal'));
    modal.show();
    if (vrViewer) {
        vrViewer.destroy();
    }
    setTimeout(() => {
        vrViewer = pannellum.viewer('panorama-viewer', {
            "type": "equirectangular",
            "panorama": imgUrl,
            "autoLoad": true,
            "autoRotate": -2,
            "compass": true,
            "hfov": 110
        });
    }, 300);
}
$('#vrModal').on('hidden.bs.modal', function () {
    if (vrViewer) {
        vrViewer.destroy();
        vrViewer = null;
    }
});