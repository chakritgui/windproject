async function loadMenu() {
    try {
        const res = await $.ajax({
            url: `${BASE_URL}/api/menu.load`,
            method: 'POST',
            dataType: 'json'
        });
        if (!res || res.status !== true) {
            return;
        }
        if (res.data.unread !== undefined) {
            updateUnreadBadge(res.data.unread);
        }
        renderSidebar(res.data.menus, res.data.role);
        if (window.localize) { window.localize(); } 
    } catch (err) {
        console.error("Menu load failed:", err);
    }
}
function renderSidebar(menus, role) {
    if (!Array.isArray(menus)) return;
    const $menuContainer = $('#main-sidebar-menu');
    let html = '';
    let currentRoute = window.location.pathname;
    currentRoute = currentRoute.replace('/windproject', '').replace(/\/$/, '');
    let path = currentRoute;
    let cleanPath = path.replace(/^\//, '');
    let firstSegment = cleanPath.split('/')[0];
    firstSegment = "/" + firstSegment;
    menus.forEach(item => {
        const itemPath = ('/' + item.path).replace(/\/$/, '');
        const isActive = (firstSegment === itemPath) ? 'active' : '';
        const title = (item.translations && item.translations[currentLang]) ? item.translations[currentLang] : (item.translations?.en || '');
        const target = (item.is_default == 1) ? "_self" : "_blank";
        html += `
            <li>
                <a href="${BASE_URL}/${item.path}" class="sidebar-link d-flex align-items-center ${isActive}" target="${target}">
                    <i class="${item.icon || ''} me-2"></i>
                    <span>${title}</span>
                </a>
            </li>
        `;
    });
    $menuContainer.html(html);
    if (role == 'user') {
        const $menuHeader2 = $('#main-sidebar-header');
        let html_header = '';
        const maxVisible = 5; 
        const totalMenus = menus.length;
        menus.forEach((item, index) => {
            const itemPath2 = ('/' + item.path).replace(/\/$/, '');
            const isActive2 = (firstSegment === itemPath2) ? 'active' : '';
            const title2 = (item.translations && item.translations[currentLang])
                ? item.translations[currentLang]
                : (item.translations?.en || '');
            const target2 = (item.is_default == 1) ? "_self" : "_blank";
            if (totalMenus <= maxVisible || index < maxVisible) {
                html_header += `
                    <li class="nav-item">
                        <a class="nav-link ${isActive2}" href="${BASE_URL}/${item.path}" target="${target2}">
                            <i class="${item.icon || ''} me-2"></i>
                            <span>${title2}</span>
                        </a>
                    </li>
                `;
            }
            if (totalMenus > maxVisible && index === maxVisible) {
                html_header += `
                    <li class="nav-item dropdown dropdown-menu-end">
                        <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown"><span>${langData['view_more']}</span></a>
                        <ul class="dropdown-menu">
                `;
                for (let i = maxVisible; i < totalMenus; i++) {
                    const subItem = menus[i];
                    const subPath = ('/' + subItem.path).replace(/\/$/, '');
                    const subActive = (currentRoute === subPath) ? 'active' : '';
                    const subTitle = (subItem.translations && subItem.translations[currentLang])
                        ? subItem.translations[currentLang]
                        : (subItem.translations?.en || '');
                    html_header += `
                        <li>
                            <a class="dropdown-item ${subActive}" href="${BASE_URL}/${subItem.path}" target="${target2}">
                                <i class="${subItem.icon || ''} me-2"></i>
                                ${subTitle}
                            </a>
                        </li>
                    `;
                }
                html_header += `
                        </ul>
                    </li>
                `;
                return false; 
            }
        });
        $menuHeader2.html(html_header);
    }
}