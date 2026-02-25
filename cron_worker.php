#!/usr/bin/php
<?php
    use Minishlink\WebPush\WebPush;
    use Minishlink\WebPush\Subscription;
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
    require_once $baseDir . '/app/helpers/mailHelper.php';
    echo "[" . date('Y-m-d H:i:s') . "] Cron Job Started...\n";
    try {
        $db = Database::getInstance()->pdo;
        $mailHelper = new MailHelper($db);
        $nowUTC = (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d H:i:s');
        if (class_exists('Minishlink\WebPush\WebPush')) {
            $vapid_keys = [
                'VAPID' => [
                    'subject' => 'mailto:admin@pstgwind.com',
                    'publicKey'  => 'BJyu1v7EXRhdUr1MnfK3sAjxitbj2wxpO5YZlQVbz1abX-fnNQwWU0-RHR791cmfoCg-6H7cuvGBa6ctsERVnho',
                    'privateKey' => 'zATIYMv5d222-QeBz34E7rDY_t4e5oU2QS9MW3rHP8M',
                ],
            ];
            $webPush = new WebPush($vapid_keys);
            $sqlPwa = "SELECT q.*, s.endpoint, s.p256dh, s.auth 
                       FROM pwa_notification_queue q 
                       JOIN push_subscriptions s ON q.subscription_id = s.id 
                       WHERE q.status = 'pending' AND q.scheduled_at <= :now 
                       LIMIT 50";
            $stmtPwa = $db->prepare($sqlPwa);
            $stmtPwa->execute([':now' => $nowUTC]);
            $pwaQueue = $stmtPwa->fetchAll();
            if (count($pwaQueue) > 0) {
                echo "Found " . count($pwaQueue) . " PWA items.\n";
                $endpointToQueueId = [];
                foreach ($pwaQueue as $row) {
                    $db->prepare("UPDATE pwa_notification_queue SET status = 'processing' WHERE id = ?")
                       ->execute([$row['id']]);
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
                        $db->prepare("UPDATE pwa_notification_queue SET status = :status, error_message = :err, sent_at = :sentat WHERE id = :id")
                           ->execute([
                                ':status' => $status,
                                ':err'    => $error,
                                ':sentat' => $nowUTC,
                                ':id'     => $queueId
                            ]);
                        echo "PWA ID $queueId: $status\n";
                    }
                }
            }
        }
        $sqlEmail = "SELECT * FROM email_queue WHERE status = 'pending' AND scheduled_at <= :now LIMIT 20";
        $stmtEmail = $db->prepare($sqlEmail);
        $stmtEmail->execute([':now' => $nowUTC]);
        $emailQueue = $stmtEmail->fetchAll();
        if (count($emailQueue) > 0) {
            echo "Found " . count($emailQueue) . " emails.\n";
            foreach ($emailQueue as $mail) {
                $db->prepare("UPDATE email_queue SET status = 'processing' WHERE id = ?")->execute([$mail['id']]);
                $sent = $mailHelper->sendQueueMail($mail['recipient_email'], $mail['subject'], $mail['body']); 
                if ($sent) {
                    $db->prepare("UPDATE email_queue SET status = 'sent', sent_at = :sentat WHERE id = :id")
                       ->execute([':sentat' => $nowUTC, ':id' => $mail['id']]);
                    echo "Email ID " . $mail['id'] . ": sent\n";
                } else {
                    $db->prepare("UPDATE email_queue SET status = 'failed' WHERE id = ?")->execute([$mail['id']]);
                    echo "Email ID " . $mail['id'] . ": failed\n";
                }
            }
        }
    } catch (Exception $e) {
        echo "ERROR: " . $e->getMessage() . "\n";
    }