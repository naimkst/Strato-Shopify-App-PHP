<?php
$ch = curl_init("https://www.howsmyssl.com/a/check");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
if (curl_errno($ch)) {
    echo "CURL ERROR: " . curl_error($ch);
} else {
    $data = json_decode($response, true);
    echo "Your PHP/cURL supports: " . $data['tls_version'];
}
curl_close($ch);
