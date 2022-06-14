var language,steps,colours,scales;


colours = new Colours();
scales = {
	'Viridis8': 'rgb(122,76,139) 0, rgb(124,109,168) 12.5%, rgb(115,138,177) 25%, rgb(107,164,178) 37.5%, rgb(104,188,170) 50%, rgb(133,211,146) 62.5%, rgb(189,229,97) 75%, rgb(254,240,65) 87.5%, rgb(254,240,65) 100%',
	'Heat': 'rgb(0,0,0) 0%, rgb(128,0,0) 25%, rgb(255,128,0) 50%, rgb(255,255,128) 75%, rgb(255,255,255) 100%',
	'Planck': 'rgb(0,0,255) 0, rgb(0,112,255) 16.666%, rgb(0,221,255) 33.3333%, rgb(255,237,217) 50%, rgb(255,180,0) 66.666%, rgb(255,75,0) 100%',
	'Plasma': 'rgb(12,7,134) 0, rgb(82,1,163) 12.5%, rgb(137,8,165) 25%, rgb(184,50,137) 37.5%, rgb(218,90,104) 50%, rgb(243,135,72) 62.5%, rgb(253,187,43) 75%, rgb(239,248,33) 87.5%'
}
for(s in scales) colours.addScale(s,scales[s]);

function Steps(data){
	var step = 0;
	var selections = {'event':'','date':'','gridsquares':[],'mass':[],'distance':[],'massratio':[],'inclination':[],'waveform':''};
	var el = {
		'breadcrumb': document.querySelector('.breadcrumb'),
		'event': document.getElementById('select-event'),
		'notification': document.getElementById('event-notification'),
		'copy': document.getElementById('event-copy'),
		'waveform1': document.getElementById('waveform1'),
		'waveform3': document.getElementById('waveform3'),
		'waveform4': document.getElementById('waveform4'),
		'gridsquares': document.getElementById('grid-squares'),
		'nav': document.querySelector('nav .nav-inner'),
		'prev': document.getElementById('prev'),
		'btnNotify': document.getElementById('show-notification'),
		'btnSteps': document.getElementById('show-steps'),
		'next': document.getElementById('next'),
		'massLo': document.getElementById('mass-lo'),
		'massHi': document.getElementById('mass-hi'),
		'massratioLo': document.getElementById('massratio-lo'),
		'massratioHi': document.getElementById('massratio-hi'),
		'distLo': document.getElementById('dist-lo'),
		'distHi': document.getElementById('dist-hi'),
		'incLo': document.getElementById('inc-lo'),
		'incHi': document.getElementById('inc-hi'),
		'cosmo': document.getElementById('cosmocalc')
	};
	var grids = new GridMaps({
		'input':document.getElementById('grid-squares'),
		'el':document.getElementById('localisation'),
		'this':this
	});
	var nav = el.breadcrumb.querySelectorAll('li');
	var steps = [
		{'id':'step-1'},
		{'id':'step-2','ready':function(){ return (selections.event && selections.date); } },
		{'id':'step-3','ready':function(){ return (selections.event && selections.date && selections.gridsquares.length > 0); }},
		{'id':'step-4','ready':function(){ return (selections.event && selections.date && selections.gridsquares.length > 0 && selections.mass.length == 2 && selections.distance.length == 2); }}
	];
	for(i = 0; i < steps.length; i++){
		steps[i].el = document.getElementById(steps[i].id);
		steps[i].nav = nav[i];
		steps[i].a = nav[0].querySelector('a');
	}
	
	this.goTo = function(s){
		var i,ok;
		if(typeof s==="number") step = s--;
		if(step < 0) step = 0;
		if(step > steps.length-1){
			step = steps.length-1;
			el.cosmo.style.display = '';
			el.breadcrumb.style.display = 'none';
			this.showNotification();
			return this;
		}
		el.cosmo.style.display = 'none';
		el.breadcrumb.style.display = '';
		for(i = 0; i < steps.length; i++){
			steps[i].el.style.display = (i==step ? '':'none');
			if(steps[i].nav){
				steps[i].nav.classList.remove('current');
				steps[i].nav.classList.remove('visited');
				if(i < step) steps[i].nav.classList.add('visited');
				else if(i == step) steps[i].nav.classList.add('current');
				else steps[i].nav.classList.remove('visited');
			}
		}
		el.notification.style.display = 'none';
		this.updateNav();
		return this;
	};
	this.showNotification = function(){
		el.notification.style.display = '';
		el.nav.style.display = 'none';
		for(i = 0; i < steps.length; i++) steps[i].el.style.display = 'none';
		return this;
	};
	this.hideNotification = function(){
		el.notification.style.display = 'none';
		el.nav.style.display = '';
		for(i = 0; i < steps.length; i++) steps[i].el.style.display = (i==step ? '':'none');
		el.breadcrumb.style.display = '';
		return this;
	};
	this.setLanguage = function(lang){
		console.info('Steps.setLanguage',lang);
		this.lang = lang;
		this.langdict = lang.translations;
		return this;
	};
	this.notification = function(required){
		if(!this.langdict) return "";
		var str,attr,key,v,rep;
		str = '';
		attr = {
			'name': selections.event,
			'date': selections.date,
			'locations': selections.gridsquares.join(", "),
			'mass': (selections.mass[1] ? selections.mass[0] + ' - ' + selections.mass[1] : ''),
			'massratio': (selections.massratio[1] ? selections.massratio[0] + ' - ' + selections.massratio[1] : ''),
			'distance': (selections.distance[1] ? selections.distance[0] + ' - ' + selections.distance[1] : ''),
			'inclination': (selections.inc[1] ? selections.inc[0] + ' - ' + selections.inc[1] : '')
		};
		for(key in this.langdict.text.observatory.gw.notification.template){
			v = "";
			rep = this.lang.getKey('site.translations[text.observatory.gw.notification.template.'+key+'][site.lang]')||"";
			if(rep){
				if(!required || (required && attr[key])) v = updateFromTemplate(rep,attr)
			}
			if(!required || (required && v!=="")) str += (str ? '\n' : '')+v;
		}
		el.notification.querySelector('textarea').innerHTML = str;
		return str;
	};
	this.updateValues = function(){
		var opt = el.event.options[el.event.selectedIndex];

		selections.event = opt.getAttribute('value');
		if(!selections.event || !data.events[selections.event]){
			console.warn('No event selected');
			return this;
		}
		ev = data.events[selections.event];
		selections.date = ev.datetime;

		document.querySelectorAll('.event-name').forEach(function(el){ el.innerHTML = selections.event||'?'; });
		document.querySelectorAll('.event-date').forEach(function(el){ el.innerHTML = selections.date||'?'; });

		var wf = (ev.GW.files.waveform_csv ? 'waveforms/'+ev.GW.files.waveform_csv : "");
		if(wf != selections.waveform){
			selections.waveform = wf;
			el.waveform1.setAttribute('src',(wf ? '../waveform-fitter/index.html?data='+wf+'&lang='+this.lang.lang : ''));
			el.waveform3.setAttribute('src',(wf ? '../waveform-fitter/index.html?data='+wf+'&lang='+this.lang.lang : ''));
			el.waveform4.setAttribute('src',(wf ? '../waveform-fitter/index.html?level=advanced&data='+wf+'&lang='+this.lang.lang : ''));
		}

		selections.gridsquares = el.gridsquares.value ? el.gridsquares.value.split(/[^0-9A-Z]+/) : [];
		
		selections.mass = [];
		if(el.massLo.value) selections.mass.push(el.massLo.value);
		if(el.massHi.value) selections.mass.push(el.massHi.value);
		selections.distance = [];
		if(el.distLo.value) selections.distance.push(el.distLo.value);
		if(el.distHi.value) selections.distance.push(el.distHi.value);
		selections.massratio = [];
		if(el.massratioLo.value) selections.massratio.push(el.massratioLo.value);
		if(el.massratioHi.value) selections.massratio.push(el.massratioHi.value);
		selections.inc = [];
		if(el.incLo.value) selections.inc.push(el.incLo.value);
		if(el.incHi.value) selections.inc.push(el.incHi.value);

		this.updateNav();

		this.notification(true);

		return this;
	};
	this.updateNav = function(){
		// Check if there is a previous step
		el.prev.disabled = (step==0);

		// Check if the next step is accessible
		s = step+1;
		if(s < steps.length) el.next.disabled = !(typeof steps[s].ready==="function" ? steps[s].ready.call(this,steps[s]) : true);
		return this;
	};
	this.setEvent = function(){
		selections.event = el.event.options[el.event.selectedIndex].value;
		if(selections.event) grids.set(data.events[selections.event]);
		return this;
	};
	var _obj = this;

	el.event.addEventListener('change',function(){ _obj.setEvent(); _obj.updateValues(); });
	el.gridsquares.addEventListener('change',function(e){ _obj.updateValues(); });
	el.massLo.addEventListener('change',function(){ _obj.updateValues(); });
	el.massHi.addEventListener('change',function(){ _obj.updateValues(); });
	el.massratioLo.addEventListener('change',function(){ _obj.updateValues(); });
	el.massratioHi.addEventListener('change',function(){ _obj.updateValues(); });
	el.distLo.addEventListener('change',function(){ _obj.updateValues(); });
	el.distHi.addEventListener('change',function(){ _obj.updateValues(); });
	el.incLo.addEventListener('change',function(){ _obj.updateValues(); });
	el.incHi.addEventListener('change',function(){ _obj.updateValues(); });

	// Copy the notification to the clipboard
	el.copy.addEventListener('click',function(e){
		ta = el.notification.querySelector('textarea');
		ta.select();
		ta.setSelectionRange(0, 99999); /* For mobile devices */
		navigator.clipboard.writeText(ta.value);
	});
	
	el.btnNotify.addEventListener('click',function(){ _obj.showNotification(); });
	el.btnSteps.addEventListener('click',function(){ _obj.hideNotification(); });
	el.prev.addEventListener('click',function(){ _obj.goTo(step-1); });
	el.next.addEventListener('click',function(){ _obj.goTo(step+1); });
	
	this.goTo();

	return this;
}

function updateFromTemplate(txt,rep){
	var key,safekey;
	for(key in rep){
		reg = new RegExp('\{\{\\s*'+key+'\\s*\}\}');
		txt = txt.replace(reg,rep[key]);
	}
	// Loop back over in case we've got patterns within our patterns 
	for(key in rep){
		reg = new RegExp('\{\{\\s*'+key+'\\s*\}\}');
		txt = txt.replace(reg,rep[key]);
	}
	// Remove all unreplaced tags
	txt = txt.replace(/\{\{\s*[^\}]*\s*\}\}/g,"");
	txt = txt.replace(/<p><\/p>/g,"");
	txt = txt.replace(/\n\t*\n/g,"\n");
	txt = txt.replace(/\\n/g,"<br />");
	return txt;
}

function GridMaps(opt){
	if(!opt) opt = {};
	if(!opt.el || !opt.input){
		console.error('Invalid elements to attach to',opt.el,opt.input);
		return this;
	}
	this.opt = opt;
	
	var highlightclass = 'highlight';

	this.set = function(d){
		this.data = d;
		this.els = [];

		var el = document.createElement('div');
		el.classList.add('grid');
		this.opt.el.innerHTML = '';
		this.opt.el.appendChild(el);
		
		// Make the HTML holders for the maps
		for(var id in d.GW.dt_arr) this.els.push(new Grid({'el':el,'id':id,'class':highlightclass,'data':d.GW.dt_arr[id],'parent':this}));
	};

	this.highlight = function(cls,sel){
		var match = {};
		var i,s,m,o,e;
		for(i = 0; i < this.els.length; i++){
			this.els[i].highlight(cls,sel);
			if(this.els[i].visible){
				for(s = 0; s < this.els[i].selected.length; s++){
					m = this.els[i].selected[s];
					if(!match[m]) match[m] = 0;
					match[m]++;
				}
			}
		}
		o = '';
		for(id in match){
			if(match[id] == this.els.length) o += (o ? ', ':'')+id;
		}
		if(o!=opt.input.value && o){
			opt.input.value = o;
			var e = document.createEvent('HTMLEvents');
			e.initEvent('change', true, false);
			opt.input.dispatchEvent(e);
		}
	};
	return this;
}

function Grid(opt){
	if(!opt) opt = {};
	if(!opt.el){
		console.error('No element to attach Grid to',opt.el);
		return this;
	}
	var el = document.createElement('div');
	if(opt.id) el.setAttribute('id','pair-'+opt.id);
	el.classList.add('grid-pair');
	opt.el.appendChild(el);
	
	var scale = 'grid-map';
	colours.addScale(scale,'rgb(0,0,0) 0%, rgb(255,255,255) 100%');

	this.title = document.createElement('h3');
	this.title.classList.add(opt.id,'padded');
	var pair = language.getKey('site.translations[text.observatory.gw.detectors.'+opt.id[0]+'][site.lang]')+' - '+language.getKey('site.translations[text.observatory.gw.detectors.'+opt.id[1]+'][site.lang]');
	this.title.setAttribute('data-translate','site.translations[text.observatory.gw.detectors.'+opt.id[0]+'][site.lang] - site.translations[text.observatory.gw.detectors.'+opt.id[1]+'][site.lang]');
	this.title.innerHTML = pair||"?";
	el.appendChild(this.title);
	var x,y;
	var letters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X'];
	this.grid = {};
	this.x = [];
	this.y = [];
	
	
	// Calculate range of data
	var max = -1e100;
	var min = 1e100;
	var range = 0;
	for(y = 0; y < opt.data.length; y++){
		for(x = 0; x < opt.data[y].length; x++){
			max = Math.max(max,opt.data[y][x]);
			min = Math.min(min,opt.data[y][x]);
		}
	}
	range = max-min;
	stepsize = (range <= 15 ? 2 : 5);
	nsteps = Math.ceil(range/stepsize);
	nsteps = 8;
	colours.quantiseScale(scale,nsteps,scale+' quantised '+nsteps);

	this.parent = opt.parent;
	this.scalebar = new ScaleBar({
		'nsteps':nsteps,
		'scale':scale+' quantised '+nsteps,
		'this': this,
		'class': opt.class+'-'+opt.id,
		'click':function(e,attr){
			this.selectLevel(attr.id);
			this.parent.highlight(attr.class,this.visible ? this.selected : []);
		}
	});

	this.scalebar.addTo(el);
	this.map = document.createElement('table');
	this.map.classList.add('grid-map');
	var tr;
	tr = document.createElement('tr');
	tr.innerHTML = '<th></th>';
	for(x = 0; x < opt.data[0].length; x++){
		this.x[x] = {'el':document.createElement('td')};
		this.x[x].el.classList.add('lbl','top');
		this.x[x].el.innerHTML = letters[x];
		tr.appendChild(this.x[x].el);
	}
	this.map.appendChild(tr);
	for(y = 0; y < opt.data.length; y++){
		tr = document.createElement('tr');
		this.y[y] = {'el':document.createElement('td')};
		this.y[y].el.classList.add('lbl','left');
		this.y[y].el.innerHTML = y+1;
		tr.appendChild(this.y[y].el);
		for(x = 0; x < opt.data[y].length; x++){
			id = letters[x]+(y+1);
			this.grid[id] = {'el':document.createElement('td'),'v':opt.data[y][x],'n':Math.min(nsteps-1,Math.floor(nsteps*(opt.data[y][x]-min)/(range))),'id':id};
			this.grid[id].el.classList.add('grid-cell');
			this.grid[id].el.setAttribute('title',letters[x]+(y+1));
			this.grid[id].el.style.background = colours.getColourFromScale(scale+' quantised '+nsteps,opt.data[y][x],min,max);
			tr.appendChild(this.grid[id].el);
		}
		this.map.appendChild(tr);
	}
	el.appendChild(this.map);
	
	this.highlight = function(cls,selected){
		// Clear selections
		for(id in this.grid) this.grid[id].el.classList.remove(...(cls.split(/ /)));
		// Select grid cells
		for(s = 0; s < selected.length; s++){
			this.grid[selected[s]].el.classList.add(...(cls.split(/ /)));
		}
		return this;
	}
	
	this.visible = true;
	this.selectedlevel = -1;
	this.selected = [];
	this.selectLevel = function(n){
		if(this.selectedlevel==n) this.visible = !this.visible;
		else this.visible = true;
		this.selected = [];
		for(var id in this.grid){
			if(this.grid[id].n==n) this.selected.push(id);
		}
		this.scalebar.selectLevel(n);
		this.selectedlevel = n;
		return this;
	};
	return this;
}

function ScaleBar(opt){
	if(!opt) opt = {};
	if(!opt.nsteps) opt.nsteps = 8;
	if(!opt.scale) opt.scale = 'Viridis';

	el = document.createElement('div');
	el.classList.add('scalebar','nsteps-'+opt.nsteps);
	el.style.display = 'grid';
	el.style['grid-template-columns'] = 'repeat('+opt.nsteps+',1fr)';
	this.el = el;
	this.bars = [];
	var b;
	for(var c = 0; c < nsteps; c++){
		b = new ScaleBit({
			'id':c,
			'bg':colours.getColourFromScale(opt.scale,c+0.5,0,nsteps),
			'class':opt.class,
			'this': opt.this,
			'click': opt.click
		});
		el.appendChild(b.el);
		this.bars.push(b);
	}
	
	this.addTo = function(e){
		e.appendChild(el);
		return this;
	};
	this.selectedlevel = -1;
	this.visible = true;
	this.selectLevel = function(n){

		if(this.selectedlevel==n) this.visible = !this.visible;
		else this.visible = true;

		// Deselect all the colours
		for(var b = 0; b < this.bars.length; b++){
			this.bars[b].el.classList.remove(...(opt.class.split(/ /)));
			if(b==n && this.visible) this.bars[b].el.classList.add(...(opt.class.split(/ /)));
		}

		this.selectedlevel = n;
	};
	return this;
}
function ScaleBit(opt){
	if(!opt) opt = {};
	if(!opt.bg) opt.bg = 'black';
	this.opt = opt;
	var el = document.createElement('div');
	el.classList.add('colour');
	el.style.background = opt.bg;
	var _obj = this;
	if(typeof opt.click==="function") el.addEventListener('click',function(e){ opt.click.call(opt.this||_obj,e,opt); });
	this.el = el;
	if(opt.el) opt.el.appendChild(el);
	return this;
}


/* ============== */
/* Colours v0.3.2 */
// Define colour routines
function Colour(c,n){
	if(!c) return {};
	function d2h(d) { return ((d < 16) ? "0" : "")+d.toString(16);}
	function h2d(h) {return parseInt(h,16);}
	// Converts an RGB color value to HSV. Conversion formula adapted from http://en.wikipedia.org/wiki/HSV_color_space.
	function rgb2hsv(r, g, b){
		r = r/255;
		g = g/255;
		b = b/255;
		var max = Math.max(r, g, b), min = Math.min(r, g, b);
		var h, s, v = max;
		var d = max - min;
		s = max == 0 ? 0 : d / max;
		if(max == min) h = 0; // achromatic
		else{
			switch(max){
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
			}
			h /= 6;
		}
		return [h, s, v];
	}

	this.alpha = 1;

	// Let's deal with a variety of input
	if(c.indexOf('#')==0){
		this.hex = c;
		this.rgb = [h2d(c.substring(1,3)),h2d(c.substring(3,5)),h2d(c.substring(5,7))];
	}else if(c.indexOf('rgb')==0){
		var bits = c.match(/[0-9\.]+/g);
		if(bits.length == 4) this.alpha = parseFloat(bits[3]);
		this.rgb = [parseInt(bits[0]),parseInt(bits[1]),parseInt(bits[2])];
		this.hex = "#"+d2h(this.rgb[0])+d2h(this.rgb[1])+d2h(this.rgb[2]);
	}else return {};
	this.hsv = rgb2hsv(this.rgb[0],this.rgb[1],this.rgb[2]);
	this.name = (n || "Name");
	var r,sat;
	for(r = 0, sat = 0; r < this.rgb.length ; r++){
		if(this.rgb[r] > 200) sat++;
	}
	this.toString = function(){
		return 'rgb'+(this.alpha < 1 ? 'a':'')+'('+this.rgb[0]+','+this.rgb[1]+','+this.rgb[2]+(this.alpha < 1 ? ','+this.alpha:'')+')';
	};
	this.text = (this.rgb[0]*0.299 + this.rgb[1]*0.587 + this.rgb[2]*0.114 > 186 ? "black":"white");
	return this;
}
function Colours(){
	var scales = {
		'Viridis': 'rgb(68,1,84) 0%, rgb(72,35,116) 10%, rgb(64,67,135) 20%, rgb(52,94,141) 30%, rgb(41,120,142) 40%, rgb(32,143,140) 50%, rgb(34,167,132) 60%, rgb(66,190,113) 70%, rgb(121,209,81) 80%, rgb(186,222,39) 90%, rgb(253,231,36) 100%'
	};
	function col(a){
		if(typeof a==="string") return new Colour(a);
		else return a;
	}
	this.getColourPercent = function(pc,a,b,inParts){
		var c;
		pc /= 100;
		a = col(a);
		b = col(b);
		c = {'r':parseInt(a.rgb[0] + (b.rgb[0]-a.rgb[0])*pc),'g':parseInt(a.rgb[1] + (b.rgb[1]-a.rgb[1])*pc),'b':parseInt(a.rgb[2] + (b.rgb[2]-a.rgb[2])*pc),'alpha':1};
		if(a.alpha<1 || b.alpha<1) c.alpha = ((b.alpha-a.alpha)*pc + a.alpha);
		if(inParts) return c;
		else return 'rgb'+(c.alpha && c.alpha<1 ? 'a':'')+'('+c.r+','+c.g+','+c.b+(c.alpha && c.alpha<1 ? ','+c.alpha:'')+')';
	};
	this.makeGradient = function(a,b){
		a = col(a);
		b = col(b);
		var grad = a.toString()+' 0%, '+b.toString()+' 100%';
		if(b) return 'background: '+a.toString()+'; background: -moz-linear-gradient(left, '+grad+');background: -webkit-linear-gradient(left, '+grad+');background: linear-gradient(to right, '+grad+');';
		else return 'background: '+a.toString()+';';
	};
	this.getGradient = function(id){
		return 'background: -moz-linear-gradient(left, '+scales[id].str+');background: -webkit-linear-gradient(left, '+scales[id].str+');background: linear-gradient(to right, '+scales[id].str+');';
	};
	this.addScale = function(id,str){
		scales[id] = str;
		processScale(id,str);
		return this;
	};
	this.quantiseScale = function(id,n,id2){
		var cs,m,pc,step,i;
		cs = [];
		m = n-1;
		pc = 0;
		step = 100/n;
		for(i = 0; i < m; i++){
			cs.push(this.getColourFromScale(id,i,0,m)+' '+(pc)+'%');
			cs.push(this.getColourFromScale(id,i,0,m)+' '+(pc+step)+'%');
			pc += step;
		}
		cs.push(this.getColourFromScale(id,1,0,1)+' '+(pc)+'%');
		cs.push(this.getColourFromScale(id,1,0,1)+' 100%');
		this.addScale(id2,cs.join(", "));
		return this;
	};
	function processScale(id,str){
		if(scales[id] && scales[id].str){
			console.warn('Colour scale '+id+' already exists. Bailing out.');
			return this;
		}
		scales[id] = {'str':str};
		scales[id].stops = extractColours(str);
		return this;
	}
	function extractColours(str){
		var stops,cs,i,c;
		stops = str.replace(/^\s+/g,"").replace(/\s+$/g,"").replace(/\s\s/g," ").split(', ');
		cs = [];
		for(i = 0; i < stops.length; i++){
			var bits = stops[i].split(/ /);
			if(bits.length==2) cs.push({'v':bits[1],'c':new Colour(bits[0])});
			else if(bits.length==1) cs.push({'c':new Colour(bits[0])});
		}
		
		for(c=0; c < cs.length;c++){
			if(cs[c].v){
				// If a colour-stop has a percentage value provided, 
				if(cs[c].v.indexOf('%')>=0) cs[c].aspercent = true;
				cs[c].v = parseFloat(cs[c].v);
			}
		}
		return cs;
	}

	// Process existing scales
	for(var id in scales){
		if(scales[id]) processScale(id,scales[id]);
	}
	
	// Return a Colour object for a string
	this.getColour = function(str){
		return new Colour(str);
	};
	// Return the colour scale string
	this.getColourScale = function(id){
		return scales[id].str;
	};
	// Return the colour string for this scale, value and min/max
	this.getColourFromScale = function(s,v,min,max,inParts){
		var cs,v2,pc,c,cfinal;
		if(typeof inParts!=="boolean") inParts = false;
		if(!scales[s]){
			console.warn('No colour scale '+s+' exists');
			return '';
		}
		if(typeof v!=="number") v = 0;
		if(typeof min!=="number") min = 0;
		if(typeof max!=="number") max = 1;
		cs = scales[s].stops;
		v2 = 100*(v-min)/(max-min);
		cfinal = {};
		if(v==max){
			cfinal = {'r':cs[cs.length-1].c.rgb[0],'g':cs[cs.length-1].c.rgb[1],'b':cs[cs.length-1].c.rgb[2],'alpha':cs[cs.length-1].c.alpha};
		}else{
			if(cs.length == 1){
				cfinal = {'r':cs[0].c.rgb[0],'g':cs[0].c.rgb[1],'b':cs[0].c.rgb[2],'alpha':(v2/100).toFixed(3)};
			}else{
				for(c = 0; c < cs.length-1; c++){
					if(v2 >= cs[c].v && v2 <= cs[c+1].v){
						// On this colour stop
						pc = 100*(v2 - cs[c].v)/(cs[c+1].v-cs[c].v);
						if(pc > 100) pc = 100;	// Don't go above colour range
						cfinal = this.getColourPercent(pc,cs[c].c,cs[c+1].c,true);
						continue;
					}
				}
			}
		}
		if(inParts) return cfinal;
		else return 'rgba(' + cfinal.r + ',' + cfinal.g + ',' + cfinal.b + ',' + cfinal.alpha + ")";
	};
	
	return this;
}
