# UGDE-JCR Voting Platform (Modular Version)

## Structure

```
/
├── config.php              # App constants + Paystack keys + session settings
├── helpers.php             # Shared functions (Paystack, credit votes, etc.)
├── index.php               # Thin entry point
├── db.php                  # ← KEEP YOUR EXISTING db.php
├── api/
│   └── router.php          # All API endpoints
├── views/
│   ├── header.php
│   ├── footer.php
│   ├── voting.php
│   ├── register.php
│   ├── admin-login.php
│   ├── admin-dashboard.php
│   ├── candidate-login.php
│   ├── candidate-dashboard.php
│   └── modals.php
└── assets/
    ├── css/
    │   └── app.css
    └── js/
        └── app.js
```

## Setup Instructions

1. Upload the entire folder to your server.
2. **Copy your existing `db.php`** into this folder (do not overwrite it).
3. Edit `config.php` and put your real Paystack Secret Key + Split Code.
4. Make sure the `uploads/` folder is writable (`chmod 755` or `775`).
5. Point your domain/document root to this folder.

## Improvements included

- Fully modular (no more 78KB single file)
- Session regeneration on login (fixes intermittent admin login failures)
- Payment History now has a **search bar** (by reference, email, name, or candidate ID)
- Debounced search + server-side filtering
- Auto-refresh only runs when the tab is visible
- cURL timeouts added (prevents hanging)
- Safer transaction handling in `creditVoteIfPending`

## Important

Replace the placeholder keys in `config.php`:

```php
define('PAYSTACK_SECRET_KEY', 'sk_live_xxxxxxxx');
define('PAYSTACK_SPLIT_CODE', 'SPL_xxxxxxxx');
```
