<?php

require '../connect.php';

$tabId = isset($_GET['tab_id']) ? (int)$_GET['tab_id'] : 0;

if (!$tabId) {
    echo "Missing tab_id";
    exit;
}

$file = __DIR__ . "/cache_tab_$tabId.json";

// -------- TAB --------
$tabRes = $conn->query("SELECT * FROM tabs WHERE id = $tabId");
$tab = $tabRes->fetch_assoc();

if (!$tab) {
    echo "Invalid tab";
    exit;
}

// -------- OPTIONS --------
$tab['options'] = [];
$res = $conn->query("SELECT * FROM tab_options WHERE tab_id = $tabId");
while ($r = $res->fetch_assoc()) {
    $tab['options'][] = $r;
}

// -------- SUBTABS --------
$tab['subtabs'] = [];
$subRes = $conn->query("SELECT * FROM subtabs WHERE tab_id = $tabId");

while ($sub = $subRes->fetch_assoc()) {

    $sub_id = $sub['id'];

    $sub['options'] = [];
    $optRes = $conn->query("SELECT * FROM tab_options WHERE subtab_id = $sub_id");

    while ($o = $optRes->fetch_assoc()) {
        $sub['options'][] = $o;
    }

    $sub['sections'] = [];

    $secRes = $conn->query("SELECT * FROM subtab_sections WHERE subtab_id = $sub_id");

    while ($sec = $secRes->fetch_assoc()) {

        $sec_id = $sec['id'];

        $secData = [
            "id" => $sec_id,
            "name" => $sec['name'],
            "order_index" => (int)$sec['order_index'],
            "options" => []
        ];

        $sres = $conn->query("SELECT * FROM tab_options WHERE subtab_id = $sub_id AND section_id = $sec_id");

        while ($o = $sres->fetch_assoc()) {
            $secData['options'][] = $o;
        }

        $sub['sections'][] = $secData;
    }

    $tab['subtabs'][] = $sub;
}

// -------- GLOBAL DATA --------
$hw = [];
$res = $conn->query("SELECT * FROM height_width_prices");
while ($r = $res->fetch_assoc()) $hw[] = $r;

$combo = [];
$res = $conn->query("SELECT * FROM combo_options");
while ($r = $res->fetch_assoc()) $combo[] = $r;

$data = [
    "tabs" => [$tab],
    "height_width_prices" => $hw,
    "combo_options" => $combo
];

file_put_contents($file, json_encode($data));

echo "Tab $tabId built";