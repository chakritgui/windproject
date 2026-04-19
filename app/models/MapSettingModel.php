<?php
class MapSettingModel {
    private PDO $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function saveMapData($payload) {
        try {
            $this->db->beginTransaction();
            $mapId = 1;
            $DEFAULT_LEVEL = $payload['map_settings']['DEFAULT_LEVEL'] ?? '100m';
            $sql = "INSERT INTO system_settings (setting_key, setting_value, updated_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()";
            $stmt = $this->db->prepare($sql);
            $stmt->execute(['DEFAULT_LEVEL', $DEFAULT_LEVEL]);
            $modeSettings = $payload['map_settings']['mode_settings'] ?? null;
            $sqlMaster = "REPLACE INTO wp_map_master (
                            map_name, map_id, center_lat, center_lng, zoom_level, 
                            default_style, polygon_visibility, show_country_line, 
                            map_labels, country_layers_data, mode_settings, 
                            created_at, updated_at
                        ) VALUES (
                            1, 1, :lat, :lng, :zoom, 
                            :style, :polygon_visibility, :show_country_line, 
                            :map_labels, :country_layers_data, :mode_settings, 
                            NOW(), NOW()
                        )";
            $stmt = $this->db->prepare($sqlMaster);
            $defaultStyle = is_string($payload['map_settings']['default_style']) ? $payload['map_settings']['default_style'] : json_encode($payload['map_settings']['default_style']);
            $stmt->execute([
                ':lat'                  => $payload['map_settings']['center_lat'],
                ':lng'                  => $payload['map_settings']['center_lng'],
                ':zoom'                 => $payload['map_settings']['zoom_level'],
                ':style'                => $defaultStyle,
                ':polygon_visibility'   => $payload['map_settings']['polygon_visibility'],
                ':show_country_line'    => $payload['map_settings']['show_country_line'],
                ':map_labels'           => $payload['map_settings']['map_labels'] ?? 'no',
                ':country_layers_data'  => $payload['map_settings']['country_layers_data'],
                ':mode_settings'        => $modeSettings
            ]);
            $sqlClear = "UPDATE wp_map_polygons SET status = 'deleted', updated_at = NOW() WHERE map_id = ?";
            $this->db->prepare($sqlClear)->execute([$mapId]);
            if (!empty($payload['polygons'])) {
                $stmtFind = $this->db->prepare("SELECT project_id FROM wp_project WHERE project_name = ? LIMIT 1");
                $stmtInsertProj = $this->db->prepare("INSERT INTO wp_project (project_name, created_at, updated_at) VALUES (?, NOW(), NOW())");
                $sqlPoly = "INSERT INTO wp_map_polygons (map_id, project_id, area_name, custom_style, geo_data, status, created_at, updated_at) 
                            VALUES (:map_id, :project_id, :name, :style, :geo, 'active', NOW(), NOW())
                            ON DUPLICATE KEY UPDATE 
                            project_id = VALUES(project_id),
                            custom_style = VALUES(custom_style), 
                            geo_data = VALUES(geo_data),
                            status = 'active',
                            updated_at = NOW()";
                $stmtPoly = $this->db->prepare($sqlPoly);
                foreach ($payload['polygons'] as $poly) {
                    $projectId = null;
                    $areaName = trim($poly['area_name']);
                    if (!empty($poly['project_id'])) {
                        $projectId = $poly['project_id'];
                    } elseif (!empty($areaName)) {
                        $stmtFind->execute([$areaName]);
                        $project = $stmtFind->fetch(PDO::FETCH_ASSOC);
                        if ($project) {
                            $projectId = $project['project_id'];
                        } else {
                            $stmtInsertProj->execute([$areaName]);
                            $projectId = $this->db->lastInsertId();
                        }
                    }
                    $styleData = is_string($poly['custom_style']) ? $poly['custom_style'] : json_encode($poly['custom_style']);
                    $geoData = is_string($poly['geo_data']) ? $poly['geo_data'] : json_encode($poly['geo_data']);
                    $stmtPoly->execute([
                        ':map_id'     => $mapId,
                        ':project_id' => $projectId,
                        ':name'       => $areaName, 
                        ':style'      => $styleData, 
                        ':geo'        => $geoData 
                    ]);
                }
            }
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            return $e->getMessage(); 
        }
    }
    public function getMapData($mapId = 1) {
        try {
            $stmt = $this->db->prepare("SELECT * FROM wp_map_master WHERE map_id = ?");
            $stmt->execute([$mapId]);
            $master = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$master) return null;
            $stmt = $this->db->prepare("SELECT 
                    m.*, 
                    p.project_id, 
                    p.project_name 
                FROM wp_map_polygons m 
                LEFT JOIN wp_project p 
                    ON p.project_id = m.project_id 
                WHERE m.map_id = ? 
                AND m.status = 'active'
                GROUP BY m.poly_id
                ORDER BY 
                    CASE 
                        WHEN m.project_id IS NULL OR m.project_id = '' THEN 0
                        ELSE 1
                    END ASC,
                    CASE 
                        WHEN m.project_id IS NULL OR m.project_id = '' 
                        THEN m.poly_id
                    END ASC,
                    CASE 
                        WHEN m.project_id IS NOT NULL AND m.project_id != '' 
                        THEN IFNULL(p.item_order, p.project_id)
                    END ASC
            ");
            $stmt->execute([$mapId]);
            $polygons = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $stmtLevel = $this->db->prepare("SELECT setting_value FROM system_settings WHERE setting_key = ?");
            $stmtLevel->execute(['DEFAULT_LEVEL']);
            $row = $stmtLevel->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                $DEFAULT_LEVEL = $row['setting_value'];
            } else {
                $DEFAULT_LEVEL = '100m';
            }
            return [
                'map_settings' => $master,
                'polygons' => $polygons,
                'DEFAULT_LEVEL' => $DEFAULT_LEVEL
            ];
        } catch (Exception $e) {
            error_log($e->getMessage());
            return null;
        }
    }
}