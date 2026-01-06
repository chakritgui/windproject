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
        public function import() {
            ensure_login();
            if (!is_admin()) { 
                $this->redirect('login');
            }
            $this->view('admin/import');
        }
        public function notification() {
            ensure_login();
            if (!is_admin()) { 
                $this->redirect('login');
            }
            $this->view('admin/notification');
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
    }