#!/usr/bin/php
<?php
    use Minishlink\WebPush\WebPush;
    use Minishlink\WebPush\Subscription;
    date_default_timezone_set('Asia/Bangkok');
    set_time_limit(0);
    $logPath = '/var/log/windproject-cron.log';
    if (!is_writable(dirname($logPath))) {
        $logPath = __DIR__ . '/cron_debug.log';
    }
    require_once __DIR__ . '/vendor/autoload.php';
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
    require_once __DIR__ . '/app/helpers/helpers.php';
    require_once __DIR__ . '/config.php';
    require_once __DIR__ . '/app/core/Database.php';
    require_once __DIR__ . '/app/helpers/mailHelper.php';
    file_put_contents($logPath, "[" . date('Y-m-d H:i:s') . "] Cron started\n", FILE_APPEND);
    try {
        $db = Database::getInstance()->pdo;
        $mailHelper = new MailHelper($db);
        $nowUTC = (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d H:i:s');
        if (class_exists('Minishlink\WebPush\WebPush')) {
            $vapid_keys = [
                'VAPID' => [
                    'subject'    => 'mailto:sv1.pstgwind.com',
                    'publicKey'  => $_ENV['VAPID_PUBLIC_KEY'] ?? 'BJyu1v7EXRhdUr1MnfK3sAjxitbj2wxpO5YZlQVbz1abX-fnNQwWU0-RHR791cmfoCg-6H7cuvGBa6ctsERVnho',
                    'privateKey' => $_ENV['VAPID_PRIVATE_KEY'] ?? 'zATIYMv5d222-QeBz34E7rDY_t4e5oU2QS9MW3rHP8M',
                ],
            ];
            $webPush = new WebPush($vapid_keys);
            $sqlPwa = "SELECT q.*, s.endpoint, s.p256dh, s.auth 
                       FROM pwa_notification_queue q 
                       JOIN push_subscriptions s ON q.subscription_id = s.id 
                       WHERE q.status = 'pending' AND q.scheduled_at <= :now 
                       LIMIT 50";
            $stmtPwa = $db->prepare($sqlPwa);
            $stmtPwa->execute(['now' => $nowUTC]);
            $pwaQueue = $stmtPwa->fetchAll();
            $endpointToQueueId = [];
            foreach ($pwaQueue as $row) {
                $db->prepare("UPDATE pwa_notification_queue SET status = 'processing' WHERE id = ?")->execute([$row['id']]);
                $subscription = Subscription::create([
                    'endpoint'  => $row['endpoint'],
                    'publicKey' => $row['p256dh'],
                    'authToken' => $row['auth'],
                ]);
                $webPush->queueNotification(
                    $subscription,
                    json_encode([
                        'title' => $row['title'],
                        'body'  => $row['message'] ?? '',
                        'url'   => $row['url'] ?? '/'
                    ])
                );
                $endpointToQueueId[$row['endpoint']] = $row['id'];
            }
            foreach ($webPush->flush() as $report) {
                $endpoint = $report->getEndpoint();
                $queueId = $endpointToQueueId[$endpoint] ?? null;
                if ($queueId) {
                    $status = $report->isSuccess() ? 'sent' : 'failed';
                    $error = $report->isSuccess() ? null : $report->getReason();
                    $db->prepare("UPDATE pwa_notification_queue SET status = ?, error_message = ?, sent_at = :now WHERE id = ?")
                       ->execute([$status, $error, $queueId, 'now' => $nowUTC]);
                }
            }
        }
        $sqlEmail = "SELECT * FROM email_queue WHERE status = 'pending' AND scheduled_at <= :now LIMIT 20";
        $stmtEmail = $db->prepare($sqlEmail);
        $stmtEmail->execute(['now' => $nowUTC]);
        $emailQueue = $stmtEmail->fetchAll();
        foreach ($emailQueue as $mail) {
            $db->prepare("UPDATE email_queue SET status = 'processing' WHERE id = ?")->execute([$mail['id']]);
            $sent = $mailHelper->sendQueueMail(
                $mail['recipient_email'], 
                $mail['subject'], 
                $mail['body']
            ); 
            if ($sent) {
                $db->prepare("UPDATE email_queue SET status = 'sent', sent_at = :now WHERE id = ?")
                   ->execute(['now' => $nowUTC, $mail['id']]);
            } else {
                $db->prepare("UPDATE email_queue SET status = 'failed' WHERE id = ?")->execute([$mail['id']]);
            }
        }
        file_put_contents($logPath, "[" . date('Y-m-d H:i:s') . "] Cron finished successfully\n", FILE_APPEND);
    } catch (Exception $e) {
        $msg = "[" . date('Y-m-d H:i:s') . "] Cron Worker Error: " . $e->getMessage() . "\n";
        file_put_contents($logPath, $msg, FILE_APPEND);
        error_log($msg);
    }