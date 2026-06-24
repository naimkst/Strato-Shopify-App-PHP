<?php
header('Content-Type: application/json');
require_once("functions.php");

// Get shop from query
$shopParam = $_GET['shop'] ?? null;
if (!$shopParam) {
    echo json_encode(["success" => false, "msg" => "No shop specified"]);
    exit;
}

// 🔹 If user passed full domain, strip ".myshopify.com"
$shop = preg_replace("/\.myshopify\.com$/", "", $shopParam);

// Load token (try both possible filenames)
$token = getShopToken($shop);
if (!$token) {
    $token = getShopToken($shop . ".myshopify.com");
}
if (!$token) {
    echo json_encode(["success" => false, "msg" => "No token found for shop"]);
    exit;
}

// Dummy product
$product = [
  "product" => [
    "title" => "Dummy Fensterkonfigurator Test " . date("Y-m-d H:i:s"),
    "status" => "draft",
    "body_html" => "<p>This is a test product created from PHP app.</p>",
    "variants" => [[
      "price" => "123.45",
      "inventory_management" => "shopify",
      "inventory_quantity" => 1
    ]]
  ]
];

// Call Shopify
$response = shopify_call(
    $token,
    $shop, // still just "yourstore" (shopify_call will append .myshopify.com)
    "/admin/api/2024-07/products.json",
    $product,
    "POST"
);

if (!empty($response['response'])) {
    $respData = json_decode($response['response'], true);
    if (isset($respData['product']['id'])) {
        echo json_encode([
            "success" => true,
            "productId" => $respData['product']['id'],
            "variantId" => $respData['product']['variants'][0]['id'],
            "title" => $respData['product']['title']
        ]);
        exit;
    }
}

echo json_encode(["success" => false, "msg" => "Shopify API error", "raw" => $response]);
