<?php
    session_start();
    require_once __DIR__ . '/config.php';
    require_once __DIR__ . '/app/core/Database.php';
    require_once __DIR__ . '/app/core/Controller.php';
    require_once __DIR__ . '/app/core/Router.php';
    require_once __DIR__ . '/app/helpers/helpers.php';
    require_once __DIR__ . '/vendor/autoload.php';
    spl_autoload_register(function ($class) {
        $paths = [
            'app/controllers/',
            'app/models/',
            'app/core/',
        ];
        foreach ($paths as $path) {
            $file = __DIR__ . '/' . $path . $class . '.php';
            if (file_exists($file)) {
                require_once $file;
                return;
            }
        }
    });
    $router = new Router();
    if (empty($_SESSION)) {
        $router->get('/', 'AuthController@login');
        $router->get('/login', 'AuthController@login');
        $router->get('/forgot-password', 'AuthController@forgot');
        $router->post('/api/auth', 'AuthController@doLogin');
        $router->post('/api/auth/forgot', 'AuthController@sendReset');

    } else {
        if (isset($_SESSION['user']['role']) && ($_SESSION['user']['role'] === 'admin') || ($_SESSION['user']['role'] === 'administrator')) {
            $router->get('/', 'AdminController@index');
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
            $router->post('/api/project/list', 'ProjectController@list');
            $router->post('/api/project/get', 'ProjectController@get');
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
            $router->post('/api/mapsetting/save', 'MapSettingController@save');
            $router->get('/api/mapsetting/load', 'MapSettingController@load');
            $router->post('/api/contracts/list', 'ContractsController@list');
            $router->post('/api/contracts/filter', 'ContractsController@filter');
        } else {
            $router->get('/', 'UserController@user');
            $router->get('/map', 'UserController@user');
            $router->get('/pole/{slug}', 'UserController@pole');
            $router->post('/api/document-list', 'UserController@documentList');
            $router->post('/api/document-download', 'UserController@documentDownload');
            $router->post('/api/document-download-history', 'UserController@documentDownloadHistory');
            $router->get('/project', 'UserController@project');
            $router->get('/project?{slug}', 'UserController@projectDetail');
            $router->get('/document', 'UserController@document');
            $router->get('/download', 'UserController@download');
        }
    }
    $router->post('/api/document/filter', 'DocumentController@filter');
    $router->post('/api/wind-area', 'MapController@windarea');
    $router->post('/api/poles-location', 'MapController@poleslocation');
    $router->post('/api/pole-details', 'MapController@poledetails');
    $router->post('/api/height', 'MapController@height');
    $router->post('/api/project', 'MapController@project');
    $router->post('/api/type', 'MapController@type');
    $router->post('/api/station', 'MapController@station');
    $router->post('/api/pole-stats', 'PoleController@polestats');
    $router->post('/api/pole-val', 'PoleController@poleval');
    $router->post('/api/pole-info', 'PoleController@info');
    $router->post('/api/setting/shortcut', 'SettingController@shortcut');
    $router->post('/api/news/get', 'NewsController@get');
    $router->post('/api/notification/read', 'NotificationController@read');
    $router->post('/api/notification/load', 'NotificationController@load');
    $router->post('/api/notification/load-list', 'NotificationController@loadlist');
    $router->post('/api/setting/get', 'SettingController@get');
    $router->get('/account', 'AuthController@account');
    $router->get('/logout', 'AuthController@logout');
    $currentRoute = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $basePath = dirname($_SERVER['SCRIPT_NAME']);
    $basePath = ($basePath === '/') ? '' : $basePath;
    $currentRoute = str_replace($basePath, '', $currentRoute);
    $GLOBALS['currentRoute'] = $currentRoute;
    $router->run();