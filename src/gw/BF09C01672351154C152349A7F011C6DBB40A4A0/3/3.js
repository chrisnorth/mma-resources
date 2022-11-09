function Step(data,opt){
	if(!opt) opt = {};
	var el = {
		'massVal': document.getElementById('mass'),
		'distLo': document.getElementById('dist-lo'),
		'distHi': document.getElementById('dist-hi'),
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
		'timesA': query.timesA,
		'timesB': query.timesB,
		'mass': (query.mass),
		'dist': (query.dist||";").split(/;/),
		'massratio': (query.massratio||";").split(/;/),
		'inc': (query.inc||";").split(/;/),
		'extra': query.extra
	};

	var _obj = this;

	el.massVal.addEventListener('change',function(e){ _obj.updateValues(); });
	el.distLo.addEventListener('change',function(e){ _obj.updateValues(); });
	el.distHi.addEventListener('change',function(e){ _obj.updateValues(); });

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

	this.updateValues = function(){
		vals.mass = parseFloat(el.massVal.value);
		vals.dist = [parseFloat(el.distLo.value),parseFloat(el.distHi.value)];
		
		if(!isNaN(vals.mass) && !isNaN(vals.dist[0]) && !isNaN(vals.dist[1])) el.next.removeAttribute('disabled');
		else el.next.setAttribute('disabled','disabled');

		if(opt.notification) opt.notification.set(vals);

		return this;
	}

	if(vals.mass) el.massVal.value = parseFloat(vals.mass);
	if(vals.dist[0]) el.distLo.value = parseFloat(vals.dist[0]);
	if(vals.dist[1]) el.distHi.value = parseFloat(vals.dist[1]);

	this.updateValues();

	// Set up Waveform graph
	var ev = data.events[vals.event];
	var wf = (ev) ? (ev.GW.files.waveform_csv ? 'waveforms/'+ev.GW.files.waveform_csv : "") : '';
	var sm = (ev) ? (ev.GW.files.simulations_csv ? 'waveforms/'+ev.GW.files.simulations_csv : "") : '';
	el.waveform.setAttribute('src',(wf ? '../../waveform-fitter/index.html?data='+wf+'&lang='+(opt.language ? opt.language.lang : "")+'&simulation='+sm : ''));


	return this;
}
