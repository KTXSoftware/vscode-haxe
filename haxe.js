// Generated by Haxe
(function ($hx_exports) { "use strict";
var $estr = function() { return js_Boot.__string_rec(this,''); };
function $extend(from, fields) {
	function Inherit() {} Inherit.prototype = from; var proto = new Inherit();
	for (var name in fields) proto[name] = fields[name];
	if( fields.toString !== Object.prototype.toString ) proto.toString = fields.toString;
	return proto;
}
var EReg = function(r,opt) {
	opt = opt.split("u").join("");
	this.r = new RegExp(r,opt);
};
EReg.__name__ = true;
EReg.prototype = {
	match: function(s) {
		if(this.r.global) this.r.lastIndex = 0;
		this.r.m = this.r.exec(s);
		this.r.s = s;
		return this.r.m != null;
	}
	,matched: function(n) {
		if(this.r.m != null && n >= 0 && n < this.r.m.length) return this.r.m[n]; else throw new js__$Boot_HaxeError("EReg::matched");
	}
};
var HaxeContext = function(context) {
	this.context = context;
	platform_Platform.init(process.platform);
	this.configuration = Vscode.workspace.getConfiguration("haxe");
	haxe_HaxeConfiguration.update(this.configuration,platform_Platform.instance);
	this.diagnostics = Vscode.languages.createDiagnosticCollection("haxe");
	context.subscriptions.push(this.diagnostics);
	this.server = new features_CompletionServer(this,Vscode.workspace.rootPath);
	this.handler = new features_CompletionHandler(this);
	context.subscriptions.push(this);
};
HaxeContext.__name__ = true;
HaxeContext.prototype = {
	dispose: function() {
		Vscode.window.showInformationMessage("Got dispose!");
		if(this.server.isServerAvailable && this.server.isPatchAvailable) {
			var client = this.server.client;
			client.clear();
			var cl = client.cmdLine;
			var _g = 0;
			var _g1 = Vscode.window.visibleTextEditors;
			while(_g < _g1.length) {
				var editor = _g1[_g];
				++_g;
				cl.beginPatch(editor.document.uri.fsPath).remove();
			}
			client.sendAll(null);
		}
		return null;
	}
	,applyDiagnostics: function(message) {
		var all = new haxe_ds_StringMap();
		var _g = 0;
		var _g1 = message.infos;
		while(_g < _g1.length) {
			var info = _g1[_g];
			++_g;
			var diags = all.get(info.fileName);
			if(diags == null) {
				diags = [];
				all.set(info.fileName,diags);
			}
			var diag = new Vscode.Diagnostic(Tool.toVSCRange(info),info.message,Tool.toVSCSeverity(message.severity));
			diags.push(diag);
		}
		var ps = platform_Platform.instance.pathSeparator;
		var $it0 = all.keys();
		while( $it0.hasNext() ) {
			var fileName = $it0.next();
			var diags1;
			diags1 = __map_reserved[fileName] != null?all.getReserved(fileName):all.h[fileName];
			var tmp = fileName.split(ps);
			var paths = [];
			var _g2 = 0;
			while(_g2 < tmp.length) {
				var s = tmp[_g2];
				++_g2;
				switch(s) {
				case ".":
					continue;
					break;
				case "..":
					paths.pop();
					break;
				default:
					paths.push(s);
				}
			}
			fileName = paths.join(ps);
			var url = Vscode.Uri.file(fileName);
			if(diags1 == null) {
				this.diagnostics.set(url,[]);
				continue;
			}
			this.diagnostics.set(url,diags1);
		}
	}
};
var HxOverrides = function() { };
HxOverrides.__name__ = true;
HxOverrides.cca = function(s,index) {
	var x = s.charCodeAt(index);
	if(x != x) return undefined;
	return x;
};
HxOverrides.substr = function(s,pos,len) {
	if(len == null) len = s.length; else if(len < 0) {
		if(pos == 0) len = s.length + len; else return "";
	}
	return s.substr(pos,len);
};
HxOverrides.iter = function(a) {
	return { cur : 0, arr : a, hasNext : function() {
		return this.cur < this.arr.length;
	}, next : function() {
		return this.arr[this.cur++];
	}};
};
var Main = function() { };
Main.__name__ = true;
Main.main = $hx_exports["activate"] = function(context) {
	new HaxeContext(context);
};
Main.test_register_command = function(context) {
	var disposable = Vscode.commands.registerCommand("haxe.hello",function() {
		Vscode.window.showInformationMessage("Hello from haxe!");
	});
	context.subscriptions.push(disposable);
};
Main.test_register_hover = function(context) {
	var disposable = Vscode.languages.registerHoverProvider("haxe",{ provideHover : function(document,position,cancelToken) {
		return new Vscode.Hover("I am a hover! pos: " + JSON.stringify(position));
	}});
	context.subscriptions.push(disposable);
};
Main.test_register_hover_thenable = function(context) {
	var disposable = Vscode.languages.registerHoverProvider("haxe",{ provideHover : function(document,position,cancelToken) {
		var s = JSON.stringify(position);
		return new Promise(function(resolve) {
			var h = new Vscode.Hover("I am a thenable hover! pos: " + s);
			resolve(h);
		});
	}});
	context.subscriptions.push(disposable);
};
Math.__name__ = true;
var Socket = function() {
	this.s = new js_node_net_Socket();
	this.reset();
};
Socket.__name__ = true;
Socket.prototype = {
	reset: function() {
		this.datas = [];
		this.isConnected = false;
		this.isClosed = false;
		this.error = null;
	}
	,onConnect: function(callback) {
		if(callback != null) callback(this);
	}
	,onError: function(err,callback) {
		if(callback != null) callback(this,err);
	}
	,onData: function(data,callback) {
		data = data.toString();
		this.datas.push(data);
		if(callback != null) callback(this,data);
	}
	,onClose: function(callback) {
		this.isConnected = false;
		this.isClosed = true;
		if(callback != null) callback(this);
	}
	,connect: function(host,port,onConnect,onData,onError,onClose) {
		var _g = this;
		this.error = null;
		this.s.on("error",function(err) {
			_g.error = err;
			_g.onError(err,onError);
		});
		this.s.on("data",function(data) {
			_g.onData(data,onData);
		});
		this.s.on("close",function() {
			_g.onClose(onClose);
		});
		this.s.connect(port,host,function() {
			_g.isConnected = true;
			_g.onConnect(onConnect);
		});
	}
	,write: function(text) {
		return this.s.write(text);
	}
	,readAll: function() {
		return this.s.read();
	}
};
var Std = function() { };
Std.__name__ = true;
Std.parseInt = function(x) {
	var v = parseInt(x,10);
	if(v == 0 && (HxOverrides.cca(x,1) == 120 || HxOverrides.cca(x,1) == 88)) v = parseInt(x);
	if(isNaN(v)) return null;
	return v;
};
var Tool = function() { };
Tool.__name__ = true;
Tool.displayAsInfo = function(s) {
	Vscode.window.showInformationMessage(s);
};
Tool.displayAsError = function(s) {
	Vscode.window.showErrorMessage(s);
};
Tool.displayAsWarning = function(s) {
	Vscode.window.showWarningMessage(s);
};
Tool.byteLength = function(str) {
	return js_node_buffer_Buffer.byteLength(str);
};
Tool.byte_pos = function(text,char_pos) {
	if(char_pos == text.length) return js_node_buffer_Buffer.byteLength(text); else return Tool.byteLength(HxOverrides.substr(text,0,char_pos));
};
Tool.toVSCSeverity = function(s) {
	switch(s) {
	case 0:
		return Vscode.DiagnosticSeverity.Hint;
	case 1:
		return Vscode.DiagnosticSeverity.Warning;
	case 2:
		return Vscode.DiagnosticSeverity.Error;
	}
};
Tool.toVSCRange = function(info) {
	var r = info.range;
	if(r.isLineRange) return new Vscode.Range(new Vscode.Position(r.start - 1,0),new Vscode.Position(r.end - 1,0)); else return new Vscode.Range(new Vscode.Position(info.lineNumber - 1,r.start),new Vscode.Position(info.lineNumber - 1,r.end));
};
var Debouncer = function(delay_ms,fn) {
	this.last = 0;
	this.queue = [];
	this.onDone = [];
	this.timer = null;
	this.delay = delay_ms;
	this.fn = fn;
};
Debouncer.__name__ = true;
Debouncer.prototype = {
	apply: function() {
		if(this.timer != null) this.timer.stop();
		this.timer = null;
		var q = this.queue;
		var od = this.onDone;
		this.queue = [];
		this.onDone = [];
		this.fn(q);
		var _g = 0;
		while(_g < od.length) {
			var f = od[_g];
			++_g;
			f();
		}
	}
	,debounce: function(e) {
		this.queue.push(e);
		if(this.timer != null) this.timer.stop();
		this.timer = haxe_Timer.delay($bind(this,this.apply),this.delay);
	}
	,whenDone: function(f) {
		if(this.queue.length == 0) f(); else this.onDone.push(f);
	}
};
var Vscode = require("vscode");
var CompletionItemProvider = function() { };
CompletionItemProvider.__name__ = true;
var features_CompletionHandler = function(hxContext) {
	this.hxContext = hxContext;
	var context = hxContext.context;
	this.lastModifications = new haxe_ds_StringMap();
	var disposable = Vscode.languages.registerCompletionItemProvider("haxe",this,".");
	context.subscriptions.push(disposable);
	this.changeDebouncer = new Debouncer(250,$bind(this,this.changePatchs));
	context.subscriptions.push(Vscode.workspace.onDidOpenTextDocument($bind(this,this.removePatch)));
	context.subscriptions.push(Vscode.workspace.onDidSaveTextDocument($bind(this,this.removePatch)));
	context.subscriptions.push(Vscode.workspace.onDidCloseTextDocument($bind(this,this.removePatch)));
	context.subscriptions.push(Vscode.workspace.onDidChangeTextDocument($bind(this,this.changePatch)));
};
features_CompletionHandler.__name__ = true;
features_CompletionHandler.__interfaces__ = [CompletionItemProvider];
features_CompletionHandler.prototype = {
	removePatch: function(document) {
		var server = this.hxContext.server;
		var path = document.uri.fsPath;
		this.lastModifications.remove(path);
		if(server.isPatchAvailable) {
			var client = new haxe_HaxeClient("127.0.0.1",server.hxContext.configuration.haxeServerPort);
			client.cmdLine.beginPatch(path).remove();
			client.sendAll(null);
			this.hxContext.diagnostics["delete"](document.uri);
		}
	}
	,changePatchs: function(events) {
		var _g = this;
		var server = this.hxContext.server;
		var client = new haxe_HaxeClient("127.0.0.1",server.hxContext.configuration.haxeServerPort);
		var cl = client.cmdLine.cwd(server.proj_dir);
		var done = new haxe_ds_StringMap();
		var changed = false;
		var _g1 = 0;
		while(_g1 < events.length) {
			var event = events[_g1];
			++_g1;
			var changes = event.contentChanges;
			if(changes.length == 0) continue;
			var editor = Vscode.window.activeTextEditor;
			var document = event.document;
			var path = document.uri.fsPath;
			var len = path.length;
			if(document.languageId != "haxe") continue;
			var text = document.getText();
			var patcher = cl.beginPatch(path);
			if(!server.isServerAvailable) {
				if(__map_reserved[path] != null?done.getReserved(path):done.h[path]) continue;
				if(__map_reserved[path] != null) done.setReserved(path,true); else done.h[path] = true;
				var bl = js_node_buffer_Buffer.byteLength(text);
				if(document.isDirty) patcher["delete"](0,-1).insert(0,bl,text); else patcher.remove();
				changed = true;
			} else if(server.isPatchAvailable) {
				var _g11 = 0;
				while(_g11 < changes.length) {
					var change = changes[_g11];
					++_g11;
					var rl = change.rangeLength;
					var range = change.range;
					var rs = document.offsetAt(range.start);
					if(rl > 0) patcher["delete"](rs,rl,"c");
					var text1 = change.text;
					if(text1 != "") patcher.insert(rs,text1.length,text1,"c");
				}
				var pos = 0;
				if(editor != null) {
					if(editor.document == document) pos = Tool.byte_pos(text,document.offsetAt(editor.selection.active)); else pos = js_node_buffer_Buffer.byteLength(text);
				} else pos = js_node_buffer_Buffer.byteLength(text);
				changed = true;
			}
		}
		if(changed) client.sendAll(function(s,message,error) {
			if(error == null) _g.hxContext.applyDiagnostics(message);
		});
	}
	,changePatch: function(event) {
		var document = event.document;
		var path = document.uri.fsPath;
		if(event.contentChanges.length == 0) {
			this.lastModifications.remove(path);
			return;
		}
		var value = new Date().getTime();
		this.lastModifications.set(path,value);
		this.changeDebouncer.debounce(event);
	}
	,provideCompletionItems: function(document,position,cancelToken) {
		var _g = this;
		var server = this.hxContext.server;
		var line = document.lineAt(position);
		var dot_offset = 0;
		console.log(document);
		console.log(position);
		console.log(line);
		console.log(cancelToken);
		var text = document.getText();
		var char_pos = document.offsetAt(position) + dot_offset;
		var path = document.uri.fsPath;
		var lm = this.lastModifications.get(path);
		this.lastModifications.set(path,null);
		var makeCall = false;
		var displayMode = haxe_DisplayMode.Default;
		if(lm == null) makeCall = true; else {
			var ct = new Date().getTime();
			var dlt = ct - lm;
			console.log(dlt);
			if(dlt < 200) makeCall = text.charAt(char_pos - 1) == "."; else makeCall = true;
		}
		if(!makeCall) return new Promise(function(resolve) {
			resolve([]);
		});
		var isDot = text.charAt(char_pos - 1) == ".";
		if(!isDot) displayMode = haxe_DisplayMode.Position;
		var byte_pos;
		if(char_pos == text.length) byte_pos = js_node_buffer_Buffer.byteLength(text); else byte_pos = Tool.byteLength(HxOverrides.substr(text,0,char_pos));
		return new Promise(function(resolve1) {
			var make_request = function() {
				server.request(path,byte_pos,displayMode,function(items) {
					resolve1(items);
				});
			};
			var isDirty = document.isDirty;
			var client = server.client;
			var doRequest = function() {
				if(server.isPatchAvailable) _g.changeDebouncer.whenDone(make_request); else if(isDirty && server.isServerAvailable) document.save().then(make_request); else make_request();
			};
			if(!server.isServerAvailable) {
				var hs = new haxe_HaxeClient("127.0.0.1",server.hxContext.configuration.haxeServerPort);
				var cl = hs.cmdLine;
				var patcher = cl.beginPatch(path);
				if(isDirty) {
					var text1 = document.getText();
					patcher["delete"](0,-1).insert(0,js_node_buffer_Buffer.byteLength(text1),text1);
				} else patcher.remove();
				server.isPatchAvailable = false;
				cl.version();
				hs.sendAll(function(s,message,err) {
					var isPatchAvailable = false;
					var isServerAvailable = true;
					if(err != null) isServerAvailable = false; else {
						server.isServerAvailable = true;
						if(message.severity == 2) isPatchAvailable = haxe_HaxeClient.isOptionExists("--patch",message.stderr[0]); else isPatchAvailable = true;
					}
					server.isServerAvailable = err == null;
					server.isPatchAvailable = isPatchAvailable;
					doRequest();
				});
			} else doRequest();
		});
	}
	,resolveCompletionItem: function(item,cancelToken) {
		return item;
	}
};
var features_CompletionServer = function(hxContext,proj_dir) {
	var _g = this;
	this.hxContext = hxContext;
	this.proj_dir = proj_dir;
	this.isServerAvailable = false;
	this.isPatchAvailable = false;
	this.client = new haxe_HaxeClient("127.0.0.1",this.hxContext.configuration.haxeServerPort);
	this.client.isPatchAvailable(function(data) {
		_g.isPatchAvailable = data.isOptionAvailable;
		_g.isServerAvailable = data.isServerAvailable;
	});
};
features_CompletionServer.__name__ = true;
features_CompletionServer.prototype = {
	make_client: function() {
		return new haxe_HaxeClient("127.0.0.1",this.hxContext.configuration.haxeServerPort);
	}
	,parse_items: function(data) {
		var rtn = [];
		if(data.severity == 2) {
			this.hxContext.applyDiagnostics(data);
			return rtn;
		}
		var data_str = data.stderr.join("\n");
		
                  // Hack hack hack
                  var items = data_str.split("<i n=");
                  for (var i=0; i<items.length; i++) {
                    var item = items[i];
                    if (item.indexOf("\"")==0) {
                      var name = item.match(/"(.*?)"/)[1];
                      var type = item.match(/<t>(.*?)<\/t>/)[1];
                      type = type.replace(/&gt;/g, ">");
                      type = type.replace(/&lt;/g, "<");
                      //Vscode.window.showInformationMessage(name+" : "+type);
                      var ci = new Vscode.CompletionItem(name);
                      ci.detail = type;
                      if (type.indexOf("->")>=0) {
                        ci.kind = Vscode.CompletionItemKind.Method;
                      } else {
                        ci.kind = Vscode.CompletionItemKind.Property;
                      }
                      rtn.push(ci);
                    }
                  }
        ;
		return rtn;
	}
	,request: function(file,byte_pos,mode,callback) {
		var _g = this;
		var cl = this.client.cmdLine;
		cl.cwd(this.proj_dir).hxml(this.hxContext.configuration.haxeDefaultBuildFile).display(file,byte_pos,mode);
		this.client.sendAll(function(s,message,err) {
			if(err != null) {
				_g.isServerAvailable = false;
				Vscode.window.showErrorMessage(err.message);
				callback([]);
			} else {
				_g.isServerAvailable = true;
				callback(_g.parse_items(message));
			}
		});
	}
};
var haxe_IMap = function() { };
haxe_IMap.__name__ = true;
var haxe_RangeInfo = function(s,e,isLineRange) {
	if(isLineRange == null) isLineRange = false;
	if(e == null) e = -1;
	if(e == -1) e = s;
	if(s > e) {
		this.start = e;
		this.end = s;
	} else {
		this.start = s;
		this.end = e;
	}
	if(!isLineRange && this.start == this.end) this.end++;
	this.isLineRange = isLineRange;
};
haxe_RangeInfo.__name__ = true;
var haxe_Info = function(fileName,lineNumber,range,message) {
	this.fileName = fileName;
	this.lineNumber = lineNumber;
	this.range = range;
	this.message = message;
};
haxe_Info.__name__ = true;
haxe_Info.decode = function(str,cwd) {
	if(cwd == null) cwd = "";
	if(!haxe_Info.re1.match(str)) return null;
	if(!haxe_Info.re2.match(haxe_Info.re1.matched(5))) return null;
	var rs = Std.parseInt(haxe_Info.re2.matched(4));
	var re;
	var tmp = haxe_Info.re2.matched(6);
	if(tmp != null) re = Std.parseInt(tmp); else re = rs;
	if(re == null) re = rs;
	var isLine = haxe_Info.re2.matched(3) != null;
	var fn = haxe_Info.re1.matched(1);
	var wd = haxe_Info.re1.matched(2);
	if(wd != null) fn = fn.split("/").join("\\"); else {
		var ps = "/";
		var dps = "\\";
		if(haxe_Info.reWin.match(cwd)) {
			ps = "\\";
			dps = "/";
		}
		if(cwd.charAt(cwd.length - 1) != ps) cwd += ps;
		var _g = fn.charAt(0);
		switch(_g) {
		case "/":
			break;
		case "\\":
			break;
		default:
			fn = cwd + fn;
		}
		fn = fn.split(dps).join(ps);
	}
	var ln = Std.parseInt(haxe_Info.re1.matched(4));
	return { info : new haxe_Info(fn,ln,new haxe_RangeInfo(rs,re,isLine),haxe_Info.re1.matched(6)), winDrive : wd};
};
var haxe_HaxeClient = function(host,port) {
	this.host = host;
	this.port = port;
	this.cmdLine = new haxe_HaxeCmdLine();
	this.clear();
};
haxe_HaxeClient.__name__ = true;
haxe_HaxeClient.isOptionExists = function(optionName,data) {
	var re = new EReg("unknown option '" + optionName + "'","");
	return !re.match(data);
};
haxe_HaxeClient.prototype = {
	clear: function() {
		this.cmdLine.clear();
	}
	,sendAll: function(onClose) {
		var _g = this;
		var workingDir = this.cmdLine.workingDir;
		var s = new Socket();
		s.connect(this.host,this.port,$bind(this,this._onConnect),null,null,function(s1) {
			_g.clear();
			if(onClose != null) {
				var stdout = [];
				var stderr = [];
				var infos = [];
				var hasError = false;
				var nl = "\n";
				var _g1 = 0;
				var _g2 = s1.datas.join("").split(nl);
				while(_g1 < _g2.length) {
					var line = _g2[_g1];
					++_g1;
					var _g3 = HxOverrides.cca(line,0);
					if(_g3 != null) switch(_g3) {
					case 1:
						stdout.push(HxOverrides.substr(line,1,null).split("\x01").join(nl));
						break;
					case 2:
						hasError = true;
						break;
					default:
						stderr.push(line);
						var info = haxe_Info.decode(line,workingDir);
						if(info != null) infos.push(info.info);
					} else {
						stderr.push(line);
						var info = haxe_Info.decode(line,workingDir);
						if(info != null) infos.push(info.info);
					}
				}
				var severity;
				if(hasError) severity = 2; else severity = 1;
				onClose(s1,{ stdout : stdout, stderr : stderr, infos : infos, severity : severity},s1.error);
			}
		});
		return s;
	}
	,_onConnect: function(s) {
		console.log(this.cmdLine.get_cmds());
		s.write(this.cmdLine.get_cmds());
		s.write("\x00");
	}
	,isPatchAvailable: function(onData) {
		var _g = this;
		this.cmdLine.save();
		this.cmdLine.beginPatch("~.hx").remove();
		this.sendAll(function(s,message,error) {
			_g.cmdLine.restore();
			var isServerAvailable = true;
			var isPatchAvailable = false;
			if(error != null) isServerAvailable = false; else isPatchAvailable = message.severity != 2;
			onData({ isServerAvailable : isServerAvailable, isOptionAvailable : isPatchAvailable});
		});
	}
};
var haxe_DisplayMode = { __ename__ : true, __constructs__ : ["Default","Position","Usage","Type","TopLevel","Resolve"] };
haxe_DisplayMode.Default = ["Default",0];
haxe_DisplayMode.Default.toString = $estr;
haxe_DisplayMode.Default.__enum__ = haxe_DisplayMode;
haxe_DisplayMode.Position = ["Position",1];
haxe_DisplayMode.Position.toString = $estr;
haxe_DisplayMode.Position.__enum__ = haxe_DisplayMode;
haxe_DisplayMode.Usage = ["Usage",2];
haxe_DisplayMode.Usage.toString = $estr;
haxe_DisplayMode.Usage.__enum__ = haxe_DisplayMode;
haxe_DisplayMode.Type = ["Type",3];
haxe_DisplayMode.Type.toString = $estr;
haxe_DisplayMode.Type.__enum__ = haxe_DisplayMode;
haxe_DisplayMode.TopLevel = ["TopLevel",4];
haxe_DisplayMode.TopLevel.toString = $estr;
haxe_DisplayMode.TopLevel.__enum__ = haxe_DisplayMode;
haxe_DisplayMode.Resolve = function(v) { var $x = ["Resolve",5,v]; $x.__enum__ = haxe_DisplayMode; $x.toString = $estr; return $x; };
var haxe_HaxeCmdLine = function() {
	this.reset();
};
haxe_HaxeCmdLine.__name__ = true;
haxe_HaxeCmdLine.prototype = {
	clear: function() {
		this.cmds = [];
		this.unique = new haxe_ds_StringMap();
		this.workingDir = "";
		this.patchers = new haxe_ds_StringMap();
	}
	,reset: function() {
		this.stack = [];
		this.clear();
	}
	,hxml: function(fileName) {
		this.unique.set(" ",fileName);
		return this;
	}
	,cwd: function(dir) {
		this.unique.set("--cwd","" + dir);
		this.workingDir = dir;
		return this;
	}
	,verbose: function() {
		this.unique.set("-v","");
		return this;
	}
	,version: function() {
		this.unique.set("-version","");
		return this;
	}
	,wait: function(port) {
		this.unique.set("--wait","" + port);
		return this;
	}
	,display: function(fileName,pos,mode) {
		var dm;
		switch(mode[1]) {
		case 0:
			dm = "";
			break;
		case 1:
			dm = "@position";
			break;
		case 2:
			dm = "@usage";
			break;
		case 3:
			dm = "@position";
			break;
		case 4:
			dm = "@toplevel";
			break;
		case 5:
			var v = mode[2];
			dm = "@resolve@" + v;
			break;
		}
		this.unique.set("--display","" + fileName + "@" + pos + dm);
		return this;
	}
	,custom: function(argName,data,is_unique) {
		if(is_unique == null) is_unique = true;
		if(is_unique) this.unique.set(argName,data); else this.cmds.push("" + argName + " " + data);
		return this;
	}
	,beginPatch: function(fileName) {
		var tmp = this.patchers.get(fileName);
		if(tmp == null) tmp = new haxe_HaxePatcherCmd(fileName);
		this.patchers.set(fileName,tmp);
		return tmp;
	}
	,save: function() {
		this.stack.push({ cmds : this.cmds, patchers : this.patchers, unique : this.unique});
		this.clear();
	}
	,restore: function() {
		var i = this.stack.pop();
		this.cmds = i.cmds;
		this.patchers = i.patchers;
		this.unique = i.unique;
	}
	,get_cmds: function() {
		var cmds = this.cmds.concat([]);
		var $it0 = this.unique.keys();
		while( $it0.hasNext() ) {
			var key = $it0.next();
			cmds.push(key + " " + this.unique.get(key));
		}
		var $it1 = this.patchers.keys();
		while( $it1.hasNext() ) {
			var key1 = $it1.next();
			cmds.push(this.patchers.get(key1).get_cmd());
		}
		return cmds.join("\n");
	}
};
var haxe_HaxeConfiguration = function() { };
haxe_HaxeConfiguration.__name__ = true;
haxe_HaxeConfiguration.addTrailingSep = function(path,platform) {
	if(path == "") return path;
	path = path.split(platform.reversePathSeparator).join(platform.pathSeparator);
	if(path.charAt(path.length - 1) != platform.pathSeparator) path += platform.reversePathSeparator;
	return path;
};
haxe_HaxeConfiguration.update = function(conf,platform) {
	var exec = "haxe" + platform.executableExtension;
	var tmp = haxe_HaxeConfiguration.addTrailingSep(conf.haxePath,platform);
	conf.haxePath = tmp;
	conf.haxeExec = tmp + exec;
	tmp = haxe_HaxeConfiguration.addTrailingSep(conf.haxelibPath,platform);
	conf.haxelibPath = tmp;
	return conf;
};
var haxe_HaxePatcherCmd = function(fileName) {
	this.fileName = fileName;
	this.actions = [];
};
haxe_HaxePatcherCmd.__name__ = true;
haxe_HaxePatcherCmd.$name = function() {
	return "--patch";
};
haxe_HaxePatcherCmd.opToString = function(pop) {
	var _g = pop.op;
	switch(_g) {
	case "+":
		return "" + pop.unit + "+" + pop.pos + ":" + pop.content + "\x01";
	case "-":
		return "" + pop.unit + "-" + pop.pos + ":" + pop.len + "\x01";
	}
};
haxe_HaxePatcherCmd.prototype = {
	reset: function() {
		this.actions = [];
		return this;
	}
	,remove: function() {
		this.pendingOP = null;
		this.actions = ["x\x01"];
		return this;
	}
	,'delete': function(pos,len,unit) {
		if(unit == null) unit = "b";
		var op = "-";
		if(this.pendingOP == null) this.pendingOP = { unit : unit, op : op, pos : pos, len : len}; else if(this.pendingOP.op == op && this.pendingOP.unit == unit && this.pendingOP.pos == pos) this.pendingOP.len += len; else {
			this.actions.push(haxe_HaxePatcherCmd.opToString(this.pendingOP));
			this.pendingOP = { unit : unit, op : op, pos : pos, len : len};
		}
		return this;
	}
	,insert: function(pos,len,text,unit) {
		if(unit == null) unit = "b";
		var op = "+";
		if(this.pendingOP == null) this.pendingOP = { unit : unit, op : op, pos : pos, len : len, content : text}; else if(this.pendingOP.op == op && this.pendingOP.unit == unit && this.pendingOP.pos + this.pendingOP.len == pos) {
			this.pendingOP.len += len;
			this.pendingOP.content += text;
		} else {
			this.actions.push(haxe_HaxePatcherCmd.opToString(this.pendingOP));
			this.pendingOP = { unit : unit, op : op, pos : pos, len : len, content : text};
		}
		return this;
	}
	,get_cmd: function() {
		if(this.pendingOP != null) {
			this.actions.push(haxe_HaxePatcherCmd.opToString(this.pendingOP));
			this.pendingOP = null;
		}
		if(this.actions.length == 0) return "";
		var tmp = this.actions.join("@");
		var cmd = "--patch" + (" " + this.fileName + "@" + tmp + "\n");
		return cmd;
	}
};
var haxe_Timer = function(time_ms) {
	var me = this;
	this.id = setInterval(function() {
		me.run();
	},time_ms);
};
haxe_Timer.__name__ = true;
haxe_Timer.delay = function(f,time_ms) {
	var t = new haxe_Timer(time_ms);
	t.run = function() {
		t.stop();
		f();
	};
	return t;
};
haxe_Timer.prototype = {
	stop: function() {
		if(this.id == null) return;
		clearInterval(this.id);
		this.id = null;
	}
	,run: function() {
	}
};
var haxe_ds_StringMap = function() {
	this.h = { };
};
haxe_ds_StringMap.__name__ = true;
haxe_ds_StringMap.__interfaces__ = [haxe_IMap];
haxe_ds_StringMap.prototype = {
	set: function(key,value) {
		if(__map_reserved[key] != null) this.setReserved(key,value); else this.h[key] = value;
	}
	,get: function(key) {
		if(__map_reserved[key] != null) return this.getReserved(key);
		return this.h[key];
	}
	,setReserved: function(key,value) {
		if(this.rh == null) this.rh = { };
		this.rh["$" + key] = value;
	}
	,getReserved: function(key) {
		if(this.rh == null) return null; else return this.rh["$" + key];
	}
	,remove: function(key) {
		if(__map_reserved[key] != null) {
			key = "$" + key;
			if(this.rh == null || !this.rh.hasOwnProperty(key)) return false;
			delete(this.rh[key]);
			return true;
		} else {
			if(!this.h.hasOwnProperty(key)) return false;
			delete(this.h[key]);
			return true;
		}
	}
	,keys: function() {
		var _this = this.arrayKeys();
		return HxOverrides.iter(_this);
	}
	,arrayKeys: function() {
		var out = [];
		for( var key in this.h ) {
		if(this.h.hasOwnProperty(key)) out.push(key);
		}
		if(this.rh != null) {
			for( var key in this.rh ) {
			if(key.charCodeAt(0) == 36) out.push(key.substr(1));
			}
		}
		return out;
	}
};
var js__$Boot_HaxeError = function(val) {
	Error.call(this);
	this.val = val;
	this.message = String(val);
	if(Error.captureStackTrace) Error.captureStackTrace(this,js__$Boot_HaxeError);
};
js__$Boot_HaxeError.__name__ = true;
js__$Boot_HaxeError.__super__ = Error;
js__$Boot_HaxeError.prototype = $extend(Error.prototype,{
});
var js_Boot = function() { };
js_Boot.__name__ = true;
js_Boot.__string_rec = function(o,s) {
	if(o == null) return "null";
	if(s.length >= 5) return "<...>";
	var t = typeof(o);
	if(t == "function" && (o.__name__ || o.__ename__)) t = "object";
	switch(t) {
	case "object":
		if(o instanceof Array) {
			if(o.__enum__) {
				if(o.length == 2) return o[0];
				var str2 = o[0] + "(";
				s += "\t";
				var _g1 = 2;
				var _g = o.length;
				while(_g1 < _g) {
					var i1 = _g1++;
					if(i1 != 2) str2 += "," + js_Boot.__string_rec(o[i1],s); else str2 += js_Boot.__string_rec(o[i1],s);
				}
				return str2 + ")";
			}
			var l = o.length;
			var i;
			var str1 = "[";
			s += "\t";
			var _g2 = 0;
			while(_g2 < l) {
				var i2 = _g2++;
				str1 += (i2 > 0?",":"") + js_Boot.__string_rec(o[i2],s);
			}
			str1 += "]";
			return str1;
		}
		var tostr;
		try {
			tostr = o.toString;
		} catch( e ) {
			if (e instanceof js__$Boot_HaxeError) e = e.val;
			return "???";
		}
		if(tostr != null && tostr != Object.toString && typeof(tostr) == "function") {
			var s2 = o.toString();
			if(s2 != "[object Object]") return s2;
		}
		var k = null;
		var str = "{\n";
		s += "\t";
		var hasp = o.hasOwnProperty != null;
		for( var k in o ) {
		if(hasp && !o.hasOwnProperty(k)) {
			continue;
		}
		if(k == "prototype" || k == "__class__" || k == "__super__" || k == "__interfaces__" || k == "__properties__") {
			continue;
		}
		if(str.length != 2) str += ", \n";
		str += s + k + " : " + js_Boot.__string_rec(o[k],s);
		}
		s = s.substring(1);
		str += "\n" + s + "}";
		return str;
	case "function":
		return "<function>";
	case "string":
		return o;
	default:
		return String(o);
	}
};
var js_node_buffer_Buffer = require("buffer").Buffer;
var js_node_net_Socket = require("net").Socket;
var platform_Platform = function() {
};
platform_Platform.__name__ = true;
platform_Platform.init = function(platformName) {
	if(platform_Platform.instance == null) platform_Platform.instance = new platform_Platform();
	if(platformName == "win32") {
		platform_Platform.instance.pathSeparator = "\\";
		platform_Platform.instance.reversePathSeparator = "/";
		platform_Platform.instance.executableExtension = ".exe";
	} else {
		platform_Platform.instance.pathSeparator = "/";
		platform_Platform.instance.reversePathSeparator = "\\";
		platform_Platform.instance.executableExtension = "";
	}
	return platform_Platform.instance;
};
var $_, $fid = 0;
function $bind(o,m) { if( m == null ) return null; if( m.__id__ == null ) m.__id__ = $fid++; var f; if( o.hx__closures__ == null ) o.hx__closures__ = {}; else f = o.hx__closures__[m.__id__]; if( f == null ) { f = function(){ return f.method.apply(f.scope, arguments); }; f.scope = o; f.method = m; o.hx__closures__[m.__id__] = f; } return f; }
String.__name__ = true;
Array.__name__ = true;
Date.__name__ = ["Date"];
var __map_reserved = {}
haxe_Info.reWin = new EReg("^\\w+:\\\\","");
haxe_Info.re1 = new EReg("^((\\w+:\\\\)?([^:]+)):(\\d+):\\s*([^:]+):(.+)","");
haxe_Info.re2 = new EReg("^((character[s]?)|(line[s]?))\\s+(\\d+)(\\-(\\d+))?","");
})(typeof window != "undefined" ? window : typeof exports != "undefined" ? exports : typeof self != "undefined" ? self : this);
