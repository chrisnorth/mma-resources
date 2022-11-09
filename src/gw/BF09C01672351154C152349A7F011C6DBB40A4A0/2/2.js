var colours,scales;
colours = new Colours();
scales = {
	'Viridis8': 'rgb(122,76,139) 0, rgb(124,109,168) 12.5%, rgb(115,138,177) 25%, rgb(107,164,178) 37.5%, rgb(104,188,170) 50%, rgb(133,211,146) 62.5%, rgb(189,229,97) 75%, rgb(254,240,65) 87.5%, rgb(254,240,65) 100%',
	'Heat': 'rgb(0,0,0) 0%, rgb(128,0,0) 25%, rgb(255,128,0) 50%, rgb(255,255,128) 75%, rgb(255,255,255) 100%',
	'Planck': 'rgb(0,0,255) 0, rgb(0,112,255) 16.666%, rgb(0,221,255) 33.3333%, rgb(255,237,217) 50%, rgb(255,180,0) 66.666%, rgb(255,75,0) 100%',
	'Plasma': 'rgb(12,7,134) 0, rgb(82,1,163) 12.5%, rgb(137,8,165) 25%, rgb(184,50,137) 37.5%, rgb(218,90,104) 50%, rgb(243,135,72) 62.5%, rgb(253,187,43) 75%, rgb(239,248,33) 87.5%'
};
for(s in scales){
	if(scales[s]) colours.addScale(s,scales[s]);
}


function Step(data,opt){
	if(!opt) opt = {};
	var el = {
		'gridsquares': document.getElementById('grid-squares'),
		'timesA': document.getElementById('timesA'),
		'timesB': document.getElementById('timesB'),
		'waveform': document.getElementById('waveform'),
		'none': document.getElementById('no-event'),
		'prev': document.getElementById('prev'),
		'next': document.getElementById('next')
	};
	var vals = {
		'ev': data.events[query.event],
		'event': query.event,
		'toffset': query.toffset,
		'gridsquares': query.gridsquares,
		'timesA': query.timesA,
		'timesB': query.timesB,
		'mass': (query.mass),
		'dist': (query.dist||";").split(/;/),
		'massratio': (query.massratio||";").split(/;/),
		'inc': (query.inc||";").split(/;/),
		'extra': query.extra
	};
	var _obj = this;

	el.gridsquares.addEventListener('change',function(e){ _obj.setGridsquares(e.target.value); });
	el.timesA.addEventListener('change',function(e){ _obj.setTimesA(e.target.value); });
	el.timesB.addEventListener('change',function(e){ _obj.setTimesB(e.target.value); });
	el.prev.addEventListener('click',function(e){
		e.preventDefault();
		location.href = e.target.getAttribute('href')+opt.notification.queryString();
	});
	el.next.addEventListener('click',function(e){
		e.preventDefault();
		if(e.target.getAttribute('disabled')!="disabled") location.href = e.target.getAttribute('href')+opt.notification.queryString();
	});
	var breadcrumb = document.querySelectorAll('.breadcrumb .step a');
	for(var i = 0; i < breadcrumb.length; i++){
		breadcrumb[i].addEventListener('click',function(e){
			e.preventDefault();
			if(e.target.getAttribute('disabled')!="disabled") location.href = e.target.getAttribute('href')+opt.notification.queryString();
		});
	}

	var grids = new GridMaps({
		'input': el.gridsquares,
		'times': [el.timesA,el.timesB],
		'el':document.getElementById('localisation'),
		'defaults': vals.toffset,
		'this':_obj
	});

	if(vals.event && data.events[vals.event]) grids.set(data.events[vals.event]);
	this.setGridsquares = function(v){
		if(v) el.next.removeAttribute('disabled');
		else el.next.setAttribute('disabled','disabled');
		vals.gridsquares = v;

		if(opt.notification) opt.notification.set(vals);
	};
	this.setTimesA = function(v){
		vals.timesA = v;
		if(opt.notification) opt.notification.set(vals);
	}
	this.setTimesB = function(v){
		vals.timesB = v;
		if(opt.notification) opt.notification.set(vals);
	}
	
	this.setToffset = function(v){
		vals.toffset = v;
		if(opt.notification) opt.notification.set(vals);
		return this;
	};
	
	if(query.gridsquares) el.gridsquares.value = decodeURI(query.gridsquares);
	this.setGridsquares(el.gridsquares.value);

	if(query.timesA) el.timesA.value = decodeURI(query.timesA);
	if(query.timesB) el.timesB.value = decodeURI(query.timesB);
	this.setTimesA(el.timesA.value);
	this.setTimesB(el.timesB.value);

	return this;
}

function GridMaps(opt){
	this.title = "GridMaps";
	if(!opt) opt = {};
	if(!opt.defaults) opt.defaults = "";
	if(opt.defaults.indexOf(';') > 0) opt.defaults = opt.defaults.split(/;/);
	if(!opt.el || !opt.input){
		console.error('Invalid elements to attach to',opt.el,opt.input);
		return this;
	}
	this.opt = opt;
	
	var ids = ['A','B','C'];
	
	this.show = function(){
		var i;
		for(i = 0; i < this.els.length; i++) this.els[i].showGraph(this.wfdata);
		for(i = 0; i < opt.defaults.length; i++) opt.defaults[i] = parseInt(opt.defaults[i]);
		// Set the default levels
		for(i = 0; i < this.els.length; i++){
			if(opt.defaults[i] >= 0) this.els[i].setLevel(opt.defaults[i]);
		}
		return;
	}

	this.set = function(d){
		this.data = d;
		this.els = [];

		var el = document.createElement('div');
		el.classList.add('grid');
		this.opt.el.innerHTML = '';
		this.opt.el.appendChild(el);
		delete this.wfdata;

		// Get waveform data
		var file = (d.GW.files.waveform_csv ? '../../waveform-fitter/waveforms/'+d.GW.files.waveform_csv : "");
		fetch(file).then(response => {
			if(!response.ok) throw new Error('Network response was not OK');
			return response.text();
		}).then(txt => {
			this.wfdata = parseCSV(txt);
			this.show();
		}).catch(error => {
			errorMessage('Unable to load the data "'+file+'"',error);
		});

		// Make the HTML holders for the maps
		var i = 0;
		for(var id in d.GW.dt_arr_ms){
			if(d.GW.dt_arr_ms[id]){
				this.els.push(new Grid({'el':el,'id':id,'n':ids[i],'class':'highlight','data':d.GW.dt_arr_ms[id],'GW':d.GW,'parent':this,'origin':opt.this,'times':opt.times[i]}));
				i++;
			}
		}
		
		return this;
	};
	
	this.setToffset = function(){
		v = '';
		for(var i = 0; i < this.els.length; i++) v += (v ? ';':'')+this.els[i].selectedlevel;
		return this;
	};

	this.highlight = function(){
		var match = {};
		var i,j,s,m,o,e,good,paths,id,p;
		paths = [];
		o = '';
		for(i = 0; i < this.els.length; i++){
			if(this.els[i].visible){
				for(s = 0; s < this.els[i].selectedcells.length; s++){
					m = this.els[i].selectedcells[s];
					if(!match[m]) match[m] = 0;
					match[m]++;
				}
				if(this.els[i].selectedel){
					p = this.els[i].selectedel.cloneNode(true);
					p.classList.add(this.els[i].class);
					p.classList.add('overlay');
					paths.push(p);
				}
			}
		}
		for(i = 0; i < this.els.length; i++){
			// Remove any existing overlays
			var ov = this.els[i].svg.querySelectorAll('.overlay');
			for(j = 0 ; j < ov.length; j++){
				if(ov[j].parentNode !== null) ov[j].parentNode.removeChild(ov[j]);
			}

			// Add new overlay paths in a different order depending on the GridMap
			if(i==0){
				for(p = paths.length-1; p >= 0; p--) this.els[i].svg.appendChild(paths[p].cloneNode(true));
			}else{
				for(p = 0; p < paths.length; p++) this.els[i].svg.appendChild(paths[p].cloneNode(true));				
			}
		}
		// Calculate the matching grid squares
		good = [];
		for(id in match){
			if(match[id] == this.els.length){
				o += (o ? ', ':'')+id;
				good.push(id);
			}
		}

		this.setToffset();
		return this;

		// Update the form input and trigger a change event
		/*if(o!=opt.input.value){
			opt.input.value = o;
			e = document.createEvent('HTMLEvents');
			e.initEvent('change', true, false);
			opt.input.dispatchEvent(e);
		}*/

	};
	return this;
}

function Grid(opt){
	if(!opt) opt = {};
	if(!opt.el){
		console.error('No element to attach Grid to',opt.el);
		return this;
	}
	var x,y,max,min,range,el,p,lbl,title,scale,pair,stepsize,nsteps;

	// Create a DOM element to put things in
	el = document.createElement('div');
	if(opt.n) el.setAttribute('id','pair-'+opt.n);
	el.classList.add('grid-pair',opt.n,'padded');
	opt.el.appendChild(el);

	var _obj = this;

	scale = 'grid-map';

	// Define a colour scale to use for the maps
	colours.addScale(scale,'rgb(128,128,128) 0%, rgb(255,255,255) 100%');

	// Make grid-specific class
	this.class = opt.class+'-'+opt.n;
	var language = `{{ site.translations.main.observatory.gw.detectors }}`;
	if(language.indexOf('site.translations')>0) language = {};
	else language = JSON.parse(language);

	pair = (language[opt.id[0]]||opt.id[0])+' - '+(language[opt.id[1]]||opt.id[1]);
	var det_a = language[opt.id[0]];
	var det_b = language[opt.id[1]];

	title = document.createElement('h3');
	title.classList.add('padded');
	title.setAttribute('data-translate','site.translations.mma[text.observatory.gw.detectors.'+opt.id[0]+'][site.lang] - site.translations.mma[text.observatory.gw.detectors.'+opt.id[1]+'][site.lang]');
	title.innerHTML = pair||"?";
	el.appendChild(title);

	var graphholder = document.createElement('div');
	var graphinner = document.createElement('div');
	graphholder.classList.add('widescreen');
	graphinner.classList.add('waveform');
	graphholder.appendChild(graphinner);
	el.appendChild(graphholder);
	
	p = document.createElement('p');
	p.classList.add('timedifference');
	p.innerHTML = '';
	el.appendChild(p);

	lbl = document.createElement('label');
	lbl.setAttribute('for','timing-select-'+opt.id);
	lbl.innerHTML = '{{ site.translations.main.observatory.gw.step2.select }}';
	el.appendChild(lbl);


	var wf = (opt) ? (opt.GW.files.waveform_csv ? '../../waveform-fitter/waveforms/'+opt.GW.files.waveform_csv : "") : '';
	this.mouseactive = true;
	
	var lines = {};
	var shade;

	function getStepFromValue(v){
		return Math.max(0,Math.min(nsteps-1,Math.floor(nsteps*(v-min)/(range))));
	}

	this.showGraph = function(data){
		var offset = 0.8;

		var t0 = opt.GW.t0_ms;
		var delta = Math.abs(opt.GW.dtmerger_s[opt.id[0]] - opt.GW.dtmerger_s[opt.id[1]])*2;
		// Round the value (this can cause range issues)
		delta = Math.round(delta*1e6)/1e6;
		if(delta < 1e-3) delta = 0.01;

		deltay = 1.5;
		
		// Work out the toff
		var toff = ((t0/1000)||0) + opt.GW.dtmerger_s[opt.id[0]];

		var times = opt.times.value.split(/ /g);
		
		x1 = toff-delta*0.8;
		x2 = toff+delta*0.8;
		if(times.length == 2){
			x1 = parseFloat(times[0]);
			x2 = parseFloat(times[1]);
		}
		
		if(!this.graph){
			
			this.graph = new Graph(graphinner,{
				'left': 24,
				'right': 1,
				'axes':{
					'x':{
						'title': {
							'label':'{{ site.translations.waveform.axis.time }}'
						}
					},
					'y':{
						'title': {
							'label':'{{ site.translations.waveform.axis.strain }}'
						},
						'labels': [
							{'value':offset,'label':''},
							{'value':-offset,'label':''}
						],
						'ticks': {
							'show': true
						}
					}
				}
			});
			this.graph.update();

			// Create the two lines
			lines[opt.id[0]] = this.graph.setSeries(opt.id[0],[{x:x1,y:-Infinity},{x:x1,y:Infinity}],{
				'label': 'baseline',
				'line': {
					'stroke': 'black',
					'stroke-width': 4,
					'stroke-linecap': 'round',
					'class': 'detector-'+opt.id[0],
				},
				'z-index': 5
			});
			lines[opt.id[1]] = this.graph.setSeries(opt.id[1],[{x:x2,y:-Infinity},{x:x2,y:Infinity}],{
				'label': 'baseline',
				'line': {
					'stroke': 'black',
					'stroke-width': 4,
					'stroke-linecap': 'round',
					'class': 'detector-'+opt.id[1],
				},
				'z-index': 5
			});

			// Create the shading element
			shade = this.graph.setSeries('shade',[{x:x1,y:-deltay},{x:x1,y:deltay},{x:x2,y:deltay},{x:x2,y:-deltay}],{
				'id':'line-data-shaded',
				'label':'test',
				'class':'data',
				'line': {
					'fill': 'rgba(255,255,255,0.4)',
					'stroke':'none',
					'stroke-width': 'none',
				},
				'z-index':1
			})

			// Now make the two lines draggable
			function moveLine(e,series,pos){
				var d = [{x:pos.x,y:-Infinity},{x:pos.x,y:Infinity}];
				// Update the data for the series
				series.updateData(d);

				// Update the graph
				this.drawData();

				// Update x1 and x2 values
				x1 = lines[opt.id[0]].original[0].x;
				x2 = lines[opt.id[1]].original[0].x;
				
				// Update input fields
				opt.times.value = x1.toFixed(6)+' '+x2.toFixed(6);
				// Trigger event
				e = document.createEvent('HTMLEvents');
				e.initEvent('change', true, false);
				opt.times.dispatchEvent(e);

				// Update the shaded area
				shade.updateData([{x:x1,y:-deltay},{x:x1,y:deltay},{x:x2,y:deltay},{x:x2,y:-deltay}]);
				
				var dt = x1-x2;
				
				_obj.setLevel(getStepFromValue(dt*1000));
				
				// Show the time difference in milliseconds
				p.innerHTML = updateFromTemplate('{{ site.translations.main.observatory.gw.step2.timediff }}',{'dt':(dt*1000).toFixed(1)});

				return;
			}
			this.graph.makeDraggable(lines[opt.id[0]],{'drag':moveLine});
			this.graph.makeDraggable(lines[opt.id[1]],{'drag':moveLine});

		}

		// Add the two data series to the graph
		// The first one we will offset horizontally depending on dtmerger_s and we will move it up
		this.graph.setSeries(0,data,{
			'id':'line-data',
			'text':det_a,
			'class':'detector-'+opt.id[0],
			'line':{
				'stroke':'rgba(0,150,200,1)'
			},
			'xoffset':(opt.GW.dtmerger_s[opt.id[0]])||0,
			'yoffset':offset,
			'z-index':2
		});
		// The second one we will offset horizontally depending on dtmerger_s and then move it down
		this.graph.setSeries(1,data,{
			'id':'line-data',
			'text':det_b,
			'class':'detector-'+opt.id[1],
			'line':{
				'stroke':'rgba(200,150,100,1)'
			},
			'xoffset':(opt.GW.dtmerger_s[opt.id[1]])||0,
			'yoffset':-offset,
			'z-index':2
		});

		// Set the initial level
		this.setLevel(getStepFromValue((x1-x2)*1000));
		
		// Update the ranges
		this.graph.axes.x.setDataRange(toff-delta,toff+delta);

		// Set the y-axis range
		this.graph.axes.y.setDataRange(-deltay,deltay);

		// Update the scales and domains
		this.graph.updateData();

		this.graph.update();

		return this;
	};


	var letters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X'];
	
	// Calculate range of data
	max = -1e100;
	min = 1e100;
	range = 0;
	for(y = 0; y < opt.data.length; y++){
		for(x = 0; x < opt.data[y].length; x++){
			max = Math.max(max,opt.data[y][x]);
			min = Math.min(min,opt.data[y][x]);
		}
	}
	range = max-min;
	stepsize = (range/2 <= 15 ? 2 : 5);

	max = Math.max(Math.abs(max),Math.abs(min));
	nsteps = 2*Math.ceil(max/stepsize);
	max = stepsize*nsteps/2;
	min = -max;
	range = max-min;
	colours.quantiseScale(scale,nsteps,scale+' quantised '+nsteps);

	this.parent = opt.parent;
	this.scalebar = new ScaleBar({
		'nsteps':nsteps,
		'name': 'timing-select-'+opt.id,
		'min': min,
		'max': max,
		'scale':scale+' quantised '+nsteps,
		'this': this,
		'parent': opt.parent,
		'class': this.class//,
		//'click':function(e,attr){ console.log(attr.id,this); this.toggleLevel(attr.id); }
	});

	this.scalebar.addTo(el);


	var xy,cols,cells,svg,n,h,w,nx,ny,pad,sz,l,id;
	xy = [];
	cols = {};
	cells = {};
	for(y = 0; y < opt.data.length; y++){
		xy.push([]);
		for(x = 0; x < opt.data[y].length; x++){
			id = letters[x]+(opt.data.length-y);
			n = getStepFromValue(opt.data[y][x]);
			xy[y].push(n);
			if(!cols[n]) cols[n] = colours.getColourFromScale(scale+' quantised '+nsteps,opt.data[y][x],min,max);
			if(!cells[n]) cells[n] = [];
			cells[n].push(id);
		}
	}
	
	// Make timing map as SVG
	nx = opt.data[0].length;
	ny = opt.data.length;
	svg = svgEl('svg');

	makeStripes(opt.n,svg,this.class);

	w = 440;
	h = 220;
	pad = {'left':20,'right':0,'top':20,'bottom':0};
	sz = Math.round((w-pad.left-pad.right)/nx);
	w = sz*nx + pad.left + pad.right;
	h = sz*ny + pad.top + pad.bottom;
	svg.attr('width',w).attr('height',h).attr('viewBox','0 0 '+w+' '+h);
	svg.addClass('grid-map').appendTo(el);
	this.levels = [];
	// Make grid labels (A-X)
	for(x = 0; x < nx; x++){
		l = svgEl('text');
		l.html(letters[x]);
		l.attr('x',pad.left + ((x+0.5)*sz)).attr('y',pad.top - 4).attr('text-anchor','middle').attr('font-size',16).attr('font-weight','bold').attr('dominant-baseline','text-bottom');
		l.appendTo(svg);
	}
	// Make grid labels (1-12)
	for(y = 0; y < ny; y++){
		l = svgEl('text');
		l.html(ny-y);
		l.attr('x',pad.left - 4).attr('y',pad.top+((y+0.5)*sz)).attr('text-anchor','end').attr('font-size',16).attr('font-weight','bold').attr('dominant-baseline','central');
		l.appendTo(svg);
	}

	// Build each level as a path
	for(n = 0; n < nsteps; n++){
		this.levels[n] = new Level(n,{'xy':xy,'sz':sz,'pad':pad,'cells':cells[n],'colour':cols[n],'this':this});
		this.levels[n].el.appendTo(svg);
	}

	this.svg = svg._el;
	
	this.visible = false;
	this.selectedlevel = -1;
	this.selectedcells = [];
	this.selectedel = undefined;
	this.selectedpath = '';
	this.toggleLevel = function(n){

		// Toggle selection
		if(this.selectedlevel==n) this.visible = !this.visible;
		else this.visible = true;
		this.selectedpath = '';
		
		if(this.visible) this.setLevel(n);
		else this.levelsOff();

		return this;		
	};
	this.levelsOff = function(){
		var i,fill;
		for(i in this.levels){
			this.levels[i].el.removeClass(this.class);
			fill = this.levels[i].el.getAttr('fill-old');
			if(fill) this.levels[i].el.attr({'fill':fill,'fill-old':''});
		}
		return this;
	};
	this.setLevel = function(n){

		var i,fill;

		this.visible = true;
		this.selectedpath = '';

		for(i in this.levels){
			if(i==n){
				// Set the class
				this.levels[i].el.addClass(this.class);
				// If an old fill isn't currently set, we get the current fill
				fill = "";
				if(!this.levels[i].el.getAttr('fill-old')) fill = this.levels[i].el.getAttr('fill');
				this.levels[i].el.attr({'fill':'url(#pattern-'+opt.n+')','fill-old':fill});

				this.selectedpath = this.levels[i].el.getAttr('d');
				this.selectedel = this.levels[i].el._el;
			}else{
				this.levels[i].el.removeClass(this.class);
				fill = this.levels[i].el.getAttr('fill-old');
				if(fill) this.levels[i].el.attr({'fill':fill,'fill-old':''});
			}
		}
		this.selectedcells = (typeof n==="number") ? this.levels[n].cells : [];
		this.scalebar.selectLevel(n);
		this.selectedlevel = n;

		// Update parent
		this.parent.highlight();

		return this;
	};

	return this;
}

function makeStripes(n,svg,cls){
	var defs = svg._el.querySelector('defs');
	if(!defs){
		defs = svgEl('defs');
		defs.appendTo(svg);
	}
	var pattern = svgEl('pattern').attr({'id':'pattern-'+n, 'patternUnits':"userSpaceOnUse",'class':cls}).appendTo(defs);
	var popt = { 'size': 10, 'angle': (n=="A" ? 45 : 135), 'style':'stroke-width:10;' };
	var l = svgEl('line');
	l.attr({'x1':0,'y1':0,'x2':0,'y2':popt.size,'style':popt.style});
	l.appendTo(pattern);
	pattern.attr({'width':popt.size,'height':popt.size,'patternTransform':'rotate('+popt.angle+' 0 0)'});
}

function Level(n,opt){
	if(!opt) return this;
	this.el = svgEl('path');
	this.cells = opt.cells;
	this.el.attr('data-n',n).attr('d',getPathFromValue(opt.xy,n,opt.sz,opt.pad));
	this.el.attr('fill',(opt.colour)).attr('stroke',opt.colour).attr('stroke-width',opt.sz*0.05);
	this.el._el.addEventListener('click',function(e){
		if(opt.this) opt.this.toggleLevel(n);
	});
	return this;
}

// Create an interactive element to show the scale
function ScaleBar(opt){
	var el,inp;
	if(!opt) opt = {};
	if(!opt.nsteps) opt.nsteps = 8;
	if(!opt.scale) opt.scale = 'Viridis';

	el = document.createElement('ol');
	el.classList.add('scalebar','nsteps-'+opt.nsteps);
	el.style.display = 'grid';
	el.style['grid-template-columns'] = 'repeat('+opt.nsteps+',1fr)';
	
	this.el = el;
	this.bars = [];
	var b;
	for(var c = 0; c < opt.nsteps; c++){
		b = new ScaleBit({
			'id':c,
			'name': opt.name,
			'min': opt.min+c*(opt.max-opt.min)/opt.nsteps,
			'max': opt.min+(c+1)*(opt.max-opt.min)/opt.nsteps,
			'bg':colours.getColourFromScale(opt.scale,c+0.5,0,opt.nsteps),
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
	this.toggleLevel = function(n){

		if(this.selectedlevel==n) this.visible = !this.visible;
		else this.visible = true;

		if(this.visible) this.selectLevel(n);
		else this.levelsOff();
		return this;
	};
	this.levelsOff = function(){
		for(var b = 0; b < this.bars.length; b++){
			this.bars[b].lbl.classList.remove(...(opt.class.split(/ /)));
		}
		return this;
	};
	this.selectLevel = function(n){

		this.visible = true;

		// Deselect all the colours
		for(var b = 0; b < this.bars.length; b++){
			this.bars[b].lbl.classList.remove(...(opt.class.split(/ /)));
			if(b==n) this.bars[b].lbl.classList.add(...(opt.class.split(/ /)));
		}

		this.selectedlevel = n;
		return this;
	};

	return this;
}
function ScaleBit(opt){
	if(!opt) opt = {};
	if(!opt.bg) opt.bg = 'black';
	this.opt = opt;
	var el = document.createElement('li');
	el.classList.add('scale-item');
	el.style.background = opt.bg;

	var min = document.createElement('div');
	min.classList.add('number','min');
	min.innerHTML = opt.min;
	el.appendChild(min);

	var max = document.createElement('div');
	max.classList.add('number','max');
	max.innerHTML = opt.max;
	el.appendChild(max);

	inp = document.createElement('input');
	inp.classList.add('colour');
	inp.setAttribute('type','radio');
	inp.setAttribute('name',opt.name);
	inp.setAttribute('id',opt.name+'-'+opt.id);
	inp.value = opt.min+' ms → '+opt.max+' ms';
	el.appendChild(inp);

	lbl = document.createElement('label');
	lbl.setAttribute('for',opt.name+'-'+opt.id);
	lbl.setAttribute('title',opt.min+' ms → '+opt.max+' ms');
	el.appendChild(lbl);

	var _obj = this;
	if(typeof opt.click==="function") inp.addEventListener('click',function(e){ opt.click.call(opt.this||_obj,e,opt); });
	this.el = el;
	this.lbl = lbl;
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


function svgElement(t){
	this._el = document.createElementNS('http://www.w3.org/2000/svg',t);
	this.append = function(el){ this._el.appendChild(el); return this; };
	this.appendTo = function(el){ if(el._el){ el._el.appendChild(this._el); }else{ el.appendChild(this._el); } return this; };
	this.attr = function(obj,v){
		var key;
		// Build an object from a key/value pair
		if(typeof obj==="string"){ key = obj; obj = {}; obj[key] = v; }
		for(key in obj){
			if(obj[key]) this._el.setAttribute(key,obj[key]);
		}
		return this;
	};
	this.html = function(t){ this._el.textContent = t; return this; };
	this.addClass = function(cls){ this._el.classList.add(...cls.split(" ")); return this; };
	this.removeClass = function(){ this._el.classList.remove(...arguments); return this; };
	this.removeAttribute = function(a){ this._el.removeAttribute(a); return this; };
	this.getAttr = function(a){ return this._el.getAttribute(a); };
	this.data = function(d){ this._data = d; return this; };
	return this;
}

function svgEl(t){ return new svgElement(t); }

// Adapted from https://github.com/kazuhikoarase/qrcode-generator/blob/master/js/qrcode.js
// Released under MIT licence
function getPathFromValue(pattern,v,cellSize,pad){
	var pointEquals = function (a, b) {
		return a[0] === b[0] && a[1] === b[1];
	};
	if(typeof cellSize!=="number") cellSize = 1;

	// Mark all four edges of each square in clockwise drawing direction
	var edges = [];
	var row,col,x0,y0,x1,y1,i,j,k,l,d,polygons,polygon,edge,foundEdge,p1,p2,p3,point,polygon2,point2;
	for (row = 0; row < pattern.length; row++) {
		for (col = 0; col < pattern[row].length; col++) {
			if (pattern[row][col]==v){
				x0 = col * cellSize + pad.left;
				y0 = row * cellSize + pad.top;
				x1 = (col + 1) * cellSize + pad.left;
				y1 = (row + 1) * cellSize + pad.top;
				edges.push([[x0, y0], [x1, y0]]);	 // top edge (to right)
				edges.push([[x1, y0], [x1, y1]]);	 // right edge (down)
				edges.push([[x1, y1], [x0, y1]]);	 // bottom edge (to left)
				edges.push([[x0, y1], [x0, y0]]);	 // left edge (up)
			}
		}
	}

	// Edges that exist in both directions cancel each other (connecting the rectangles)
	for (i = edges.length - 1; i >= 0; i--) {
		for (j = i - 1; j >= 0; j--) {
			if (pointEquals(edges[i][0], edges[j][1]) &&
				pointEquals(edges[i][1], edges[j][0])) {
				// First remove index i, it's greater than j
				edges.splice(i, 1);
				edges.splice(j, 1);
				i--;
				break;
			}
		}
	}

	polygons = [];
	while (edges.length > 0) {
		// Pick a random edge and follow its connected edges to form a path (remove used edges)
		// If there are multiple connected edges, pick the first
		// Stop when the starting point of this path is reached
		polygon = [];
		polygons.push(polygon);
		edge = edges.splice(0, 1)[0];
		polygon.push(edge[0]);
		polygon.push(edge[1]);
		do {
			foundEdge = false;
			for (i = 0; i < edges.length; i++) {
				if (pointEquals(edges[i][0], edge[1])) {
					// Found an edge that starts at the last edge's end
					foundEdge = true;
					edge = edges.splice(i, 1)[0];
					p1 = polygon[polygon.length - 2];	 // polygon's second-last point
					p2 = polygon[polygon.length - 1];	 // polygon's current end
					p3 = edge[1];	 // new point
					// Extend polygon end if it's continuing in the same direction
					if (p1[0] === p2[0] &&	 // polygon ends vertical
						p2[0] === p3[0]) {	 // new point is vertical, too
						polygon[polygon.length - 1][1] = p3[1];
					}
					else if (p1[1] === p2[1] &&	 // polygon ends horizontal
						p2[1] === p3[1]) {	 // new point is horizontal, too
						polygon[polygon.length - 1][0] = p3[0];
					}
					else {
						polygon.push(p3);	 // new direction
					}
					break;
				}
			}
			if (!foundEdge)
				throw new Error("no next edge found at", edge[1]);
		}
		while (!pointEquals(polygon[polygon.length - 1], polygon[0]));
		
		// Move polygon's start and end point into a corner
		if (polygon[0][0] === polygon[1][0] &&
			polygon[polygon.length - 2][0] === polygon[polygon.length - 1][0]) {
			// start/end is along a vertical line
			polygon.length--;
			polygon[0][1] = polygon[polygon.length - 1][1];
		}
		else if (polygon[0][1] === polygon[1][1] &&
			polygon[polygon.length - 2][1] === polygon[polygon.length - 1][1]) {
			// start/end is along a horizontal line
			polygon.length--;
			polygon[0][0] = polygon[polygon.length - 1][0];
		}
	}
	// Repeat until there are no more unused edges

	// If two paths touch in at least one point, pick such a point and include one path in the other's sequence of points
	for (i = 0; i < polygons.length; i++) {
		polygon = polygons[i];
		for (j = 0; j < polygon.length; j++) {
			point = polygon[j];
			for (k = i + 1; k < polygons.length; k++) {
				polygon2 = polygons[k];
				for (l = 0; l < polygon2.length - 1; l++) {	 // exclude end point (same as start)
					point2 = polygon2[l];
					if (pointEquals(point, point2)) {
						// Embed polygon2 into polygon
						if (l > 0) {
							// Touching point is not other polygon's start/end
							polygon.splice.apply(polygon, [j + 1, 0].concat(
								polygon2.slice(1, l + 1)));
						}
						polygon.splice.apply(polygon, [j + 1, 0].concat(
							polygon2.slice(l + 1)));
						polygons.splice(k, 1);
						k--;
						break;
					}
				}
			}
		}
	}

	// Generate SVG path data
	d = "";
	for (i = 0; i < polygons.length; i++) {
		polygon = polygons[i];
		d += "M" + polygon[0][0] + "," + polygon[0][1];
		for (j = 1; j < polygon.length; j++) {
			if (polygon[j][0] === polygon[j - 1][0])
				d += "v" + (polygon[j][1] - polygon[j - 1][1]);
			else
				d += "h" + (polygon[j][0] - polygon[j - 1][0]);
		}
		d += "z";
	}
	return d;
}