<?php

ini_set('memory_limit', '1024M');
ini_set('max_execution_time', 0);

header("Content-Type: application/json");

$finalFile = __DIR__ . '/first-four.json';

// total tabs (change if needed)
$totalTabs = 4;

$allTabs = [];
$height_width_prices = [];
$combo_options = [];

for ($i = 1; $i <= $totalTabs; $i++) {

    $file = __DIR__ . "/cache_tab_$i.json";

    if (!file_exists($file)) {
        echo json_encode(["error" => "Missing file: cache_tab_$i.json"]);
        exit;
    }

    $json = file_get_contents($file);
    $data = json_decode($json, true);

    if (!$data) {
        echo json_encode(["error" => "Invalid JSON in file: cache_tab_$i.json"]);
        exit;
    }

    // merge tabs
    if (!empty($data['tabs'])) {
        foreach ($data['tabs'] as $tab) {
            $allTabs[] = $tab;
        }
    }

    // take global data only once
    if (empty($height_width_prices) && !empty($data['height_width_prices'])) {
        $height_width_prices = $data['height_width_prices'];
    }

    if (empty($combo_options) && !empty($data['combo_options'])) {
        $combo_options = $data['combo_options'];
    }
}

// final structure (EXACT SAME)
$finalData = [
    "tabs" => $allTabs,
    "height_width_prices" => $height_width_prices,
    "combo_options" => $combo_options
];

// save final file
file_put_contents($finalFile, json_encode($finalData));

echo json_encode(["status" => "Merged successfully"]);