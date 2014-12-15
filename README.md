README
====================

Build instructions
---------------------

`../platforms/android/cordova/build --release`

`jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 Duration-release-unsigned.apk -keystore oneself.keystore duration`

`$ANDROID_SDK/build-tools/20.0.0/zipalign -v 4 Duration-release-unsigned.apk Duration-release-signed-aligned.apk`
