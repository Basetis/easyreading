cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "id": "com.jcesarmobile.filepicker.FilePicker",
        "file": "plugins/com.jcesarmobile.filepicker/www/FilePicker.js",
        "pluginId": "com.jcesarmobile.filepicker",
        "clobbers": [
            "FilePicker"
        ]
    },
    {
        "id": "cordova-plugin-filepath.FilePath",
        "file": "plugins/cordova-plugin-filepath/www/FilePath.js",
        "pluginId": "cordova-plugin-filepath",
        "clobbers": [
            "window.FilePath"
        ]
    },
    {
        "id": "cordova-plugin-splashscreen.SplashScreen",
        "file": "plugins/cordova-plugin-splashscreen/www/splashscreen.js",
        "pluginId": "cordova-plugin-splashscreen",
        "clobbers": [
            "navigator.splashscreen"
        ]
    },
    {
        "id": "cordova-plugin-statusbar.statusbar",
        "file": "plugins/cordova-plugin-statusbar/www/statusbar.js",
        "pluginId": "cordova-plugin-statusbar",
        "clobbers": [
            "window.StatusBar"
        ]
    },
    {
        "id": "com.megster.cordova.FileChooser.FileChooser",
        "file": "plugins/com.megster.cordova.FileChooser/www/fileChooser.js",
        "pluginId": "com.megster.cordova.FileChooser",
        "clobbers": [
            "fileChooser"
        ]
    },
    {
        "id": "com.verso.cordova.clipboard.Clipboard",
        "file": "plugins/com.verso.cordova.clipboard/www/clipboard.js",
        "pluginId": "com.verso.cordova.clipboard",
        "clobbers": [
            "cordova.plugins.clipboard"
        ]
    },
    {
        "id": "cordova-plugin-device.device",
        "file": "plugins/cordova-plugin-device/www/device.js",
        "pluginId": "cordova-plugin-device",
        "clobbers": [
            "device"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "cordova-plugin-whitelist": "1.3.0",
    "com.jcesarmobile.filepicker": "1.1.1",
    "cordova-plugin-filepath": "1.0.2",
    "cordova-plugin-splashscreen": "4.0.0",
    "cordova-plugin-statusbar": "2.2.0",
    "com.megster.cordova.FileChooser": "0.0.0",
    "com.verso.cordova.clipboard": "0.1.0",
    "cordova-plugin-device": "1.1.3"
};
// BOTTOM OF METADATA
});