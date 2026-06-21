<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: text/html');

$url = $_GET['url'] ?? 'https://duckduckgo.com';

if (isset($_GET['encoded'])) {
    $url = base64_decode($url);
}

if (filter_var($url, FILTER_VALIDATE_URL)) {
    echo file_get_contents($url);
} else {
    echo 'Invalid URL';
}
?>
