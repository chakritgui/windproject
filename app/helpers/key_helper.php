<?php
    function encryptToken($token, $key = key) {
		$iv = openssl_random_pseudo_bytes(16);
		$cipher = 'AES-256-CBC';
		$encrypted = openssl_encrypt($token, $cipher, $key, 0, $iv);
		return base64_encode($iv . $encrypted);
	}
	function decryptToken($encrypted_token, $key = key) {
		$cipher = 'AES-256-CBC';
		$data = base64_decode($encrypted_token);
		$iv = substr($data, 0, 16);
		$encrypted = substr($data, 16);
		return openssl_decrypt($encrypted, $cipher, $key, 0, $iv);
	}