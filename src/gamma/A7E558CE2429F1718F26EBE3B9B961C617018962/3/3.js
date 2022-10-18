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
/*
		el.slider.noUiSlider.on('update', function (values, handle) {
			rangeSliderValueElement.innerHTML = values[handle]+'&deg;';
			brightness.updateValues();
		});

*/

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

	var ev = opt.event;
	var dist = opt.dist;
	var _obj = this;

	this.getE = function(theta,dist){
		return Math.pow(10,(9.2 * Math.exp(-0.458*theta) + 37.5));
		return Math.pow(10,(9.2 * Math.exp(-0.458*theta) + 37.5))/Math.pow((dist/ev.distance),2);
	};

	var reference = document.createElement('div');
	reference.classList.add('reference','ga');
	el.appendChild(reference);

	var indicator = document.createElement('div');
	indicator.classList.add('indicator','ga-highlight');
	el.appendChild(indicator);

	dist[0].addEventListener('change',function(e){ _obj.updateValues(); });
	dist[1].addEventListener('change',function(e){ _obj.updateValues(); });



	E = Math.log10(4.17e39);
	d1 = parseFloat(dist[0].value)||0;
	d2 = parseFloat(dist[1].value)||d1;
	E_a = this.getE(90,d1);
	E_b = this.getE(0,d2);
	l = Math.floor(Math.log10(E_a));
	r = Math.ceil(Math.log10(E_b));


	// Update the values
	this.updateValues = function(){

		d1 = parseFloat(dist[0].value)||0;
		d2 = parseFloat(dist[1].value)||d1;
		inc = parseFloat(opt.inclination.noUiSlider.get());

		E_a = this.getE(inc,d1);
		E_b = this.getE(inc,d2);
		l = Math.floor(Math.log10(E_a));
		r = Math.ceil(Math.log10(E_b));
		console.log('updateValues',d1,d2,l,r);

		indicator.setAttribute('style','left:'+E.toFixed(2)+'%;');

		reference.setAttribute('style','left:'+l+'%;right:'+r+'%')

		return this;
	};


	this.getPC = function(E){
		var v = Math.log10(E);
		var pc = ((v-l)/(r-l))*100;
		return pc;
	};

	if(E_a==Infinity || E_b==Infinity){
		console.error('Range is infinite',E_a,E_b);
		return this;
	}

	// Add labels
	for(i = Math.floor(l); i <= Math.ceil(r); i++){
		x = this.getPC(Math.pow(10,i));
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
