function Step(data,opt){
	if(!opt) opt = {};
	var el = {
		'massratioLo': document.getElementById('massratio-lo'),
		'massratioHi': document.getElementById('massratio-hi'),
		'incLo': document.getElementById('inc-lo'),
		'incHi': document.getElementById('inc-hi'),

		'waveform': document.getElementById('waveform'),
		'none': document.getElementById('no-event'),
		'prev': document.getElementById('prev')
	};
	var vals = {
		'ev': data.events[query.event],
		'event': query.event,
		'gridsquares': query.gridsquares,
		'mass': (query.mass||";").split(/;/),
		'dist': (query.dist||";").split(/;/),
		'massratio': (query.massratio||";").split(/;/),
		'inc': (query.inc||";").split(/;/),
		'extra': query.extra
	};

	var _obj = this;

	el.massratioLo.addEventListener('change',function(e){ _obj.updateValues(); });
	el.massratioHi.addEventListener('change',function(e){ _obj.updateValues(); });
	el.incLo.addEventListener('change',function(e){ _obj.updateValues(); });
	el.incHi.addEventListener('change',function(e){ _obj.updateValues(); });

	el.prev.addEventListener('click',function(e){
		e.preventDefault();
		location.href = e.target.getAttribute('href')+opt.notification.queryString();
	});

	this.updateValues = function(){
		vals.massratio = [parseFloat(el.massratioLo.value),parseFloat(el.massratioHi.value)];
		vals.inc = [parseFloat(el.incLo.value),parseFloat(el.incHi.value)];
		
		if(opt.notification) opt.notification.set(vals);

		if(!isNaN(vals.massratio[0]) && !isNaN(vals.massratio[1]) && !isNaN(vals.inc[0]) && !isNaN(vals.inc[1])){
			//el.next.removeAttribute('disabled');
		}else{
			//el.next.setAttribute('disabled','disabled');
		}

		return this;
	}

	if(vals.massratio[0]) el.massratioLo.value = parseFloat(vals.massratio[0]);
	if(vals.massratio[1]) el.massratioHi.value = parseFloat(vals.massratio[1]);
	if(vals.inc[0]) el.incLo.value = parseFloat(vals.inc[0]);
	if(vals.inc[1]) el.incHi.value = parseFloat(vals.inc[1]);

	this.updateValues();

	// Set up Waveform graph
	var ev = data.events[vals.event];
	var wf = (ev) ? (ev.GW.files.waveform_csv ? 'waveforms/'+ev.GW.files.waveform_csv : "") : '';
	var sm = (ev) ? (ev.GW.files.simulations_csv ? 'waveforms/'+ev.GW.files.simulations_csv : "") : '';
	el.waveform.setAttribute('src',(wf ? '../waveform-fitter/index.html?level=advanced&data='+wf+'&lang='+opt.language.lang+'&simulation='+sm : ''));

	console.log('here',opt);

	return this;
}
