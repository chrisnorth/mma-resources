function Step(data,opt){
	if(!opt) opt = {};
	var el = {
		'event': document.getElementById('select-event'),
		'waveform': document.getElementById('waveform'),
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
	

	el.event.addEventListener('change',function(e){
		_obj.setEvent(e.target.value);
	});
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
	opt.values.t90 = this.urlVars.t90;
	opt.values.t100 = this.urlVars.t100;
	
	console.log(opt);

	this.makeDraggable = function(series){
		var el = series.getLine();
		var inDrag = false;
		var _obj = this;
		el.addEventListener("mousedown", function(e){
			e.preventDefault();
			e.stopPropagation();
			inDrag = true;
		});
		document.addEventListener("mousemove", function(e){
			if (!inDrag) {return;}

			// Find the data position of the cursor
			var pos = _obj.graph.getValueAt(e.clientX,e.clientY);

			// Update the x-position of the line
			//console.log(pos.x,_obj.graph.series.data);
			var x = pos.x; //0.25*Math.round(pos.x/0.25);
			var d = [{x:x,y:-Infinity},{x:x,y:Infinity}];
			series.updateData(d);

			// Update the graph
			_obj.graph.drawData();
		});
		document.addEventListener("mouseup", function(e){
			inDrag = false;
			_obj.updateGraph();
		});
	};
	
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
		shaded = [];
		for(var i = 0; i < data.length; i++){
		
			if(data[i].x >= opt.values.t0 && data[i].x <= opt.values.t100){
				shaded.push({'x':data[i].x,'y':data[i].y});
				opt.values.F100 += data[i].y - av;
			}
			if(data[i].x >= opt.values.t0 && data[i].x <= opt.values.t90){
				opt.values.F90 += data[i].y - av;
			}
		}
		// Complete the fill shape
		for(var i = data.length-1; i >= 0; i--){
			if(data[i].x >= opt.values.t0 && data[i].x <= opt.values.t100){
				shaded.push({'x':data[i].x,'y':Math.min(av,data[i].y)});
			}
		}
		
		// Update baseline
		this.graph.updateSeries("baseline",[{x:-Infinity,y:av},{x:Infinity,y:av}]); 

		// Update shaded area
		console.log(shaded,av);
		this.graph.updateSeries("shaded",shaded);

		var ratio = opt.values.F90/opt.values.F100;
		var output = "<div>{{ site.translations.main.observatory.gamma.step1.output }}</div>";
		var msg = "";
		if(ratio > 0.95) msg = "{{ site.translations.main.observatory.gamma.step1.ratio.high }}";
		if(ratio < 0.85) msg = "{{ site.translations.main.observatory.gamma.step1.ratio.low }}";
		output = output.replace(/\{\{ baseline \}\}/g,('<span class="baseline">'+av.toFixed(2)+'</span>')).replace(/\{\{ t90 \}\}/g,('<span class="t90">'+opt.values.t90.toFixed(2)+'</span>')).replace(/\{\{ t100 \}\}/g,('<span class="t100">'+opt.values.t100.toFixed(2)+'</span>')).replace(/\{\{ F90 \}\}/g,('<span class="F90">'+Math.round(opt.values.F90)+'</span>')).replace(/\{\{ F100 \}\}/g,('<span class="F100">'+Math.round(opt.values.F100)+'</span>')).replace(/\{\{ ratio \}\}/g,('<span class="ratio">'+(ratio).toFixed(2)+'</span>')).replace(/\{\{ indicator \}\}/g,msg);
		document.getElementById('output').innerHTML = output;

		return this;
	};

	this.setEvent = function(e){
		var file,ev,dt;
		dt = '';
		opt.values.event = e;
		opt.values.ev = {};
		opt.values.gridsquares = '';
		opt.values.mass = '';
		opt.values.dist = '';
		opt.values.massratio = '';
		opt.values.inc = '';

		if(e){
			if(data.events[e]){
				ev = data.events[e];

				opt.values.ev = data.events[e];
				el.next.removeAttribute('disabled');
				el.none.style.display = 'none';
				el.waveform.style.display = '';
				if(!this.graph){
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
						'axes':axes
					});
					this.graph.axes.x.setDataRange(axes.x.min,axes.x.max);
					this.graph.axes.y.setDataRange(axes.y.min,axes.y.max);
					

					// Make baseline
					this.graph.setSeries("baseline",[{x:-Infinity,y:0},{x:Infinity,y:0}],{
						'label': 'baseline',
						'line': {
							'stroke-width': 6
						}
					});

					var x0 = 0;
					var x90 = axes.x.min + 0.9*(axes.x.max-axes.x.min);
					var x100 = axes.x.min + 0.95*(axes.x.max-axes.x.min);

					// Add count data
					this.graph.setSeries("shaded",series,{
						'title': {
							'label': '{{ site.translations.main.observatory.gamma.step1.shaded }}'
						},
						'tooltip':{ 'label': label }
					});
					// Add count data
					this.graph.setSeries("data",series,{
						'title': {
							'label': '{{ site.translations.main.observatory.gamma.step1.series }}'
						},
						'tooltip':{ 'label': label }
					});

					// Make the t_0 line that stays static
					this.graph.setSeries("t0",[{x:x0,y:-Infinity},{x:x0,y:Infinity}],{
						'id': 'line-t0',
						'title': {
							'label': '{{ site.translations.main.observatory.gamma.step1.t0 }}'
						},
						'line': {
							'stroke-width': 4
						}
					});

					// Make the t_90 line
					this.graph.setSeries("t90",[{x:x90,y:-Infinity},{x:x90,y:Infinity}],{
						'id': 'line-t90',
						'title': {
							'label': '{{ site.translations.main.observatory.gamma.step1.t90 }}'
						},
						'line': {
							'stroke-width': 6,
							'cursor': 'col-resize'
						}
					});
					this.makeDraggable(this.graph.series.t90);

					// Make the t_100 line
					this.graph.setSeries("t100",[{x:x100,y:-Infinity},{x:x100,y:Infinity}],{
						'id': 'line-t100',
						'title': {
							'label': '{{ site.translations.main.observatory.gamma.step1.t100 }}'
						},
						'line': {
							'stroke-width': 6,
							'cursor': 'col-resize'
						}
					});
					this.makeDraggable(this.graph.series.t100);

					this.graph.update();
					
					this.updateGraph();
					
				}
				dt = ev.datetime;
				
			}else{
				errorMessage('Invalid event '+ev,data);
			}
		}else{
			el.none.style.display = '';
			el.waveform.style.display = 'none';
			el.next.setAttribute('disabled','disabled');
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
