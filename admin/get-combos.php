<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require '../connect.php';

$hw = [];
$res = $conn->query("SELECT * FROM height_width_prices");
while ($r = $res->fetch_assoc()) $hw[] = $r;

$combo = [];
$res2 = $conn->query("SELECT * FROM combo_options");
while ($r = $res2->fetch_assoc()) $combo[] = $r;

echo json_encode([
  "height_width_prices" => $hw,
  "combo_options" => $combo
]);

?>