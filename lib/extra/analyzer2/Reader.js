enyo.kind({
	name: "analyzer.Reader",
	kind: enyo.Async,
	go: function(inData) {
		this.modules = inData.modules;
		this.designs = inData.designs;
		this.files = inData.modules.concat(inData.designs);
		enyo.asyncMethod(this, "nextFile");
		return this;
	},
	nextFile: function() {
		var f = this.files.shift();
		if (f) {
			this.loadFile(f);
		} else {
			this.filesFinished();
		}
	},
	loadFile: function(inFile) {
		enyo.xhr.request({
			url: inFile.path,
			callback: this.bindSafely("fileLoaded", inFile)
		});
	},
	fileLoaded: function(inFile, inCode, xhr) {
		var code = inCode;
		var striped = "";
			
		if(inFile.path.search("onyx") != 1 || inFile.path.search("layout") != 1){
			inCode = "";
			for (var l = 0; l <= code.length; l++ ){
				if(code.charAt(l) === "/" && code.charAt(l+1) === "*"){
					for (l ; l <= code.length; l++ ){	
						striped = striped + code.charAt(l);			// strip here
						if(code.charAt(l) === "*" && code.charAt(l+1) === "/"){			// stop strip here if we find *?
							striped = striped + code.charAt(l) + code.charAt( l+ 1);  // add the last two char
							l++;
							
							if (striped.search("@lends") != -1){
								striped = "";
							}else{
								inCode = inCode + striped;
								striped = "";
							}
							break;
						}	
					}
				}else{
					inCode = inCode + code.charAt(l);
				}	
			}
		}	
		if(inFile.path.search("boot") === 1 ){
		}
		
		if (xhr.status >= 200 && xhr.status < 300) {
			this.addFile(inFile, inCode);
		}
		else {
			this.fail("Analyser cannot read " + inFile.path + ": " + xhr.status + ' ' + xhr.statusText);
		}
		this.nextFile();
	},
	addFile: function(inFile, inCode) {
		if (inCode && inCode.length) {
			inFile.code = inCode;
		}
	},
	filesFinished: function() {
		this.respond({modules: this.modules, designs: this.designs});
	}
});
