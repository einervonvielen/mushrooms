# Find your friends on a map

...share your geo-location with friends. How?

test screenshot

![mushrooms](doc/mushrooms.jpg)

    Open http://jfellow.net/geo5/
    Press "You", then enter your username, password and group. Use the same group name as your friends!

That's it.
Now your friends see you and you see your friends.

http://jfellow.net/geo5/ is a test server. You can download and run this service on your own server. It's open source.

It was never easier to share your position with friends.
- Build groups, all group members see each other automatically.
- No registration, no installation, no spyware.
- Advanced: Tracks, routing (planned).

# Why to use this software?

It's about privacy. Reclaim the internet from authorities and companies!

Why not using Google+ to share your position?
It's centralized and all is recorded for good in big databases.

Mushrooms runs on your own server. You are in control of the service and your data.

There are no backdoors. You can check the code.
And its free.

# How...to install?

    Make sure you have a php enabled webserver, let's name it http://example.com/
    Copy geo5.zip on your server and unzip to http://example.com/geo5/.
    Test it! Open http://example.com/geo5/ in a browser (not IE).
    Expected Result: You should see a map with a marker.

# How...to use?

Make sure the server is running somewhere as described above.
Alternatively you can use this test server: http://jfellow.net/geo5/


## OSMand as Sender

    Download and install OSMand on your Android device.
    As online tracking URL use http://jfellow.net/geo5/geo5.php?lat={0}&lon={1}&time={2}&speed={5}&altitude={4}&user=you&pass=secret&group=yourgroup&storeTrack=true
    Start the tracking.
    Don't forget to activate: online tracking and sleep mode
    Expected result: OSMand will start to send its geo location to the server.
    View the position and track in the browser.

## Another (second) Browser as Sender

You can even use the address bar of a browser to send your position:
http://jfellow.net/geo5/geo5.php?user=you&pass=secret&group=yourgroup&lat=48.1375&lon=11.5755&speed=50&altitude=530.75&accuracy=18&time=1378655632757&storeTrack=false
Of course you can draw a track if you use "storeTrack=true".
How...to get involved?

Please help by contributing ideas, bug fixes and modifications. Fun is guaranteed.

    