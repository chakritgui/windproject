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
        $path = ($path === '' || $path === '/') ? '/' : rtrim($path, '/');
        return $path;
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

                // --- ส่วนที่แก้ไข: เพิ่มการเช็คว่าเป็น Closure หรือไม่ ---
                if (is_callable($handler)) {
                    // ถ้าเป็น function() { ... } ให้รันทันที
                    return call_user_func_array($handler, $matches);
                } 
                
                if (is_string($handler) && strpos($handler, '@') !== false) {
                    // ถ้าเป็น "Controller@Action" ให้แยกชื่อแล้วรันตามปกติ
                    list($controller, $action) = explode('@', $handler);
                    if (class_exists($controller)) {
                        $c = new $controller();
                        if (method_exists($c, $action)) {
                            return call_user_func_array([$c, $action], $matches);
                        }
                    }
                }
                // ----------------------------------------------
            }
        }

        http_response_code(404);
        header("Location: " . BASE_URL . "/");
        exit;
    }
}