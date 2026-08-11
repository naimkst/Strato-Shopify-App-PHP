<?php

if (isset($conn) && $conn instanceof mysqli && !$conn->connect_error) {
    $conn->set_charset('utf8mb4');
}
