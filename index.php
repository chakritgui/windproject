<?php
    ini_set('session.cookie_httponly', 1);
    if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
        ini_set('session.cookie_secure', 1);
    }
    ini_set('session.cookie_samesite', 'Lax');
    session_start();
    require_once __DIR__ . '/vendor/autoload.php';
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
    require_once __DIR__ . '/app/helpers/helpers.php';
    require_once __DIR__ . '/config.php';
    require_once __DIR__ . '/app/core/Database.php';
    require_once __DIR__ . '/app/core/Controller.php';
    require_once __DIR__ . '/app/core/Router.php';
    require_once __DIR__ . '/app/helpers/mediaHelper.php';
    require_once __DIR__ . '/app/helpers/mailHelper.php';
    spl_autoload_register(function ($class) {
        $paths = ['app/controllers/', 'app/models/', 'app/core/'];
        foreach ($paths as $path) {
            $file = __DIR__ . '/' . $path . $class . '.php';
            if (file_exists($file)) {
                require_once $file;
                return;
            }
        }
    });
    if (!isset($_SESSION['user']) && isset($_COOKIE['remember_me'])) {
        $m = new Auth();
        $user = $m->checkRememberMe();
        if ($user) {
            $session_id = session_id();
            $_SESSION['session_id'] = $session_id;
            $_SESSION['user'] = [
                'id'   => $user['member_id'],
                'role' => $user['role']
            ];
            $m->updateLogin($user['member_id'], $_SESSION['timezone'] ?? null, $session_id);
            header("Refresh:0");
            exit;
        }
    }
    $router = new Router();
    $router->get('/', function() {
        if (!isset($_SESSION['user'])) {
            return (new AuthController())->login();
        }
        $role = $_SESSION['user']['role'] ?? '';
        if ($role === 'admin' || $role === 'administrator') {
            header("Location: " . BASE_URL . "/dashboard");
            exit;
        } else {
            header("Location: " . BASE_URL . "/home");
            exit;
        }
    });
    $router->get('/login', 'AuthController@login');
    $router->get('/reset-password', 'AuthController@reset');
    $router->get('/forgot-password', 'AuthController@forgot');
    $router->post('/api/auth', 'AuthController@doLogin');
    $router->post('/api/auth/forgot', 'AuthController@sendReset');
    $router->post('/api/auth/update-password', 'AuthController@updatePassword');
    if (isset($_SESSION['user'])) {
        $role = $_SESSION['user']['role'] ?? '';
        if ($role === 'admin' || $role === 'administrator') {
            $router->get('/dashboard', 'AdminController@index');
            $router->get('/member', 'AdminController@member');
            $router->get('/project', 'AdminController@project');
            $router->get('/map', 'AdminController@map');
            $router->get('/document', 'AdminController@document');
            $router->get('/wind', 'AdminController@wind');
            $router->get('/news', 'AdminController@news');
            $router->get('/setting', 'AdminController@setting');
            $router->get('/shortcut', 'AdminController@shortcut');
            $router->get('/master', 'AdminController@master');
            $router->post('/api/member/list', 'MemberController@list');
            $router->post('/api/dashboard/getStats', 'DashboardController@getStats');
            $router->get('/api/dashboard/loginHistory', 'DashboardController@loginHistory');
            $router->get('/api/dashboard/getWindChartData', 'DashboardController@getWindChartData');
            $router->post('/api/member/get', 'MemberController@get');
            $router->post('/api/member/save', 'MemberController@save');
            $router->post('/api/member/delete', 'MemberController@delete');
            $router->post('/api/member/check-email', 'MemberController@checkemail');
            $router->post('/api/member/check-username', 'MemberController@checkusername');
            $router->post('/api/member/filter', 'MemberController@filter');
            $router->post('/api/document/list', 'DocumentController@list');
            $router->post('/api/document/get', 'DocumentController@get');
            $router->post('/api/document/save', 'DocumentController@save');
            $router->post('/api/document/delete', 'DocumentController@delete');
            $router->post('/api/document/download_history', 'DocumentController@downloadHistory');
            $router->post('/api/wind/list', 'WindController@list');
            $router->post('/api/wind/import', 'WindController@import');
            $router->post('/api/wind/clear', 'WindController@clear');
            $router->post('/api/wind/history', 'WindController@history');
            $router->post('/api/wind/filter', 'WindController@filter');
            $router->post('/api/news/list', 'NewsController@list');
            $router->post('/api/news/save', 'NewsController@save');
            $router->post('/api/news/delete', 'NewsController@delete');
            $router->post('/api/news/filter', 'NewsController@filter');
            $router->post('/api/setting/saveInfo', 'SettingController@saveInfo');
            $router->post('/api/setting/saveLang', 'SettingController@saveLang');
            $router->post('/api/setting/saveShortcut', 'SettingController@saveShortcut');
            $router->post('/api/setting/saveBgImage', 'SettingController@saveBgImage');
            $router->post('/api/setting/saveConfig', 'SettingController@saveConfig');
            $router->post('/api/setting/saveNotification', 'SettingController@saveNotification');
            $router->post('/api/mapsetting/save', 'MapSettingController@save');
            $router->get('/api/mapsetting/load', 'MapSettingController@load');
            $router->post('/api/contracts/list', 'ContractsController@list');
            $router->post('/api/contracts/filter', 'ContractsController@filter');
            $router->post('/api/contracts/delete', 'ContractsController@delete');
            $router->post('/api/contracts/get', 'ContractsController@get');
            $router->post('/api/contracts/save', 'ContractsController@save');
            $router->post('/api/projects/list', 'ProjectsController@list');
            $router->post('/api/projects/filter', 'ProjectsController@filter');
            $router->post('/api/projects/delete', 'ProjectsController@delete');
            $router->post('/api/projects/get', 'ProjectsController@get');
            $router->post('/api/projects/save', 'ProjectsController@save');
            $router->post('/api/types/list', 'TypesController@list');
            $router->post('/api/types/filter', 'TypesController@filter');
            $router->post('/api/types/delete', 'TypesController@delete');
            $router->post('/api/types/get', 'TypesController@get');
            $router->post('/api/types/save', 'TypesController@save');
            $router->post('/api/poles/list', 'PolesController@list');
            $router->post('/api/poles/filter', 'PolesController@filter');
            $router->post('/api/poles/delete', 'PolesController@delete');
            $router->post('/api/poles/get', 'PolesController@get');
            $router->post('/api/poles/save', 'PolesController@save');
            $router->post('/api/poles/gets', 'PolesController@gets');
            $router->post('/api/poles/save-content', 'PolesController@saveContent');
            $router->post('/api/poles/delete-content', 'PolesController@deleteContent');
            $router->post('/api/installations/list', 'InstallationsController@list');
            $router->post('/api/installations/filter', 'InstallationsController@filter');
            $router->post('/api/installations/delete', 'InstallationsController@delete');
            $router->post('/api/installations/get', 'InstallationsController@get');
            $router->post('/api/installations/save', 'InstallationsController@save');
            $router->post('/api/project/save', 'ProjectController@save');
            $router->post('/api/project/data', 'ProjectController@data');
            $router->post('/api/project/delete', 'ProjectController@delete');
            $router->post('/api/project/gets', 'ProjectController@gets');
            $router->post('/api/project/filter', 'ProjectController@filter');
            $router->post('/api/project/save-content', 'ProjectController@saveContent');
            $router->post('/api/project/delete-content', 'ProjectController@deleteContent');
        } else {
            $router->get('/home', 'UserController@user');
            $router->get('/map', 'UserController@user');
            $router->get('/news', 'UserController@news');
            $router->get('/pole/{slug}', 'UserController@pole');
            $router->post('/api/document-list', 'UserController@documentList');
            $router->post('/api/document-download', 'UserController@documentDownload');
            $router->post('/api/document-download-history', 'UserController@documentDownloadHistory');
            $router->post('/api/new-list', 'UserController@newsList');
            $router->get('/project', 'UserController@project');
            $router->get('/document', 'UserController@document');
            $router->get('/download', 'UserController@download');
        }
    }
    $router->get('/logout', 'AuthController@logout');
    $router->get('/content/{mode}/{slug}', 'ContentController@content');
    $router->post('/api/content/getBySlug', 'ContentController@getBySlug');
    $router->post('/api/document/filter', 'DocumentController@filter');
    $router->post('/api/master', 'MapController@master');
    $router->post('/api/wind-area', 'MapController@windarea');
    $router->post('/api/poles-location', 'MapController@poleslocation');
    $router->post('/api/pole-details', 'MapController@poledetails');
    $router->post('/api/height', 'MapController@height');
    $router->post('/api/contracts', 'MapController@contracts');
    $router->post('/api/project', 'MapController@project');
    $router->post('/api/type', 'MapController@type');
    $router->post('/api/station', 'MapController@station');
    $router->post('/api/pole-stats', 'PoleController@polestats');
    $router->post('/api/pole-val', 'PoleController@poleval');
    $router->post('/api/pole-info', 'PoleController@info');
    $router->post('/api/setting/shortcut', 'SettingController@shortcut');
    $router->post('/api/member/updateLanguage', 'SettingController@updateLanguage');
    $router->post('/api/news/get', 'NewsController@get');
    $router->post('/api/notification/read', 'NotificationController@read');
    $router->post('/api/notification/load', 'NotificationController@load');
    $router->post('/api/notification/load-list', 'NotificationController@loadlist');
    $router->post('/api/push/subscribe', 'PushController@saveSubscription');
    $router->post('/api/push/unsubscribe', 'PushController@unsubscribe');
    $router->post('/api/setting/get', 'SettingController@get');
    $router->get('/api/setting/getPublicConfig', 'SettingController@getPublicConfig');
    $router->get('/account', 'AuthController@account');
    $router->post('/api/account/get', 'AccountControl@get');
    $router->post('/api/account/update', 'AccountControl@update');
    $router->post('/api/account/history', 'AccountControl@history');
    $router->post('/api/project/get', 'ProjectController@get');
    $currentRoute = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $basePath = dirname($_SERVER['SCRIPT_NAME']);
    $basePath = ($basePath === '/' || $basePath === '\\') ? '' : $basePath;
    $currentRoute = str_replace($basePath, '', $currentRoute);
    $GLOBALS['currentRoute'] = $currentRoute;
    $router->run();