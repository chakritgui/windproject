<?php
class AgentHelper {
    private $db;
    public function __construct($db) {
        $this->db = $db;
    }
    public function parse_user_agent($ua) {
        $browser = "Unknown Browser";
        $platform = "Unknown OS";
        if (preg_match('/iphone/i', $ua)) {
            $platform = 'iPhone (iOS)';
        } else if (preg_match('/ipad/i', $ua)) {
            $platform = 'iPad (iOS)';
        } else if (preg_match('/android/i', $ua)) {
            $platform = 'Android';
        } else if (preg_match('/windows|win32/i', $ua)) {
            $platform = 'Windows';
        } else if (preg_match('/macintosh|mac os x/i', $ua)) {
            $platform = 'Mac OS';
        } else if (preg_match('/linux/i', $ua)) {
            $platform = 'Linux';
        }
        if (preg_match('/chrome/i', $ua) && !preg_match('/edg/i', $ua)) {
            $browser = 'Chrome';
        } else if (preg_match('/firefox/i', $ua)) {
            $browser = 'Firefox';
        } else if (preg_match('/safari/i', $ua) && !preg_match('/chrome/i', $ua)) {
            $browser = 'Safari';
        } else if (preg_match('/msie|trident/i', $ua)) {
            $browser = 'IE';
        } else if (preg_match('/edg/i', $ua)) {
            $browser = 'Edge';
        }
        return ['os' => $platform, 'browser' => $browser];
    }
}