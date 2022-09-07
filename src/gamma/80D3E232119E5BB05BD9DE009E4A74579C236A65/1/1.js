function Step(data,opt){
	if(!opt) opt = {};
	var el = {
		'event': document.getElementById('select-event'),
		'waveform': document.getElementById('waveform'),
		'none': document.getElementById('no-event'),
		'prev': document.getElementById('prev'),
		'next': document.getElementById('next'),
	};
	var vals = {
		'ev': data.events[query.event],
		'event': query.event,
		'toffset': query.toffset,
		'gridsquares': query.gridsquares,
		'mass': (query.mass||";").split(/;/),
		'dist': (query.dist||";").split(/;/),
		'massratio': (query.massratio||";").split(/;/),
		'inc': (query.inc||";").split(/;/),
		'extra': query.extra
	};

	var _obj = this;

	// Add events to drop down box
	for(var e in data.events){
		selopt = document.createElement('option');
		selopt.setAttribute('value',e);
		if(e==vals.event) selopt.setAttribute('selected','selected');
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
		vals.event = e;
		vals.ev = {};
		vals.gridsquares = '';
		vals.mass = '';
		vals.dist = '';
		vals.massratio = '';
		vals.inc = '';

		if(e){
			if(data.events[e]){
				ev = data.events[e];

				vals.ev = data.events[e];
				el.next.removeAttribute('disabled');
				el.none.style.display = 'none';
				el.waveform.style.display = '';
				if(!this.graph){
					var series = [];
					// A function to create the contents of a tooltip
					function label(d){
						return updateFromTemplate("{{ site.translations.main.observatory.gamma.step1.tooltip }}",{'x':d.data.x,'y':d.data.y.toFixed(1),'title':d.series.title});
					}
					var axes = {
						'x':{ 'min':1e100,'max':-1e100, 'title': { 'label': '{{ site.translations.main.observatory.gamma.step1.time }}' }, 'labels':{} },
						'y':{ 'min':1e100,'max':-1e100, 'title': { 'label':'{{ site.translations.main.observatory.gamma.step1.counts }}' }, 'labels':{}, 'grid': {'show':true,'stroke':'#dfdfdf'} }
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
					var dy = 250;
					for(var x = Math.ceil(axes.x.min); x <= Math.floor(axes.x.max); x++) axes.x.labels[x] = {'label':x+''};
					for(var y = roundTo(axes.y.min,dy); y <= roundTo(axes.y.max,dy); y += dy) axes.y.labels[y] = {'label':y.toLocaleString() };

					this.graph = OI.linechart(el.waveform,{
						'left':80,
						'right':0,
						'top':8,
						'bottom':50,
						'axis':{
							'x':{
								'min': -3,
								'max': 3,
								'title': { 'label': '{{ site.translations.main.observatory.gamma.step1.time }}' },
								'labels':{
									"-3": {'label':-3},
									"-2": {'label':-2},
									"-1": {'label':-1},
									"0": {'label':0},
									"1": {'label':1},
									"2": {'label':2},
									"3": {'label':3}
								}
							},
							'y':{
								'min': 0,
								'max': 2,
								'title':{ 'label':'{{ site.translations.main.observatory.gamma.step1.counts }}' },
								'labels':{
									"0": {'label':0},
									"0.5": {'label':0.5},
									"1": {'label':1}
								}
							}
						}
					});
					this.graph.addSeries(series,{
						'title': '{{ site.translations.main.observatory.gamma.step1.series }}',
						'points':{'color':'transparent','size':4},
						'line':{'color':'#2254F4','stroke-width':2},
						'tooltip':{ 'label': label }
					});
					this.graph.setProperties({'axis':axes});
					this.graph.draw();
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

		if(opt.notification) opt.notification.set(vals);

	};

	if(query.event) el.event.value = query.event;
	this.setEvent(el.event.value);
	return this;
}

var scenario;
ready(function(){
	scenario = new Scenario('../scenario.json');
});
