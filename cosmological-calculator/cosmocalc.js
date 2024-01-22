/**
	Cosmological Calculator v 0.1
 */
(function(root){
	
	var mainel;

	function CosmoCalc(el,opt){
		mainel = el;
		if(!opt) opt = {};
		if(!opt.catalogue) opt.catalogue = "H0_catalogue.csv";
		if(!opt.width) opt.width = el.innerWidth;
		if(!opt.height) opt.height = opt.width;
		if(!opt.padding) opt.padding = {};
		if(typeof opt.padding.left!=="number") opt.padding.left = 10;
		if(typeof opt.padding.right!=="number") opt.padding.right = 10;
		if(typeof opt.padding.top!=="number") opt.padding.top = 10;
		if(typeof opt.padding.bottom!=="number") opt.padding.bottom = 10;
		if(typeof opt.padding.label!=="number") opt.padding.label = 2;
		if(el.querySelector('.graph')) graph = el.querySelector('.graph');
		else graph = el;
		
		var dmin = el.querySelector('#distancemin');
		var dmax = el.querySelector('#distancemax');
		var redshift = el.querySelector('#z');
		var age = el.querySelector('#age');

		var _obj = this;

		this.init = function(){
			// Create the SVG
			this.svg = { 'el': svgEl('svg') };
			this.svg.el.attr({'width':opt.width,'height':opt.height,'viewBox':'0 0 '+opt.width+' '+opt.height,'xmlns':'http://www.w3.org/2000/svg'});
			this.svg.el.appendTo(graph);

			if(dmin) dmin.addEventListener('change',function(e){ _obj.getUserValues(); });
			if(dmax) dmax.addEventListener('change',function(e){ _obj.getUserValues(); });
			if(redshift) redshift.addEventListener('change',function(e){ _obj.getUserValues(); });

			if(this.svg.el){
				// Get the catalogue file
				fetch(opt.catalogue).then(response => {
					if(!response.ok) throw new Error('Network response was not OK');
					return response.text();
				}).then(txt => {
					this.updateData(parseCSV(txt));
				}).catch(error => {
					console.error('There has been a problem getting '+opt.catalogue+':', error);
				});
			}
			
			return this;
		}

		this.updateData = function(csv){
			this.csv = csv;
			this.data = [];
			var min = 1e100;
			var max = -1e100;
			for(i = 0; i < this.csv.length; i++){
				if(this.csv[i].Include==1){
					this.csv[i].zlo = this.csv[i].z + (typeof this.csv[i].minus==="number" ? this.csv[i].minus : 0);
					this.csv[i].zhi = this.csv[i].z + (typeof this.csv[i].plus==="number" ? this.csv[i].plus : 0);
					min = Math.min(this.csv[i].zlo,min);
					max = Math.max(this.csv[i].zhi,max);
					this.data.push(this.csv[i]);
				}
			}
			// Add user data
			this.data.push({'z':(max+min)/2,'zlo':(max+min)/2,'zhi':(max+min)/2,'Name':'Your value'||"🧑",'class':'user'});
			this.min = min;
			this.max = max;
			
			if(!this.svg.g){

				this.svg.g = svgEl('g');
				this.svg.g.appendTo(this.svg.el);
				this.svg.values = [];
				dy = (opt.height - (opt.padding.top+opt.padding.bottom))/(this.data.length-1);
				for(i = 0; i < this.data.length; i++){
					x = this.getX(this.data[i].z);
					y = this.getY(i);
					g = svgEl('g');
					g.attr({'id':'value-'+i});
					bar = svgEl('line');
					bar.attr({'x1':x,'y1':y,'x2':x,'y2':y,'class':this.data[i].class||'','stroke':'black'});
					bar.appendTo(g);
					bar.animate();
					txt = svgEl('text');
					txt.attr({'x':x+opt.padding.label,'y':y,'id':'text-'+i,'class':this.data[i].class||'','font-size': dy/2,'dominant-baseline':'middle'});
					txt.animate();
					tspan = svgEl('tspan');
					tspan.html(this.data[i].Name);
					tspan.appendTo(txt);
					txt.appendTo(g);
					g.appendTo(this.svg.g);
					this.svg.values.push({'bar':bar,'txt':txt,'g':g});
				}
			}
			this.updateGraph();
			this.getUserValues();
			return this;
		};
		
		this.getUserValues = function(){
			var z,t,min,max,i,dmn,dmx,kmtoMpc,speryear,factor,agelo,agehi;
			min = this.min;
			max = this.min;

			dmn = (dmin ? parseFloat(dmin.value) : 0);
			dmx = (dmax ? parseFloat(dmax.value) : 0);
			if(isNaN(dmn)) dmn = 0;
			if(isNaN(dmx)) dmx = 0;

			if(dmn > dmx){
				t = dmx;
				dmx = dmn;
				dmn = t;
			}

			z = (redshift ? parseFloat(redshift.value) : 0);

			i = this.data.length-1;
			if(dmn > 0 && dmx > 0){
				this.data[i].zlo = (z*299792.458/dmx);
				this.data[i].zhi = (z*299792.458/dmn);
				this.data[i].z = (this.data[i].zlo + this.data[i].zhi)/2;
			}

			if(age){
				kmtoMpc = 1/(1e6*206265*149597871);
				speryear = 3600*24*365.26;
				factor = 1/(kmtoMpc*(1e9*speryear));
				agelo = factor*1/this.data[i].zhi;
				agehi = factor*1/this.data[i].zlo;
				age.innerHTML = agelo.toFixed(2)+' - '+agehi.toFixed(2);
			}

			min = 1e100;
			max = -1e100;
			for(i = 0; i < this.data.length; i++){
				min = Math.min(this.data[i].zlo,min);
				max = Math.max(this.data[i].zhi,max);
			}
			this.min = min;
			this.max = max;
			

			this.updateGraph();
		};

		this.updateGraph = function(){
			var i,j,bar,y,dy,x1,x2,t,min,max,lines,g;
			y = 0;

			lines = clone(this.data);

			for(i = 0; i < lines.length; i++){
				x = this.getX(lines[i].z);
				x1 = this.getX(lines[i].zlo);
				x2 = this.getX(lines[i].zhi);
				this.svg.values[i].bar.animation.set({
					'x1':{'to':x1},
					'x2':{'to':x2}
				});
				this.svg.values[i].txt._el.style.display = (x1 == x2) ? 'none' : '';
				this.svg.values[i].txt.animation.set({'x':{'to':x2+opt.padding.label}});
			}
			return this;
		};
		this.getX = function(v){ return opt.padding.left + (opt.width - opt.padding.right - opt.padding.left)*((v - this.min)/(this.max-this.min)); };
		this.getY = function(v){ return opt.padding.top + v*(opt.height - (opt.padding.top+opt.padding.bottom))/(this.data.length-1); };


		return this.init();
	};

	root.CosmoCalc = CosmoCalc;

	function Animate(e,attr){
		var sty,tag,as;
		sty = window.getComputedStyle(mainel);
		tag = e.tagName.toLowerCase();
		if(!attr) attr = {};
		var duration = '0.3s';
		as = {};
		// Find duration
		if(sty['animation-duration']) this.duration = sty['animation-duration'];
		if(attr.duration) this.duration = attr.duration;
		if(!this.duration) this.duration = duration;
		this.duration = parseFloat(this.duration);
		var oldprops = {};
		this.set = function(props){
			var n,i,a2,b2,a,b,dur;
			e.querySelectorAll('animate').forEach(function(ev){ ev.parentNode.removeChild(ev); });
			for(n in props){
				if(n){
					a = props[n].from||"";
					if(a=="" && oldprops[n] && oldprops[n].to) a = oldprops[n].to;
					if(a=="") a = e.getAttribute(n);
					b = props[n].to;
					if(!a && as[n]) a = as[n].value;
					dur = props[n].duration||this.duration;
					a2 = null;
					b2 = null;
					if(tag=="path"){
						a2 = "";
						b2 = "";
						for(i = 0; i < a.length; i++) a2 += (i>0 ? 'L':'M')+a[i].x.toFixed(2)+','+a[i].y.toFixed(2);
						for(i = 0; i < b.length; i++) b2 += (i>0 ? 'L':'M')+b[i].x.toFixed(2)+','+b[i].y.toFixed(2);
						if(a.length > 0 && a.length < b.length){
							for(i = 0; i < b.length-a.length; i++) a2 += 'L'+a[a.length-1].x.toFixed(2)+','+a[a.length-1].y.toFixed(2);
						}
						if(b.length > 0 && b.length < a.length){
							for(i = 0; i < a.length-b.length; i++) b2 += 'L'+b[b.length-1].x.toFixed(2)+','+b[b.length-1].y.toFixed(2);
						}
						if(!a2) a2 = null;
					}else{
						if(a) a2 = clone(a);
						b2 = clone(b);
					}
					if(dur && a2!==null){
						// Create a new animation
						if(!as[n]) as[n] = {};
						as[n].el = svgEl("animate");
						setAttr(as[n].el._el,{"attributeName":n,"dur":(dur||0),"repeatCount":"1"});
						as[n].el.appendTo(e);
					}
					// Set the final value
					e.setAttribute(n,b2);
					if(dur && a2!==null){
						setAttr(as[n].el._el,{"from":a2,"to":b2,"values":a2+';'+b2}); 
						as[n].el._el.beginElement();
						as[n].value = b;
					}
				}
			}
			oldprops = props;
			return this;
		};
		return this;
	}
	function removeEl(el){
		if(el && el.parentNode !== null) el.parentNode.removeChild(el);
	}
	// Function to clone a hash otherwise we end up using the same one
	function clone(hash) {
		var json = JSON.stringify(hash);
		var object = JSON.parse(json);
		return object;
	}
	function setAttr(el,prop){
		for(var p in prop) el.setAttribute(p,prop[p]);
		return el;
	}
	function svgElement(t){
		this._el = document.createElementNS('http://www.w3.org/2000/svg',t);
		this.append = function(el){ this._el.appendChild(el); return this; };
		this.appendTo = function(el){ if(el._el){ el._el.appendChild(this._el); }else{ el.appendChild(this._el); } return this; };
		this.attr = function(obj,v){
			var key;
			// Build an object from a key/value pair
			if(typeof obj==="string"){ key = obj; obj = {}; obj[key] = v; }
			for(key in obj) this._el.setAttribute(key,obj[key]);
			return this;
		};
		this.html = function(t){ this._el.textContent = t; return this; };
		this.addClass = function(cls){ this._el.classList.add(...cls.split(" ")); return this; };
		this.removeClass = function(){ this._el.classList.remove(...arguments); return this; };
		this.data = function(d){ this._data = d; return this; };
		this.animate = function(){
			this.animation = new Animate(this._el);
		}
		return this;
	}

	function svgEl(t){ return new svgElement(t); }

	// A simple CSV parsing function
	function parseCSV(txt){
		var i,c,d,n,v,lines,cols,head,header,rows;
		lines = txt.split(/[\n\r]/);
		rows = [];
		for(i = 0; i < lines.length; i++){
			cols = lines[i].split(/,(?=(?:[^\"]*\"[^\"]*\")*(?![^\"]*\"))/g);
			if(i==0){
				header = cols;
				head = {};
				for(c = 0; c < cols.length; c++) head[cols[c]] = c;
			}else{
				d = {'_i':i};
				for(c = 0; c < cols.length; c++){
					n = header[c];
					v = cols[c];
					d[n] = cols[c].replace(/(^\"|\"$)/g,"");
					if(typeof parseFloat(v)==="number" && parseFloat(v) == v) d[n] = parseFloat(cols[c]);
					if(v.search(/^(true|false)$/i) >= 0) v = (v=="true" ? true : false);
				}
				rows.push(d);
			}
		}
		return rows;
	}

})(window || this);