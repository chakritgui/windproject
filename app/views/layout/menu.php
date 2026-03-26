<div id="sidebar" class="sidebar d-flex flex-column">
    <div class="sidebar-header">
        <div class="px-2">
            <img alt="" height="40" class="logo-full">
        </div>
        <button id="sidebarClose" class="btn btn-sm btn-light">
            <i class="fa-solid fa-xmark"></i>
        </button>
    </div>
    <ul id="main-sidebar-menu" class="list-unstyled mt-3 flex-grow-1 overflow-auto"></ul>
    <div class="sidebar-footer p-3">
        <a href="<?=BASE_URL?>/logout" class="btn btn-danger w-100">
            <i class="fa-solid fa-right-from-bracket"></i> <span data-i18n="logout"></span>
        </a>
    </div>
</div>