<?php
require '../functions.php';

$shop = $_GET['shop'] ?? '';
$token = getShopToken($shop);

if (!$shop || !$token) {
  echo "Shop or token missing";
  exit;
}

$heading = $_POST['heading'] ?? '';

$data = [
  'metafield' => [
    'namespace' => 'app_block',
    'key' => 'heading',
    'value' => $heading,
    'type' => 'single_line_text_field'
  ]
];

$ch = curl_init("https://$shop/admin/api/2024-04/metafields.json");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  "X-Shopify-Access-Token: $token",
  "Content-Type: application/json"
]);

$response = curl_exec($ch);
curl_close($ch);

echo "Heading saved successfully!";





