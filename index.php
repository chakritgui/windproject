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
    require_once __DIR__ . '/app/helpers/userAgent.php';
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
        $authData = $m->checkRememberMe(); 
        if ($authData) {
            session_regenerate_id(true);
            $user = $authData['user'];
            $session_id = session_id();
            $_SESSION['session_id'] = $session_id;
            $_SESSION['user'] = [
                'id'           => $user['member_id'],
                'role'         => $user['role'],
                'privileges'   => $user['privileges_id'],
                'allowedPaths' => $authData['allowedPaths']
            ];
            $m->updateLogin($user['member_id'], $_SESSION['timezone'] ?? null, $session_id);
            header("Location: " . $_SERVER['REQUEST_URI']);
            exit;
        } else {
            setcookie('remember_me', '', time() - 3600, '/', '', true, true);
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
    $router->post('/api/auth.forgot', 'AuthController@sendReset');
    $router->post('/api/auth.update', 'AuthController@updatePassword');
    $router->post('/api/timezone.update', 'AuthController@updateTimeZone');
    $router->post('/api/request.save', 'AuthController@saveRequest');
    $router->post('/api/auth.request', 'AuthController@getLatestPendingRequest');
    if (isset($_SESSION['user'])) {
        $role = $_SESSION['user']['role'] ?? '';
        if ($role === 'admin' || $role === 'administrator') {
            $router->get('/dashboard', 'AdminController@index');
            $router->get('/member', 'AdminController@member');
            $router->get('/project/(.*)', 'AdminController@project');
            $router->get('/project', 'AdminController@project');
            $router->get('/map', 'AdminController@map');
            $router->get('/wind', 'AdminController@wind');
            $router->get('/news', 'AdminController@news');
            $router->get('/setting', 'AdminController@setting');
            $router->get('/wind-report', 'AdminController@windreport');
            $router->get('/install-app', 'AdminController@installapp');
            $router->get('/master', 'AdminController@master');
            $router->post('/api/dashboard.stats', 'DashboardController@getStats');
            $router->get('/api/dashboard.usage', 'DashboardController@loginHistory');
            $router->get('/api/dashboard.chart', 'DashboardController@getWindChartData');
            $router->post('/api/member.list', 'MemberController@list');
            $router->post('/api/member.list', 'MemberController@list');
            $router->post('/api/history.list', 'MemberController@history');
            $router->post('/api/member.save', 'MemberController@save');
            $router->post('/api/member.get', 'MemberController@get');
            $router->post('/api/member.delete', 'MemberController@delete');
            $router->post('/api/member.exitsmail', 'MemberController@checkemail');
            $router->post('/api/member.exitsuser', 'MemberController@checkusername');
            $router->post('/api/member.filter', 'MemberController@filter');
            $router->post('/api/request.list', 'MemberController@request');
            $router->post('/api/member.reject', 'MemberController@reject');
            $router->post('/api/member.approved', 'MemberController@approved');
            $router->post('/api/privileges.list', 'MemberController@listPrivileges');
            $router->post('/api/privileges.delete', 'MemberController@deletePrivileges');
            $router->post('/api/privileges.get', 'MemberController@getPrivileges');
            $router->post('/api/privileges.save', 'MemberController@savePrivileges');
            $router->post('/api/privileges.config', 'MemberController@configPrivileges');
            $router->post('/api/config.menu', 'MemberController@menuPrivileges');
            $router->post('/api/member.update_permissions', 'MemberController@update_permissions');
            $router->post('/api/document.list', 'DocumentController@list');
            $router->post('/api/document.info', 'DocumentController@get');
            $router->post('/api/document.save', 'DocumentController@save');
            $router->post('/api/document.delete', 'DocumentController@delete');
            $router->post('/api/document.history', 'DocumentController@documentHistory');
            $router->post('/api/download.history', 'DocumentController@downloadHistory');
            $router->post('/api/wind.list', 'WindController@list');
            $router->post('/api/wind.import', 'WindController@import');
            $router->post('/api/wind.clear', 'WindController@clear');
            $router->post('/api/wind.history', 'WindController@history');
            $router->post('/api/wind.filter', 'WindController@filter');
            $router->post('/api/news.list', 'NewsController@list');
            $router->post('/api/news.save', 'NewsController@save');
            $router->post('/api/news.delete', 'NewsController@delete');
            $router->post('/api/news.filter', 'NewsController@filter');
            $router->post('/api/news.unlink', 'NewsController@unlink');
            $router->post('/api/settings.info', 'SettingController@saveInfo');
            $router->post('/api/settings.lang', 'SettingController@saveLang');
            $router->post('/api/settings.shortcut', 'SettingController@saveShortcut');
            $router->post('/api/settings.bg', 'SettingController@saveBgImage');
            $router->post('/api/settings.config', 'SettingController@saveConfig');
            $router->post('/api/settings.notification', 'SettingController@saveNotification');
            $router->post('/api/settings.password', 'SettingController@savePassword');
            $router->post('/api/settings.disclaimer', 'SettingController@saveDisclaimerSetting');
            $router->post('/api/disclaimer.list', 'SettingController@listDisclaimer');
            $router->post('/api/disclaimer.info', 'SettingController@infoDisclaimer');
            $router->post('/api/disclaimer.save', 'SettingController@saveDisclaimer');
            $router->post('/api/disclaimer.delete', 'SettingController@deleteDisclaimer');
            $router->post('/api/map.save', 'MapSettingController@save');
            $router->get('/api/map.load', 'MapSettingController@load');
            $router->post('/api/settings.menu', 'SettingController@menu');
            $router->post('/api/settings.save_single_menu', 'SettingController@saveSingleMenu');
            $router->post('/api/settings.update_order', 'SettingController@updateOrder');
            $router->post('/api/settings.delete_menu', 'SettingController@deleteMenu');
            $router->post('/api/settings.save_menu_order', 'SettingController@updateOrder');
            $router->post('/api/contracts.list', 'ContractsController@list');
            $router->post('/api/contracts.filter', 'ContractsController@filter');
            $router->post('/api/contracts.delete', 'ContractsController@delete');
            $router->post('/api/contracts.get', 'ContractsController@get');
            $router->post('/api/contracts.save', 'ContractsController@save');
            $router->post('/api/group.list', 'GroupController@list');
            $router->post('/api/group.delete', 'GroupController@delete');
            $router->post('/api/group.get', 'GroupController@get');
            $router->post('/api/group.save', 'GroupController@save');
            $router->post('/api/level.list', 'LevelController@list');
            $router->post('/api/level.delete', 'LevelController@delete');
            $router->post('/api/level.info', 'LevelController@get');
            $router->post('/api/level.save', 'LevelController@save');
            $router->post('/api/project.status.list', 'StatusController@list');
            $router->post('/api/project.status.delete', 'StatusController@delete');
            $router->post('/api/project.status.get', 'StatusController@get');
            $router->post('/api/project.status.save', 'StatusController@save');
            $router->post('/api/projects.list', 'ProjectsController@list');
            $router->post('/api/projects.filter', 'ProjectsController@filter');
            $router->post('/api/projects.delete', 'ProjectsController@delete');
            $router->post('/api/projects.deletebg', 'ProjectsController@deleteBg');
            $router->post('/api/projects.get', 'ProjectsController@get');
            $router->post('/api/projects.save', 'ProjectsController@save');
            $router->post('/api/projects/background', 'ProjectsController@background');
            $router->post('/api/projects.savebg', 'ProjectsController@saveBg');
            $router->post('/api/types.list', 'TypesController@list');
            $router->post('/api/types.filter', 'TypesController@filter');
            $router->post('/api/types.delete', 'TypesController@delete');
            $router->post('/api/types.get', 'TypesController@get');
            $router->post('/api/types.save', 'TypesController@save');
            $router->post('/api/poles.list', 'PolesController@list');
            $router->post('/api/poles.filter', 'PolesController@filter');
            $router->post('/api/poles.delete', 'PolesController@delete');
            $router->post('/api/poles.get', 'PolesController@get');
            $router->post('/api/poles.save', 'PolesController@save');
            $router->post('/api/poles.gets', 'PolesController@gets');
            $router->post('/api/poles.savecontent', 'PolesController@saveContent');
            $router->post('/api/poles.deletecontent', 'PolesController@deleteContent');
            $router->post('/api/installations.list', 'InstallationsController@list');
            $router->post('/api/installations.filter', 'InstallationsController@filter');
            $router->post('/api/installations.delete', 'InstallationsController@delete');
            $router->post('/api/installations.get', 'InstallationsController@get');
            $router->post('/api/installations.save', 'InstallationsController@save');
            $router->post('/api/project.save', 'ProjectController@save');
            $router->post('/api/project.info', 'ProjectController@data');
            $router->post('/api/project.delete', 'ProjectController@delete');
            $router->post('/api/project.get', 'ProjectController@get');
            $router->post('/api/project.gets', 'ProjectController@gets');
            $router->post('/api/project.filter', 'ProjectController@filter');
            $router->post('/api/project.content.save', 'ProjectController@saveContent');
            $router->post('/api/project.content.delete', 'ProjectController@deleteContent');
            $router->post('/api/project.unlink', 'ProjectController@unlink');
            $router->post('/api/project.sort', 'ProjectController@sort');
            $router->post('/api/windturbind.list', 'WindturbindController@list');
            $router->post('/api/windturbind.filter', 'WindturbindController@filter');
            $router->post('/api/windturbind.delete', 'WindturbindController@delete');
            $router->post('/api/windturbind.import', 'WindturbindController@import');
            $router->post('/api/windturbind.updateStatus', 'WindturbindController@updateStatus');
            $router->post('/api/windturbind.clear', 'WindturbindController@clear');
        } else {
            $router->get('/disclaimer', 'UserController@disclaimer');
            $router->post('/api/accept-disclaimer', 'UserController@acceptDisclaimer');
            $router->get('/home', 'UserController@user');
            $router->get('/news', 'UserController@news');
            $router->get('/pstg', 'UserController@project');
            $router->get('/pstg/(.*)', 'UserController@project');
            $router->get('/wind-report', 'UserController@windreport');
            $router->get('/install-app', 'UserController@installapp');
            $router->get('/pole/{slug}', 'UserController@pole');
            $router->post('/api/document.get', 'UserController@documentList');
            $router->post('/api/document.download', 'UserController@documentDownload');
            $router->post('/api/document.history', 'UserController@documentDownloadHistory');
            $router->post('/api/news.load', 'UserController@newsList');
            $router->post('/api/project.info', 'UserController@info');
            $router->post('/api/master', 'MapController@master');
            $router->post('/api/wind.boundary', 'MapController@windarea');
            $router->post('/api/poles.get', 'MapController@poleslocation');
            $router->post('/api/poles.info', 'MapController@poledetails');
            $router->post('/api/level.get', 'MapController@height');
            $router->post('/api/project.get', 'MapController@project');
            $router->post('/api/type.get', 'MapController@type');
            $router->post('/api/installations.get', 'MapController@station');
            $router->post('/api/poles.stats', 'PoleController@polestats');
            $router->post('/api/poles.val', 'PoleController@poleval');
            $router->post('/api/heght.level', 'PoleController@level');
            $router->post('/api/poles.infos', 'PoleController@info');
            $router->post('/api/project.poles', 'PoleController@polesList');
        }
    }
    $router->post('/api/menu.load', 'MenuController@load');
    $router->get('/logout', 'AuthController@logout');
    $router->post('/api/content.slug', 'ContentController@getBySlug');
    $router->post('/api/document.filter', 'DocumentController@filter');
    $router->post('/api/shortcut.get', 'SettingController@shortcut');
    $router->post('/api/member.lang', 'SettingController@updateLanguage');
    $router->post('/api/member.permission', 'MemberController@permission');
    $router->post('/api/news.get', 'NewsController@get');
    $router->post('/api/notification.read', 'NotificationController@read');
    $router->post('/api/notification.load', 'NotificationController@load');
    $router->post('/api/notification.get', 'NotificationController@loadlist');
    $router->post('/api/push.subscribe', 'PushController@saveSubscription');
    $router->post('/api/push.unsubscribe', 'PushController@unsubscribe');
    $router->post('/api/settings.get', 'SettingController@get');
    $router->get('/api/configs.get', 'SettingController@getPublicConfig');
    $router->get('/account', 'AuthController@account');
    $router->post('/api/account.get', 'AccountControl@get');
    $router->post('/api/account.update', 'AccountControl@update');
    $router->post('/api/account.usage', 'AccountControl@history');
    $currentRoute = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $basePath = dirname($_SERVER['SCRIPT_NAME']);
    $basePath = ($basePath === '/' || $basePath === '\\') ? '' : $basePath;
    $currentRoute = str_replace($basePath, '', $currentRoute);
    $GLOBALS['currentRoute'] = $currentRoute;
    $router->run();