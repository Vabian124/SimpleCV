<?php
declare(strict_types=1);

/* CC0-1.0 — https://creativecommons.org/publicdomain/zero/1.0/ */
/* The inbox lives in ~/librecv/feedback, outside the published site. */

if (realpath((string)($_SERVER['SCRIPT_FILENAME'] ?? '')) === __FILE__) {
    http_response_code(404);
    header('X-Robots-Tag: noindex, nofollow, noarchive');
    exit;
}

ini_set('display_errors', '0');
umask(0077);

function fb_quiet(): void {
    header('X-Robots-Tag: noindex, nofollow, noarchive');
    header('Cache-Control: no-store');
}

function fb_store_dir(): string {
    $dir = __DIR__;
    for ($i = 0; $i < 6; $i++) {
        if (is_dir($dir . '/librecv/feedback')) {
            return $dir . '/librecv/feedback';
        }
        $parent = dirname($dir);
        if ($parent === $dir) {
            break;
        }
        $dir = $parent;
    }
    return '';
}

function fb_config(): array {
    static $config = null;
    if ($config !== null) {
        return $config;
    }
    $dir = fb_store_dir();
    $file = $dir === '' ? '' : $dir . '/config.php';
    if ($file === '' || !is_file($file)) {
        http_response_code(503);
        fb_quiet();
        header('Content-Type: text/plain; charset=UTF-8');
        echo 'Feedback is not ready.';
        exit;
    }
    $loaded = require $file;
    if (!is_array($loaded) || !is_string($loaded['secret'] ?? null) || !is_string($loaded['password_hash'] ?? null)) {
        http_response_code(503);
        fb_quiet();
        exit;
    }
    $config = $loaded;
    return $config;
}

function fb_db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $dir = fb_store_dir();
    if ($dir === '' || !is_writable($dir)) {
        http_response_code(503);
        fb_quiet();
        exit;
    }
    $path = $dir . '/inbox.sqlite';
    $pdo = new PDO('sqlite:' . $path, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec('PRAGMA journal_mode = WAL');
    $pdo->exec('PRAGMA busy_timeout = 3000');
    $pdo->exec('CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY,
        created INTEGER NOT NULL,
        status TEXT NOT NULL,
        kind TEXT NOT NULL,
        message TEXT NOT NULL,
        email TEXT NOT NULL,
        page TEXT NOT NULL,
        lang TEXT NOT NULL,
        ua TEXT NOT NULL,
        context TEXT NOT NULL
    )');
    $pdo->exec('CREATE TABLE IF NOT EXISTS challenges (
        id TEXT PRIMARY KEY,
        salt TEXT NOT NULL,
        challenge TEXT NOT NULL,
        ip TEXT NOT NULL,
        created INTEGER NOT NULL,
        expires INTEGER NOT NULL,
        used INTEGER NOT NULL
    )');
    $pdo->exec('CREATE TABLE IF NOT EXISTS hits (
        bucket TEXT NOT NULL,
        at INTEGER NOT NULL
    )');
    $pdo->exec('CREATE INDEX IF NOT EXISTS hits_bucket ON hits (bucket, at)');
    @chmod($path, 0600);
    @chmod($path . '-wal', 0600);
    @chmod($path . '-shm', 0600);
    return $pdo;
}

function fb_len(string $value): int {
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

function fb_clip(string $value, int $max): string {
    if (fb_len($value) <= $max) {
        return $value;
    }
    return function_exists('mb_substr') ? mb_substr($value, 0, $max, 'UTF-8') : substr($value, 0, $max);
}

function fb_ip(): string {
    $ip = (string)($_SERVER['REMOTE_ADDR'] ?? '');
    return hash('sha256', fb_config()['secret'] . '|' . $ip);
}

function fb_hits(string $bucket, int $window): int {
    $db = fb_db();
    $now = time();
    $db->prepare('DELETE FROM hits WHERE at < ?')->execute([$now - 3600]);
    $stmt = $db->prepare('SELECT COUNT(*) FROM hits WHERE bucket = ? AND at >= ?');
    $stmt->execute([$bucket, $now - $window]);
    return (int)$stmt->fetchColumn();
}

function fb_hit(string $bucket): void {
    $db = fb_db();
    $now = time();
    $db->prepare('DELETE FROM hits WHERE at < ?')->execute([$now - 3600]);
    $db->prepare('INSERT INTO hits (bucket, at) VALUES (?, ?)')->execute([$bucket, $now]);
}

function fb_fail(int $status, string $error): void {
    http_response_code($status);
    fb_quiet();
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(['ok' => false, 'error' => $error], JSON_UNESCAPED_UNICODE);
    exit;
}

function fb_ok(array $extra = []): void {
    http_response_code(200);
    fb_quiet();
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(array_merge(['ok' => true], $extra), JSON_UNESCAPED_UNICODE);
    exit;
}

function fb_page(string $value): string {
    $value = trim($value);
    if ($value === '' || fb_len($value) > 500) {
        return '';
    }
    if (preg_match('#^https://librecv\.org(?:/[^\s]*)?$#', $value) !== 1) {
        return '';
    }
    return $value;
}

function fb_h(string $value): string {
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function fb_kind_label(string $kind): string {
    switch ($kind) {
        case 'problem':
            return 'A problem';
        case 'idea':
            return 'An idea';
        case 'confusion':
            return 'Something confusing';
        case 'praise':
            return 'Something that worked';
        case 'other':
            return 'Something else';
        default:
            return $kind;
    }
}

function fb_when(int $unix): string {
    return gmdate('Y-m-d H:i', $unix) . ' UTC';
}

function fb_session(): void {
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    session_name('FBDESK');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/feedback/desk/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
    if (empty($_SESSION['csrf']) || !is_string($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
    }
}

function fb_logged_in(): bool {
    if (empty($_SESSION['desk'])) {
        return false;
    }
    $at = (int)($_SESSION['desk_at'] ?? 0);
    if ($at < 1 || (time() - $at) > 43200) {
        unset($_SESSION['desk'], $_SESSION['desk_at']);
        return false;
    }
    $_SESSION['desk_at'] = time();
    return true;
}

function fb_csrf_ok(): bool {
    $sent = (string)($_POST['csrf'] ?? '');
    $real = (string)($_SESSION['csrf'] ?? '');
    return $real !== '' && hash_equals($real, $sent);
}
