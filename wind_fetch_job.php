#!/usr/bin/php
<?php
    date_default_timezone_set('Asia/Bangkok');
    set_time_limit(0);
    $baseDir = __DIR__;
    require_once $baseDir . '/vendor/autoload.php';
    if (file_exists($baseDir . '/.env')) {
        $dotenv = Dotenv\Dotenv::createImmutable($baseDir);
        $dotenv->load();
    }
    require_once $baseDir . '/app/helpers/helpers.php';
    require_once $baseDir . '/config.php';
    require_once $baseDir . '/app/core/Database.php';
    require_once $baseDir . '/app/helpers/fetchWindSpeed.php';
    $LOCK_FILE = sys_get_temp_dir() . '/cron_wind.lock';
    $LOG_FILE  = sys_get_temp_dir() . '/cron_wind.log';
    function logMsg($msg) {
        global $LOG_FILE;
        $line = "[" . date('Y-m-d H:i:s') . "] " . $msg . PHP_EOL;
        echo $line;
        file_put_contents($LOG_FILE, $line, FILE_APPEND);
    }
    register_shutdown_function(function() use ($LOCK_FILE) {
        if (file_exists($LOCK_FILE)) {
            unlink($LOCK_FILE);
        }
    });
    if (file_exists($LOCK_FILE)) {
        $lastRun = filemtime($LOCK_FILE);
        if ((time() - $lastRun) < 300) {
            logMsg("Another process is running (Started at: " . date('H:i:s', $lastRun) . "). Exit.");
            exit;
        }
    }
    file_put_contents($LOCK_FILE, time());
    logMsg("Cron Job Started...");
    try {
        $db = Database::getInstance()->pdo;
        $fetchWindSpeed = new fetchWindSpeed($db); 
        $points = $fetchWindSpeed->getPoints();
        if (empty($points)) {
            logMsg("No points found to process.");
            exit;
        }
        logMsg("Total points to process: " . count($points));
        $BATCH_SIZE = 20;
        $SLEEP_MS   = 500;
        for ($i = 0; $i < count($points); $i += $BATCH_SIZE) {
            $batch = array_slice($points, $i, $BATCH_SIZE);  
            try {
                $db->beginTransaction();     
                $result = $fetchWindSpeed->processBatch($batch);
                if (!empty($result)) {
                    $fetchWindSpeed->saveBatch($result);
                    $db->commit();
                    logMsg("Batch " . (floor($i / $BATCH_SIZE) + 1) . " success (" . count($result) . " points)");
                } else {
                    $db->rollBack();
                    logMsg("Batch " . (floor($i / $BATCH_SIZE) + 1) . " skipped: No data returned from API");
                }
            } catch (\Exception $e) {
                if ($db->inTransaction()) {
                    $db->rollBack();
                }
                logMsg("Batch Error (Index $i): " . $e->getMessage());
            }
            usleep($SLEEP_MS * 1000);
        }
        logMsg("Cron Job Completed Successfully.");
    } catch (\Exception $e) {
        logMsg("Fatal Error: " . $e->getMessage());
    }