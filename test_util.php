<?php

include 'util.php';
$testResults = NEW_LINE_LOG . '-- Test results --';

runUnitTests();

function runUnitTests() {
	logTestMessage("Starting unit tests for PHP-server ...");
	unlink(CONFIG_FILE);
	if (preg_match('/br/i', NEW_LINE_LOG)) {
		logTestMessage("These automated tests overwrite and REMOVE two users named eUser and dUser");
		removeDir(USER_DIR . DIRECTORY_SEPARATOR . 'dUser'); // including files
		removeDir(USER_DIR . DIRECTORY_SEPARATOR . 'eUser'); // including files
	} else {
		logTestMessage("!!! The tests will REMOVE ALL USERS !!! > Check the global variable NEW_LINE_LOG");
		test_clean();
	}
	if (!test_checkUser()) {
		logTestMessage('!!! User tests failed.');
		logResultMessage();
		return;
	}
	if (!test_getTimeFormatGuessed()) {
		logTestMessage('!!! Guess time format tests failed.');
		logResultMessage();
		return;
	}
	if (!test_findDateTime()) {
		logTestMessage('!!! Guess time format tests failed.');
		logResultMessage();
		return;
	}
	if (!test_writeGroupFile()) {
		logTestMessage('!!! Write group file tests failed.');
		logResultMessage();
		return;
	}
	if (!test_writePostion()) {
		logTestMessage('!!! Write positions tests failed.');
		logResultMessage();
		return;
	}
	if (!test_getDateForTimezoneOffset()) {
		logTestMessage('!!! Get time with timezone offset tests failed.');
		logResultMessage();
		return;
	}
	if (!test_writeConfigFile()) {
		logTestMessage('!!! Write config file tests failed.');
		logResultMessage();
		return;
	}
	logResultMessage();
}

function test_clean() {
	logTestMessage(NEW_LINE_LOG . " >> Cleanup all test users...");
	removeDir(USER_DIR); // including files
	logTestMessage("End cleanup");
}

function test_checkUser() {
	appendTestMessage(NEW_LINE_LOG . ">> Test user actions..." . NEW_LINE_LOG);
	// New user empty
	appendTestMessage("Test new empty user");
	$ret = checkUser("", "");
	if (!$ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	// New user blank
	appendTestMessage("Test new blank user");
	$ret = checkUser(" ", "");
	if (!$ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	// New user format not accepted
	appendTestMessage("Test new user, format not accepted");
	$ret = checkUser("a user", "");
	if (!$ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	// New user, blank password
	appendTestMessage("Test new user, blank password");
	$ret = checkUser("aUser", "");
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	// user, wrong password
	appendTestMessage("user, wrong password");
	$ret = checkUser("aUser", "wrong");
	if (!$ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	// user, password
	appendTestMessage("user, password ok");
	$ret = checkUser("aUser", "");
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	// user login accepted
	appendTestMessage("user login accepted");
	$ret = isUserAccepted("aUser", "");
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	// user login not accepted
	appendTestMessage("user login not accepted");
	$ret = isUserAccepted("aUser", "wrongpassword");
	if (!$ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	// user name login not accepted
	appendTestMessage("user name for login not accepted");
	$ret = isUserAccepted("wronguser", "wrongpassword");
	if (!$ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	// change password wrong password
	appendTestMessage("Change password but wrong old password");
	$ret = changePassword("aUser", "wrong", "xyz");
	if (!$ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	// change password
	appendTestMessage("Change password");
	$ret = changePassword("aUser", "", "newpassword");
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	// remove not existing user
	appendTestMessage("Remove not existing user");
	$ret = removeUser("bUser", "p");
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	// remove existing user
	appendTestMessage("Remove existing user");
	$ret = removeUser("aUser", "newpassword");
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	// Is admin
	appendTestMessage("Is eUser the admin?");
	$ret = isAdmin('eUser');
	if (!$ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	// Is admin
	appendTestMessage("Is admin the admin?");
	$ret = isAdmin('admin');
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	// Is admin
	appendTestMessage("Is AdMin the admin?");
	$ret = isAdmin('AdMin');
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	return true;
}

function test_writeGroupFile() {
	appendTestMessage(NEW_LINE_LOG . " >> Tests writing of group file..." . NEW_LINE_LOG);
	appendTestMessage("Prepare: Create new user");
	$ret = checkUser("cUser", "cPassword");
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("New group for user");
	$ret = writeGroupFile("cUser", "cGroup");
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("Same group for user");
	$ret = writeGroupFile("cUser", "cGroup");
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("Changed group for user");
	$ret = writeGroupFile("cUser", "changedGroup");
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("Cleanup this test method: Remove existing user");
	$ret = removeUser("cUser", "cPassword");
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	return true;
}

function test_writeConfigFile() {
	appendTestMessage(NEW_LINE_LOG . " >> Tests writing of config file..." . NEW_LINE_LOG);
	appendTestMessage("No config: User = admin, key = timezone_offset_minutes");
	$ret = getConfiguration(ADMIN_NAME, CONFIG_KEY_TIMEZONE_OFFSET_MINUTES, true);
	if (isNullOrEmptyString($ret)) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("No config: User = cUser, key = timezone_offset_minutes");
	$ret = getConfiguration('cUser', CONFIG_KEY_TIMEZONE_OFFSET_MINUTES, true);
	if (isNullOrEmptyString($ret)) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("Delete missing config file: User = cUser");
	$ret = resetConfig('cUser');
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("Delete missing config file: User = admin");
	$ret = resetConfig(ADMIN_NAME);
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("Set config: User = admin, , key = timezone_offset_minutes (set server)");
	$ret = setConfiguration(ADMIN_NAME, CONFIG_KEY_TIMEZONE_OFFSET_MINUTES, '10');
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("Get config: User = admin, key = timezone_offset_minutes");
	$ret = getConfiguration(ADMIN_NAME, CONFIG_KEY_TIMEZONE_OFFSET_MINUTES, true);
	if ($ret == '10') {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("Get config: User = cUser, key = timezone_offset_minutes");
	$ret = getConfiguration('cUser', CONFIG_KEY_TIMEZONE_OFFSET_MINUTES, false);
	if ($ret == '') {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("Get config: User = cUser, key = timezone_offset_minutes");
	$ret = getConfiguration('cUser', CONFIG_KEY_TIMEZONE_OFFSET_MINUTES, true);
	if ($ret == '10') {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Set config: User = dUser, key = track_expiration_days (set user and server)");
	$ret = setConfiguration('dUser', CONFIG_KEY_TRACK_EXPIRATION_DAYS, 'aa');
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("Get config: User = admin, key = timezone_offset_minutes");
	$ret = getConfiguration(ADMIN_NAME, CONFIG_KEY_TIMEZONE_OFFSET_MINUTES, true);
	if ($ret == '10') {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("Get config: User = admin, key = track_expiration_days");
	$ret = getConfiguration(ADMIN_NAME, CONFIG_KEY_TRACK_EXPIRATION_DAYS, true);
	if ($ret == 'aa') {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("Get config: User = dUser, key = timezone_offset_minutes");
	$ret = getConfiguration('dUser', CONFIG_KEY_TIMEZONE_OFFSET_MINUTES, true);
	if ($ret == '10') {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("Get config: User = dUser, key = track_expiration_days");
	$ret = getConfiguration('dUser', CONFIG_KEY_TRACK_EXPIRATION_DAYS, true);
	if ($ret == 'aa') {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Set config: User = admin, , key = track_expiration_days (set server only)");
	$ret = setConfiguration(ADMIN_NAME, CONFIG_KEY_TRACK_EXPIRATION_DAYS, '15');
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("Set config: User = dUser, , key = track_expiration_days (set user only)");
	$ret = setConfiguration('dUser', CONFIG_KEY_TRACK_EXPIRATION_DAYS, 'dd');
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("Get config: User = admin, key = timezone_offset_minutes");
	$ret = getConfiguration(ADMIN_NAME, CONFIG_KEY_TIMEZONE_OFFSET_MINUTES, true);
	if ($ret == '10') {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("Get config: User = admin, key = track_expiration_days");
	$ret = getConfiguration(ADMIN_NAME, CONFIG_KEY_TRACK_EXPIRATION_DAYS, true);
	if ($ret == '15') {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("Get config: User = dUser, key = timezone_offset_minutes");
	$ret = getConfiguration('dUser', CONFIG_KEY_TIMEZONE_OFFSET_MINUTES, true);
	if ($ret == '10') {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("Get config: User = dUser, key = track_expiration_days");
	$ret = getConfiguration('dUser', CONFIG_KEY_TRACK_EXPIRATION_DAYS, true);
	if ($ret == 'dd') {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Set config en bloc: User = dUser, track_expiration_days=0, timezone_offset_minutes=-60");
	$param = CONFIG_KEY_TRACK_EXPIRATION_DAYS . '=0' . PHP_EOL . CONFIG_KEY_TIMEZONE_OFFSET_MINUTES . '=-60';
	$ret = setConfigurationEnBloc('dUser', $param);
	if (ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("Get config: User = dUser, key = track_expiration_days = 0");
	$ret = getConfiguration('dUser', CONFIG_KEY_TRACK_EXPIRATION_DAYS, true);
	if ($ret == '0') {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("Get config: User = dUser, key = timezone_offset_minutes = -60");
	$ret = getConfiguration('dUser', CONFIG_KEY_TIMEZONE_OFFSET_MINUTES, true);
	if ($ret == '-60') {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	//---------
	// Test the cleanup
	
	cleanUp('eUser');
	appendTestMessage("User dir 'eUser' is there after clean up for 'eUser' that has an expiration time of 15 days");
	$dirToOld = USER_DIR . DIRECTORY_SEPARATOR . 'eUser';
	if (is_dir($dirToOld)) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("User dir 'dUser' was removed by the clean up for 'dUser' that has an expiration time of 0 days.");
	$dirToOld = USER_DIR . DIRECTORY_SEPARATOR . 'dUser';
	if (!is_dir($dirToOld)) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Remove test users");
	$ret = removeTestUsers();
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	resetConfig(ADMIN_NAME);

	return true;
}

function test_writePostion() {
	appendTestMessage(NEW_LINE_LOG . " >> Tests writing of single position..." . NEW_LINE_LOG);
	appendTestMessage("Prepare: Create new user");
	$ret = checkUser("dUser", "dPassword");
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("Check parameter lat");
	$ret = writePostion('', '', '', '', '', '', '', '', '', '');
	if (!$ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("Check parameter lon");
	$ret = writePostion('', '', '47.50457163540115', '', '', '', '', '', '', '');
	if (!$ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("Prepare: Create new user");
	$ret = checkUser("dUser", "dPassword");
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Get tracks (individually 1) for user (no positions yet)");
	$ret = getLastPostionsAndTracksIndividually('');
	if (isNullOrEmptyString($ret)) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Get tracks (individually 2) for user (no positions yet)");
	$ret = getLastPostionsAndTracksIndividually('dUser');
	if (isNullOrEmptyString($ret)) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Get tracks (individually 3) for user (no positions yet)");
	$ret = getLastPostionsAndTracksIndividually('dUser=2013-03-03 15:48:47.484', 'true');
	if (isNullOrEmptyString($ret)) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Test helper function to write the postion.csv > new");
	$ret = writePositionFile('dUser', 'test;test;test');
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	$testDateTime = getDateForTimezoneOffset('dUser', '', false);
	appendTestMessage("Write single position");
	$csvLine = 'lat=47.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=' . $testDateTime;
	$ret = writePositionFile('dUser', $csvLine);
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Write lat and lon");
	$ret = writePostion('dUser', '', '42.50457163540115', '11.071390274487026', '', '', '', '', '2012-03-03T15:48:47.484', 'true');
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Get tracks (individually 1) for user  (one position yet) no track for today");
	$ret = getLastPostionsAndTracksIndividually('dUser');
	$expectedTracks = '[positions]' . PHP_EOL
	. 'user=dUser;lat=42.50457163540115;lon=11.071390274487026;time=2012-03-03T15:48:47.484';
	if ($ret == $expectedTracks) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Get tracks (individually 2) for user  (one position yet) - track excluded because of time");
	$ret = getLastPostionsAndTracksIndividually('dUser=2012-03-03T15:48:47.4841');
	$expectedTracks = "[positions]" . PHP_EOL
	. 'user=dUser;lat=42.50457163540115;lon=11.071390274487026;time=2012-03-03T15:48:47.484';
	if ($ret == $expectedTracks) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	$testDate = getDateForTimezoneOffset('dUser', '', true);
	appendTestMessage("Write lat and lon");
	$ret = writePostion('dUser', '', '42.50457163540115', '11.071390274487026', '', '', '', '', $testDate . 'T15:48:47.484', 'true');
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	$today = getDateForTimezoneOffset('dUser', '', true);
	$gpxFileName = $today . '.csv';
	appendTestMessage("Check for a data file (gpx) for this user");
	$ret = getUsersForDataFileName('dUser', $gpxFileName);
	if ($ret == 'dUser') {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	
	// TODO: New
	appendTestMessage("Check for a data file (gpx) for this user. But exclude the user");
	$ret = getUsersForDataFileName('dUser', $gpxFileName, 'dUser');
	if ($ret == '') {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("View single position");
	$csvLine0 = 'lat=42.50457163540115;lon=11.071390274487026;time=' . $testDate . 'T15:48:47.484';
	$ret = getPosition('dUser');
	if ($ret === $csvLine0) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("View single position (parameter = getGroupPostions");
	$ret = getGroupPostions('dUser');
	$expectedLine = 'user=dUser;' . $csvLine0;
	if ($ret === $expectedLine) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Write lat and lon");
	$ret = writePostion('dUser', 'cGroup_changed', '43.50457163540115', '11.071390274487026', '171.61432', '0.7065948', '1067.652498529502', '6.0', $testDate . 'T15:48:48.484', 'true');
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Get tracks individually for user (omit tracks)");
	$ret = getLastPostionsAndTracksIndividually('dUser', 'false');
	$expectedTracks = '[positions]' . PHP_EOL
	. 'user=dUser;lat=43.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time='. $testDate . 'T15:48:48.484';
	if ($ret == $expectedTracks) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Get tracks individually for user (omit tracks)");
	$ret = getLastPostionsAndTracksIndividually('dUser', 'no');
	$expectedTracks = '[positions]' . PHP_EOL
	. 'user=dUser;lat=43.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time='. $testDate . 'T15:48:48.484';
	if ($ret == $expectedTracks) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Get tracks individually for user (two positions yet no last time given)");
	$ret = getLastPostionsAndTracksIndividually('dUser', 'true');
	$expectedTracks = '[positions]' . PHP_EOL
	. 'user=dUser;lat=43.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time='. $testDate . 'T15:48:48.484' . PHP_EOL
	. '[track-dUser]' . PHP_EOL
	. 'lat=42.50457163540115;lon=11.071390274487026;time='. $testDate . 'T15:48:47.484' . PHP_EOL
	. 'lat=43.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time='. $testDate . 'T15:48:48.484';
	if ($ret == $expectedTracks) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}


	appendTestMessage("View single position");
	$csvLine1 = 'lat=43.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time='. $testDate . 'T15:48:48.484';
	$ret = getPosition('dUser');
	if ($ret === $csvLine1) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("Write empty multiline positions");
	$ret = writePostions('dUser', 'cGroup_changed', '', 'true');
	if (!$ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("Write multiline positions");
	$csvLine2 = 'lat=44.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=' . $testDate . 'T15:54:41.484';
	$csvLine3 = 'lat=45.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=' . $testDate . 'T15:54:42.484';
	$csvLine4 = 'lat=46.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=' . $testDate . 'T15:54:43.484';
	$csvLines2_4 = $csvLine2 . PHP_EOL . $csvLine3 . PHP_EOL . $csvLine4;
	$csvLines0_4 = $csvLine0 . PHP_EOL . $csvLine1 . PHP_EOL . $csvLine2 . PHP_EOL . $csvLine3 . PHP_EOL . $csvLine4;
	$ret = writePostions('dUser', 'cGroup_changed', $csvLines2_4, 'true');
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("View single position set by multiline writing");
	$ret = getPosition('dUser');
	if ($ret === $csvLine4) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Get tracks individally for user (five positions yet, last time given)");
	$ret = getLastPostionsAndTracksIndividually('dUser='. $testDate . 'T15:48:48.484');
	$expectedTracks = "[positions]" . PHP_EOL
	. 'user=dUser;' . $csvLine4 . PHP_EOL
	. '[track-dUser]' . PHP_EOL . $csvLine2 . PHP_EOL . $csvLine3 . PHP_EOL . $csvLine4;
	if ($ret == $expectedTracks) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("List tracks");
	$ret = listTracks('dUser');
	$expectedFileName = '2012-03-03.gpx';
	if ($ret == $expectedFileName) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("List tracks");
	$ret = listTracksCSV('dUser');
	$expectedFileNames1 = $testDate. '.csv' . PHP_EOL . '2012-03-03.csv';
	$expectedFileNames2 = '2012-03-03.csv'. PHP_EOL . $testDate. '.csv';
	if ($ret === $expectedFileNames1 || $ret === $expectedFileNames2) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Get track check empty parameter date");
	$ret = getTrack('dUser', '', '');
	if ($ret === $csvLines0_4) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Get track");
	$ret = getTrack('dUser', $today, '');
	if ($ret === $csvLines0_4) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	// Review: This test seems to be double, see test somewhere above
	appendTestMessage("Get track after a certain line number only");
	$ret = getTrack('dUser', $today, $testDate . 'T15:48:48.484');
	if ($ret === $csvLines2_4) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Get track after a certain line number (at end already)");
	$ret = getTrack('dUser', $today, $testDate . 'T15:54:43.484');
	if ($ret === '') {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Get postions of group");
	$ret = getPositions('cGroup_changed');
	$expectedString = 'user=dUser;' . $csvLine4;
	if ($ret === $expectedString) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	// TODO: New
	appendTestMessage("Get postions of group. But exclude the user dUser");
	$ret = getPositions('cGroup_changed', dUser);
	if ($ret === '') {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	// Add second user with same group
	appendTestMessage("Prepare: Create new user");
	$ret = checkUser("eUser", "ePassword");
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Check for a data file (gpx) for this user. A second user is in the group but without this file.");
	$ret = getUsersForDataFileName('dUser', $gpxFileName);
	if ($ret == 'dUser') {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	// TODO: New
	appendTestMessage("Check for a data file (gpx) for this user. AND exclude the user. A second user is in the group but without this file.");
	$ret = getUsersForDataFileName('dUser', $gpxFileName, 'dUser');
	if ($ret == '') {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Prepare: Write position new second user with same group");
	$csvLine5 = 'lat=47.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=' . $testDate . 'T15:54:43.484';
	$ret = writePostions('eUser', 'cGroup_changed', $csvLine5, 'true');
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Check for a data file (gpx) for this user. A second user is in the group now.");
	$ret = getUsersForDataFileName('dUser', $gpxFileName);
	$expectedUsers = 'dUser' . PHP_EOL . 'eUser';
	$expectedUsers1 = 'eUser' . PHP_EOL . 'dUser';
	if ($ret == $expectedUsers || $ret == $expectedUsers1) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	// TODO: New
	appendTestMessage("Check for a data file (gpx) for this user. But exclude the user. A second user is in the group now.");
	$ret = getUsersForDataFileName('dUser', $gpxFileName, 'dUser');
	$expectedUsers = 'eUser';
	if ($ret == $expectedUsers) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Get postions of the two members of the group");
	$ret = getPositions('cGroup_changed');
	$expectedPostions = 'user=dUser;' . $csvLine4 . PHP_EOL . 'user=eUser;' . $csvLine5;
	$expectedPostions1 = 'user=eUser;' . $csvLine5 . PHP_EOL . 'user=dUser;' . $csvLine4;
	if ($ret === $expectedPostions || $ret === $expectedPostions1) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	// TODO: New
	appendTestMessage("Get postions of the two members of the group. Exclude user eUser");
	$ret = getPositions('cGroup_changed', 'eUser');
	$expectedPostions = 'user=dUser;' . $csvLine4;
	if ($ret === $expectedPostions) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Get tracks individually for 2 users (last time given - 1)");
	$ret = getLastPostionsAndTracksIndividually('dUser=' . $testDate . 'T15:48:48.484');
	$expectedTracks = "[positions]" . PHP_EOL
	. 'user=dUser;' . $csvLine4 . PHP_EOL
	. 'user=eUser;' . $csvLine5 . PHP_EOL
	. '[track-dUser]' . PHP_EOL . $csvLine2 . PHP_EOL . $csvLine3 . PHP_EOL . $csvLine4 . PHP_EOL
	. '[track-eUser]' . PHP_EOL . $csvLine5;
	$expectedTracks1 = "[positions]" . PHP_EOL
	. 'user=eUser;' . $csvLine5 . PHP_EOL
	. 'user=dUser;' . $csvLine4 . PHP_EOL
	. '[track-eUser]' . PHP_EOL . $csvLine5 . PHP_EOL
	. '[track-dUser]' . PHP_EOL . $csvLine2 . PHP_EOL . $csvLine3 . PHP_EOL . $csvLine4;
	if ($ret == $expectedTracks || $ret == $expectedTracks1) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Get tracks individually for 2 users (last line given - 2)");
	$ret = getLastPostionsAndTracksIndividually('dUser=' . $testDate . 'T15:48:48.484;eUser');
	$expectedTracks = "[positions]" . PHP_EOL
	. 'user=dUser;' . $csvLine4 . PHP_EOL
	. 'user=eUser;' . $csvLine5 . PHP_EOL
	. '[track-dUser]' . PHP_EOL . $csvLine2 . PHP_EOL . $csvLine3 . PHP_EOL . $csvLine4 . PHP_EOL
	. '[track-eUser]' . PHP_EOL . $csvLine5;
	$expectedTracks1 = "[positions]" . PHP_EOL
	. 'user=eUser;' . $csvLine5 . PHP_EOL
	. 'user=dUser;' . $csvLine4 . PHP_EOL
	. '[track-eUser]' . PHP_EOL . $csvLine5 . PHP_EOL
	. '[track-dUser]' . PHP_EOL . $csvLine2 . PHP_EOL . $csvLine3 . PHP_EOL . $csvLine4;
	if ($ret == $expectedTracks || $ret == $expectedTracks1) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Get tracks individually for 2 users (last line given - 3)");
	$ret = getLastPostionsAndTracksIndividually('dUser=' . $testDate . 'T15:48:48.484;eUser=' . $testDate . 'T15:54:42.484');
	$expectedTracks = "[positions]" . PHP_EOL
	. 'user=dUser;' . $csvLine4 . PHP_EOL
	. 'user=eUser;' . $csvLine5 . PHP_EOL
	. '[track-dUser]' . PHP_EOL . $csvLine2 . PHP_EOL . $csvLine3 . PHP_EOL . $csvLine4 . PHP_EOL
	. '[track-eUser]' . PHP_EOL . $csvLine5;
	$expectedTracks1 = "[positions]" . PHP_EOL
	. 'user=eUser;' . $csvLine5 . PHP_EOL
	. 'user=dUser;' . $csvLine4 . PHP_EOL
	. '[track-eUser]' . PHP_EOL . $csvLine5 . PHP_EOL
	. '[track-dUser]' . PHP_EOL . $csvLine2 . PHP_EOL . $csvLine3 . PHP_EOL . $csvLine4;
	if ($ret == $expectedTracks || $ret == $expectedTracks1) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Get tracks individually for 2 users (last line given - 4)");
	$ret = getLastPostionsAndTracksIndividually('dUser=' . $testDate . 'T15:48:48.484;eUser=' . $testDate . 'T15:54:43.484');
	$expectedTracks = "[positions]" . PHP_EOL
	. 'user=dUser;' . $csvLine4 . PHP_EOL
	. 'user=eUser;' . $csvLine5 . PHP_EOL
	. '[track-dUser]' . PHP_EOL . $csvLine2 . PHP_EOL . $csvLine3 . PHP_EOL . $csvLine4;
	$expectedTracks1 = "[positions]" . PHP_EOL
	. 'user=eUser;' . $csvLine5 . PHP_EOL
	. 'user=dUser;' . $csvLine4 . PHP_EOL
	. '[track-dUser]' . PHP_EOL . $csvLine2 . PHP_EOL . $csvLine3 . PHP_EOL . $csvLine4;
	if ($ret == $expectedTracks || $ret == $expectedTracks1) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Get tracks individually for 2 users (last line given - 5)");
	$ret = getLastPostionsAndTracksIndividually('dUser=' . $testDate . 'T15:54:43.484' . ';eUser=' . $testDate . 'T15:54:43.484');
	$expectedTracks = "[positions]" . PHP_EOL
	. 'user=dUser;' . $csvLine4 . PHP_EOL
	. 'user=eUser;' . $csvLine5;
	$expectedTracks1 = "[positions]" . PHP_EOL
	. 'user=eUser;' . $csvLine5 . PHP_EOL
	. 'user=dUser;' . $csvLine4;
	if ($ret == $expectedTracks || $ret == $expectedTracks1) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Get postions of the two members of the group (param = getGroupPostions");
	$ret = getGroupPostions('dUser');
	if ($ret === $expectedPostions || $ret === $expectedPostions1) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Util: write some csv files to create gpx (later)");
	if (test_writeGpxFromCsv()) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Create gpx from csv and list. Check eUser");
	$ret = listTracks('eUser');
	$expected1 = "2013-03-10.gpx" . PHP_EOL . "2013-03-11.gpx";
	$expected2 = "2013-03-11.gpx" . PHP_EOL . "2013-03-10.gpx";
	if ($ret == $expected1 || $ret == $expected2) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Create gpx from csv and list. Check dUser");
	$ret = listTracks('dUser');
	$expected1 = "2013-03-10.gpx" . PHP_EOL . "2012-03-03.gpx";
	$expected2 = "2012-03-03.gpx" . PHP_EOL . "2013-03-10.gpx";
	if ($ret == $expected1 || $ret == $expected2) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Write multiline positions with different dates");
	$csvLine6 = 'lat=44.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=2012-04-03T15:54:41.484';
	$csvLine7 = 'lat=45.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=' . $testDate . 'T15:54:44.484';
	$csvLine8 = 'lat=46.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=' . $testDate . 'T15:54:45.484';
	$csvLines6_8 = $csvLine6 . PHP_EOL . $csvLine7 . PHP_EOL . $csvLine8;
	$csvLines0_8_dUser = $csvLine0 . PHP_EOL . $csvLine1 . PHP_EOL . $csvLine2 . PHP_EOL . $csvLine3 . PHP_EOL . $csvLine4 . PHP_EOL . $csvLine7 . PHP_EOL . $csvLine8;
	$ret = writePostions('dUser', 'cGroup_changed', $csvLines6_8, 'true');
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Get tracks individually for 2 users all lines");
	$ret = getLastPostionsAndTracksIndividually('dUser;eUser');
	$expectedTracks = "[positions]" . PHP_EOL
	. 'user=dUser;' . $csvLine8 . PHP_EOL
	. 'user=eUser;' . $csvLine5 . PHP_EOL
	. '[track-dUser]' . PHP_EOL . $csvLines0_8_dUser . PHP_EOL
	. '[track-eUser]' . PHP_EOL . $csvLine5;
	$expectedTracks1 = "[positions]" . PHP_EOL
	. 'user=eUser;' . $csvLine5 . PHP_EOL
	. 'user=dUser;' . $csvLine8 . PHP_EOL
	. '[track-eUser]' . PHP_EOL . $csvLine5 . PHP_EOL
	. '[track-dUser]' . PHP_EOL . $csvLines0_8_dUser;
	if ($ret == $expectedTracks || $ret == $expectedTracks1) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Get tracks individually for 2 users all lines");
	$ret = getLastPostionsAndTracksIndividually('dUser='. $testDate . 'T15:54:44.484;eUser');
	$expectedTracks = "[positions]" . PHP_EOL
	. 'user=dUser;' . $csvLine8 . PHP_EOL
	. 'user=eUser;' . $csvLine5 . PHP_EOL
	. '[track-dUser]' . PHP_EOL . $csvLine8 . PHP_EOL
	. '[track-eUser]' . PHP_EOL . $csvLine5;
	$expectedTracks1 = "[positions]" . PHP_EOL
	. 'user=eUser;' . $csvLine5 . PHP_EOL
	. 'user=dUser;' . $csvLine8 . PHP_EOL
	. '[track-eUser]' . PHP_EOL . $csvLine5 . PHP_EOL
	. '[track-dUser]' . PHP_EOL . $csvLine8;
	if ($ret == $expectedTracks || $ret == $expectedTracks1) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("List tracks");
	$ret = listTracksCSV('dUser');
	$expectedFileNames1 =  $testDate. '.csv' . PHP_EOL . '2012-03-03.csv' . PHP_EOL . '2012-04-03.csv' . PHP_EOL . '2013-03-10.csv';
	$searchString = '/' . $testDate . '.csv/i';
	if (preg_match($searchString, $ret, $matches)) {
		$foundTime = $matches[0];
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	$searchString = '/2012-03-03.csv/i';
	if (preg_match($searchString, $ret, $matches)) {
		$foundTime = $matches[0];
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	$searchString = '/2012-04-03.csv/i';
	if (preg_match($searchString, $ret, $matches)) {
		$foundTime = $matches[0];
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	$searchString = '/2013-03-10.csv/i';
	if (preg_match($searchString, $ret, $matches)) {
		$foundTime = $matches[0];
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	appendTestMessage("Write multiline positions with different dates and track not stored");
	$csvLine6 = 'lat=44.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=2012-04-03T15:54:41.484';
	$csvLine7 = 'lat=45.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=' . $testDate . 'T15:54:44.484';
	$csvLine8 = 'lat=46.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=' . $testDate . 'T15:54:45.484';
	$csvLine9 = 'lat=46.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=' . $testDate . 'T15:54:46.484';
	$csvLines6_9 = $csvLine6 . PHP_EOL . $csvLine7 . PHP_EOL . $csvLine8 . PHP_EOL . $csvLine9;
	$ret = writePostions('dUser', 'cGroup_changed', $csvLines6_9, 'false');
	if ($ret) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}


	appendTestMessage("Get tracks individually for 2 users all lines");
	$ret = getLastPostionsAndTracksIndividually('dUser;eUser');
	$expectedTracks = "[positions]" . PHP_EOL
	. 'user=dUser;' . $csvLine9 . PHP_EOL
	. 'user=eUser;' . $csvLine5 . PHP_EOL
	. '[track-dUser]' . PHP_EOL . $csvLines0_8_dUser . PHP_EOL
	. '[track-eUser]' . PHP_EOL . $csvLine5;
	$expectedTracks1 = "[positions]" . PHP_EOL
	. 'user=eUser;' . $csvLine5 . PHP_EOL
	. 'user=dUser;' . $csvLine9 . PHP_EOL
	. '[track-eUser]' . PHP_EOL . $csvLine5 . PHP_EOL
	. '[track-dUser]' . PHP_EOL . $csvLines0_8_dUser;
	if ($ret == $expectedTracks || $ret == $expectedTracks1) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	return true;
}

function removeTestUsers() {
	$ret = removeUser("dUser", "dPassword");
	if (!$ret) {
		return false;
	}
	$ret = removeUser("eUser", "ePassword");
	if (!$ret) {
		return false;
	}
	return true;
}

function test_writeGpxFromCsv() {
	// Write 2 csv files for eUser
	$csvFileName1eUser = "users" . DIRECTORY_SEPARATOR . "eUser" . DIRECTORY_SEPARATOR . "2013-03-10.csv";
	$csvLines = "lat=40.1;lon=10.1;time=2013-03-10T10:00:00.111;altitude=485.11" . PHP_EOL
	. "lat=41.1;lon=11.1;time=2013-03-11T10:00:00.111;altitude=485.11";
	if (!file_put_contents($csvFileName1eUser, $csvLines)) {
		return false;
	}
	$csvFileName1eUser = "users" . DIRECTORY_SEPARATOR . "eUser" . DIRECTORY_SEPARATOR . "2013-03-11.csv";
	$csvLines = "lat=40.1;lon=10.1;time=2013-03-10T10:00:00.111;altitude=485.11" . PHP_EOL
	. "lat=41.1;lon=11.1;time=2013-03-11T10:00:00.111;altitude=485.11";
	if (!file_put_contents($csvFileName1eUser, $csvLines)) {
		return false;
	}
	// Write 1 csv files for dUser
	$csvFileName1dUser = "users" . DIRECTORY_SEPARATOR . "dUser" . DIRECTORY_SEPARATOR . "2013-03-10.csv";
	$csvLines = "lat=40.1;lon=10.1;time=2013-03-10T10:00:00.111;altitude=485.11" . PHP_EOL
	. "lat=41.1;lon=11.1;time=2013-03-11T10:00:00.111;altitude=485.11";
	if (!file_put_contents($csvFileName1dUser, $csvLines)) {
		return false;
	}
	return true;
}

function test_getTimeFormatGuessed() {
	appendTestMessage(NEW_LINE_LOG . " >> Tests guess time stamp formats..." . NEW_LINE_LOG);
	appendTestMessage("time=1364225224111");
	$ret = getTimeFormatGuessed("1364225224");
	$expected = "2013-03-25T15:27:04Z";
	if ($ret == $expected) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("time=1364225189643");
	$ret = getTimeFormatGuessed("1364225189643");
	$expected = "2013-03-25T15:26:29Z";
	if ($ret == $expected) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("time=2013-03-25_14:43:01");
	$ret = getTimeFormatGuessed("2013-03-25_14:43:01");
	$expected = "2013-03-25T14:43:01";
	if ($ret == $expected) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("time=2013-03-25_14:43:01Z+01");
	$ret = getTimeFormatGuessed("2013-03-25_14:43:01Z+01");
	$expected = "2013-03-25T14:43:01Z+01";
	if ($ret == $expected) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("time=2013-03-25_14:43");
	$ret = getTimeFormatGuessed("2013-03-25_14:43");
	$expected = "2013-03-25_14:43";
	if ($ret == $expected) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	return true;
}
function test_findDateTime() {
	appendTestMessage(NEW_LINE_LOG . " >> Tests find date-time in csv lines..." . NEW_LINE_LOG);
	appendTestMessage("tIme=2013-03-25T15:27:04Z");
	$ret = findDateTime("tIme=2013-03-25T15:27:04Z");
	$expected = "2013-03-25T15:27:04Z";
	if ($ret == $expected) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("xytIme=2013-03-25T15:27:04Z;xy");
	$ret = findDateTime("xytIme=2013-03-25T15:27:04Z;xy");
	if ($ret == $expected) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("xy;tIme=2013-03-25T15:27:04Z;xy;xy");
	$ret = findDateTime("xy;tIme=2013-03-25T15:27:04Z;xy;xy");
	if ($ret == $expected) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("xy;nothing=2013-03-25T15:27:04Z;xy;xy");
	$ret = findDateTime("xy;nothing=2013-03-25T15:27:04Z;xy;xy");
	if ($ret == '') {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	return true;
}

function test_getDateForTimezoneOffset() {
	appendTestMessage(NEW_LINE_LOG . " >> Tests with timezone offset..." . NEW_LINE_LOG);
	$testUser = 'dUser';
	setConfiguration($testUser, CONFIG_KEY_TIMEZONE_OFFSET_MINUTES, '');

	appendTestMessage("time=nowknown, offset=''");
	$ret = getDateForTimezoneOffset($testUser, "nowknown", false);
	$expected = "";
	if ($ret == $expected) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("time=2013-03-25_14:43:01Z+01, offset=''");
	$ret = getDateForTimezoneOffset($testUser, "2013-03-25_14:43:01Z+01", false);
	$expected = "2013-03-25T14:43:01";
	if ($ret == $expected) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	appendTestMessage("time=2013-03-25_14:43:01Z+01, offset='', date only");
	$ret = getDateForTimezoneOffset($testUser, "2013-03-25_14:43:01Z+01", true);
	$expected = "2013-03-25";
	if ($ret == $expected) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}

	// timezone offset Berlin summer
	setConfiguration($testUser, CONFIG_KEY_TIMEZONE_OFFSET_MINUTES, '-120');
	appendTestMessage("time=2013-03-25_14:43:01Z+01, offset='-120'");
	$ret = getDateForTimezoneOffset($testUser, "2013-03-25_14:43:01Z+01", false);
	$expected = "2013-03-25T16:43:01";
	if ($ret == $expected) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	setConfiguration($testUser, CONFIG_KEY_TIMEZONE_OFFSET_MINUTES, '120');
	appendTestMessage("time=2013-03-25_14:43:01Z+01, offset='120'");
	$ret = getDateForTimezoneOffset($testUser, "2013-03-25_14:43:01Z+01", false);
	$expected = "2013-03-25T12:43:01";
	if ($ret == $expected) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	setConfiguration($testUser, CONFIG_KEY_TIMEZONE_OFFSET_MINUTES, 'not_a_number');
	appendTestMessage("time=2013-03-25_14:43:01Z+01, offset='not_a_number'");
	$ret = getDateForTimezoneOffset($testUser, "2013-03-25_14:43:01Z+01", false);
	$expected = "2013-03-25T14:43:01";
	if ($ret == $expected) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	setConfiguration($testUser, CONFIG_KEY_TIMEZONE_OFFSET_MINUTES, '0');
	appendTestMessage("time=2013-03-25_14:43:01Z+01, offset='0'");
	$ret = getDateForTimezoneOffset($testUser, "2013-03-25_14:43:01Z+01", false);
	$expected = "2013-03-25T14:43:01";
	if ($ret == $expected) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	// DateTime as milliseconds
	setConfiguration($testUser, CONFIG_KEY_TIMEZONE_OFFSET_MINUTES, '-120');
	appendTestMessage("time=1364225224111, offset='-120'");
	$ret = getDateForTimezoneOffset($testUser, "1364225224111", false);
	$expected = "2013-03-25T17:27:04";
	if ($ret == $expected) {
		appendTestMessage("- ok");
	} else {
		appendTestMessage("- failed");
		return false;
	}
	// The next line is just for debugging
	$ret = getDateForTimezoneOffset($testUser, "", false);

	resetConfig($testUser);
	resetConfig(ADMIN_NAME);
	return true;
}

function logTestMessage($s) {
	echo NEW_LINE_LOG . $s;
}

function logResultMessage() {
	global $testResults;
	echo NEW_LINE_LOG . $testResults;
}

function appendTestMessage($testMessage) {
	global $testResults;
	$testResults .= NEW_LINE_LOG . $testMessage;
}

?>