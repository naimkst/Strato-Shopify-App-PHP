<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$url = "https://droplify.de/deine-fenster24/admin/cache_tab_5.json";

echo file_get_contents($url);


?>
