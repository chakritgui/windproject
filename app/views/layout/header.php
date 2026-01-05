<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PSG - PHONGSUPTHAVY GROUP</title>
<link rel="icon" type="image/png">
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@100;200;300;400;500;600;700;800&display=swap" rel="stylesheet">
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/sweetalert2@11.26.3/dist/sweetalert2.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap5.min.css">
<script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.ckeditor.com/ckeditor5/41.0.0/classic/ckeditor.js"></script>
<script src="https://cdn.datatables.net/1.13.6/js/dataTables.bootstrap5.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fancyapps/ui/dist/fancybox.css" />
<script src="https://cdn.jsdelivr.net/npm/@fancyapps/ui/dist/fancybox.umd.js"></script>
<link rel="stylesheet" href="<?=BASE_URL?>/public/css/style.css?v=<?=time();?>">
<script>
    const BASE_URL = "<?= BASE_URL ?>";
</script>
</head>
<body>
<div id="pageLoader" class="position-fixed top-0 start-0 w-100 h-100 d-none" style="z-index: 1055; background: rgba(255,255,255,.7);">
    <div class="d-flex justify-content-center align-items-center h-100">
        <div class="spinner-border" role="status" aria-hidden="true"></div>
        <span class="ms-2" data-i18n="loading"></span>
    </div>

</div>
<?=include('menu.php')?>
<div id="sidebarOverlay" class="sidebar-overlay"></div>
    <header class="bg-white border-bottom py-2">
        <div class="container-fluid d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center">
            <?php if(!empty($_SESSION)) { ?>
                <button id="sidebarToggle" class="btn btn-light btn-sm me-2">
                    <i class="bi bi-list" style="font-size: 1.3rem;"></i>
                </button>
            <?php } ?>
            <h1 class="h4 m-0">
                <a href="./" class="text-decoration-none text-dark d-flex align-items-center">
                    <img alt="" height="50" class="me-2 logo-full">
                    <img alt="" height="35" class="me-2 logo-small">
                </a>
            </h1>
        </div>
        <div class="d-flex align-items-center gap-3">
            <?php if(!empty($_SESSION)) { ?>
            <div class="dropdown">
                <button class="btn btn-light btn-sm position-relative btn-notification"
                    data-bs-toggle="dropdown"
                    aria-expanded="false">
                    <i class="bi bi-bell"></i>
                    <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger notification-badge d-none">
                        <span id="notificationCount">5</span>
                        <span class="visually-hidden">unread notifications</span>
                    </span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow custom-notification-menu" data-bs-auto-close="false">
                    <li class="dropdown-header d-flex justify-content-between align-items-center border-bottom pb-2 bg-white position-sticky top-0">
                        <span class="fw-bold">
                            <i class="bi bi-bell me-2"></i>
                            <span data-i18n="notification"></span>
                        </span>
                        <button class="btn btn-sm btn-light border-0 btn-close-dropdown">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </li>
                    <li class="p-0">
                        <div class="notification-list"></div>
                    </li>
                    <li class="dropdown-footer text-center border-top pt-2 pb-2 bg-white position-sticky bottom-0">
                        <small class="text-muted">
                            <span data-i18n="notifications"></span>
                            <span class="show-notification-count"></span>
                            <span data-i18n="item"></span>
                        </small>
                    </li>
                </ul>
            </div>
            <?php } ?>
            <div class="dropdown dropdown-language">
                <button class="btn btn-light btn-sm dropdown-toggle" data-bs-toggle="dropdown"></button>
                <ul class="dropdown-menu" id="languageMenu"></ul>
            </div>
            <?php if(!empty($_SESSION)) { ?>
            <div class="dropdown">
                <button class="btn btn-light btn-sm dropdown-toggle" data-bs-toggle="dropdown">
                    <i class="fa-regular fa-user"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li>
                        <a class="dropdown-item" href="<?=BASE_URL?>/account">
                            <i class="bi bi-gear me-2"></i> <span data-i18n="account_settings"></span>
                        </a>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                        <a class="dropdown-item text-danger" href="<?=BASE_URL?>/logout">
                            <i class="bi bi-box-arrow-right me-2"></i> <span data-i18n="logout"></span>
                        </a>
                    </li>
                </ul>
            </div> 
            <?php } ?> 
        </div>
    </div>
</header>
<div class="main-container <?=(empty($_SESSION)?'blue-frame':'')?>">