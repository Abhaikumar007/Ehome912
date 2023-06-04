<?php
$imageUrl = $_GET['image'];

// Set the appropriate headers for the image download
header("Content-Type: application/octet-stream");
header("Content-Disposition: attachment; filename=image.png");

// Fetch the image from the remote server
readfile($imageUrl);
?>
