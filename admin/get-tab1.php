<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require '../connect.php';

$data = [];

$sql = "SELECT * FROM tab_options WHERE tab_id = 1 ORDER BY id";
$res = $conn->query($sql);

while ($row = $res->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);

?>