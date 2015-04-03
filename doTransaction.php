<?php
require_once '../lib/Braintree.php';

Braintree_Configuration::environment('sandbox');
Braintree_Configuration::merchantId('');
Braintree_Configuration::publicKey('');
Braintree_Configuration::privateKey('');

$total = $_POST['amount'];
$ccnum = $_POST['cc_num'];
$exp = $_POST['expire_m'] . '/' . $_POST['expire_y'];

$result = Braintree_Transaction::sale(array(
    'amount' => $total,
    'creditCard' => array(
        'number' => $ccnum,
        'expirationDate' => $exp
    )
));

if ($result->success) {
    echo ("success");
} else if ($result->transaction) {
    echo ("Error processing transaction.");
} else {
    echo ("Validation errors.");
}

?>
