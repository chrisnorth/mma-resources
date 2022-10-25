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
				'range': [0.2,1],	// The data range of the axis
				'font-size': 14		// The font size in <svg> units
			}
		}
	}
	
	// Functions
	graph.init();
	graph.getValueAt(x,y) => {'x':x,'y':y};
	graph.on(type,data,fn)
	graph.trigger(t,e,d)
	graph.update()
	graph.updateLegend()
	graph.updateData
	graph.setSeriesNew(i,data,opt)
	graph.setSeries(i,s)
	graph.drawSeries()
	graph.dataTograph(d)
	graph.drawData()
	graph.setDataRanges({'x':[a,b],'y':[a,b]});
	
	graph.axes.x.updateDP()
	graph.axes.x.setDataMinRange(a)
	graph.axes.x.setDataExtent(a,b)
	graph.axes.x.setDataRange(a,b)
	graph.axes.x.setPixelRange(a,b)
	graph.axes.x.reset()
	graph.axes.x.getDataRange() => [a,b]
	graph.axes.x.setTickSpacing(s)
	graph.axes.x.setProps({})
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
					'key': 't',
					'dir': 'bottom',
					'ticks': {'spacing':0.02},
					'range': [0.2,1],
					'font-size': 14
				},
				'y': {
					'key': 'h',
					'dir': 'left',
					'ticks': {'spacing':0.5},
					'range': [-3,3],
					'font-size': 14
				}
			}
		};
		mergeDeep(this.opt,opt||{});

		this.scales = {};
		this.axes = {};
		this.series = [];
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
			this.el.appendChild(this.svg.el);
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
		log.info('getValueAt',x,y);
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

		// Create axes
		if(!this.axes) this.axes = {};
		var xprops = mergeDeep(this.opt.axes.x,{'ticks':{'length':-this.scales.graphHeight},'width':this.scales.graphWidth,'height':this.scales.graphHeight});
		if(!this.svg.xaxis){
			// Make x-axis
			this.svg.xaxis = svgEl('g').appendTo(this.svg.el).addClass("x-axis axis").attr({'id':'x-axis-g'});
			this.axes.x = new Axis(this.svg.xaxis,xprops,svgEl('text').addClass("x-axis axis-label translate").attr({'dominant-baseline':'hanging','text-anchor':'middle'}).html('{{ site.translations.waveform.axis.time }}'));
		}else{
			this.axes.x.setPixelRange(0,this.scales.graphWidth).setProps(xprops).updateSize();
		}
		this.svg.xaxis.attr({'transform': "translate("+this.scales.svgMargin.left+"," + (this.scales.graphHeight + this.scales.svgMargin.top) + ")"});
		if(this.axes.x.label) this.axes.x.label.attr({'x':this.scales.graphWidth/2,'y':(this.scales.svgMargin.bottom-(this.scales.svgMargin.left/4)-5)+"px","font-size":fs+"px"});
		var yprops = mergeDeep(this.opt.axes.y,{'ticks':{'length':-this.scales.graphWidth},'width':this.scales.graphWidth,'height':this.scales.graphHeight});
		if(!this.svg.yaxis){
			// Make y-axis
			this.svg.yaxis = svgEl('g').appendTo(this.svg.el).addClass("y-axis axis").attr({'id':'y-axis-g'});
			this.axes.y = new Axis(this.svg.yaxis,yprops,svgEl('text').addClass("y-axis axis-label translate").attr({'dominant-baseline':'hanging','transform':'rotate(-90)','text-anchor':'middle'}).html('{{ site.translations.waveform.axis.strain }}'));
		}else{
			this.axes.y.setPixelRange(this.scales.graphHeight,0).setProps(yprops).updateSize();
		}
		this.svg.yaxis.attr({'transform': "translate("+this.scales.svgMargin.left+"," + this.scales.svgMargin.top + ")"});
		if(this.axes.y.label) this.axes.y.label.attr({'x':-this.scales.graphHeight/2,'y':(-this.scales.svgMargin.left*0.95 + 5)+'px',"font-size":fs+"px"});

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
		if(!this.svg.legend){
			this.svg.legend = svgEl('g').appendTo(this.svg.el).addClass('legend');
			this.svg.legenditems = [];
		}

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
		for(s = 0; s < this.series.length; s++, y+=fs){
			if(this.series[s]){
				cls = (this.series[s].opt.class ? ' '+this.series[s].opt.class : '');
				txt = this.series[s].opt.text||'text.legend.data';
				this.svg.legenditems[s] = {
					'line':svgEl('line').appendTo(this.svg.legend).addClass('line'+cls).attr({'x1':0,'x2':(fs*1.5).toFixed(1),'y1':y,'y2':y}),
					'text':svgEl('text').appendTo(this.svg.legend).addClass('leg-text translate'+cls).attr({'x':(fs*1.5 + fs*0.5).toFixed(1),'y':y,'dominant-baseline':'middle'}).html(txt||"?")
				};
				if(this.series[s].opt.fill){
					this.svg.legenditems[s].line.attr({'fill':this.series[s].opt.fill});
				}
				if(this.series[s].opt.stroke){
					this.svg.legenditems[s].line.attr({'stroke':this.series[s].opt.stroke});
					this.svg.legenditems[s].text.attr({'fill':this.series[s].opt.stroke});
				}
			}
		}
		return this;
	};
	Graph.prototype.updateData = function(){
		log.msg('Graph.updateData');
		if(this.axes.x) this.axes.x.setPixelRange(0, this.scales.graphWidth);
		if(this.axes.y) this.axes.y.setPixelRange(this.scales.graphHeight, 0);
		return this;
	};
	Graph.prototype.setSeriesNew = function(i,data,opt){
		log.msg('setSeriesNew',i,data,opt);
		if(!opt) opt = {};
		// opt.id
		// opt.class
		// opt.fill
		// opt.stroke
		// opt.text
		if(!opt.text) opt.text = "?";
		if(!this.series) this.series = [];
		if(data[0].length==2){
			var ndata = new Array(data.length);
			for(var j = 0; j < data.length; j++){
				ndata[j] = {};
				ndata[j][this.axes.x.key] = data[j][0];
				ndata[j][this.axes.y.key] = data[j][1];
			}
		}else ndata = data;

		// Add any toffset
		if(typeof opt.toffset==="number"){
			for(var j = 0; j < ndata.length; j++) ndata[j][this.axes.x.key] += opt.toffset;
		}

		this.series[i] = {'original':data,'data':[{'lineData':ndata}],'opt':opt};
		return this;
	};
	Graph.prototype.setSeries = function(i,s){
		log.msg('setSeries',s);
		this.series[i] = s;
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
		if(!this.svg.series) this.svg.series = [];
		if(this.series[s]){
			
			// Work out the class
			cls = (this.series[s].opt.class ? ' '+this.series[s].opt.class : '');

			// Work out an ID
			id = (this.series[s].opt.id ? this.series[s].opt.id : 'line-'+s);

			// If we haven't got the series object for the SVG, make that now
			if(typeof this.svg.series[s]!=="object") this.svg.series[s] = {};

			// If we don't have the line object for this series, make that now
			if(typeof this.svg.series[s].line==="undefined"){
				this.svg.series[s].line = svgEl('path').appendTo(this.svg.data).addClass('line'+cls).attr({'id':id,'stroke-width':2,'fill':'none'});
			}
			// Update the line colours
			if(this.series[s].opt.fill) this.svg.series[s].line.attr({'fill':this.series[s].opt.fill});
			if(this.series[s].opt.stroke) this.svg.series[s].line.attr({'stroke':this.series[s].opt.stroke});

			if(this.series[s].data.length==1){
				// Draw a line
				d = makePath(this.dataToGraph(this.series[s].data[0].lineData));
			}else if(this.series[s].data.length==2){
				// Make a filled shape
				d = makePath(this.dataToGraph(this.series[s].data[0].lineData));
				d += 'L'+makePath(this.dataToGraph(this.series[s].data[1].lineData),true).substr(1);
			}
			this.svg.series[s].line.attr({'d':d});			
		}
	};
	
	Graph.prototype.dataToGraph = function(d){
		var data = new Array(d.length);
		for(var i = 0; i < d.length; i++) data[i] = {'x':this.axes.x.scale.value(d[i][this.axes.x.key]),'y':this.axes.y.scale.value(d[i][this.axes.y.key])};
		return data;
	};

	Graph.prototype.drawData = function(){
		log.msg('Graph.drawData');

		if(!this.svg.series) this.svg.series = [];
		for(var s = 0; s < this.series.length; s++) this.drawSeries(s);

		var xr = this.axes.x.getDataRange();
		if(typeof xr==="object" && xr.length == 2) this.axes.x.setTickSpacing(defaultSpacing(xr[0],xr[1],8));

		return this;
	};


	function defaultSpacing(mn,mx,n){

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
		this.html = function(t){ this._el.textContent = t; return this; };
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

	function Axis(el,props,label){

		var tick,translate,attrline,attrtext,extent,minrange=1e-10;
		el.attr({'fill':'none','font-size':(props['font-size']||'10'),'font-family':(props['font-family']||'sans-serif'),'text-anchor':(props.dir=="left") ? 'end' : 'middle'});
		
		if(!props) props = {};
		if(!props.range) props.range = [null,null];
		this.scale = new Scale(0,0);
		this.key = props.key||"";

		var dp = 0;

		this.path = svgEl('path').appendTo(el).addClass('domain').attr({'stroke':'#000'});

		if(label){
			this.label = label;
			this.label.appendTo(el);
		}
		this.updateDP = function(){
			dp = 0;
			if(typeof props.ticks.spacing==="number"){
				var str = ((props.ticks.spacing||"")+"");
				// Count decimal places
				if(str.indexOf(".") > 0) dp = str.split(".")[1].length;
			}
			return this;
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
			var min,max,i;
			if(typeof a==="number" && typeof b==="number"){
				if(Math.abs(b-a) < minrange) return this;
				min = a;
				max = b;
			}else{
				min = 1e100;
				max = -1e100;
				for(i = 0; i < a.data.length; i++){
					if(a.data[i][props.key]){
						min = Math.min(a.data[i][props.key][0],min);
						max = Math.max(a.data[i][props.key][a.data[i][props.key].length - 1],max);
					}
				}
			}

			min = Math.max(min,extent[0]);
			max = Math.min(max,extent[1]);

			// Store initial range
			if(typeof props.range[0]===null) props.range[0] = min;
			if(typeof props.range[1]===null) props.range[1] = max;

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
			//range = JSON.parse(JSON.stringify(props.range));
			return this;
		};
		this.getDataRange = function(){
			return [this.scale.min,this.scale.max]||props.range;
		};
		this.setTickSpacing = function(s){
			// If we've changed the spacing update it and the ticks
			if(props.ticks.spacing!=s){
				props.ticks.spacing = s;
				return this.updateDP().updateTicks();
			}else return this;
		};
		this.setProps = function(p){
			if(typeof p==="object") props = p;
			else props = {};
			this.key = props.key||"";
			return this.updateDP();
		};
		this.updateTicks = function(){
			var t,v,p2,ticks,attr;
			ticks = el._el.querySelectorAll('.tick');
			for(t = 0; t < ticks.length; t++) ticks[t].parentNode.removeChild(ticks[t]);
			if(this.scale){
				for(v = this.scale.min ; v <= this.scale.max; v += props.ticks.spacing){
					attr = {'opacity':1};
					attrline = {'stroke':'#000'};
					attrtext = {'fill':'#000'};
					translate = "";
					p2 = "";
					if(props.dir=="left"){
						attr.transform = 'translate(0,'+this.scale.value(v).toFixed(1)+')';
						attrline.x2 = -props.ticks.length;
						attrtext.x = -6;
						attrtext.dy = "0.32em";
					}else if(props.dir=="bottom"){
						attr.transform = 'translate('+this.scale.value(v).toFixed(1)+',0)';
						attrline.y2 = props.ticks.length;
						attrtext.y = 8;
						attrtext.dy = "0.71em";
					}
					tick = svgEl('g').appendTo(el).addClass('tick').attr(attr);
					svgEl('line').appendTo(tick).attr(attrline);
					svgEl('text').appendTo(tick).attr(attrtext).html(v.toFixed(dp));
				}
			}
			return this;
		};
		this.updateSize = function(w,h){
			if(!w) w = props.width;
			if(!h) h = props.height;
			this.path.attr({'d':(props.dir=="left") ? 'M'+w+','+h+'H0.5V0.5H'+w : 'M0.5,-'+h+'V0.5H'+w+'.5V-'+h});
			if(this.scale) this.updateTicks();
			return this;
		};

		this.setProps(props).updateSize();
		
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
	function mergeDeep(obj1, obj2){
		for(var p in obj2){
			try{
				if(obj2[p].constructor==Object) obj1[p] = mergeDeep(obj1[p], obj2[p]);
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
