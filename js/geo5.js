var version = "Version 2015-07-30, GPLv3";
//-------------------
//-- Docu messages --
//
//  1. Save Configuration
//    When called?
//    - Only once at start up
//    - If the user closes "You", "Positions", "Share", "Tracks", "Settings"
//    Request message
//    - Browser > Server
//      "user=me&pass=mysecret&set_configuration=last_modified=2012-05-17 18:02:56.063\ntimezone_offset_minutes=60\ntrack_expiration_days=30\nwrite_track=true"
//      - user=me
//      - pass=mysecret
//      - set_configuration=
//        - last_modified=2012-05-17 18:02:56.063
//        - timezone_offset_minutes=60
//        - track_expiration_days=30
//        - write_track=true
//    - Check user, pass. Create user if not known.
//    Response message
//    - Server > Browser
//      "Ok, server wrote configuration for user me."
//
//  2. List Tracks
//    When called?
//    - Only once at start up
//    - After saving the configuration, see above
//    Request message
//    - Browser > Server
//      "user=me&pass=mysecret&group=mygroup&listTracks=true&timezoneoffset=60"
//      - user=me
//      - pass=mysecret
//      - group=mygroup
//      - listTracks=true&timezoneoffset=60
//    Action on server
//    - Check user and pass. Create user if not known.
//    - Remove all tracks and all users that are to old
//    - List track files of the user
//      1) Check the if the user knows its timezone offset (as configuration) > set if not known by the server
//      2) Create gpx files from csv files if the gpx do not exist yet. Return a list of track file names.
//    - Change the group of the user if neccessary
//    Response message
//    - Server > Browser
//      "2014-09-17.gpx\n2014-09-18.gpx\n2014-09-19.gpx"
//
//  3. Upoad Position and/or Track
//    When called?
//    - Every time after message 3) (see above) that is triggerd by windows.startSharing()
//    Explanations
//    - The request is blocked (has to wait) as long as the xhr request (see message #3 above ) is running.
//    - The request is sent only if the browser has a new position / track points
//    Request message
//    - Browser > Server
//      "user=me&pass=mysecret&group=mygroup&track=true&positions=lat=43.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=2012-03-03T15:48:47.484\nlat=44.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=2012-03-03T15:48:47.484"
//    - user=me
//    - pass=mysecret
//    - group=mygroup
//    - track=true / false (store track on the server?)
//    - positions=
//        lat=43.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=2012-03-03T15:48:47.484
//        lat=44.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=2012-03-03T15:48:47.484"
//    Action on server
//    - "position.csv" is written containing the most recent position only
//    - "2014-09-20.csv" ( {today}.csv file) is written, if the parameter "track=true" was sent
//    - "request.txt" is written for debugging only (it is never used by the application)
//    Response message
//    - Server > Browser
//      "Ok, server wrote positions for user me."

//  4. Get Positions and Tracks
//    When called?
//    - Once at start up: After list tracks, see step 2) above, or
//    - Every time by windows.startSharing() by the browser, where the intervall is set by the user under "share" (2s, 10s, 1min, 10min, never)
//    Explanations
//    - The browser allways requests the track, no matter if the user is recording a track.
//    - The request is blocked (has to wait) as long as another xhr request is running.
//    Request message
//    - Browser > Server
//      "user=me&pass=mysecret&track=true&getLastPostionsAndTracksIndividually=Peter=2013-10-09 18:46:38;Lisa=2013-10-09 18:47:38"
//      - user=me
//      - pass=mysecret
//      - track=true
//      - getLastPostionsAndTracksIndividually=Peter=2013-10-09 18:46:38;Lisa=2013-10-09 18:47:38
//    Action on server
//      1. Get the group of the user first user (parameter)
//      2. Get all users of this group
//      3. [positions] Get the last position of every user (no matter of date-time)
//      4. [track-Peter] Get all way points (for each user) for todays (!) track file (csv) after the given line (parameter)
//       - the line for each user is set in the parameter $keyUserValueLastPairs
//       - in case their is an unknown (probably new) user on the server in this group
//         > then the whole track is returned. It is the same as line = '' (not set)
//    Response message
//    - Server > Browser
//      [positions]
//      user=Peter;lat=47.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=2013-03-03T15:48:47.484
//      user=Lisa;lat=47.50451538021159;lon=11.071421406744932;bearing=173.14859;speed=0.0;altitude=1068.2914401409275;accuracy=6.0;time=2013-03-03T15:48:57.511
//      [track-Peter]
//      lat=47.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=2013-03-03T15:48:47.484
//      lat=47.50451538021159;lon=11.071421406744932;bearing=173.14859;speed=0.0;altitude=1068.2914401409275;accuracy=6.0;time=2013-03-03T15:48:57.511
//      lat=47.50451538021159;lon=11.071521406744932;bearing=173.14859;speed=0.0;altitude=1068.2914401409275;accuracy=6.0;time=2013-03-03T15:48:57.511
//      [track-Lisa]
//      lat=47.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=2013-03-03T15:48:47.484
//      lat=47.50557163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=2013-03-03T15:48:47.484
//      lat=47.50651538021159;lon=11.071421406744932;bearing=173.14859;speed=0.0;altitude=1068.2914401409275;accuracy=6.0;time=2013-03-03T15:48:57.511
//
//
//-- Docu messages end --
//-----------------------
//
//-------------------
//-- Docu behavior --
//  
//   Main program flow
//   Main program flow - Close / save settings (user, pass, intervalls,..)
//   1. Upload configuration
//      Why? To inform the server of:
//      - timezone_offset_minutes=60 > used to split the tracks into days. The server
//        must know when a user in Asia or Europe has midnight.
//      - track_expiration_days=30 > This is the expiration time for tracks and for
//        the user too. All data that is older is deleted from thee server. Even the whole user
//        is removed if he was not active for this period of time (same as "remove user" in
//        this case).
//      - write_track=true > write also track files (in addition to the position file
//        that is allway written)
//      The server request is asynchronous.
//      The program flow does not block. So it might be half parallel to the following steps.
//   2. Upload the group
//      Why?
//      Server request is asynchronous
//      The program flow blocks and waits to execute the next step
//   3. List tracks
//      The server sends a list of track files, e.g. 2014-10-04.gpx for the (browser) user
//   4. Upload position(s) / track
//      Upload own positions and track points (if the user pressed "Track").
//      Unsent rack points will never be deleted before the are successfully sent to the server.
//      Exception: The (browser) user changes the name.
//   5. Download position / track of group members
//      Download the position and track of group members.
//      If if the
//      - (browser) or
//      - a (former) group member
//      changes the group then the displayed user will change accordingly.
//
//   Main program flow - Press "Start"
//   1. Upload position(s) / track
//      Description see above
//   2. Download position / track of group members
//      Description see above
//   3... Two loops are running
//      - window.setIntervall(...) which is set by the interval under "Share"
//      - geo-location of browser according to the settings under "Position"
//      Both loops can trigger the upload and download of position(s), see steps before.
//
//   Tracks
//     There are two buffers for tracks
//     - to draw a track an the map
//     - to send share track points (via server)
//       What does it mean? If a track point was shared successfully (sent to the server)
//       then this track point will be removed from the buffer.
//     Both buffers are stored in local storage just in case the user
//     closes the browser.
//
//-- Docu behavior end --
//-------------------------

// Main "synchronized" action
var isInputOutputBlocked = false;
var bufferInput = "";

// User Settings via input fields
var VALUE_TODAY_IN_TRACK_LIST = "today";
var VALUE_TRACK_IN_LAYER_LIST = "Track ";
var VALUE_BROWSER_IN_LAYER_LIST = "Browser Position";
var trackDate = 'today';
var VALUE_TODAY = 'today';
var VALUE_PLEASE_SELECT = 'Please select';
var trackDateListBuffer = "";
var trackNameSelected = "";
var browser = false;
var windowIntervall = -1;
var windowBaseInterval = 2000; // 2.000 ms = 2 seconds

// GUI input elements
var KEY_USER = "user";
var KEY_PASS = "pass";
var KEY_PASS_NEW = "passNew";
var KEY_GROUP = "group";
var KEY_SHOW_DETAILS = "show.details";
var KEY_INTERVALL_SERVER = "intervall.server";
var KEY_CENTER = "follow";
var KEY_INTERVALL_POSITION = "intervall.position"
var KEY_ACCURACY_POSITION = "accuracy.position";
var KEY_MIN_DISTANCE = "distance.min";
var KEY_STORE_TRACK = "write_track"; // same with server
var KEY_SCRIPT_URL = "script.url";
var KEY_DEBUG_MESSAGES = "show.debug.messages";
var KEY_EXPIRATION_DAYS = "track_expiration_days"; // same with server
var KEY_TIMEZONE_OFFSET = "timezone_offset_minutes"; // same with server
var KEY_MARKER_ICON = "marker.icon";
var KEY_MARKER_SIZE = "marker.size";
var inputKeys = new Array(KEY_USER, KEY_PASS, KEY_GROUP, KEY_PASS_NEW,
		KEY_SHOW_DETAILS, KEY_INTERVALL_SERVER, KEY_CENTER,
		KEY_INTERVALL_POSITION, KEY_ACCURACY_POSITION,
		KEY_STORE_TRACK, KEY_SCRIPT_URL, KEY_DEBUG_MESSAGES,
		KEY_EXPIRATION_DAYS, KEY_TIMEZONE_OFFSET, KEY_MARKER_ICON,
		KEY_MARKER_SIZE, KEY_MIN_DISTANCE);
var inputValues = new Array("", "", "", "", "", "", "", "", "", "", "", "", "",
		"", "", "", "", "", "");

var KEY_CONFIG_LAST_MODIFIED = "last_modified"; // for server config
var serverConfigLastModified = "";

var arrayTimezoneOffsets = new Array("12 United States Minor Outlying Islands",
		"11 Hawaii", "10 Cook Islands", "9 Alaska", "8 Pacific Time Zone",
		"7 Mountain Time Zone", "6 Central Time Zone", "5 New York",
		"4 Atlantic Time Zone", "3 Buenos Aires",
		"2 South Georgia and the South Sandwich Islands", "1 Azores",
		"0 London", "-1 Berlin", "-2 Athens", "-3 Baghdad", "-4 Moscow",
		"-5 Maldives", "-6 Yekaterinburg", "-7 Bangkok", "-8  Beijing",
		"-9 Tokyo", "-10 Papua New Guinea", "-11 Vladivostok Time",
		"-12 Auckland");
var arrayExpirationDays = new Array("1", "7", "30", "360");
var DEFAULT_EXPIRATION = "30";
var arrayAccuracy = new Array("20", "30", "40", "50", "100", "1000", "10000");
var DEFAULT_ACCURACY = "10000";
var arrayMinDistance = new Array("10", "20", "30", "40", "50", "100", "1000");
var DEFAULT_MIN_DISTANCE = "10";
var lastPosition = "";

// Map settings
var focusedUser = '';
var defaultZoom = 15;
var isZoomed = false;
var isPolling = false;
var timestampLastShareAttempt = 0; // milliseconds
var wasStoppedByUser = false;
var hasToLoadGpxTracksAtProgrammStart = true;
var isWaitingForServerResponse = false;
var nextXHR = '';
var XHR_KEY_ACTION_LIST_TRACKS = "2";
// var XHR_KEY_ACTION_SHOW_POSITIONS_INITIALLY = "3";
var XHR_KEY_ACTION_DOWNLOADED_POSITION = "4";
var XHR_KEY_ACTION_UPDATE_TRACKS = "5";
var XHR_KEY_ACTION_UPLOADED_POSITIONS = "6";
var XHR_KEY_ACTION_REMOVE_USER = "7";
var XHR_KEY_ACTION_CHANGE_PASS = "8";
var XHR_KEY_ACTION_GET_SERVER_CONFIG = "9";
var map; // complex object of type OpenLayers.Map
// { [Lisa], [Peter],... }
var positionLayers = new Array();
// { [Track Lisa], [Track Peter],... }
var trackLayers = new Array();
// { Array{ [Lisa], [66], [54.1], [13.4] }, Array{ [Peter], [298], [54.1],
// [13.4] } }
// { Array{ [user-name], [lineNumber], [lat], [lon] },... } }
// Used to download the new track points only
var groupMembers = new Array();
/** user name */
var KEY_GROUP_MEMBER_NAME = 0;
/** date-time of last position used to request track points */
var KEY_GROUP_MEMBER_DATETIME_LAST_POSITION = 1;
/** user latitude */
var KEY_GROUP_MEMBER_LAT = 2;
/** user lonngitute */
var KEY_GROUP_MEMBER_LON = 3;
/** user speed */
var KEY_GROUP_MEMBER_SPEED = 4;
/** user altitude */
var KEY_GROUP_MEMBER_ALTITUDE = 5;
/** user accurace of position */
var KEY_GROUP_MEMBER_ACCURACY = 6;
/** user start time of track */
var KEY_GROUP_MEMBER_TRACK_START_TIME = 7;
/** user count of track points */
var KEY_GROUP_MEMBER_TRACKPOINTS_COUNT = 8;
/** user track distance */
var KEY_GROUP_MEMBER_TRACK_DISTANCE = 9;

// Tracks
// track from today as CSV lines
/* lat=47.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=2013-03-03_15:48:47.484 */
var bufferTrackPointsToDraw = "";
var KEY_BROWSER_BUFFER_TRACK_POINTS_TO_DRAW = "browser_track_today";
var bufferTrackPointsToSend = "";  // make sure that this is not deleted befor it was sent
var arrayBufferTrackPointsToSend = new Array();
//key for local storage to store the browser track for restarts of the browser
var KEY_BROWSER_BUFFER_TRACK_POINTS_TO_SEND = "browser_track_to_send";
var bufferTrackPointsOnTheWayToServer = ""; // this is the part of the track that is just on the way to the server
var csvLastGeoLocationToShare = ""; // Used for upload if nothing is in in the send buffer

// XHR
var xhr;
// in milliseconds, change if you want to debug
var xhrTimoutDefault = 600000; // ms = 1000ms * 60 * 5 = 5min, used after unit tests
var xhrTimoutUnitTests = 1000; // used befor unit tests
var xhrTimout = xhrTimoutDefault;
var xhrLastServerResponse = "";
var ID_DOWNLOAD = "id_download"
var xhrMessage = "";

var DEFAULT_USER_NAME = "Anonym";
var lastWarningMessage = "";
var lastDebugMessage = "";
// marker icon
// https://commons.wikimedia.org/wiki/Category:Mushroom_icons
// var markerIcon = 'pic/200px-Mushroom.svg';
// var markerIcon = 'pic/marker.svg';
var DEFAULT_MARKER_ICON = 'mushroom.svg';
var DEFAULT_MARKER_SIZE = 4;
var MARKER_DIR = 'pic/';
var arrayMarkerIcons = new Array("mushroom.svg", "marker.png");
var arrayMarkerSizes = new Array(1, 2, 4);
// var markerIcon = 'http://www.openstreetmap.org/openlayers/img/marker.png';

// Geolocation
var style = {
	fillColor : '#000',
	fillOpacity : 0.1,
	strokeWidth : 0
};
// Geolocation

function init() {
	clearMessages();
	initMap();
	if (isStartingWithTests()) {
		startTests();
	} else {
		startApp();
	}
}

function startApp() {
	clearAtStartUp();
	restoreSettings();
	// Get track points that where not sent yes and try to send them again
	bufferTrackPointsToSend = getItemFromlocalStorage(KEY_BROWSER_BUFFER_TRACK_POINTS_TO_SEND);
	
	// Fill array
	if(! isEmptyString(bufferTrackPointsToSend)) {
		arrayBufferTrackPointsToSend = new Array();
		var bufPoints = bufferTrackPointsToSend.split("\n");
		var pointCount = bufferTrackPointsToSend.length;
		for ( var i = 0; i < pointCount; i++) {
			arrayBufferTrackPointsToSend.push(bufPoints[i]);
		}
	}
	
	drawStoredTrackAndPosition();
	// Download the user data (position marker and track).
	// This will get the positions and tracks of all group members too.
	focusedUser = getValue(KEY_USER);
	if (focusedUser != DEFAULT_USER_NAME) {
		// this implicitly downloads the positions and tracks
		// xhrGetConfig();
		xhrListTracks();
		startShareAndPositionUpdate();
	} else {
		// Default user "Anonym"
		showStartMap();
		restartPositionUpdate();
	}
	showMainNavBar(0, false, -1);

	// showWarning("This is the latest developer version (10-11-2013)");
}

// ###################################################################
// -- Maps -----------------------------------------------------------
// -------------------------------------------------------------------

function initMap() {
	try {
		map = new OpenLayers.Map("map", {
			controls : [ new OpenLayers.Control.Navigation(),
					new OpenLayers.Control.PanZoomBar(),
					new OpenLayers.Control.LayerSwitcher(),
					new OpenLayers.Control.Attribution() ],
			maxExtent : new OpenLayers.Bounds(-20037508.34, -20037508.34,
					20037508.34, 20037508.34),
			maxResolution : 156543.0399,
			numZoomLevels : 19,
			units : 'm',
			projection : new OpenLayers.Projection("EPSG:900913"),
			displayProjection : new OpenLayers.Projection("EPSG:4326")
		});
	} catch (e) {
		return;
	}

	// Define the map layer
	// Here we use a predefined layer that will be kept up to date with URL
	// changes
	layerMapnik = new OpenLayers.Layer.OSM.Mapnik("Mapnik");
	map.addLayer(layerMapnik);
	layerCycleMap = new OpenLayers.Layer.OSM.CycleMap("CycleMap");
	map.addLayer(layerCycleMap);

	// handle events if users/tracks selected or deselected
	map.events.register('changelayer', null, function(evt) {
		if (evt.property === "visibility") {
			// alert(evt.layer.name + " layer visibility changed
			// to " + evt.layer.visibility );
			if (evt.layer.visibility == true) {
				var l = positionLayers.length;
				var layerName = evt.layer.name;
				if (l > 0) {
					for ( var i = 0; i < l; i++) {
						var userName = positionLayers[i].name;
						if (userName == layerName) {
							focusedUser = layerName;
							showDetailsOnFocusedUser();
							centerMapForUser(evt.layer);
							return;
						}
					}
				}
				l = trackLayers.length;
				if (l > 0) {
					for ( var i = 0; i < l; i++) {
						var trackName = trackLayers[i].name;
						if (trackName == layerName) {
							centerMapForTrack(evt.layer);
							return;
						}
					}
				}
			}
		}
	});
}

function mapRemoveLayer(layer) {
	if (!map) {
		return;
	}
	map.removeLayer(layer);
}

// //////////////////////////////////////////////////////////////////////////////
// Default position
// //////////////////////////////////////////////////////////////////////////////
function showStartMap() {
	if (!map) {
		return;
	}
	// Show a welcome position
//	var layerMarkers = createPositionLayer("Welcome Position");
//	var icon = createMarkerIcon();
//	var lonLat = createLonLat(13.5, 54.342);
//	layerMarkers.addMarker(new OpenLayers.Marker(lonLat, icon));
//	map.setCenter(lonLat, defaultZoom);
}

function mapAddLayer(layer) {
	if (!map) {
		return;
	}
	map.addLayer(layer);
}

function mapRemoveLayer(layer) {
	if (!map) {
		return;
	}
	map.removeLayer(layer);
}
function addPositionAsLayer(userLon, userLat, userName) {
	if (!map) {
		return;
	}
	// create a layer for just this user (every user has an own layer for
	// position marker)
	var layerMarkers = createPositionLayer(userName);
	// show the position of user as marker (on the just created layer)
	var icon = createMarkerIcon();
	var lonLat = createLonLat(userLon, userLat);
	layerMarkers.addMarker(new OpenLayers.Marker(lonLat, icon));
	// center for the focused user
	if (userName == focusedUser) {
		map.setCenter(lonLat, defaultZoom);
	}
	// Add track for this user
	// addTrack(userName)
}
function centerMapForUser(layer) {
	if (!map) {
		return;
	}
	var center = getValue(KEY_CENTER);
	if (center.match(/true/i)) {
		var markers = layer.markers;
		var l = markers.length;
		if (l > 0) {
			var marker = markers[0];
			var lonlat = marker.lonlat;
			map.setCenter(lonlat);
			// map.zoomToExtent(layer_name.getDataExtent());
		}
	}
}
function centerMapForTrack(layer) {
	if (!map) {
		return;
	}
	var center = getValue(KEY_CENTER);
	if (center.match(/true/i)) {
		map.zoomToExtent(layer.getDataExtent());
	}
}

function changePositionOnLayer(userLon, userLat, userName) {
	if (!map) {
		return;
	}
	var layers = map.getLayersByName(userName);
	if (layers.length < 1) {
		return;
	}
	var userLayer = layers[0];

	// Why not moving the marker? marker.moveTo(px) throws exception
	// var newPx = map.getLayerPxFromViewPortPx(map.getPixelFromLonLat(new
	// OpenLayers.LonLat(userLon, userLat).transform(map.displayProjection,
	// map.projection)));
	// userLayer.markers[0].moveTo(newPx);

	// Clear the (one) positions
	userLayer.clearMarkers();
	// show the position of user as marker (on the just created layer)
	var icon = createMarkerIcon();
	var lonLat = createLonLat(userLon, userLat);
	userLayer.addMarker(new OpenLayers.Marker(lonLat, icon));

	// center for the focused user
	if (userName == focusedUser) {
		var center = getValue(KEY_CENTER);
		if (center.match(/true/i)) {
			map.setCenter(lonLat);
		}
	}
}

function createPositionLayer(userName) {
	var layerMarkers = new OpenLayers.Layer.Markers(userName);
	// store in array to change it later
	positionLayers.push(layerMarkers);
	// add to map
	map.addLayer(layerMarkers);
	return layerMarkers;
}

function createMarkerIcon() {
	var markerIcon = getValue(KEY_MARKER_ICON);
	if (markerIcon == "") {
		markerIcon = DEFAULT_MARKER_ICON;
	}
	markerIcon = MARKER_DIR + markerIcon;
	var a = 21;
	var b = 25;
	var magnification = getValue(KEY_MARKER_SIZE);
	if (magnification == "") {
		magnification = DEFAULT_MARKER_SIZE;
	}
	a = a * magnification;
	b = b * magnification;
	var size = new OpenLayers.Size(a, b);
	var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
	var icon = new OpenLayers.Icon(markerIcon, size, offset);
	return icon;
}

function createLonLat(userLon, userLat) {
	var lonLat = new OpenLayers.LonLat(userLon, userLat).transform(
			new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
	return lonLat;
}

function getLonLat(lon, lat) {
	var lonLat = new OpenLayers.LonLat(lon, lat).transform(
			new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
	return lonLat;
}

/**
 * Steps overwiew:
 * <ul>
 * <li>1. Get track layer of user (param userName)</li>
 * <li>2. Draw a new track: </li>
 * <ul>
 * <li>- begin = last track point of user (from last call of this function for
 * this usser)</li>
 * <li>- following track points = new track points (param array coords)</li>
 * </ul>
 * </ul>
 * 
 * The track layer of a user consists of many little single tracks. One of these
 * little tracks are drawn every time this function is called.
 * 
 * Calculate the track distance and store to show it to the user.
 * 
 * @param coords
 * @param userName
 * @param update
 */
function elongateTrack(coords, userName) {
	if (!map) {
		return;
	}
	var pointCount = coords.length;
	if(pointCount == 0) {
		return;
	}
	// Check if the user has a track for today
	var track_layer;
	var isExistingTrackLayer = false;
	var l = trackLayers.length;
	if (l > 0) {
		for ( var i = 0; i < l; i++) {
			var layerName = trackLayers[i].name;
			if (VALUE_TRACK_IN_LAYER_LIST + userName == layerName) {
				// prolongate
				track_layer = trackLayers[i];
				isExistingTrackLayer = true;
				break;
			}
		}
	}
	if (!isExistingTrackLayer) {
		track_layer = new OpenLayers.Layer.PointTrack(VALUE_TRACK_IN_LAYER_LIST
				+ userName, {
			style : {
				strokeColor : "red",
				strokeWidth : 5
			}
		});
		map.addLayer(track_layer);
		trackLayers.push(track_layer);
	}

	var features = [];
	// last point stored locally. Used as start point for new track points
	// Every time this function is called
	// - a new track is drawn
	// - start point = last track point (last call of function for this user)
	// - following points = new track points given in the parameter array
	// 'coords'
	var lon = getUserTrackLon(userName);
	var lat = getUserTrackLat(userName);
	var geometry;
	var feature;
	if (lon != 0 && lat != 0) {
		// use stored track position from last update as start point to elongate
		// the track
		geometry = new OpenLayers.Geometry.Point(lon, lat).transform(
				new OpenLayers.Projection("EPSG:4326"), map
						.getProjectionObject());
		feature = new OpenLayers.Feature.Vector(geometry);
		features.push(feature);
	} else {
		// No last track positions stored. Beginn of track for user.
		if (coords.length < 2) {
			// beginn of track for user but only one point from server.
			// One point makes no track. Make identical point.
			// Openlayers will throw an error if it founds a track with one
			// point only
			var point = new Array(coords[0][0], coords[0][1]);
			coords.push(point);
		}
	}
	// new points from server (might be one)
	for ( var i = 0; i < coords.length; i += 1) {
		lon = coords[i][0];
		lat = coords[i][1];
		geometry = new OpenLayers.Geometry.Point(lon, lat).transform(
				new OpenLayers.Projection("EPSG:4326"), map
						.getProjectionObject());
		feature = new OpenLayers.Feature.Vector(geometry);
		features.push(feature);
		// 1. Calculate the distance to old last track point and add to distance
		// 2. Store the last track position as start point for next track update
		setUserLastTrackPositionAndAddToTrackDistance(userName, lat, lon);
	}
	showWayPoints(userName);
	if(track_layer) {
		track_layer.addNodes(features);
	}
}

// ---------------------------------------
// --End map------------------------------
// ///////////////////////////////////////

function pressStart() {
	wasStoppedByUser = false;
	// Restart sharing, position
	startShareAndPositionUpdate();
	// switch the Start/Stop button
	showMainNavBar(0, false, -1);
	setIsWaitingForServerResponse(false);
	// Share immediatly (do not wait for window interval or new browser position to show group members.)
	share();
}

function stopShareAndGeoLocation() {
	// Synch with server
	stopSharing();
	// position
	stopWatchPosition();
}

function pressStop(hasToShowStartButton) {
	wasStoppedByUser = true;
	stopShareAndGeoLocation();
	if (hasToShowStartButton) {
		// switch the Start/Stop button
		showMainNavBar(0, false, -1);
	}
}

function pressStartTrack() {
	var user = getValue(KEY_USER);
	removeTrack(user);
	setValue(KEY_STORE_TRACK, "true");
	var groupMember = getGroupMember(user);
	var utcDateFormatted = getUTCTimeFormatted(new Date());
	groupMember[KEY_GROUP_MEMBER_TRACK_START_TIME] = utcDateFormatted;
	// switch the Start/Stop button
	showMainNavBar(0, false, -1);
}

function pressStopTrack() {
	setValue(KEY_STORE_TRACK, "false");
	// switch the Start/Stop button
	showMainNavBar(0, false, -1);
}

function pressStartCenter() {
	setValue(KEY_CENTER, "true");
	showMainNavBar(0, false, -1);
}

function pressStopCenter() {
	setValue(KEY_CENTER, "false");
	showMainNavBar(0, false, -1);
}

// -----------------------------------------

function updateTracksForListSelection() {
	var element = document.getElementById('trackDate')
	if(!element) {
		return;
	}
	var trackList = document.getElementById('trackDate');
	if (trackList.length > 0) {
		var selIndex = trackList.selectedIndex;
		var selectedTrackOption = trackList[selIndex];
		trackNameSelected = selectedTrackOption.text;
		if (trackNameSelected != VALUE_TODAY
				&& trackNameSelected != VALUE_PLEASE_SELECT) {
			// This finds all users that have tracks in the past for the
			// selected date. Then it downloads all tracks from this date and
			// shows them.
			xhrUpdateTracks();
			setTrackDownloadLink(trackNameSelected);
		} else {
			// Remove all old tracks
			// startApp();
		}
	}
}

// //////////////////////////////////////////////////////////////////////////////
// User settings
// //////////////////////////////////////////////////////////////////////////////

function storeSettings() {
	var isChangePassword = false;
	storeInputs();
	var element = document.getElementById(KEY_PASS_NEW)
	if(element) {
		var pass = getValue(KEY_PASS);
		var passNew = getValue(KEY_PASS_NEW);
		if (pass != passNew) {
			isChangePassword = true;
		}
	}
	return isChangePassword;
}

function readServerConfig(httpResponseText) {
	if (isEmptyString(httpResponseText)) {
		return;
	}
	var keyValues = httpResponseText.split("\n");
	var pairCount = keyValues.length;
	for ( var i = 0; i < pairCount; i++) {
		var keyValue = keyValues[i];
		if (isEmptyString(keyValue)) {
			continue;
		}
		var pair = keyValue.split("=");
		if (pair.length == 2) {
			var key = pair[0];
			var value = pair[1];
			if (key == KEY_CONFIG_LAST_MODIFIED) {
				serverConfigLastModified = value; // Not used yet
			} else if (key == KEY_EXPIRATION_DAYS) {
				setValue(key, value);
			} else if (key == KEY_TIMEZONE_OFFSET) {
				setValue(key, value);
			} else if (key == KEY_STORE_TRACK) {
				// setValue(key, value);
			}
		}
	}
}

function uploadConfiguration() {
	var user = getValue(KEY_USER);
	var pass = getValue(KEY_PASS);
	var params = "user=" + user + "&pass=" + pass;
	configuration = "";
	var value = getCurrentUTCTimeFormatted();
	if (value != "") {
		configuration += KEY_CONFIG_LAST_MODIFIED + "=" + value;
	}
	value = getValue(KEY_TIMEZONE_OFFSET);
	if (value != "") {
		if (configuration != "") {
			configuration += "\n";
		}
		configuration += KEY_TIMEZONE_OFFSET + "=" + value;
	}
	value = getValue(KEY_EXPIRATION_DAYS);
	if (value != "") {
		if (configuration != "") {
			configuration += "\n";
		}
		configuration += KEY_EXPIRATION_DAYS + "=" + value;
	}
	value = getValue(KEY_STORE_TRACK);
	if (value != "") {
		if (configuration != "") {
			configuration += "\n";
		}
		configuration += KEY_STORE_TRACK + "=" + value;
	}
	if (configuration != "") {
		params += "&set_configuration=" + configuration;
	}
	xhrPost(params, 0);
}

function startAppForTest() {
	xhrUploadPositions();
}

function clearPositionsTracksAndUsers() {
	clearAtStartUp();
	bufferTrackPointsToDraw = "";
	addItemToLocalStorage(KEY_BROWSER_BUFFER_TRACK_POINTS_TO_DRAW, "");
	bufferTrackPointsToSend = "";
	addItemToLocalStorage(KEY_BROWSER_BUFFER_TRACK_POINTS_TO_SEND, "");
	arrayBufferTrackPointsToSend = new Array();
}

function clearAtStartUp() {
	clearPositionLayers();
	clearTrackLayers();
	clearUsers();
	focusedUser = '';
	emptyTrackList();
	trackDateListBuffer = "";
	trackNameSelected = "";
	browserLastPositionUpdatesMilliseconds = 0;
	lastPosition = "";
}

function clearPositionLayers() {
	for ( var i = 0; i < positionLayers.length; i++) {
		mapRemoveLayer(positionLayers[i]);
	}
	positionLayers = new Array();
}

function clearTrackLayers() {
	var trackCount = trackLayers.length;
	if (trackCount > 0) {
		for ( var j = 0; j < trackCount; j++) {
			mapRemoveLayer(trackLayers[j]);
		}
		trackLayers = new Array();
	}
}

function checkUserName() {
	var user = getValue(KEY_USER);
	if (isEmptyString(user)) {
		setDefaultsYou();
		setDefaultsDisplay();
		setDefaultsPositions();
		setDefaultsSettings();
		clearPositionsTracksAndUsers();
	}
	// Make sure the user is created
	return true;
}
/**
 * This implicitly starts the build-in browser position update and the download
 * of position/tracks.
 */
function restoreSettings() {
	loadArrayFromStorage();
	checkUserName();
//	setDefaultsPositions();
}

function startShareAndPositionUpdate() {
	// Start the browser location
	restartPositionUpdate();
	// Start sharing
	startSharing();
}

// -- load input values from local storage
// --------------------------------------------
function loadArrayFromStorage() {
	loadArrayFromStorageHelper(inputKeys, inputValues);
}
function loadArrayFromStorageHelper(keyArray, valueArray) {
	var length = keyArray.length;
	for ( var i = 0; i < length; i++) {
		var key = keyArray[i];
		var value = getItemFromlocalStorage(key);
		if (!value) {
			value = "";
		}
		// Set variable in array
		valueArray[i] = value;
	}
}
// //////////////////////////////////////////////////////////////////////////////
// Tracks
// //////////////////////////////////////////////////////////////////////////////

function addTrack(user) {
	var user = getValue(KEY_USER);
	var element = document.getElementById('trackDate')
	if(!element) {
		return;
	}
	var selectedTrack = document.getElementById('trackDate').value;
	var lgpx = new OpenLayers.Layer.Vector(VALUE_TRACK_IN_LAYER_LIST + user, {
		strategies : [ new OpenLayers.Strategy.Fixed() ],
		protocol : new OpenLayers.Protocol.HTTP({
			url : "users/" + user + "/" + selectedTrack,
			format : new OpenLayers.Format.GPX()
		}),
		style : {
			strokeColor : "red",
			strokeWidth : 5,
			strokeOpacity : 0.5
		},
		projection : new OpenLayers.Projection("EPSG:4326")
	});
	mapAddLayer(lgpx);
	// store for later usage
	trackLayers.push(lgpx);
}
function removeTrackLayers() {
	// Remove all track layers
	clearTrackLayers();
	// Remove all stored last track positions (for every user) including the
	// last update time
	clearUsers();
}
function removeTrackLayer(userName) {
	var trackCount = trackLayers.length;
	if (trackCount > 0) {
		for (var j = 0; j < trackCount; j++) {
			var trLayer = trackLayers[j];
			var trackLayerName = trLayer.name;
			var userTrackName = "Track " + userName;
			if(trackLayerName == userTrackName) {
				mapRemoveLayer(trackLayers[j]);
				trackLayers.splice(j, 1);
				return;
			}
		}
	}
}
function removePositionLayer(userName) {	
	var posLayerCount = positionLayers.length;
	if (posLayerCount > 0) {
		for (var j = 0; j < posLayerCount; j++) {
			var posLayer = positionLayers[j];
			var posLayerName = posLayer.name;
			if(posLayerName == userName) {
				mapRemoveLayer(positionLayers[j]);
				positionLayers.splice(j, 1);
				return;
			}
		}
	}
}
function updateTracks(userLines) {
	if (!map) {
		return;
	}
	if (isEmptyString(userLines)) {
		return;
	}
	var element = document.getElementById('trackDate')
	if(!element) {
		return;
	}
	var selectedTrack = document.getElementById('trackDate').value;
	if (selectedTrack == VALUE_TODAY_IN_TRACK_LIST) {
		// Tracks from today are not loaded from gpx
		return;
	}

	removeTrackLayers();

	// Load all tracks for found users (on server) for this track name
	var selectedTrack = document.getElementById('trackDate').value;
	var lines = userLines.split("\n");
	var lineCount = lines.length;
	for ( var i = 0; i < lineCount; i++) {
		var userName = lines[i];
		var userName = userName.trim();
		if ('' == userName) {
			continue;
		}
		var lgpx = new OpenLayers.Layer.Vector(VALUE_TRACK_IN_LAYER_LIST
				+ userName, {
			strategies : [ new OpenLayers.Strategy.Fixed() ],
			protocol : new OpenLayers.Protocol.HTTP({
				url : "users/" + userName + "/" + selectedTrack,
				format : new OpenLayers.Format.GPX()
			}),
			style : {
				strokeColor : "red",
				strokeWidth : 5,
				strokeOpacity : 0.5
			},
			projection : new OpenLayers.Projection("EPSG:4326")
		});
		mapAddLayer(lgpx);
		// store for later usage
		trackLayers.push(lgpx);
	}
}

// //////////////////////////////////////////////////////////////////////////////
// Markers
// //////////////////////////////////////////////////////////////////////////////

function readPositionLineForBrowser(line, update) {
	var user = getValue(KEY_USER);
	line = "user=" + user + ";" + line;
	readPositionLine(line);
}

function readPositionLine(line) {
	var lineUser;
	var lineLat;
	var lineLon;
	var speed;
	var time;
	var altitude;
	var keyValues = line.split(";");
	var pairCount = keyValues.length;
	for ( var i = 0; i < pairCount; i++) {
		var keyValue = keyValues[i];
		var pair = keyValue.split("=");
		if (pair.length == 2) {
			var key = pair[0];
			var value = pair[1];
			if (key == 'user') {
				lineUser = value;
			} else if (key == "lat") {
				lineLat = value;
			} else if (key == "lon") {
				lineLon = value;
			} else if (key == "speed") {
				speed = value;
			} else if (key == "time") {
				time = value;
			} else if (key == "altitude") {
				altitude = value;
			}
		}
	}
	if (isEmptyString(lineLon)) {
		fallBackAtBegin();
		return false;
	}
	if (isEmptyString(lineLat)) {
		fallBackAtBegin();
		return false;
	}
	if (isEmptyString(lineUser)) {
		fallBackAtBegin();
		return false;
	}
	// store the value for switching the layers
	setUserLastDetails(lineUser, time, speed, altitude)
	if (lineUser == focusedUser) {
		showDetailsOnFocusedUser();
	}
	var l = positionLayers.length;
	for ( var i = 0; i < l; i++) {
		var layerName = positionLayers[i].name;
		if (lineUser == layerName) {
			changePositionOnLayer(lineLon, lineLat, lineUser);
			// Check it the existing track started yesterday
			// If yes then remove. Why? The map displays only way points from today.
			removeTrackIfFromYesterday(lineUser);
			return true;
		}
	}
	addPositionAsLayer(lineLon, lineLat, lineUser);
	return true;
}

function fallBackAtBegin(update) {
	showStartMap();
}

function showWayPoints(userName) {
	var wayPoints = getUserCountOfTrackpoints(userName);
	var distance = getUserTrackDistanceRounded(userName);
	if (userName == focusedUser) {
		var element = document.getElementById('trackPoints');
		if (element) {
			element.innerHTML = wayPoints + ", " + distance;
		}
	}
}

function showDetailsOnFocusedUser() {
	if (focusedUser == "") {
		return;
	}
	var isDetailsShown = getValue(KEY_SHOW_DETAILS);
	if (!isDetailsShown.match(/true/i)) {
		var element = document.getElementById('detailsOnFocusedUser');
		if(element) {
			element.innerHTML = "";
		}
		return;
	}
	var text = "";
	// Now fill the labels with values
	text += "<label id=\"focusedUser\"><u>" + focusedUser + "</u> is focussed</label>";
	var time = getUserTime(focusedUser);
	var speed = getUserSpeed(focusedUser);
	var altitude = getUserAltitude(focusedUser);
	if (!isEmptyString(speed)) {
		var s = Math.round((speed * 3.6)) + " km/h  ";
		text += "<br/>Speed <label id=\"speed\">" + s + "</label>";
	}
	if (!isEmptyString(altitude)) {
		text += "<br/>Altitude <label id=\"altitude\">" + Math.round(altitude)
				+ " m</label>";
	}
	var distance = getUserTrackDistanceRounded(focusedUser);
	if (distance != "") {
		var wayPoints = getUserCountOfTrackpoints(focusedUser);
		text += "<br/>Track <label id=\"trackPoints\">" + distance
		+ ", " + wayPoints + " pts</label>";
		var formatedTrackTime = caluculateTrackTime(focusedUser);
		text += ", time " + formatedTrackTime;
	}
	if (!isEmptyString(time)) {
		formatedDate = convertToLocalDateTimeString(time);
		text += "<br/><label id=\"time\">Last Update " + formatedDate + "</label>";
		var elapsed = calculateTimeDifference(time);
		if (!isEmptyString(elapsed)) {
			text += "<br/><label id=\"elapsed\"> " + elapsed + "</label>";
		}
	}
	var element = document.getElementById('detailsOnFocusedUser')
	if(element) {
		element.innerHTML = text;
	}
}

function caluculateTrackTime(userName) {
	var formatedTimeDifference = "";
	var trackStartDateTime = getUserTrackStartTime(focusedUser);
	var trackLastDateTime = getUserTime(focusedUser);
	if(trackStartDateTime != "" && trackLastDateTime != "") {
		var parsedMilliSecondsStart = getMilliseconds1970(trackStartDateTime);
		var parsedMilliSecondsEnd = getMilliseconds1970(trackLastDateTime);
		var difference = parsedMilliSecondsEnd - parsedMilliSecondsStart;
		if(difference != 0) {
			formatedTimeDifference = getFormatedTimeDifference(difference);
		}
	}
	return formatedTimeDifference;
}

/**
 * Convert the UTC to local time
 * 
 * @param utcDate
 *            example 2013-11-10T12:50:00.000
 * @returns the local date-time 2013-11-10T12:50:00.000
 */
function convertToLocalDateTimeString(utcDate) {
	// get the milliseconds UTC
	var parsedMilliSecondsUTC = getMilliseconds1970(utcDate);
	if (parsedMilliSecondsUTC == 0) {
		return '';
	}
	// get the timezone offset
	var offset = getLocalTimezoneOffset(); // minutes
	var offsetInMilliseconds = offset * 60 * 1000;
	// add the offsett to the utc
	var localMilliseconds = parsedMilliSecondsUTC - offsetInMilliseconds;
	var nowLocal = new Date(localMilliseconds);
	var localDateTime = getDateTimeFormatted(nowLocal, false);
	return localDateTime;
}
function getTimezoneOffset() {
	var offset = getValue(KEY_TIMEZONE_OFFSET);
	if (offset == "") {
		offset = getLocalTimezoneOffset();
	}
	return offset;
}
function getLocalTimezoneOffset() {
	var now = new Date();
	var offset = now.getTimezoneOffset(); // minutes
	return offset;
}
function formatTime(utcDate) {
	var parts = utcDate.match(/(\d+)/g);
	if (isEmptyString(parts[5])) {
		return utcDate;
	}
	var formatedDate = new Date(parts[0], parts[1] - 1, parts[2], parts[3],
			parts[4], parts[5]);
	return formatedDate;
}

function getMilliseconds1970(utcDate) {
	// var testUTCDate = getCurrentUTCTimeFormatted();
	// 2013-03-26T17:08:48Z
	var parts = utcDate.match(/(\d+)/g);
	if (!parts) {
		return 0;
	}
	if (isEmptyString(parts[5])) {
		return 0;
	}
	// new Date(year, month [, date [, hours[, minutes[, seconds[, ms]]]]])
	var parsedDate = new Date(parts[0], parts[1] - 1, parts[2], parts[3],
			parts[4], parts[5]);
	var parsedMilliSeconds = parsedDate.getTime();
	return parsedMilliSeconds;
}

function calculateTimeDifference(utcDate) {
	var parsedMilliSeconds = getMilliseconds1970(utcDate);
	if (parsedMilliSeconds == 0) {
		return '';
	}
	var now = new Date();
	var offset = now.getTimezoneOffset(); // minutes
	var offsetInMilliseconds = offset * 60 * 1000;
	var nowMilliSeconds = now.getTime();
	var diffServerLocal = nowMilliSeconds + offsetInMilliseconds
			- parsedMilliSeconds;
	if (diffServerLocal < 1) {
		return "0 day(s) 00:00:00";
	}
	var displayedTimeDifference = getFormatedTimeDifference(diffServerLocal);
	return displayedTimeDifference;
}

/**
 * Formats milliseconds to a readable format
 * 
 * @param diffServerLocal milliseconds
 * @returns formated string like "0 day(s) 00:40:52"
 */
function getFormatedTimeDifference(diffMilliseconds) {
	var ONE_DAY = 1000 * 60 * 60 * 24;
	var ONE_Hour = 1000 * 60 * 60;
	var ONE_Minute = 1000 * 60;
	var ONE_Second = 1000;
	var diffDay = Math.floor(diffMilliseconds / ONE_DAY);
	var diffHour = Math.floor(diffMilliseconds / ONE_Hour);
	var diffMinutes = Math.floor(diffMilliseconds / ONE_Minute);
	var diffSeconds = Math.floor(diffMilliseconds / ONE_Second);
	var remainMillisec = 0;
	var remainingSec = 0;
	var remaingMinutes = 0;
	var remaingHours = 0;
	if (diffSeconds < 60) {
		remainingSec = diffSeconds;
	} else if (diffMinutes < 60) {
		remaingMinutes = diffMinutes;
		remainMillisec = diffMilliseconds - (diffMinutes * ONE_Minute);
		remainingSec = Math.floor(remainMillisec / ONE_Second);
	} else if (diffHour < 24) {
		remaingHours = diffHour;
		remainMillisec = diffMilliseconds - (diffHour * ONE_Hour);
		remaingMinutes = Math.floor(remainMillisec / ONE_Minute);
		remainMillisec = diffMilliseconds - (diffMinutes * ONE_Minute);
		remainingSec = Math.floor(remainMillisec / ONE_Second);
	} else {
		remainMillisec = diffMilliseconds - (diffDay * ONE_DAY);
		remaingHours = Math.floor(remainMillisec / ONE_Hour);
		remainMillisec = diffMilliseconds - (diffHour * ONE_Hour);
		remaingMinutes = Math.floor(remainMillisec / ONE_Minute);
		remainMillisec = diffMilliseconds - (diffMinutes * ONE_Minute);
		remainingSec = Math.floor(remainMillisec / ONE_Second);
	}
	if (remaingHours < 9) {
		remaingHours = "0" + remaingHours;
	}
	if (remaingMinutes < 9) {
		remaingMinutes = "0" + remaingMinutes;
	}
	if (remainingSec < 9) {
		remainingSec = "0" + remainingSec;
	}
	var displayedTimeDifference = diffDay + " day(s) " + remaingHours + ":"
			+ remaingMinutes + ":" + remainingSec;
	return displayedTimeDifference;
}

// //////////////////////////////////////////////////////////////////////////////
// Poll
// //////////////////////////////////////////////////////////////////////////////

function onWindowsIntervall() {
	share();
	// Thy to wake up the browser position in case it is not running a background
	// service but the windows.intervall(..) is still running as background service
	// --it worked but try without at the moment
//	tryToWakeUpTheGeolocation();
}

function isShareDue() {
	var nowMilliseconds = Date.now();
	// var nowMilliseconds = Date.getTime();
	var intervall = getValue(KEY_INTERVALL_SERVER);
	var millisecondsToWait = getMillisecondsForListValue(intervall);
	if(millisecondsToWait != 0) {
		// The user has not choosen "never"
		var threshold = timestampLastShareAttempt + millisecondsToWait;
		if (nowMilliseconds > threshold) {
			return true;
		}
	}
	return false;
}

function isXhrTimeout() {
	var nowMilliseconds = Date.now();
	// var nowMilliseconds = Date.getTime();
	var intervall = getValue(KEY_INTERVALL_SERVER);
	var threshold = timestampLastShareAttempt + xhrTimout;
	if (nowMilliseconds > threshold) {
		return true;
	}
	return false;
}

function share() {
	if (!isPolling) {
		return;
	}
	if (isWaitingForServerResponse) {
		// Check if timeout is xhrTimeout is reached. Lost connections proved to block sometimes
		if(! isXhrTimeout()) {
			return;
		}
	}
	var isDue = isShareDue();
	if(!isDue) {
		return;
	}
	timestampLastShareAttempt = Date.now();
	clearMessages();
	xhrUploadPositions();
}
function startSharing() {
	stopSharing();
	// How often the user wants to share positions and tracks?
	// Start sharing by starting the windows interval
	isPolling = true;
	windowIntervall = window.setInterval("onWindowsIntervall()", windowBaseInterval);
	timestampLastShareAttempt = 0;
}
function startSharing_Obsolete() {
	stopSharing();
	// How often the user wants to share positions and tracks?
	var intervall = getValue(KEY_INTERVALL_SERVER);
	var milliseconds = getMillisecondsForListValue(intervall);
	if(milliseconds != 0) {
		// Start sharing
		isPolling = true;
		windowIntervall = window.setInterval("onWindowsIntervall()", milliseconds);
	}
}
function stopSharing() {
	isPolling = false;
	// Stopp the window intervall
	if (windowIntervall != -1) {
		window.clearInterval(windowIntervall);
		windowIntervall = -1;
	}
}

// //////////////////////////////////////////////////////////////////////////////
// XMLHttpRequest
// //////////////////////////////////////////////////////////////////////////////

function createXhr() {
	if (window.XMLHttpRequest) {
		if(! abortXhr()) {
			return false;
		}
		xhr = new XMLHttpRequest();
	} else {
		showWarning("Old browser? XHR not supported.");
		return false;
	}
	return true;
}

function abortXhr() {
	if (typeof xhr === "undefined") {
		// no variable "xhr" is defined in the current scope
		// *or* some variable xhr exists and has been assigned the value undefined
	} else {
		// some variable (global or local) "v" is defined in the current scope
		// *and* it contains a value other than undefined
		try {
			xhr.abort();
		} catch(e) {
			showWarning("XHR abort failed");
			return false;
		}
	}
	return true;
}

/**
 * Use this function if you want to upload or download from
 * geo5.php.
 * - Close an existing XHR
 * - Open a new XHR with POST
 * @returns {Boolean}
 */
function getXHR() {
	var created = createXhr();
	if (! created) {
		setIsWaitingForServerResponse(false);
		return false;
	}
	xhr.onreadystatechange = xhrHandleHttpResponse;
	xhr.timeout = xhrTimout;
	xhr.ontimeout = function() {
		showServerTimedOut();
	}
	var url = getValue(KEY_SCRIPT_URL);
	var isOpen = xhrOpenSecurely(xhr, url);
	if(!isOpen) {
		setIsWaitingForServerResponse(false);
		return false;
	}
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	setIsWaitingForServerResponse(true);
	return true;
}

function xhrOpenSecurely(xhr, url) {
	try {
		xhr.open("POST", url, true);
	} catch(e) {
		showWarning("Not connected (open failed)");
		return false;
	}
	return true;
}

function xhrJustPostForTests(parameters) {
	xhrMessage = "Just post params...";
	var ready = getXHR();
	if(!ready) {
		return;
	}
	nextXHR = "";
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.send(parameters);
}
/**
 * Q: Why not to use xhrHandleHttpResponse() ? A: xhrPost(..) is truly used
 * aynchronously. It should not block anything.
 */
function xhrPost(parameters, action) {
	var xhrSinglePost;
	if (window.XMLHttpRequest) {
		xhrSinglePost = new XMLHttpRequest();
	}
	xhrSinglePost.timeout = xhrTimout;
	xhrSinglePost.ontimeout = function() {
		showServerTimedOut();
	}
	xhrSinglePost.onload = function(e) {
//		showDebug(this.responseText);
		if (action == 1) {
			if (this.status == 200 && this.readyState == 4) {
				if (action == 1) {
					setDownloadedConfiguration(this.responseText);
				}
			}
		}
	};
	var url = getValue(KEY_SCRIPT_URL);
	try {
		xhrSinglePost.open("POST", url, true);
	} catch(e) {
		showWarning("Not connected (open failed)");
		return;
	}
	xhrSinglePost.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhrSinglePost.send(parameters);
}

function xhrRemoveUser() {
	xhrMessage = "Remove user...";
	var ready = getXHR();
	if(!ready) {
		return;
	}
	nextXHR = XHR_KEY_ACTION_REMOVE_USER;
	var user = getValue(KEY_USER);
	var pass = getValue(KEY_PASS);
	// send the request
	xhr.send("user=" + user + "&pass=" + pass + "&remove=true");
}

function xhrChangePass() {
	xhrMessage = "Change pass...";
	var user = getValue(KEY_USER);
	var pass = getValue(KEY_PASS);
	var passNew = getValue(KEY_PASS_NEW);
	var ready = getXHR();
	if(!ready) {
		return;
	}
	nextXHR = XHR_KEY_ACTION_CHANGE_PASS;
	xhr.send("user=" + user + "&pass=" + pass + "&passNew=" + passNew);
}

function xhrGetConfig() {
	xhrMessage = "Get config...";
	var user = getValue(KEY_USER);
	var pass = getValue(KEY_PASS);
	var ready = getXHR();
	if(!ready) {
		return;
	}
	nextXHR = XHR_KEY_ACTION_GET_SERVER_CONFIG;
	xhr.send("user=" + user + "&pass=" + pass + "&get_configuration=true");
}

function xhrListTracks() {
	// Send the timezone offset to server. This will set the timezone offest of
	// this user on
	// the server. The offset will not be overwritten on the server if it was
	// set befor.
	// Why to set the timezone offest? The server will use this to split tracks
	// into files
	// for each day. Therefor the server has to know when the user starts the
	// new day (midnight).
	var offset = getTimezoneOffset() // minutes

	var user = getValue(KEY_USER);
	var pass = getValue(KEY_PASS);
	var group = getValue(KEY_GROUP);
	xhrMessage = "List tracks...";
	var ready = getXHR();
	if(!ready) {
		return;
	}
	nextXHR = XHR_KEY_ACTION_LIST_TRACKS;
	xhr.send("user=" + user + "&pass=" + pass + "&group=" + group
			+ "&listTracks=true" + "&timezoneoffset=" + offset);
}

function xhrUpdateTracks() {
	if (isEmptyString(trackNameSelected)) {
		return;
	}
	var user = getValue(KEY_USER);
	var pass = getValue(KEY_PASS);
	var group = getValue(KEY_GROUP);
	xhrMessage = "Update tracks...";
	var ready = getXHR();
	if(!ready) {
		return;
	}
	nextXHR = XHR_KEY_ACTION_UPDATE_TRACKS;
	xhr.send("user=" + user + "&pass=" + pass
			+ "&getUsersForFileName=true&filename=" + trackNameSelected);
}

function xhrDownloadPositions() {
	var requestPart = getAllLastTrackTimesAsRequestString();
	var user = getValue(KEY_USER);
	var pass = getValue(KEY_PASS);
	var group = getValue(KEY_GROUP);
	var paramStoreTrack = "&track=true";
	xhrMessage = "Download position/tracks...";
	var ready = getXHR();
	if(!ready) {
		return;
	}
	nextXHR = XHR_KEY_ACTION_DOWNLOADED_POSITION; 
	xhr.send("user=" + user + "&pass=" + pass + "&group=" + group + paramStoreTrack
			+ "&getLastPostionsAndTracksIndividually=" + requestPart);
}

function xhrUploadPositions() {
	var user = getValue(KEY_USER);
	var pass = getValue(KEY_PASS);
	var group = getValue(KEY_GROUP);
	var paramStoreTrack = "&track=false";
	// User is recording a track (pressed "Track")? > Write a track file (gpx) on the server?
    var isStoreTrack = getValue(KEY_STORE_TRACK);
    if (isStoreTrack.match(/true/i)) {
		paramStoreTrack = "&track=true";
    }
    // This can be a single position or a a track (if the user is recording a track)
    // We use to variables. Why? The browser might find new positions while sending the old position(s).
    
    var pointCount = arrayBufferTrackPointsToSend.length;
    if(pointCount > 0) {
    	// Send just one singel point.
    	// Why not to send all together as it was?
    	// Tiis proved to be not save enough in praxis if:
    	// - The connection was slow
    	bufferTrackPointsOnTheWayToServer = arrayBufferTrackPointsToSend[0];
    } else {
    	// Why this upload was added?
    	// Real world example: The user A is sitting for hours in a biergarden.
    	// - user A does not move for hours. The app sends uploads new geo locations if user
    	//   user A moves (lets say) for at least 10 meters. But it does not happen. So no position
    	//   is uplaode for houres.
    	// - user B now might think that user A either lost the internet connection, has no
    	//   GPS signal, stopped sharing, closed the app,.... what ever.
    	// The following upload tries to avoid this.
    	if(csvLastGeoLocationToShare != "") {
        	bufferTrackPointsOnTheWayToServer = csvLastGeoLocationToShare;
    		paramStoreTrack = "&track=false";
    	}
    }
    
    // Make sure that every unsent track point gets sent even if the user
    // deactivated the track in the mean time.
    if(pointCount > 1) {
		paramStoreTrack = "&track=true";
    }
    
	// bufferTrackPointsOnTheWayToServer = bufferTrackPointsToSend;
    
	if (isEmptyString(bufferTrackPointsOnTheWayToServer)) {
		// No new position / track points
		xhrDownloadPositions();
		return;
	}
	xhrMessage = "Upload position/tracks...";
	var ready = getXHR();
	if(!ready) {
		return;
	}
	nextXHR = XHR_KEY_ACTION_UPLOADED_POSITIONS;
	xhr.send("user=" + user + "&pass=" + pass + "&group=" + group
			+ paramStoreTrack + "&positions=" + bufferTrackPointsOnTheWayToServer);
}

function xhrHandleHttpResponse() {
	var user = getValue(KEY_USER);
	var pass = getValue(KEY_PASS);
	try {
		var xhrState = this.readyState;
		var httpStatus = this.status;
		var httpResponseText = this.responseText;
		xhrLastServerResponse = this.responseText;
		setIsWaitingForServerResponse(true);
		if (xhrState == 4 && httpStatus == 200) {
			if (hasErrors(httpResponseText)) {
				if (nextXHR == XHR_KEY_ACTION_LIST_TRACKS) {
					showLoginFailed("Failed to load tracks list from server.\n\nServer response:\n"
							+ httpResponseText);
				} else if (nextXHR == XHR_KEY_ACTION_GET_SERVER_CONFIG) {
					showServerError("Failed to load user preferences from server.\n\nServer response:\n"
							+ httpResponseText);
				} else if (nextXHR == XHR_KEY_ACTION_UPLOADED_POSITIONS) {
					// TODO: Show an icon or whatever to signal there are
					// positions or track points that where not send yet
				} else {
					showServerError(this.responseText);
				}
				if (nextXHR == XHR_KEY_ACTION_LIST_TRACKS) {
					showStartMap();
				}
				setIsWaitingForServerResponse(false);
			} else {
				if (nextXHR == XHR_KEY_ACTION_GET_SERVER_CONFIG) {
					readServerConfig(httpResponseText);
					xhrListTracks();
				} else if (nextXHR == XHR_KEY_ACTION_LIST_TRACKS) {
					storeTrackDatesForDropDownList(httpResponseText);	
					xhrUploadPositions();
				} else if (nextXHR == XHR_KEY_ACTION_DOWNLOADED_POSITION) {
					if(httpResponseText == "") {
						// user has no group members
						removeStrangers(new Array());
					} else {
						if (runSynchronizedInputOutput(httpResponseText)) {	
							// End of loop (upload > download) triggered by share()
						} else {
							showServerError("Failed to download positions/tracks (server response)\n\nServer response:\n"
									+ httpResponseText);
						}
					}
					setIsWaitingForServerResponse(false);
				} else if (nextXHR == XHR_KEY_ACTION_UPDATE_TRACKS) {
					updateTracks(httpResponseText);
					setIsWaitingForServerResponse(false);
				} else if (nextXHR == XHR_KEY_ACTION_UPLOADED_POSITIONS) {					
					var pointsStillLeft = setSuccessfullUpload();
					if(pointsStillLeft > 0) {
						xhrUploadPositions();
					} else {
						xhrDownloadPositions();
					}
				} else if (nextXHR == XHR_KEY_ACTION_REMOVE_USER) {
					// remove all user related data in the browser, pass, group, tracks,
					// positions, other users of group,...
					cleanupUser();
					setIsWaitingForServerResponse(false);
					if (!isTest) {
						startApp();
					}
				} else if (nextXHR == XHR_KEY_ACTION_CHANGE_PASS) {
					setChangedPassword();
					setIsWaitingForServerResponse(false);
				} else {
					// from changing password or from unit tests
					setIsWaitingForServerResponse(false);
				}
			}
		}
	} catch (e) {
		if (!httpStatus) {
			// In case of 'INVALID_STATE_ERR: DOM Exception 11' > Usually this
			// error occurs with the XMLHttpRequest when you call the open
			// method
			// with async = true, or you leave the async parameter undefined so
			// it defaults to asynchronous, and then you access the status or
			// responseText properties. Those properties are only available
			// after you do a synchronous call, or on the readyState becoming
			// ready (once the asynchronous call responds)
			return;
		}
		showServerError("Server error" + e);
		setIsWaitingForServerResponse(false);
	}
}
function hasErrors(httpResponseText) {
	// '!' if the script detected errors like user not accepted and so on
	// Basically what the programmes of LanguageKISS want to indicate as error
	var position = httpResponseText.indexOf("!");
	if (position == 0) {
		return true;
	}
	// '<' if the php server itself detected errors, mostly synthax errors,
	// variables not defined
	position = httpResponseText.indexOf("<");
	if (position == 0) {
		return true;
	}
	return false;
}

function setIsWaitingForServerResponse(isWaiting) {
	isWaitingForServerResponse = isWaiting;
	if(isWaiting) {
		setValue(KEY_DEBUG_MESSAGES, "true");
		var msg = "Sharing...";
		if (!isEmptyString(xhrMessage)) {
			msg = xhrMessage;
		}
		// msg += " (" + xhr.readyState + ", " + xhr.status + ")";
		showDebug(msg);
	} else {
		setValue(KEY_DEBUG_MESSAGES, "false");
		showDebug("");
		xhrMessage = "";
	}
}

function showServerTimedOut() {
	setIsWaitingForServerResponse(false);
	showWarning("No connection... (timed out)");
}

function showServerError(msg) {
//	if (!isTest) {
//		alert(msg);
//	}
	showWarning(msg);
	isPolling = false;
}

function showLoginFailed(msg) {
//	if (!isTest) {
//		alert(msg);
//	}
	showWarning("Login failed.<br/>User or password not accepted.");
	isPolling = false;
}

function emptyTrackList() {
	trackDateListBuffer = "";
	var trackList = document.getElementById('trackDate');
	if (!trackList) {
		return;
	}
	// Remove all tracks from list (GUI)
	while (trackList.length > 0) {
		trackList.remove(0);
	}
}

function storeTrackDatesForDropDownList(lines) {
	// Store the tracks (http response) in a variable. The buffer can be used
	// later to fill the dropdown list.
	trackDateListBuffer = lines;
}

function fillDropDownTimezoneOffset() {
	var guiList = document.getElementById(KEY_TIMEZONE_OFFSET);
	if (!guiList) {
		// Do not try to fill the track list it this dropdown is no visible
		return true;
	}
	// get the offset (stored or default)
	var offset = getTimezoneOffset();
	offset = (offset / 60).toString() + " ";
	// fill the drop down list
	var selectedIndex = 12;
	var count = arrayTimezoneOffsets.length;
	for ( var i = 0; i < count; i++) {
		var timezone = arrayTimezoneOffsets[i];
		var option = document.createElement('option');
		option.text = timezone;
		option.value = timezone;
		guiList.add(option, null); // append at end of list
		// has to be selected
		if (startsWith(offset, timezone)) {
			selectedIndex = i;
		}
	}
	guiList.selectedIndex = selectedIndex;
	return true;
}

function fillDropDownExpirationDays() {
	var guiList = document.getElementById(KEY_EXPIRATION_DAYS);
	if (!guiList) {
		// Do not try to fill the track list it this dropdown is no visible
		return true;
	}
	// get the expiration days (stored or default)
	var days = getValue(KEY_EXPIRATION_DAYS);
	if (days == "") {
		days = DEFAULT_EXPIRATION;
	}
	// fill the drop down list
	var selectedIndex = 2;
	var count = arrayExpirationDays.length;
	for ( var i = 0; i < count; i++) {
		var item = arrayExpirationDays[i];
		var option = document.createElement('option');
		option.text = item;
		option.value = item;
		guiList.add(option, null); // append at end of list
		// has to be selected
		if (days == item) {
			selectedIndex = i;
		}
	}
	guiList.selectedIndex = selectedIndex;
	return true;
}

function fillDropDownAccuracyPosition() {
	var guiList = document.getElementById(KEY_ACCURACY_POSITION);
	if (!guiList) {
		// Do not try to fill the list
		return true;
	}
	// get the expiration days (stored or default)
	var accuracy = getValue(KEY_ACCURACY_POSITION);
	if (accuracy == "") {
		accuracy = DEFAULT_ACCURACY;
	}
	// fill the drop down list
	var selectedIndex = 4;
	var count = arrayAccuracy.length;
	for ( var i = 0; i < count; i++) {
		var item = arrayAccuracy[i];
		var option = document.createElement('option');
		option.text = item;
		option.value = item;
		guiList.add(option, null); // append at end of list
		// has to be selected
		if (accuracy == item) {
			selectedIndex = i;
		}
	}
	guiList.selectedIndex = selectedIndex;
	return true;
}

function fillDropDownMinDistance() {
	var guiList = document.getElementById(KEY_MIN_DISTANCE);
	if (!guiList) {
		// Do not try to fill the list
		return true;
	}
	// get the expiration days (stored or default)
	var accuracy = getValue(KEY_MIN_DISTANCE);
	if (accuracy == "") {
		accuracy = DEFAULT_MIN_DISTANCE;
	}
	// fill the drop down list
	var selectedIndex = 4;
	var count = arrayMinDistance.length;
	for ( var i = 0; i < count; i++) {
		var item = arrayMinDistance[i];
		var option = document.createElement('option');
		option.text = item;
		option.value = item;
		guiList.add(option, null); // append at end of list
		// has to be selected
		if (accuracy == item) {
			selectedIndex = i;
		}
	}
	guiList.selectedIndex = selectedIndex;
	return true;
}

function fillDropDownMarkerIcon() {
	var guiList = document.getElementById(KEY_MARKER_ICON);
	if (!guiList) {
		// Do not try to fill the track list it this dropdown is no visible
		return true;
	}
	// get the expiration days (stored or default)
	var markerIcon = getValue(KEY_MARKER_ICON);
	if (markerIcon == "") {
		markerIcon = DEFAULT_MARKER_ICON;
	}
	// fill the drop down list
	var selectedIndex = 0;
	var count = arrayMarkerIcons.length;
	for ( var i = 0; i < count; i++) {
		var item = arrayMarkerIcons[i];
		var option = document.createElement('option');
		option.text = item;
		option.value = item;
		guiList.add(option, null); // append at end of list
		// has to be selected
		if (markerIcon == item) {
			selectedIndex = i;
		}
	}
	guiList.selectedIndex = selectedIndex;
	return true;
}
function fillDropDownMarkerSize() {
	var guiList = document.getElementById(KEY_MARKER_SIZE);
	if (!guiList) {
		// Do not try to fill the track list it this dropdown is no visible
		return true;
	}
	// get the expiration days (stored or default)
	var markerSize = getValue(KEY_MARKER_SIZE);
	if (markerSize == "") {
		markerSize = DEFAULT_MARKER_SIZE;
	}
	// fill the drop down list
	var selectedIndex = 0;
	var count = arrayMarkerSizes.length;
	for ( var i = 0; i < count; i++) {
		var item = arrayMarkerSizes[i];
		var option = document.createElement('option');
		option.text = item;
		option.value = item;
		guiList.add(option, null); // append at end of list
		// has to be selected
		if (markerSize == item) {
			selectedIndex = i;
		}
	}
	guiList.selectedIndex = selectedIndex;
	return true;
}

function fillDropDownTracks() {
	var trackList = document.getElementById('trackDate');
	if (!trackList) {
		// Do not try to fill the track list it this dropdown is no visible
		return true;
	}
	if (isEmptyString(trackDateListBuffer)) {
		// There are no gpx tracks (older than today)
		// (There should no gpx files for today on the server.)
		return true;
	}
	// Remove all tracks from list (GUI)
	// emptyTrackList();
	var lineArray = trackDateListBuffer.split("\n");
	lineArray.sort();
	lineArray.reverse();
	var selectedIndex = 0;
	var lineCount = lineArray.length;
	for ( var i = 0; i < lineCount; i++) {
		// if (i == 0) {
		// var trackOption = document.createElement('option');
		// trackOption.text = VALUE_PLEASE_SELECT;
		// trackOption.value = VALUE_PLEASE_SELECT;
		// trackList.add(trackOption, null); // append at end of list
		// }
		var line = lineArray[i];
		var line = line.trim();
		if ('' == line) {
			continue;
		}
		var trackOption = document.createElement('option');
		trackOption.text = line;
		trackOption.value = line;
		trackList.add(trackOption, null); // append at end of list
		// Show download link
		setTrackDownloadLink(line);
	}
	var element = document.getElementById('trackDate')
	if(element) {
		document.getElementById('trackDate').selectedIndex = selectedIndex;
	}
	return true;
}

// //////////////////////////////////////////////////////////////////////////////
// Helpers
// //////////////////////////////////////////////////////////////////////////////

// function trim(text) {
// if (text) {
// if (typeof text == 'string' || text instanceof String) {
// if (text != "") {
// var regex = new RegExp("^\s+|\s+$", 'g');
// var strippedLine = text.replace(regex, "");
// // There seems to be a bug in FF 25.0.1 (Linux Mint)
// // strippedLine = text.replace(" ", "");
// return strippedLine;
// }
// }
// }
// return text;
// }
function isEmptyString(s) {
	if (!s) {
		return true;
	}
	s = s.toString().trim();
	if ("" == s) {
		return true;
	}
	return false;
}
function startsWith(search, content) {
	if (content.length >= search.length
			&& content.substring(0, search.length) == search)
		return true;
	else
		return false;
}
// Returns a formated date like 2012-05-17
function getCurrenDateFormatted() {
	var now = new Date();
	var formatedDate = now.getFullYear().toString();
	var s = now.getMonth() + 1;
	formatedDate += "-" + (s <= 9 ? '0' + s : s);
	s = now.getDate();
	formatedDate += "-" + (s <= 9 ? '0' + s : s);
	s = now.getHours();
	return formatedDate;
}

/**
* Get a formated date string.
*
* @param milliseconds milliseconds
* 
* @returns String like 2013-11-10
*/
function getDateFormatted(milliseconds) {
	var now = new Date(milliseconds);
	var formatedDate = now.getFullYear().toString();
	var s = now.getMonth() + 1;
	formatedDate += "-" + (s <= 9 ? '0' + s : s);
	s = now.getDate();
	formatedDate += "-" + (s <= 9 ? '0' + s : s);
	return formatedDate;
}

/**
* Get a formated date-time string.
*
* @param milliseconds milliseconds
* @param hasMilliseconds true or false
* 
* @returns String like
*           - with milliseconds    2013-11-10 12:50:34.765
*           - without milliseconds 2013-11-10 12:50:34
*/
function getDateTimeFormatted(milliseconds, hasMilliseconds) {
	var now = new Date(milliseconds);
	var formatedDate = now.getFullYear().toString();
	var s = now.getMonth() + 1;
	formatedDate += "-" + (s <= 9 ? '0' + s : s);
	s = now.getDate();
	formatedDate += "-" + (s <= 9 ? '0' + s : s);
	s = now.getHours();
	formatedDate += " " + (s <= 9 ? '0' + s : s);
	s = now.getMinutes();
	formatedDate += ":" + (s <= 9 ? '0' + s : s);
	s = now.getSeconds();
	formatedDate += ":" + (s <= 9 ? '0' + s : s);
	if (hasMilliseconds) {
		s = now.getUTCMilliseconds();
		if (s <= 9) {
			s = '00' + s;
		} else if (s <= 100) {
			s = '0' + s;
		}
		formatedDate += "." + s;
	}
	return formatedDate;
}

/**
* Gets a local date string (not UTC)
*
* @returns the local date-time 2014-09-27
*/
function getCurrentLocalDateFormatted() {
    var now = new Date();
    var formatedDate = now.getFullYear().toString();
    var s = now.getMonth() + 1;
    formatedDate += "-" + (s <= 9 ? '0' + s : s);
    s = now.getDate();
    formatedDate += "-" + (s <= 9 ? '0' + s : s);
    return formatedDate;
}

/**
* Check if a UTC date-time string has the same day after conversion to local time zone.
* 1. Convert the UTC date-time string to a local day
* 2. Create a local date string like 2014-09-26
* 3. Check if the
*      just created local date string from step 2)
*      is contained in the converted date-time string from step 1).
*
* @param utcDate UTC date-time
*            example  2013-11-10T12:50:00.000
* @returns true if the day inside the parameter falls into (local) today
*/
function isToday(utcDateTimeString) {
  // Gets something like 2013-11-10T12:50:00.000
  var localDateTime = convertToLocalDateTimeString(utcDateTimeString);
  // Gets something like 2014-09-26
  var localDate = getCurrentLocalDateFormatted();
  var position = localDateTime.indexOf(localDate);
    if (position != -1) {
        return true;
    } else {
      return false;
    }
}

/**
 * Gets something like this
 * 
 * [positions]
 * user=Peter;lat=47.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=2013-03-03_15:48:47.484
 * user=Lisa;lat=47.50451538021159;lon=11.071421406744932;bearing=173.14859;speed=0.0;altitude=1068.2914401409275;accuracy=6.0;time=2013-03-03_15:48:57.511
 * [track-Peter]
 * lat=47.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=2013-03-03_15:48:47.484
 * lat=47.50451538021159;lon=11.071421406744932;bearing=173.14859;speed=0.0;altitude=1068.2914401409275;accuracy=6.0;time=2013-03-03_15:48:57.511
 * lat=47.50451538021159;lon=11.071521406744932;bearing=173.14859;speed=0.0;altitude=1068.2914401409275;accuracy=6.0;time=2013-03-03_15:48:57.511
 * [track-Lisa]
 * lat=47.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=2013-03-03_15:48:47.484
 * lat=47.50557163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=2013-03-03_15:48:47.484
 * lat=47.50651538021159;lon=11.071421406744932;bearing=173.14859;speed=0.0;altitude=1068.2914401409275;accuracy=6.0;time=2013-03-03_15:48:57.511
 */
function displayServerPositionUpdate(serverResponse) {
	if (isEmptyString(serverResponse)) {
		return true;
	}
	var groupMembersOnServer = new Array();
	var currentTrackUser = '';
	var coords = new Array();
	var isPosition = false;
	var lines = serverResponse.split("\n");
	var lineCount = lines.length;
	for ( var i = 0; i < lineCount; i++) {
		var line = lines[i];
		var line = line.trim();
		if ('' == line) {
			continue;
		}
		if (startsWith('[positions', line)) {
			isPosition = true; // is a position
			continue;
		} else if (startsWith('[track', line)) {
			// start a new track
			isPosition = false; // is a track
			// draw the track befor if anyvar myString = "something format_abc";
			var myRegexp = /-(.*?)\]/g;
			var match = myRegexp.exec(line);
			var lineUser = match[1];
			if (isEmptyString(lineUser)) {
				return false; // Something really went wrong
			}
			if (!isEmptyString(currentTrackUser)) {
				// Release track befor
				if (!isIgnoreServerUpdateForUser(currentTrackUser)) {
					elongateTrack(coords, currentTrackUser, true);
				}
			}
			currentTrackUser = lineUser;
			coords = new Array();
		} else {
			if ((isPosition)) {
				var userRegexp = /user=(.*?);/g;
				var userMatch = userRegexp.exec(line);
				var userFromPositionLine = userMatch[1];
				if (isEmptyString(userFromPositionLine)) {
					return false; // Something really went wrong
				}
				groupMembersOnServer.push(userFromPositionLine);
				if (!isIgnoreServerUpdateForUser(userFromPositionLine)) {
					readPositionLine(line);
				}
			} else {
				if (!isIgnoreServerUpdateForUser(currentTrackUser)) {
					readTrackLine(line, coords, currentTrackUser);
				}
			}
		}
	}
	if (!isEmptyString(currentTrackUser)) {
		// Releas last user (track)
		if (!isIgnoreServerUpdateForUser(currentTrackUser)) {
			elongateTrack(coords, currentTrackUser, true);
		}
	} else {
		// It might happen that the user has not track for today but existing
		// gpx (older than today)
		if (hasToLoadGpxTracksAtProgrammStart) {
			hasToLoadGpxTracksAtProgrammStart = false;
			if (!isEmptyString(trackDateListBuffer)) {
				trackNameSelected = getLastFromTrackList();
				xhrUpdateTracks();
			}
		}
	}
	removeStrangers(groupMembersOnServer);
	return true;
}

function getLastFromTrackList() {
	var lastTrackElement = "";
	if (isEmptyString(trackDateListBuffer)) {
		return lastTrackElement;
	}
	var trackDates = trackDateListBuffer.split("\n");
	var length = trackDates.length;
	if (length > 0) {
		lastTrackElement = trackDates[length - 1];
	}
	return lastTrackElement;
}

function isIgnoreServerUpdateForUser(userToCompare) {
	var currentUser = getValue(KEY_USER);
	if (currentUser == userToCompare) {
		return true;
	}
	return false;
}

/**
 * Add track point to the array coords
 * 
 * @param line
 * @param coords
 * @param currentTrackUser
 */
function readTrackLine(line, coords, currentTrackUser) {
	// example line: "lat=54.1;lon=13.7;time=2013-03-21T15:50:59.000Z+1:00"
	var keyValues = line.split(";");
	var pairCount = keyValues.length;
	var lat = 0;
	var lon = 0;
	var time = '';
	for ( var i = 0; i < pairCount; i++) {
		var keyValue = keyValues[i];
		var pair = keyValue.split("=");
		if (pair.length == 2) {
			var key = pair[0];
			var value = pair[1];
			if (key == 'lat') {
				lat = value;
			} else if (key == "lon") {
				lon = value;
			} else if (key == "time") {
				time = value;
			}
		}
	}
	if (time == '') {
		// Do not allow track points without time.
		// Why? This would undermine the whole process of updating
		// Without time the whole track would be downloaded at every update
		return;
	}
	var isLocalToday = isToday(time);
	if(! isLocalToday) {
		// Do not draw tracks that are not from (local) today.
		return;
	}
	// Check it the existing track started yesterday
	// If yes then remove. Why? The map displays only way points from today.
//	removeTrackIfFromYesterday(currentTrackUser);
	// Create a point and add to the array of coordinates (to draw on the map, later)
	if (lat != 0 && lon != 0) {
		var point = new Array(lon, lat);
		coords.push(point);
		// Remember the time for the last point of the track to get new track
		// points only
		setLastTrackPointTime(currentTrackUser, time);
		var browserUser = getValue(KEY_USER);
		if (currentTrackUser == browserUser) {
			// Add track point to buffer of focused user
			addTrackPointToDrawBuffer(line);
		}
	}
}

/**
 * Check wether a user has a track from yesterday.
 * This allways happens if a new (local) day starts.
 * The user will see way points from today only.
 * (BUT: Unsent track points will never be deleted.)
 * @param userName
 */
function removeTrackIfFromYesterday(userName) {
	if(userName == "") {
		return;
	}
	var groupMember = getGroupMember(userName);
	var existingTackStartDateTime = groupMember[KEY_GROUP_MEMBER_TRACK_START_TIME];
	if(existingTackStartDateTime != "") {
		var isLocalToday = isToday(existingTackStartDateTime);
		if(! isLocalToday) {
			// The existing track is not from today. Remove it.
			removeTrack(userName);
		}
	}
}

/**
 * Remove track data for a user
 * - buffer to draw the track on the map
 * - track details (start time, distance, count of way points)
 * - track from the map
 * But do not remove the send buffer.
 * @param userName
 */
function removeTrack(userName) {
	if(userName == "") {
		return;
	}
	var browserUser = getValue(KEY_USER);
	if(browserUser == userName) {
		// Clear track buffer (to draw on map). Used for restart of browser.
		bufferTrackPointsToDraw = "";
		addItemToLocalStorage(KEY_BROWSER_BUFFER_TRACK_POINTS_TO_DRAW,
				bufferTrackPointsToDraw);
	}
	var groupMember = getGroupMember(userName);
	clearDetailsToUserTrackpoints(userName);
	// Remove track on the map
	removeTrackLayer(userName);
}

function setUserLastDetails(user, time, speed, altitude) {
	// { Array{ [user-name], [date-time], [speed], [altitude] [number trackpoint
	// },... } }
	var groupMember = getGroupMember(user);
	groupMember[KEY_GROUP_MEMBER_DATETIME_LAST_POSITION] = time;
	groupMember[KEY_GROUP_MEMBER_SPEED] = speed;
	groupMember[KEY_GROUP_MEMBER_ALTITUDE] = altitude;
}

/**
 * Calculate the distance from the last existing way point to the new onw.
 * Add this distance to stored distance of the user
 * Then store lat and lon of the new way point as starting point for the next
 * calculation (of the distance).
 * 
 * @param user
 * @param lat latitude of new way point
 * @param lon longitude of new way point
 */
function setUserLastTrackPositionAndAddToTrackDistance(user, lat, lon) {
	// { Array{ [user-name], [date-time], [lat], [lon], [track-start-date],
	// [distance-km] },... } }
	var groupMember = getGroupMember(user);
	var trackDistance = getUserTrackDistance(user)
	// Try to calculate the distance
	var previousLat = getUserTrackLat(user);
	if (previousLat != 0) {
		// calculate distance
		var previousLon = getUserTrackLon(user);
		var distance = calculateDistance(previousLat, previousLon, lat, lon);
		if (trackDistance == 0) {
			trackDistance = distance; // km
		} else {
			trackDistance += distance; // km
		}
		groupMember[KEY_GROUP_MEMBER_TRACK_DISTANCE] = trackDistance;
	}
	// Set lat, lon
	groupMember[KEY_GROUP_MEMBER_LAT] = lat;
	groupMember[KEY_GROUP_MEMBER_LON] = lon;
}

/**
 * Set the date-time of last track point for the group member.
 * This time is later send to the server to get track points only
 * for new positions.
 * @param user user name
 * @param dateTime formated date like 2012-05-17 18:02:56.063
 */
function setLastTrackPointTime(user, dateTime) {
	// Get the user from an array in which all users are stored
	// { Array{ [user-name], [date-time], [lat], [lon] },... } }
	var groupMember = getGroupMember(user);
	setFirstTrackPointTime(user, dateTime);
	groupMember[KEY_GROUP_MEMBER_DATETIME_LAST_POSITION] = dateTime;
	var count = groupMember[KEY_GROUP_MEMBER_TRACKPOINTS_COUNT];
	if (isEmptyString(count)) {
		count = 1;
	} else {
		count = count + 1;
	}
	groupMember[KEY_GROUP_MEMBER_TRACKPOINTS_COUNT] = count;
}

function setFirstTrackPointTime(user, dateTime) {
	var groupMember = getGroupMember(user);
	var found = groupMember[KEY_GROUP_MEMBER_TRACK_START_TIME];
	if(found == "") {
		groupMember[KEY_GROUP_MEMBER_TRACK_START_TIME] = dateTime;
	}
}

function getUserTrackDistance(user) {
	var groupMember = getGroupMember(user);
	var distance = groupMember[KEY_GROUP_MEMBER_TRACK_DISTANCE];
	if(isEmptyString(distance)) {
		distance = 0;
	}
	return distance;
}

function getUserTrackLon(user) {
	var groupMember = getGroupMember(user);
	var lon = groupMember[KEY_GROUP_MEMBER_LON];
	if(isEmptyString(lon)) {
		lon = 0;
	}
	return lon;
}

function getUserTrackLat(user) {
	var groupMember = getGroupMember(user);
	var lat = groupMember[KEY_GROUP_MEMBER_LAT];
	if(isEmptyString(lat)) {
		lat = 0;
	}
	return lat;
}

function getUserTime(user) {
	var groupMember = getGroupMember(user);
	return groupMember[KEY_GROUP_MEMBER_DATETIME_LAST_POSITION];
}

function getUserSpeed(user) {
	var groupMember = getGroupMember(user);
	return groupMember[KEY_GROUP_MEMBER_SPEED];
}

function getUserAltitude(user) {
	var groupMember = getGroupMember(user);
	return groupMember[KEY_GROUP_MEMBER_ALTITUDE];
}

function getUserTrackStartTime(user) {
	var groupMember = getGroupMember(user);
	return groupMember[KEY_GROUP_MEMBER_TRACK_START_TIME];
}

function getUserCountOfTrackpoints(userName) {
	if(userName == "") {
		return 0;
	}
	var groupMember = getGroupMember(userName);
	var count = groupMember[KEY_GROUP_MEMBER_TRACKPOINTS_COUNT];
	if (isEmptyString(count)) {
		count = 0;
	}
	return count;
}

function clearDetailsToUserTrackpoints(user) {
	// Clear distance. This will also block the display of track details.
	var groupMember = getGroupMember(user);
	groupMember[KEY_GROUP_MEMBER_TRACK_DISTANCE] = 0;
	// Clear the time
	groupMember[KEY_GROUP_MEMBER_TRACK_START_TIME] = "";
	// Clear count of track points
	groupMember[KEY_GROUP_MEMBER_TRACKPOINTS_COUNT] = "";
}

/**
 * "Remember" the (already known) way points for all users and create a CSV
 * string of it like "Peter=2013-10-09 18:46:38;Lisa=2013-10-09 18:47:38;..."
 * 
 * @returns {String} "Peter=2013-10-09 18:46:38;Lisa=2013-10-09 18:47:38;..."
 */
function getAllLastTrackTimesAsRequestString() {
	var buf = "";
	var browserUser = getValue(KEY_USER);
	var userCount = groupMembers.length;
	if (userCount < 1) {
		// first request
		return browserUser;
	}
	for ( var i = 0; i < userCount; i++) {
		// Array{ [user-name], [Date-Time], [lat], [lon] }
		var groupMember = groupMembers[i];
		if (buf.length > 0) {
			buf += ";";
		}
		buf += groupMember[KEY_GROUP_MEMBER_NAME] + "=" + groupMember[KEY_GROUP_MEMBER_DATETIME_LAST_POSITION];
	}
	return buf;
}

// returns
// - Array{ [user-name], [date-time], [lat], [lon], ..}
// [track-distance] }
// - created array
function getGroupMember(userName) {
	if(isEmptyString(userName)) {
		return "";
	}
	var groupMember;
	var userCount = groupMembers.length;
	for ( var i = 0; i < userCount; i++) {
		// Array{ [user-name], [date-time], [lat], [lon] }
		groupMember = groupMembers[i];
		var currentUserName = groupMember[KEY_GROUP_MEMBER_NAME];
		if (currentUserName == userName) {
			return groupMember;
		}
	}
	groupMember = addUser(userName);
	return groupMember;
}
function addUser(userName) {
	// user name, date-time, lat, lon, track-start-date, track-distance-km
	var now = getCurrentUTCTimeFormatted();
	var groupMember = new Array(userName, "", "", "", "", "", "", "", "", "");
	groupMember[KEY_GROUP_MEMBER_NAME] = userName;
	groupMembers.push(groupMember);
	return groupMember;
}
function clearUsers() {
	groupMembers = new Array();
}

// not used because of missing timeout for request
function loadUpdatedPosition() {
	var user = getValue(KEY_USER);
	var pass = getValue(KEY_PASS);
	var url = "geo5.php?user=" + user + "&pass=" + pass
			+ "&getLastPostionsAndTracks=true";
	OpenLayers.Request.GET({
		url : url,
		async : true,
		success : function(r) {
			displayServerPositionUpdate(r.responseText);
		},
		failure : function(r) {
			alert();
		}
	});
}

// /////////////////////////////////////////////////////////////////////
// GUI
// /////////////////////////////////////////////////////////////////////

// mode = 0 = You button only
// mode = 1 = login inputs (user, pass, group, new pass button)
// mode = 2 = login inputs with input for new password (user, pass, group,)
// mode = 3 = login inputs with confirmation button "Sure?" to remove the user
// mode = 4 = display inputs
// mode = 5 = display tracks
// mode = 6 = position
// mode = 7 = settings
// from the server
function showMainNavBar(modeTarget, isStoringBefor, modeSender) {
	if(modeTarget == modeSender) {
		// The same button was clicked again.
		// This means the user wants save to close.
		saveInput(); // This cames here again > use return
		return;
	}
	// Save the changes if the user switches
	if (isStoringBefor) {
		if (modeTarget == 1 || modeTarget == 4 || modeTarget == 5 || modeTarget == 6 || modeTarget == 7) {
			stopShareAndGeoLocation();
			storeInputs();
		}
	}
	var text = "";
	// -- upper button row ----------------
	if (modeTarget == 1) {
		text += createButtonsUpper(0);
		text += "<br/>";
	} else if (modeTarget == 2) {
		text += createButtonsUpper(1);
		text += "<br/>";
	} else if (modeTarget == 3) {
		text += createButtonsUpper(1);
		text += "<br/>";
	} else if (modeTarget == 4) {
		text += createButtonsUpper(2);
		text += "<br/>";
	} else if (modeTarget == 5) {
		text += createButtonsUpper(0);
		text += "<br/>";
	} else if (modeTarget == 6) {
		text += createButtonsUpper(3);
		text += "<br/>";
	} else if (modeTarget == 7) {
		text += createButtonsUpper(4);
		text += "<br/>";
	}
	// -- inputs bewtween button rows -----
	if (modeTarget == 1) {
		// Stop a) sync with server and b) location update
		pressStop(false);
		// GUI elements
		text += createImputYou(0);
	} else if (modeTarget == 2) {
		text += createImputYou(1);
	} else if (modeTarget == 3) {
		text += createImputYou(2);
	} else if (modeTarget == 4) {
		text += createInputsDisplay();
		text += "<br/>";
	} else if (modeTarget == 5) {
		text += createInputsTracks();
		text += "<br/>";
	} else if (modeTarget == 6) {
		text += createInputsPosition();
		text += "<br/>";
	} else if (modeTarget == 7) {
		text += createInputsSettings();
		text += "<br/>";
	}
	text += "<br/>";
	// -- lower button row ----------------
	if (modeTarget == 0) {
		text += createButtonYou(true, modeTarget);
	} else {
		text += createButtonRow(modeTarget);
	}
	var element = document.getElementById('buttonrow')
	if(element) {
		document.getElementById("buttonrow").innerHTML = text;
	}
	populateInputs();
	bindEventListenersDynamically();
}

/**
 * Create the upper button row above the input fields
 * 
 * @param mode
 *            mode = 0 = no default button, mode = 1 = default button to remove
 *            the input for new password, mode = 2 = set default values for,
 *            mode = 3 = defaults for position build-in
 * @returns {String} the html containing the buttons
 */
function createButtonsUpper(mode) {
	var text = "";
	if (mode == 1) {
		text += " <button onclick=\"showMainNavBar(1, false, -1);\">Default</button>";
	} else if (mode == 2) {
		text += " <button onclick=\"setDefaultsDisplayAndShow();\">Default</button>";
	} else if (mode == 3) {
		text += " <button onclick=\"setDefaultsPositionsAndShow();\">Default</button>";
	} else if (mode == 4) {
		text += " <button onclick=\"setDefaultsSettingsAndShow();\">Default</button>";
	}
	return text;
}
/**
 * Create the inputs for login (user, pass, group,..)
 * 
 * @param mode
 *            int mode = 0 = default mode = 1 = button "Remove Me", input "New
 *            Password" mode = 2 = button "Sure" (confirmation of remove me),
 *            button "Change" password
 * @returns {String} html
 */
function createImputYou(mode) {
	var text = "";
	text += "Who are you?";
	text += "<br/>";
	text += "<table>";
	text += "<tr>";
	text += "<td>";
	text += " <label for=\"" + KEY_USER + "\">Name </label>";
	text += "</td>";
	text += "<td>";
	text += " <input name=\"" + KEY_USER + "\" id=\"" + KEY_USER
			+ "\" type=\"text\" size=\"10\" maxlength=\"30\">";
	if (mode == 0) {
		text += " <input type=\"button\" value=\"Remove\" onclick=\"showMainNavBar(3, false, -1);\"/>";
	} else if (mode == 2) {
		text += " <input type=\"button\" value=\"Sure?\" onclick=\"removeUser();\"/>";
	}
	text += "</td>";
	text += "</tr>";
	text += "<tr>";
	text += "<td>";
	text += " <label for=\"" + KEY_PASS + "\">Password </label>";
	text += "</td>";
	text += "<td>";
	text += " <input name=\"" + KEY_PASS + "\" id=\"" + KEY_PASS
			+ "\" type=\"password\" size=\"10\" maxlength=\"30\">";
	if (mode == 0) {
		text += " <input type=\"button\" value=\"Change\" onclick=\"showMainNavBar(2, false, -1);\"/>";
	}
	text += "</td>";
	text += "</tr>";
	if (mode == 1) {
		text += "<tr>";
		text += "<td>";
		text += " <label for=\"" + KEY_PASS_NEW + "\">Pass New </label>";
		text += "</td>";
		text += "<td>";
		text += " <input name=\"" + KEY_PASS_NEW + "\" id=\"" + KEY_PASS_NEW
				+ "\" type=\"password\" size=\"10\" maxlength=\"30\">";
		text += " <input type=\"button\" value=\"Sure?\" onclick=\"saveInput();\"/>";
		text += "</td>";
		text += "</tr>";
	}
	text += "<tr>";
	text += "<td>";
	text += " <label for=\"" + KEY_GROUP + "\">Group </label>";
	text += "</td>";
	text += "<td>";
	text += " <input name=\"" + KEY_GROUP + "\" id=\"" + KEY_GROUP
			+ "\" type=\"text\" size=\"10\" maxlength=\"30\">";
	text += "</td>";
	text += "</tr>";
	text += "</table>";
	return text;
}

// mode = 0 = build-in (browser)
// mode = 1 = external (server)
function createInputsPosition() {
	text = "How to sample your own positions";
	text += "<br/>";
	text += createDropDownServerIntervall(KEY_INTERVALL_POSITION);
	text += " intervall for sampling";
	text += "<br/>";
	text += "<select name=\"" + KEY_ACCURACY_POSITION + "\" id=\""
			+ KEY_ACCURACY_POSITION + "\" size=\"1\">";
	text += "</select>";
	text += " <label for=\"" + KEY_ACCURACY_POSITION
			+ "\"> meter min. accuracy</label>";
	text += "<br/>";
	text += "<select name=\"" + KEY_MIN_DISTANCE + "\" id=\""
			+ KEY_MIN_DISTANCE + "\" size=\"1\">";
	text += "</select>";
	text += " <label for=\""
			+ KEY_MIN_DISTANCE
			+ "\"> meter min. change</label>";
	return text;
}

function createInputsTracks() {
	var text = "";
	text += "View one of your recent tracks";
	text += "<br/>";
	text += "Tracks <select name=\"trackDate\" id=\"trackDate\" size=\"1\"></select>";
	text += " <a id=\"" + ID_DOWNLOAD + "\" target=\"_blank\"></a>";
	// Show count of unsent way points
	var lenght = arrayBufferTrackPointsToSend.length;
	if(lenght > 0) {
		text += "<br/>";
		text += "Way points not send yet: " + length;
	}

	return text;
}

function createInputsDisplay() {
	var text = "";
	text += "How to share positions";
	text += "<br/>";
	text += createDropDownServerIntervall(KEY_INTERVALL_SERVER);
	text += " <label for=\""
			+ KEY_INTERVALL_SERVER
			+ "\">Intervall to share</label>";
	text += "<br/>";
	text += "<input type=\"checkbox\" id=\""
			+ KEY_SHOW_DETAILS
			+ "\"/> Show details on selected user";

	return text;
}

function createInputsSettings() {
	var text = "";
	text += " <label for=\"" + KEY_MARKER_ICON
			+ "\"> Marker </label>";
	text += "<select name=\"" + KEY_MARKER_ICON + "\" id=\"" + KEY_MARKER_ICON
			+ "\" size=\"1\">";
	text += "</select>";
	text += "<br/>";
	text += " <label for=\"" + KEY_MARKER_SIZE + "\">Marker </label>";
	text += "<select name=\"" + KEY_MARKER_SIZE + "\" id=\"" + KEY_MARKER_SIZE
			+ "\" size=\"1\">";
	text += "</select>";
	text += " <label for=\""
			+ KEY_MARKER_SIZE
			+ "\"> Magnification</label>";
	text += "<br/>";
//	text += "<input type=\"checkbox\" id=\"" + KEY_DEBUG_MESSAGES
//			+ "\"/> Show debug messages (find bugs)";
//	text += "<br/>";
//	text += "URL <input name=\"" + KEY_SCRIPT_URL + "\" id=\""
//			+ KEY_SCRIPT_URL
//			+ "\" type=\"text\" size=\"30\" maxlength=\"100\">";
//	text += "<br/>";
	text += "<select name=\"" + KEY_EXPIRATION_DAYS + "\" id=\""
			+ KEY_EXPIRATION_DAYS + "\" size=\"1\">";
	text += "</select>";
	text += " <label for=\""
			+ KEY_EXPIRATION_DAYS
			+ "\"> expiration days for tracks / users</label>";
//	text += "<br/>";
//	text += "<select name=\"" + KEY_TIMEZONE_OFFSET + "\" id=\""
//			+ KEY_TIMEZONE_OFFSET + "\" size=\"1\">";
//	text += "</select>";
//	text += " <label for=\"" + KEY_TIMEZONE_OFFSET
//			+ "\"> timezone to split tracks into days</label>";
	text += "<br/>";
	text += version;
	text += "<br/>";
	text += "Find <a href=\"https://sourceforge.net/p/geo5/wiki/Home/\" target=\"_blank\">help</a>. ";
	text += "Please report <a href=\"https://sourceforge.net/p/geo5/tickets/\" target=\"_blank\">bugs</a>.";

	return text;
}

function createButtonYou(hasStartStopButton, mode) {
	var text = "";
	if (hasStartStopButton) {
		text += "<button onclick=\"showMainNavBar(1, true, -1);\">You</button>";
		text += createMainActionButtons(mode);
		var element = document.getElementById('text')
		if(element) {
			var textDiv = document.getElementById('text');
			textDiv.style.background = "rgba(255, 255, 122, 0)";
		}
	} else {
		if(mode == 1) {
			text += "<button id=\"selected\" onclick=\"showMainNavBar(1, true, 1);\">You</button>";
		} else {
			text += "<button onclick=\"showMainNavBar(1, true, -1);\">You</button>";
		}
		var element = document.getElementById('text')
		if(element) {
			var textDiv = document.getElementById('text');
			textDiv.style.background = "rgba(255, 255, 122, 0.7)";
		}
	}
	return text;
}

function createButtonRow(mode) {
	var text = "";
	text += createButtonYou(false, mode);
	if(mode == 6) {
		text += " <button id=\"selected\" onclick=\"showMainNavBar(6, true, 6);\">Position</button>";
	} else {
		text += " <button onclick=\"showMainNavBar(6, true, -1);\">Position</button>";
	}
	if(mode == 4) {
		text += " <button id=\"selected\" onclick=\"showMainNavBar(4, true, 4);\">Share</button>";
	} else {
		text += " <button onclick=\"showMainNavBar(4, true, -1);\">Share</button>";
	}
	if(mode == 5) {
		text += " <button id=\"selected\" onclick=\"showMainNavBar(5, true, 5);\">Tracks</button>";
	} else {
		text += " <button onclick=\"showMainNavBar(5, true, -1);\">Tracks</button>";
	}
	if(mode == 7) {
		text += " <button id=\"selected\" onclick=\"showMainNavBar(7, true, 7);\">Settings</button>";
	} else {
		text += " <button onclick=\"showMainNavBar(7, true, -1);\">Settings</button>";
	}
	return text;
}

function createMainActionButtons(mode) {
	var intervall = getValue(KEY_INTERVALL_SERVER);
	var milliseconds = getMillisecondsForListValue(intervall);
	if (milliseconds == 0) {
		// the sync with the server is not running
		var intervall = getValue(KEY_INTERVALL_POSITION);
		var milliseconds = getMillisecondsForListValue(intervall);
		if (milliseconds == 0) {
			// the browser location is not running
			// neither the location nor the sync is running
			// Do not show the start/stop button
			return "";
		}
	}
	var text = "";
	if (wasStoppedByUser) {
		text += " <actionbutton onclick=\"pressStart();\">Start</actionbutton>";
	} else {
		text += " <actionbutton id=\"running\" onclick=\"pressStop(true);\">Stop</actionbutton>";
		text += createCenterButton();
		text += createTrackButton();
	}
	return text;
}

function createCenterButton() {
	var text = "";
	var isSelected = getValue(KEY_CENTER)
	if (isSelected.match(/true/i)) {
		text += " <actionbutton id=\"running\" onclick=\"pressStopCenter();\">Center</actionbutton>";
	} else {
		text += " <actionbutton onclick=\"pressStartCenter();\">Center</actionbutton>";
	}
	return text;
}

function createTrackButton() {
	var text = "";
	var isSelected = getValue(KEY_STORE_TRACK)
	if (isSelected.match(/true/i)) {
		text += " <actionbutton id=\"running\" onclick=\"pressStopTrack();\">Track</actionbutton>";
	} else {
		text += " <actionbutton onclick=\"pressStartTrack();\">Track</actionbutton>";
	}
	return text;
}

function showTrackInfoRecorded() {
	var text = "";
	// Do not change the values if the track is stopped.
	var isStoreTrack = getValue(KEY_STORE_TRACK);
	if (!isStoreTrack.match(/true/i)) {
//		showTrackInfo("");
	}
	var userName = getValue(KEY_USER);
	if(userName == "") {
		return;
	}
	var trackDistance = getUserTrackDistance(userName)
	if (trackDistance != 0) {
		text += "<br/>";
		var rounded = Number((trackDistance).toFixed(3));
		text += " " + getUserTrackDistanceRounded(userName);
		var groupMember = getGroupMember(userName);
		var trackStartDate = groupMember[KEY_GROUP_MEMBER_TRACK_START_TIME];
		var elapsedTime = calculateTimeDifference(trackStartDate);
		text += ", " + elapsedTime;
	}
}

function getUserTrackDistanceRounded(userName) {
	var text = "";
	var trackDistance = getUserTrackDistance(userName)
	if (trackDistance != 0) {
		var rounded = Number((trackDistance).toFixed(3));
		text = rounded + " km";
	} else {
		text == "0 km";
	}
	return text;
}

function createDropDownServerIntervall(key_id) {
	text = "";
	text += "<select name=\"" + key_id + "\" id=\"" + key_id + "\" size=\"1\">";
	text += "<option>never</option>";
	text += "<option>2 s</option>";
	text += "<option>10 s</option>";
	text += "<option>1 min</option>";
	text += "<option>10 min</option>";
	text += "</select>";
	return text;
}

function bindEventListenersDynamically() {
	var inputElement = document.getElementById('trackDate');
	if (inputElement) {
		fillDropDownTracks();
		document.getElementById('trackDate').onchange = function() {
			updateTracksForListSelection();
		};
	}
	inputElement = document.getElementById(KEY_TIMEZONE_OFFSET);
	if (inputElement) {
		fillDropDownTimezoneOffset();
	}
	inputElement = document.getElementById(KEY_EXPIRATION_DAYS);
	if (inputElement) {
		fillDropDownExpirationDays();
	}
	inputElement = document.getElementById(KEY_ACCURACY_POSITION);
	if (inputElement) {
		fillDropDownAccuracyPosition();
	}
	inputElement = document.getElementById(KEY_MIN_DISTANCE);
	if (inputElement) {
		fillDropDownMinDistance();
	}
	inputElement = document.getElementById(KEY_MARKER_ICON);
	if (inputElement) {
		fillDropDownMarkerIcon();
	}
	inputElement = document.getElementById(KEY_MARKER_SIZE);
	if (inputElement) {
		fillDropDownMarkerSize();
	}
}

function saveInput() {
	var userNameBeforSave = getValue(KEY_USER);
	var isChangePassword = storeSettings();
	uploadConfiguration();
	wasStoppedByUser = false;
	var userNameAfterSave = getValue(KEY_USER);
	if(userNameBeforSave != userNameAfterSave) {
		clearPositionsTracksAndUsers();
		startApp();
	} else {
		// Close setting in GUI
		showHideDebugWarnungMessages();
		// The user presses save befor
		showMainNavBar(0, false, -1);
		if (isChangePassword) {
			changePass();
			startShareAndPositionUpdate();
			return;
		} 
		pressStart();
	}
}
function populateInputs() {
	populateInputsHelper(inputKeys, inputValues);
	// Set default values nothing was stored befor
	// Check the one of the display values
	var value = getValue(KEY_SHOW_DETAILS);
	if (value == "") {
		setDefaultsDisplay();
		setDefaultsPositions();
		setDefaultsSettings();
	}
}
function populateInputsHelper(keyArray, valueArray) {
	var length = keyArray.length;
	for ( var i = 0; i < length; i++) {
		var key = keyArray[i];
		var inputElement = document.getElementById(key);
		if (inputElement) {
			var value = valueArray[i];
			if (!value) {
				value = "";
			}
			var tagname = inputElement.tagName;
			if (tagname.match(/span/i)) {
				inputElement.innerHTML = value;
			} else if (tagname.match(/select/i)) {
				var sizeList = inputElement.length;
				for ( var selIndex = 0; selIndex < sizeList; selIndex++) {
					var selectedOption = inputElement[selIndex];
					var selectedOptionText = selectedOption.text;
					if (selectedOptionText == value) {
						inputElement.selectedIndex = selIndex;
						break;
					}
				}
			} else {
				if (isCheckBox(inputElement)) {
					if (value == "true") {
						inputElement.checked = true;
					} else {
						inputElement.removeAttribute("checked");
					}
				} else if (isRadio(inputElement)) {
					if (value == "true" || value == "on" || value == "checked") {
						inputElement.checked = true;
					} else {
						inputElement.removeAttribute("checked");
					}
				} else {
					inputElement.value = value;
				}
			}

		}
	}
}
function correctTimezoneOffset() {
	var value = getValue(KEY_TIMEZONE_OFFSET);
	var splittees = value.split(" ");
	if (splittees.length < 2) {
		return;
	}
	var correctedTimezone = splittees[0];
	correctedTimezone = correctedTimezone * 60;
	setValue(KEY_TIMEZONE_OFFSET, correctedTimezone);
}
function storeInputs() {
	storeImputsHelper(inputKeys, inputValues);
	correctTimezoneOffset();
}
function storeImputsHelper(keyArray, valueArray) {
	var length = keyArray.length;
	for ( var i = 0; i < length; i++) {
		var key = keyArray[i];
		var inputElement = document.getElementById(key);
		if (inputElement) {
			var value = "";
			var tagname = inputElement.tagName;
			if (tagname.match(/span/i)) {
				value = inputElement.innerHTML;
			} else if (tagname.match(/select/i)) {
				value = inputElement.value;
			} else {
				if (isCheckBox(inputElement)) {
					var isCheckd = inputElement.checked;
					if (isCheckd) {
						value = "true";
					} else {
						value = "false";
					}
				} else if (isRadio(inputElement)) {
					var isCheckd = inputElement.checked;
					if (isCheckd) {
						value = "true";
					} else {
						value = "false";
					}
				} else {
					value = inputElement.value;
				}
			}
			valueArray[i] = value; // Set variable
			// addItemToLocalStorage(key, value); // Set localStorage
			setValue(key, value);
		}
	}
}
function isCheckBox(inputElement) {
	var checkBoxAttr = inputElement.getAttribute("type");
	if (checkBoxAttr) {
		if (checkBoxAttr.match(/checkbox/i)) {
			return true;
		}
	}
	return false;
}
function isRadio(inputElement) {
	var checkBoxAttr = inputElement.getAttribute("type");
	if (checkBoxAttr) {
		if (checkBoxAttr.match(/radio/i)) {
			return true;
		}
	}
	return false;
}

// -----------------------------------------------------------------

function setTrackDownloadLink(fileName) {
	var inputElement = document.getElementById(ID_DOWNLOAD);
	if (!inputElement) {
		return;
	}
	var user = getValue(KEY_USER);
	var href = "";
	var text = "";
	if (fileName != "") {
		var path = window.location.pathname;
		href = path + "users/" + user + "/" + fileName;
		text = "Download";
	}
	inputElement.href = href;
	inputElement.innerHTML = text;
}

function setDownloadedConfiguration(httpResponse) {
	if (isEmptyString(httpResponse)) {
		return;
	}
	var lines = httpResponse.split("\n");
	var length = lines.length;
	for ( var i = 0; i < length; i++) {
		var line = lines[i];
		var keyValue = line.split("=");
		if (keyValue.length != 2) {
			continue;
		}
		var key = keyValue[0];
		var value = keyValue[1];
		var keyT = key.trim();
		var valueT = value.trim();
		setValue(keyT, valueT);
	}
}

// ------------------------------------------------------------------

function setDefaultsDisplayAndShow() {
	setDefaultsDisplay();
	showMainNavBar(4, false, -1);
}
function setDefaultsPositionsAndShow() {
	setDefaultsPositions();
	showMainNavBar(6, false, -1);
}
function setDefaultsSettingsAndShow() {
	setDefaultsSettings();
	showMainNavBar(7, false, -1);
}
function setDefaultsYou() {
	setValue(KEY_USER, DEFAULT_USER_NAME);
	setValue(KEY_PASS, "");
	setValue(KEY_PASS_NEW, "");
	setValue(KEY_GROUP, "");
}
function setDefaultsDisplay() {
	setValue(KEY_SHOW_DETAILS, "false");
	setValue(KEY_INTERVALL_SERVER, "1 min");
	setValue(KEY_CENTER, "true");
}
function setDefaultsPositions() {
	setValue(KEY_INTERVALL_POSITION, "10 s");
	setValue(KEY_ACCURACY_POSITION, DEFAULT_ACCURACY);
	setValue(KEY_MIN_DISTANCE, DEFAULT_MIN_DISTANCE);
	setValue(KEY_STORE_TRACK, "false");
}
function setDefaultsSettings() {
	setValue(KEY_DEBUG_MESSAGES, "false");
	setValue(KEY_EXPIRATION_DAYS, DEFAULT_EXPIRATION);
	setValue(KEY_TIMEZONE_OFFSET, "");
	setValue(KEY_MARKER_ICON, DEFAULT_MARKER_ICON);
	setValue(KEY_MARKER_SIZE, DEFAULT_MARKER_SIZE);
	var url = getDefaultPHP();
	setValue(KEY_SCRIPT_URL, url);
}

function getDefaultPHP() {
	var protocol = window.location.protocol;
	var hostname = window.location.hostname;
	var path = window.location.pathname;
	var path = path.substr(0, path.lastIndexOf("/") + 1);
	var url = protocol + "//" + hostname + path + "geo5.php";
	return url;
}

/**
 * Helper to convert the string value in a drop down list (for intervall) to
 * milliseconds.
 * 
 * @param listValue
 *            String value from drop down list, i.e. "10 sec", "10 min"
 * @returns {Number} milliseconds
 */
function getMillisecondsForListValue(listValue) {
	var milliseconds = 0;
	// var listValue = document.getElementById('intervall').value;
	if (listValue == "2 s") {
		milliseconds = 2000;
	} else if (listValue == "10 s") {
		milliseconds = 10000;
	} else if (listValue == "1 min") {
		milliseconds = 60000;
	} else if (listValue == "10 min") {
		milliseconds = 600000;
	} else if (listValue == "never") {
		milliseconds = 0;
	}
	return milliseconds;
}

/**
 * Helper to convert milliseconds into Strings for the drow down list for the
 * intervall
 * 
 * @param milliseconds
 * @returns {String} the list value in the drop down, i.e. parameter 10000
 *          (milliseconds) returns "10 sec"
 */
function getListValueForSeconds(milliseconds) {
	var listValue = "never";
	if (milliseconds == 2000) {
		listValue = "2 s";
	} else if (milliseconds == 10000) {
		listValue = "10 s";
	} else if (milliseconds == 60000) {
		listValue = "1 min";
	} else if (milliseconds == 600000) {
		listValue = "10 min";
	} else if (milliseconds == 0) {
		listValue = "never";
	}
	return listValue;
}

function showWarning(message) {
	lastWarningMessage = message;
	var element = document.getElementById('warning')
	if(element) {
		document.getElementById("warning").innerHTML = message;
	}
}

function showBuffer(message) {
	var element = document.getElementById('buffer')
	if(element) {
		document.getElementById("buffer").innerHTML = message;
	}
}

function showDebug(message) {
	var element = document.getElementById('debugMessage')
	if(!element) {
		return;
	}
	lastDebugMessage = message;
	var isOn = getValue(KEY_DEBUG_MESSAGES);
	if (isOn == "true") {
		document.getElementById("debugMessage").innerHTML = message;
	} else {
		document.getElementById("debugMessage").innerHTML = "";
	}
}

function showHideDebugWarnungMessages() {
	var isOn = getValue(KEY_DEBUG_MESSAGES);
	if (isOn != "true") {
		clearMessages();
	} else {
		var element = document.getElementById('debugMessage')
		if(element) {
			document.getElementById("debugMessage").innerHTML = lastDebugMessage;
		}
		element = document.getElementById('warning')
		if(element) {
			document.getElementById("warning").innerHTML = lastWarningMessage;
		}
	}
}

function clearMessages() {
	var element = document.getElementById('debugMessage')
	if(element) {
		document.getElementById("debugMessage").innerHTML = "";
	}
	element = document.getElementById('warning')
	if(element) {
		document.getElementById("warning").innerHTML = "";
	}
	element = document.getElementById('buffer')
	if(element) {
		document.getElementById("buffer").innerHTML = "";
	}
	lastWarningMessage = "";
}

// Returns a formated date like 2012-05-17 18:02:56.063
// Date/Time is UTC
function getCurrentUTCTimeFormatted() {
	var now = new Date();
	var formatedDate = now.getUTCFullYear().toString();
	var s = now.getUTCMonth() + 1;
	formatedDate += "-" + (s <= 9 ? '0' + s : s);
	s = now.getUTCDate();
	formatedDate += "-" + (s <= 9 ? '0' + s : s);
	s = now.getUTCHours();
	formatedDate += " " + (s <= 9 ? '0' + s : s);
	s = now.getUTCMinutes();
	formatedDate += ":" + (s <= 9 ? '0' + s : s);
	s = now.getUTCSeconds();
	formatedDate += ":" + (s <= 9 ? '0' + s : s);
	s = now.getUTCMilliseconds();
	if (s <= 9) {
		s = '00' + s;
	} else if (s <= 100) {
		s = '0' + s;
	}
	formatedDate += "." + s;
	return formatedDate;
}

// ###################################################################
// -- Storage --------------------------------------------------------
// -------------------------------------------------------------------

// Try to retrieve the value from
// 1. array that is lost if the page is relaoded
// 2. local storage should revover values even after restart of
//    the OS. Remember that cookies / local storage might be
//    deaktivated by the user.
function getValue(key) {
	// Check local storage first
	var value = getItemFromlocalStorage(key);
	if (value) {
		// implicitly set in memory (array)
		var length = inputKeys.length;
		for ( var i = 0; i < length; i++) {
			var keyInList = inputKeys[i];
			if (key == keyInList) {
				inputValues[i] = value;
				return value;
			}
		}
	} else {
		// local storage is not available. Try to get from memory.
		var length = inputKeys.length;
		for ( var i = 0; i < length; i++) {
			var keyInList = inputKeys[i];
			if (key == keyInList) {
				var value = inputValues[i];
				return value;
			}
		}
	}
	return "";
}

// Store in
// 1. array that is lost if the page is relaoded
// 2. local storage should revover values even after restart of
//    the OS. Remember that cookies / local storage might be
//    deaktivated by the user.
function setValue(key, value) {
	var length = inputKeys.length;
	for ( var i = 0; i < length; i++) {
		var keyInList = inputKeys[i];
		if (key == keyInList) {
			inputValues[i] = value;
			addItemToLocalStorage(key, value);
			return;
		}
	}
}

function addItemToLocalStorage(id, value) {
	try {
		localStorage.setItem(id, value);
		return true;
	} catch (e) {
		return false;
	}
}
function getItemFromlocalStorage(id) {
	var item;
	try {
		item = localStorage.getItem(id);
	} catch (e) {
		showWarning("Please activate local storage / cookies !");
	}
	return item;
}

// ###################################################################
// ###################################################################
// -- New functionality for pure web app -----------------------------

// ###################################################################
// -- Configurations -------------------------------------------------
// -------------------------------------------------------------------

function removeUser() {
	// TODO: Call server to remove User
	stopShareAndGeoLocation();
	xhrRemoveUser();
//	showMainNavBar(0, false, -1);
}

function cleanupUser() {
	setValue(KEY_USER, "");
	setValue(KEY_PASS, "");
	setValue(KEY_GROUP, "");
	clearPositionsTracksAndUsers();
}
function changePass() {
	xhrChangePass();
}
function setChangedPassword() {
	var newPass = getValue(KEY_PASS_NEW);
	setValue(KEY_PASS, newPass);
}

/**
 * Removes users that do not belong to the own group.
 * This removes also layers (positions and track) on the map for belonging to the user
 * to be removed.
 * 
 * This might happen if the user changes the group or if a group member changes the group.
 * 
 * @param groupMembersOnServer Array containing String of user names that came from the server
 */
function removeStrangers(groupMembersOnServer) {
	var browserUserName = getValue(KEY_USER);
	var strangers = new Array();
	var length = groupMembersOnServer.length;
	var lengthGroupMembers = groupMembers.length;
	for ( var i = 0; i < lengthGroupMembers; i++) {
		var groupMember = groupMembers[i];
		var displayedName = groupMember[KEY_GROUP_MEMBER_NAME];
		if(browserUserName == displayedName) {
			// Do not remove the user that is just looking at his browser
			continue;
		}
		var isStranger = true;
		for ( var k = 0; k < length; k++) {
			var groupMemberOnServer = groupMembersOnServer[k];
			if(groupMemberOnServer == displayedName) {
				isStranger = false;
				break;
			}
		}
		if(isStranger) {
			strangers.push(displayedName);
		}
	}
	length = strangers.length;
	for ( var i = 0; i < length; i++) {
		var nameOfStranger = strangers[i];
		removeTrack(nameOfStranger);
		removePositionLayer(nameOfStranger);
		groupMembers.splice(i, 1);
	}
}

// ###################################################################
// -- Geolocation ----------------------------------------------------
// -------------------------------------------------------------------

var watchPositionId = -1;
var browserLastPositionUpdatesMilliseconds = 0;
var blockPositionUpdate = false;

function restartPositionUpdate() {
	var listValue = getValue(KEY_INTERVALL_POSITION);
	var waitMilliseconds = getMillisecondsForListValue(listValue);
	if (waitMilliseconds == 0) {
		return;
	}
	if (watchPositionId != -1) {
		// The parameter might have been changed
		stopWatchPosition();
	}
	blockPositionUpdate = false;
    browserLastPositionUpdatesMilliseconds = 0;
	watchPosition();
}

function watchPosition() {
	if (navigator.geolocation) {
		watchPositionId = navigator.geolocation.watchPosition(
				showBrowserPosition, showGeoError, {
					enableHighAccuracy : true,
					maximumAge : 5000,
					timeout : 60000
				});
	} else {
		showWarning("Geolocation is not supported by this browser.");
	}
}

function showBrowserPosition(position) {
	if(blockPositionUpdate) {
		return;
	}
	var accuracy = "";
	if (position.coords.accuracy) {
		accuracy = position.coords.accuracy;
		if (!isLocationUpdateAcceptedByAccuracy(accuracy)) {
			return;
		}
	}
	if (!isLocationUpdateAcceptedByTime()) {
		return;
	}
	// Sometimes the time is null. Create anyway.
	var time = getCurrentUTCTimeFormatted();
	var speed = "";
	if (position.coords.speed) {
		speed = position.coords.speed;
	}
	var altitude = "";
	if (position.coords.altitude) {
		altitude = position.coords.altitude;
	}
	var user = getValue(KEY_USER);
	// var csvLine = "user=" + user;
	var csvLine = "lat=" + position.coords.latitude;
	csvLine += ";lon=" + position.coords.longitude;
	csvLine += ";bearing=";
	csvLine += ";speed=" + speed;
	csvLine += ";altitude=" + altitude;
	csvLine += ";accuracy=" + accuracy;
	csvLine += ";time=" + time;
	csvLastGeoLocationToShare = csvLine;
	if (!isLocationUpdateAcceptedByDistance(position)) {
		return;
	}
	browserLastPositionUpdatesMilliseconds = Date.now();
	runSynchronizedInputOutput(csvLine);
}

function showGeoError(error) {
	switch (error.code) {
	case error.PERMISSION_DENIED:
		showDebug("User denied the request for Geolocation.");
		break;
	case error.POSITION_UNAVAILABLE:
		showDebug("Location information is unavailable.");
		break;
	case error.TIMEOUT:
		showDebug("The request to get user location timed out. Acquiring a new position object..");
		restartPositionUpdate();
		break;
	case error.UNKNOWN_ERROR:
		showDebug("An unknown error occurred.");
		break;
	}
}

function readBrowserLocationCsvLine(csvLine) {
	// Store the track point into the send buffer. This does not send the track
	// immediatlty. Instead it will be sent by window.startSharing().
	addGeoLocationToSendBuffer(csvLine);
	// Draw the track on the map
	addBrowserTrackPoint(csvLine);
	// Show the position on the map
	readPositionLineForBrowser(csvLine, false);
}

function stopWatchPosition() {
	if (watchPositionId == -1) {
		return;
	}
	navigator.geolocation.clearWatch(watchPositionId);
	watchPositionId = -1;
//	browserLastPositionUpdatesMilliseconds = 0;
	blockPositionUpdate = true;
}

function isLocationUpdateAcceptedByTime() {
	var nowMilliseconds = Date.now();
	// var nowMilliseconds = Date.getTime();
	var listValue = getValue(KEY_INTERVALL_POSITION);
	var waitMilliseconds = getMillisecondsForListValue(listValue);
	var threshold = browserLastPositionUpdatesMilliseconds + waitMilliseconds;
	if (nowMilliseconds > threshold) {
		// This has consequences for the upload.
		return true;
	}
	return false;
}

function isLocationUpdateAcceptedByAccuracy(accuracy) {
	var accuracySettings = getValue(KEY_ACCURACY_POSITION);
	var accur = parseInt(accuracySettings, 10);
	if (accur >= accuracy) {
		return true;
	}
	return false;
}

/**
 * The distance to the last positions should be half of the accuracy that was
 * set by the user.
 * 
 * @param position
 * @returns {Boolean}
 */
function isLocationUpdateAcceptedByDistance(position) {
	if (lastPosition == "") {
		// was not set befor
		lastPosition = position;
		return true;
	}
	var latitudeLast = lastPosition.coords.latitude;
	var longitudelast = lastPosition.coords.longitude;
	// var latitudeLast = 48.123730599999995; // test
	// var longitudelast = 11.579696; // test
	var latitudeNow = position.coords.latitude;
	var longitudeNow = position.coords.longitude;
	var distance = calculateDistance(latitudeLast, longitudelast, latitudeNow,
			longitudeNow);
	var accuracySettings = getValue(KEY_MIN_DISTANCE);
	var accur = parseInt(accuracySettings, 10);
	// ---------------------
	// Defintion of accuracy for android (might be the same as for browsers)
	// http://developer.android.com/reference/android/location/Location.html#getAccuracy%28%29
	// ...accuracy as the radius of 68% confidence. In other words, if you draw
	// a circle centered at this location's latitude and longitude, and with a
	// radius equal to the accuracy, then there is a 68% probability that the
	// true location is inside the circle.
	// ---------------------
	var d = distance * 1000; // km > m
	if (d > accur) {
		lastPosition = position;
		return true;
	}
	return false;

}
/**
 * The calculateDistance() function performs a geometric algorithm to determine
 * the distance between two co-ordinates. The Javascript implementation is
 * adapted from a script provided by Moveable Type
 * (http://www.movable-type.co.uk/scripts/latlong.html) under a Creative Commons
 * license:
 * 
 * @param csvLine
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
	lat1 = convertToNumber(lat1);
	lon1 = convertToNumber(lon1);
	lat2 = convertToNumber(lat2);
	lon2 = convertToNumber(lon2);
	var R = 6371; // km
	var dLat = (lat2 - lat1).toRad();
	var dLon = (lon2 - lon1).toRad();
	var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1.toRad())
			* Math.cos(lat2.toRad()) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = R * c;
	return d;
}
Number.prototype.toRad = function() {
	return this * Math.PI / 180;
}
function convertToNumber(StringOrNumber) {
	if (isString(StringOrNumber)) {
		return parseFloat(StringOrNumber);
	} else {
		return StringOrNumber;
	}
}
function isString(o) {
	return typeof o == "string"
			|| (typeof o == "object" && o.constructor === String);
}

function addBrowserTrackPoint(csvLine) {
	var isStoreTrack = getValue(KEY_STORE_TRACK);
	if (!isStoreTrack.match(/true/i)) {
		return;
	}
	// TODO Check if the track is from the same day. If not start a new one
	/* lat=47.50457163540115;lon=11.071390274487026;bearing=171.61432;speed=0.7065948;altitude=1067.652498529502;accuracy=6.0;time=2013-03-03_15:48:47.484 */
	var coords = new Array();
	var user = getValue(KEY_USER);
	readTrackLine(csvLine, coords, user);
	elongateTrack(coords, user, false);
}

function drawStoredTrackAndPosition() {
	var storedTrack = getItemFromlocalStorage(KEY_BROWSER_BUFFER_TRACK_POINTS_TO_DRAW);
	if (isEmptyString(storedTrack)) {
		return;
	}
	var csvLines = storedTrack.split("\n");
	var length = csvLines.length;
	var csvLine = csvLines[length - 1];
	// Set the last stored positions. Do this BEFOR the track.
	var browserUser = getValue(KEY_USER);
	readPositionLine("user=" + browserUser + ";" + csvLine);
	// Draw the track
	for ( var i = 0; i < length; i++) {
		csvLine = csvLines[i];
		addBrowserTrackPoint(csvLine);
	}
}

function getTimestamp(csvLine, dateOnly) {
	var timeRegexp = /time=([^;\n]+)/i;
	var timeMatch = timeRegexp.exec(csvLine);
	if (!timeMatch) {
		return "";
	}
	var timeStamp = timeMatch[1];
	if (isEmptyString(timeStamp)) {
		return "";
	}
	if (dateOnly) {
		var dateRegexp = /\d\d\d\d.*?\d\d.*?\d\d/i;
		var dateMatch = dateRegexp.exec(timeStamp);
		if (!dateMatch) {
			return "";
		}
		var timeStamp = dateMatch[0];
		if (isEmptyString(timeStamp)) {
			return "";
		}
	}
	return timeStamp;
}

function clearTrackPointBufferToDraw() {
	bufferTrackPointsToDraw = "";
	addItemToLocalStorage(KEY_BROWSER_BUFFER_TRACK_POINTS_TO_DRAW, "");
}

/**
 * This is the buffer tor the track that has to be drawn
 * on the map. It is stored in local storage just in case
 * the user closes the browser and wants to see its old track.
 * @param csvLine
 */
function addTrackPointToDrawBuffer(csvLine) {
	if (bufferTrackPointsToDraw != "") {
		bufferTrackPointsToDraw += "\n";
	}
	bufferTrackPointsToDraw += csvLine;
	addItemToLocalStorage(KEY_BROWSER_BUFFER_TRACK_POINTS_TO_DRAW,
			bufferTrackPointsToDraw);
}

/**
 * Every track point that is ever stored in this buffer has
 * to be sent to the server. It is stored to local storage
 * just in case the user closes the browser.
 * @param csvLine
 */
function addGeoLocationToSendBuffer(csvLine) {
	if(isEmptyString(csvLine)) {
		return;
	}
	var isStoreTrack = getValue(KEY_STORE_TRACK);
	if (!isStoreTrack.match(/true/i)) {
		// Overwrite the last position and return.		
		var l = arrayBufferTrackPointsToSend.length;
		if(l > 0) {
			arrayBufferTrackPointsToSend[l - 1] = csvLine;
		} else {
			arrayBufferTrackPointsToSend.push(csvLine);
		}
	} else {
		arrayBufferTrackPointsToSend.push(csvLine);
	}
	bufferTrackPointsToSend = "";
	var l = arrayBufferTrackPointsToSend.length;
	for ( var i = 0; i < l; i++) {
		if (bufferTrackPointsToSend != "") {
			bufferTrackPointsToSend += "\n";
		}
		bufferTrackPointsToSend += arrayBufferTrackPointsToSend[i];
	}
	addItemToLocalStorage(KEY_BROWSER_BUFFER_TRACK_POINTS_TO_SEND,
			bufferTrackPointsToSend);
	showPoinstUnsent();
}

/**
 * For tracks only. Positions do not remember failed server requests (uploads).
 * Remove  track points that has been sent from the send buffer.
 */
function setSuccessfullUpload() {
	// Fill the buffer
	var pointsLeft = arrayBufferTrackPointsToSend.length;
	if(pointsLeft < 1) {
		// Might this ever happen? Who knows.
		return;
	}
	
	// Remove the track point from the buffer
	arrayBufferTrackPointsToSend.shift();

	var tempBuffer = "";
	/*
	var csvLines = bufferTrackPointsToSend.split("\n");
	var length = csvLines.length;
	for ( var i = 0; i < length; i++) {
		var csvLine = csvLines[i];
		var index = bufferTrackPointsOnTheWayToServer.indexOf(csvLine);
		if(index != -1) {
			// This position (csv line) was successfully sent and can be
			// removed from the send buffer.
		} else {
			// This position (csv line) was found by the browser
			// while the send prossec (server request) was ongoing
			if (tempBuffer != "") {
				tempBuffer += "\n";
			}
			tempBuffer += csvLine;
		}
	}
	*/
	pointsLeft = arrayBufferTrackPointsToSend.length;
	for ( var i = 0; i < pointsLeft; i++) {
		if(! isEmptyString(tempBuffer)) {
			tempBuffer += "\n";
		}
		tempBuffer += arrayBufferTrackPointsToSend[i];
	}
	bufferTrackPointsToSend = tempBuffer;
	addItemToLocalStorage(KEY_BROWSER_BUFFER_TRACK_POINTS_TO_SEND, bufferTrackPointsToSend);
	showPoinstUnsent();
	return pointsLeft;
}

function showPoinstUnsent() {
	var pointsLeft = arrayBufferTrackPointsToSend.length;
	if(pointsLeft > 0) {
		showBuffer("Points unsent " + pointsLeft)
	} else {
		clearMessages();
	}
}

function getLocalDateString(utcTimeStamp) {
	var parsedMilliSeconds = getMilliseconds1970(utcTimeStamp);
	if (parsedMilliSeconds == 0) {
		return '';
	}
	// Get the timezone offset off this browser
	var now = new Date();
	var offset = now.getTimezoneOffset(); // minutes
	var offsetInMilliseconds = offset * 60 * 1000;
	var localTimeMilliseconds = parsedMilliSeconds - offsetInMilliseconds;
	// Get the local time > date
	var dateString = getDateFormatted(localTimeMilliseconds);
	// var debugTimeString = getTimeFormatted(localTimeMilliseconds);
	// 2013-10-11
	return dateString;
}

// Returns a formated date like 2013-10-11
// Date/Time is UTC
function getUTCDateFormatted(milliseconds) {
	var now = new Date(milliseconds);
	var formatedDate = now.getUTCFullYear().toString();
	var s = now.getUTCMonth() + 1;
	formatedDate += "-" + (s <= 9 ? '0' + s : s);
	s = now.getUTCDate();
	formatedDate += "-" + (s <= 9 ? '0' + s : s);
	return formatedDate;
}

// Returns a formated date like 2013-10-11
// Date/Time is UTC
function getUTCTimeFormatted(milliseconds) {
	var now = new Date(milliseconds);
	var formatedDate = now.getUTCFullYear().toString();
	var s = now.getUTCMonth() + 1;
	formatedDate += "-" + (s <= 9 ? '0' + s : s);
	s = now.getUTCDate();
	formatedDate += "-" + (s <= 9 ? '0' + s : s);
	s = now.getUTCHours();
	formatedDate += " " + (s <= 9 ? '0' + s : s);
	s = now.getUTCMinutes();
	formatedDate += ":" + (s <= 9 ? '0' + s : s);
	s = now.getUTCSeconds();
	formatedDate += ":" + (s <= 9 ? '0' + s : s);
	s = now.getUTCMilliseconds();
	if (s <= 9) {
		s = '00' + s;
	} else if (s <= 100) {
		s = '0' + s;
	}
	formatedDate += "." + s;
	return formatedDate;
}

// Returns a formated date like 2013-10-11
// Date/Time is UTC
function getCurrentUTCDateFormatted() {
	var now = new Date();
	var formatedDate = now.getUTCFullYear().toString();
	var s = now.getUTCMonth() + 1;
	formatedDate += "-" + (s <= 9 ? '0' + s : s);
	s = now.getUTCDate();
	formatedDate += "-" + (s <= 9 ? '0' + s : s);
	return formatedDate;
}

// Returns a formated date like 2013-10-11
// Date/Time is UTC
function getTimeFormatted(milliseconds) {
	var now = new Date(milliseconds);
	var formatedDate = now.getFullYear().toString();
	var s = now.getMonth() + 1;
	formatedDate += "-" + (s <= 9 ? '0' + s : s);
	s = now.getDate();
	formatedDate += "-" + (s <= 9 ? '0' + s : s);
	s = now.getHours();
	formatedDate += " " + (s <= 9 ? '0' + s : s);
	s = now.getMinutes();
	formatedDate += ":" + (s <= 9 ? '0' + s : s);
	s = now.getSeconds();
	formatedDate += ":" + (s <= 9 ? '0' + s : s);
	s = now.getMilliseconds();
	if (s <= 9) {
		s = '00' + s;
	} else if (s <= 100) {
		s = '0' + s;
	}
	formatedDate += "." + s;
	return formatedDate;
}
//###################################################################
//-- Main action ----------------------------------------------------
//-- ...to display and share positions ------------------------------
//-------------------------------------------------------------------

/**
 * Single entry point to:
 * - display own position and tracks on the map
 * - display group members on the map
 * - trigger upload of own positions
 * - trigger download of group members (triggerd after by completed upload)
 * 
 * The function is called by different "treads":
 * - browsers geo location update
 * - windows intervall
 * 
 * Why a single entry point?
 * - There are no easy thread save functions in JavaScript as "synchronized" functions in Java.
 *   But this is needed to avoid parallel access (view/write) to the data.
 * - At this single entry point we are able to block the function at the beginning and unblock at the end.
 * - If new own positions from the browser or new positions of group members are blocked to call this function
 *   those positions can be buffered.
 */
function runSynchronizedInputOutput(inputString) {
	if(isEmptyString(inputString)) {
		return;
	}
	// --Do the "parallel" (blocking) stuff--------------------------------------
	if(isInputOutputBlocked) {
		// Wny this "buffer"?
		// - a server response and
		// - a new browser position might come in almost at the same time
		// this solution tries to solve this because we have no easy "synchronize" function in JavaScript
		bufferInput = inputString;
	}
	var internalString = inputString;
	isInputOutputBlocked = true;
	// Display position and tracks
	if(internalString == "") {
		bufferInput = "";
		isInputOutputBlocked = false;
		return true;
	}
	var isNewBrowserGeoPosition = false;
	// --Read the position(s) of the server or browser---------------------------
	var i = internalString.indexOf("[pos");
	if(internalString.indexOf("[pos") != -1) {
		// this is a server response
		displayServerPositionUpdate(internalString);
	} else {
		// this is a new postion from the browser
		isNewBrowserGeoPosition = true;
		readBrowserLocationCsvLine(internalString);
	}
	// --Read the buffer (of a parallel function call)---------------------------
	// Display buffers if any
	if(bufferInput != "") {
		if(bufferInput.indexOf("[pos") != -1) {
			// this is a server response
			displayServerPositionUpdate(bufferInput);
		} else {
			// this is a new postion from the browser
			readBrowserLocationCsvLine(bufferInput);
		}
	}
	// --Release the lock and share----------------------------------------------
	// Share positions: Upload of own positions. The completed upload will call the download.
	if(isNewBrowserGeoPosition) {
		// Upload the new browser location
		// TODO: Thing about!
		//   This is about
		//   - Geo location of the browser and
		//   - window.setIntervall(..)
		//   Are both allowed to run as a background service the the user switches of the
		//   Display on a mobile device.
		// Why to call share() at this place?
		// There would be no need to it if the windows.setIntvall(...) would allways work
		// with any mobile browser. But what if it does not work in some mobile browsers?
		// What if the browser pauses the window.setIntervall(..) for some reasons, may be
		// if the user switches off the display. In this case it might be that the browser
		// did not stop the geo location as well. How knows (the browser implementations).
		// TODO: Think about using the function tryToWakeUpTheGeolocation()
		//   We could also try to let the windows.setIntervall(..) wake up the browser geo
		//   location update in case the windows.setIntervall(..) s still running as background
		//   services (on a mobile) but the the geo location was stopped.
//		share();
	}
	bufferInput = "";
	isInputOutputBlocked = false;	
	return true;
}

/**
 * This tries to wake up the geo location in case:
 * - the geo location does not run as background service but
 * - the windows.setIntervall(..) is running as background service
 */
function tryToWakeUpTheGeolocation() {
	var due = isLocationUpdateAcceptedByTime();
	if(due) {
		restartPositionUpdate();
	} else {
		var x = 2;
		var y = 1; // debug
	}
}

// ###################################################################
// -- Tests ----------------------------------------------------------
// -------------------------------------------------------------------
var isTest = false;
var testTimeout;
var testCounter = 0;
var testsResults = "";
var testExpectedServerResponse = "";
var testHasPassed = true;
var testUserA = "dideldoedelda";
var testPassA = "da";
var testUserB = "dideldoedelde";
var testPassB = "de";
var testUserC = "dideldoedeldu";
var testPassC = "du";
var testGroupA = "jodeldideldoe"
var testGroupC = "jodeldidelda"

function startTests() {
	xhrTimout = xhrTimoutUnitTests;
	testTimeout = xhrTimoutUnitTests + 500;
	isTest = true;
	setValue(KEY_ACCURACY_POSITION, DEFAULT_ACCURACY);
	var url = getDefaultPHP();
	setValue(KEY_SCRIPT_URL, url);
	clearMessages();
	setValue(KEY_DEBUG_MESSAGES, "true");
	addTestResult("Started automated unit tests (many tests depend on the local timezone)");
	runTest();
}

function endTests() {
	clearMessages();
	// Missuse the track info because the xhr messages come later and
	// will overwrite the test result message.
	if (!testHasPassed) {
		showWarning("Tests failed");
	} else {
		showWarning("All " + testCounter + " tests passed");
	}
	// Set back some values
	setDefaultsDisplay();
	setValue(KEY_DEBUG_MESSAGES, "false");
	isTest = false;
	xhrTimout = xhrTimoutDefault;
	var url = getDefaultPHP();
	setValue(KEY_SCRIPT_URL, url);
}

function isStartingWithTests() {
	var parameters = document.location.search;
	if (startsWith('?test', parameters)) {
		return true;
	}
	return false;
}

function addTestResult(message) {
//	if (testsResults != "") {
//		testsResults += "<br/>";
//	}
//	testsResults += getCurrentUTCTimeFormatted() + " " + message;
	var element = document.getElementById('debugMessage')
	if(element) {
		document.getElementById("debugMessage").innerHTML = "Test "
			+ testCounter + " is running...<br/>" + message;
	}
}

function runTest() {
	testCounter += 1;
	testExpectedServerResponse = "filled by tests";
	if (!testHasPassed) {
		endTests();
		return;
	}
	if (testCounter == 1) {
		testTimeStampsForTrack();
	} else if (testCounter == 2) {
		test_setSuccessfullUpload();
	} else if (testCounter == 3) {
		testRemoveUser_A_AtBegin();
	} else if (testCounter == 4) {
		testRemoveUser_B_AtBegin();
	} else if (testCounter == 5) {
		testRemoveUser_C_AtBegin();
	} else if (testCounter == 6) {
		testrunSynchronizedInputOutput();
	} else if (testCounter == 7) {
		testUploadPositionUser();
	} else if (testCounter == 8) {
		testBrowserWritesTrackOver3DayInPast();
	} else if (testCounter == 9) {
		testNewTrack();
	} else if (testCounter == 10) {
		testExternalTrack_2();
	} else if (testCounter == 11) {
		testSwitchToNewUser();
	} else if (testCounter == 12) {
		testSetDownloadedConfiguration();
	} else if (testCounter == 13) {
		testisLocationUpdateAcceptedByAccuracy();
	} else if (testCounter == 14) {
		testRemoveTrack();
	} else if (testCounter == 15) {
		testWrongPassword();
	} else if (testCounter == 16) {
		testServerError();
	} else {
		endTests();
	}
}

function assert() {
	if (testCounter == 1) {
		// not used at the moment
	} else if (testCounter == 2) {
		// Check local storage
		var found = getItemFromlocalStorage(KEY_BROWSER_BUFFER_TRACK_POINTS_TO_SEND);
		if (found != "") {
			testHasPassed = false;
		}
	} else if (testCounter == 6) {
		var count = groupMembers.length;
		if(count != 1) {
			testHasPassed = false;
		}
		var found = getUserAltitude(testUserA);
		if (found != "1.92") {
			testHasPassed = false;
		}
		found = getUserSpeed(testUserA);
		if (found != "2.31") {
			testHasPassed = false;
		}
		found = getUserTime(testUserA);
		var expected = getCurrentUTCDateFormatted() + " 12:30:00.000";
		if (found != expected) {
			testHasPassed = false;
		}
	} else if (testCounter == 7) {
		var count = groupMembers.length;
		if(count != 1) {
			testHasPassed = false;
		}
		var found = getUserAltitude(testUserA);
		if (found != "1.92") {
			testHasPassed = false;
		}
		found = getUserSpeed(testUserA);
		if (found != "2.31") {
			testHasPassed = false;
		}
		found = getUserTime(testUserA);
		var expected = getCurrentUTCDateFormatted() + " 12:30:00.000";
		if (found != expected) {
			testHasPassed = false;
		} else {
			testHasPassed = assertHelperServerResponse();
		}
	} else if (testCounter == 8) {
		var count = groupMembers.length;
		if(count != 2) {
			testHasPassed = false;
		}
		var found = getUserTime(testUserA);
		var expected = getCurrentUTCDateFormatted() + "T12:30:00.000";
		if (found != expected) {
			testHasPassed = false;
		}
		found = getUserTime(testUserB);
		expected = getCurrentUTCDateFormatted() + " 12:50:00.000";
		if (found != expected) {
			testHasPassed = false;
		}
		expected = "lat=54.341;lon=13.502;bearing=;speed=5;altitude=5.91;accuracy=1.51" + ";time=" + getCurrentUTCDateFormatted() + " 12:40:00.000\n"
				+ "lat=54.341;lon=13.503;bearing=;speed=6;altitude=5.91;accuracy=1.51" + ";time=" + getCurrentUTCDateFormatted() + " 12:50:00.000";
		if (bufferTrackPointsToDraw != expected) {
			testHasPassed = false;
		} else {
			testHasPassed = assertHelperServerResponse();
		}
	} else if (testCounter == 9) {
		var expected = "lat=54.342;lon=13.502;bearing=;speed=5;altitude=5.91;accuracy=1.51;time=" + getCurrentUTCDateFormatted() + " 13:40:00.000\n"
				+ "lat=54.341;lon=13.503;bearing=;speed=6;altitude=5.91;accuracy=1.51;time=" + getCurrentUTCDateFormatted() + " 13:50:00.000";
		if (bufferTrackPointsToDraw != expected) {
			testHasPassed = false;
		} else {
			testHasPassed = assertHelperServerResponse();
		}
	} else if (testCounter == 11) {
		// track point buffer
		if (bufferTrackPointsToDraw != "") {
			testHasPassed = false;
		}
		var expected = getValue(KEY_USER);
		if (expected != testUserC) {
			testHasPassed = false;
		}
		var l = groupMembers.length;
		// The 2 existing users on the server. User C has no position yet.
		if (l != 2) {
			testHasPassed = false;
		}
		var found = getUserTrackLat(testUserA);
		if (found != "54.339") {
			testHasPassed = false;
		}
		var found = getUserTrackLon(testUserA);
		if (found != "13.549") {
			testHasPassed = false;
		}
		var found = getUserTrackLat(testUserB);
		if (found != "54.341") {
			testHasPassed = false;
		}
		var found = getUserTrackLon(testUserB);
		if (found != "13.503") {
			testHasPassed = false;
		}
	} else if (testCounter == 12) {
		// track point buffer
		var expected = getValue(KEY_TIMEZONE_OFFSET);
		if (expected != "60") {
			testHasPassed = false;
		}
		var expected = getValue(KEY_EXPIRATION_DAYS);
		if (expected != "200") {
			testHasPassed = false;
		}
		var expected = getValue(KEY_STORE_TRACK);
		if (expected != "false") {
			testHasPassed = false;
		}
	} else if (testCounter == 13) {
		// track point buffer
		var expected = getValue(KEY_ACCURACY_POSITION);
		if (expected != DEFAULT_ACCURACY) {
			testHasPassed = false;
		}
	} else if(testCounter == 14) {
		var found = getUserCountOfTrackpoints(testUserA);
		if(found != 0) {
			testHasPassed = false;
		}
		found = getUserTrackDistance(testUserA);
		if(found != 0) {
			testHasPassed = false;
		}
		found = trackLayers.length;
		expected = 1;
		if(found != 1) {
			testHasPassed = false;
		}
	} else if (testCounter == 15) {
		// track point buffer
		var found = document.getElementById("warning").innerHTML;
		var expected = "!Error: Format of user name OR password no accepted for user " + testUserC + ".";
		if(found != expected) {
			testHasPassed = false;
		} else {
			testHasPassed = assertHelperServerResponse();
		}
	} else if (testCounter == 16) {
		var found = document.getElementById("warning").innerHTML;
		var expected = "Not connected (open failed)";
		if(found != expected) {
			testHasPassed = false;
		}
	} else {
		testHasPassed = assertHelperServerResponse();
	}
	runTest();
}

function assertHelperServerResponse() {
	if (!startsWith(testExpectedServerResponse, xhrLastServerResponse)) {
		return false;
	}
	return true;
}

function assertHelperServerResponseOr() {
	if (testExpectedServerResponse != xhrLastServerResponse && testExpectedServerResponseOr != xhrLastServerResponse) {
		return false;
	}
	return true;
}

function testTimeStampsForTrack() {
	addTestResult("Test no used at the moment)");
	var i = 0;
	while (true) {
		i++;
		if (i == 1) {
			// Not used
		} else if (i == 2) {
			// Not used
		} else {
			break;
		}
	}
	assert();
}

function test_setSuccessfullUpload() {
	addTestResult("Send buffer for track points");
	bufferTrackPointsOnTheWayToServer = "";
	bufferTrackPointsToSend = "";
	var i = 0;
	while (true) {
		i++;
		if (i == 1) {
			setValue(KEY_STORE_TRACK, "true");
			addGeoLocationToSendBuffer("");
			setSuccessfullUpload();
			if (bufferTrackPointsToSend != "") {
				break;
			}
		} else if (i == 2) {
			setValue(KEY_STORE_TRACK, "false");
			addGeoLocationToSendBuffer("");
			setSuccessfullUpload();
			if (bufferTrackPointsToSend != "") {
				break;
			}
		}  else if (i == 3) {
			setValue(KEY_STORE_TRACK, "true");
			addGeoLocationToSendBuffer("aa");
			addGeoLocationToSendBuffer("bb");
			if (bufferTrackPointsToSend != "aa\nbb") {
				break;
			}
			setValue(KEY_STORE_TRACK, "false");
			addGeoLocationToSendBuffer("ee");
			if (bufferTrackPointsToSend != "aa\nee") {
				break;
			}
			var found = getItemFromlocalStorage(KEY_BROWSER_BUFFER_TRACK_POINTS_TO_SEND);
			if (found != "aa\nee") {
				break;
			}
			// Nothing was send (might this ever happen? Who knows.)
			// bufferTrackPointsOnTheWayToServer = "";
			setSuccessfullUpload();
			if (bufferTrackPointsToSend != "ee") {
				break;
			}
			// Send completed but buffer got new lines while sending
			// bufferTrackPointsOnTheWayToServer = "ee";
			addGeoLocationToSendBuffer("dd");
			setSuccessfullUpload();
			if (bufferTrackPointsToSend != "") {
				break;
			}
		}  else if (i == 4) {
			setValue(KEY_STORE_TRACK, "true");
			addGeoLocationToSendBuffer("aa");
			addGeoLocationToSendBuffer("bb");
			if (bufferTrackPointsToSend != "aa\nbb") {
				break;
			}
			setSuccessfullUpload();
			if (bufferTrackPointsToSend != "bb") {
				break;
			}
			// Send completed but buffer got new lines while sending
			addGeoLocationToSendBuffer("xx");
			setSuccessfullUpload();
			if (bufferTrackPointsToSend != "xx") {
				break;
			}
			setSuccessfullUpload();
			if (bufferTrackPointsToSend != "") {
				break;
			}
		} else {
			break;
		}
	}
	assert();
}

function testRemoveUser_A_AtBegin() {
	addTestResult("Remove test user 1 " + testUserA + " from server");
	setValue(KEY_USER, testUserA);
	setValue(KEY_PASS, testPassA);
	setValue(KEY_GROUP, testGroupA);
	setValue(KEY_INTERVALL_SERVER, 'never');
	testExpectedServerResponse = "Ok, removed user";
	removeUser();
	setTimeout(assert, testTimeout);
}

function testRemoveUser_B_AtBegin() {
	addTestResult("Remove test user 2 " + testUserB + " from server");
	setValue(KEY_USER, testUserB);
	setValue(KEY_PASS, testPassB);
	setValue(KEY_GROUP, testGroupA);
	testExpectedServerResponse = "Ok, removed user";
	removeUser();
	setTimeout(assert, testTimeout);
}

function testRemoveUser_C_AtBegin() {
	addTestResult("Remove test users " + testUserC + " from server");
	setValue(KEY_USER, testUserC);
	setValue(KEY_PASS, testPassC);
	testExpectedServerResponse = "Ok, removed user";
	removeUser();
	setTimeout(assert, testTimeout);
}

function testrunSynchronizedInputOutput() {
	addTestResult("1st user: browser finds 2 positions (do not store track)");
	clearPositionsTracksAndUsers();
	setValue(KEY_USER, testUserA);
	setValue(KEY_PASS, testPassA);
	setValue(KEY_GROUP, testGroupA);
	setValue(KEY_SHOW_DETAILS, "false");
	setValue(KEY_STORE_TRACK, "false");
	// focusedUser = testUserA;
	var csvLine = "lat=54.329;lon=13.491;bearing=;speed=1.31;altitude=1.41;accuracy=1.51";
	csvLine += ";time=" + getCurrentUTCDateFormatted() + " 12:20:00.000";
	runSynchronizedInputOutput(csvLine);
	csvLine = "lat=54.328;lon=13.491;bearing=;speed=2.31;altitude=1.92;accuracy=1.51";
	csvLine += ";time=" + getCurrentUTCDateFormatted() + " 12:30:00.000";
	runSynchronizedInputOutput(csvLine);
	assert();
}

function testUploadPositionUser() {
	addTestResult("1st user: > send previous positions");
	// The own postion is not returned be the server
	testExpectedServerResponse = ""
	// This is what the windows startSharing() will do
	xhrUploadPositions();
	setTimeout(assert, testTimeout);
}

function testBrowserWritesTrackOver3DayInPast() {
	addTestResult("2nd user: Way points in the past and today > send");
	// This will remove all suer data.
	// Why? Make sure the browser downloads all data completely from the server
	// as result of the next test.
	clearPositionsTracksAndUsers();
	setValue(KEY_USER, testUserB);
	setValue(KEY_PASS, testPassB);
	setValue(KEY_GROUP, testGroupA);
//	setValue(KEY_SHOW_DETAILS, "true");
	setValue(KEY_STORE_TRACK, "true");
	// focusedUser = testUserB;
	// 2 track points day 1 in the past. Both points will be ignored because the are not today.
	var csvLine1 = "lat=54.341;lon=13.5;bearing=;speed=3.31;altitude=3.91;accuracy=1.51"
			+ ";time=2013-10-10 10:00:00.000";
	runSynchronizedInputOutput(csvLine1);
	var csvLine2 = "lat=54.342;lon=13.5;bearing=;speed=.31;altitude=3.91;accuracy=1.51"
			+ ";time=2013-10-10 11:00:00.000";
	runSynchronizedInputOutput(csvLine2);
	// 2 track points day 2 in the past. Both points will be ignored because the are not today.
	var csvLine3 = "lat=54.342;lon=13.501;bearing=;speed=3.31;altitude=3.91;accuracy=1.51"
			+ ";time=2013-10-11 10:00:00.000";
	runSynchronizedInputOutput(csvLine3);
	var csvLine4 = "lat=54.343;lon=13.501;bearing=;speed=3.31;altitude=3.91;accuracy=1.51"
			+ ";time=2013-10-11 11:00:00.000";
	runSynchronizedInputOutput(csvLine4);
	// 2 track points today.
	var csvLine5 = "lat=54.341;lon=13.502;bearing=;speed=5;altitude=5.91;accuracy=1.51"
		+ ";time=" + getCurrentUTCDateFormatted() + " 12:40:00.000";
	runSynchronizedInputOutput(csvLine5);
	var csvLine6 = "lat=54.341;lon=13.503;bearing=;speed=6;altitude=5.91;accuracy=1.51"
			+ ";time=" + getCurrentUTCDateFormatted() + " 12:50:00.000";
	runSynchronizedInputOutput(csvLine6);
	testExpectedServerResponse = "[positions]\n"
		+ "user=dideldoedelda;lat=54.328;lon=13.491;bearing=;speed=2.31;altitude=1.92;accuracy=1.51;time=" + getCurrentUTCDateFormatted() + "T12:30:00.000";
	// This will upload the track that stretches over more than one day in the past.
	// This is what the windows startSharing() will do
	xhrUploadPositions();
	setTimeout(assert, testTimeout);
}

function testNewTrack() {
	addTestResult("2nd user: Way points today > send");
	// Simulate to press "Track" to start a new track
	pressStartTrack();
	// 2 track points today
	var csvLine1 = "lat=54.342;lon=13.502;bearing=;speed=5;altitude=5.91;accuracy=1.51"
			+ ";time=" + getCurrentUTCDateFormatted() + " 13:40:00.000";
	runSynchronizedInputOutput(csvLine1);
	var csvLine2 = "lat=54.341;lon=13.503;bearing=;speed=6;altitude=5.91;accuracy=1.51"
			+ ";time=" + getCurrentUTCDateFormatted() + " 13:50:00.000";
	runSynchronizedInputOutput(csvLine2);
	testExpectedServerResponse = "[positions]\n"
		+ "user=dideldoedelda;lat=54.328;lon=13.491;bearing=;speed=2.31;altitude=1.92;accuracy=1.51;time=" + getCurrentUTCDateFormatted() + "T12:30:00.000";
	// This is what the windows startSharing() will do
	xhrUploadPositions();
	setTimeout(assert, testTimeout);
}

function testExternalTrack_2() {
	addTestResult("1st user: External app writes way points");
	var userParams = "user=" + testUserA + "&pass=" + testPassA
			+ "&track=true&positions=";
	var csvLine1 = "lat=54.34;lon=13.549;bearing=;speed=10;altitude=7.91;accuracy=1.51"
			+ ";time=" + getCurrentUTCDateFormatted() + " 12:40:00.000";
	var csvLine2 = "lat=54.339;lon=13.549;bearing=;speed=10;altitude=7.91;accuracy=1.51"
			+ ";time=" + getCurrentUTCDateFormatted() + " 12:50:00.000";
	var params = userParams + csvLine1 + "\n" + csvLine2;
	// Send as "external app". This waits for the response
	xhrJustPostForTests(params);
	testExpectedServerResponse = "Ok, server wrote positions for user";
	setTimeout(assert, testTimeout);
}

function testSwitchToNewUser() {
	addTestResult("Switch to a (3rd) new user with no data on the server");
	setValue(KEY_USER, testUserC);
	setValue(KEY_PASS, testPassC);
	// The group has already two user. Their positions are downloaded and
	// can be asserted
	setValue(KEY_GROUP, testGroupA);
	clearPositionsTracksAndUsers();
	startAppForTest();
	// testExpectedServerResponse = "";
	setTimeout(assert, testTimeout);
}

function testSetDownloadedConfiguration() {
	addTestResult("Set values from configuration text (downloaded in real life)");
	var testConfig = KEY_TIMEZONE_OFFSET + " = 60\n\n" + KEY_EXPIRATION_DAYS
			+ " = 200\n yes \n" + KEY_STORE_TRACK + "=false";
	setDownloadedConfiguration(testConfig);
	assert();
}

function testisLocationUpdateAcceptedByAccuracy() {
	addTestResult("Accuracy of positions");
	setValue(KEY_ACCURACY_POSITION, "100");
	var i = 0;
	while (true) {
		i++;
		if (i == 1) {
			var accepted = isLocationUpdateAcceptedByAccuracy(99);
			if (!accepted) {
				break;
			}
		} else if (i == 2) {
			var accepted = isLocationUpdateAcceptedByAccuracy(100);
			if (!accepted) {
				break;
			}
		} else if (i == 3) {
			var accepted = isLocationUpdateAcceptedByAccuracy(101);
			if (accepted) {
				break;
			}
			setValue(KEY_ACCURACY_POSITION, DEFAULT_ACCURACY);
		} else {
			break;
		}
	}
	assert();
}

function testWrongPassword() {
	addTestResult("Wrong password used");
	setValue(KEY_USER, testUserC);
	setValue(KEY_PASS, "wrongpassword");
	testExpectedServerResponse = "!Error: Format of user name OR password no accepted for user " + testUserC;
//	showNewUser();
	startAppForTest();
	setTimeout(assert, testTimeout);
}

function testRemoveTrack() {
	addTestResult("Remove track of 1st user");
	setValue(KEY_USER, testUserC);
	setValue(KEY_PASS, testPassC);
	getDefaultPHP();
	setValue(KEY_SCRIPT_URL, getDefaultPHP());
	removeTrack(testUserA);
	assert();
}

function testServerError() {
	addTestResult("Server error");
	setValue(KEY_USER, testUserC);
	setValue(KEY_PASS, testPassC);
	setValue(KEY_SCRIPT_URL, "hxxp://notexisting.org/");
//	showNewUser();
	startAppForTest();
	setTimeout(assert, testTimeout);
}