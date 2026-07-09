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

$subtab_id = isset($_GET['subtab_id']) ? (int)$_GET['subtab_id'] : 0;
$options = [];

if ($subtab_id > 0) {
    $res = $conn->query("SELECT * FROM tab_options WHERE subtab_id = $subtab_id AND label NOT LIKE 'HW Combo:%' ORDER BY id");

    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $options[] = $row;
        }
    }
}

echo json_encode($options);

$conn->close();
exit;
?>
