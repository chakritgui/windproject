<?php
    session_start();
    require_once __DIR__ . '/config.php';
    require_once __DIR__ . '/app/core/Database.php';
    require_once __DIR__ . '/app/core/Controller.php';
    require_once __DIR__ . '/app/core/Router.php';
    require_once __DIR__ . '/app/helpers/auth_helper.php';
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
        if (isset($_SESSION['user']['role']) && $_SESSION['user']['role'] === 'admin') {
            $router->get('/', 'AdminController@index');
            $router->get('/member', 'AdminController@member');
            $router->get('/project', 'AdminController@project');
            $router->get('/news', 'AdminController@news');
            $router->get('/map', 'AdminController@map');
            $router->get('/document', 'AdminController@document');
            $router->get('/import', 'AdminController@import');
            $router->get('/notification', 'AdminController@notification');
            $router->get('/setting', 'AdminController@setting');
            $router->get('/shortcut', 'AdminController@shortcut');
            $router->post('/api/member/list', 'MemberController@list');
            $router->post('/api/member/get', 'MemberController@get');
            $router->post('/api/document/list', 'DocumentController@list');
            $router->post('/api/document/get', 'DocumentController@get');
            $router->post('/api/news/list', 'NewsController@list');
            $router->post('/api/news/get', 'NewsController@get');
            $router->post('/api/wind/list', 'WindController@list');
            $router->post('/api/notification/list', 'NotificationController@list');
            $router->post('/api/notification/get', 'NotificationController@get');
        } else {
            $router->get('/', 'UserController@user');
            $router->get('/map', 'UserController@user');
            $router->get('/pole/{slug}', 'UserController@pole');
            $router->get('/news', 'UserController@news');
            $router->get('/news/{slug}', 'UserController@newsDetail');
            $router->get('/document', 'UserController@document');
            $router->get('/download', 'UserController@download');
        }
    }
    $router->get('/account', 'AuthController@account');
    $router->get('/logout', 'AuthController@logout');
    $currentRoute = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $basePath = dirname($_SERVER['SCRIPT_NAME']);
    $basePath = ($basePath === '/') ? '' : $basePath;
    $currentRoute = str_replace($basePath, '', $currentRoute);
    $GLOBALS['currentRoute'] = $currentRoute;
    $router->run();