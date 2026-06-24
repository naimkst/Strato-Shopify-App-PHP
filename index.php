<?php

header("Content-Security-Policy: frame-ancestors https://*.myshopify.com https://admin.shopify.com");

 $shop = $_GET['shop'];
$api_key = "eb7c671497f783469d0ef11d84129061";
$scopes = "read_products,write_products,read_orders,write_orders,write_products,read_themes,write_themes,write_script_tags,read_content,write_content";

$redirect_uri = "https://droplify.de/deine-fenster24/generate_token.php";

// Build install/approval URL to redirect to
$install_url = "https://" . $shop . "/admin/oauth/authorize?client_id=" . $api_key . "&scope=" . $scopes . "&redirect_uri=" . urlencode($redirect_uri);

// Redirect
header("Location: " . $install_url);

die();