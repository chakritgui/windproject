<?php

define('DB_HOST', env('DB_HOST', 'localhost'));
define('DB_USER', env('DB_USER'));
define('DB_PASS', env('DB_PASS'));
define('DB_NAME', env('DB_NAME'));

define('BASE_URL', rtrim(env('BASE_URL'), '/'));
define('APP_URL',  rtrim(env('APP_URL'), '/'));

define('KEY', env('APP_KEY'));
define('TRANSLATE_LIMIT', (int) env('TRANSLATE_LIMIT', 0));
