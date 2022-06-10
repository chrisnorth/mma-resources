var language,steps;

function Steps(){
	var step = 0;
	var selections = {'event':'','date':'','gridsquares':[],'mass':[],'distance':[],'massratio':[],'inclination':[],'waveform':''};
	var el = {
		'breadcrumb': document.querySelector('.breadcrumb'),
		'event': document.getElementById('select-event'),
		'notification': document.getElementById('event-notification'),
		'copy': document.getElementById('event-copy'),
		'waveform1': document.getElementById('waveform1'),
		'waveform3': document.getElementById('waveform3'),
		'waveform4': document.getElementById('waveform4'),
		'gridsquares': document.getElementById('grid-squares'),
		'nav': document.querySelector('nav .nav-inner'),
		'prev': document.getElementById('prev'),
		'btnNotify': document.getElementById('show-notification'),
		'btnSteps': document.getElementById('show-steps'),
		'next': document.getElementById('next'),
		'massLo': document.getElementById('mass-lo'),
		'massHi': document.getElementById('mass-hi'),
		'massratioLo': document.getElementById('massratio-lo'),
		'massratioHi': document.getElementById('massratio-hi'),
		'distLo': document.getElementById('dist-lo'),
		'distHi': document.getElementById('dist-hi'),
		'incLo': document.getElementById('inc-lo'),
		'incHi': document.getElementById('inc-hi'),
		'cosmo': document.getElementById('cosmocalc')
	};
	var nav = el.breadcrumb.querySelectorAll('li');
	var steps = [
		{'id':'step-1'},
		{'id':'step-2','ready':function(){ return (selections.event && selections.date); } },
		{'id':'step-3','ready':function(){ return (selections.event && selections.date && selections.gridsquares.length > 0); }},
		{'id':'step-4','ready':function(){ return (selections.event && selections.date && selections.gridsquares.length > 0 && selections.mass.length == 2 && selections.distance.length == 2); }}
	];
	for(i = 0; i < steps.length; i++){
		steps[i].el = document.getElementById(steps[i].id);
		steps[i].nav = nav[i];
		steps[i].a = nav[0].querySelector('a');
	}
	
	this.goTo = function(s){
		var i,ok;
		if(typeof s==="number") step = s--;
		if(step < 0) step = 0;
		if(step > steps.length-1){
			step = steps.length-1;
			el.cosmo.style.display = '';
			el.breadcrumb.style.display = 'none';
			this.showNotification();
			return this;
		}
		el.cosmo.style.display = 'none';
		el.breadcrumb.style.display = '';
		for(i = 0; i < steps.length; i++){
			steps[i].el.style.display = (i==step ? '':'none');
			if(steps[i].nav){
				steps[i].nav.classList.remove('current');
				steps[i].nav.classList.remove('visited');
				if(i < step) steps[i].nav.classList.add('visited');
				else if(i == step) steps[i].nav.classList.add('current');
				else steps[i].nav.classList.remove('visited');
			}
		}
		el.notification.style.display = 'none';
		this.updateNav();
		return this;
	};
	this.showNotification = function(){
		el.notification.style.display = '';
		el.nav.style.display = 'none';
		for(i = 0; i < steps.length; i++) steps[i].el.style.display = 'none';
		return this;
	};
	this.hideNotification = function(){
		el.notification.style.display = 'none';
		el.nav.style.display = '';
		for(i = 0; i < steps.length; i++) steps[i].el.style.display = (i==step ? '':'none');
		el.breadcrumb.style.display = '';
		return this;
	};
	this.setLanguage = function(lang){
		console.info('Steps.setLanguage',lang);
		this.lang = lang;
		this.langdict = lang.translations;
		return this;
	};
	this.notification = function(required){
		if(!this.langdict) return "";
		var str,attr,key,v,rep;
		str = '';
		attr = {
			'name': selections.event,
			'date': selections.date,
			'locations': selections.gridsquares.join(", "),
			'mass': (selections.mass[1] ? selections.mass[0] + ' - ' + selections.mass[1] : ''),
			'massratio': (selections.massratio[1] ? selections.massratio[0] + ' - ' + selections.massratio[1] : ''),
			'distance': (selections.distance[1] ? selections.distance[0] + ' - ' + selections.distance[1] : ''),
			'inclination': (selections.inc[1] ? selections.inc[0] + ' - ' + selections.inc[1] : '')
		};
		for(key in this.langdict.text.observatory.gw.notification.template){
			v = "";
			rep = this.lang.getKey('site.translations[text.observatory.gw.notification.template.'+key+'][site.lang]')||"";
			if(rep){
				if(!required || (required && attr[key])) v = updateFromTemplate(rep,attr)
			}
			if(!required || (required && v!=="")) str += (str ? '\n' : '')+v;
		}
		el.notification.querySelector('textarea').innerHTML = str;
		return str;
	};
	this.updateValues = function(){
		var opt = el.event.options[el.event.selectedIndex];

		selections.event = opt.getAttribute('value');
		selections.date = opt.getAttribute('data-date');
		document.querySelectorAll('.event-name').forEach(function(el){ el.innerHTML = selections.event||'?'; });
		document.querySelectorAll('.event-date').forEach(function(el){ el.innerHTML = selections.date||'?'; });

		var wf = opt.getAttribute('data-waveform')||"";
		if(wf != selections.waveform){
			selections.waveform = wf;
			el.waveform1.setAttribute('src',(wf ? '../waveform-fitter/index.html?data='+wf+'&lang='+this.lang.lang : ''));
			el.waveform3.setAttribute('src',(wf ? '../waveform-fitter/index.html?data='+wf+'&lang='+this.lang.lang : ''));
			el.waveform4.setAttribute('src',(wf ? '../waveform-fitter/index.html?level=advanced&data='+wf+'&lang='+this.lang.lang : ''));
		}

		selections.gridsquares = el.gridsquares.value ? el.gridsquares.value.split(/[^0-9A-Z]+/) : [];
		
		selections.mass = [];
		if(el.massLo.value) selections.mass.push(el.massLo.value);
		if(el.massHi.value) selections.mass.push(el.massHi.value);
		selections.distance = [];
		if(el.distLo.value) selections.distance.push(el.distLo.value);
		if(el.distHi.value) selections.distance.push(el.distHi.value);
		selections.massratio = [];
		if(el.massratioLo.value) selections.massratio.push(el.massratioLo.value);
		if(el.massratioHi.value) selections.massratio.push(el.massratioHi.value);
		selections.inc = [];
		if(el.incLo.value) selections.inc.push(el.incLo.value);
		if(el.incHi.value) selections.inc.push(el.incHi.value);

		this.updateNav();

		this.notification(true);

		return this;
	};
	this.updateNav = function(){
		// Check if there is a previous step
		el.prev.disabled = (step==0);

		// Check if the next step is accessible
		s = step+1;
		if(s < steps.length) el.next.disabled = !(typeof steps[s].ready==="function" ? steps[s].ready.call(this,steps[s]) : true);
		return this;
	};
	var _obj = this;

	el.event.addEventListener('change',function(){ _obj.updateValues(); });
	el.gridsquares.addEventListener('change',function(){ _obj.updateValues(); });
	el.massLo.addEventListener('change',function(){ _obj.updateValues(); });
	el.massHi.addEventListener('change',function(){ _obj.updateValues(); });
	el.massratioLo.addEventListener('change',function(){ _obj.updateValues(); });
	el.massratioHi.addEventListener('change',function(){ _obj.updateValues(); });
	el.distLo.addEventListener('change',function(){ _obj.updateValues(); });
	el.distHi.addEventListener('change',function(){ _obj.updateValues(); });
	el.incLo.addEventListener('change',function(){ _obj.updateValues(); });
	el.incHi.addEventListener('change',function(){ _obj.updateValues(); });

	// Copy the notification to the clipboard
	el.copy.addEventListener('click',function(e){
		ta = el.notification.querySelector('textarea');
		ta.select();
		ta.setSelectionRange(0, 99999); /* For mobile devices */
		navigator.clipboard.writeText(ta.value);
	});
	
	el.btnNotify.addEventListener('click',function(){ _obj.showNotification(); });
	el.btnSteps.addEventListener('click',function(){ _obj.hideNotification(); });
	el.prev.addEventListener('click',function(){ _obj.goTo(step-1); });
	el.next.addEventListener('click',function(){ _obj.goTo(step+1); });
	
	this.goTo();

	return this;
}

function updateFromTemplate(txt,rep){
	var key,safekey;
	for(key in rep){
		reg = new RegExp('\{\{\\s*'+key+'\\s*\}\}');
		txt = txt.replace(reg,rep[key]);
	}
	// Loop back over in case we've got patterns within our patterns 
	for(key in rep){
		reg = new RegExp('\{\{\\s*'+key+'\\s*\}\}');
		txt = txt.replace(reg,rep[key]);
	}
	// Remove all unreplaced tags
	txt = txt.replace(/\{\{\s*[^\}]*\s*\}\}/g,"");
	txt = txt.replace(/<p><\/p>/g,"");
	txt = txt.replace(/\n\t*\n/g,"\n");
	txt = txt.replace(/\\n/g,"<br />");
	return txt;
}

