<?php
    class AdminController extends Controller {
        public function index() {
            ensure_login();
            if (!is_admin()) { 
                $this->redirect('login');
            }
            $this->view('admin/dashboard');
        }
        public function member() {
            ensure_login();
            if (!is_admin()) { 
                $this->redirect('login');
            }
            $this->view('admin/member');
        }
        public function project() {
            ensure_login();
            if (!is_admin()) { 
                $this->redirect('login');
            }
            $this->view('admin/project');
        }
        public function map() {
            ensure_login();
            if (!is_admin()) { 
                $this->redirect('login');
            }
            $this->view('admin/map');
        }
        public function document() {
            ensure_login();
            if (!is_admin()) { 
                $this->redirect('login');
            }
            $this->view('admin/document');
        }
        public function wind() {
            ensure_login();
            if (!is_admin()) { 
                $this->redirect('login');
            }
            $this->view('admin/wind');
        }
        public function news() {
            ensure_login();
            if (!is_admin()) { 
                $this->redirect('login');
            }
            $this->view('admin/news');
        }
        public function setting() {
            ensure_login();
            if (!is_admin()) { 
                $this->redirect('login');
            }
            $this->view('admin/setting');
        }
        public function shortcut() {
            ensure_login();
            if (!is_admin()) { 
                $this->redirect('login');
            }
            $this->view('admin/shortcut');
        }                               
        public function master() {
            ensure_login();
            if (!is_admin()) { 
                $this->redirect('login');
            }
            $this->view('admin/master');
        }                               
    }