/*
	GW WaveForm Viewer
*/
(function(root){

	if(!root.ready){
		root.ready = function(fn){
			// Version 1.1
			if(document.readyState != 'loading') fn();
			else document.addEventListener('DOMContentLoaded', fn);
		};
	}
	function errorMessage(msg,error){
		console.error(msg,error);
		var el = document.getElementById('error-message');
		if(!el){
			el = document.createElement('div');
			el.style = 'background:#FFBABA;color:#D8000C;padding:0.5em;position:fixed;bottom:0;left:0;right:0;text-align:center;';
			document.body.appendChild(el);
		}
		el.innerHTML = '<span style="border-radius:100%;width:1em;height:1em;line-height:1em;margin-right:0.5em;display:inline-block;background:#D8000C;color:white;">&times;</span>'+msg;
	}

	function WaveFitter(opts){

		this.version = "2.2.0";
		this.title = "WaveFitter";
		console.info(this.title+' '+this.version);
		this._opts = opts||{};
		this.ns = opts.ns||"wavefitter";
		this.getUrlVars();
		this.debug = (this.urlVars.debug) ? this.urlVars.debug : false;
		this.sliders = opts.sliders || null;
		this.graph = new Graph(opts.graphholder,{
			'axes': {
				'x': {
					'title': {
						'label': '{{ site.translations.waveform.axis.time }}'
					}
				},
				'y': {
					'title': {
						'label': '{{ site.translations.waveform.axis.strain }}'
					}
				}
			}
		});

		// Pass in M0, D0 and t0 as query string parameters
		if(!this.scaler) this.scaler = new Scaler(this.urlVars.M0,this.urlVars.D0,this.urlVars.t0);

		if(this.urlVars.simulation) opts.simulation = this.urlVars.simulation;
		if(this.urlVars.data) opts.data = this.urlVars.data;

		var M0 = this.urlVars.M0 || 50;
		var d0 = this.urlVars.d0 || 400;

		// Set properties
		this.props = {
			'mass':{
				'range':[20,100],
				'options':{
					'step': 1,
					'tooltips': [{to:function(v){ return Math.round(v); }}]
				}
			},
			'dist':{
				'range':[100,800],
				'options':{
					'step': 1,
					'tooltips': [{to:function(v){ return Math.round(v); }}],
				}
			},
			'inclination':{
				'range':[0,90],
				'values':[0],
				'options':{
					'start': [0],
					'range': { 'min': 0, 'max': 90 },
					'tooltips':[{to:function(v){ return Math.round(v)+'&deg;'; }}],
					'step': 1,
					'pips': {mode: 'values', values: [0,90], density:100}
				}
			},
			'massratio': {
				'range': [0.1,1],
				'value': 1,
				'snap': true,
				'options':{
					'step': 0.1,
					'tooltips':[{to:function(v){ return v.toFixed(1); }}],
					'pips': {mode: 'values', values: [0.1,1], density:100,'format':{'to':function(v){ return v.toFixed(1); }}},
					'onupdate': function(e,test){
						this.loadSim(opts.simulation);
					}
				}
			}
		};
		if(this.urlVars.q){
			this.props.massratio.options.snap = true;
			this.urlVars.q = this.urlVars.q.split(/;/);
			var vals = [];
			for(var r = 0; r < this.urlVars.q.length; r++){
				vals[r] = parseFloat(this.urlVars.q[r]);
			}
			var ratiorange = {};
			for(var r = 0; r < this.urlVars.q.length; r++){
				pc = (100*(vals[r] - vals[0])/(vals[vals.length-1] - vals[0])).toFixed(1)+'%';
				if(r == 0) pc = "min";
				if(r == this.urlVars.q.length-1) pc = "max";
				ratiorange[pc] = vals[r];
			}
			this.props.massratio.options.range = ratiorange;
		}

		this.props.mass.value = this.props.mass.range[0] + Math.random()*(this.props.mass.range[1]-this.props.mass.range[0]);
		this.props.dist.value = this.props.dist.range[0] + Math.random()*(this.props.dist.range[1]-this.props.dist.range[0]);

		this.addSliders();
		this.graph.update();

		if(this.urlVars.level!="advanced" && this.sliders.massratio) this.sliders.massratio.style.display = "none";

		// Attach the window event
		var _wf = this;
		window.addEventListener('resize', function(){ _wf.resize(); });
		// Attach more events
		document.getElementById('about-button').addEventListener('click',function(){ showAbout(); });
		document.getElementById('about-close').addEventListener('click',function(){ hideAbout(); });

		if(!this.wavedata && opts.data && opts.simulation) this.load(opts.data,opts.simulation);

		return this;
	}
	
	WaveFitter.prototype.resize = function(){
		this.graph.update();
		this.updateCurves();

		return this;
	};

	WaveFitter.prototype.load = function(filedata,filesim){		
		this.wavedata = {'dataH':null,'simNR':null};

		this.loadData(filedata);
		this.loadSim(filesim);

		return this;
	};

	WaveFitter.prototype.loadData = function(file){
		console.info('Loading data from '+file);
		fetch(file).then(response => {
			if(!response.ok) throw new Error('Network response was not OK');
			return response.text();
		}).then(txt => {
			console.info('Loaded dataH');
			this.wavedata.dataH = parseCSV(txt);
			this.updateData();
		}).catch(error => {
			errorMessage('Unable to load the data "'+file+'"',error);
		});
		return this;
	};

	WaveFitter.prototype.loadSim = function(file){
		file = file.replace(/\{MASSRATIO\}/,this.props.massratio.value.toFixed(1));
		console.info('Loading data from '+file);
		fetch(file).then(response => {
			if(!response.ok) throw new Error('Network response was not OK');
			return response.text();
		}).then(txt => {
			console.info('Loaded simNR');
			this.wavedata.simNR = parseCSV(txt);
			this.updateData();
		}).catch(error => {
			errorMessage('Unable to load the simulation "'+file+'"',error);
		});
		return this;
	};

	WaveFitter.prototype.getUrlVars = function(){
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

	WaveFitter.prototype.updateData = function(){

		// Set the data series
		if(this.wavedata.dataH!==null && !this.graph.series.data){
			this.graph.setSeries("data",this.wavedata.dataH,{
				'id':'line-data',
				'text':'{{ site.translations.waveform.legend.data }}',
				'class':'data',
				'line':{
					'stroke':'rgba(0,150,200,1)'
				}
			});
			// Update the ranges
			this.graph.axes.x.setDataRange(this.graph.series.data);
		}
		if(this.wavedata.simNR!==null && !this.graph.series.sim){
			this.graph.setSeries("sim",this.applyScaling(this.wavedata.simNR),{
				'id':'line-sim',
				'text':'{{ site.translations.waveform.legend.simulation }}',
				'class':'sim',
				'line': {
					'stroke':'rgba(200,150,0,1)'
				}
			});
		}

		this.graph.axes.y.setDataRange(-2,2);

		// Update the scales and domains
		this.graph.updateData();

		// Draw the data
		this.updateCurves();

		this.graph.update();

		return this;
	};

	WaveFitter.prototype.applyScaling = function(d){
		var data = clone(d);
		
		var inc,mass,dist;
		inc = parseFloat(this.props.inclination.slider.noUiSlider.get());
		mass = parseFloat(this.props.mass.value);
		dist = parseFloat(this.props.dist.value);
		
		return this.scaler.scale(data,mass,dist,inc);
	};

	WaveFitter.prototype.updateCurves = function(dur=0){

		if(!this.graph.series.data){
			console.warn('No data loaded yet');
			return this;
		}
		if(this.wavedata.simNR!==null){
			// Update the data values for the series and update the graph
			this.graph.updateSeries("sim",this.applyScaling(this.wavedata.simNR)).drawData();
		}
		return this;
	};

	WaveFitter.prototype.setSliderValue = function(t,v){
		if(this.props[t] && this.props[t].slider){
			this.props.mass.value = v;
			this.props[t].slider.noUiSlider.set(v);
		}else{
			console.warn('No slider for '+t+' to set value for.');
		}
		return this;
	};

	WaveFitter.prototype.setSliderRange = function(t,min,max){
		if(this.props[t] && this.props[t].slider){
			this.props[t].slider.noUiSlider.updateOptions({ range:{ 'min': min,'max': max } });
		}else{
			console.warn('No slider for '+t+' to update range for.');
		}
		return this;
	};
	
	WaveFitter.prototype.addSlider = function(s){
		var _wf=this;
		var options;
		if(this.sliders[s]){
			this.props[s].el = this.sliders[s].querySelector('.param-slider-outer');
			if(!this.props[s].el.querySelector('.param-slider')){
				this.props[s].slider = document.createElement('div');
				this.props[s].slider.classList.add('param-slider');
				this.props[s].slider.setAttribute('id',s+'-slider');
				this.props[s].el.appendChild(this.props[s].slider);

				options = this.props[s].options || {};
				if(!options.start) options.start = this.props[s].value;
				if(!options.connect) options.connect = true;
				if(!options.range) options.range = { 'min': this.props[s].range[0], 'max': this.props[s].range[1] };
				if(!options.tooltips) options.tooltips = [true];
				if(!options.pips) options.pips = {mode: 'positions', values: [0,100], density:100};
				noUiSlider.create(this.props[s].slider, options);
				this.props[s].slider.noUiSlider.on('update',function(values,handle){
					var value = parseFloat(values[handle]);
					_wf.props[s].value = value;
					if(_wf.props[s].options && typeof _wf.props[s].options.onupdate==="function") _wf.props[s].options.onupdate.call(_wf,s,this);
					else _wf.updateCurves(0);
				});
				this.props[s].slider.querySelector('.noUi-value').addEventListener('click',function(e){
					_wf.props[s].slider.noUiSlider.set(Number(this.getAttribute('data-value')));
				});
			}
		}
		return this;
	};

	WaveFitter.prototype.addSliders = function(){
		for(var s in this.props) this.addSlider(s);
		return this;
	};

	function Scaler(M0=65,D0=420,t0=0.423){
		this.M0 = M0;
		this.D0 = D0;
		this.t0 = t0;

		this.scale = function(data,mass,dist,inc){
			var i,t,h,d;

			// Convert to radians
			inc *= Math.PI/180;

			d = dist * 0.5 * (1 + Math.pow(Math.cos(inc),2));

			// Need to update the time and strain for each point
			for(i = 0 ; i < data.length ; i++){

				// Get time and strain
				t = data[i][0];
				h = data[i][1];

				// Scale the time - CHECK THIS
				t = (t-this.t0)*this.M0/mass + this.t0;

				// Scale the strain - CHECK THIS
				h *= (mass/this.M0)*(this.D0/d);

				data[i] = [t, h];
			}
			return data;
		};
		return this;
	}

	function parseCSV(str) {
		var lines = str.split(/\n/g);
		var rows = [];
		var r,i,c;
		for(i = 1; i < lines.length; i++){
			if(lines[i] != ""){
				rows.push(lines[i].split(/,/g));
				r = rows.length-1;
				for(c = 0; c < rows[r].length; c++) rows[r][c] = parseFloat(rows[r][c]);
			}
		}
		return rows;
	}

	function showAbout(){
		var el = document.getElementById('about');
		el.classList.add('on');
		document.body.classList.add('with-overlay');
	}
	function hideAbout(){
		var el = document.getElementById('about');
		el.classList.remove('on');
		document.body.classList.remove('with-overlay');
	}

	function clone(el){
		if(typeof el==="undefined") return {};
		return JSON.parse(JSON.stringify(el));
	}
	root.WaveFitter = WaveFitter;

})(window || this);
