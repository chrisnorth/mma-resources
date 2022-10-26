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
					this.graph.setSeries(0,series,{
						'title': '{{ site.translations.main.observatory.gamma.step1.series }}',
						'points':{'stroke':'transparent','size':4},
						'line':{'stroke':'#2254F4','stroke-width':3},
						'tooltip':{ 'label': label }
					});
					this.graph.axes.x.setDataRange(axes.x.min,axes.x.max);
					this.graph.axes.y.setDataRange(axes.y.min,axes.y.max);
					this.graph.update();
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
