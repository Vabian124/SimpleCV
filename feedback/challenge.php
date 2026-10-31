<?php
declare(strict_types=1);

require __DIR__ . '/lib.php';

try {
    fb_quiet();
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
        header('Allow: GET');
        fb_fail(405, 'bad');
    }
    $bucket = 'work|' . fb_ip();
    if (fb_hits($bucket, 3600) >= 30) {
        fb_fail(429, 'limit');
    }
    $made = fb_altcha_new();
    $now = time();
    $db = fb_db();
    $db->prepare('DELETE FROM challenges WHERE expires < ? OR (used = 1 AND created < ?)')->execute([$now, $now - 86400]);
    $db->prepare('INSERT INTO challenges (id, salt, challenge, ip, created, expires, used) VALUES (?, ?, ?, ?, ?, ?, 0)')
        ->execute([$made['signature'], $made['salt'], $made['challenge'], fb_ip(), $now, $made['expires']]);
    fb_hit($bucket);
    fb_ok([
        'algorithm' => $made['algorithm'],
        'challenge' => $made['challenge'],
        'maxnumber' => $made['maxnumber'],
        'salt' => $made['salt'],
        'signature' => $made['signature'],
    ]);
} catch (Throwable $e) {
    error_log('librecv feedback challenge failed');
    fb_fail(500, 'fail');
}
