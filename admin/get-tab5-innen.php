<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");


require '../connect.php';

// ✅ pagination params
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 5;
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

$tabs = [];

$resTabs = $conn->query("SELECT * FROM tabs ORDER BY order_index");

while ($tab = $resTabs->fetch_assoc()) {

    $tab_id = (int)$tab['id'];
    $subtabs = [];

    // 👉 only innen
    $res = $conn->query("
        SELECT * FROM subtabs 
        WHERE tab_id = $tab_id 
        AND LOWER(name) LIKE '%innen%'
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

        // ⚠️ IMPORTANT: keep sections empty (avoid heavy load)
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
