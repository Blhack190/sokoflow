<?php
/**
 * API Router - all endpoints
 */

header('Content-Type: application/json');

switch ($_GET['api']) {

    case 'get_category_status':
        echo json_encode(['success' => true, 'closed' => getClosedCategories($db)]);
        exit;

    case 'get_public_contestants':
        $stmt = $db->query("SELECT id, nominee_code, name, dept, category, image_path, bio FROM contestants WHERE approved = 1 ORDER BY category ASC, nominee_code ASC");
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll(), 'categories' => CATEGORIES]);
        exit;

    case 'candidate_register':
        $category = trim($_POST['category'] ?? '');
        if (!in_array($category, CATEGORIES, true)) {
            echo json_encode(['success' => false, 'message' => 'Please select a valid category.']);
            exit;
        }
        if (in_array($category, getClosedCategories($db), true)) {
            echo json_encode(['success' => false, 'message' => 'Nominations for "' . $category . '" are closed.']);
            exit;
        }

        if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            echo json_encode(['success' => false, 'message' => 'No image uploaded or upload error.']);
            exit;
        }
        $file = $_FILES['image'];
        if ($file['size'] > 5 * 1024 * 1024) {
            echo json_encode(['success' => false, 'message' => 'Image too large (max 5MB).']);
            exit;
        }

        $allowedTypes = [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_GIF, IMAGETYPE_WEBP];
        if (function_exists('exif_imagetype')) {
            $imageType = @exif_imagetype($file['tmp_name']);
        } else {
            $info = @getimagesize($file['tmp_name']);
            $imageType = $info ? $info[2] : false;
        }
        if ($imageType === false || !in_array($imageType, $allowedTypes, true)) {
            echo json_encode(['success' => false, 'message' => 'Invalid image format. Allowed: JPG, PNG, GIF, WEBP.']);
            exit;
        }
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        if (!in_array($ext, $allowedExts, true)) {
            echo json_encode(['success' => false, 'message' => 'Invalid file extension.']);
            exit;
        }

        do {
            $letters = chr(rand(65, 90)) . chr(rand(65, 90));
            $digits  = str_pad(rand(0, 999), 3, '0', STR_PAD_LEFT);
            $nomineeCode = $letters . $digits;
            $check = $db->prepare("SELECT id FROM contestants WHERE nominee_code = ?");
            $check->execute([$nomineeCode]);
        } while ($check->fetch());

        $uploadDir = 'uploads/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

        $targetPath = $uploadDir . "nominee_" . time() . "_" . bin2hex(random_bytes(4)) . "." . $ext;

        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $passHash = password_hash($_POST['password'], PASSWORD_BCRYPT);
            $stmt = $db->prepare("INSERT INTO contestants (nominee_code, number, name, dept, category, image_path, bio, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$nomineeCode, '0'.rand(1,9), $_POST['name'], $_POST['dept'], $category, $targetPath, $_POST['bio'], $passHash]);
            echo json_encode(['success' => true, 'message' => "Application Submitted! Code: $nomineeCode"]);
        } else {
            echo json_encode(['success' => false, 'message' => "Upload failed."]);
        }
        exit;

    case 'vote_init':
        $data = json_decode(file_get_contents('php://input'), true);
        $quantity = max(1, (int)($data['quantity'] ?? 1));
        $amountGhs = $quantity * UNIT_PRICE_PER_VOTE;
        $amountPesewas = (int)round($amountGhs * 100);

        if (empty($data['email'])) {
            echo json_encode(['success' => false, 'message' => 'Email address is required for payment.']);
            exit;
        }

        $reference = 'VOTE_' . time() . '_' . rand(1000, 9999);
        $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? "https" : "http";
        $callbackUrl = "$protocol://$_SERVER[HTTP_HOST]$_SERVER[PHP_SELF]?api=paystack_callback";

        $payload = [
            'email'        => $data['email'],
            'amount'       => $amountPesewas,
            'currency'     => 'GHS',
            'reference'    => $reference,
            'callback_url' => $callbackUrl,
            'split_code'   => PAYSTACK_SPLIT_CODE,
            'metadata'     => [
                'contestant_id' => $data['contestantId'],
                'voter_name'    => $data['name'] ?? '',
                'voter_phone'   => $data['phone'] ?? '',
                'quantity'      => $quantity
            ]
        ];

        $res = paystackRequest('/transaction/initialize', $payload);

        if (!empty($res['status']) && !empty($res['data']['authorization_url'])) {
            $stmt = $db->prepare("INSERT INTO payments (reference, voter_name, voter_email, contestant_id, vote_quantity, amount_paid, status) VALUES (?, ?, ?, ?, ?, ?, 'PENDING')");
            $stmt->execute([$reference, $data['name'] ?? 'Anonymous', $data['email'], $data['contestantId'], $quantity, $amountGhs]);

            echo json_encode([
                'success' => true,
                'authorization_url' => $res['data']['authorization_url'],
                'reference' => $reference
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => $res['message'] ?? 'Unable to initialize Paystack payment.']);
        }
        exit;

    case 'paystack_callback':
        $ref = $_GET['reference'] ?? $_GET['trxref'] ?? '';
        if ($ref) {
            $res = paystackRequest('/transaction/verify/' . rawurlencode($ref));
            if (!empty($res['status']) && isset($res['data']['status']) && $res['data']['status'] === 'success') {
                creditVoteIfPending($db, $ref);
                header("Location: index.php?status=success");
                exit;
            }
        }
        header("Location: index.php?status=failed");
        exit;

    case 'paystack_webhook':
        $input = file_get_contents('php://input');
        $signature = $_SERVER['HTTP_X_PAYSTACK_SIGNATURE'] ?? '';
        $computed = hash_hmac('sha512', $input, PAYSTACK_SECRET_KEY);

        if (!$signature || !hash_equals($computed, $signature)) {
            http_response_code(400);
            exit();
        }

        $event = json_decode($input, true);
        if ($event && isset($event['event']) && $event['event'] === 'charge.success') {
            $ref = $event['data']['reference'] ?? null;
            if ($ref) {
                creditVoteIfPending($db, $ref);
            }
        }

        http_response_code(200);
        echo json_encode(['received' => true]);
        exit;

    case 'admin_login':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $db->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$data['username'] ?? '']);
        $u = $stmt->fetch();
        if ($u && password_verify($data['password'] ?? '', $u['password_hash'])) {
            session_regenerate_id(true);
            $_SESSION['admin_user'] = $u['username'];
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid Login']);
        }
        exit;

    case 'approve_candidate':
        if (!isset($_SESSION['admin_user'])) {
            echo json_encode(['success' => false, 'message' => 'Not authenticated']);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        $db->prepare("UPDATE contestants SET approved = 1 WHERE id = ?")->execute([$data['id']]);
        echo json_encode(['success' => true]);
        exit;

    case 'delete_candidate':
        if (!isset($_SESSION['admin_user'])) {
            echo json_encode(['success' => false, 'message' => 'Not authenticated']);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        $id = (int)($data['id'] ?? 0);
        if (!$id) {
            echo json_encode(['success' => false, 'message' => 'Invalid ID']);
            exit;
        }

        $stmt = $db->prepare("SELECT image_path FROM contestants WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        $del = $db->prepare("DELETE FROM contestants WHERE id = ?");
        $del->execute([$id]);

        if ($del->rowCount() > 0) {
            if ($row && !empty($row['image_path']) && is_file($row['image_path'])) {
                @unlink($row['image_path']);
            }
            echo json_encode(['success' => true, 'message' => 'Candidate removed.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Candidate not found.']);
        }
        exit;

    case 'admin_get_full_data':
        if (!isset($_SESSION['admin_user'])) {
            echo json_encode(['success' => false, 'message' => 'Not authenticated']);
            exit;
        }
        $stmtC = $db->query("SELECT * FROM contestants ORDER BY category ASC, votes DESC");
        $totalVotes = $db->query("SELECT SUM(votes) FROM contestants")->fetchColumn() ?: 0;
        echo json_encode([
            'success'      => true,
            'contestants'  => $stmtC->fetchAll(),
            'totalVotes'   => (int)$totalVotes,
            'totalRevenue' => $totalVotes * UNIT_PRICE_PER_VOTE,
            'categories'   => CATEGORIES
        ]);
        exit;

    case 'admin_get_candidate_details':
        if (!isset($_SESSION['admin_user'])) {
            echo json_encode(['success' => false, 'message' => 'Not authenticated']);
            exit;
        }
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) {
            echo json_encode(['success' => false, 'message' => 'Invalid ID']);
            exit;
        }
        $stmt = $db->prepare("SELECT * FROM contestants WHERE id = ?");
        $stmt->execute([$id]);
        $candidate = $stmt->fetch();
        if ($candidate) {
            echo json_encode(['success' => true, 'candidate' => $candidate]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Candidate not found']);
        }
        exit;

    case 'admin_change_password':
        if (!isset($_SESSION['admin_user'])) {
            echo json_encode(['success' => false, 'message' => 'Not authenticated']);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        $hash = password_hash($data['new_password'], PASSWORD_BCRYPT);
        $db->prepare("UPDATE users SET password_hash = ? WHERE username = ?")->execute([$hash, $_SESSION['admin_user']]);
        echo json_encode(['success' => true, 'message' => 'Password Updated!']);
        exit;

    case 'admin_reset_candidate_password':
        if (!isset($_SESSION['admin_user'])) {
            echo json_encode(['success' => false, 'message' => 'Not authenticated']);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        $code = trim($data['code'] ?? '');
        $newPass = trim($data['new_password'] ?? '');
        if (empty($code) || strlen($newPass) < 4) {
            echo json_encode(['success' => false, 'message' => 'Invalid code or password too short (min 4 chars).']);
            exit;
        }
        $hash = password_hash($newPass, PASSWORD_BCRYPT);
        $stmt = $db->prepare("UPDATE contestants SET password_hash = ? WHERE nominee_code = ?");
        $stmt->execute([$hash, $code]);
        if ($stmt->rowCount()) {
            echo json_encode(['success' => true, 'message' => "Password reset for $code"]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Candidate not found.']);
        }
        exit;

    case 'admin_get_categories':
        if (!isset($_SESSION['admin_user'])) {
            echo json_encode(['success' => false, 'message' => 'Not authenticated']);
            exit;
        }
        $closed = getClosedCategories($db);
        $list = array_map(function($cat) use ($closed) {
            return ['category' => $cat, 'closed' => in_array($cat, $closed, true)];
        }, CATEGORIES);
        echo json_encode(['success' => true, 'categories' => $list]);
        exit;

    case 'admin_toggle_category':
        if (!isset($_SESSION['admin_user'])) {
            echo json_encode(['success' => false, 'message' => 'Not authenticated']);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        $category = trim($data['category'] ?? '');
        if (!in_array($category, CATEGORIES, true)) {
            echo json_encode(['success' => false, 'message' => 'Invalid category.']);
            exit;
        }
        $isClosed = in_array($category, getClosedCategories($db), true);
        if ($isClosed) {
            $db->prepare("DELETE FROM category_status WHERE category = ?")->execute([$category]);
            $nowClosed = false;
        } else {
            $upd = $db->prepare("UPDATE category_status SET closed = 1 WHERE category = ?");
            $upd->execute([$category]);
            if ($upd->rowCount() === 0) {
                $db->prepare("INSERT INTO category_status (category, closed) VALUES (?, 1)")->execute([$category]);
            }
            $nowClosed = true;
        }
        echo json_encode(['success' => true, 'category' => $category, 'closed' => $nowClosed]);
        exit;

    case 'admin_get_payments':
        if (!isset($_SESSION['admin_user'])) {
            echo json_encode(['success' => false, 'message' => 'Not authenticated']);
            exit;
        }
        $search = trim($_GET['search'] ?? '');
        if ($search !== '') {
            $stmt = $db->prepare("SELECT * FROM payments 
                WHERE reference LIKE ? OR voter_email LIKE ? OR voter_name LIKE ? OR CAST(contestant_id AS CHAR) LIKE ?
                ORDER BY created_at DESC LIMIT 300");
            $like = '%' . $search . '%';
            $stmt->execute([$like, $like, $like, $like]);
        } else {
            $stmt = $db->query("SELECT * FROM payments ORDER BY created_at DESC LIMIT 300");
        }
        $payments = $stmt->fetchAll();
        echo json_encode(['success' => true, 'payments' => $payments]);
        exit;

    case 'candidate_login':
        $data = json_decode(file_get_contents('php://input'), true);
        $code = trim($data['code'] ?? '');
        $pass = $data['password'] ?? '';
        if (empty($code) || empty($pass)) {
            echo json_encode(['success' => false, 'message' => 'Code and password required.']);
            exit;
        }
        $stmt = $db->prepare("SELECT * FROM contestants WHERE nominee_code = ? AND approved = 1");
        $stmt->execute([$code]);
        $candidate = $stmt->fetch();
        if ($candidate && password_verify($pass, $candidate['password_hash'])) {
            session_regenerate_id(true);
            $_SESSION['candidate_id']   = $candidate['id'];
            $_SESSION['candidate_code'] = $candidate['nominee_code'];
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid code or password, or not approved.']);
        }
        exit;

    case 'candidate_get_data':
        if (!isset($_SESSION['candidate_id'])) {
            echo json_encode(['success' => false, 'message' => 'Not logged in.']);
            exit;
        }
        $stmt = $db->prepare("SELECT * FROM contestants WHERE id = ?");
        $stmt->execute([$_SESSION['candidate_id']]);
        $cand = $stmt->fetch();
        if (!$cand) {
            echo json_encode(['success' => false, 'message' => 'Candidate not found.']);
            exit;
        }
        $stmtCat = $db->prepare("SELECT SUM(votes) FROM contestants WHERE category = ?");
        $stmtCat->execute([$cand['category']]);
        $totalVotesCat = (int)($stmtCat->fetchColumn() ?: 0);

        echo json_encode([
            'success' => true,
            'candidate' => $cand,
            'totalVotesInCategory' => $totalVotesCat
        ]);
        exit;

    case 'candidate_logout':
        unset($_SESSION['candidate_id'], $_SESSION['candidate_code']);
        echo json_encode(['success' => true]);
        exit;

    default:
        echo json_encode(['success' => false, 'message' => 'Unknown API endpoint']);
        exit;
}
