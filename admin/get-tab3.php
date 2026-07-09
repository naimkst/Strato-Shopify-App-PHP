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

$profile_id = (int)$_GET['profile_id'];
$wing_id = (int)$_GET['wing_id'];
$static_code = isset($_GET['static_code']) ? (string)$_GET['static_code'] : '';

$data = [];

$res = $conn->query("SELECT * FROM tab_options WHERE tab_id = 3");

while ($row = $res->fetch_assoc()) {

    $extra = json_decode($row['extra_json'], true);
    $comboIds = $extra['combo_option_ids'] ?? [];

    $comboIds = array_map('strval', $comboIds);

    $isExactMatch = $static_code !== ''
        && count($comboIds) === 3
        && $comboIds[0] === $static_code
        && $comboIds[1] === (string)$profile_id
        && $comboIds[2] === (string)$wing_id;

    $isLegacyMatch = $static_code === ''
        && in_array((string)$profile_id, $comboIds, true)
        && in_array((string)$wing_id, $comboIds, true);

    if ($isExactMatch || $isLegacyMatch) {
        $data[] = $row;
    }
}

echo json_encode($data);

?>
