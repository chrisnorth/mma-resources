/*
	Graph 0.2
	Reusable component to draw and update a graph

	var graph = new Graph(el,opt)

	el = DOM element
	opt = {
		'axes': {
			'x': {
				'key': 't',	// The key to access the data
				'dir': 'bottom',	// 'bottom', 'left'
				'ticks': {
					'spacing': 0.02	// The tick spacing as a data value
				},
				'title': {
					'label': 'x-axis label'
				},
				'range': [0.2,1],	// The data range of the axis
				'font-size': 14		// The font size in <svg> units
			}
		}
	}
	
	// Functions
	graph.init();
	graph.getValueAt(x,y) => {'x':x,'y':y}
	graph.on(type,data,fn)
	graph.trigger(t,e,d)
	graph.update()
	graph.updateLegend()
	graph.updateData()	// doesn't do much
	graph.getSeries(i)
	graph.setSeries(i,data,opt)
	graph.updateSeries(i,data)
	graph.drawSeries()
	graph.dataTograph(d)
	graph.drawData()
	graph.setDataRanges({'x':[a,b],'y':[a,b]})
	
	graph.axes.x.updateDP()
	graph.axes.x.setDataMinRange(a)
	graph.axes.x.setDataExtent(a,b)
	graph.axes.x.setDataRange(a,b)
	graph.axes.x.setPixelRange(a,b)
	graph.axes.x.reset()
	graph.axes.x.getDataRange() => [a,b]
	graph.axes.x.getTickSpacing()
	graph.axes.x.setTickSpacing(s)
	graph.axes.x.updateProps({})
	graph.axes.x.updateTicks()
	graph.axes.x.updateSize(w,h)

	graph.axes.x.scale.update(min,max)
	graph.axes.x.scale.value(v) => newvalue

*/
(function(root){
	var title = "Graph";
	var version = "0.2";
	function Graph(el,opt){
		if(!el){
			log.error('No element to attach Graph to ',el,opt);
			return this;
		}
		log.info();
		this.el = el;
		this.opt = {
			'axes': {
				'x': {
					'key': 'x',
					'dir': 'bottom',
					'ticks': {'spacing':0.02},
					'range': [0.2,1],
					'font-size': 14,
					'title':{
						'label': 'x',
						'attr': { 'fill' :'#000','dominant-baseline':'hanging','text-anchor':'middle' }
					}
				},
				'y': {
					'key': 'y',
					'dir': 'left',
					'ticks': {'spacing':0.5},
					'range': [-3,3],
					'font-size': 14,
					'title':{
						'label': 'y',
						'attr': { 'fill' :'#000', 'dominant-baseline':'hanging','transform':'rotate(-90)','text-anchor':'middle' }
					}
				}
			}
		};
		merge(this.opt,opt||{});
		this.scales = {};
		this.axes = {};
		this.series = {};
		this.events = {};
		this.init();
		return this;
	}
	// Set up the graph
	Graph.prototype.init = function(){

		log.msg('init');
		// Zap existing content
		this.el.innerHTML = '';

		// Create SVG holder
		this.svg = {};
		if(this.el.querySelector('svg')){
			// Use an existing <svg> child
			this.svg.el = this.el.querySelector('svg');
		}else{
			// Create a new <svg> element and add it
			this.svg.el = document.createElementNS('http://www.w3.org/2000/svg','svg');
			this.svg.el.setAttribute('xmlns','http://www.w3.org/2000/svg');
			this.el.appendChild(this.svg.el);
		}

		// Create axes
		if(!this.axes) this.axes = {};
		if(!this.svg.xaxis){
			// Make x-axis
			this.svg.xaxis = svgEl('g').appendTo(this.svg.el).addClass("x-axis axis").attr({'id':'x-axis-g'});
			this.axes.x = new Axis(this.svg.xaxis,this.opt.axes.x,svgEl('text').addClass("x-axis axis-title translate"));
		}
		if(!this.svg.yaxis){
			// Make y-axis
			this.svg.yaxis = svgEl('g').appendTo(this.svg.el).addClass("y-axis axis").attr({'id':'y-axis-g'});
			this.axes.y = new Axis(this.svg.yaxis,this.opt.axes.y,svgEl('text').addClass("y-axis axis-title translate"));
		}
		
		// Set the class for the <svg> element
		this.svg.el.classList.add('graph');

		// Listen for events
		var _obj = this;
		this.el.addEventListener('mousemove',function(e){
			if(_obj.events.mousemove) _obj.trigger('mousemove',e,_obj.getValueAt(e.clientX,e.clientY));
		});

		this.el.addEventListener('click',function(e){
			if(_obj.events.click) _obj.trigger('click',e,_obj.getValueAt(e.clientX,e.clientY));
		});

		return this;
	};
	Graph.prototype.getValueAt = function(x,y){
		var bb,ax,ay,s,dx,dy;
		bb = this.el.getBoundingClientRect();
		ax = this.axes.x.scale;
		ay = this.axes.y.scale;
		s = this.scales;
		dx = x - bb.left - s.svgMargin.left;
		dy = y - bb.top - s.svgMargin.top;
		x = ax.min + (ax.range)*Math.min(1,Math.max(0,dx/s.graphWidth));
		y = ay.max - (ay.range)*Math.min(1,Math.max(0,dy/s.graphHeight));
		//log.info('getValueAt',x,y);
		return {'x':x,'y':y};
	};
	// Attach events
	Graph.prototype.on = function(type,data,fn){
		if(!fn && typeof data==="function"){
			fn = data;
			data = {};
		}
		if(!this.events[type]) this.events[type] = [];
		this.events[type].push({'data':data,'fn':fn});
		return this;
	};
	// Trigger attached events
	Graph.prototype.trigger = function(t,e,d){
		for(var i = 0; i < this.events[t].length; i++){
			if(this.events[t][i].data) e.data = this.events[t][i].data;
			this.events[t][i].fn.call(e.data['this']||this,e,d);
		}
		return this;
	};

	Graph.prototype.update = function(){
		log.msg('update');

		var tempsvg = null;

		if(this.svg && this.svg.el){
			// Remove the element so we can work out the size of the container
			tempsvg = this.el.removeChild(this.svg.el);
		}

		// Set the size from the container (which is currently missing its content)
		this.scales.svgWidth = Math.floor(this.el.offsetWidth);
		this.scales.svgHeight = this.el.offsetHeight||Math.floor(this.scales.svgWidth/2);
		this.scales.svgMargin = {'left':75,'right':18,'top':10,'bottom':60};
		this.scales.graphWidth = this.scales.svgWidth-this.scales.svgMargin.left-this.scales.svgMargin.right;
		this.scales.graphHeight = this.scales.svgHeight-this.scales.svgMargin.top-this.scales.svgMargin.bottom;

		// Now that we've set the size, add the contents back
		if(tempsvg) this.el.appendChild(tempsvg);
		
		// Set the size of the <svg>
		this.svg.el.setAttribute('width',(this.scales.svgWidth));
		this.svg.el.setAttribute('height',(this.scales.svgHeight));
		
		this.svg.el.setAttribute('viewBox','0 0 '+this.scales.svgWidth+' '+this.scales.svgHeight);

		// Create a <defs> and add it to the SVG
		if(!this.svg.defs) this.svg.defs = svgEl('defs').appendTo(this.svg.el);

		// Create a <clipPath> and add it to the <svg>
		if(!this.svg.clip){
			this.svg.clip = svgEl('clipPath');
			this.svg.clip.appendTo(this.svg.defs).attr('id','clip');
			this.svg.cliprect = svgEl('rect').appendTo(this.svg.clip).attr({'x':0,'y':0});
		}
		if(this.svg.cliprect) this.svg.cliprect.attr({'width':this.scales.graphWidth,'height':this.scales.graphHeight});

		// Get font size
		var fs = (this.scales.svgMargin.left/4);

		// Update axes
		var xprops = merge(this.axes.x.getProps(),{'ticks':{'length':-this.scales.graphHeight},'width':this.scales.graphWidth,'height':this.scales.graphHeight});
		this.axes.x.setPixelRange(0,this.scales.graphWidth).updateProps(xprops).updateSize();
		this.svg.xaxis.attr({'transform': "translate("+this.scales.svgMargin.left+"," + (this.scales.graphHeight + this.scales.svgMargin.top) + ")"});
		if(this.axes.x.title) this.axes.x.title.attr(merge({'x':(this.scales.graphWidth/2),'y':(this.scales.svgMargin.bottom-(this.scales.svgMargin.left/4)-5),"font-size":fs+"px"},this.axes.x.getProps().title.attr||{}));
		var yprops = merge(this.axes.y.getProps(),{'ticks':{'length':-this.scales.graphWidth},'width':this.scales.graphWidth,'height':this.scales.graphHeight});
		this.axes.y.setPixelRange(this.scales.graphHeight,0).updateProps(yprops).updateSize();
		this.svg.yaxis.attr({'transform': "translate("+this.scales.svgMargin.left+"," + this.scales.svgMargin.top + ")"});
		if(this.axes.y.title) this.axes.y.title.attr(merge({'x':-this.scales.graphHeight/2,'y':(-this.scales.svgMargin.left*0.95 + 5)+'px',"font-size":fs+"px"},this.axes.y.getProps().title.attr||{}));

		// Make data
		if(!this.svg.data) this.svg.data = svgEl("g").appendTo(this.svg.el).attr({"id":"data-g",'clip-path':'url(#clip)'});
		this.svg.data.attr({"transform":"translate("+this.scales.svgMargin.left+","+(this.scales.svgMargin.top) + ")"});
		this.drawData();

		// Update legend
		this.updateLegend({'fontSize':fs});

		return this;
	};

	Graph.prototype.updateLegend = function(opt){

		if(!opt) opt = {};
		if(typeof opt.fontSize!=="number") opt.fontSize = 16;
		var fs = opt.fontSize;

		// Make legend
		if(!this.svg.legend && this.opt.legend){
			this.svg.legend = svgEl('g').appendTo(this.svg.el).addClass('legend');
			this.svg.legenditems = [];
		}
		
		if(!this.opt.legend && typeof this.opt.legend!=="object") return this;

		// Update legend position
		this.svg.legend.attr('transform',"translate("+(this.scales.svgMargin.left + fs*0.5)+"," + (this.scales.svgMargin.top+fs) + ")");

		// Add legend items
		var s,y,cls,txt,i;
		// Remove existing legend items (last to first)
		for(i = this.svg.legenditems.length-1 ; i >= 0; i--){
			if(this.svg.legenditems[i]){
				if(this.svg.legenditems[i].line) this.svg.legenditems[i].line._el.parentNode.removeChild(this.svg.legenditems[i].line._el);
				if(this.svg.legenditems[i].text) this.svg.legenditems[i].text._el.parentNode.removeChild(this.svg.legenditems[i].text._el);
				this.svg.legenditems.splice(i,1);
			}
		}
		y = 0;
		// Add each series item to the legend
		for(s in this.series){
			if(this.series[s]){
				cls = (this.series[s].opt.class ? ' '+this.series[s].opt.class : '');
				txt = this.series[s].opt.label||'text.legend.data';
				this.svg.legenditems[s] = {
					'line':svgEl('line').appendTo(this.svg.legend).addClass('line'+cls).attr({'x1':0,'x2':(fs*1.5).toFixed(1),'y1':y,'y2':y}),
					'text':svgEl('text').appendTo(this.svg.legend).addClass('leg-text translate'+cls).attr({'x':(fs*1.5 + fs*0.5).toFixed(1),'y':y,'dominant-baseline':'middle'}).html(txt||"?")
				};
				this.svg.legenditems[s].line.attr(this.series[s].opt.line);
				this.svg.legenditems[s].text.attr(this.series[s].opt.text);
			}
			y += fs;
		}
		return this;
	};
	Graph.prototype.updateData = function(){
		log.msg('Graph.updateData');
		if(this.axes.x) this.axes.x.setPixelRange(0, this.scales.graphWidth);
		if(this.axes.y) this.axes.y.setPixelRange(this.scales.graphHeight, 0);
		return this;
	};
	Graph.prototype.getSeries = function(s){
		return this.series[s];
	};
	Graph.prototype.setSeries = function(s,data,opt){
		log.msg('setSeries',s,data,opt);
		if(!this.series) this.series = {};
		// Either create a new series or update an existing one
		if(!this.series[s]) this.series[s] = new Series(data,opt,{'x':this.axes.x.key,'y':this.axes.y.key});
		else this.series[s].update(data,opt,{'x':this.axes.x.key,'y':this.axes.y.key});
		return this.getSeries(s);
	};
	Graph.prototype.updateSeries = function(s,data){
		if(this.series[s]){
			this.series[s].updateData(data)
			this.update();
		}
		return this;
	};
	Graph.prototype.setDataRanges = function(o){
		if(!o) o = {};
		for(var a in this.axes){
			if(o[a]) this.axes[a].setDataRange(o[a][0],o[a][1]);
		}
		return this;
	}
	Graph.prototype.drawSeries = function(s){
		var cls,id,d;
		if(this.series[s]){
			
			// Work out the class
			cls = (this.series[s].opt.class ? ' '+this.series[s].opt.class : '');

			// Work out an ID
			id = (this.series[s].opt.id ? this.series[s].opt.id : 'line-'+s);

			// Update the line colours
			this.series[s].svg.line.appendTo(this.svg.data).addClass('line'+cls).attr({'id':id,'stroke-width':2,'fill':'none'});
			this.series[s].svg.line.attr(this.series[s].opt.line);

			if(this.series[s].opt.title && this.series[s].opt.title.label) this.series[s].svg.title.html(this.series[s].opt.title.label);

			if(this.series[s].data.length==1){
				// Draw a line
				d = makePath(this.dataToGraph(this.series[s].getData(0)));
			}else if(this.series[s].data.length==2){
				// Make a filled shape
				d = makePath(this.dataToGraph(this.series[s].getData(0)));
				d += 'L'+makePath(this.dataToGraph(this.series[s].getData(1)),true).substr(1);
			}
			this.series[s].svg.line.attr({'d':d});			
		}
	};
	
	Graph.prototype.dataToGraph = function(d){
		var data = new Array(d.length);
		for(var i = 0; i < d.length; i++){
			data[i] = {'x':this.axes.x.scale.value(d[i][this.axes.x.key]),'y':this.axes.y.scale.value(d[i][this.axes.y.key])};
			// If the value is set to +/- Infinity we limit to the graph
			if(d[i][this.axes.x.key]==Infinity) data[i].x = 0;
			if(d[i][this.axes.x.key]==-Infinity) data[i].x = this.scales.graphWidth;
			if(d[i][this.axes.y.key]==Infinity) data[i].y = 0;
			if(d[i][this.axes.y.key]==-Infinity) data[i].y = this.scales.graphHeight;
		}
		return data;
	};

	Graph.prototype.drawData = function(){
		log.msg('Graph.drawData');

		for(var s in this.series) this.drawSeries(s);

		var xr = this.axes.x.getDataRange();
		if(typeof xr==="object" && xr.length == 2) this.axes.x.setTickSpacing(defaultSpacing(xr[0],xr[1],8));
		var yr = this.axes.y.getDataRange();
		if(typeof yr==="object" && yr.length == 2) this.axes.y.setTickSpacing(defaultSpacing(yr[0],yr[1],5));

		return this;
	};

	function defaultSpacing(mn,mx,n){

		if(mx==mn) return 1;
		var dv,log10_dv,base,frac,options,distance,imin,tmin,i;

		// Start off by finding the exact spacing
		dv = (mx-mn)/n;

		// In any given order of magnitude interval, we allow the spacing to be
		// 1, 2, 5, or 10 (since all divide 10 evenly). We start off by finding the
		// log of the spacing value, then splitting this into the integer and
		// fractional part (note that for negative values, we consider the base to
		// be the next value 'down' where down is more negative, so -3.6 would be
		// split into -4 and 0.4).
		log10_dv = Math.log10(dv);
		base = Math.floor(log10_dv);
		frac = log10_dv - base;

		// We now want to check whether frac falls closest to 1, 2, 5, or 10 (in log
		// space). There are more efficient ways of doing this but this is just for clarity.
		options = [1,2,5,10];
		distance = new Array(options.length);
		imin = -1;
		tmin = 1e100;
		for(i = 0; i < options.length; i++){
			distance[i] = Math.abs(frac - Math.log10(options[i]));
			if(distance[i] < tmin){
				tmin = distance[i];
				imin = i;
			}
		}

		// Now determine the actual spacing
		return Math.pow(10,base)*options[imin];
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
		this.html = function(t){
			// Add reset <tspan> after each sub/superscript
			t = t.replace(/\^\{([^\}]*)\}/g,function(m,p1){ return '<tspan dy="-0.4em" font-size="0.65em">'+p1+'</tspan><tspan dy="0.6em">&#13;</tspan>'; });
			t = t.replace(/\_\{([^\}]*)\}/g,function(m,p1){ return '<tspan dy="0.4em" font-size="0.65em">'+p1+'</tspan><tspan dy="-0.6em">&#13;</tspan>'; });
			//this._el.textContent = t;
			this._el.innerHTML = t;
			return this;
		};
		this.addClass = function(cls){ addMany(this._el,cls); return this; };
		this.removeClass = function(){ removeMany(this._el,arguments); return this; };
		this.data = function(d){ this._data = d; return this; };
		return this;
	}

	function svgEl(t){ return new svgElement(t); }

	function makePath(data,reverse){
		var i,d = '';
		if(reverse){
			for(i = data.length-1; i >= 0; i--) d += (i==0 ? 'M':'L')+data[i].x.toFixed(2)+','+data[i].y.toFixed(2);			
		}else{
			for(i = 0; i < data.length; i++) d += (i==0 ? 'M':'L')+data[i].x.toFixed(2)+','+data[i].y.toFixed(2);
		}
		return d;
	}

	function Axis(el,props,title){
		var defaultopts = {
			'range': [null,null],
			'font-size': 10,
			'font-family': 'sans-serif',
			'dir': 'left',
			'ticks': {
				'spacing': 1,
				'opacity': 1,
				'line': {'stroke':'#ddd'},
				'text': {'fill':'#000'}
			},
			'title': {
				'label': '',
				'options': {
					'fill': '#000'
				}
			},
			'key': '',
			'width': null,
			'height': null,
			'domain': {
				'stroke': '#000'
			}
		};
		
		var opts = clone(defaultopts);

		var tick,translate,attrline,attrtext,extent,minrange=1e-10;
		var dp = 0;
		this.scale = new Scale(0,0);
		this.key = "";

		this.updateDP = function(){
			dp = 0;
			if(typeof opts.ticks.spacing==="number" && !isNaN(opts.ticks.spacing)){
				var str = ((opts.ticks.spacing||"")+"");
				// Count decimal places
				if(str.indexOf(".") > 0) dp = str.split(".")[1].length;
			}else{
				console.warn('Tick spacing is not a number',opts,opts.ticks);
			}
			return this;
		};
		this.updateProps = function(opt){
			// Merge the new options into the existing ones
			merge(opts,opt||{});

			// Set main element properties
			el.attr({'fill':'none','font-size':(opts['font-size']),'font-family':(opts['font-family']),'text-anchor':(opts.dir=="left") ? 'end' : 'middle'});

			// Make a copy of the key available
			this.key = opts.key||"";
			// Set the number of decimal places
			return this.updateDP();
		};
		this.getProps = function(){
			return opts;
		};

		this.init = function(){
			this.updateProps(props);
			this.domain = svgEl('path').appendTo(el).addClass('domain').attr(opts.domain);
			if(title){
				this.title = title;
				this.title.html(opts.title.label);
				this.title.appendTo(el);
			}
			return this.updateDP().updateSize();
		};

		// Set the minimum range we will allow
		this.setDataMinRange = function(a){
			if(typeof a==="number") minrange = a;
			return this;
		};
		// Set the full extent that we can use for this axis (this will limit zooming/panning)
		this.setDataExtent = function(a,b){
			extent = [a,b];
			return this;
		};
		this.setDataRange = function(a,b){
			if(!extent) this.setDataExtent(-Infinity,Infinity);
			var min,max,i,data;
			if(typeof a==="string") a = parseFloat(a);
			if(typeof b==="string") b = parseFloat(b);
			if(typeof a==="number" && typeof b==="number"){
				if(Math.abs(b-a) < minrange) return this;
				min = a;
				max = b;
			}else{
				min = Infinity;
				max = -Infinity;
				data = a.getData(0);
				for(i = 0; i < data.length; i++){
					if(typeof data[i][opts.key]==="number"){
						min = Math.min(data[i][opts.key],min);
						max = Math.max(data[i][opts.key],max);
					}
				}
			}
			min = Math.max(min,extent[0]);
			max = Math.min(max,extent[1]);

			// Store initial range
			if(typeof opts.range[0]===null) opts.range[0] = min;
			if(typeof opts.range[1]===null) opts.range[1] = max;

			this.scale.update(min,max);

			return this;
		};

		// Set the pixel range for the graph
		this.setPixelRange = function(a,b){
			this.scale.minpx = a;
			this.scale.maxpx = b;
			return this;
		};
		this.reset = function(){
			// Reset options to defaults
			console.log('reset');
			opts = clone(defaultopts);
			return this;
		};
		this.getDataRange = function(){
			return [this.scale.min,this.scale.max]||opts.range;
		};
		this.setTickSpacing = function(s){
			if(typeof s!=="number" || isNaN(s)){
				console.warn('setTickSpacing - bad spacing',s,opts);
				return this;
			}
			// If we've changed the spacing update it and the ticks
			if(opts.ticks.spacing!=s){
				opts.ticks.spacing = s;
				return this.updateDP().updateTicks();
			}else return this;
		};
		this.updateTicks = function(){
			var t,v,p2,ticks,attr,min,n,vals,i;
			vals = [];
			ticks = el._el.querySelectorAll('.tick');
			for(t = 0; t < ticks.length; t++) ticks[t].parentNode.removeChild(ticks[t]);
			if(this.scale){
				if(opts.labels){
					if(typeof opts.labels==="object"){
						vals = opts.labels;
					}else if(typeof opts.labels==="function"){
						vals = opts.labels.call(this,this.scale.min,this.scale.max);
					}
				}else{
					n = Math.ceil(this.scale.min/opts.ticks.spacing);
					// Find the smallest tick value
					min = (n < 0 ? -1 : 1)*Math.floor(Math.abs(n))*opts.ticks.spacing;
					for(v = min ; v <= this.scale.max; v += opts.ticks.spacing){
						vals.push({'value':v,'label':v.toFixed(dp)});
					}
				}
				for(i = 0; i < vals.length; i++){
					v = vals[i].value;
					attr = {'opacity':opts.ticks.opacity};
					attrline = clone(opts.ticks.line);
					attrtext = clone(opts.ticks.text);
					translate = "";
					p2 = "";
					if(opts.dir=="left"){
						attr.transform = 'translate(0,'+this.scale.value(v).toFixed(1)+')';
						attrline.x2 = -opts.ticks.length;
						attrtext.x = -6;
						attrtext.dy = "0.32em";
					}else if(opts.dir=="bottom"){
						attr.transform = 'translate('+this.scale.value(v).toFixed(1)+',0)';
						attrline.y2 = opts.ticks.length;
						attrtext.y = 8;
						attrtext.dy = "0.71em";
					}
					tick = svgEl('g').appendTo(el).addClass('tick').attr(attr);
					svgEl('line').appendTo(tick).attr(attrline);
					svgEl('text').appendTo(tick).attr(attrtext).html(vals[i].label);
				}

			}
			return this;
		};
		this.updateSize = function(w,h){
			if(!w) w = opts.width;
			if(!h) h = opts.height;
			this.domain.attr({'d':(opts.dir=="left") ? 'M'+w+','+h+'H0.5V0.5H'+w : 'M0.5,-'+h+'V0.5H'+w+'.5V-'+h});
			this.domain.appendTo(el);
			if(this.scale) this.updateTicks();
			return this;
		};

		this.init();

		return this;
	}

	function Scale(min,max){
		this.minpx = "";
		this.maxpx = "";
		var _obj = this;
		this.update = function(min,max){
			this.min = min;
			this.max = max;
			this.range = max-min;
			return this;
		};
		this.value = function(v){
			if(_obj.range == 0) return 0;
			// Find value as a fraction of the range
			var frac = ((v - _obj.min)/_obj.range);
			// Scale to the pixel range
			if(typeof _obj.minpx==="number" && typeof _obj.maxpx==="number") frac = _obj.minpx + frac*(_obj.maxpx - _obj.minpx);
			return frac;
		};
		this.update(min,max);
		return this;
	}

	function Series(data,opt,keys){
		// Set some defaults
		this.opt = {
			'id': '',
			'class':'',
			'line': {
				'fill':'',
				'stroke': 'black',
				'stroke-width': 2
			},
			'text':{
				'fill': 'black'
			},
			'label': '?'
		};

		merge(this.opt,opt||{});
		
		this.update = function(data,opts,k){
			this.updateProps(opt);
			this.updateData(data);
			keys = k;
			return this;
		};
		this.updateData = function(data){
			if(data[0].length==2){
				ndata = new Array(data.length);
				for(var j = 0; j < data.length; j++){
					ndata[j] = {};
					ndata[j][keys.x] = data[j][0];
					ndata[j][keys.y] = data[j][1];
				}
			}else ndata = data;

			// Add any xoffset to the x-axis
			if(typeof opt.xoffset==="number"){
				for(var j = 0; j < ndata.length; j++) ndata[j][keys.x] += opt.xoffset;
			}

			// Keep a copy of the original data
			this.original = data;
			this.data = [{'lineData':ndata}];

			return this;
		};
		
		this.updateProps = function(opt){
			merge(this.opt,opt||{});
			return this;
		};
		
		this.getLine = function(){
			return this.svg.line._el;
		};
		this.getData = function(i){
			return this.data[i].lineData;
		};
		this.clear = function(){
			console.log('clear',this);
			if(this.svg.line) this.svg.line._el.setAttribute('path','');;
			if(this.svg.title) this.svg.title._el.innerHTML = "";
			return this;
		};

		this.update(data,opt,keys);

		// Make the SVG object
		if(!this.svg) this.svg = {};
		// Make the line object for this series
		if(!this.svg.line) this.svg.line = svgEl('path');
		if(!this.svg.title) this.svg.title = svgEl('title').appendTo(this.svg.line);
		this.svg.title.html('');

		return this;
	}

	function addMany(el,classes){
		var a = classes.split(' ');
		for(var i = 0; i < a.length; i++) el.classList.add(a[i]);
	}
	function removeMany(el,classes){
		var a = classes.split(' ');
		for(var i = 0; i < a.length; i++) el.classList.remove(a[i]);
	}
	function clone(a){ return JSON.parse(JSON.stringify(a)); }
	// Recursively merge properties of two objects 
	function merge(obj1, obj2){
		for(var p in obj2){
			try{
				if(obj2[p].constructor==Object) obj1[p] = merge(obj1[p], obj2[p]);
				else obj1[p] = obj2[p];
			}catch(e){ obj1[p] = obj2[p]; }
		}
		return obj1;
	}
	function Log(){
		// Version 1.2
		this.logging = (location.search.indexOf('debug=true') >= 0);
		this.msg = function(){ this.send('',arguments); return this; };
		this.info = function(){ this.send('INFO',arguments); return this; };
		this.warning = function(){ this.send('WARNING',arguments); return this; };
		this.error = function(){ this.send('ERROR',arguments); return this; };
		this.send = function(){
			var typ = arguments[0];
			var arg = arguments[1];
			if(this.logging || typ=="ERROR" || typ=="WARNING" || typ=="INFO"){
				a = Array.prototype.slice.call(arg, 0);
				var str = '';
				if(typeof a[0]==="string"){ str = ': '+a[0]; a.shift(1); }
				// Build basic result
				ext = ['%c'+title+' '+version+'%c'+(str || ''),'font-weight:bold;',''];
				// If there are extra parameters passed we add them
				if(a.length > 0) ext = ext.concat(a);
				if(console && typeof console.log==="function"){
					if(typ == "ERROR") console.error.apply(null,ext);
					else if(typ == "WARNING") console.warn.apply(null,ext);
					else if(typ == "INFO") console.info.apply(null,ext);
					else console.log.apply(null,ext);
				}
			}
			return this;
		};
	}
	var log = new Log();

	root.Graph = Graph;

})(window || this);
