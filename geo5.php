<?php

// 2013-07-19: Checked in at soureforge under . GPLv3
// test from new environment

include 'util.php';
header("Access-Control-Allow-Origin: *");
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

// Every request must have a userAnonym
$user = getParam('user');
if (isNullOrEmptyString($user)) {
	setServerError("GET/POST parameter 'user' is missing.");
	return;
}

// New Password
$isUserAccepted = getParam('isUserAccepted');
if (!isNullOrEmptyString($isUserAccepted)) {
	if (!isUserAccepted($user, getParam('pass'))) {
		setServerError("User not accepted, user $user.");
		return;
	}
	setServerResponse("$user");
	return;
}

//Accept only user with valid password
$pass = getParam('pass');
if (!checkUser($user, $pass)) {
	setServerError("Format of user name OR password no accepted for user $user.");
	return;
}

// New Password
$passNew = getParam('passNew');
if (!isNullOrEmptyString($passNew)) {
	if (!changePassword($user, $pass, $passNew)) {
		setServerError("Failed to change password for user $user.");
		return;
	}
	setServerResponse("Ok, changed password for user $user.");
	return;
}

// New Group
$groupNew = getParam('groupNew');
if (!isNullOrEmptyString($groupNew)) {
	if (!changeGroup($user, $pass, $groupNew)) {
		setServerError("Failed to change group for user $user.");
		return;
	}
	setServerResponse("Ok, changed group for user $user.");
	return;
}

// Remove user
$remove = getParam('remove');
if (!isNullOrEmptyString($remove)) {
	// any value is accepted (no need to set 'true' or 'yes' like 'remove=true')
	if (!removeUser($user, $pass)) {
		setServerError("Failed to remove user $user.");
		return;
	}
	setServerResponse("Ok, removed user $user.");
	return;
}

// server info for admin only
$serverInfo = getParam('serverInfo');
if (!isNullOrEmptyString($serverInfo)) {
	$info = getServerInfo($user);
	if ($info == '') {
		setServerError("Failed to get details on the server for user $user.");
		return;
	}
	setServerResponse($info);
	return;
}

// server info for admin only
$phpInfo = getParam('phpInfo');
if (!isNullOrEmptyString($phpInfo)) {
	if (! preg_match('/admin/i', $user)) {
		setServerError("Failed to get php infos (not allowed) for user $user.");
		return;
	}
	phpinfo();
	return;
}

// set configurations (expiration day, timezone offset, write tracks,...)
$setConfiguration = getParam('set_configuration');
if (!isNullOrEmptyString($setConfiguration)) {
	if (!setConfigurationEnBloc($user, $setConfiguration)) {
		setServerError("Failed to write postion for user $user.");
		return;
	}
	setServerResponse("Ok, server wrote configuration for user $user.");
	return;
}

// get configurations (expiration day, timezone offset, write tracks,...)
$getConfiguration = getParam('get_configuration');
if (!isNullOrEmptyString($getConfiguration)) {
	$configs = getConfigurations($user);
	setServerResponse($configs);
	return;
}

// Write single position
$lat = getParam('lat');
if (!isNullOrEmptyString($lat)) {
	$lon = getParam('lon');
	if (isNullOrEmptyString($lon)) {
		setServerError("Missing parameter: lon . You gave lat (latitude) without lon (longitude).");
		return;
	}
	if (!writePostion($user, getParam('group'), $lat, $lon, getParam('bearing'), getParam('speed'), getParam('altitude'), getParam('accuracy'), getParam('time'), getParam('track'))) {
		setServerError("Failed to write postion for user $user.");
		return;
	}
	setServerResponse("Ok, server wrote position for user $user.");
	return;
}

// Write multiline positions for a user
$positions = getParam('positions');
if (!isNullOrEmptyString($positions)) {
	if (!writePostions($user, getParam('group'), $positions, getParam('track'))) {
		setServerError("Failed to write postions for user $user.");
		return;
	}
	setServerResponse("Ok, server wrote positions for user $user.");
	return;
}

// Get the position of all users belonging to the group of this user of a user
$getGroupPositionsForUser = getParam('getGroupPostions');
if (!isNullOrEmptyString($getGroupPositionsForUser)) {
	$currentPositions = getGroupPostions($user);
	if (isNullOrEmptyString($currentPositions)) {
		setServerError("Failed to get group postions for user $user.");
		return;
	}
	setServerResponse($currentPositions);
	return;
}

// Get the position of a user
$getPositionForUser = getParam('getPosition');
if (!isNullOrEmptyString($getPositionForUser)) {
	$currentPosition = getPosition($getPositionForUser);
	if (isNullOrEmptyString($currentPosition)) {
		setServerError("Failed to get postion for user $getPositionForUser.");
		return;
	}
	setServerResponse($currentPosition);
	return;
}

// Get the positions of a group
$getPositionsForGroup = getParam('getPositions');
if (!isNullOrEmptyString($getPositionsForGroup)) {
	$currentPositions = getPositions($getPositionsForGroup);
	if (isNullOrEmptyString($currentPositions)) {
		setServerError("Failed to get postions for group $getPositionsForGroup.");
		return;
	}
	setServerResponse($currentPositions);
	return;
}

// List the tracks of a user
$userToList = getParam('listTracks');
if (!isNullOrEmptyString($userToList)) {
	// clean up old tracks and all inactive users (decay time is set via configuration)
	cleanUp($user);
	// Now try to find the tracks for the user and all of the group members
	$getTimezoneoffset = getParam('timezoneoffset');
	$tracks = listTracks($user, $getTimezoneoffset);
	//    if (isNullOrEmptyString($tracks)) {
	//        setServerError("Failed to get tracks for user $userToList.");
	//        return;
	//    }
	$group = getParam('group');
	$pass = getParam('pass');
	if (!changeGroup($user, $pass, $group)) {
		setServerError("Failed to change group for user $user.");
		return;
	}
	setServerResponse($tracks);
	return;
}

// Get a track for a user
$getTrackForUser = getParam('getTrack');
if (!isNullOrEmptyString($getTrackForUser)) {
	$track = getTrack($getTrackForUser, getParam('date'), getParam('last'));
	if (isNullOrEmptyString($track)) {
		setServerError("Failed to get tracks for user $getTrackForUser.");
		return;
	}
	setServerResponse($track);
	return;
}

// Get all users (of a group) that have a given data file(name)
$getUsersForFileName = getParam('getUsersForFileName');
if (!isNullOrEmptyString($getUsersForFileName)) {
	$fileName = getParam('filename');
	$users = getUsersForDataFileName($user, $fileName);
	if (isNullOrEmptyString($getUsersForFileName)) {
		setServerError("Failed to get users for filename $fileName for user $user.");
		return;
	}
	setServerResponse($users);
	return;
}

// Get all users (of a group) that have a given data file(name)
$getLastPostionsAndTracks = getParam('getLastPostionsAndTracksIndividually');
if (!isNullOrEmptyString($getLastPostionsAndTracks)) {
	// 1. Write the group if given
	$group = getParam('group');
//	if (!isNullOrEmptyString($group)) {
		if (!writeGroupFile($user, $group)) {
				setServerError("Failed to change group for user $user.");
				return;
		}
//	}
	// 2. Get positionm and tracks
	$postions = getLastPostionsAndTracksIndividually($getLastPostionsAndTracks, getParam('track'), $user);
	if (isNullOrEmptyString($postions)) {
		// 		setServerError("Failed to get last postions and tracks for $getLastPostionsAndTracks");
		// 		return;
		// It might happen that a new user has nothing on the server
		$postions = '';
	}
	setServerResponse($postions);
	return;
}

setServerError('Server does not know what to do. Give on of the following parameters: passNew (change password), groupNew (change group), remove (delete user), lat (write one position), postions (write more than one positions), getPosition (get postion of user), getPositions (get postions of group), listTracks (list tracks of user), getTrack (get single track)');
return;

/////////////////////////////////////////////////////////////////////////
// Helpers
/////////////////////////////////////////////////////////////////////////

function setServerResponse($message) {
	echo $message;
}

function setServerError($message) {
	echo '!Error: ' . $message;
}

function getParam($paramName) {
	$paramValue = '';
	if (isset($_GET[$paramName])) {
		$paramValue = $_GET[$paramName];
	} else if(isset($_POST[$paramName])) {
		$paramValue = $_POST[$paramName];
	}
	return $paramValue;
}

function getParam_locally($paramName) {
	$paramValue = $_GET[$paramName];
	if (isNullOrEmptyString($paramValue)) {
		$paramValue = $_POST[$paramName];
	}
	return $paramValue;
}

?>