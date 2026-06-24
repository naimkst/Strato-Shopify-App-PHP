<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");


require '../connect.php';

$profile_id = (int)$_GET['profile_id'];
$wing_id = (int)$_GET['wing_id'];

$data = [];

$res = $conn->query("SELECT * FROM tab_options WHERE tab_id = 3");

while ($row = $res->fetch_assoc()) {

    $extra = json_decode($row['extra_json'], true);
    $comboIds = $extra['combo_option_ids'] ?? [];

    if (
        in_array((string)$profile_id, $comboIds) &&
        in_array((string)$wing_id, $comboIds)
    ) {
        $data[] = $row;
    }
}

echo json_encode($data);

?>