<div id="sidebar" class="sidebar d-flex flex-column">
    <div class="sidebar-header">
        <div class="px-2">
            <img src="<?=BASE_URL?>/public/images/logo.jpg" alt="" width="40" height="40">
        </div>
        <div>
            <small class="text-success">ກຸ່ມບໍລິສັດ ພົງຊັບທະວີ</small><br>
            <small style="font-size: 10px;">PHONGSUPTHAVY <span class="text-success">GROUP</span></small>
        </div>
        <button id="sidebarClose" class="btn btn-sm btn-light">
            <i class="bi bi-x-lg"></i>
        </button>
    </div>
    <ul class="list-unstyled mt-3 flex-grow-1">
        <?php if(isset($_SESSION['user']['role']) && ($_SESSION['user']['role'] == 'admin' || $_SESSION['user']['role'] == 'administrator')) { ?>
            <li><a href="<?=BASE_URL?>/" class="sidebar-link <?= ($GLOBALS['currentRoute']=='/'?'active':'') ?>">
                <i class="fas fa-wind"></i> <span data-i18n="dashboard"></span>
            </a></li>
            <li><a href="<?=BASE_URL?>/map" class="sidebar-link <?= ($GLOBALS['currentRoute']=='/map'?'active':'') ?>">
                <i class="fa-solid fa-map-location-dot"></i> <span data-i18n="map_setting"></span>
            </a></li>
            <li><a href="<?=BASE_URL?>/member" class="sidebar-link <?= ($GLOBALS['currentRoute']=='/member'?'active':'') ?>">
                <i class="fa-solid fa-users-line"></i> <span data-i18n="member"></span>
            </a></li>
            <li><a href="<?=BASE_URL?>/news" class="sidebar-link <?= ($GLOBALS['currentRoute']=='/news'?'active':'') ?>">
                <i class="fa-regular fa-newspaper"></i> <span data-i18n="news"></span>
            </a></li>
            <li><a href="<?=BASE_URL?>/document" class="sidebar-link <?= ($GLOBALS['currentRoute']=='/document'?'active':'') ?>">
                <i class="fa-solid fa-folder-tree"></i> <span data-i18n="document"></span>
            </a></li>
            <li><a href="<?=BASE_URL?>/import" class="sidebar-link <?= ($GLOBALS['currentRoute']=='/import'?'active':'') ?>">
                <i class="fa-solid fa-upload"></i> <span data-i18n="import"></span>
            </a></li>
            <li><a href="<?=BASE_URL?>/notification" class="sidebar-link <?= ($GLOBALS['currentRoute']=='/notification'?'active':'') ?>">
                <i class="bi bi-bell"></i> <span data-i18n="notification"></span>
            </a></li>
            <li><a href="<?=BASE_URL?>/setting" class="sidebar-link <?= ($GLOBALS['currentRoute']=='/setting'?'active':'') ?>">
                <i class="fa-solid fa-gear"></i> <span data-i18n="setting"></span>
            </a></li>
            <li><a href="<?=BASE_URL?>/shortcut" class="sidebar-link <?= ($GLOBALS['currentRoute']=='/shortcut'?'active':'') ?>">
                <i class="fa-regular fa-circle-down"></i> <span data-i18n="shortcut"></span>
            </a></li>
        <?php } else { ?>
            <li><a href="<?=BASE_URL?>/" class="sidebar-link <?= ($GLOBALS['currentRoute']=='/' || $GLOBALS['currentRoute']=='/map' ?'active':'') ?>">
                <i class="fa-solid fa-map-location-dot"></i> <span data-i18n="map"></span>
            </a></li>
            <li><a href="<?=BASE_URL?>/news" class="sidebar-link <?= ($GLOBALS['currentRoute']=='/news'?'active':'') ?>">
                <i class="fa-regular fa-newspaper"></i> <span data-i18n="news"></span>
            </a></li>
            <li><a href="<?=BASE_URL?>/document" class="sidebar-link <?= ($GLOBALS['currentRoute']=='/document'?'active':'') ?>">
                <i class="fa-regular fa-folder-open"></i> <span data-i18n="document"></span>
            </a></li>
            <li><a href="<?=BASE_URL?>/download" class="sidebar-link <?= ($GLOBALS['currentRoute']=='/download'?'active':'') ?>">
                <i class="fa-solid fa-download"></i> <span data-i18n="download"></span>
            </a></li>
        <?php } ?>
    </ul>
    <div class="sidebar-footer p-3">
        <a href="logout" class="btn btn-danger w-100">
            <i class="fa-solid fa-right-from-bracket"></i> <span data-i18n="logout"></span>
        </a>
    </div>
</div>