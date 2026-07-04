<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require '../connect.php';

if (!empty($_GET['combo_option_ids'])) {
    $decoded = json_decode($_GET['combo_option_ids'], true);

    if (!is_array($decoded)) {
        $decoded = array_filter(explode(',', $_GET['combo_option_ids']), 'strlen');
    }

    $comboKey = json_encode(array_values(array_map('strval', $decoded)));
    $hw = [];

    $stmt = $conn->prepare("SELECT * FROM height_width_prices WHERE combo_option_ids = ? ORDER BY width, height, id");
    $stmt->bind_param("s", $comboKey);
    $stmt->execute();
    $res = $stmt->get_result();

    while ($r = $res->fetch_assoc()) {
        $hw[] = $r;
    }

    echo json_encode([
      "height_width_prices" => $hw,
      "combo_options" => []
    ]);
    $conn->close();
    exit;
}

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
