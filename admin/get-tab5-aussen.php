<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}


require '../connect.php';

// ✅ pagination params
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 5;
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

$tabs = [];

$resTabs = $conn->query("SELECT * FROM tabs ORDER BY order_index");

while ($tab = $resTabs->fetch_assoc()) {

    $tab_id = (int)$tab['id'];
    $subtabs = [];

    // 👉 only außen
    $res = $conn->query("
        SELECT * FROM subtabs 
        WHERE tab_id = $tab_id 
        AND (
            LOWER(name) LIKE '%außen%' 
            OR LOWER(name) LIKE '%aussen%'
        )
    ");

    while ($subtab = $res->fetch_assoc()) {

        $subtab_id = (int)$subtab['id'];

        // ✅ PAGINATED OPTIONS
        $options = [];
        $optRes = $conn->query("
            SELECT * FROM tab_options 
            WHERE subtab_id = $subtab_id 
            ORDER BY id 
            LIMIT $limit OFFSET $offset
        ");

        while ($row = $optRes->fetch_assoc()) {
            $options[] = $row;
        }

        $subtab['options'] = $options;

        // ⚠️ keep empty (avoid heavy load)
        $subtab['sections'] = [];

        $subtabs[] = $subtab;
    }

    if (!empty($subtabs)) {
        $tab['subtabs'] = $subtabs;
        $tabs[] = $tab;
    }
}

echo json_encode([
    "tabs" => $tabs,
    "height_width_prices" => [],
    "combo_options" => []
]);
