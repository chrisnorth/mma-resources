function Step(data,opt){
	if(!opt) opt = {};
	var el = {
		'event': document.getElementById('select-event'),
		'waveform': document.getElementById('waveform'),
		't0': document.getElementById('t0'),
		't90': document.getElementById('t90'),
		't100': document.getElementById('t100'),
		'none': document.getElementById('no-event'),
		'prev': document.getElementById('prev'),
		'next': document.getElementById('next'),
	};

	var _obj = this;

	// Add events to drop down box
	for(var e in data.events){
		selopt = document.createElement('option');
		selopt.setAttribute('value',e);
		if(e==opt.values.event) selopt.setAttribute('selected','selected');
		selopt.innerHTML = e;
		el.event.appendChild(selopt);
	}

	el.event.addEventListener('change',function(e){ _obj.setEvent(e.target.value); });
	el.t0.addEventListener('change',function(e){ _obj.setT0(e.target.value); });
	el.t90.addEventListener('change',function(e){ _obj.setT90(e.target.value); });
	el.t100.addEventListener('change',function(e){ _obj.setT100(e.target.value); });
	el.next.addEventListener('click',function(e){
		e.preventDefault();
		if(e.target.getAttribute('disabled')!="disabled") location.href = e.target.getAttribute('href')+opt.notification.queryString();
	});
	
	this.getUrlVars = function(){
		var vars = {},hash;
		var url = window.location.href;
		if(window.location.href.indexOf('?')!=-1){
			var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
			url = window.location.href.slice(0,window.location.href.indexOf('?'));
			for(var i = 0; i < hashes.length; i++){
				hash = hashes[i].split('=');
				v = hash[1];
				if(v==parseFloat(v)+'') v = parseFloat(v);
				vars[hash[0]] = v;
			}
		}
		this.urlVars = vars;
		this.url = url;
	};
	this.getUrlVars();
	
	opt.values.t0 = this.urlVars.t0||0;
	opt.values.t90 = this.urlVars.t90||"";
	opt.values.t100 = this.urlVars.t100||"";
	el.t0.value = opt.values.t0;
	el.t90.value = opt.values.t90;
	el.t100.value = opt.values.t100;
	
	t90moveable = (opt.values.t90 ? true : false);
	
	function snapToGrid(x,data,dx){
		var idx = -1;
		var min = Infinity;
		var diff;
		for(var i = 0; i < data.length; i++){
			diff = Math.abs(data[i].x-x);
			if(diff < min){
				idx = i;
				min = diff;
			}
		}
		if(dx) idx += dx;
		if(idx < 0) idx = 0;
		if(idx > data.length-1) idx = data.length-1;
		return data[idx].x;
	}


	this.updateGraph = function(){

		var t0,t90,t100,baseline,data,F100,F90;
		opt.values.t0 = this.graph.series.t0.data[0].lineData[0].x;
		opt.values.t90 = this.graph.series.t90.data[0].lineData[0].x;
		opt.values.t100 = this.graph.series.t100.data[0].lineData[0].x;
		opt.values.F90 = 0;
		opt.values.F100 = 0;

		data = this.graph.series.data.original;
		av = 0;
		n = 0;
		for(var i = 0; i < data.length; i++){
			if(data[i].x < opt.values.t0 || data[i].x > opt.values.t100){
				av += data[i].y;
				n++;
			}
		}

		// Calculate the average
		av /= n;
		F100 = [];
		F90 = [];
		for(var i = 0; i < data.length; i++){
		
			if(data[i].x >= opt.values.t0 && data[i].x <= opt.values.t100){
				F100.push({'x':data[i].x,'y':data[i].y});
				opt.values.F100 += data[i].y - av;
			}
			if(data[i].x >= opt.values.t0 && data[i].x <= opt.values.t90){
				F90.push({'x':data[i].x,'y':data[i].y});
				opt.values.F90 += data[i].y - av;
			}
		}
		// Complete the fill shape
		for(var i = data.length-1; i >= 0; i--){
			if(data[i].x >= opt.values.t0 && data[i].x <= opt.values.t100){
				F100.push({'x':data[i].x,'y':Math.min(av,data[i].y)});
			}
			if(data[i].x >= opt.values.t0 && data[i].x <= opt.values.t90){
				F90.push({'x':data[i].x,'y':Math.min(av,data[i].y)});
			}
		}

		// Update baseline
		this.graph.updateSeries("baseline",[{x:-Infinity,y:av},{x:Infinity,y:av}]); 

		// Update shaded areas
		if(F90.length > 0) this.graph.updateSeries("F90",F90);
		if(F100.length > 0) this.graph.updateSeries("F100",F100);
		
		this.graph.update();

		var ratio = "?";
		if(opt.values.F100 != 0) ratio = opt.values.F90/opt.values.F100;
		var output = "<div>{{ site.translations.main.observatory.gamma.step1.output }}</div>";
		var msg = "";
		if(ratio > 0.95) msg = "{{ site.translations.main.observatory.gamma.step1.ratio.high }}";
		if(ratio < 0.85) msg = "{{ site.translations.main.observatory.gamma.step1.ratio.low }}";
		output = output.replace(/\{\{ baseline \}\}/g,('<span class="baseline number">'+av.toFixed(2)+'</span>')).replace(/\{\{ t90 \}\}/g,('<span class="t90 number">'+(opt.values.t90||0).toFixed(2)+'</span>')).replace(/\{\{ t100 \}\}/g,('<span class="t100 number">'+(opt.values.t100||0).toFixed(2)+'</span>')).replace(/\{\{ F90 \}\}/g,('<span class="F90 number">'+Math.round(opt.values.F90)+'</span>')).replace(/\{\{ F100 \}\}/g,('<span class="F100 number">'+Math.round(opt.values.F100)+'</span>')).replace(/\{\{ ratio \}\}/g,('<span class="ratio number">'+(ratio).toFixed(2)+'</span>')).replace(/\{\{ indicator \}\}/g,msg);
		document.getElementById('output').innerHTML = output;

		return this;
	};
	this.setT0 = function(v){
		opt.values.t0 = v;
		return this;
	};
	this.setT90 = function(v){
		opt.values.t90 = v;
		return this;
	};
	this.setT100 = function(v){
		opt.values.t100 = v;
		return this;
	};
	this.setEvent = function(e){
		var file,ev,dt;
		dt = '';
		opt.values.event = e;
		opt.values.ev = {};
		opt.values.t0 = parseFloat(el.t0.value)||'';
		opt.values.t90 = parseFloat(el.t90.value)||'';
		opt.values.t100 = parseFloat(el.t100.value)||'';
		opt.values.gridsquares = '';
		opt.values.mass = '';
		opt.values.dist = '';
		opt.values.massratio = '';
		opt.values.inc = '';

		// Reset output
		if(e){
			if(data.events[e]){
				ev = data.events[e];

				opt.values.ev = data.events[e];
				el.none.style.display = 'none';
				el.waveform.style.display = '';

				var series = [];
				// A function to create the contents of a tooltip
				function label(d){
					var txt = "{{ site.translations.main.observatory.gamma.step1.tooltip }}";
					if(txt.indexOf('site.translations.main.observatory') > 0) txt = "?";
					return updateFromTemplate(txt,{'x':d.data.x,'y':d.data.y.toFixed(1),'title':d.series.title});
				}
				var axes = {
					'x':{
						'min': Infinity,
						'max': -Infinity,
						'title': { 'label': '{{ site.translations.main.observatory.gamma.step1.time }}', 'attr': { 'fill': 'black' } }
					},
					'y':{
						'min': Infinity,
						'max': -Infinity,
						'title': { 'label':'{{ site.translations.main.observatory.gamma.step1.counts }}', 'attr': { 'fill': 'black' } },
						'grid': {'show':true,'stroke':'#dfdfdf'}
					}
				};
				for(var i = 0; i < ev.lightcurve.length; i++){
					series.push({'x':ev.lightcurve[i][0],'y':ev.lightcurve[i][1]});
					if(i < ev.lightcurve.length-1){
						series.push({'x':ev.lightcurve[i+1][0],'y':ev.lightcurve[i][1]});
					}
					axes.x.min = Math.min(axes.x.min,ev.lightcurve[i][0]);
					axes.x.max = Math.max(axes.x.max,ev.lightcurve[i][0]);
					axes.y.min = Math.min(axes.y.min,ev.lightcurve[i][1]);
					axes.y.max = Math.max(axes.y.max,ev.lightcurve[i][1]);
				}

				// Expand y-axis range
				var dy = (axes.y.max-axes.y.min)*0.05;
				axes.y.min -= dy;
				axes.y.max += dy;

				this.graph = new Graph(el.waveform,{
					'axes':axes,
					'patterns':{
						'hatch': {'type':'hatch','size':20,'angle':45,'style':'stroke:rgba(214, 3, 3, 0.2);stroke-width:20'}
					}
				});
				this.graph.axes.x.setDataRange(axes.x.min,axes.x.max);
				this.graph.axes.y.setDataRange(axes.y.min,axes.y.max);
				

				// Make baseline
				this.graph.setSeries("baseline",[{x:-Infinity,y:0},{x:Infinity,y:0}],{
					'label': 'baseline',
					'line': {
						'stroke': 'rgba(180,180,180, 1)',
						'stroke-width': 8,
						'stroke-dasharray': '1 12',
						'stroke-linecap': 'round'
					}
				});

				var x0 = opt.values.t0||snapToGrid(0,series);
				var x90 = opt.values.t90||(axes.x.min + 0.9*(axes.x.max-axes.x.min));
				var x100 = opt.values.t100||(axes.x.min + 0.95*(axes.x.max-axes.x.min));

				// Add count data
				this.graph.setSeries("F100",series,{
					'title': {
						'label': '{{ site.translations.main.observatory.gamma.step1.shaded }}'
					},
					'line': {
						'stroke': ''
					},
					'class': 'F100'
				});
				this.graph.setSeries("F90",series,{
					'title': {
						'label': '{{ site.translations.main.observatory.gamma.step1.shaded }}'
					},
					'line': {
						'stroke': ''
					},
					'class': 'F90',
					'pattern': 'hatch'
				});
				// Add count data
				this.graph.setSeries("data",series,{
					'title': {
						'label': '{{ site.translations.main.observatory.gamma.step1.series }}'
					}
				});

				function move(e,series,pos){

					var x = snapToGrid(pos.x,this.series.data.original,pos.shift);
					var d = [{x:x,y:-Infinity},{x:x,y:Infinity}];

					// Update the data for the series
					series.updateData(d);

					id = "";
					if(series.opt.id=="line-t0") id = "t0";
					else if(series.opt.id=="line-t90") id = "t90";
					else if(series.opt.id=="line-t100") id = "t100";
					if(id){
						el[id].value = x;
						// Dispatch change event
						e = document.createEvent('HTMLEvents');
						e.initEvent('change', true, false);
						el[id].dispatchEvent(e);
					}

					// Update the graph
					this.drawData();
					_obj.updateGraph();
				}
				function moveEnd(e,series){
					if(series.opt.id==="line-t100"){
						_obj.graph.showSeries("t90");
						_obj.graph.showSeries("F90");
					}
					_obj.updateGraph();
					// Enable the next button if we've moved the t90 line
					if(series.opt.id==="line-t90") el.next.removeAttribute('disabled');
					if(opt.notification) opt.notification.set(opt.values);
					return;
				}
				function moveStart(e,series){
					//console.log('start',series,series.svg.title._el.innerHTML);
				}

				// Make the t_0 line that stays static
				this.graph.setSeries("t0",[{x:x0,y:-Infinity},{x:x0,y:Infinity}],{
					'id': 'line-t0',
					'title': {
						'label': '{{ site.translations.main.observatory.gamma.step1.t0 }}'
					},
					'line': {
						'stroke': '#444',
						'stroke-width': 4,
						'cursor': 'col-resize'
					},
					'z-index': 10,
					'tooltip':{ 'label': label }
				});
				this.graph.makeDraggable(this.graph.series.t0,{ 'dragstart':moveStart, 'drag':move,'dragend':moveEnd });

				// Make the t_100 line
				this.graph.setSeries("t100",[{x:x100,y:-Infinity},{x:x100,y:Infinity}],{
					'id': 'line-t100',
					'title': {
						'label': '{{ site.translations.main.observatory.gamma.step1.t100 }}'
					},
					'line': {
						'stroke-width': 6,
						'stroke': 'rgb(34, 84, 244)',
						'cursor': 'col-resize'
					},
					'z-index': 10,
					'tooltip':{ 'label': label }
				});
				this.graph.makeDraggable(this.graph.series.t100,{ 'drag':move,'dragend':moveEnd });

				// Make the t_90 line
				this.graph.setSeries("t90",[{x:x90,y:-Infinity},{x:x90,y:Infinity}],{
					'id': 'line-t90',
					'title': {
						'label': '{{ site.translations.main.observatory.gamma.step1.t90 }}'
					},
					'line': {
						'stroke-width': 6,
						'stroke': 'rgb(214, 3, 3)',
						'cursor': 'col-resize'
					},
					'z-index': 10,
					'tooltip':{ 'label': label }
				});
				this.graph.makeDraggable(this.graph.series.t90,{ 'drag':move,'dragend':moveEnd });

				this.updateGraph();

				// If no t90 value is already set, we hide the t90 line for now
				if(!t90moveable){
					this.graph.hideSeries("t90");
					this.graph.hideSeries("F90");
				}

				dt = ev.datetime;
				
			}else{
				console.error('Invalid event '+ev,data);
				document.getElementById('output').innerHTML = '';
			}
		}else{
			el.none.style.display = '';
			el.waveform.style.display = 'none';
			el.next.setAttribute('disabled','disabled');
			document.getElementById('output').innerHTML = '';
			console.warn('No event set');
		}

		document.querySelectorAll('.event-name').forEach(function(el){ el.innerHTML = e||'?'; });
		document.querySelectorAll('.event-date').forEach(function(el){ el.innerHTML = dt||'?'; });

		if(opt.notification) opt.notification.set(opt.values);

	};

	if(query.event) el.event.value = query.event;
	this.setEvent(el.event.value);
	return this;
}

var scenario;
ready(function(){
	scenario = new Scenario('../scenario.json');
});
