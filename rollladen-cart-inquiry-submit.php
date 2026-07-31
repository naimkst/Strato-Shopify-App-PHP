<?php

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedPatterns = [
    '#^https://(.*)\.myshopify\.com$#',
    '#^https://(.*)\.shopifypreview\.com$#',
    '#^https://(www\.)?deine-fenster24\.com$#',
    '#^https://deine-fenster24\.com$#'
];

$allowed = $origin === '';
foreach ($allowedPatterns as $pattern) {
    if ($origin && preg_match($pattern, $origin)) {
        $allowed = true;
        break;
    }
}

if ($allowed && $origin) {
    header("Access-Control-Allow-Origin: $origin");
    header("Vary: Origin");
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code($allowed ? 204 : 403);
    exit;
}

if (!$allowed) {
    http_response_code(403);
    echo json_encode(["success" => false, "msg" => "Origin not allowed"]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "msg" => "Method not allowed"]);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

function inquiry_value($data, $key, $maxLength = 2000) {
    $value = $data[$key] ?? '';
    if (is_array($value)) {
        $value = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
    $value = trim((string)$value);
    $value = str_replace(["\r\n", "\r"], "\n", $value);
    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $maxLength, 'UTF-8');
    }
    return substr($value, 0, $maxLength);
}

function inquiry_fail($message, $status = 422) {
    http_response_code($status);
    echo json_encode(["success" => false, "msg" => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function inquiry_safe_email($email) {
    $email = trim((string)$email);
    return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : '';
}

function inquiry_format_money($cents, $currency) {
    if (!is_numeric($cents)) {
        return '';
    }
    $amount = number_format(((float)$cents) / 100, 2, ',', '.');
    return trim($amount . ' ' . (string)$currency);
}

function inquiry_header_text($value) {
    return trim(preg_replace('/[\r\n<>]+/', ' ', (string)$value));
}

$name = inquiry_value($data, 'name', 160);
$email = inquiry_safe_email($data['email'] ?? '');
$phone = inquiry_value($data, 'phone', 80);
$message = inquiry_value($data, 'message', 20000);
$pageUrl = inquiry_value($data, 'page_url', 600);
$shopDomain = inquiry_value($data, 'shop_domain', 160);
$tags = inquiry_value($data, 'tags', 200);
$cart = is_array($data['cart'] ?? null) ? $data['cart'] : [];
$items = is_array($cart['items'] ?? null) ? $cart['items'] : [];
$currency = inquiry_value($cart, 'currency', 20);

if ($name === '') {
    inquiry_fail('Name is required');
}
if ($email === '') {
    inquiry_fail('Valid email is required');
}
if ($phone === '') {
    inquiry_fail('Phone is required');
}
if ($message === '' && empty($items)) {
    inquiry_fail('Inquiry details are required');
}

$lines = [
    'Neue Rollladen-Anfrage aus dem Warenkorb',
    '',
    'Name: ' . $name,
    'E-Mail: ' . $email,
    'Telefon: ' . $phone,
    'Shop: ' . $shopDomain,
    'Seite: ' . $pageUrl,
    'Tags: ' . $tags,
    'Warenkorb Token: ' . inquiry_value($cart, 'token', 200),
    'Warenkorb Positionen: ' . inquiry_value($cart, 'item_count', 20),
    'Rollladen Positionen: ' . inquiry_value($cart, 'rollladen_item_count', 20)
];

$total = inquiry_format_money($cart['total_price'] ?? '', $currency);
if ($total !== '') {
    $lines[] = 'Warenkorb Summe: ' . $total;
}

if ($message !== '') {
    $lines[] = '';
    $lines[] = 'Konfiguration:';
    $lines[] = $message;
}

if (!empty($items)) {
    $lines[] = '';
    $lines[] = 'Warenkorb Details:';
    foreach ($items as $index => $item) {
        if (!is_array($item)) continue;
        $lines[] = '';
        $lines[] = 'Artikel ' . ($index + 1) . ': ' . inquiry_value($item, 'title', 300);
        $lines[] = 'Menge: ' . inquiry_value($item, 'quantity', 20);
        $linePrice = inquiry_format_money($item['line_price'] ?? '', $currency);
        if ($linePrice !== '') {
            $lines[] = 'Preis: ' . $linePrice;
        }
        $url = inquiry_value($item, 'url', 600);
        if ($url !== '') {
            $lines[] = 'Produkt URL: ' . $url;
        }
        $properties = is_array($item['properties'] ?? null) ? $item['properties'] : [];
        foreach ($properties as $key => $value) {
            if ($value === '' || $value === null || substr((string)$key, 0, 1) === '_') continue;
            $lines[] = $key . ': ' . inquiry_value([$key => $value], $key, 1000);
        }
    }
}

$body = implode("\n", $lines);
$subject = 'Rollladen-Anfrage aus dem Warenkorb';
$recipient = getenv('ROLLLADEN_INQUIRY_TO') ?: 'info@hdc-digital.com';
$from = getenv('ROLLLADEN_INQUIRY_FROM') ?: 'noreply@droplify.de';

$logDir = __DIR__ . '/private_logs';
if (!is_dir($logDir)) {
    @mkdir($logDir, 0755, true);
}
if (is_dir($logDir) && !file_exists($logDir . '/.htaccess')) {
    @file_put_contents($logDir . '/.htaccess', "Require all denied\nDeny from all\n");
}

$logEntry = [
    'created_at' => gmdate('c'),
    'name' => $name,
    'email' => $email,
    'phone' => $phone,
    'shop_domain' => $shopDomain,
    'page_url' => $pageUrl,
    'cart' => $cart,
    'message' => $message
];
$logged = false;
if (is_dir($logDir)) {
    $logged = (bool)@file_put_contents(
        $logDir . '/rollladen-cart-inquiries.log',
        json_encode($logEntry, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n",
        FILE_APPEND | LOCK_EX
    );
}

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: Deine-Fenster24 Anfrage <' . $from . '>',
    'Reply-To: ' . inquiry_header_text($name) . ' <' . $email . '>',
    'X-Mailer: PHP/' . phpversion()
];

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$mailSent = @mail($recipient, $encodedSubject, $body, implode("\r\n", $headers), '-f' . $from);
if (!$mailSent) {
    $mailSent = @mail($recipient, $encodedSubject, $body, implode("\r\n", $headers));
}

if (!$mailSent && !$logged) {
    inquiry_fail('Inquiry could not be saved or sent', 500);
}

echo json_encode([
    "success" => true,
    "mail_sent" => $mailSent,
    "logged" => $logged
], JSON_UNESCAPED_UNICODE);
