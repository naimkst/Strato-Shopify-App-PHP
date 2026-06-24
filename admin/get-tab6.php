<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require '../connect.php';

$data = [];

$res = $conn->query("SELECT * FROM tab_options WHERE tab_id = 6");

while ($row = $res->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);

?>