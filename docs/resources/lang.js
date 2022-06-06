/*
	Language Updater - updates Liquid/Jekyll style variables
	Version 0.3
*/
(function(root){
	
	if(!root.ready){
		root.ready = function(fn){
			// Version 1.1
			if(document.readyState != 'loading') fn();
			else document.addEventListener('DOMContentLoaded', fn);
		};
	}

	function Lang(opt){

		this.lang = (navigator ? (navigator.userLanguage||navigator.systemLanguage||navigator.language||browser.language) : "en");
		var _obj = this;
		var p = /.*[\?\&]lang=([a-zA-Z\-]+).*$/;
		if(location.search.match(p)) this.lang = location.search.replace(p,function(m,p1){ return p1; });
		if(!opt) opt = {};
		if(!opt.default) opt.default = "en";
		if(!opt.dir) opt.dir = "";
		if(!opt.files) opt.files = {};
		if(!opt.files.languages) opt.files.languages = "languages.yml";
		if(!opt.files.translations) opt.files.translations = "translations.yml";

		function init(){
			console.info('Lang.getLanguages');
			fetch(opt.dir+opt.files.languages).then(response => {
				if(!response.ok) throw new Error('Network response was not OK');
				return response.text();
			}).then(txt => {
				//this._languages = txt;
				_obj.languages = YAML.eval(txt);
				// If the language code doesn't exist check if a version of it without a hyphen exists
				if(!_obj.languages[_obj.lang] && _obj.lang.indexOf("-") > 0) _obj.lang = _obj.lang.replace(/\-.*/g,"");
				// If it still doesn't exist try the default language (English)
				if(!_obj.languages[_obj.lang]) _obj.lang = opt.default;
				// If the language code exists we update
				if(_obj.languages[_obj.lang]){
					_obj.updatePicker();
					_obj.getLanguageData();
				}
			}).catch(error => {
				console.error('There has been a problem getting '+opt.dir+opt.files.languages+':', error);
			});
			return _obj;
		};
		this.updatePicker = function(){
			if(opt.picker){
				var sel = "";
				for(var lang in _obj.languages) sel += '<option lang="'+lang+'" value="'+lang+'"'+(lang==_obj.lang ? ' selected' : '')+'>'+_obj.languages[lang].label+'</option>';
				el = document.getElementById(opt.picker);
				if(el){
					el.innerHTML = sel;
					el.focus();
					el.addEventListener('change',function(e){ _obj.setLanguage(e.currentTarget.value); });
				}
			}
		};
		this.getLanguageData = function(){
			console.info('Lang.getLanguageData');
			fetch(opt.dir+opt.files.translations).then(response => {
				if(!response.ok) throw new Error('Network response was not OK');
				return response.text();
			}).then(txt => {
				this.translations = YAML.eval(txt);
				this.setLanguage(this.lang);
			}).catch(error => {
				console.error('There has been a problem getting '+opt.dir+opt.files.translations+':', error);
			});
			return this;
		};
		function cleanUp(str){
			var lvl = 0;
			var matches = [''];
			var depth = 0;
			for(var i = 0; i < str.length; i++){
				if(str[i] == "[") lvl++;
				if(lvl >= 1) matches[matches.length-1] += str[i];
				if(str[i] == "]"){
					lvl--;
					if(lvl==0 && i < str.length-1) matches.push('');
				}
				depth = lvl;
			}
			for(i = 0; i < matches.length; i++){
				if(matches[i].match(/^\[(text|data)\./)){
					str = str.replace(matches[i],matches[i].replace(/^\[/,".").replace(/\]$/,""));
				}
			}
			return str;
		}
		this.getKey = function(txt){
			var site = {'translations':this.translations,'lang':this.lang};
			var rtxt;
			txt = cleanUp(txt);
			try{
				rtxt = eval(txt);
				if(typeof rtxt==="string") txt = rtxt;
				else{
					rtxt = eval(txt.replace(/\[site.lang\]/,"\."+(this.languages[this.lang] && this.languages[this.lang].inherit ? this.languages[this.lang].inherit : opt.default)));
					if(rtxt) txt = rtxt;
				}
			}catch(err){
				console.error('Value of '+txt+' does not evaluate.');
				txt = "";
			}
			if(txt){
				txt = txt.replace(/\\n/g,"<br />");
			}
			return txt;
		}
		this.setLanguage = function(lang){
			var i,rtxt,els,site;
			this.lang = lang||this.lang;
			console.info('Lang.setLanguage',lang,this.lang);
			site = {'translations':this.translations,'lang':lang};
			els = document.querySelectorAll('[data-translate]');
			for(i = 0; i < els.length; i++){
				txt = els[i].getAttribute('data-translate');
				tgt = els[i].getAttribute('data-translate-attr');
				txt = this.getKey(txt);
				if(txt){
					if(tgt){
						els[i].setAttribute(tgt,txt);
					}else{
						if(els[i].ownerSVGElement){
							//els[i].textContent = txt;
							els[i].innerHTML = txt.replace(/\^\{([0-9]*)\}/,function(m,p1){ return '<tspan dy="-0.4em" font-size="0.7em">'+p1+'</tspan>'; });
						}else{
							els[i].innerHTML = txt.replace(/\^\{([0-9]*)\}/,function(m,p1){ return '<sup>'+p1+'</sup>'; });
						}
					}
					els[i].setAttribute('lang',this.lang);
				}
			}
			
			if(opt && typeof opt.ready==="function") ready(function(){ _obj.updatePicker(); opt.ready.call(_obj); });
			
			return this;
		};

		init();
		return this;
	}

	root.Lang = Lang;


	/**
	YAML parser for Javascript
	Author: Diogo Costa

	This program is released under the MIT License as follows:

	Copyright (c) 2011 Diogo Costa (costa.h4evr@gmail.com)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	 of this software and associated documentation files (the "Software"), to deal
	 in the Software without restriction, including without limitation the rights
	 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 copies of the Software, and to permit persons to whom the Software is
	 furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	 all copies or substantial portions of the Software.

	YAML.fromURL(string,function)
	  - string = src URL from where to load the YAML file
	  - function = called when the file is parsed with the result passed as an argument.
	YAML.eval(string)
	  - string = string with the YAML contents
	YAML.getErrors()
	YAML.getProcessingTime()
	*/
	var YAML=function(){var e=[],n=[],t=0,r={regLevel:new RegExp("^([\\s\\-]+)"),invalidLine:new RegExp("^\\-\\-\\-|^\\.\\.\\.|^\\s*#.*|^\\s*$"),dashesString:new RegExp('^\\s*\\"([^\\"]*)\\"\\s*$'),quotesString:new RegExp("^\\s*\\'([^\\']*)\\'\\s*$"),float:new RegExp("^[+-]?[0-9]+\\.[0-9]+(e[+-]?[0-9]+(\\.[0-9]+)?)?$"),integer:new RegExp("^[+-]?[0-9]+$"),array:new RegExp("\\[\\s*(.*)\\s*\\]"),map:new RegExp("\\{\\s*(.*)\\s*\\}"),key_value:new RegExp("([a-z0-9_-][ a-z0-9_-]*):( .+)","i"),single_key_value:new RegExp("^([a-z0-9_-][ a-z0-9_-]*):( .+?)$","i"),key:new RegExp("([a-z0-9_-][ a-z0-9_-]+):( .+)?","i"),item:new RegExp("^-\\s+"),trim:new RegExp("^\\s+|\\s+$"),comment:new RegExp("([^\\'\\\"#]+([\\'\\\"][^\\'\\\"]*[\\'\\\"])*)*(#.*)?")};function i(e){return{parent:null,length:0,level:e,lines:[],children:[],addChild:function(e){this.children.push(e),e.parent=this,++this.length}}}function l(e){var n=null;if("true"==(e=e.replace(r.trim,"")))return!0;if("false"==e)return!1;if(".NaN"==e)return Number.NaN;if("null"==e)return null;if(".inf"==e)return Number.POSITIVE_INFINITY;if("-.inf"==e)return Number.NEGATIVE_INFINITY;if(n=e.match(r.dashesString))return n[1];if(n=e.match(r.quotesString))return n[1];if(n=e.match(r.float))return parseFloat(n[0]);if(n=e.match(r.integer))return parseInt(n[0]);if(isNaN(n=Date.parse(e))){if(n=e.match(r.single_key_value))return(u={})[n[1]]=l(n[2]),u;if(n=e.match(r.array)){for(var t=0,i=" ",u=[],a="",s=!1,f=0,h=n[1].length;f<h;++f){if("'"==(i=n[1][f])||'"'==i){if(!1===s){s=i,a+=i;continue}if("'"==i&&"'"==s||'"'==i&&'"'==s){s=!1,a+=i;continue}}else if(!1!==s||"["!=i&&"{"!=i)if(!1!==s||"]"!=i&&"}"!=i){if(!1===s&&0==t&&","==i){u.push(l(a)),a="";continue}}else--t;else++t;a+=i}return a.length>0&&u.push(l(a)),u}if(n=e.match(r.map)){for(t=0,i=" ",u=[],a="",s=!1,f=0,h=n[1].length;f<h;++f){if("'"==(i=n[1][f])||'"'==i){if(!1===s){s=i,a+=i;continue}if("'"==i&&"'"==s||'"'==i&&'"'==s){s=!1,a+=i;continue}}else if(!1!==s||"["!=i&&"{"!=i)if(!1!==s||"]"!=i&&"}"!=i){if(!1===s&&0==t&&","==i){u.push(a),a="";continue}}else--t;else++t;a+=i}a.length>0&&u.push(a);var o={};for(f=0,h=u.length;f<h;++f)(n=u[f].match(r.key_value))&&(o[n[1]]=l(n[2]));return o}return e}return new Date(n)}function u(e){for(var n=e.lines,t=e.children,r=[n.join(" ")],i=0,l=t.length;i<l;++i)r.push(u(t[i]));return r.join("\n")}function a(e){for(var n=e.lines,t=e.children,r=n.join("\n"),i=0,l=t.length;i<l;++i)r+=a(t[i]);return r}function s(t){return function t(i){for(var s=null,f={},h=null,o=null,c=null,p=-1,g=[],v=!0,d=0,m=i.length;d<m;++d)if(-1==p||p==i[d].level){g.push(d),p=i[d].level,h=i[d].lines,o=i[d].children,c=null;for(var w=0,E=h.length;w<E;++w){var T=h[w];if(s=T.match(r.key)){var L=s[1];if("-"==L[0]&&(L=L.replace(r.item,""),v&&(v=!1,void 0===f.length&&(f=[])),null!=c&&f.push(c),c={},v=!0),void 0!==s[2]){var M=s[2].replace(r.trim,"");if("&"==M[0]){var R=t(o);null!=c?c[L]=R:f[L]=R,n[M.substr(1)]=R}else if("|"==M[0])null!=c?c[L]=a(o.shift()):f[L]=a(o.shift());else if("*"==M[0]){var x=M.substr(1),y={};if(void 0===n[x])e.push("Reference '"+x+"' not found!");else{for(var N in n[x])y[N]=n[x][N];null!=c?c[L]=y:f[L]=y}}else">"==M[0]?null!=c?c[L]=u(o.shift()):f[L]=u(o.shift()):null!=c?c[L]=l(M):f[L]=l(M)}else null!=c?c[L]=t(o):f[L]=t(o)}else{if(T.match(/^-\s*$/)){v&&(v=!1,void 0===f.length&&(f=[])),null!=c&&f.push(c),c={},v=!0;continue}if(s=T.match(/^-\s*(.*)/)){null!=c?c.push(l(s[1])):(v&&(v=!1,void 0===f.length&&(f=[])),f.push(l(s[1])));continue}}}null!=c&&(v&&(v=!1,void 0===f.length&&(f=[])),f.push(c))}for(d=g.length-1;d>=0;--d)i.splice.call(i,g[d],1);return f}(t.children)}return{fromURL:function(e,n){console.log("fromURL",e);var t=function(){var e;try{e=new XMLHttpRequest}catch(i){for(var n=new Array("MSXML2.XMLHTTP.5.0","MSXML2.XMLHTTP.4.0","MSXML2.XMLHTTP.3.0","MSXML2.XMLHTTP","Microsoft.XMLHTTP"),t=!1,r=0;r<n.length&&!t;r++)try{e=new ActiveXObject(n[r]),t=!0}catch(e){}if(!t)throw new Error("Unable to create XMLHttpRequest.")}return e}();t.onreadystatechange=function(){if(4==this.readyState&&200==this.status){var e=this.responseText;n(YAML.eval(e))}},t.overrideMimeType("text/plain"),t.open("GET",e),t.send()},eval:function(l){e=[],n=[],t=(new Date).getTime();var u=s(function(n){var t,l=r.regLevel,u=r.invalidLine,a=n.split("\n"),s=0,f=0,h=[],o=new i(-1),c=new i(0);o.addChild(c);var p=[],g="";h.push(c),p.push(s);for(var v=0,d=a.length;v<d;++v)if(!(g=a[v]).match(u)){if((s=(t=l.exec(g))?t[1].length:0)>f){var m=c;c=new i(s),m.addChild(c),h.push(c),p.push(s)}else if(s<f){for(var w=!1,E=p.length-1;E>=0;--E)if(p[E]==s){c=new i(s),h.push(c),p.push(s),null!=h[E].parent&&h[E].parent.addChild(c),w=!0;break}if(!w)return void e.push("Error: Invalid indentation at line "+v+": "+g)}c.lines.push(g.replace(r.trim,"")),f=s}return o}(function(e){var n,t=e.split("\n"),i=r.comment;for(var l in t)(n=t[l].match(i))&&void 0!==n[3]&&(t[l]=n[0].substr(0,n[0].length-n[3].length));return t.join("\n")}(l)));return t=(new Date).getTime()-t,u},getErrors:function(){return e},getProcessingTime:function(){return t}}}();

})(window || this);
