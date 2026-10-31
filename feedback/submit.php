<?php
declare(strict_types=1);

require __DIR__ . '/lib.php';

function fb_field(array $data, string $key): string {
    if (!isset($data[$key]) || !is_string($data[$key])) {
        return '';
    }
    return str_replace("\0", '', $data[$key]);
}

try {
    fb_quiet();
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        header('Allow: POST');
        fb_fail(405, 'bad');
    }
    $length = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($length < 2 || $length > 60000) {
        fb_fail(413, 'long');
    }
    $raw = file_get_contents('php://input');
    if ($raw === false || strlen($raw) > 60000) {
        fb_fail(413, 'long');
    }
    $data = json_decode($raw, true, 8);
    if (!is_array($data)) {
        fb_fail(400, 'bad');
    }

    $bucket = 'note|' . fb_ip();
    if (fb_hits($bucket, 3600) >= 6) {
        fb_fail(429, 'limit');
    }
    if (trim(fb_field($data, 'leave')) !== '') {
        fb_hit($bucket);
        fb_fail(400, 'extra');
    }

    $kind = fb_field($data, 'kind');
    $kinds = ['problem', 'idea', 'confusion', 'praise', 'other'];
    if (!in_array($kind, $kinds, true)) {
        fb_hit($bucket);
        fb_fail(400, 'bad');
    }
    $message = str_replace("\r\n", "\n", fb_field($data, 'message'));
    $message = str_replace("\r", "\n", $message);
    $message = trim($message);
    if (fb_len($message) < 4) {
        fb_hit($bucket);
        fb_fail(400, 'short');
    }
    if (fb_len($message) > 8000) {
        fb_hit($bucket);
        fb_fail(400, 'long');
    }
    $email = trim(fb_field($data, 'email'));
    if (fb_len($email) > 200 || ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) === false)) {
        fb_hit($bucket);
        fb_fail(400, 'email');
    }

    $want = [];
    if (isset($data['attach']) && is_array($data['attach'])) {
        foreach ($data['attach'] as $item) {
            if (is_string($item)) {
                $want[$item] = true;
            }
        }
    }
    $page = isset($want['page']) ? fb_page(fb_field($data, 'page')) : '';
    $lang = '';
    if (isset($want['page'])) {
        $lang = strtolower(trim(fb_field($data, 'lang')));
        if (preg_match('/^[a-z-]{2,12}$/', $lang) !== 1) {
            $lang = '';
        }
    }
    $ua = '';
    $viewport = '';
    if (isset($want['browser'])) {
        $ua = trim(preg_replace('/[\x00-\x1F\x7F]/', '', fb_field($data, 'ua')) ?? '');
        $ua = fb_clip($ua, 400);
        $viewport = trim(fb_field($data, 'viewport'));
        if (preg_match('/^\d{2,5}x\d{2,5}$/', $viewport) !== 1) {
            $viewport = '';
        }
    }
    $marked = '';
    $docKind = '';
    if (isset($want['document'])) {
        $marked = str_replace("\r\n", "\n", fb_field($data, 'marked'));
        $marked = trim(str_replace("\r", "\n", $marked));
        if (fb_len($marked) > 40000) {
            fb_hit($bucket);
            fb_fail(400, 'long');
        }
        $docKind = fb_field($data, 'docKind');
        if ($docKind !== 'cv' && $docKind !== 'letter') {
            $docKind = '';
        }
    }

    $rawNumber = $data['number'] ?? null;
    $number = is_int($rawNumber) ? (string)$rawNumber : fb_field($data, 'number');
    $algorithm = fb_field($data, 'algorithm');
    $challenge = fb_field($data, 'challenge');
    $salt = fb_field($data, 'salt');
    $signature = fb_field($data, 'signature');
    if (!fb_altcha_matches($algorithm, $challenge, $salt, $signature, $number)) {
        fb_hit($bucket);
        fb_fail(400, 'work');
    }

    $db = fb_db();
    $db->beginTransaction();
    $stmt = $db->prepare('SELECT salt, challenge, ip, created, expires, used FROM challenges WHERE id = ?');
    $stmt->execute([$signature]);
    $row = $stmt->fetch();
    $now = time();
    $stored = $row
        && (int)$row['used'] === 0
        && (int)$row['expires'] >= $now
        && hash_equals((string)$row['ip'], fb_ip())
        && hash_equals((string)$row['salt'], $salt)
        && hash_equals((string)$row['challenge'], $challenge);
    if (!$stored) {
        $db->rollBack();
        fb_hit($bucket);
        fb_fail(400, 'work');
    }
    if ($now - (int)$row['created'] < 2) {
        $db->rollBack();
        fb_hit($bucket);
        fb_fail(400, 'soon');
    }

    $context = [];
    if ($page !== '') {
        $context['page'] = $page;
    }
    if ($lang !== '') {
        $context['lang'] = $lang;
    }
    if ($ua !== '') {
        $context['ua'] = $ua;
    }
    if ($viewport !== '') {
        $context['viewport'] = $viewport;
    }
    if ($docKind !== '') {
        $context['docKind'] = $docKind;
    }
    if ($marked !== '') {
        $context['marked'] = $marked;
    }
    $encoded = json_encode($context, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG);
    if ($encoded === false) {
        $db->rollBack();
        fb_hit($bucket);
        fb_fail(400, 'bad');
    }
    $db->prepare('INSERT INTO notes (created, status, kind, message, email, page, lang, ua, context) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        ->execute([$now, 'open', $kind, $message, $email, $page, $lang, $ua, $encoded]);
    $used = $db->prepare('UPDATE challenges SET used = 1 WHERE id = ? AND used = 0');
    $used->execute([$signature]);
    if ($used->rowCount() !== 1) {
        $db->rollBack();
        fb_hit($bucket);
        fb_fail(400, 'work');
    }
    $db->commit();
    fb_hit($bucket);
    fb_ok();
} catch (Throwable $e) {
    if (isset($db) && $db instanceof PDO && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log('librecv feedback submit failed');
    fb_fail(500, 'fail');
}
