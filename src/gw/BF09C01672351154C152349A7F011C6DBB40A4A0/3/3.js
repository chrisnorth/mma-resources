function Step(data,opt){
	if(!opt) opt = {};
	var el = {
		'massVal': document.getElementById('mass'),
		'distLo': document.getElementById('dist-lo'),
		'distHi': document.getElementById('dist-hi'),
		'inc': document.getElementById('inc'),
		'waveform': document.getElementById('waveform'),
		'none': document.getElementById('no-event'),
		'prev': document.getElementById('prev'),
		'next': document.getElementById('next'),
	};

	var _obj = this;

	el.massVal.addEventListener('change',function(e){ _obj.updateValues(); });
	el.distLo.addEventListener('change',function(e){ _obj.updateValues(); });
	el.distHi.addEventListener('change',function(e){ _obj.updateValues(); });
	el.inc.addEventListener('change',function(e){ _obj.updateValues(); });

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

		opt.values.mass = parseFloat(el.massVal.value);
		opt.values.dist = [parseFloat(el.distLo.value),parseFloat(el.distHi.value)];
		opt.values.inc = parseFloat(el.inc.value);
		
		if(!isNaN(opt.values.mass) && !isNaN(opt.values.dist[0]) && !isNaN(opt.values.dist[1]) && !isNaN(opt.values.inc)) el.next.removeAttribute('disabled');
		else el.next.setAttribute('disabled','disabled');

		if(opt.notification) opt.notification.set(opt.values);

		return this;
	}

	if(opt.values.mass) el.massVal.value = parseFloat(opt.values.mass);
	if(opt.values.dist[0]) el.distLo.value = parseFloat(opt.values.dist[0]);
	if(opt.values.dist[1]) el.distHi.value = parseFloat(opt.values.dist[1]);
	el.inc.value = parseFloat(opt.values.inc);

	this.updateValues();

	// Set up Waveform graph
	var ev = data.events[opt.values.event];
	var wf = (ev) ? (ev.GW.files.waveform_csv ? 'waveforms/'+ev.GW.files.waveform_csv : "") : '';
	var sm = (ev) ? (ev.GW.files.simulations_csv ? 'waveforms/'+ev.GW.files.simulations_csv : "") : '';

	el.waveform.setAttribute('src',(wf ? '../../waveform-fitter/index.html?data='+wf+'&lang='+(opt.language ? opt.language.lang : "")+'&simulation='+sm+(opt.values.mass ? '&mass='+opt.values.mass : '')+(opt.values.dist && !isNaN(opt.values.dist[0]) ? '&dist='+opt.values.dist[0] : '')+(!isNaN(opt.values.inc) ? '&inc='+opt.values.inc : '') : ''));

	return this;
}
