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
<link href="<?=BASE_URL?>/public/css/style.css?v=<?= time(); ?>" rel="stylesheet">
<?php if (file_exists($manifestFile)) { ?>
    <link rel="manifest" href="<?= BASE_URL ?>/public/manifest.json">
    <link rel="apple-touch-icon" href="<?=BASE_URL?>/public/icons/icon-ios.png">
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
    <?php if (file_exists($manifestFile)) { ?>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                navigator.serviceWorker.register(BASE_URL + '/sw.js')
                .then(function(registration) {
                    registration.update();
                    console.log('SW Registered with scope:', registration.scope);
                })
                .catch(function(error) {
                    console.error('SW Registration failed:', error);
                });
            });
        }
    <?php } ?>
</script>
</head>
<body>
<script src="<?=BASE_URL?>/vendor/sweetalert2/dist/sweetalert2.all.min.js"></script>
<script src="<?=BASE_URL?>/public/js/app.js?v=<?=time();?>"></script>
<script src="<?=BASE_URL?>/public/js/helper.js?v=<?=time();?>" defer></script>
<script src="<?=BASE_URL?>/public/js/content.js?v=<?=time();?>" defer></script>
<script src="<?=BASE_URL?>/public/js/alert.js?v=<?=time();?>" defer></script>
<script src="<?=BASE_URL?>/public/js/object.js?v=<?=time();?>" defer></script>
<script src="<?=BASE_URL?>/public/js/notification.js?v=<?=time();?>" defer></script>
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
            <?php if(!empty($_SESSION)) { ?>
                <button id="mapFilter" class="btn btn-sm btn-dark"><i class="fa-solid fa-bars"></i></button>
                <div class="side-menu-wrapper">
                    <div id="menu-level-1" class="menu-panel"></div>
                    <div id="menu-level-2" class="menu-panel"></div>
                    <div id="menu-level-3" class="menu-panel"></div>
                    <div id="menu-level-4" class="menu-panel"></div>
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
                <ul class="nav d-none d-lg-flex align-items-center me-3">
                    <li class="nav-item">
                        <a class="nav-link <?=($GLOBALS['currentRoute']=='/home'?'active':'')?>" href="<?=BASE_URL?>/home">
                            <i class="fa-solid fa-house"></i> <span data-i18n="home"></span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link <?=($GLOBALS['currentRoute']=='/news'?'active':'')?>" href="<?=BASE_URL?>/news">
                            <i class="fa-solid fa-newspaper"></i> <span data-i18n="news"></span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link <?=($GLOBALS['currentRoute']=='/project'?'active':'')?>" href="<?=BASE_URL?>/project">
                            <i class="fa-solid fa-diagram-project"></i> <span data-i18n="project"></span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link <?=($GLOBALS['currentRoute']=='/document'?'active':'')?>" href="<?=BASE_URL?>/document">
                            <i class="fa-regular fa-folder-open"></i> <span data-i18n="document"></span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link <?=($GLOBALS['currentRoute']=='/download'?'active':'')?>" href="<?=BASE_URL?>/download">
                            <i class="fa-solid fa-download"></i> <span data-i18n="download"></span>
                        </a>
                    </li>
                </ul>
            <?php } ?>
            <?php if(!empty($_SESSION)) { ?>
                <div class="dropdown">
                    <button class="btn btn-light btn-sm position-relative btn-notification" data-bs-toggle="dropdown">
                        <i class="fa-solid fa-bell"></i>
                        <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger notification-badge d-none">
                            <span id="notificationCount">0</span>
                        </span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow custom-notification-menu" data-bs-auto-close="outside">
                        <li class="dropdown-header d-flex justify-content-between align-items-center border-bottom pb-2">
                            <span class="fw-bold"><i class="fa-solid fa-bell me-2"></i><span data-i18n="notification">Notifications</span></span>
                            <button class="btn btn-sm btn-light border-0 btn-close-dropdown">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </li>
                        <li><div class="notification-list"></div></li>
                        <li class="dropdown-footer text-center border-top pt-2 pb-0">
                            <div class="d-flex flex-column">
                                <a href="<?=BASE_URL?>/news" class="btn btn-light btn-sm border-0 w-100 py-2 fw-bold text-primary" data-i18n="view_all_notifications" style="border-radius: 0 0 5px 5px;"></a>
                            </div>
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
                        <li><a class="dropdown-item" href="<?=BASE_URL?>/account"><i class="fa-solid fa-gear me-2"></i> <span data-i18n="account_settings"></span></a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="<?=BASE_URL?>/logout"><i class="fa-solid fa-right-from-bracket me-2"></i> <span data-i18n="logout"></span></a></li>
                    </ul>
                </div>
            <?php } ?>
        </div>
    </div>
</header>
<div class="main-container <?=(empty($_SESSION)?'blue-frame':'')?>">