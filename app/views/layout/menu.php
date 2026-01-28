<div id="sidebar" class="sidebar d-flex flex-column">
    <div class="sidebar-header">
        <div class="px-2">
            <img alt="" height="40" class="logo">
        </div>
        <button id="sidebarClose" class="btn btn-sm btn-light">
            <i class="fa-solid fa-xmark"></i>
        </button>
    </div>
    <ul class="list-unstyled mt-3 flex-grow-1 overflow-auto">
        <?php if(isset($_SESSION['user']['role']) && in_array($_SESSION['user']['role'], ['admin','administrator'])) { ?>
            <li><a href="<?=BASE_URL?>/" class="sidebar-link <?=($GLOBALS['currentRoute']=='/'?'active':'')?>"><i class="fa-solid fa-chart-pie"></i> <span data-i18n="dashboard"></span></a></li>
            <li><a href="<?=BASE_URL?>/member" class="sidebar-link <?=($GLOBALS['currentRoute']=='/member'?'active':'')?>"><i class="fa-solid fa-users-line"></i> <span data-i18n="member"></span></a></li>
            <li><a href="<?=BASE_URL?>/document" class="sidebar-link <?=($GLOBALS['currentRoute']=='/document'?'active':'')?>"><i class="fa-solid fa-folder-tree"></i> <span data-i18n="document"></span></a></li>
            <li><a href="<?=BASE_URL?>/news" class="sidebar-link <?=($GLOBALS['currentRoute']=='/news'?'active':'')?>"><i class="fa-solid fa-newspaper" style="font-size:1.5rem"></i> <span data-i18n="news"></span></a></li>
            <li><a href="<?=BASE_URL?>/wind" class="sidebar-link <?=($GLOBALS['currentRoute']=='/wind'?'active':'')?>"><i class="fa-solid fa-wind"></i> <span data-i18n="wind"></span></a></li>
            <li><a href="<?=BASE_URL?>/project" class="sidebar-link <?=($GLOBALS['currentRoute']=='/project'?'active':'')?>"><i class="fa-solid fa-diagram-project"></i> <span data-i18n="project"></span></a></li>
            <li><a href="<?=BASE_URL?>/map" class="sidebar-link <?=($GLOBALS['currentRoute']=='/map'?'active':'')?>"><i class="fa-solid fa-map-location-dot"></i> <span data-i18n="map_and_boundary"></span></a></li>
            <li><a href="<?=BASE_URL?>/master" class="sidebar-link <?=($GLOBALS['currentRoute']=='/master'?'active':'')?>"><i class="fa-solid fa-database"></i> <span data-i18n="master_data"></span></a></li>
            <li><a href="<?=BASE_URL?>/setting" class="sidebar-link <?=($GLOBALS['currentRoute']=='/setting'?'active':'')?>"><i class="fa-solid fa-gear"></i> <span data-i18n="setting"></span></a></li>
            <li><a href="<?=BASE_URL?>/shortcut" class="sidebar-link <?=($GLOBALS['currentRoute']=='/shortcut'?'active':'')?>"><i class="fa-regular fa-circle-down"></i> <span data-i18n="shortcut"></span></a></li>
        <?php } else { ?>
            <li><a href="<?=BASE_URL?>/" class="sidebar-link <?=($GLOBALS['currentRoute']=='/'?'active':'')?>"><i class="fa-solid fa-map-location-dot"></i> <span data-i18n="map"></span></a></li>
            <li><a href="<?=BASE_URL?>/news" class="sidebar-link <?=($GLOBALS['currentRoute']=='/news'?'active':'')?>"><i class="fa-solid fa-newspaper"></i> <span data-i18n="news"></span></a></li>
            <li><a href="<?=BASE_URL?>/project" class="sidebar-link <?=($GLOBALS['currentRoute']=='/project'?'active':'')?>"><i class="fa-solid fa-diagram-project"></i> <span data-i18n="project"></span></a></li>
            <li><a href="<?=BASE_URL?>/document" class="sidebar-link <?=($GLOBALS['currentRoute']=='/document'?'active':'')?>"><i class="fa-regular fa-folder-open"></i> <span data-i18n="document"></span></a></li>
            <li><a href="<?=BASE_URL?>/download" class="sidebar-link <?=($GLOBALS['currentRoute']=='/download'?'active':'')?>"><i class="fa-solid fa-download"></i> <span data-i18n="download"></span></a></li>
        <?php } ?>
    </ul>
    <div class="sidebar-footer p-3">
        <a href="<?=BASE_URL?>/logout" class="btn btn-danger w-100">
            <i class="fa-solid fa-right-from-bracket"></i> <span data-i18n="logout"></span>
        </a>
    </div>
</div>