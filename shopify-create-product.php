<?php
// ---------- CORS (FIXED) ----------

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowedPatterns = [
    '#^https://(.*)\.myshopify\.com$#',
    '#^https://(.*)\.shopifypreview\.com$#',
    '#^https://(www\.)?deine-fenster24\.com$#',
    '#^https://deine-fenster24\.com$#'
];

$allowed = false;
foreach ($allowedPatterns as $pattern) {
    if (preg_match($pattern, $origin)) {
        $allowed = true;
        break;
    }
}

if ($allowed) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// ---------- PRE-FLIGHT ----------
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}



require_once("functions.php");

// ---------- SHOP ----------
$shopParam = $_GET['shop'] ?? null;
if (!$shopParam) {
    echo json_encode(["success" => false, "msg" => "No shop specified"]);
    exit;
}

$shop = preg_replace("/\.myshopify\.com$/", "", $shopParam);

// Token check (both formats)
$token = getShopToken($shop);
if (!$token) {
    $token = getShopToken($shop . ".myshopify.com");
}
if (!$token) {
    echo json_encode(["success" => false, "msg" => "No token found for shop"]);
    exit;
}

// ---------- DATA ----------
$data = json_decode(file_get_contents("php://input"), true);
if (!$data) {
    echo json_encode(["success" => false, "msg" => "No configurator data received"]);
    exit;
}

// ---------- SVG Handling ----------
$images = [];
if (!empty($data['svg'])) {
    $uploadDir = __DIR__ . "/uploads";
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $fileName = "preview_" . time() . ".svg";
    $filePath = $uploadDir . "/" . $fileName;
    file_put_contents($filePath, $data['svg']);

    // Public URL (adjust path if needed)
    $svgUrl = "https://droplify.de/deine-fenster24/uploads/" . $fileName;
    $images[] = ["src" => $svgUrl];
}

$configValue = function ($key) use ($data) {
    return htmlspecialchars((string)($data[$key] ?? ''), ENT_QUOTES, 'UTF-8');
};

$balconyRows = '';
if (!empty($data['balkon_note_1'])) {
    $balconyRows .= '<li>' . $configValue('balkon_note_1') . '</li>';
}
if (!empty($data['balkon_note_2'])) {
    $balconyRows .= '<li>' . $configValue('balkon_note_2') . '</li>';
}

function normalizeShopifyMoney($value) {
    $text = html_entity_decode((string)($value ?? ''), ENT_QUOTES, 'UTF-8');

    if (!preg_match('/\d+(?:[.,]\d{3})*(?:[.,]\d{1,2})?/', $text, $match)) {
        return '0.00';
    }

    $number = $match[0];
    $lastComma = strrpos($number, ',');
    $lastDot = strrpos($number, '.');

    if ($lastComma !== false && $lastDot !== false) {
        if ($lastComma > $lastDot) {
            $number = str_replace('.', '', $number);
            $number = str_replace(',', '.', $number);
        } else {
            $number = str_replace(',', '', $number);
        }
    } elseif ($lastComma !== false) {
        $number = str_replace(',', '.', $number);
    }

    $amount = (float)$number;
    return number_format($amount, 2, '.', '');
}

$variantPrice = normalizeShopifyMoney($data['price'] ?? '');

// ---------- PRODUCT ----------
$product = [
  "product" => [
    "title" => "Fensterkonfigurator - " . ($data['profile'] ?? "Custom"),
    "status" => "active", // publish directly
	"published_scope" => "global",
    "body_html" => "<p><strong>Konfiguration:</strong></p>
      <ul>
        <li>System: {$data['profile']}</li>
        <li>Typ: {$data['wing']}</li>
        <li>Öffnung: {$data['opening']}</li>
        <li>Beschlag: {$data['beschlag']}</li>
        <li>Breite: {$data['width']} mm</li>
        <li>Höhe: {$data['height']} mm</li>
        <li>Farbe innen: {$data['farbe_innen']}</li>
        <li>Farbe außen: {$data['farbe_aussen']}</li>
        <li>Griff: {$data['griff']}</li>
        <li>Isolierglas: {$data['isolierglas']}</li>
        <li>Ornament: {$data['ornament']}</li>
        <li>Sprosse: {$data['sprosse']}</li>
	        <li>Rahmen: {$data['rahmen']}</li>
	        {$balconyRows}
	        <li>Lüfter: {$data['luefter']}</li>
        <li>Reedkontakt: {$data['reedkontakt']}</li>
        <li>Rollladen: {$data['rollladen']}</li>
      </ul>",
"variants" => [[
  "price" => $variantPrice,
  "inventory_management" => "shopify",   // ✅ ENABLE inventory
  "inventory_policy" => "continue",       // ✅ allow overselling
  "requires_shipping" => true,
  "inventory_quantity" => 9999             // ✅ initial stock
]],


    "images" => $images
  ]
];



// ---------- CALL SHOPIFY ----------
$response = shopify_call(
    $token,
    $shop,
    "/admin/api/2024-07/products.json",
    $product,
    "POST"
);

// ---------- RESPONSE ----------
if (!empty($response['response'])) {
    $respData = json_decode($response['response'], true);
    if (isset($respData['product']['variants'][0]['id'])) {
        echo json_encode([
            "success" => true,
            "variantId" => $respData['product']['variants'][0]['id'],
            "product" => $respData['product']
        ]);
        exit;
    }
}

echo json_encode([
    "success" => false,
    "msg" => "Shopify API error",
    "raw" => $response
]);
