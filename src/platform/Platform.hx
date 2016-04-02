package platform;

class Platform {
    public static var instance(default, null):Platform;

    public var pathSeparator:String;
    public var reversePathSeparator:String;
    public var executableExtension:String;
    public var executableExtensionK:String;
    public var isWin:Bool;

    function new() {
    }

    public static function init(platformName:String, archName:String) {
        if (instance == null) instance = new Platform();
        if (platformName=="win32") {
            instance.pathSeparator = "\\";
            instance.reversePathSeparator = "/";
            instance.executableExtension = ".exe";
            instance.executableExtensionK = ".exe";
            instance.isWin = true;
        } else {
            instance.pathSeparator = "/";
            instance.reversePathSeparator = "\\";
            instance.executableExtension = "";
            instance.isWin = false;
            if (platformName=="linux") {
                if (archName=="x64") {
                    instance.executableExtensionK = "-linux64";
                } else {
                instance.executableExtensionK = "-linux32";
                }
            } else {
                instance.executableExtensionK = "-osx";
            }
        }
        return instance;
    }
}