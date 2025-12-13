<?php
class Router {
    private $routes = ['GET'=>[], 'POST'=>[]];
    public function get($path, $handler) {
        $this->routes['GET'][$this->normalize($path)] = $handler;
    }
    public function post($path, $handler) {
        $this->routes['POST'][$this->normalize($path)] = $handler;
    }
    private function normalize($path) {
        if ($path === '') return '/';
        return rtrim($path, '/');
    }
    public function run() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path   = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $base = parse_url(BASE_URL, PHP_URL_PATH);
        if ($base && strpos($path, $base) === 0) {
            $path = substr($path, strlen($base));
        }
        $path = $this->normalize($path);
        foreach ($this->routes[$method] as $route => $handler) {
            $pattern = preg_replace('/\{(\w+)\}/', '([^\/]+)', $route);
            $pattern = '#^' . $pattern . '$#u';
            if (preg_match($pattern, $path, $matches)) {
                array_shift($matches); 
                list($controller, $action) = explode('@', $handler);
                if (class_exists($controller)) {
                    $c = new $controller();
                    if (method_exists($c, $action)) {
                        return call_user_func_array([$c, $action], $matches);
                    }
                }
            }
        }
        http_response_code(404);
        header("Location: " . BASE_URL . "/");
        exit;
    }
}