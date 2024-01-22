(function(root){
	
	if(!root.ready){
		root.ready = function(fn){
			// Version 1.1
			if(document.readyState != 'loading') fn();
			else document.addEventListener('DOMContentLoaded', fn);
		};
	}

})(window || this);

function EventNotification(opt){
	if(!opt) opt = {};
	this.attr = {};
	var el = {
		'notification': document.getElementById('event-notification'),
		'textarea': document.querySelector('#event-notification textarea'),
		'step': document.getElementById('step'),
		'copy': document.getElementById('event-copy'),
		'show': document.getElementById('show-notification'),
		'back': document.getElementById('show-steps'),
		'cosmo': document.getElementById('cosmocalc'),
		'nav': document.querySelector('nav .nav-inner'),
		'breadcrumb': document.querySelector('.breadcrumb')
	};
	var original = el.textarea.innerHTML;

	var _obj = this;
	el.show.addEventListener('click',function(){ _obj.show(); });
	el.back.addEventListener('click',function(){ _obj.hide(); });

	// Copy the notification to the clipboard
	el.copy.addEventListener('click',function(e){
		var ta = el.notification.querySelector('textarea');
		ta.select();
		ta.setSelectionRange(0, 99999); /* For mobile devices */
		navigator.clipboard.writeText(ta.value);
	});
	this.queryString = function(){
		v = el.notification.querySelector('textarea').value;
		var extra = '';
		if(v.match(/\={10,}/)) v.replace(/^.*\={10,}\n(.*)$/m,function(m,p1){ extra = p1; });

		var q = "";
		q = (typeof opt.queryString==="function") ? opt.queryString.call(this,extra) : '?';
		return q;
	};
	this.clear = function(){
		this.vals = {};
		this.attr = {};
		this.set({});
		return this;
	};
	this.set = function(selection,required){
		var str,key,v,rep;
		str = '';
		v = el.notification.querySelector('textarea').value;
		var extra = '';
		if(v.match(/\={10,}/)) v.replace(/^.*\={10,}\n(.*)$/m,function(m,p1){ extra = p1; });

		if(!selection) selection = {};
		if(!selection.ev) selection.ev = {};

		this.vals = selection;
		if(typeof opt.setAttr==="function"){
			this.attr = opt.setAttr.call(this,selection,extra);
		}else{
			this.attr = {};
		}

		var _obj = this;

		// Update notification replacements - match entire line that has a replacement value
		var str = original.replace(/([^\n]*)\{\{ ([^\}]+) \}\}([^\n]*)\n/g,function(m,p1,p2,p3){
			if(location.search.indexOf('debug')>=0) console.log(p1,p2,p3,_obj.attr);
			if(_obj.attr[p2] || (typeof _obj.attr[p2]==="number" && !isNaN(_obj.attr[p2]))){
				// If we have a replacement value, replace it in the line
				return (p1+_obj.attr[p2]+p3)+"\n";
			}else{
				// Replace the line with nothing
				return "";
			}
		});
		str += decodeURI(this.attr.extra);

		el.notification.querySelector('textarea').value = str;
		return this;
	};
	this.getExtra = function(){
		v = el.textarea.value;
		var extra = '';
		if(v.match(/\={10,}\n(.*)$/)) v.replace(/^.*\={10,}\n(.*)$/m,function(m,p1){ extra = p1; });
		return extra;
	}
	el.notification.querySelector('textarea').addEventListener('keyup',function(e){
		var extra = _obj.getExtra();
	});
	this.show = function(){
		el.notification.style.display = '';
		el.step.style.display = 'none';
		el.breadcrumb.style.display = 'none';
		el.show.style.display = 'none';
		el.nav.style.display = 'none';
		// Set the focus to the text area of the notification
		el.notification.querySelector('textarea').focus();
		return this;
	};
	this.hide = function(){
		el.notification.style.display = 'none';
		el.step.style.display = '';
		el.breadcrumb.style.display = '';
		el.show.style.display = '';
		el.nav.style.display = '';
		return this;
	};
	this.hide();
	return this;
}

// updateFromTemplate('string goes here with replacement values in double curly brackets',{'key':'value'})
function updateFromTemplate(txt,rep){
	var key,reg;
	for(key in rep){
		if(rep[key]){
			reg = new RegExp('\{\{\\s*'+key+'\\s*\}\}');
			txt = txt.replace(reg,rep[key]);
		}
	}
	// Loop back over in case we've got patterns within our patterns 
	for(key in rep){
		if(rep[key]){
			reg = new RegExp('\{\{\\s*'+key+'\\s*\}\}');
			txt = txt.replace(reg,rep[key]);
		}
	}
	// Remove all unreplaced tags
	txt = txt.replace(/\{\{\s*[^\}]*\s*\}\}/g,"");
	txt = txt.replace(/<p><\/p>/g,"");
	txt = txt.replace(/\n\t*\n/g,"\n");
	txt = txt.replace(/\\n/g,"<br />");
	return txt;
}
function parseCSV(str) {
	var lines = str.split(/\n/g);
	var rows = [];
	var r,i,c;
	for(i = 1; i < lines.length; i++){
		if(lines[i] != ""){
			rows.push(lines[i].split(/,/g));
			r = rows.length-1;
			for(c = 0; c < rows[r].length; c++) rows[r][c] = parseFloat(rows[r][c]);
		}
	}
	return rows;
}
function errorMessage(msg,error){
	console.error(msg,error);
	var el = document.getElementById('error-message');
	if(!el){
		el = document.createElement('div');
		el.style = 'background:#FFBABA;color:#D8000C;padding:0.5em;position:fixed;bottom:0;left:0;right:0;text-align:center;';
		document.body.appendChild(el);
	}
	el.innerHTML = '<span style="border-radius:100%;width:1em;height:1em;line-height:1em;margin-right:0.5em;display:inline-block;background:#D8000C;color:white;">&times;</span>'+msg;
}
function roundTo(v,to){
	return Math.round(v/to)*to;
}
function getQueryString(){
	// Version 1.1
	var qs = location.search.substr(1);
	qs = qs.split(/\&/);
	var idx,key,i,query = {};
	for(i = 0; i < qs.length; i++){
		idx = qs[i].indexOf("=");
		key = qs[i].substr(0,idx);
		query[key] = qs[i].substr(idx+1,);
	}
	return query;
}
var query = getQueryString();
