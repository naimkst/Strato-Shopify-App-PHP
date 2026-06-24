<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require '../connect.php';

$tab_id = 5;

// ===== FETCH ONLY TAB 5 =====
$tabs = [];

$tabSql = "SELECT * FROM tabs WHERE id = $tab_id";
$tabResult = $conn->query($tabSql);

while ($tab = $tabResult->fetch_assoc()) {

    // 🔥 IMPORTANT: DO NOT FETCH ALL SVG AT ONCE
    $tabOptSql = "SELECT id, label, image_url FROM tab_options WHERE tab_id = $tab_id ORDER BY id";
    $tabOptResult = $conn->query($tabOptSql);

    $tab_options = [];
    while ($opt = $tabOptResult->fetch_assoc()) {
        $tab_options[] = $opt;
    }

    $tab['options'] = $tab_options;
    $tab['subtabs'] = []; // keep structure safe

    $tabs[] = $tab;
}

echo json_encode([
    "tabs" => $tabs
]);

$conn->close();


?>