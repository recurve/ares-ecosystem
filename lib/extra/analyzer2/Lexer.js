//* @protected
enyo.kind({
	name: "analyzer.AbstractLexer",
	kind: null,
	constructor: function(inText) {
		if (inText) {
			this.start(inText);
			this.finish();
			return this.r;
		}
	},
	p0: 0,
	p: 0,
	start: function(inS) {
		this.s = inS;
		this.l = this.s.length;
		this.r = [ ];
		this.d = '';
		this.p0 = 0;
		this.p = 0;
		this.n = 0;
		this.analyze();
	},
	//
	// analyze() is abstract
	//
	search: function(inRegEx) {
		// make sure inRegEx has global flag
		var r = inRegEx.global ? inRegEx : new RegExp(inRegEx.source, "g");
		// install our search position
		r.lastIndex = this.p;
		// accumulate characters until we match some delimiter
		this.m = r.exec(this.s);
		// m.index is the 0-based index of the match
		this.p = this.m ? this.m.index : -1;
		// p0 marks the start of unconsumed characters
		// p marks the start of the new delimeter
		//   <token><delimeter>
		// p0<----->p
		// d is the first character of <delimeter>, return d, or null if no matches
		return (r.lastIndex != this.p0) && (this.d = this.s.charAt(this.p));
	},
	// examine the character inCount ahead of the current position
	lookahead: function(inCount) {
		return this.s.charAt(this.p + inCount);
	},
	// extract the token between positions p0 and p1
	getToken: function() {
		return this.s.slice(this.p0, this.p);
	},
	// move the position (p) by inCount characters (i.e. add inCount characters to token)
	tokenize: function(inCount) {
		this.p += inCount || 0;
	},
	// push a token with kind: inKind
	// inD (optional) specifies a number of characters to add to the token before pushing
	// inAllowEmpty: unless true, 0 length tokens are a no-op
	pushToken: function(inKind, inCount, inAllowEmpty) {
		// move the position (p) by inCount characters (i.e. add inCount characters to token)
		this.tokenize(inCount);
		// copy the token between p0 and p
		var token = this.getToken();
		// if the token is empty string, immediately return an empty object
		if (!token && !inAllowEmpty) {
			return {};
		}
		// counting newlines?
		var nLines = (token.match(/\n/g) || []).length;
		// make a token object with lots of meta-data
		var mToken = { kind: inKind, token: token, start: this.p0, end: this.p, line: this.n, height: nLines };
		// push the token descriptor onto the result stack
		this.r.push(mToken);
		// accumulate line count
		this.n += nLines;
		// bump the starting position pointer
		this.p0 = this.p;
		// return the token descriptor
		return mToken;
	},
	// inD (optional) specifies a number of characters to add to the token before tossing
	tossToken: function(inCount) {
		// move the position (p) by inCount characters (i.e. add inCount characters to token)
		this.tokenize(inCount);
		// bump the starting position pointer
		this.p0 = this.p;
	},
	finish: function() {
		// FIXME: what did this do?
		//this.t += this.s;
		// FIXME: if there is left over text, push it as 'gah' type
		this.pushToken("gah");
	}
});

enyo.kind({
	name: "analyzer.Lexer",
	kind: analyzer.AbstractLexer,
	symbols: "(){}[];,:<>+-=*/&",
	operators: [ "++", "--", "+=", "-=", "==", "!=", "<=", ">=", "===", "&&", "||", '"', "'"],
	keywords: [ "function", "new", "return", "if", "else", "while", "do", "break", "continue", "switch", "case", "var" ],
	constructor: function(inText) {
		this.buildPattern();
		return this.inherited(arguments);
	},
	buildPattern: function() {
		// match an inline regex
		var rregex = "\\/[^\/*[](?:[^\\/\\\\\\r\n]|\\\\.)+\\/\\w*";
		//
		// matches double-quoted string that may contain escaped double-quotes
		var rstring1 = '"(?:\\\\"|[^"])*?"';
		// matches single-quoted string that may contain escaped single-quotes
		var rstring2 = "'(?:\\\\'|[^'])*?'";
		// matches either type of string
		var rstring = rstring1 + "|" + rstring2;
		//
		// matches any of the keywords (\b only matches on word boundaries)
		var rkeys = '\\b(?:' + this.keywords.join('|') + ')\\b';
		//
		// match symbols and operators (code here escapes the symbol characters for use in regex)
		var rsymbols = '[\\' + this.symbols.split('').join('\\') + ']';
		var rops = [];
		for (var i=0, o; (o=this.operators[i]); i++) {
			rops.push('\\' + o.split('').join('\\'));
		}
		rops = rops.join('|');
		//rsymbols += '|' + rops;
		// match rops first (greedy, "<=" instead of "<", "=")
		rsymbols = rops + "|" + rsymbols;
		//console.log(rsymbols);
		//
		// these are all the patterns to match
		//var matches = [rstring1, rstring2, rkeys, '\\/\\/', '\\/\\*', /*rregex,*/ rsymbols, "'\"", '\\s'];
		// these are the matching methods corresponding to the patterns above
		//this.matchers = ["doString", "doString", "doKeyword", "doLineComment", "doCComment", /*"doRegExp",*/ "doSymbol", "doLiteral", "doWhitespace"];
		//
		//
		// these are the patterns to match
		// match escape sequences \" and \/ first to help defray confusion
		var matches = ["\\\\\"|\\\\/", rregex, rstring, rkeys, '\\/\\/', '\\/\\*', rsymbols, "\\s"];
		// these are the matching methods corresponding to the patterns above
		this.matchers = ["doSymbol", "doRegex", "doString", "doKeyword", "doLineComment", "doCComment", "doSymbol", "doWhitespace"];
		//
		//
		// construct the master regex as a union of the patterns above
		this.pattern = '(' + matches.join(')|(') + ')';
		//console.log(this.pattern);
	},
	analyze: function() {
		var regex = new RegExp(this.pattern, "gi");
		
		/**
			Aaron Rosenzweig - June 11, 2016
			There was a problem with Deimos (Interface Builder in Ares) where in the latest 
			versions of Firefox and Chrome they would fail to parse and fail to work. 
			The user would be face with a cryptic error message when they hovered over the 
			icon to open your Enyo component in the GUI. Safari did not have a problem.
			
			As it turns out, inside of Analyzer2 (where this Lexer.js resides) there is 
			an examples folder with a "test.html" which allows you to see if a minimal 
			Enyo Kind can be parsed. Safari had no problem with this but Firefox and Chrome 
			got stuck in an infinite loop.
			
			Because Ares launches the Analyzer asynchronously, I believe the infinite loop 
			scenario must bomb out pretty fast some how, hit some sort of time limit, 
			I'm not sure. What I am sure of is that it improperly parsed the Enyo component 
			you wanted to use and everything went south (in FF and Chrome, Safari was fine).
			
			Turns out the fix is right here, in the "analyze" function. For Firefox and Chrome
			the "search" on the regex would cause the "lastIndex" to start over again at zero. 
			By merely adding some housekeeping to catch this "restart" condition everything 
			now works in all three browsers. 
		*/
		var lastIndex = 0;
		while (regex.lastIndex >= lastIndex && this.search(regex)) {
			if (regex.lastIndex > lastIndex) {
				lastIndex = regex.lastIndex;
			} else {
				lastIndex += 1;
			}
			// any characters between where we were and the latest delimeter we call an identifier
			this.pushToken("identifier");
			// process the input stream based on the matched delimeter
			this.process(this.matchers);
			// any characters between where we were and the latest delimeter we call an identifier
			this.pushToken("identifier");
		}
	},
	process: function(inMatchers) {
		for (var i=0, f; (f=inMatchers[i]); i++) {
			if (this.m[i+1] && this[f]) {
				this[f].apply(this);
				return;
			}
		}
		this.doSymbol();
	},
	doWhitespace: function() {
		// we saw at least one ws character, so consume it
		this.tokenize(1);
		// consume any additional whitespace (i.e. all characters up to the first non-ws [\S])
		this.search(/\S/g);
		// push all such characters as a ws token
		this.pushToken('ws');
		// remove the actual token (don't capture whitespace)
		this.r.pop();
	},
	doEscape: function() {
		this.tokenize(2);
	},
	doLiteral: function() {
		this.tossToken(1);
		var delim = this.d;
		var rx = new RegExp("\\" + delim + "|\\\\", "g");
		while (this.search(rx)) {
			switch (this.d) {
			case '\\':
				this.doEscape();
				break;
			default:
				this.pushToken('literal', 0, true).delimiter = delim;
				this.tossToken(1);
				return;
			}
		}
	},
	doSymbol: function() {
		this.pushToken((this.d==';' || this.d==',') ? "terminal" : "symbol", this.m[0].length);
	},
	doKeyword: function() {
		this.pushToken("keyword", this.m[0].length);
	},
	doLineComment: function() {
		this.tokenize(2);
		if (this.search(/[\r\n]/g)) {
			this.tokenize(0);
		}
		this.pushToken("comment");
	},
	doCComment: function() {
		this.tokenize(2);    // consume '/*'
		this.search(/\*\//); // search for next '*/'
		this.tokenize(2);    // consume '*/'
		this.pushToken("comment");
	},
	doString: function() {
		this.pushToken("string", this.m[0].length);
	},
	doRegex: function() {
		this.pushToken("regex", this.m[0].length);
	}
});
