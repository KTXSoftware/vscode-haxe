package haxe;

import js.node.Fs;
import js.node.Path;
import platform.Platform;

typedef HaxeConfigurationObject = {
    haxePath:String,
    haxelibPath:String,
    haxeDefaultBuildFile:String,
    haxeServerHost:String,
    haxeServerPort:Int,
    haxeDiagnosticDelay:Int,
    ?haxeExec:String, // filled at runtime
    ?haxelibExec:String // filled at runtime
};

class HaxeConfiguration {    
    public static function addTrailingSep(path:String, platform:Platform) {
        if (path=="") return path;
        path = path.split(platform.reversePathSeparator).join(platform.pathSeparator);
        if (path.charAt(path.length-1) != platform.pathSeparator) path += platform.reversePathSeparator; 
        return path;
    }
    public static function update(conf:HaxeConfigurationObject, platform:Platform) {
        var exec = "haxe" + platform.executableExtension;
        var tmp = addTrailingSep(conf.haxePath, platform);
        conf.haxePath = tmp;
        conf.haxeExec = tmp + exec;
        tmp = addTrailingSep(conf.haxelibPath, platform);
        conf.haxelibPath = tmp;
        return conf;
    }
    public static function findHaxeExec(conf:HaxeConfigurationObject, projectDir:String, platform:Platform):String {
        var localPath = Path.join(projectDir, "Kha", "Tools", "Haxe");
        try {
            if (Fs.statSync(localPath).isDirectory()) {
                var exec = "haxe" + platform.executableExtension;
                var tmp = addTrailingSep(localPath, platform);
                return tmp + exec;
            }
        }
        catch (error: Dynamic) {

        }
        return conf.haxeExec;
    }
}