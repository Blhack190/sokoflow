<?php
/**
 * UGDE-JCR Voting Platform - Configuration
 */

define('APP_NAME', 'UGDE-JCR Official Electoral Voting Portal');
define('UNIT_PRICE_PER_VOTE', 1.00);

define('CATEGORIES', [
    'Most Influential Student of the Year',
    'Student Entrepreneur of the Year',
    'Outstanding JCR Executive',
    'Most Popular Male of the Year',
    'Most Popular Female of the Year',
    'Most Fashionable Student of the Year',
    'Best Student Politician',
    'Best Level 100 Course Rep',
    'Best Level 200 Course Rep',
    'Best Level 300 Course Rep',
    'Best Level 400 Course Rep',
    'Student Activist of the Year',
    'Best Department in UG-DE',
    'Face of DE',
]);

// IMPORTANT: Move these to environment variables in production
define('PAYSTACK_SECRET_KEY', 'sk_live_xxxxxxxxxxxxx');
define('PAYSTACK_SPLIT_CODE', 'SPL_xxxxxxxxxxxxxxx');