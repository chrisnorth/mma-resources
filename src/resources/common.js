(function(root){
	
	if(!root.ready){
		root.ready = function(fn){
			// Version 1.1
			if(document.readyState != 'loading') fn();
			else document.addEventListener('DOMContentLoaded', fn);
		};
	}

})(window || this);

function Notification(){
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

		var q = '?event='+this.vals.event;
		if(this.vals.gridsquares) q += '&gridsquares='+this.vals.gridsquares;
		if(this.vals.toffset) q += '&toffset='+this.vals.toffset;
		if(this.vals.mass && !isNaN(this.vals.mass[0])) q += '&mass='+this.vals.mass.join(';');
		if(this.vals.dist && !isNaN(this.vals.dist[0])) q += '&dist='+this.vals.dist.join(';');
		if(this.vals.massratio && !isNaN(this.vals.massratio[0])) q += '&massratio='+this.vals.massratio.join(';');
		if(this.vals.inc && !isNaN(this.vals.inc[0])) q += '&inc='+this.vals.inc.join(';');
		if(extra) q += '&extra='+extra;
		return q;
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
		this.attr = {
			'name': selection.event||"",
			'date': selection.ev.datetime||"",
			'locations': decodeURI(selection.gridsquares),
			'mass': (selection.mass && selection.mass[1] ? selection.mass[0] + ' - ' + selection.mass[1] : ''),
			'massratio': (selection.massratio && selection.massratio[1] ? selection.massratio[0] + ' - ' + selection.massratio[1] : ''),
			'distance': (selection.dist && selection.dist[1] ? selection.dist[0] + ' - ' + selection.dist[1] : ''),
			'inclination': (selection.inc && selection.inc[1] ? selection.inc[0] + ' - ' + selection.inc[1] : ''),
			'extra': selection.extra||extra
		};

		var _obj = this;

		// Update notification replacements - match entire line that has a replacement value
		var str = original.replace(/([^\n]*)\{\{ ([^\}]+) \}\}([^\n]*)\n/g,function(m,p1,p2,p3){
			if(_obj.attr[p2]){
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
var query = {};
var qs = location.search.substr(1);
qs = qs.split(/\&/);
for(var i = 0; i < qs.length; i++){
	qs[i] = qs[i].split(/=/);
	query[qs[i][0]] = qs[i][1];
}