<?php

function shopify_call($token, $shop, $api_endpoint, $query = array(), $method = 'GET', $request_headers = array()) {
    
    // Build URL
    $url = "https://" . $shop . ".myshopify.com" . $api_endpoint;
    if (!is_null($query) && in_array($method, array('GET', 'DELETE'))) {
        $url = $url . "?" . http_build_query($query);
    }

    // Configure cURL
    $curl = curl_init($url);
    curl_setopt($curl, CURLOPT_HEADER, TRUE);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
    curl_setopt($curl, CURLOPT_FOLLOWLOCATION, TRUE);
    curl_setopt($curl, CURLOPT_MAXREDIRS, 3);
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, TRUE); // verify SSL
    curl_setopt($curl, CURLOPT_USERAGENT, 'My New Shopify App v.1');
    curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, 30);
    curl_setopt($curl, CURLOPT_TIMEOUT, 30);
    curl_setopt($curl, CURLOPT_CUSTOMREQUEST, $method);

    // ✅ Force TLS 1.2 for Shopify
    //curl_setopt($curl, CURLOPT_SSLVERSION, CURL_SSLVERSION_TLSv1_2);

    // Setup headers
    $headers = [];
    $headers[] = "Content-Type: application/json";
    if (!is_null($token)) {
        $headers[] = "X-Shopify-Access-Token: " . $token;
    }
    if (!empty($request_headers)) {
        $headers = array_merge($headers, $request_headers);
    }
    curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);

    // Handle POST/PUT body
    if ($method != 'GET' && in_array($method, array('POST', 'PUT'))) {
        if (is_array($query)) {
            $query = json_encode($query); // Shopify expects JSON
        }
        curl_setopt($curl, CURLOPT_POSTFIELDS, $query);
    }
    
    // Send request to Shopify
    $response = curl_exec($curl);
    $error_number = curl_errno($curl);
    $error_message = curl_error($curl);

    curl_close($curl);

    // Error handling
    if ($error_number) {
        return [
            'headers' => [],
            'response' => null,
            'error' => $error_message
        ];
    } else {
        // Split headers and body
        $response = preg_split("/\r\n\r\n|\n\n|\r\r/", $response, 2);

        // Parse headers
        $headers = [];
        $header_data = explode("\n", $response[0]);
        $headers['status'] = $header_data[0];
        array_shift($header_data);
        foreach ($header_data as $part) {
            $h = explode(":", $part, 2);
            if (count($h) == 2) {
                $headers[trim($h[0])] = trim($h[1]);
            }
        }

        return [
            'headers'  => $headers,
            'response' => $response[1]
        ];
    }
}

function getShopToken($shop) {
    $file = __DIR__ . "/tokens/$shop.txt";
    return file_exists($file) ? trim(file_get_contents($file)) : null;
}

?>
