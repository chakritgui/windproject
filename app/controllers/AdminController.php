<?php
    class AdminController extends Controller {
        private $db;
        public function __construct(){ 
            $this->db = Database::getInstance()->pdo;
        }
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
        public function project($slugPath = '') {
            ensure_login();
            if (empty($slugPath)) {
                $fullUri = $_SERVER['REQUEST_URI'];
                $firstProjectPos = strpos($fullUri, '/project/');
                if ($firstProjectPos !== false) {
                    $remainingPath = substr($fullUri, $firstProjectPos + strlen('/project/'));
                    $slugPath = $remainingPath;
                }
            }
            $slugs = array_values(array_filter(explode('/', $slugPath)));
            $currentFolderId = null;
            $currentLevel = 1;
            $initialPath = [['id' => null, 'name' => 'PSTG PROJECT', 'level' => 1, 'slug' => '']];
            if (!empty($slugs)) {
                $parentId = null;
                foreach ($slugs as $slug) {
                    $sql = "SELECT id, name, level, slug FROM wp_folder WHERE slug = :slug AND parent_id <=> :pid LIMIT 1";
                    $stmt = $this->db->prepare($sql);
                    $stmt->execute([':slug' => $slug, ':pid' => $parentId]);
                    $folder = $stmt->fetch(PDO::FETCH_ASSOC);
                    if ($folder) {
                        $parentId = $folder['id'];
                        $currentFolderId = (int)$folder['id'];
                        $currentLevel = (int)$folder['level'] + 1;
                        $initialPath[] = [
                            'id' => (int)$folder['id'],
                            'name' => $folder['name'],
                            'level' => (int)$folder['level'],
                            'slug' => $folder['slug']
                        ];
                    } else {
                        break;
                    }
                }
            }
            $this->view('admin/project', [
                'currentFolderId' => $currentFolderId,
                'currentLevel' => $currentLevel,
                'initialPath' => $initialPath
            ]);
        }
        public function map() {
            ensure_login();
            if (!is_admin()) { 
                $this->redirect('login');
            }
            $this->view('admin/map');
        }
        public function windreport() {
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
        public function installapp() {
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