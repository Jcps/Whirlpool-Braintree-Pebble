<?php 
$request = 'pebblejs://close?cardnumber=' . $_POST['cc_num'] . '&exp_m=' . $_POST['expire_m'] . '&exp_y=' . $_POST['expire_y'];

echo '<a href=\'' . $request . '\'>Close!</a>';

?>