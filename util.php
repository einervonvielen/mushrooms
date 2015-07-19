<?php

// uncomment to call from webserver
define('NEW_LINE_LOG', "\n</br>");
// uncomment to call locally
// define('NEW_LINE_LOG', "\n");

define('POSITION_FILE', 'position.csv');
define('LOGGING_ON', false);
date_default_timezone_set('UTC');
define('USER_DIR', 'users');
define('HASH_FILE', 'hash');
define('REQUEST_FILE', 'request.txt');
define('GROUP_FILE', 'group.txt');
define('CONFIG_FILE', 'config.txt');
define('CONFIG_KEY_LAST_MODIFIED', 'last_modified');
define('CONFIG_KEY_TIMEZONE_OFFSET_MINUTES', 'timezone_offset_minutes');
define('CONFIG_KEY_TRACK_EXPIRATION_DAYS', 'track_expiration_days');
define('CONFIG_KEY_IS_WRITING_TRACK', 'write_track');
define('ADMIN_NAME', 'admin');
define('CSV_SEPARATOR', ';');

////////////////////////////////////////////////////////////////////////////////
// User related methods
////////////////////////////////////////////////////////////////////////////////

/**
 * Checks user name (directory) and password (hash file).
 * If the user is new: Create a directory for the user and write the hash file
 * containing the (salted) hash value for the password.
 *
 * @param type $userName
 * @param string $pass (optional)
 * @return boolean true if everthing is ok
 */
function checkUser($userName, $pass) {
	// Has user name valid format?
	if (isNullOrEmptyString($userName)) {
		logMessage("User name is empty");
		return false;
	}
	$user = trim($userName);
	if ($user == '') {
		logMessage("User name is blank(s) only");
		return false;
	}
	$acceptedValues = '/^[a-zA-Z0-9_]+$/';
	if (!preg_match($acceptedValues, $user)) {
		logMessage("Format of user name $user not accepted");
		return false;
	}
	if (NULL == $pass) {
		$pass = '';
	}
	$hash = getHashForUserPass($userName, $pass);
	// top users dir
	if (!is_dir(USER_DIR)) {
		if (!mkdir(USER_DIR)) {
			logMessage("Failed to create directory: " . USER_DIR);
			return false;
		}
		logMessage("Created directory: " . USER_DIR);
	}
	// Is known user?
	$dirUser = USER_DIR . DIRECTORY_SEPARATOR . $user;
	$hashFile = $dirUser . DIRECTORY_SEPARATOR . HASH_FILE;
	if (!is_dir($dirUser)) {
		// unknown user > create directory for user
		if (!createUserDir($user)) {
			return false;
		}
		// store hash of password
		if (!file_put_contents($hashFile, $hash, LOCK_EX)) {
			logMessage("Failed to write the hash file: $hashFile");
			return false;
		}
		logMessage("Created hash file: " . $hashFile);
	} else {
		// check password
		if (is_file($hashFile)) {
			$existingHash = file_get_contents($hashFile);
			if ($existingHash === $hash) {
				logMessage("Password ok for: " . $user);
			} else {
				logMessage("Password not ok for: " . $user);
				return false;
			}
		} else {
			logMessage("Watch this: $hashFile without hash file : $hashFile ...creating...");
			if (!file_put_contents($hashFile, $hash, LOCK_EX)) {
				logMessage("Failed to write the hash file: $hashFile");
				return false;
			}
			logMessage("Created hash file: " . $hashFile);
		}
	}
	return true;
}

function isUserAccepted($userName, $pass) {
	// Has user name valid format?
	if (isNullOrEmptyString($userName)) {
		logMessage("User name is empty");
		return false;
	}
	$user = trim($userName);
	if ($user == '') {
		logMessage("User name is blank(s) only");
		return false;
	}
	if (NULL == $pass) {
		$pass = '';
	}
	$hash = getHashForUserPass($userName, $pass);
	// top users dir
	if (!is_dir(USER_DIR)) {
		logMessage("No user directory: " . USER_DIR);
		return false;
	}
	// Is known user?
	$dirUser = USER_DIR . DIRECTORY_SEPARATOR . $user;
	$hashFile = $dirUser . DIRECTORY_SEPARATOR . HASH_FILE;
	// check password
	if (is_file($hashFile)) {
		$existingHash = file_get_contents($hashFile);
		if ($existingHash === $hash) {
			logMessage("Password ok for: " . $user);
			return true;
		} else {
			logMessage("Password not ok for: " . $user);
			return false;
		}
	}
	return false;
}

/**
 * Removes all data for this user.
 * (Each user has a directory. All data belonging to him is stored there and only
 * there. The whole directory is deleted including all of its files.)
 *
 * @param type $userName
 * @param type $pass
 * @return boolean for success
 */
function removeUser($userName, $pass) {
	if (!checkUser($userName, $pass)) {
		logMessage("Failed to check user befor removing: $hashFile");
		return false;
	}
	$dirUser = USER_DIR . DIRECTORY_SEPARATOR . $userName;
	removeDir($dirUser);
	if (is_dir($dirUser)) {
		logMessage("Failed remove user (all files and directory): $hashFile");
		return false;
	}
	logMessage("Removed all files and the directory of user: " . $userName);
	return true;
}

/**
 * Changes the password of a user. The file 'hash' in the directory of the user
 * will be overwritten.
 *
 * @param type $userName
 * @param type $pass
 * @param type $newPassword
 * @return boolean for success
 */
function changePassword($userName, $pass, $newPassword) {
	if (!checkUser($userName, $pass)) {
		logMessage("Failed to check user befor changing password");
		return false;
	}
	$hash = getHashForUserPass($userName, $newPassword);
	// store hash of password
	$user = trim($userName);
	$dirUser = USER_DIR . DIRECTORY_SEPARATOR . $user;
	$hashFile = $dirUser . DIRECTORY_SEPARATOR . HASH_FILE;
	if (!file_put_contents($hashFile, $hash, LOCK_EX)) {
		logMessage("Failed to write the hash file: $hashFile");
		return false;
	}
	logMessage("Changed password of user $userName. Created hash file: " . $hashFile);
	return true;
}

/**
 * Changes the group of a user. The file 'group.txt' in the directory of the user
 * will be overwritten.
 *
 * @param type $userName
 * @param type $pass
 * @param type $group
 * @return boolean for success
 */
function changeGroup($userName, $pass, $group) {
	if (!checkUser($userName, $pass)) {
		logMessage("Failed to check user befor changing password");
		return false;
	}
	if (!writeGroupFile($userName, $group)) {
		return false;
	}
	logMessage("Changed group of user $userName. Group is now: " . $group);
	return true;
}

////////////////////////////////////////////////////////////////////////////////
// Write postions
////////////////////////////////////////////////////////////////////////////////

/**
 * Write a single postions
 *
 * @param type $user (required)
 * @param type $group (optional)
 * @param type $lat (required) Latitude, example: 47.50457163540115
 * @param type $lon (required) Longitude, example: 11.071390274487026
 * @param type $bearing (optional), example: 171.61432
 * @param type $speed (optional), example: 0.7065948
 * @param type $altitude (optional), example: 1067.652498529502
 * @param type $accuracy (optional, Radius in meters with an 68% probability according to Google), example: 6.0
 * @param type $time (optional), example: 2013-03-03T15:48:47.484
 * @param type $storeTrack (optional), any value, if left empty than no track is stored.

 * @return boolean true if everthing is ok
 */
function writePostion($user, $group, $lat, $lon, $bearing, $speed, $altitude, $accuracy, $time, $storeTrack) {
	if (isNullOrEmptyString($lat)) {
		logMessage("Missing parameter lat.");
		return false;
	}
	if (isNullOrEmptyString($lon)) {
		logMessage("Missing parameter lon.");
		return false;
	}
	if (isNullOrEmptyString($time)) {
		// $time = date("Y-m-d_H-i-s");
		// $time = getFormatedTime();
		$time = date("Y-m-d\TH:i:s");
		logMessage("Added time $time");
	}
	$csvLine = 'lat=' . $lat . CSV_SEPARATOR . 'lon=' . $lon;
	if (!isNullOrEmptyString($bearing)) {
		$csvLine .= CSV_SEPARATOR . 'bearing=' . $bearing;
	}
	if (!isNullOrEmptyString($speed)) {
		$csvLine .= CSV_SEPARATOR . 'speed=' . $speed;
	}
	if (!isNullOrEmptyString($altitude)) {
		$csvLine .= CSV_SEPARATOR . 'altitude=' . $altitude;
	}
	if (!isNullOrEmptyString($accuracy)) {
		$csvLine .= CSV_SEPARATOR . 'accuracy=' . $accuracy;
	}
	if (!isNullOrEmptyString($time)) {
		$csvLine .= CSV_SEPARATOR . 'time=' . $time;
	}
	// Append to track
	// Overwrite last position
	return writePostions($user, $group, $csvLine, $storeTrack);
}

/**
 * Can store more than one postions at once.
 *
 * @param type $user
 * @param type $group
 * @param type $positions multiline CSV, each line containing one postion
 *        Example
 *          lat=43.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=2012-03-03T15:48:47.484'
 *          lat=44.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=2012-03-03T15:48:47.484'
 * @param type $storeTrack store the track to
 * @return boolean true for success
 */
function writePostions($user, $group, $positions, $storeTrack) {
	$storeTrack = checkConfigIsWritingTrack($user, $storeTrack);
	// Write the last request (does not write the password)
	if(!writeLastRequest($user)) {
		logMessage("Failed to write the request file for user $user.");
		return false;
	}

	if (isNullOrEmptyString($positions)) {
		logMessage("Missing parameter positions.");
		return false;
	}
	if (!isNullOrEmptyString($group)) {
		if (!writeGroupFile($user, $group)) {
			return false;
		}
	}
	// Try to guess the timestamp format
	$acceptedValues = '/(.*time=)([^;]+)(.*)/i';
	$dateString = '';
	$lines = explode(PHP_EOL, $positions);
	$count = count($lines);
	$lastLine = $lines[$count - 1];
	$lineBuffer = '';
	for ($i = 0; $i < $count; $i++) {
		$lastLine = trim($lines[$i]);
		if (preg_match($acceptedValues, $lastLine, $matches)) {
			$timeStringReceived = trim($matches[2]);
			$timeStringGuessed = getTimeFormatGuessed($timeStringReceived);
			$lastLine = $matches[1] . $timeStringGuessed . $matches[3];
			// Check wether the day (local user time) changed) > to split the track files later on
			$newDateString = getDateForTimezoneOffset($user, $timeStringReceived, true);
			if($newDateString == '') {
				// take today
				$newDateString = getDateForTimezoneOffset($user, "", true);
			}
			if($dateString == '') {
				$dateString = $newDateString;
			} else if($newDateString != $dateString) {
				if(!isNullOrEmptyString($storeTrack)) {
					// the date of the positions time changed > write the track
					writePositionsCSVfile($user, $dateString, $lineBuffer);
				}
				// start a new track (line buffer)
				$lineBuffer = '';
				$dateString = $newDateString;
			}
		}
		if ($lineBuffer != '') {
			$lineBuffer .= PHP_EOL;
		}
		$lineBuffer .= $lastLine;
	}
	$acceptedValues = '/true/i';
	if(preg_match($acceptedValues, $storeTrack)) {
		// Write CSV
		writePositionsCSVfile($user, $dateString, $lineBuffer);
	}
	// Write PGX
	//    $gpxFile = USER_DIR . DIRECTORY_SEPARATOR . $user . DIRECTORY_SEPARATOR . $dateString . ".gpx";
	//    if (!writeGPXfile(true, $gpxFile, $positions)) {
	//        return false;
	//    }
	//
	// write last position to position.csv
	return writePositionFile($user, $lastLine);
}

function checkConfigIsWritingTrack($user, $storeTrack) {
	$configValue = '';
	if(isNullOrEmptyString($storeTrack)) {
		// What was set befor?
		$configValue = getConfiguration($user, CONFIG_KEY_IS_WRITING_TRACK, true);
	} else {
		setConfiguration($user, CONFIG_KEY_IS_WRITING_TRACK, $storeTrack);
		$configValue = $storeTrack;
	}
	if(isNullOrEmptyString($configValue)) {
		// switch the tracking ON if not set or not known
		setConfiguration($user, CONFIG_KEY_IS_WRITING_TRACK, "true");
		$configValue = "true";
	}
	return $configValue;
}

/**
 *
 * @param string $formatedDateTime example '2013-10-07T21:45:10.234'
 * @return string '2013-10-07' (Y-m-d)
 */
function getDateString($formatedDateTime) {
	$searchStringReadable = '/(\d\d\d\d)(.*?)(\d\d)(.*?)(\d\d)(.*?)/';
	if (preg_match($searchStringReadable, $formatedTime, $matches)) {
		$formatedDateGuessed = $matches[1] . '-' . $matches[3] . '-' . $matches[5];
		return $formatedDateGuessed;
	}
	return '';
}
/**
 *
 * @param string $formatedDateTime example '2013-10-07T21:45:10.234'.
 * If parameter is an empty string a formated UTC date is created.
 * @return string example '2013-10-07T23:45:10.234' if the timezone offset is '-120'
 */
function getDateForTimezoneOffest($formatedDateTime) {
	return '';
}

////////////////////////////////////////////////////////////////////////////////
// View postion
////////////////////////////////////////////////////////////////////////////////

/**
 * Returns the last postion of the user.
 *
 * @param type $user
 * @return string the last postion as CSV
 *         Example: lat=47.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=2013-03-03T15:48:47.484
 */
function getPosition($user) {
	$posFile = USER_DIR . DIRECTORY_SEPARATOR . $user . DIRECTORY_SEPARATOR . POSITION_FILE;
	if (is_file($posFile)) {
		$positionCSVline = file_get_contents($posFile);
		return $positionCSVline;
	}
	logMessage("No postion file $posFile for user: " . $user);
	return '';
}

/**
 *
 * @param type $user user name as String
 * @param type $excludeRequestingUser if not empty or null the user (param $user) will be excluded the return positions
 * @return type
 *  a) the user is not in a group > return the last postion as CSV
 *         Example: user=Peter;lat=47.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=2013-03-03T15:48:47.484
 *  b) the user belongs to a group > return CSV strings. Each user one line containing the last position
 *         Example:
 *              user=Peter;lat=47.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=2013-03-03T15:48:47.484
 *              user=Lisa;lat=47.50451538021159;lon=11.071421406744932;bearing=173.14859;speed=0.0;altitude=1068.2914401409275;accuracy=6.0;time=2013-03-03T15:48:57.511
 */
function getGroupPostions($user, $excludeRequestingUser) {
	// Get the group if any
	$foundGroup = getGroup($user);
	if ($foundGroup != '') {
		// yes, user is in group
		return getPositions($foundGroup, $excludeRequestingUser);
	} else {
		// no group > get the postion of this user only
		if(!isNullOrEmptyString($excludeRequestingUser)) {
			return '';
		} else {
			$postions = getPosition($user);
			if (isNullOrEmptyString($postions)) {
				return '';
			}
			$csv = 'user=' . $user . ';' . $postions;
			return $csv;
		}		
	}
}

// Helper
function getGroup($user) {
	$groupFile = USER_DIR . DIRECTORY_SEPARATOR . $user . DIRECTORY_SEPARATOR . GROUP_FILE;
	if (is_file($groupFile)) {
		$foundGroup = file_get_contents($groupFile);
		if ($foundGroup != '') {
			// yes, user is in group
			return $foundGroup;
		}
	}
	return '';
}

/**
 * Get the las position of each member of this group as CSV.
 * @param type $group
 * @param type $excludeUser exclude this user name from the returned positions
 * @return type CSV strings. Each user one line containing the last position
 *         Example:
 *              user=Peter;lat=47.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=2013-03-03T15:48:47.484
 *              user=Lisa;lat=47.50451538021159;lon=11.071421406744932;bearing=173.14859;speed=0.0;altitude=1068.2914401409275;accuracy=6.0;time=2013-03-03T15:48:57.511
 */
function getPositions($group, $excludeUser) {
	$groupPositions = '';
	if ($handle = opendir(USER_DIR)) {
		while (false !== ($entry = readdir($handle))) {
			if($entry == $excludeUser) {
				continue;
			}
			$userDir = USER_DIR . DIRECTORY_SEPARATOR . $entry;
			if (is_dir($userDir)) {
				$groupFile = $userDir . DIRECTORY_SEPARATOR . GROUP_FILE;
				if (is_file($groupFile)) {
					$foundGroup = file_get_contents($groupFile);
					if ($foundGroup === $group) {
						$usersPositionFile = $userDir . DIRECTORY_SEPARATOR . POSITION_FILE;
						if (is_file($usersPositionFile)) {
							$userPostion = file_get_contents($usersPositionFile);
							if (!isNullOrEmptyString($groupPositions)) {
								$groupPositions .= PHP_EOL;
							}
							$groupPositions .= 'user=' . $entry . CSV_SEPARATOR . $userPostion;
						}
					}
				}
			}
		}
		closedir($handle);
	}
	return $groupPositions;
}

////////////////////////////////////////////////////////////////////////////////
// View tracks
////////////////////////////////////////////////////////////////////////////////

/**
 * 1) Check the if the user knows its timezone offset (as configuration)
 * 2) Create gpx files from csv files if the gpx do not exist yet.
 * Do this for all users of the group (the user belongs to).
 * Then list the (file names of the) track for a user.
 * One track for one day.
 *
 *
 * @param type $user
 * @param type $timezoneoffset
 * @return type CSV each line containing the file name of the track as '2013-03-07.csv'.
 */
function listTracks($user, $timezoneoffset) {
	$configValue = getConfiguration($user, CONFIG_KEY_TIMEZONE_OFFSET_MINUTES, false);
	if(isNullOrEmptyString($configValue)) {
		if(!setConfiguration($user, CONFIG_KEY_TIMEZONE_OFFSET_MINUTES, $timezoneoffset)) {
			logMessage("Failed to write the timezone offest for user: " . $user);
			return '';
		}
		logMessage("Wrote timezone offest of $timezoneoffset minutes for user: " . $user);
	}
	// Create gpx files for all csv file (if not existing yet).
	// This creates no gpx files for today
	if (!writeAllGpxFromCsvForGroup($user)) {
		return '';
	}
	$userDir = USER_DIR . DIRECTORY_SEPARATOR . $user;
	$acceptedValues = '/[0-9]{2,2}-[0-9]{2,2}-[0-9]{2,2}.gpx/i';
	$trackFiles = '';
	if ($handle = opendir($userDir)) {
		while (false !== ($entry = readdir($handle))) {
			if (preg_match($acceptedValues, $entry)) {
				if (!isNullOrEmptyString($trackFiles)) {
					$trackFiles .= PHP_EOL;
				}
				$trackFiles .= $entry;
				logMessage("Found track file $entry for user: " . $user);
			}
		}
		closedir($handle);
	}
	return $trackFiles;
}

/**
 Remove all files older than the configured expiration time (user and server)
 If a file is empty after this then it is deleted
 */
function cleanUp() {
	// What is the time now?
	$now = time();
	// Iterate through all user directories
	if ($handle = opendir(USER_DIR)) {
		while (false !== ($entry = readdir($handle))) {
			if ($entry == "." || $entry == "..") {
				continue;
			}
			$userDir = USER_DIR . DIRECTORY_SEPARATOR . $entry;
			if (is_dir($userDir)) {
				$expirationDaysUser = getConfiguration($entry, CONFIG_KEY_TRACK_EXPIRATION_DAYS, true);
				if(isNullOrEmptyString($expirationDaysUser)) {
					return;
				}
				// Expiration time in seconds
				$daysInSeconds = $expirationDaysUser * 24 * 60 * 60;
				$decayTime = $now - $daysInSeconds;
				if ($handleUserDirs = opendir($userDir)) {
					while (false !== ($entryUserFile = readdir($handleUserDirs))) {
						if ($entryUserFile == "." || $entryUserFile == "..") {
							continue;
						}
						$userFile = $userDir . DIRECTORY_SEPARATOR . $entryUserFile;
						$lastModifiedTime = filemtime($userFile);
						if($lastModifiedTime <= $decayTime) {
							unlink($userFile);
						}
					}
				}
				closedir($handleUserDirs);
				// Remove the user if no file is left
				if(is_dir_empty($userDir)) {
					rmdir($userDir);
				}
			}
		}
		closedir($handle);
	}
}

/**
 Remove all files older than the configured expiration time (user and server)
 If a file is empty after this then it is deleted
 */
function cleanUpObsolete($user) {
	// Expiration time in days
	$expirationDaysServer = readConfiguration(CONFIG_FILE, CONFIG_KEY_TRACK_EXPIRATION_DAYS);
	if(isNullOrEmptyString($expirationDaysServer)) {
		return;
	}
	$expirationDaysUser = getConfiguration($user, CONFIG_KEY_TRACK_EXPIRATION_DAYS, true);
	// What is the time now?
	$now = time();
	// Expiration time in seconds
	// 	$a = array($expirationDaysServer, 24, 60, 60);
	// 	$decayTimeServer = array_product($a) + $now;
	$daysInSeconds = $expirationDaysServer * 24 * 60 * 60;
	$decayTimeServer = $now - $daysInSeconds;
	// 	$a = array($expirationDaysUser, 24, 60, 60);
	// 	$decayTimeUser = array_product($a) + $now;
	$daysInSeconds = $expirationDaysUser * 24 * 60 * 60;
	$decayTimeUser = $now - $daysInSeconds;
	// Iterate through all user directories
	if ($handle = opendir(USER_DIR)) {
		while (false !== ($entry = readdir($handle))) {
			if ($entry == "." || $entry == "..") {
				continue;
			}
			$userDir = USER_DIR . DIRECTORY_SEPARATOR . $entry;
			if (is_dir($userDir)) {
				// Is this the directory of the current user?
				$decayTime = $decayTimeServer;
				if($user == $entry) {
					$decayTime = $decayTimeUser;
				}
				if ($handleUserDirs = opendir($userDir)) {
					while (false !== ($entryUserFile = readdir($handleUserDirs))) {
						if ($entryUserFile == "." || $entryUserFile == "..") {
							continue;
						}
						$userFile = $userDir . DIRECTORY_SEPARATOR . $entryUserFile;
						$lastModifiedTime = filemtime($userFile);
						if($lastModifiedTime <= $decayTime) {
							unlink($userFile);
						}
					}
				}
				closedir($handleUserDirs);
				// Remove the user if no file is left
				if(is_dir_empty($userDir)) {
					rmdir($userDir);
				}
			}
		}
		closedir($handle);
	}
}

/**
 * Helper. Check if all CSV (of a users group members) have a GPX. If not create.
 * 1. Get all the group of the user
 * 2. Check all their csv files if they have a gpx
 *    - format is like 2013-03-21.csv > 2013-03-21.gpx
 *    - do no write files gpx files for today
 *
 * @return type
 */
function writeAllGpxFromCsvForGroup($user) {
	$group = getGroup($user);
	if (isNullOrEmptyString($group)) {
		return writeAllGpxFromCsvForUser($user);
	} else {
		if ($handle = opendir(USER_DIR)) {
			while (false !== ($entry = readdir($handle))) {
				$userDir = USER_DIR . DIRECTORY_SEPARATOR . $entry;
				if (is_dir($userDir)) {
					$groupFile = $userDir . DIRECTORY_SEPARATOR . GROUP_FILE;
					if (is_file($groupFile)) {
						$foundGroup = file_get_contents($groupFile);
						if ($foundGroup == $group) {
							if (!writeAllGpxFromCsvForUser($entry)) {
								return false;
							}
						}
					}
				}
			}
			closedir($handle);
		}
	}

	return true;
}

function writeAllGpxFromCsvForUser($user) {
	$userDir = USER_DIR . DIRECTORY_SEPARATOR . $user;
	$searchStrFileName = '/(.*).csv/i';
	$acceptedValues = '/[0-9]{2,2}-[0-9]{2,2}-[0-9]{2,2}.csv/i';
	if ($handle = opendir($userDir)) {
		while (false !== ($entry = readdir($handle))) {
			if (preg_match($acceptedValues, $entry)) {
				if (preg_match($searchStrFileName, $entry, $matches)) {
					$fileNameWithoutSuffix = $matches[1];
					// $date = date("Y-m-d");
					$date = getDateForTimezoneOffset($user, '', true);
					if ($fileNameWithoutSuffix == $date) {
						// Do not write gpx for today (unless you know exacty
						// what the user frontend/webpage does)
						continue;
					}
					$csvFile = USER_DIR . DIRECTORY_SEPARATOR . $user . DIRECTORY_SEPARATOR . $entry;
					$gpxFile = USER_DIR . DIRECTORY_SEPARATOR . $user . DIRECTORY_SEPARATOR . $fileNameWithoutSuffix . ".gpx";
					if (!is_file($gpxFile)) {
						logMessage("No gpx file $gpxFile for user:  . $entry. Creating one.");
						if (!writeGpxFromCsv($csvFile, $gpxFile)) {
							return false;
						}
					}
				}
				logMessage("Found track file $entry for user: " . $user);
			}
		}
		closedir($handle);
	}
	return true;
}

function writeGpxFromCsv($csvFilePath, $gpxFilePath) {
	$csvLines = file_get_contents($csvFilePath);
	if ($csvLines === false) {
		return;
	}
	$doc = new DomDocument("1.0", "UTF-8");
	if (!$doc) {
		logMessage("error creating dom document");
		return false;
	}
	// make the XML-file human-readable
	$doc->preserveWhiteSpace = false;
	$doc->formatOutput = true;
	// check, if we got a root element
	if (!$doc->documentElement) {
		$root = $doc->createElement("gpx");
		if (!$root) {
			logMessage("error fetching root");
			return false;
		}
		$doc->appendChild($root);
	} else {
		$root = $doc->documentElement;
	}

	// adding some attributes for the root
	$root->setAttribute('xmlns', "http://www.topografix.com/GPX/1/1");
	$root->setAttribute('creator', "geo5");
	$root->setAttribute('version', "1.1");
	$root->setAttribute('xmlns:xsi', "http://www.w3.org/2001/XMLSchema-instance");
	$root->setAttribute('xsi:schemaLocation', "http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd");

	//$myTime = getFormatedTime
	$myTime = date("Y-m-d\TH:i:s\Z");

	// create trk-element, if not already there
	$trkelement = $doc->createElement('trk');
	$root->appendChild($trkelement);
	$trksubElement = $doc->createElement('name', 'geo5-' . substr($myTime, 0, 10));
	$trkelement->appendChild($trksubElement);

	// create a trkseg-element
	$trksegelement = $doc->createElement('trkseg');
	$trkelement->appendChild($trksegelement);
	$lines = explode(PHP_EOL, $csvLines);
	$count = count($lines);
	for ($i = 0; $i < $count; $i++) {
		$line = $lines[$i];
		if(isNullOrEmptyString($line)) {
			continue;
		}

		// now create a new track-point in between the track-segment
		$element = $doc->createElement("trkpt");
		if (!$element) {
			logMessage("error creating element");
		}

		$searchString = '/lat=(.*?);/i';
		if (preg_match($searchString, $line, $matches)) {
			$element->setAttribute('lat', $matches[1]);
		} else {
			logMessage("Did not find 'lat' while writing gpx for csv line $line.");
			continue;
		}
		$searchString = '/lon=(.*?);/i';
		if (preg_match($searchString, $line, $matches)) {
			$element->setAttribute('lon', $matches[1]);
		} else {
			logMessage("Did not find 'lon' while writing gpx for csv line $line.");
			continue;
		}

		$trksegelement->appendChild($element);

		$searchString = '/altitude=(.*?);/i';
		if (preg_match($searchString, $line, $matches)) {
			$subElement = $doc->createElement('ele', $matches[1]);
			$element->appendChild($subElement);
		}
		$searchString = '/time=(.*)/i';
		if (preg_match($searchString, $line, $matches)) {
			$subElement = $doc->createElement('time', $matches[1]);
			$element->appendChild($subElement);
		}
	}
	// save it
	if ($doc->save($gpxFilePath) !== false) {
		logMessage("Wrote gpx file $gpxFilePath");
	} else {
		logMessage("Failed to write gpx file $gpxFilePath");
		return false;
	}
	return true;
}

/**
 * List the (file names of the) track for a user.
 * One track for one day.
 *
 * @param type $user
 * @return type CSV each line containing the file name of the track as '2013-03-07.csv'.
 */
function listTracksCSV($user) {
	$userDir = USER_DIR . DIRECTORY_SEPARATOR . $user;
	$acceptedValues = '/[0-9]{2,2}-[0-9]{2,2}-[0-9]{2,2}.csv/i';
	$trackFiles = '';
	if ($handle = opendir($userDir)) {
		while (false !== ($entry = readdir($handle))) {
			if (preg_match($acceptedValues, $entry)) {
				if (!isNullOrEmptyString($trackFiles)) {
					$trackFiles .= PHP_EOL;
				}
				$trackFiles .= $entry;
				logMessage("Found track file $entry for user: " . $user);
			}
		}
		closedir($handle);
	}
	return $trackFiles;
}

/**
 * Get all last postions for users and its way points after a certain time
 * 1. Get the group of the user first user (parameter)
 * 2. Get all users of this group
 * 3. Get the last position of every user (no matter of date-time). But exclude the user given
 *    in param $requestingUser
 * 4. Get all way points (for each user) for todays (!) track file (csv) after the given line (parameter)
 *    - the line for each user is set in the parameter $keyUserValueLastPairs
 *    - in case their is an unknown (probably new) user on the server in this group
 *      > then the whole track is returned. It is the same as line = '' (not set)
 *
 * @param type $keyUserValueLastPairs for examples
 *  - 'Lisa'
 *  - 'Lisa=2013-03-03T15:48:47;Peter=2013-03-03T15:48:47'
 * @param type $isRequestingTracks true if the user wants to write a track
 * @param type $requestingUser if not null or empty then this user will be excluded in the returned
 *        - position and
 *        - tracks
 * @return string tracks as CSV line this
 *  [positions]
 *  user=Peter;lat=47.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=2013-03-03T15:48:47.484
 *  user=Lisa;lat=47.50451538021159;lon=11.071421406744932;bearing=173.14859;speed=0.0;altitude=1068.2914401409275;accuracy=6.0;time=2013-03-03T15:48:57.511
 *  [track-Peter]
 *  lat=47.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=2013-03-03T15:48:47.484
 *  lat=47.50451538021159;lon=11.071421406744932;bearing=173.14859;speed=0.0;altitude=1068.2914401409275;accuracy=6.0;time=2013-03-03T15:48:57.511
 *  lat=47.50451538021159;lon=11.071521406744932;bearing=173.14859;speed=0.0;altitude=1068.2914401409275;accuracy=6.0;time=2013-03-03T15:48:57.511
 *  [track-Lisa]
 *  lat=47.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=2013-03-03T15:48:47.484
 *  lat=47.50557163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=2013-03-03T15:48:47.484
 *  lat=47.50651538021159;lon=11.071421406744932;bearing=173.14859;speed=0.0;altitude=1068.2914401409275;accuracy=6.0;time=2013-03-03T15:48:57.511
 */
function getLastPostionsAndTracksIndividually($keyUserValueLastPairs, $isRequestingTracks, $requestingUser) {
	$resultBuffer = '';
	//Read out key-value pairs (user - date/time)
	// Example: 'Lisa,2012-03-03T15:48:47.484;Peter,2012-03-03T16:48:47.484'
	if (isNullOrEmptyString($keyUserValueLastPairs)) {
		return $resultBuffer;
	}
	$user = ''; // this is the user that defines the group
	$arr = array();
	$usersWithTimeArray = explode(';', $keyUserValueLastPairs);
	$countUsers = count($usersWithTimeArray);
	if ($countUsers < 1) {
		return $resultBuffer;
	}
	for ($i = 0; $i < $countUsers; $i++) {
		$userTimePair = $usersWithTimeArray[$i];
		$userTimePair = trim($userTimePair);
		$keyValueArray = explode('=', $userTimePair);
		$countPair = count($keyValueArray);
		if ($countPair == 1) {
			// assume the user is given as parameter only
			if (isNullOrEmptyString($user)) {
				$user = $keyValueArray[0];
			}
			continue;
		}
		if ($countPair != 2) {
			return $resultBuffer;
		}
		$keyUser = $keyValueArray[0];
		$timeOfLastSentTrackPoint = $keyValueArray[1];
		if (isNullOrEmptyString($user)) {
			$user = $keyUser;
		}
		// store Lisa > 'dateTime' for later usage to get the updated way points as csv
		$arr[$keyUser] = $timeOfLastSentTrackPoint;
	}
	// all last postions
	if (isNullOrEmptyString($requestingUser)) {
		$postions = getGroupPostions($user);
	} else {
		$postions = getGroupPostions($requestingUser, $requestingUser);
	}
	if (isNullOrEmptyString($postions)) {
		return $resultBuffer;
	}
	$resultBuffer .= "[positions]" . PHP_EOL . $postions;
	// Check wether the requester wants tracks
	if(isNullOrEmptyString($isRequestingTracks)) {
		// Set 'true" as default if not given as parameter
		$isRequestingTracks = 'true';
	}
	$searchString = '/false|no/i';
	if (preg_match($searchString, $isRequestingTracks, $matches)) {
		return $resultBuffer;
	}
	// get all users that have a track file for today
	$date = getDateForTimezoneOffset($user, '', true);
	$fileName = $date . '.csv';
	$userLines = getUsersForDataFileName($user, $fileName, $requestingUser);
	// iterate through the track files of every found user and assable the return string
	if ($userLines != '') {
		$users = explode(PHP_EOL, $userLines);
		$count = count($users);
		for ($i = 0; $i < $count; $i++) {
			$userOfGroup = $users[$i];
			// Every user has its own date-time (Lisa > 2012-03-03T15:48:47.484)
			// It might be that a user is not given in the parameter (with date-time).
			// This is the case if a new user joined the group in the mean time.
			// It does not matter. The date-time is not set means: all postions from
			// todays positions is added to the result buffer (positions as csv lines).
			if (array_key_exists($userOfGroup, $arr)) {
				$lastSentTrackPointTime = $arr[$userOfGroup];
			} else {
				$lastSentTrackPointTime = '';
			}
			// Get the updated positions as csv
			$trackAsCSV = getTrack($userOfGroup, $date, $lastSentTrackPointTime);
			if (isNullOrEmptyString($trackAsCSV)) {
				continue;
			}
			if (!isNullOrEmptyString($resultBuffer)) {
				$resultBuffer .= PHP_EOL;
			}
			$resultBuffer .= '[track-' . $userOfGroup . ']' . PHP_EOL . $trackAsCSV;
		}
	}
	return $resultBuffer;
}

/**
 * Get a single track for a user
 *
 * @param type $user
 * @param type $date '2012-03-03' (optional) Takes today if ommited
 * @param type $lastSentTrackPointTime a dateTime (optional). Retrurns only way points after that time.
 * @return string track as CSV
 */
function getTrack($user, $date, $lastSentTrackPointTime) {
	if (isNullOrEmptyString($date)) {
		// $date = date("Y-m-d");
		$date = getDateForTimezoneOffset($user, '', true);
		logMessage("Missing parameter date. Take the track from today: $date");
	}
	$trackFile = USER_DIR . DIRECTORY_SEPARATOR . $user . DIRECTORY_SEPARATOR . $date . '.csv';
	if (!is_file($trackFile)) {
		logMessage("No track file $trackFile for user: " . $user);
		return '';
	}
	$positionCSVlines = file_get_contents($trackFile);
	if (isNullOrEmptyString($lastSentTrackPointTime)) {
		logMessage("No line number given. Return whole track.");
		return $positionCSVlines;
	}
	$lastSentTime = strtotime($lastSentTrackPointTime);
	$resultBuffer = '';
	$lines = explode(PHP_EOL, $positionCSVlines);
	$count = count($lines);
	for ($i = 0; $i < $count; $i++) {
		// Compare the time
		// lat=47.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=2013-03-03T15:48:47.484
		$line = trim($lines[$i]);
		$timeStampStringInLine = findDateTime($line);
		if(! isNullOrEmptyString($timeStampStringInLine)) {
			$timeStampInLine = strtotime($timeStampStringInLine);
			if($timeStampInLine <= $lastSentTime) {
				continue;
			}
		}
		if ($resultBuffer != '') {
			$resultBuffer .= PHP_EOL;
		}
		$resultBuffer .= $line;
	}
	return $resultBuffer;
}

function findDateTime($csvLine) {
	$searchString = '/(time=)([^;]+)/i';
	if (preg_match($searchString, $csvLine, $matches)) {
		$foundTime = $matches[2];
		return $foundTime;
	}
	return '';
}

/**
 * Usage: Look for a certain file (param filename) for all users of this group.
 * Return a list of users that have this file
 * 1. Get the group the user is a member of
 * 2a. User is in a group
 *    - search all users if the have the file (param filename)
 * 2b. User is not in a group
 *    - search for the file for this user only (param user)
 * @param type $user Example 'John'
 * @param type $excludeRequestingUser exclude the requesting user (example 'John') from the returned result
 * @param type $fileName Example: '2013-03-18.gpx'
 * @return string String containing all found user names separated by a newline char
 * (every line contains one user)
 */
function getUsersForDataFileName($user, $fileName, $excludeRequestingUser) {
	if (!writeAllGpxFromCsvForGroup($user)) {
		return '';
	}
	$users = '';
	$group = getGroup($user);
	if ($group == '') {
		if(!isNullOrEmptyString($excludeRequestingUser)) {
			if($user == $excludeRequestingUser) {
				return $users;
			}
		}
		$dataFile = USER_DIR . DIRECTORY_SEPARATOR . $user . DIRECTORY_SEPARATOR . $fileName;
		if (is_file($dataFile)) {
			$users = $user;
		}
	} else {
		if ($handle = opendir(USER_DIR)) {
			while (false !== ($entry = readdir($handle))) {
				if($entry == $excludeRequestingUser) {
					continue;
				}
				$userDir = USER_DIR . DIRECTORY_SEPARATOR . $entry;
				if (is_dir($userDir)) {
					$groupFile = $userDir . DIRECTORY_SEPARATOR . GROUP_FILE;
					if (is_file($groupFile)) {
						$foundGroup = file_get_contents($groupFile);
						if ($foundGroup == $group) {
							$userDataFile = $userDir . DIRECTORY_SEPARATOR . $fileName;
							if (is_file($userDataFile)) {
								if (!isNullOrEmptyString($users)) {
									$users .= PHP_EOL;
								}
								$users .= $entry;
							}
						}
					}
				}
			}
			closedir($handle);
		}
	}
	return $users;
}

/**
 * Set a configuration key-value-pair.
 * The configuration is stored in a text file in the user directory.
 * If the user is the 'admin' then the configuration is stored as server configuration.
 * Tf the configuration (key) does not exsit for the server then it is set for the user
 * and for the server.
 * @param unknown_type $user
 * @param unknown_type $key
 * @param unknown_type $value
 */
function setConfiguration($user, $key, $value) {
	if(isAdmin($user)) {
		// user is the admin > write the server config
		if(!writeConfiguration(CONFIG_FILE, $key, $value)) {
			return false;
		}
		return true;
	}
	$configFile = USER_DIR . DIRECTORY_SEPARATOR . $user . DIRECTORY_SEPARATOR . CONFIG_FILE;
	if(!writeConfiguration($configFile, $key, $value)) {
		return false;
	}
	// Check if the key-value is set for the server. If not set it.
	$existingValue = readConfiguration(CONFIG_FILE, $key);
	if(isNullOrEmptyString($existingValue)) {
		if(!writeConfiguration(CONFIG_FILE, $key, $value)) {
			return false;
		}
	}
	return true;
}

function resetConfig($user) {
	$configFile = CONFIG_FILE;
	if(!isAdmin($user)) {
		$configFile = USER_DIR . DIRECTORY_SEPARATOR . $user . DIRECTORY_SEPARATOR . CONFIG_FILE;
	}
	if(is_file($configFile)) {
		if(!unlink($configFile)) {
			logMessage("Failed to delete configuration file: $configFile");
			return false;
		}
	}
	return true;
}

/**
 * Look for the configuration value in the configuration file of the user (in the
 * user directory). If not found in the user directory then look what is set fot the server.
 * @param unknown_type $user
 * @param unknown_type $key
 * @param unknown_type $allowServerConfig if true the config of the server can be used if the
 * user has not set this key-value-pair.
 */
function getConfiguration($user, $key, $allowServerConfig) {
	$value = '';
	if(isAdmin($user)) {
		// user is the admin > read the server config
		$value = readConfiguration(CONFIG_FILE, $key);
		return $value;
	}
	$configFile = USER_DIR . DIRECTORY_SEPARATOR . $user . DIRECTORY_SEPARATOR . CONFIG_FILE;
	$value = readConfiguration($configFile, $key);
	if($allowServerConfig) {
		if(isNullOrEmptyString($value)) {
			$value = readConfiguration(CONFIG_FILE, $key);
		}
	}
	return $value;
}

/**
 * Writes configurations en bloc
 *
 * @param unknown_type $user
 * @param unknown_type $configCSV for exampe<br>
 *   timezone_offset_minutes=-60
 *   track_expiration_days=30
 *   write_track=false
 */
function setConfigurationEnBloc($user, $configCSV) {
	// Iterate through all lines
	$lines = explode(PHP_EOL, $configCSV);
	$count = count($lines);
	for ($i = 0; $i < $count; $i++) {
		$line = trim($lines[$i]);
		$keyValue = explode('=', $line);
		$countKeyValue = count($keyValue);
		if($countKeyValue != 2) {
			logMessage("Failed to read config key-value-pair (en bloc) $line for user $user");
			continue;
		}
		$key = $keyValue[0];
		$value = $keyValue[1];
		if(!setConfiguration($user, $key, $value)) {
			logMessage("Failed to read set config key-value-pair (en bloc) $line for user $user");
			return false;
		}
	}
	return true;
}
/**
 * Returns some user config.
 *
 * @param unknown_type $user
 * @return string example
 *   timezone_offset_minutes=-60
 *   track_expiration_days=30
 *   write_track=false
 */
function getConfigurations($user) {
	$configs = "";
	$value = getConfiguration($user, CONFIG_KEY_LAST_MODIFIED, false);
	if(!isNullOrEmptyString($value)) {
		$configs .= CONFIG_KEY_LAST_MODIFIED . '=' . $value;
	}
	$value = getConfiguration($user, CONFIG_KEY_IS_WRITING_TRACK, true);
	if(!isNullOrEmptyString($value)) {
		if(!isNullOrEmptyString($configs)) {
			$configs .= PHP_EOL;
		}
		$configs .= CONFIG_KEY_IS_WRITING_TRACK . '=' . $value;
	}
	$value = getConfiguration($user, CONFIG_KEY_TIMEZONE_OFFSET_MINUTES, true);
	if(!isNullOrEmptyString($value)) {
		if(!isNullOrEmptyString($configs)) {
			$configs .= PHP_EOL;
		}
		$configs .= CONFIG_KEY_TIMEZONE_OFFSET_MINUTES . '=' . $value;
	}
	$value = getConfiguration($user, CONFIG_KEY_TRACK_EXPIRATION_DAYS, true);
	if(!isNullOrEmptyString($value)) {
		if(!isNullOrEmptyString($configs)) {
			$configs .= PHP_EOL;
		}
		$configs .= CONFIG_KEY_TRACK_EXPIRATION_DAYS . '=' . $value;
	}
	return $configs;
}

////////////////////////////////////////////////////////////////////////////////
// helpers
////////////////////////////////////////////////////////////////////////////////

function is_dir_empty($dir) {
	if (!is_readable($dir)) return NULL;
	$handle = opendir($dir);
	while (false !== ($entry = readdir($handle))) {
		if ($entry != "." && $entry != "..") {
			return FALSE;
		}
	}
	return TRUE;
}

function writePositionsCSVfile($user, $dateString, $lineBuffer) {
	$posFile = USER_DIR . DIRECTORY_SEPARATOR . $user . DIRECTORY_SEPARATOR . $dateString . ".csv";
	if (is_file($posFile)) {
		$fileContent = PHP_EOL . $lineBuffer;
		if (file_put_contents($posFile, $fileContent, FILE_APPEND | LOCK_EX) !== false) {
			logMessage("Successfully wrote positions to file $posFile for user $user");
		} else {
			logMessage("Failed to write positions to file $posFile for user $user");
			return false;
		}
	} else {
		if (file_put_contents($posFile, $lineBuffer, LOCK_EX) !== false) {
			logMessage("Successfully appended positions to file $posFile for user $user");
		} else {
			logMessage("Failed to append positions to file $posFile for user $user");
			return false;
		}
	}
	return true;
}

function readConfiguration($file, $key) {
	if (!is_file($file)) {
		logMessage("No configuration value found for key $key in file: $file");
		return '';
	}
	$searchValue = '/(.*'. $key . '.*=)(.*)/i';
	$fileContent = file_get_contents($file);
	$lines = explode(PHP_EOL, $fileContent);
	$count = count($lines);
	for ($i = 0; $i < $count; $i++) {
		$line = trim($lines[$i]);
		if (preg_match($searchValue, $line, $matches)) {
			$value = trim($matches[2]);
			logMessage("Got the value $value for $key in config file: $file");
			return $value;
		}
	}
	logMessage("No configuration value found for key $key in file: $file");
	return '';
}

function writeConfiguration($file, $key, $value) {
	$fileContent = '';
	if (is_file($file)) {
		$fileContent = file_get_contents($file);
		$fileContent = removeEmptyLines($fileContent);
	}
	if($fileContent != '') {
		// Replace
		$wasReplaced = false;
		$resultBuffer = '';
		$lines = explode(PHP_EOL, $fileContent);
		$count = count($lines);
		for ($i = 0; $i < $count; $i++) {
			$line = trim($lines[$i]);
			if (preg_match('/'. $key . '/i', $line)) {
				$line = $key . '=' . $value;
				$wasReplaced = true;
			}
			if ($resultBuffer != '') {
				$resultBuffer .= PHP_EOL;
			}
			$resultBuffer .= $line;
		}
		if(!$wasReplaced) {
			if ($resultBuffer != '') {
				$resultBuffer .= PHP_EOL;
			}
			$resultBuffer .= $key . '=' . $value;
		}
		$fileContent = $resultBuffer;
	} else {
		$fileContent = $key . '=' . $value;
	}
	// store config file
	if (!file_put_contents($file, $fileContent, LOCK_EX)) {
		logMessage("Failed to write config file: $file");
		return false;
	}
	logMessage("Wrote config file: " . $file);
	return true;
}

function createUserDir($user) {
	$dirUser = USER_DIR . DIRECTORY_SEPARATOR . $user;
	if (!is_dir($dirUser)) {
		// unknown user > create directory for user
		if (!mkdir($dirUser)) {
			logMessage("Failed to create user directory: " . $dirUser);
			return false;
		}
		logMessage("Created user directory: " . $dirUser);
	}
	return true;
}

/*
 * Writes the last request parameter to a text file in the directory of the
* user (given as parameter).
* Should be called for position request only. At least this was the main purpose
* at the time of writing this method.
* @param $user
*/
function writeLastRequest($user) {
	// build a string from the request
	if(!isset($_REQUEST)) {
		// is not initialized during unit tests
		return true;
	}
	$length = count($_REQUEST);
	if($length < 1) {
		// empty during unit tests
		return true;
	}
	$requestText = '';
	foreach($_REQUEST as $key => $value)
	{
		if (! preg_match('/pass/i', $key)) {
			$requestText .= PHP_EOL . $key . '=' . $value;
		}
	}
	// Check the user directory
	if(!createUserDir($user)) {
		return false;
	}
	// store last request
	$dirUser = USER_DIR . DIRECTORY_SEPARATOR . $user;
	$requestFile = $dirUser . DIRECTORY_SEPARATOR . REQUEST_FILE;
	if (!file_put_contents($requestFile , $requestText, LOCK_EX)) {
		logMessage("Failed to write the request file: $requestFile");
		return false;
	}
	logMessage("Created request file: " . $requestFile);
	return true;
}

function isAdmin($user) {
	if (preg_match('/'. ADMIN_NAME . '/i', $user)) {
		return true;
	}
	return false;
}

function getServerInfo($user) {
	if (! isAdmin($user)) {
		logMessage("User not allowed to get server infos. User: $user");
		return '';
	}
	$infos = '';
	foreach($_SERVER as $key => $value)
	{
		$infos .= PHP_EOL . '<br/>' . $key . '=' . $value;
	}
	return $infos;
}

/**
 * Writes data into an GPX-file.
 * @param $bAppend
 * true: appends data into existing file
 * false: creates a new file
 * @param $aFile
 * the name of the xml-file
 * @param $aLatitude
 * a latitude-value
 * @param $aLongitude
 * a longitude-value
 * @param $aSpeed
 * a speed-value
 * @param $anAltitude
 * an altitude-value
 * @param $aDirection
 * a direction-value
 */
function writeGPXfile($bAppend, $aFile, $csvLines) {
	$doc = new DomDocument("1.0", "UTF-8");

	if (!$doc) {
		echo "error creating dom document";
		return false;
	}

	if ($bAppend == true) {
		// we want to append to existing data in a file
		// check before, if it exists!
		if (file_exists($aFile)) {
			$doc->load($aFile);
		}
	}

	// make the XML-file human-readable
	$doc->preserveWhiteSpace = false;
	$doc->formatOutput = true;

	// check, if we got a root element
	if (!$doc->documentElement) {
		$root = $doc->createElement("gpx");
		if (!$root) {
			echo "error fetching root";
			return false;
		}
		$doc->appendChild($root);
	} else {
		$root = $doc->documentElement;
	}

	// adding some attributes for the root
	$root->setAttribute('xmlns', "http://www.topografix.com/GPX/1/1");
	$root->setAttribute('creator', "geo5");
	$root->setAttribute('version', "1.1");
	$root->setAttribute('xmlns:xsi', "http://www.w3.org/2001/XMLSchema-instance");
	$root->setAttribute('xsi:schemaLocation', "http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd");


	$myTempTime = getdate();
	$myMonth = $myTempTime['mon'];
	if ($myMonth < 10) {
		$myMonth = "0" . $myMonth;
	}
	$myDays = $myTempTime['mday'];
	if ($myDays < 10) {
		$myDays = "0" . $myDays;
	}
	$myHours = $myTempTime['hours'];
	if ($myHours < 10) {
		$myHours = "0" . $myHours;
	}
	$myMinutes = $myTempTime['minutes'];
	if ($myMinutes < 10) {
		$myMinutes = "0" . $myMinutes;
	}
	$mySeconds = $myTempTime['seconds'];
	if ($mySeconds < 10) {
		$mySeconds = "0" . $mySeconds;
	}
	$myTime = $myTempTime['year'] . "-" . $myMonth . "-" . $myDays . "T" . $myHours . ":" . $myMinutes . ":" . $mySeconds . ".000Z+1:00";
	// create trk-element, if not already there
	$trksegelement = $doc->getElementsbyTagName('trkseg')->item(0);
	if (!$trksegelement) {
		$trkelement = $doc->createElement('trk');
		$root->appendChild($trkelement);
		$trksubElement = $doc->createElement('name', 'geo5-' . substr($myTime, 0, 10));
		$trkelement->appendChild($trksubElement);

		// create a trkseg-element
		$trksegelement = $doc->createElement('trkseg');
		$trkelement->appendChild($trksegelement);
	}
	if ($csvLines != '') {
		$lines = explode(PHP_EOL, $csvLines);
		$count = count($lines);
		for ($i = 0; $i < $count; $i++) {
			$line = $lines[$i];

			// now create a new track-point in between the track-segment
			$element = $doc->createElement("trkpt");
			if (!$element) {
				logMessage("error creating element");
			}

			$searchString = '/lat=(.*?);/i';
			if (preg_match($searchString, $line, $matches)) {
				$element->setAttribute('lat', $matches[1]);
			} else {
				logMessage("Did not find 'lat' while writing gpx for csv line $line.");
				return false;
			}
			$searchString = '/lon=(.*?);/i';
			if (preg_match($searchString, $line, $matches)) {
				$element->setAttribute('lon', $matches[1]);
			} else {
				logMessage("Did not find 'lon' while writing gpx for csv line $line.");
				return false;
			}

			$trksegelement->appendChild($element);

			$searchString = '/altitude=(.*?);/i';
			if (preg_match($searchString, $line, $matches)) {
				$subElement = $doc->createElement('ele', $matches[1]);
				$element->appendChild($subElement);
			}
			$searchString = '/time=(.*)/i';
			if (preg_match($searchString, $line, $matches)) {
				$subElement = $doc->createElement('time', $matches[1]);
				$element->appendChild($subElement);
			}
		}
		// save it
		if ($doc->save($aFile) !== false) {
			logMessage("Wrote gpx file $aFile");
		} else {
			logMessage("Failed to write gpx file $aFile");
			return false;
		}
		return true;
	}
}

function writePositionFile($user, $csvLine) {
	$posFile = USER_DIR . DIRECTORY_SEPARATOR . $user . DIRECTORY_SEPARATOR . POSITION_FILE;
	if (!file_put_contents($posFile, $csvLine)) {
		logMessage("Failed to write position file $posFile for user $user");
		return false;
	}
	logMessage("Succefully wrote position file $posFile for user $user");
	return true;
}

function writeGroupFile($user, $group) {
	$groupFile = USER_DIR . DIRECTORY_SEPARATOR . $user . DIRECTORY_SEPARATOR . GROUP_FILE;
	if (is_file($groupFile)) {
		$existingGroup = file_get_contents($groupFile);
		if ($existingGroup === $group) {
			logMessage("Group $group does not have to be changed for user $user.");
			return true;
		} else {
			logMessage("Group  $existingGroup has to be changed to $group for user $user.");
		}
	}
	if(isNullOrEmptyString($group)) {
		if(is_file($groupFile)) {
			if(unlink($groupFile)) {
				return true;
			} else {
				logMessage("Failed to delete the group file $groupFile for user $user");
				return false;
			}
		} else {
			return true;
		}
	}
	if (!file_put_contents($groupFile, $group)) {
		logMessage("Failed to write the group file $groupFile for user $user");
		return false;
	}
	logMessage("Succefully wrote group file $groupFile for user $user");
	return true;
}

function getHashForUserPass($userName, $pass) {
	if (NULL == $pass) {
		$pass = ' ';
	}
	$hash = md5(md5($userName) . $pass);
	logMessage("Created hash value for user $userName");
	return $hash;
}

function removeEmptyLines($text) {
	return preg_replace("/(^[\r\n]*|[\r\n]+)[\s\t]*[\r\n]+/", "", $text);
}

function isNullOrEmptyString($s) {
	if (NULL == $s) {
		return true;
	}
	if ('' == $s) {
		return true;
	}
	return false;
}

function removeDir($path) {
	if (!is_dir($path)) {
		return;
	}
	// Normalise $path.
	$path = rtrim($path, '/') . '/';
	// Remove all child files and directories.
	$items = glob($path . '*');
	foreach ($items as $item) {
		is_dir($item) ? removeDir($item) : unlink($item);
	}
	// Remove directory.
	rmdir($path);
}

function logMessage($s) {
	if (LOGGING_ON) {
		echo NEW_LINE_LOG . $s;
	}
}

function getFormatedTime($timeParam) {
	$myTempTime = getdate();
	if (isNullOrEmptyString($timeParam)) {
		$myTempTime = getdate($timeParam);
	}
	$myMonth = $myTempTime['mon'];
	if ($myMonth < 10) {
		$myMonth = "0" . $myMonth;
	}
	$myDays = $myTempTime['mday'];
	if ($myDays < 10) {
		$myDays = "0" . $myDays;
	}
	$myHours = $myTempTime['hours'];
	if ($myHours < 10) {
		$myHours = "0" . $myHours;
	}
	$myMinutes = $myTempTime['minutes'];
	if ($myMinutes < 10) {
		$myMinutes = "0" . $myMinutes;
	}
	$mySeconds = $myTempTime['seconds'];
	if ($mySeconds < 10) {
		$mySeconds = "0" . $mySeconds;
	}
	$myTime = $myTempTime['year'] . "-" . $myMonth . "-" . $myDays . "T" . $myHours . ":" . $myMinutes . ":" . $mySeconds . ".000Z+1:00";
	return $myTime;
}

/**
 * Try to guess the time format and return the time in this format 2013-03-25T21:17:33.123Z+1:00
 *
 * @param type $formatedTime Examples:
 *                                - 2013-03-25T21:17:33.123Z+1:00 (this format would the default that is returned)
 *                                - 2013-03-25T21:17:33.123
 *                                - 2013-03-25_14:43:01
 *                                - '1364243984' (seconds since 1970)
 *                                - '1364243984123' (microseconds since 1970)
 * @return string 2013-03-25T21:17:33.123Z+1:00 or the input parameter in guess not successfull
 */
function getTimeFormatGuessed($formatedTime) {
	$searchStringSeconds = '/^(\d{10,10}).*$/';
	$searchStringReadable = '/(\d\d\d\d)(.*?)(\d\d)(.*?)(\d\d)(.*?)(\d\d)(.*?)(\d\d)(.*?)(\d\d)(.*)/';
	if (preg_match($searchStringReadable, $formatedTime, $matches)) {
		$formatedTimeGuessed = $matches[1] . '-' . $matches[3] . '-' . $matches[5] . 'T' . $matches[7] . ':' . $matches[9] . ':' . $matches[11] . $matches[12];
		return $formatedTimeGuessed;
	} else if (preg_match($searchStringSeconds, $formatedTime, $matches)) {
		$formatedTimeGuessed = date("Y-m-d\TH:i:s\Z", $matches[1]);
		return $formatedTimeGuessed;
	} else {
		return $formatedTime;
	}
}
function getDateForTimezoneOffset($user, $formatedTime, $returnDateOnly) {
	date_default_timezone_set('UTC');
	$formatedTimeGuessed = '';
	$format = 'Y-m-d\TH:i:s';
	if(isNullOrEmptyString($formatedTime)) {
		$formatedTimeGuessed = date($format);
	} else {
		$searchStringSeconds = '/^(\d{10,10}).*$/';
		$searchStringReadable = '/(\d\d\d\d)(.*?)(\d\d)(.*?)(\d\d)(.*?)(\d\d)(.*?)(\d\d)(.*?)(\d\d)(.*?)/';
		if (preg_match($searchStringReadable, $formatedTime, $matches)) {
			$formatedTimeGuessed = $matches[1] . '-' . $matches[3] . '-' . $matches[5] . 'T' . $matches[7] . ':' . $matches[9] . ':' . $matches[11];
		} else if (preg_match($searchStringSeconds, $formatedTime, $matches)) {
			$formatedTimeGuessed = date($format, $matches[1]);
		} else {
			return '';
		}
	}
	//$date = DateTime::createFromFormat($format, '2009-02-15 15:16:17');
	$date = DateTime::createFromFormat($format, $formatedTimeGuessed);
	// Get the timezone offset from configuration
	$minutes = getConfiguration($user, CONFIG_KEY_TIMEZONE_OFFSET_MINUTES, true);
	if (!is_numeric($minutes)) {
		$minutes = '';
	}
	if($minutes != '') {
		$int = (int)$minutes;
		if($int < 0) {
			// This is Berlin for example: -120 in the summer
			// -120 minutes was produced by the browser as timezone offset and sent to the server
			$min = (string) ($int * -1);
			$date->add(new DateInterval('PT' . $min . 'M'));
		} else {
			$min = (string) $int;
			$date->sub(new DateInterval('PT' . $min . 'M'));
		}
	}
	if($returnDateOnly) {
		return $date->format("Y-m-d");
	} else {
		return $date->format("Y-m-d\TH:i:s");
	}
}

function get_ebay_UTC_8601($time) {
	$t = new DateTime($time);
	$t->setTimezone(new DateTimeZone("UTC"));
	return $t->format("Y-m-d\TH:i:s\Z");
}

?>