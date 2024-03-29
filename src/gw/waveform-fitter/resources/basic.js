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

	function BasicWaveFitter(opts){

		this.version = "2.1.1";
		this.title = "BasicWaveFitter";
		console.info(this.title+' '+this.version);
		this._opts = opts||{};
		this.ns = opts.ns||"wavefitter";
		this.getUrlVars();
		this.debug = (this.urlVars.debug) ? this.urlVars.debug : false;
		var _obj = this;
		this.graph = new Graph(opts.graphholder);

		this.scales = {};
		if(this.urlVars.simulation) opts.simulation = this.urlVars.simulation;
		if(this.urlVars.data) opts.data = this.urlVars.data;

		this.graph.update();

		// Attach the window event
		var _wf = this;
		window.addEventListener('resize', function(){ _wf.resize(); });

		if(!this.wavedata && opts.data) this.loadData(opts.data);

		return this;
	}
	
	BasicWaveFitter.prototype.resize = function(){
		this.graph.update();
		return this;
	};

	BasicWaveFitter.prototype.loadData = function(file){
		this.wavedata = {'dataH':null};
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

	BasicWaveFitter.prototype.getUrlVars = function(){
		var vars = {},hash;
		var url = window.location.href;
		if(window.location.href.indexOf('?')!=-1){
			var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
			url = window.location.href.slice(0,window.location.href.indexOf('?'));
			for(var i = 0; i < hashes.length; i++){
				hash = hashes[i].split('=');
				vars[hash[0]] = hash[1];
			}
		}
		this.urlVars = vars;
		this.url = url;
	};

	BasicWaveFitter.prototype.updateData = function(){

		// Set the data series
		if(this.wavedata.dataH!==null && !this.graph.series[0]){
			this.graph.setSeries(0,this.wavedata.dataH,{
				'id':'line-data',
				'text':'text.legend.data',
				'class':'',
				'line': {
					'stroke':this.urlVars.color||'rgba(0,150,200,1)'
				},
				'offset':parseFloat(this.urlVars.toffset)||0
			});
			// Update the ranges
			this.graph.axes.x.setDataRange(this.graph.series[0]);
		}

		this.graph.axes.y.setDataRange(-2,2);

		// Update the scales and domains
		this.graph.updateData();

		this.graph.update();

		return this;
	};


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

	root.BasicWaveFitter = BasicWaveFitter;

})(window || this);
