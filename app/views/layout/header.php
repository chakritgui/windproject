<?php
    $publicPath   = dirname(__DIR__, 3) . "/public/";
    $manifestFile = $publicPath . "manifest.json";
    $location = "";
    if(!empty($_SESSION['user'])) {
        if($_SESSION['user']['role'] == 'user') {
            $location = "home";
        } else {
            $location = "dashboard";
        }
    }
?>
<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PSG - PHONGSUPTHAVY GROUP</title>
<link rel="icon" type="image/png">
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@100;200;300;400;500;600;700;800&display=swap" rel="stylesheet">
<link href="<?=BASE_URL?>/vendor/bootstrap-5.3.8-dist/css/bootstrap.min.css" rel="stylesheet">
<link href="<?=BASE_URL?>/vendor/fontawesome-free-7.1.0-web/css/all.min.css" rel="stylesheet">
<link href="<?=BASE_URL?>/vendor/sweetalert2/dist/sweetalert2.min.css" rel="stylesheet">
<link href="<?=BASE_URL?>/vendor/datatables/css/dataTables.bootstrap5.min.css" rel="stylesheet">
<link href="<?=BASE_URL?>/vendor/fancyapps/ui/dist/fancybox.css" rel="stylesheet">
<link href="<?=BASE_URL?>/vendor/select2/dist/css/select2.min.css" rel="stylesheet">
<link href="<?=BASE_URL?>/vendor/select2-bootstrap-5-theme/dist/select2-bootstrap-5-theme.min.css" rel="stylesheet">
<link href="<?=BASE_URL?>/vendor/daterangepicker/daterangepicker.css" rel="stylesheet">
<link href="<?=BASE_URL?>/vendor/bootstrap-datepicker/css/bootstrap-datepicker.min.css" rel="stylesheet">
<link href="<?=BASE_URL?>/vendor/tempus-dominus/dist/css/tempus-dominus.min.css" rel="stylesheet">
<link rel="stylesheet" href="<?=BASE_URL?>/vendor/fancybox/fancybox.css">
<link rel="stylesheet" href="<?=BASE_URL?>/vendor/pannellum/pannellum.css">
<link rel="stylesheet" href="<?=BASE_URL?>/vendor/animate.css/animate.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/summernote@0.8.20/dist/summernote-bs5.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
<link href="<?=asset('public/css/style.css')?>" rel="stylesheet">
<link href="<?=asset('public/css/notification.css')?>" rel="stylesheet">
<?php if (file_exists($manifestFile)) { ?>
    <link rel="manifest" href="/public/manifest.json?v=1.0.0">
    <link rel="apple-touch-icon" href="/public/icons/icon-ios.png">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="App Short Name">
<?php } ?>
<script src="<?=BASE_URL?>/vendor/jquery/jquery-3.6.0.min.js"></script>
<script src="<?=BASE_URL?>/vendor/bootstrap-5.3.8-dist/js/bootstrap.bundle.min.js"></script>
<script src="<?=BASE_URL?>/vendor/datatables/js/jquery.dataTables.min.js"></script>
<script src="<?=BASE_URL?>/vendor/datatables/js/dataTables.bootstrap5.min.js"></script>
<script src="<?=BASE_URL?>/vendor/select2/dist/js/select2.min.js"></script>
<script src="<?=BASE_URL?>/vendor/fancyapps/ui/dist/fancybox.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/summernote@0.8.20/dist/summernote-bs5.min.js"></script>
<script src="<?=BASE_URL?>/vendor/momentjs/latest/moment.min.js"></script>
<script src="<?=BASE_URL?>/vendor/daterangepicker/daterangepicker.min.js"></script>
<script src="<?=BASE_URL?>/vendor/bootstrap-datepicker/js/bootstrap-datepicker.min.js"></script>
<script src="<?=BASE_URL?>/vendor/bootstrap-datepicker/locales/bootstrap-datepicker.th.min.js"></script>
<script src="<?=BASE_URL?>/vendor/tempus-dominus/dist/js/tempus-dominus.min.js"></script>
<script src="<?=BASE_URL?>/vendor/fancybox/fancybox.umd.js"></script>
<script type="text/javascript" src="<?=BASE_URL?>/vendor/pannellum/pannellum.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script>
    const BASE_URL = "<?=BASE_URL?>";
    const USER = <?= json_encode(!empty($_SESSION['user']['id']) ? $_SESSION['user']['id'] : null) ?>;
    <?php if (file_exists($manifestFile)) { ?>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                }).catch(function(error) {
                    console.error('SW Registration failed:', error);
                });
            });
        }
    <?php } ?>
</script>
</head>
<body>
<script src="<?=BASE_URL?>/vendor/sweetalert2/dist/sweetalert2.all.min.js"></script>
<script src="<?=asset('public/js/app.js')?>"></script>
<script src="<?=asset('public/js/helper.js')?>" defer></script>
<script src="<?=asset('public/js/content.js')?>" defer></script>
<script src="<?=asset('public/js/alert.js')?>" defer></script>
<script src="<?=asset('public/js/object.js')?>" defer></script>
<script src="<?=asset('public/js/notification.js')?>" defer></script>
<script src="<?=asset('public/js/menu.js')?>" defer></script>
<script src="<?=asset('public/js/view.js')?>" defer></script>
<button type="button" id="btn-back-to-top" class="btn btn-sm btn-back-to-top rounded-circle shadow-lg transition-all" title="Back to Top">
    <i class="fa-solid fa-angle-up"></i>
</button>
<div id="pageLoader" class="position-fixed top-0 start-0 w-100 h-100 d-none" style="z-index: 1055; background: rgba(255,255,255,.7);">
    <div class="d-flex justify-content-center align-items-center h-100">
        <div class="spinner-border" role="status" aria-hidden="true"></div>
        <span class="ms-2" data-i18n="loading"></span>
    </div>
</div>
<?php include 'menu.php'; ?>
<div id="sidebarOverlay" class="sidebar-overlay"></div>
<header class="bg-white border-bottom py-2">
    <div class="container-fluid d-flex justify-content-between align-items-center gx-0 gy-0">
        <div class="d-flex align-items-center">
            <?php if(isset($_SESSION['user'])) { ?>
                <button id="mapFilter" class="btn btn-sm btn-dark"><i class="fa-solid fa-bars"></i></button>
                <div class="side-menu-wrapper">
                    <div id="menu-level-1" class="menu-panel"></div>
                    <div id="menu-level-2" class="menu-panel"></div>
                    <div id="menu-level-3" class="menu-panel"></div>
                </div>
                <button id="sidebarToggle" class="btn btn-light btn-sm me-1 <?= (isset($_SESSION['user']['role']) && in_array($_SESSION['user']['role'], ['admin','administrator'])) ? '' : 'd-lg-none' ?>">
                    <i class="fa-solid fa-bars"></i>
                </button>
            <?php } ?>
            <div class="h4 m-0">
                <a href="<?=BASE_URL?>/<?php echo $location; ?>" class="logo text-decoration-none text-dark d-flex align-items-center">
                    <img class="logo-full" alt="" height="40" class="me-2">
                </a>
            </div>
        </div>
        <div class="d-flex align-items-center gap-2">
            <?php if(isset($_SESSION['user']) && !in_array($_SESSION['user']['role'], ['admin','administrator'])) { ?>
                <ul class="nav d-none d-lg-flex align-items-center me-3" id="main-sidebar-header"></ul>
            <?php } ?>
            <?php if(isset($_SESSION['user'])) { ?>
                <div class="dropdown">
                    <button class="btn btn-light btn-sm position-relative btn-notification" data-bs-toggle="dropdown">
                        <i class="fa-solid fa-bell"></i>
                        <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger notification-badge d-none">
                            <span id="notificationCount">0</span>
                        </span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end notif-dropdown" data-bs-auto-close="outside">
                        <li class="notif-header">
                            <div class="notif-header-left">
                                <div class="notif-bell-wrap">
                                    <i class="fa-solid fa-bell"></i>
                                </div>
                                <span class="notif-title" data-i18n="notification"></span>
                            </div>
                            <button class="notif-close btn-close-dropdown" type="button"><i class="fa-solid fa-xmark"></i></button>
                        </li>
                        <li>
                            <div class="notification-list"></div>
                        </li>
                        <li class="notif-footer">
                            <a href="<?=BASE_URL?>/news">
                                <span data-i18n="view_all"></span> <i class="fa-solid fa-arrow-right"></i>
                            </a>
                        </li>
                    </ul>
                </div>
            <?php } ?>
            <div class="dropdown dropdown-language">
                <button class="btn btn-light btn-sm dropdown-toggle" data-bs-toggle="dropdown"></button>
                <ul class="dropdown-menu" id="languageMenu"></ul>
            </div>
            <?php if(isset($_SESSION['user'])) { ?>
                <div class="dropdown">
                    <button class="btn btn-light btn-sm dropdown-toggle" data-bs-toggle="dropdown">
                        <i class="fa-regular fa-user"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="<?=BASE_URL?>/account"><i class="fa-solid fa-address-book me-2"></i><span data-i18n="member_profile"></span></a></li>
<?php
                        $disclaimer = $disclaimer ?? $_SESSION['pending_disclaimer'] ?? null;
?>
                        <?php if (!empty($disclaimer['content'])): ?>
                            <li><a class="dropdown-item" href="<?=BASE_URL?>/disclaimer"><i class="fa-solid fa-file-shield me-2"></i><span data-i18n="disclaimer"></span></a></li>
                        <?php else: ?>
                        <?php endif; ?>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="<?=BASE_URL?>/logout"><i class="fa-solid fa-right-from-bracket me-2"></i><span data-i18n="logout"></span></a></li>
                    </ul>
                </div>
            <?php } ?>
        </div>
    </div>
</header>
<div class="main-container <?=(empty($_SESSION['user']['id'])?'blue-frame':'')?>">