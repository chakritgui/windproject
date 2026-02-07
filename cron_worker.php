#!/usr/bin/php
<?php
    use Minishlink\WebPush\WebPush;
    use Minishlink\WebPush\Subscription;
    date_default_timezone_set('Asia/Bangkok');
    set_time_limit(0);
    file_put_contents(
        '/var/log/windproject-cron.log',
        "[" . date('Y-m-d H:i:s') . "] cron run\n",
        FILE_APPEND
    );
    require_once __DIR__ . '/vendor/autoload.php';
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
    require_once __DIR__ . '/app/helpers/helpers.php';
    require_once __DIR__ . '/config.php';
    require_once __DIR__ . '/app/core/Database.php';
    require_once __DIR__ . '/app/helpers/mailHelper.php';
    try {
        $db = Database::getInstance()->pdo;
        $mailHelper = new MailHelper($db);
        if (class_exists('Minishlink\WebPush\WebPush')) {
            $vapid_keys = [
                'VAPID' => [
                    'subject'    => 'mailto:sv1.pstgwind.com',
                    'publicKey'  => 'BJyu1v7EXRhdUr1MnfK3sAjxitbj2wxpO5YZlQVbz1abX-fnNQwWU0-RHR791cmfoCg-6H7cuvGBa6ctsERVnho',
                    'privateKey' => 'zATIYMv5d222-QeBz34E7rDY_t4e5oU2QS9MW3rHP8M',
                ],
            ];
            $webPush = new WebPush($vapid_keys);
            $sqlPwa = "SELECT q.*, s.endpoint, s.p256dh, s.auth FROM pwa_notification_queue q JOIN push_subscriptions s ON q.subscription_id = s.id WHERE q.status = 'pending' AND q.scheduled_at <= NOW() LIMIT 50";
            $pwaQueue = $db->query($sqlPwa)->fetchAll();
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
            }
            foreach ($webPush->flush() as $report) {
                $endpoint = $report->getEndpoint();
                $status = $report->isSuccess() ? 'sent' : 'failed';
                $error = $report->isSuccess() ? null : $report->getReason();
                $db->prepare("UPDATE pwa_notification_queue SET status = ?, error_message = ?, sent_at = NOW() WHERE status = 'processing' AND subscription_id = (SELECT id FROM push_subscriptions WHERE endpoint = ? LIMIT 1)")
                ->execute([$status, $error, $endpoint]);
            }
        }
        $sqlEmail = "SELECT * FROM email_queue WHERE status = 'pending' AND scheduled_at <= NOW() LIMIT 20";
        $emailQueue = $db->query($sqlEmail)->fetchAll();
        foreach ($emailQueue as $mail) {
            $db->prepare("UPDATE email_queue SET status = 'processing' WHERE id = ?")->execute([$mail['id']]);
            $sent = $mailHelper->sendQueueMail(
                $mail['recipient_email'], 
                $mail['subject'], 
                $mail['body']
            ); 
            if ($sent) {
                $db->prepare("UPDATE email_queue SET status = 'sent', sent_at = NOW() WHERE id = ?")->execute([$mail['id']]);
            } else {
                $db->prepare("UPDATE email_queue SET status = 'failed' WHERE id = ?")->execute([$mail['id']]);
            }
        }
    } catch (Exception $e) {
        error_log("Cron Worker Error: " . $e->getMessage());
    }