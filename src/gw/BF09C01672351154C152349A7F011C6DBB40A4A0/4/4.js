function Step(data,opt){
	if(!opt) opt = {};
	var el = {
		'massratioLo': document.getElementById('massratio-lo'),
		'massratioHi': document.getElementById('massratio-hi'),
		'waveform': document.getElementById('waveform'),
		'none': document.getElementById('no-event'),
		'prev': document.getElementById('prev')
	};

	var _obj = this;

	el.massratioLo.addEventListener('change',function(e){ _obj.updateValues(); });
	el.massratioHi.addEventListener('change',function(e){ _obj.updateValues(); });

	el.prev.addEventListener('click',function(e){
		e.preventDefault();
		location.href = e.target.getAttribute('href')+opt.notification.queryString();
	});
	var breadcrumb = document.querySelectorAll('.breadcrumb .step a');
	for(var i = 0; i < breadcrumb.length; i++){
		breadcrumb[i].addEventListener('click',function(e){
			e.preventDefault();
			if(e.target.getAttribute('disabled')!="disabled") location.href = e.target.getAttribute('href')+opt.notification.queryString();
		});
	}

	this.updateValues = function(){

		opt.values.massratio = [parseFloat(el.massratioLo.value),parseFloat(el.massratioHi.value)];
		
		if(opt.notification) opt.notification.set(opt.values);

		if(!isNaN(opt.values.massratio[0]) && !isNaN(opt.values.massratio[1])){
			//el.next.removeAttribute('disabled');
		}else{
			//el.next.setAttribute('disabled','disabled');
		}

		return this;
	}

	if(opt.values.massratio[0]) el.massratioLo.value = parseFloat(opt.values.massratio[0]);
	if(opt.values.massratio[1]) el.massratioHi.value = parseFloat(opt.values.massratio[1]);

	this.updateValues();

	// Set up Waveform graph
	var ev = data.events[opt.values.event];
	var wf = (ev) ? (ev.GW.files.waveform_fitter_csv ? 'waveforms/'+ev.GW.files.waveform_fitter_csv : (ev.GW.files.waveform_csv ? 'waveforms/'+ev.GW.files.waveform_csv : "")) : '';
	var sm = (ev) ? (ev.GW.files.simulations_csv_adv ? 'waveforms/'+ev.GW.files.simulations_csv_adv : "") : '';


	var qs = 'level=advanced&data='+wf;
	qs += '&lang='+(opt.language ? opt.language.lang : "");
	qs += '&simulation='+sm;
	qs += (opt.values.mass ? '&mass='+opt.values.mass : '');
	qs += (opt.values.dist && !isNaN(opt.values.dist[0]) ? '&dist='+Math.round((parseFloat(opt.values.dist[0]) + parseFloat(opt.values.dist[1]))/2) : '');
	qs += (!isNaN(opt.values.inc) ? '&inc='+opt.values.inc : '');
	qs += (opt.values.ev ? '&M0='+Math.round(opt.values.ev.GW.m1 + opt.values.ev.GW.m2) : '');
	qs += (opt.values.ev ? '&D0='+Math.round(opt.values.ev.GW.distance) : '');
	qs += (opt.values.ev ? '&t0='+(opt.values.ev.GW.t0_ms/1000) : '');
	
	el.waveform.setAttribute('src',(wf ? '../../waveform-fitter/index.html?'+qs : ''));

	return this;
}
