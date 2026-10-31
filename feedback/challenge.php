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
    $max = 5000;
    $number = random_int(0, $max);
    $salt = bin2hex(random_bytes(16));
    $challenge = hash('sha256', $salt . $number);
    $id = bin2hex(random_bytes(16));
    $now = time();
    $db = fb_db();
    $db->prepare('DELETE FROM challenges WHERE expires < ? OR (used = 1 AND created < ?)')->execute([$now, $now - 86400]);
    $db->prepare('INSERT INTO challenges (id, salt, challenge, ip, created, expires, used) VALUES (?, ?, ?, ?, ?, ?, 0)')
        ->execute([$id, $salt, $challenge, fb_ip(), $now, $now + 1200]);
    fb_hit($bucket);
    fb_ok([
        'id' => $id,
        'salt' => $salt,
        'challenge' => $challenge,
        'max' => $max,
    ]);
} catch (Throwable $e) {
    error_log('librecv feedback challenge failed');
    fb_fail(500, 'fail');
}
