<?php
    function ensure_login() {
        if (empty($_SESSION['user'])) {
            header('Location: /login');
            exit;
        }
    }
    function is_admin() {
        return !empty($_SESSION['user']) && ($_SESSION['user']['role'] === 'admin' || $_SESSION['user']['role'] === 'administrator');
    }