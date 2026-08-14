<?php
/**
 * UGDE-JCR Voting Platform - Entry Point
 */

// Session settings MUST come before session_start()
ini_set('session.cookie_httponly', 1);
ini_set('session.use_strict_mode', 1);
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'secure'   => isset($_SERVER['HTTPS']),
    'httponly' => true,
    'samesite' => 'Lax'
]);

session_start();

require_once 'config.php';
require_once 'db.php';
require_once 'helpers.php';

// ... rest of the file stays the same
$db = getDB();

// Lightweight one-time migrations
try {
    $db->exec("CREATE TABLE IF NOT EXISTS category_status (
        category VARCHAR(150) PRIMARY KEY,
        closed TINYINT(1) NOT NULL DEFAULT 0
    )");
} catch (Exception $e) {}

try {
    $db->exec("ALTER TABLE contestants ADD COLUMN category VARCHAR(150) DEFAULT NULL");
} catch (Exception $e) {}

// API router
if (isset($_GET['api'])) {
    require 'api/router.php';
    exit;
}

$closedCategoriesNow = getClosedCategories($db);
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?php echo APP_NAME; ?></title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/app.css?v=1">
</head>
<body>

  <div id="toastStack" aria-live="polite" aria-atomic="true"></div>

  <?php require 'views/header.php'; ?>

  <main class="container">
    <?php require 'views/voting.php'; ?>
    <?php require 'views/register.php'; ?>
    <?php require 'views/admin-login.php'; ?>
    <?php require 'views/admin-dashboard.php'; ?>
    <?php require 'views/candidate-login.php'; ?>
    <?php require 'views/candidate-dashboard.php'; ?>
  </main>

  <?php require 'views/modals.php'; ?>
  <?php require 'views/footer.php'; ?>

  <button id="backToTopBtn" aria-label="Back to top">↑</button>

  <script>
    const CATEGORIES = <?php echo json_encode(CATEGORIES); ?>;
    let CLOSED_NOMINATION_CATEGORIES = <?php echo json_encode($closedCategoriesNow); ?>;
  </script>
  <script src="assets/js/app.js?v=1"></script>
</body>
</html>
