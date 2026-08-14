<?php
/**
 * Shared helper functions
 */

function getClosedCategories($db) {
    $stmt = $db->query("SELECT category FROM category_status WHERE closed = 1");
    return $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
}

function paystackRequest($endpoint, $data = null) {
    $url = "https://api.paystack.co" . $endpoint;
    $ch  = curl_init($url);

    $headers = [
        'Authorization: Bearer ' . PAYSTACK_SECRET_KEY,
        'Content-Type: application/json'
    ];

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_CONNECTTIMEOUT => 10,
    ]);

    if ($data !== null) {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }

    $response = curl_exec($ch);
    $err      = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        return ['status' => false, 'message' => "cURL Error: $err"];
    }

    return json_decode($response, true);
}

function creditVoteIfPending($db, $ref) {
    $check = $db->prepare("SELECT * FROM payments WHERE reference = ? AND status = 'PENDING'");
    $check->execute([$ref]);

    if ($p = $check->fetch()) {
        $db->beginTransaction();
        try {
            $db->prepare("UPDATE payments SET status = 'SUCCESSFUL' WHERE reference = ?")
               ->execute([$ref]);
            $db->prepare("UPDATE contestants SET votes = votes + ? WHERE id = ?")
               ->execute([$p['vote_quantity'], $p['contestant_id']]);
            $db->commit();
        } catch (Exception $e) {
            $db->rollBack();
            error_log("creditVoteIfPending failed: " . $e->getMessage());
        }
    }
}

function jsonResponse(array $data) {
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}
