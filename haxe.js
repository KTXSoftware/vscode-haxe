(function ($hx_exports, $global) { "use strict";
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
	,replace: function(s,by) {
		return s.replace(this.r,by);
	}
	,__class__: EReg
};
var HaxeContext = function(context) {
	this.context = context;
	this.haxeProcess = null;
	this.configuration = Vscode.workspace.getConfiguration("haxe");
	platform_Platform.init(process.platform);
	haxe_HaxeConfiguration.update(this.configuration,platform_Platform.instance);
	this.diagnostics = Vscode.languages.createDiagnosticCollection("haxe");
	context.subscriptions.push(this.diagnostics);
	this.documentsState = new haxe_ds_StringMap();
	this.maxLastDiagnoseTime = 0;
	this.checkDiagnostic = false;
	this.checkTimer = new haxe_Timer(50);
	this.checkTimer.run = $bind(this,this.check);
	context.subscriptions.push(this);
};
HaxeContext.__name__ = true;
HaxeContext.languageID = function() {
	return "haxe";
};
HaxeContext.prototype = {
	check: function() {
		var time = new Date().getTime();
		if(this.checkDiagnostic) {
			var dlt = time - this.maxLastDiagnoseTime;
			if(dlt >= this.configuration.haxeDiagnosticDelay) {
				this.checkDiagnostic = false;
				if(this.client.isPatchAvailable) this.diagnose(1); else {
					var isDirty = false;
					var $it0 = this.documentsState.keys();
					while( $it0.hasNext() ) {
						var k = $it0.next();
						var ds = this.documentsState.get(k);
						var document = ds.document;
						if(ds.isDirty) {
							isDirty = true;
							if(document != null) document.save();
						}
					}
					if(!isDirty) this.diagnose(1);
				}
			}
		}
	}
	,init: function() {
		var host = this.configuration.haxeServerHost;
		var port = this.configuration.haxeServerPort;
		this.client = new haxe_HaxeClient(host,port);
		this.projectDir = Vscode.workspace.rootPath;
		this.changeDebouncer = new Debouncer(250,$bind(this,this.changePatchs));
		this.context.subscriptions.push(Vscode.workspace.onDidChangeTextDocument($bind(this,this.changePatch)));
		this.context.subscriptions.push(Vscode.workspace.onDidOpenTextDocument($bind(this,this.onOpenDocument)));
		this.context.subscriptions.push(Vscode.workspace.onDidSaveTextDocument($bind(this,this.onSaveDocument)));
		this.context.subscriptions.push(Vscode.workspace.onDidCloseTextDocument($bind(this,this.onCloseDocument)));
		this.completionHandler = new features_CompletionHandler(this);
		this.definitionHandler = new features_DefinitionHandler(this);
		this.signatureHandler = new features_SignatureHandler(this);
		return this.launchServer();
	}
	,launchServer: function() {
		var _g = this;
		var host = this.configuration.haxeServerHost;
		var port = this.configuration.haxeServerPort;
		this.client.host = host;
		this.client.port = port;
		return new Promise(function(resolve,reject) {
			var onData;
			var onData1 = null;
			onData1 = function(data) {
				if(data.isHaxeServer) {
					_g.configuration.haxeServerPort = port;
					_g.client.port = port;
					resolve(port);
					return;
				}
				if(data.isServerAvailable) {
					port++;
					_g.client.patchAvailable(onData1);
				} else {
					if(_g.haxeProcess != null) _g.haxeProcess.kill("SIGKILL");
					_g.haxeProcess = js_node_ChildProcess.spawn(haxe_HaxeConfiguration.findHaxeExec(_g.configuration,_g.projectDir,platform_Platform.instance),["--wait","" + port]);
					if(_g.haxeProcess.pid > 0) _g.client.patchAvailable(onData1);
					_g.haxeProcess.on("error",function(err) {
						_g.haxeProcess = null;
						Vscode.window.showErrorMessage("Can't spawn " + _g.configuration.haxeExec + " process\n" + err.message);
						reject(err);
					});
				}
			};
			onData = onData1;
			_g.client.patchAvailable(onData);
		});
	}
	,dispose: function() {
		Vscode.window.showInformationMessage("Got dispose!");
		if(this.checkTimer != null) {
			this.checkTimer.stop();
			this.checkTimer = null;
		}
		if(this.client.isServerAvailable && this.client.isPatchAvailable) {
			this.client.clear();
			var cl = this.client.cmdLine;
			var _g = 0;
			var _g1 = Vscode.window.visibleTextEditors;
			while(_g < _g1.length) {
				var editor = _g1[_g];
				++_g;
				var path = editor.document.uri.fsPath;
				this.documentsState.remove(path);
				cl.beginPatch(path).remove();
			}
			this.client.sendAll(null);
		}
		if(this.haxeProcess != null) {
			this.haxeProcess.kill("SIGKILL");
			this.haxeProcess = null;
		}
		this.client = null;
		return null;
	}
	,applyDiagnostics: function(message) {
		this.checkDiagnostic = false;
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
		var entries = [];
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
			var ds = this.getDocumentState(url.fsPath);
			ds.lastDiagnostic = new Date().getTime();
			if(ds.lastDiagnostic > this.maxLastDiagnoseTime) this.maxLastDiagnoseTime = ds.lastDiagnostic;
		}
	}
	,getTime: function() {
		return new Date().getTime();
	}
	,getDocumentState: function(path) {
		var ds = this.documentsState.get(path);
		if(ds != null) return ds;
		var t = new Date().getTime();
		ds = { path : path, isDirty : false, lastModification : t, lastDiagnostic : t, document : null};
		this.documentsState.set(path,ds);
		return ds;
	}
	,onCloseDocument: function(document) {
		var path = document.uri.fsPath;
		this.documentsState.remove(path);
		if(this.client.isPatchAvailable) {
			this.client.cmdLine.save().beginPatch(path).remove();
			this.client.sendAll(null,true);
			this.diagnostics["delete"](document.uri);
		}
	}
	,onOpenDocument: function(document) {
		var path = document.uri.fsPath;
		var ds = this.getDocumentState(path);
		ds.document = document;
		this.removeAndDiagnoseDocument(document);
	}
	,onSaveDocument: function(document) {
		var path = document.uri.fsPath;
		var ds = this.getDocumentState(path);
		ds.isDirty = false;
		ds.lastModification = new Date().getTime();
		this.removeAndDiagnoseDocument(document);
	}
	,diagnose: function(trying) {
		var _g = this;
		var cl = this.client.cmdLine.save().cwd(this.projectDir).hxml(this.configuration.haxeDefaultBuildFile).noOutput();
		this.client.sendAll(function(s,message,err) {
			if(err != null) {
				if(trying <= 0) Vscode.window.showErrorMessage(err.message); else _g.launchServer().then(function(port) {
					_g.diagnose(trying - 1);
				});
			} else _g.applyDiagnostics(message);
		},true);
	}
	,removeAndDiagnoseDocument: function(document) {
		this.diagnostics["delete"](document.uri);
		var path = document.uri.fsPath;
		if(this.client.isPatchAvailable) this.client.cmdLine.beginPatch(path).remove();
		this.diagnose(1);
	}
	,changePatchs: function(events) {
		var _g = this;
		var cl = this.client.cmdLine.save().cwd(this.projectDir);
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
			if(!this.client.isServerAvailable) {
				if(__map_reserved[path] != null?done.getReserved(path):done.h[path]) continue;
				if(__map_reserved[path] != null) done.setReserved(path,true); else done.h[path] = true;
				var bl = js_node_buffer_Buffer.byteLength(text,null);
				if(document.isDirty) patcher["delete"](0,-1).insert(0,bl,text); else patcher.remove();
				changed = true;
			} else if(this.client.isPatchAvailable) {
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
					if(editor.document == document) pos = Tool.byte_pos(text,document.offsetAt(editor.selection.active)); else pos = js_node_buffer_Buffer.byteLength(text,null);
				} else pos = js_node_buffer_Buffer.byteLength(text,null);
				changed = true;
			}
		}
		if(changed) this.client.sendAll(function(s,message,error) {
			if(error == null) _g.applyDiagnostics(message);
			_g.checkDiagnostic = true;
		},true); else this.checkDiagnostic = true;
	}
	,changePatch: function(event) {
		var document = event.document;
		var path = document.uri.fsPath;
		var ds = this.getDocumentState(path);
		if(event.contentChanges.length == 0) {
			ds.isDirty = false;
			return;
		}
		ds.isDirty = true;
		ds.lastModification = new Date().getTime();
		ds.document = document;
		this.changeDebouncer.debounce(event);
	}
	,__class__: HaxeContext
};
var HxOverrides = function() { };
HxOverrides.__name__ = true;
HxOverrides.cca = function(s,index) {
	var x = s.charCodeAt(index);
	if(x != x) return undefined;
	return x;
};
HxOverrides.substr = function(s,pos,len) {
	if(pos != null && pos != 0 && len != null && len < 0) return "";
	if(len == null) len = s.length;
	if(pos < 0) {
		pos = s.length + pos;
		if(pos < 0) pos = 0;
	} else if(len < 0) len = s.length + len - pos;
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
Main.main = $hx_exports.activate = function(context) {
	var hc = new HaxeContext(context);
	hc.init();
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
	,__class__: Socket
};
var Std = function() { };
Std.__name__ = true;
Std.string = function(s) {
	return js_Boot.__string_rec(s,"");
};
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
	return js_node_buffer_Buffer.byteLength(str,null);
};
Tool.byte_pos = function(text,char_pos) {
	if(char_pos == text.length) return js_node_buffer_Buffer.byteLength(text,null); else return Tool.byteLength(HxOverrides.substr(text,0,char_pos));
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
	,__class__: Debouncer
};
var Vscode = require("vscode");
var CompletionItemProvider = function() { };
CompletionItemProvider.__name__ = true;
CompletionItemProvider.prototype = {
	__class__: CompletionItemProvider
};
var DefinitionProvider = function() { };
DefinitionProvider.__name__ = true;
DefinitionProvider.prototype = {
	__class__: DefinitionProvider
};
var SignatureHelpProvider = function() { };
SignatureHelpProvider.__name__ = true;
SignatureHelpProvider.prototype = {
	__class__: SignatureHelpProvider
};
var features_CompletionHandler = function(hxContext) {
	this.hxContext = hxContext;
	var context = hxContext.context;
	var disposable = Vscode.languages.registerCompletionItemProvider("haxe",this,".");
	context.subscriptions.push(disposable);
};
features_CompletionHandler.__name__ = true;
features_CompletionHandler.__interfaces__ = [CompletionItemProvider];
features_CompletionHandler.prototype = {
	parse_items: function(msg) {
		var rtn = [];
		if(msg.severity == 2) {
			this.hxContext.applyDiagnostics(msg);
			return rtn;
		}
		var datas = msg.stderr;
		if(datas.length > 2 && datas[0] == "<list>") {
			datas.shift();
			datas.pop();
			datas.pop();
			var len = datas.length;
			var i = 0;
			while(i < len) {
				var tmp = datas[i++];
				var data = "";
				if(HxOverrides.substr(tmp,0,2) == "<i") {
					while(i < len) {
						data += tmp;
						if(HxOverrides.substr(tmp,tmp.length - 2,2) == "i>") break;
						tmp = datas[i++];
					}
					if(i == len) data += tmp;
				}
				if(features_CompletionHandler.reI.match(data)) {
					var n = features_CompletionHandler.reI.matched(1);
					var k = features_CompletionHandler.reI.matched(2);
					var ip = features_CompletionHandler.reI.matched(4);
					var f = Std.parseInt(features_CompletionHandler.reI.matched(6)) | 0;
					var t = features_CompletionHandler.reI.matched(7);
					t = features_CompletionHandler.reGT.replace(features_CompletionHandler.reLT.replace(t,"<"),">");
					var d = features_CompletionHandler.reI.matched(8);
					var ci = new Vscode.CompletionItem(n);
					ci.documentation = d;
					ci.detail = t;
					switch(k) {
					case "method":
						var ts = t.split("->");
						var l = ts.length;
						if(features_CompletionHandler.reMethod.match(ts[l - 1])) ci.kind = Vscode.CompletionItemKind.Method; else ci.kind = Vscode.CompletionItemKind.Function;
						break;
					case "var":
						if(ip == "1") ci.kind = Vscode.CompletionItemKind.Property; else if((f & 1) != 0) ci.kind = Vscode.CompletionItemKind.Property; else ci.kind = Vscode.CompletionItemKind.Field;
						break;
					default:
						ci.kind = Vscode.CompletionItemKind.Field;
					}
					rtn.push(ci);
				}
			}
		}
		return rtn;
	}
	,provideCompletionItems: function(document,position,cancelToken) {
		var _g = this;
		var changeDebouncer = this.hxContext.changeDebouncer;
		var client = this.hxContext.client;
		var text = document.getText();
		var char_pos = document.offsetAt(position);
		var path = document.uri.fsPath;
		var documentState = this.hxContext.getDocumentState(path);
		var lm = documentState.lastModification;
		var delta = new Date().getTime() - lm;
		var makeCall = false;
		var displayMode = haxe_DisplayMode.Default;
		var lastChar = text.charAt(char_pos - 1);
		var isDot = lastChar == ".";
		makeCall = isDot;
		if(isDot) {
			if(delta > 150) makeCall = true;
		}
		if(!makeCall) return new Promise(function(resolve) {
			resolve([]);
		});
		if(!isDot) displayMode = haxe_DisplayMode.Position;
		var byte_pos;
		if(char_pos == text.length) byte_pos = js_node_buffer_Buffer.byteLength(text,null); else byte_pos = Tool.byteLength(HxOverrides.substr(text,0,char_pos));
		return new Promise(function(resolve1) {
			var trying = 1;
			var make_request;
			var make_request1 = null;
			make_request1 = function() {
				var cl = client.cmdLine.save().cwd(_g.hxContext.projectDir).define("display-details").hxml(_g.hxContext.configuration.haxeDefaultBuildFile).noOutput().display(path,byte_pos,displayMode);
				client.sendAll(function(s,message,err) {
					if(err != null) {
						if(trying <= 0) {
							Vscode.window.showErrorMessage(err.message);
							resolve1([]);
						} else {
							trying--;
							_g.hxContext.launchServer().then(function(port) {
								make_request1();
							});
						}
					} else resolve1(_g.parse_items(message));
				},true);
			};
			make_request = make_request1;
			var isDirty = document.isDirty;
			var doRequest = function() {
				var isPatchAvailable = client.isPatchAvailable;
				var isServerAvailable = client.isServerAvailable;
				if(isPatchAvailable) changeDebouncer.whenDone(function() {
					make_request();
				}); else if(isDirty && isServerAvailable) document.save().then(function(saved) {
					if(saved) make_request(); else resolve1([]);
				}); else make_request();
			};
			if(!client.isServerAvailable) {
				var cl1 = client.cmdLine.save().version();
				var patcher = cl1.beginPatch(path);
				if(isDirty) {
					var text1 = document.getText();
					patcher["delete"](0,-1).insert(0,js_node_buffer_Buffer.byteLength(text1,null),text1);
				} else patcher.remove();
				client.sendAll(function(s1,message1,err1) {
					var isPatchAvailable1 = false;
					if(client.isServerAvailable) {
						if(message1.severity == 2) {
							if(message1.stderr.length > 1) isPatchAvailable1 = haxe_HaxeClient.isOptionExists("--patch",message1.stderr[1]);
						} else isPatchAvailable1 = true;
					}
					client.isPatchAvailable = isPatchAvailable1;
					doRequest();
				},true);
			} else doRequest();
		});
	}
	,resolveCompletionItem: function(item,cancelToken) {
		return item;
	}
	,__class__: features_CompletionHandler
};
var features_DefinitionHandler = function(hxContext) {
	this.hxContext = hxContext;
	var context = hxContext.context;
	var disposable = Vscode.languages.registerDefinitionProvider("haxe",this);
	context.subscriptions.push(disposable);
};
features_DefinitionHandler.__name__ = true;
features_DefinitionHandler.__interfaces__ = [DefinitionProvider];
features_DefinitionHandler.prototype = {
	provideDefinition: function(document,position,cancelToken) {
		var _g = this;
		var changeDebouncer = this.hxContext.changeDebouncer;
		var client = this.hxContext.client;
		var path = document.uri.fsPath;
		var displayMode = haxe_DisplayMode.Position;
		var text = document.getText();
		var range = document.getWordRangeAtPosition(position);
		position = range.end;
		var char_pos = document.offsetAt(position) + 1;
		var byte_pos;
		if(char_pos == text.length) byte_pos = js_node_buffer_Buffer.byteLength(text,null); else byte_pos = Tool.byteLength(HxOverrides.substr(text,0,char_pos));
		return new Promise(function(resolve) {
			var trying = 1;
			var make_request;
			var make_request1 = null;
			make_request1 = function() {
				var cl = client.cmdLine.save().cwd(_g.hxContext.projectDir).hxml(_g.hxContext.configuration.haxeDefaultBuildFile).noOutput().display(path,byte_pos,displayMode);
				var step = 1;
				var parse;
				var parse1 = null;
				parse1 = function(s,message,err) {
					if(err != null) {
						if(trying <= 0) {
							Vscode.window.showErrorMessage(err.message);
							resolve(null);
						} else {
							trying--;
							_g.hxContext.launchServer().then(function(port) {
								make_request1();
							});
						}
					} else if(message.severity == 2) {
						_g.hxContext.applyDiagnostics(message);
						resolve(null);
					} else {
						var datas = message.stderr;
						var defs = [];
						if(datas.length >= 2 && datas[0] == "<list>") {
							datas.shift();
							datas.pop();
							if(datas.length == 0 && step == 0) {
								step++;
								cl.cwd(_g.hxContext.projectDir).hxml(_g.hxContext.configuration.haxeDefaultBuildFile).noOutput().display(path,byte_pos,haxe_DisplayMode.Resolve(document.getText(range)));
								client.sendAll(parse1);
							} else {
								var _g1 = 0;
								while(_g1 < datas.length) {
									var data = datas[_g1];
									++_g1;
									if(!features_DefinitionHandler.rePos.match(data)) continue;
									data = features_DefinitionHandler.rePos.matched(1);
									var i = haxe_Info.decode(data,_g.hxContext.projectDir);
									if(i == null) continue;
									var info = i.info;
									defs.push(new Vscode.Location(Vscode.Uri.file(info.fileName),Tool.toVSCRange(info)));
								}
							}
						}
						resolve(defs);
					}
				};
				parse = parse1;
				client.sendAll(parse,true);
			};
			make_request = make_request1;
			var isDirty = document.isDirty;
			var doRequest = function() {
				var isPatchAvailable = client.isPatchAvailable;
				var isServerAvailable = client.isServerAvailable;
				if(isPatchAvailable) changeDebouncer.whenDone(make_request); else if(isDirty && isServerAvailable) document.save().then(function(saved) {
					if(saved) make_request(); else resolve(null);
				}); else make_request();
			};
			if(!client.isServerAvailable) {
				var cl1 = client.cmdLine.save().version();
				var patcher = cl1.beginPatch(path);
				if(isDirty) {
					var text1 = document.getText();
					patcher["delete"](0,-1).insert(0,js_node_buffer_Buffer.byteLength(text1,null),text1);
				} else patcher.remove();
				client.sendAll(function(s1,message1,err1) {
					var isPatchAvailable1 = false;
					if(client.isServerAvailable) {
						if(message1.severity == 2) {
							if(message1.stderr.length > 1) isPatchAvailable1 = haxe_HaxeClient.isOptionExists("--patch",message1.stderr[1]);
						} else isPatchAvailable1 = true;
					}
					client.isPatchAvailable = isPatchAvailable1;
					doRequest();
				},true);
			} else doRequest();
		});
	}
	,__class__: features_DefinitionHandler
};
var features_FunctionDecoder = function() { };
features_FunctionDecoder.__name__ = true;
features_FunctionDecoder.asFunctionArgs = function(data) {
	var l = data.length;
	var args = [];
	var i = 0;
	var sp = 0;
	var pc = "";
	var consLevel = 0;
	var parLevel = 0;
	var argName = "";
	var canParseArgName = true;
	while(i < l) {
		var c = data.charAt(i);
		switch(c) {
		case ":":
			if(canParseArgName) {
				canParseArgName = false;
				argName = data.substring(sp,i - 1);
				sp = i + 2;
			}
			break;
		case "(":
			parLevel++;
			break;
		case ")":
			parLevel--;
			break;
		case "<":
			consLevel++;
			break;
		case ">":
			if(pc == "-") {
				if(parLevel == 0 && consLevel == 0) {
					args.push({ name : argName, type : data.substring(sp,i - 2)});
					canParseArgName = true;
					sp = i + 2;
				}
			} else consLevel--;
			break;
		}
		pc = c;
		i++;
	}
	args.push({ name : "", type : HxOverrides.substr(data,sp,null)});
	return args;
};
var features_SignatureHandler = function(hxContext) {
	this.hxContext = hxContext;
	var context = hxContext.context;
	var disposable = Vscode.languages.registerSignatureHelpProvider("haxe",this,"(",",");
	context.subscriptions.push(disposable);
};
features_SignatureHandler.__name__ = true;
features_SignatureHandler.__interfaces__ = [SignatureHelpProvider];
features_SignatureHandler.prototype = {
	provideSignatureHelp: function(document,position,cancelToken) {
		var _g = this;
		var client = this.hxContext.client;
		var changeDebouncer = this.hxContext.changeDebouncer;
		var path = document.uri.fsPath;
		var text = document.getText();
		var char_pos = document.offsetAt(position);
		var text1 = document.getText();
		var byte_pos;
		if(char_pos == text1.length) byte_pos = js_node_buffer_Buffer.byteLength(text1,null); else byte_pos = Tool.byteLength(HxOverrides.substr(text1,0,char_pos));
		var displayMode = haxe_DisplayMode.Default;
		return new Promise(function(resolve) {
			var trying = 1;
			var make_request;
			var make_request1 = null;
			make_request1 = function() {
				var cl = client.cmdLine.save().cwd(_g.hxContext.projectDir).hxml(_g.hxContext.configuration.haxeDefaultBuildFile).noOutput().display(path,byte_pos,displayMode);
				client.sendAll(function(s,message,err) {
					if(err != null) {
						if(trying <= 0) {
							Vscode.window.showErrorMessage(err.message);
							resolve(null);
						} else {
							trying--;
							_g.hxContext.launchServer().then(function(port) {
								make_request1();
							});
						}
					} else if(message.severity == 2) {
						_g.hxContext.applyDiagnostics(message);
						resolve(null);
					} else {
						var datas = message.stderr;
						var sh = new Vscode.SignatureHelp();
						sh.activeParameter = 0;
						sh.activeSignature = 0;
						var sigs = [];
						sh.signatures = sigs;
						if(datas.length > 2 && features_SignatureHandler.reType.match(datas[0])) {
							var opar = Std.parseInt(features_SignatureHandler.reType.matched(2)) | 0;
							var index = Std.parseInt(features_SignatureHandler.reType.matched(4)) | 0;
							if(index >= 0) sh.activeParameter = index;
							datas.shift();
							datas.pop();
							datas.pop();
							var _g1 = 0;
							while(_g1 < datas.length) {
								var data = datas[_g1];
								++_g1;
								data = features_SignatureHandler.reGT.replace(data,">");
								data = features_SignatureHandler.reLT.replace(data,"<");
								var args = features_FunctionDecoder.asFunctionArgs(data);
								var ret = args.pop();
								var si = new Vscode.SignatureInformation(data);
								sigs.push(si);
								var pis = args.map(function(v) {
									return new Vscode.ParameterInformation(v.name,v.type);
								});
								si.parameters = pis;
							}
						}
						resolve(sh);
					}
				},true);
			};
			make_request = make_request1;
			var isDirty = document.isDirty;
			var doRequest = function() {
				var isServerAvailable = client.isServerAvailable;
				var isPatchAvailable = client.isPatchAvailable;
				if(isPatchAvailable) changeDebouncer.whenDone(make_request); else if(isDirty && isServerAvailable) document.save().then(function(saved) {
					if(saved) make_request(); else resolve(null);
				}); else make_request();
			};
			if(!client.isServerAvailable) {
				var cl1 = client.cmdLine.save().version();
				var patcher = cl1.beginPatch(path);
				if(isDirty) {
					var text2 = document.getText();
					patcher["delete"](0,-1).insert(0,js_node_buffer_Buffer.byteLength(text2,null),text2);
				} else patcher.remove();
				client.sendAll(function(s1,message1,err1) {
					var isPatchAvailable1 = false;
					if(client.isServerAvailable) {
						if(message1.severity == 2) {
							if(message1.stderr.length > 1) isPatchAvailable1 = haxe_HaxeClient.isOptionExists("--patch",message1.stderr[1]);
						} else isPatchAvailable1 = true;
					}
					client.isPatchAvailable = isPatchAvailable1;
					doRequest();
				},true);
			} else doRequest();
		});
	}
	,__class__: features_SignatureHandler
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
haxe_RangeInfo.prototype = {
	__class__: haxe_RangeInfo
};
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
	return { info : new haxe_Info(fn,ln,new haxe_RangeInfo(rs,re,isLine),haxe_Info.re1.matched(7)), winDrive : wd};
};
haxe_Info.prototype = {
	__class__: haxe_Info
};
var haxe_HaxeClient = function(host,port) {
	this.host = host;
	this.port = port;
	this.isHaxeServer = false;
	this.isPatchAvailable = false;
	this.isServerAvailable = false;
	this.cmdLine = new haxe_HaxeCmdLine();
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
	,sendAll: function(onClose,restoreCmdLine) {
		if(restoreCmdLine == null) restoreCmdLine = false;
		var _g = this;
		var cmds = this.cmdLine.get_cmds();
		this.cmdLine.clearPatch();
		var workingDir = this.cmdLine.workingDir;
		if(restoreCmdLine) this.cmdLine.restore();
		var s = new Socket();
		s.connect(this.host,this.port,function(s1) {
			s1.write(cmds);
			s1.write("\x00");
		},null,null,function(s2) {
			_g.isServerAvailable = s2.error == null;
			_g.clear();
			if(onClose != null) {
				var stdout = [];
				var stderr = [];
				var infos = [];
				var hasError = false;
				var nl = "\n";
				var _g1 = 0;
				var _g2 = s2.datas.join("").split(nl);
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
				onClose(s2,{ stdout : stdout, stderr : stderr, infos : infos, severity : severity},s2.error);
			}
		});
		return s;
	}
	,setStatus: function(message,error) {
		this.isServerAvailable = error == null;
		this.isPatchAvailable = false;
		this.isHaxeServer = false;
		if(this.isServerAvailable) {
			this.isPatchAvailable = message.severity != 2;
			if(message.stderr.length > 0) this.isHaxeServer = haxe_HaxeClient.reVersion.match(message.stderr[0]);
		}
		return this;
	}
	,patchAvailable: function(onData) {
		var _g = this;
		this.cmdLine.save();
		this.cmdLine.version().beginPatch("~.hx").remove();
		this.sendAll(function(s,message,error) {
			_g.cmdLine.restore();
			_g.setStatus(message,error);
			if(onData != null) onData(_g);
		});
	}
	,__class__: haxe_HaxeClient
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
	clear: function(haveToClearPatch) {
		if(haveToClearPatch == null) haveToClearPatch = false;
		this.cmds = [];
		this.unique = new haxe_ds_StringMap();
		this.workingDir = "";
		if(haveToClearPatch) this.clearPatch();
	}
	,reset: function() {
		this.stack = [];
		this.clear(true);
	}
	,define: function(name,value) {
		if(name != "") {
			var str = "-D " + name;
			if(value != null) str += "=" + value;
			this.cmds.push(str);
		}
		return this;
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
	,noOutput: function() {
		this.unique.set("--no-output","");
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
	,clearPatch: function() {
		this.patchers = new haxe_ds_StringMap();
		return this;
	}
	,save: function() {
		var wd = this.workingDir;
		var pt = this.patchers;
		this.stack.push({ cmds : this.cmds, unique : this.unique, workingDir : wd});
		this.clear();
		this.patchers = pt;
		if(wd != "") this.cwd(wd);
		return this;
	}
	,restore: function() {
		var i = this.stack.pop();
		this.cmds = i.cmds;
		this.unique = i.unique;
		this.workingDir = i.workingDir;
		return this;
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
	,__class__: haxe_HaxeCmdLine
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
haxe_HaxeConfiguration.findHaxeExec = function(conf,projectDir,platform) {
	var localPath = js_node_Path.join(projectDir,"Kha","Tools","Haxe");
	try {
		if(js_node_Fs.statSync(localPath).isDirectory()) {
			var exec = "haxe" + platform.executableExtension;
			var tmp = haxe_HaxeConfiguration.addTrailingSep(localPath,platform);
			return tmp + exec;
		}
	} catch( error ) {
		if (error instanceof js__$Boot_HaxeError) error = error.val;
	}
	return conf.haxeExec;
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
		if(this.pendingOP == null) this.pendingOP = { unit : unit, op : op, pos : pos, len : len}; else if(this.pendingOP.op == op && this.pendingOP.unit == unit) {
			if(this.pendingOP.pos == pos) this.pendingOP.len += len; else if(this.pendingOP.pos == pos + len) {
				this.pendingOP.len += len;
				this.pendingOP.pos = pos;
			} else {
				this.actions.push(haxe_HaxePatcherCmd.opToString(this.pendingOP));
				this.pendingOP = { unit : unit, op : op, pos : pos, len : len};
			}
		} else {
			this.actions.push(haxe_HaxePatcherCmd.opToString(this.pendingOP));
			this.pendingOP = { unit : unit, op : op, pos : pos, len : len};
		}
		return this;
	}
	,insert: function(pos,len,text,unit) {
		if(unit == null) unit = "b";
		var op = "+";
		if(this.pendingOP == null) this.pendingOP = { unit : unit, op : op, pos : pos, len : len, content : text}; else if(this.pendingOP.op == op && this.pendingOP.unit == unit) {
			if(this.pendingOP.pos + this.pendingOP.len == pos) {
				this.pendingOP.len += len;
				this.pendingOP.content += text;
			} else if(this.pendingOP.pos == pos) {
				this.pendingOP.len += len;
				this.pendingOP.content = text + this.pendingOP.content;
			} else {
				this.actions.push(haxe_HaxePatcherCmd.opToString(this.pendingOP));
				this.pendingOP = { unit : unit, op : op, pos : pos, len : len, content : text};
			}
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
	,__class__: haxe_HaxePatcherCmd
};
var haxe__$Int64__$_$_$Int64 = function(high,low) {
	this.high = high;
	this.low = low;
};
haxe__$Int64__$_$_$Int64.__name__ = true;
haxe__$Int64__$_$_$Int64.prototype = {
	__class__: haxe__$Int64__$_$_$Int64
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
	,__class__: haxe_Timer
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
	,__class__: haxe_ds_StringMap
};
var haxe_io_Error = { __ename__ : true, __constructs__ : ["Blocked","Overflow","OutsideBounds","Custom"] };
haxe_io_Error.Blocked = ["Blocked",0];
haxe_io_Error.Blocked.toString = $estr;
haxe_io_Error.Blocked.__enum__ = haxe_io_Error;
haxe_io_Error.Overflow = ["Overflow",1];
haxe_io_Error.Overflow.toString = $estr;
haxe_io_Error.Overflow.__enum__ = haxe_io_Error;
haxe_io_Error.OutsideBounds = ["OutsideBounds",2];
haxe_io_Error.OutsideBounds.toString = $estr;
haxe_io_Error.OutsideBounds.__enum__ = haxe_io_Error;
haxe_io_Error.Custom = function(e) { var $x = ["Custom",3,e]; $x.__enum__ = haxe_io_Error; $x.toString = $estr; return $x; };
var haxe_io_FPHelper = function() { };
haxe_io_FPHelper.__name__ = true;
haxe_io_FPHelper.i32ToFloat = function(i) {
	var sign = 1 - (i >>> 31 << 1);
	var exp = i >>> 23 & 255;
	var sig = i & 8388607;
	if(sig == 0 && exp == 0) return 0.0;
	return sign * (1 + Math.pow(2,-23) * sig) * Math.pow(2,exp - 127);
};
haxe_io_FPHelper.floatToI32 = function(f) {
	if(f == 0) return 0;
	var af;
	if(f < 0) af = -f; else af = f;
	var exp = Math.floor(Math.log(af) / 0.6931471805599453);
	if(exp < -127) exp = -127; else if(exp > 128) exp = 128;
	var sig = Math.round((af / Math.pow(2,exp) - 1) * 8388608) & 8388607;
	return (f < 0?-2147483648:0) | exp + 127 << 23 | sig;
};
haxe_io_FPHelper.i64ToDouble = function(low,high) {
	var sign = 1 - (high >>> 31 << 1);
	var exp = (high >> 20 & 2047) - 1023;
	var sig = (high & 1048575) * 4294967296. + (low >>> 31) * 2147483648. + (low & 2147483647);
	if(sig == 0 && exp == -1023) return 0.0;
	return sign * (1.0 + Math.pow(2,-52) * sig) * Math.pow(2,exp);
};
haxe_io_FPHelper.doubleToI64 = function(v) {
	var i64 = haxe_io_FPHelper.i64tmp;
	if(v == 0) {
		i64.low = 0;
		i64.high = 0;
	} else {
		var av;
		if(v < 0) av = -v; else av = v;
		var exp = Math.floor(Math.log(av) / 0.6931471805599453);
		var sig;
		var v1 = (av / Math.pow(2,exp) - 1) * 4503599627370496.;
		sig = Math.round(v1);
		var sig_l = sig | 0;
		var sig_h = sig / 4294967296.0 | 0;
		i64.low = sig_l;
		i64.high = (v < 0?-2147483648:0) | exp + 1023 << 20 | sig_h;
	}
	return i64;
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
	__class__: js__$Boot_HaxeError
});
var js_Boot = function() { };
js_Boot.__name__ = true;
js_Boot.getClass = function(o) {
	if((o instanceof Array) && o.__enum__ == null) return Array; else {
		var cl = o.__class__;
		if(cl != null) return cl;
		var name = js_Boot.__nativeClassName(o);
		if(name != null) return js_Boot.__resolveNativeClass(name);
		return null;
	}
};
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
js_Boot.__interfLoop = function(cc,cl) {
	if(cc == null) return false;
	if(cc == cl) return true;
	var intf = cc.__interfaces__;
	if(intf != null) {
		var _g1 = 0;
		var _g = intf.length;
		while(_g1 < _g) {
			var i = _g1++;
			var i1 = intf[i];
			if(i1 == cl || js_Boot.__interfLoop(i1,cl)) return true;
		}
	}
	return js_Boot.__interfLoop(cc.__super__,cl);
};
js_Boot.__instanceof = function(o,cl) {
	if(cl == null) return false;
	switch(cl) {
	case Int:
		return (o|0) === o;
	case Float:
		return typeof(o) == "number";
	case Bool:
		return typeof(o) == "boolean";
	case String:
		return typeof(o) == "string";
	case Array:
		return (o instanceof Array) && o.__enum__ == null;
	case Dynamic:
		return true;
	default:
		if(o != null) {
			if(typeof(cl) == "function") {
				if(o instanceof cl) return true;
				if(js_Boot.__interfLoop(js_Boot.getClass(o),cl)) return true;
			} else if(typeof(cl) == "object" && js_Boot.__isNativeObj(cl)) {
				if(o instanceof cl) return true;
			}
		} else return false;
		if(cl == Class && o.__name__ != null) return true;
		if(cl == Enum && o.__ename__ != null) return true;
		return o.__enum__ == cl;
	}
};
js_Boot.__nativeClassName = function(o) {
	var name = js_Boot.__toStr.call(o).slice(8,-1);
	if(name == "Object" || name == "Function" || name == "Math" || name == "JSON") return null;
	return name;
};
js_Boot.__isNativeObj = function(o) {
	return js_Boot.__nativeClassName(o) != null;
};
js_Boot.__resolveNativeClass = function(name) {
	return $global[name];
};
var js_html_compat_ArrayBuffer = function(a) {
	if((a instanceof Array) && a.__enum__ == null) {
		this.a = a;
		this.byteLength = a.length;
	} else {
		var len = a;
		this.a = [];
		var _g = 0;
		while(_g < len) {
			var i = _g++;
			this.a[i] = 0;
		}
		this.byteLength = len;
	}
};
js_html_compat_ArrayBuffer.__name__ = true;
js_html_compat_ArrayBuffer.sliceImpl = function(begin,end) {
	var u = new Uint8Array(this,begin,end == null?null:end - begin);
	var result = new ArrayBuffer(u.byteLength);
	var resultArray = new Uint8Array(result);
	resultArray.set(u);
	return result;
};
js_html_compat_ArrayBuffer.prototype = {
	slice: function(begin,end) {
		return new js_html_compat_ArrayBuffer(this.a.slice(begin,end));
	}
	,__class__: js_html_compat_ArrayBuffer
};
var js_html_compat_DataView = function(buffer,byteOffset,byteLength) {
	this.buf = buffer;
	if(byteOffset == null) this.offset = 0; else this.offset = byteOffset;
	if(byteLength == null) this.length = buffer.byteLength - this.offset; else this.length = byteLength;
	if(this.offset < 0 || this.length < 0 || this.offset + this.length > buffer.byteLength) throw new js__$Boot_HaxeError(haxe_io_Error.OutsideBounds);
};
js_html_compat_DataView.__name__ = true;
js_html_compat_DataView.prototype = {
	getInt8: function(byteOffset) {
		var v = this.buf.a[this.offset + byteOffset];
		if(v >= 128) return v - 256; else return v;
	}
	,getUint8: function(byteOffset) {
		return this.buf.a[this.offset + byteOffset];
	}
	,getInt16: function(byteOffset,littleEndian) {
		var v = this.getUint16(byteOffset,littleEndian);
		if(v >= 32768) return v - 65536; else return v;
	}
	,getUint16: function(byteOffset,littleEndian) {
		if(littleEndian) return this.buf.a[this.offset + byteOffset] | this.buf.a[this.offset + byteOffset + 1] << 8; else return this.buf.a[this.offset + byteOffset] << 8 | this.buf.a[this.offset + byteOffset + 1];
	}
	,getInt32: function(byteOffset,littleEndian) {
		var p = this.offset + byteOffset;
		var a = this.buf.a[p++];
		var b = this.buf.a[p++];
		var c = this.buf.a[p++];
		var d = this.buf.a[p++];
		if(littleEndian) return a | b << 8 | c << 16 | d << 24; else return d | c << 8 | b << 16 | a << 24;
	}
	,getUint32: function(byteOffset,littleEndian) {
		var v = this.getInt32(byteOffset,littleEndian);
		if(v < 0) return v + 4294967296.; else return v;
	}
	,getFloat32: function(byteOffset,littleEndian) {
		return haxe_io_FPHelper.i32ToFloat(this.getInt32(byteOffset,littleEndian));
	}
	,getFloat64: function(byteOffset,littleEndian) {
		var a = this.getInt32(byteOffset,littleEndian);
		var b = this.getInt32(byteOffset + 4,littleEndian);
		return haxe_io_FPHelper.i64ToDouble(littleEndian?a:b,littleEndian?b:a);
	}
	,setInt8: function(byteOffset,value) {
		if(value < 0) this.buf.a[byteOffset + this.offset] = value + 128 & 255; else this.buf.a[byteOffset + this.offset] = value & 255;
	}
	,setUint8: function(byteOffset,value) {
		this.buf.a[byteOffset + this.offset] = value & 255;
	}
	,setInt16: function(byteOffset,value,littleEndian) {
		this.setUint16(byteOffset,value < 0?value + 65536:value,littleEndian);
	}
	,setUint16: function(byteOffset,value,littleEndian) {
		var p = byteOffset + this.offset;
		if(littleEndian) {
			this.buf.a[p] = value & 255;
			this.buf.a[p++] = value >> 8 & 255;
		} else {
			this.buf.a[p++] = value >> 8 & 255;
			this.buf.a[p] = value & 255;
		}
	}
	,setInt32: function(byteOffset,value,littleEndian) {
		this.setUint32(byteOffset,value,littleEndian);
	}
	,setUint32: function(byteOffset,value,littleEndian) {
		var p = byteOffset + this.offset;
		if(littleEndian) {
			this.buf.a[p++] = value & 255;
			this.buf.a[p++] = value >> 8 & 255;
			this.buf.a[p++] = value >> 16 & 255;
			this.buf.a[p++] = value >>> 24;
		} else {
			this.buf.a[p++] = value >>> 24;
			this.buf.a[p++] = value >> 16 & 255;
			this.buf.a[p++] = value >> 8 & 255;
			this.buf.a[p++] = value & 255;
		}
	}
	,setFloat32: function(byteOffset,value,littleEndian) {
		this.setUint32(byteOffset,haxe_io_FPHelper.floatToI32(value),littleEndian);
	}
	,setFloat64: function(byteOffset,value,littleEndian) {
		var i64 = haxe_io_FPHelper.doubleToI64(value);
		if(littleEndian) {
			this.setUint32(byteOffset,i64.low);
			this.setUint32(byteOffset,i64.high);
		} else {
			this.setUint32(byteOffset,i64.high);
			this.setUint32(byteOffset,i64.low);
		}
	}
	,__class__: js_html_compat_DataView
};
var js_html_compat_Uint8Array = function() { };
js_html_compat_Uint8Array.__name__ = true;
js_html_compat_Uint8Array._new = function(arg1,offset,length) {
	var arr;
	if(typeof(arg1) == "number") {
		arr = [];
		var _g = 0;
		while(_g < arg1) {
			var i = _g++;
			arr[i] = 0;
		}
		arr.byteLength = arr.length;
		arr.byteOffset = 0;
		arr.buffer = new js_html_compat_ArrayBuffer(arr);
	} else if(js_Boot.__instanceof(arg1,js_html_compat_ArrayBuffer)) {
		var buffer = arg1;
		if(offset == null) offset = 0;
		if(length == null) length = buffer.byteLength - offset;
		if(offset == 0) arr = buffer.a; else arr = buffer.a.slice(offset,offset + length);
		arr.byteLength = arr.length;
		arr.byteOffset = offset;
		arr.buffer = buffer;
	} else if((arg1 instanceof Array) && arg1.__enum__ == null) {
		arr = arg1.slice();
		arr.byteLength = arr.length;
		arr.byteOffset = 0;
		arr.buffer = new js_html_compat_ArrayBuffer(arr);
	} else throw new js__$Boot_HaxeError("TODO " + Std.string(arg1));
	arr.subarray = js_html_compat_Uint8Array._subarray;
	arr.set = js_html_compat_Uint8Array._set;
	return arr;
};
js_html_compat_Uint8Array._set = function(arg,offset) {
	var t = this;
	if(js_Boot.__instanceof(arg.buffer,js_html_compat_ArrayBuffer)) {
		var a = arg;
		if(arg.byteLength + offset > t.byteLength) throw new js__$Boot_HaxeError("set() outside of range");
		var _g1 = 0;
		var _g = arg.byteLength;
		while(_g1 < _g) {
			var i = _g1++;
			t[i + offset] = a[i];
		}
	} else if((arg instanceof Array) && arg.__enum__ == null) {
		var a1 = arg;
		if(a1.length + offset > t.byteLength) throw new js__$Boot_HaxeError("set() outside of range");
		var _g11 = 0;
		var _g2 = a1.length;
		while(_g11 < _g2) {
			var i1 = _g11++;
			t[i1 + offset] = a1[i1];
		}
	} else throw new js__$Boot_HaxeError("TODO");
};
js_html_compat_Uint8Array._subarray = function(start,end) {
	var t = this;
	var a = js_html_compat_Uint8Array._new(t.slice(start,end));
	a.byteOffset = start;
	return a;
};
var js_node_ChildProcess = require("child_process");
var js_node_Fs = require("fs");
var js_node_Path = require("path");
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
platform_Platform.prototype = {
	__class__: platform_Platform
};
var $_, $fid = 0;
function $bind(o,m) { if( m == null ) return null; if( m.__id__ == null ) m.__id__ = $fid++; var f; if( o.hx__closures__ == null ) o.hx__closures__ = {}; else f = o.hx__closures__[m.__id__]; if( f == null ) { f = function(){ return f.method.apply(f.scope, arguments); }; f.scope = o; f.method = m; o.hx__closures__[m.__id__] = f; } return f; }
String.prototype.__class__ = String;
String.__name__ = true;
Array.__name__ = true;
Date.prototype.__class__ = Date;
Date.__name__ = ["Date"];
var Int = { __name__ : ["Int"]};
var Dynamic = { __name__ : ["Dynamic"]};
var Float = Number;
Float.__name__ = ["Float"];
var Bool = Boolean;
Bool.__ename__ = ["Bool"];
var Class = { __name__ : ["Class"]};
var Enum = { };
var __map_reserved = {}
var ArrayBuffer = $global.ArrayBuffer || js_html_compat_ArrayBuffer;
if(ArrayBuffer.prototype.slice == null) ArrayBuffer.prototype.slice = js_html_compat_ArrayBuffer.sliceImpl;
var DataView = $global.DataView || js_html_compat_DataView;
var Uint8Array = $global.Uint8Array || js_html_compat_Uint8Array._new;
features_CompletionHandler.reI = new EReg("<i n=\"([^\"]+)\" k=\"([^\"]+)\"( ip=\"([0-1])\")?( f=\"(\\d+)\")?><t>([^<]*)</t><d>([^<]*)</d></i>","");
features_CompletionHandler.reGT = new EReg("&gt;","g");
features_CompletionHandler.reLT = new EReg("&lt;","g");
features_CompletionHandler.reMethod = new EReg("Void|Unknown","");
features_DefinitionHandler.rePos = new EReg("[^<]*<pos>(.+)</pos>.*","");
features_SignatureHandler.reType = new EReg("<type(\\s+opar='(\\d+)')?(\\s+index='(\\d+)')?>","");
features_SignatureHandler.reGT = new EReg("&gt;","g");
features_SignatureHandler.reLT = new EReg("&lt;","g");
haxe_Info.reWin = new EReg("^\\w+:\\\\","");
haxe_Info.re1 = new EReg("^((\\w+:\\\\)?([^:]+)):(\\d+):\\s*([^:]+)(:(.+))?","");
haxe_Info.re2 = new EReg("^((character[s]?)|(line[s]?))\\s+(\\d+)(\\-(\\d+))?","");
haxe_HaxeClient.reVersion = new EReg("(\\d+).(\\d+).(\\d+)(.+)?","");
haxe_io_FPHelper.i64tmp = (function($this) {
	var $r;
	var x = new haxe__$Int64__$_$_$Int64(0,0);
	$r = x;
	return $r;
}(this));
js_Boot.__toStr = {}.toString;
js_html_compat_Uint8Array.BYTES_PER_ELEMENT = 1;
})(typeof window != "undefined" ? window : exports, typeof window != "undefined" ? window : typeof global != "undefined" ? global : typeof self != "undefined" ? self : this);
