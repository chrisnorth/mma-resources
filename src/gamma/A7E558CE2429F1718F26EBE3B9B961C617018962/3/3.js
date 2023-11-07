function Step(data,opt){
	if(!opt) opt = {};
	var el = {
		'incLo': document.getElementById('inc-lo'),
		'incHi': document.getElementById('inc-hi'),
		'distLo': document.getElementById('dist-lo'),
		'distHi': document.getElementById('dist-hi'),
		'content': document.getElementById('content'),
		'slider': document.getElementById('slider'),
		'brightness': document.getElementById('brightness'),
		'prev': document.getElementById('prev'),
		'next': document.getElementById('next'),
	};

	var _obj = this;

	el.prev.addEventListener('click',function(e){
		e.preventDefault();
		location.href = e.target.getAttribute('href')+opt.notification.queryString();
	});

	el.incLo.addEventListener('change',function(e){ _obj.updateValues(); });
	el.incHi.addEventListener('change',function(e){ _obj.updateValues(); });

	this.init = function(e){

		if(opt.values.inc[0]) el.incLo.value = parseFloat(opt.values.inc[0]);
		if(opt.values.inc[1]) el.incHi.value = parseFloat(opt.values.inc[1]);

		// Build brightness indicator
		var brightness = new BrightnessIndicator(el.brightness,{'event':opt.values.ev,'dist':[el.distLo,el.distHi],'inclination':el.slider});

		// Build Inclination slider
		var rangeSlider = noUiSlider.create(el.slider, {
			start: [0],
			step: 0.01,
			range: {
				'min': 0,
				'max': 90
			},
			pips: {
				mode: 'count',
				values: 4,
				density: 10
			}
		});

		var rangeSliderValueElement = document.getElementById('slider-range-value');

		el.slider.noUiSlider.on('update', function (values, handle) {
			rangeSliderValueElement.innerHTML = values[handle]+'&deg;';
			brightness.updateValues();
		});

		this.updateValues();

		return this;
	};

	
	this.updateValues = function(){
		opt.values.inc = [parseFloat(el.incLo.value),parseFloat(el.incHi.value)];

		//if(!isNaN(opt.values.inc[0]) && !isNaN(opt.values.inc[1])) el.next.removeAttribute('disabled');
		//else el.next.setAttribute('disabled','disabled');

		if(opt.notification) opt.notification.set(opt.values);

		return this;
	}

	this.init();

	return this;
}

function BrightnessIndicator(el,opt){
	if(!opt || !opt.dist){
		console.error('No distance elements given');
		return this;
	}

	var E_iso_measured = 4.17e39;

	var ev = opt.event;
	var dist = opt.dist;	// An array of DOM elements
	var _obj = this;

	function getE(theta,dist){ return Math.pow(10,(9.2 * Math.exp(-0.458*theta) + 37.5)); };

	// Add brightness indicator elements to DOM
	var reference = document.createElement('div');
	reference.classList.add('reference','gw');
	el.querySelector('.inner').appendChild(reference);
	var indicator = document.createElement('div');
	indicator.classList.add('indicator','ga-highlight');
	el.querySelector('.inner').appendChild(indicator);

	// Add change events to the distance values
	dist[0].addEventListener('change',function(e){ _obj.updateValues(); });
	dist[1].addEventListener('change',function(e){ _obj.updateValues(); });

	var E = Math.log10(E_iso_measured);
	var E_l = getE(90);
	var E_r = getE(0);
	var l = Math.floor(Math.log10(E_l));
	var r = Math.ceil(Math.log10(E_r));
	
	// Update indicator position
	var Ipc = (100*(E-l)/(r-l));
	indicator.setAttribute('style','left:'+Ipc.toFixed(2)+'%;');
	indicator.setAttribute('title','{{ site.translations.main.observatory.gamma.step3.measured }}'.replace(/\{\{ ?value ?\}\}/,E_iso_measured));

	// Update the values
	this.updateValues = function(){

		var dmin = Math.max(0.1,parseFloat(dist[0].value)||0);
		var dmax = parseFloat(dist[1].value)||dmin;
		var inc = parseFloat(opt.inclination.noUiSlider.get());
		var E_max = getE(inc)/Math.pow((dmin/ev.distance),2);
		var E_min = getE(inc)/Math.pow((dmax/ev.distance),2);

		// Set the left and right edges of the reference area
		reference.setAttribute('style','left:'+getPC(E_min)+'%;right:'+(100-getPC(E_max))+'%')

		return this;
	};

	function getPC(v){
		return ((Math.log10(v)-l)/(r-l))*100;
	};

	if(E_l==Infinity || E_r==Infinity){
		console.error('Range is infinite',E_l,E_r);
		return this;
	}

	// Add labels
	for(i = Math.floor(l); i <= Math.ceil(r); i++){
		x = getPC(Math.pow(10,i));
		lbl = document.createElement('div');
		lbl.classList.add('axis-label');
		lbl.innerHTML = '<div><div class="tick"></div><span class="label">10<sup>'+i+'</sup></span></div>';
		lbl.style.left = x+'%';
		el.appendChild(lbl);
	}

	return this;
}

var scenario;
ready(function(){
	scenario = new Scenario('../scenario.json');
});
