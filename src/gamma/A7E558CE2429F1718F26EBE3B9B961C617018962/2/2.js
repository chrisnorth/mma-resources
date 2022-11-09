function Step(data,opt){
	if(!opt) opt = {};
	var el = {
		'event': document.getElementById('select-event'),
		'counts': document.getElementById('detector-counts'),
		'locations': document.getElementById('detector-locations'),
		'input': document.getElementById('select-location'),
		'prev': document.getElementById('prev'),
		'next': document.getElementById('next'),
	};

	var _obj = this;

	el.prev.addEventListener('click',function(e){
		e.preventDefault();
		location.href = e.target.getAttribute('href')+opt.notification.queryString();
	});
	el.next.addEventListener('click',function(e){
		e.preventDefault();
		if(e.target.getAttribute('disabled')!="disabled") location.href = e.target.getAttribute('href')+opt.notification.queryString();
	});

	function highlightDetector(n=""){
		for(var i in _obj.map.detectors){
			_obj.map.detectors[i].path.setAttribute('stroke-width',(i==n ? 8 : 1));
			_obj.map.detectors[i].label.setAttribute('stroke',(i==n ? _obj.map.detectors[i].label.getAttribute('fill') : ''));
		}
	}
	// Construct a row of the detector counts table
	function makeRow(n){
		tr = document.createElement('tr');
		tr.innerHTML = '<td>'+n+'</td><td>'+opt.values.ev.peaks[n]+'</td><td>'+data.metadata.detector.locations[n].RA.value+'&deg;</td><td>'+data.metadata.detector.locations[n].Dec.value+'&deg;</td>';
		tr.addEventListener('mouseover',function(e){ highlightDetector(n); });
		tr.addEventListener('click',function(e){ highlightDetector(n); });
		return tr;
	}
	this.init = function(e){

		el.next.setAttribute('disabled','disabled');

		// Make detector counts table
		var table = document.createElement('table');
		table.innerHTML = '<thead><th>{{ site.translations.main.observatory.gamma.step2.table.detector }}</th><th>{{ site.translations.main.observatory.gamma.step2.table.counts }}</th><th>{{ site.translations.main.observatory.gamma.step2.table.ra }}</th><th>{{ site.translations.main.observatory.gamma.step2.table.dec }}</th></thead><tbody></tbody>';
		for(var n in opt.values.ev.peaks) table.querySelector('tbody').appendChild(makeRow(n));
		el.counts.appendChild(table);
		table.addEventListener('mouseleave',function(e){ highlightDetector(); });
		table.addEventListener('blur',function(e){ highlightDetector(); });


		if(query.locations) el.input.value = decodeURI(query.locations);

		// Make location map
		var _obj = this;
		this.map = new Mollweide(el.locations,{
			'onSelect': function(str){ _obj.setLocations(str); },
			'locations': el.input.value,
			'detectors': data.metadata.detector.locations
		});

		if(opt.notification) opt.notification.set(opt.values);

		return this;
	};
	
	this.setLocations = function(v){
		if(v) el.next.removeAttribute('disabled');
		else el.next.setAttribute('disabled','disabled');
		opt.values.locations = v;
		el.input.value = v;

		if(opt.notification) opt.notification.set(opt.values);

		return this;
	};

	this.init();

	return this;
}

function Mollweide(el,opt){
	if(!opt) opt = {};

	var holder = document.createElement('div');
	holder.classList.add('map');
	el.appendChild(holder);

	this.wide = holder.offsetWidth;
	this.tall = holder.offsetHeight;

	this.d2r = Math.PI/180;
	this.r2d = 180.0/Math.PI;
	this.az_off = 0;
	this.grid = [];

	this.radec2xy = function(ra,dec){
		var dtheta, x, y, sign, normra;
		var thetap = Math.abs(dec);
		var pisindec = Math.PI*Math.sin(Math.abs(dec));
		// Now iterate to correct answer
		for(var i = 0; i < 20 ; i++){
			dtheta = -(thetap + Math.sin(thetap) - pisindec)/(1+Math.cos(thetap));
			thetap += dtheta;
			if(dtheta < 1e-4) break;
		}
		normra = (ra+this.d2r*this.az_off) - Math.PI;
		x = -(2/Math.PI)*(normra)*Math.cos(thetap/2)*this.tall/2 + this.wide/2;
		sign = (dec >= 0) ? 1 : -1;
		y = -sign*Math.sin(thetap/2)*this.tall/2 + this.tall/2;
		return {x:x,y:y};
	};

	this.xy2radec = function(x, y){
		var X  = (this.wide/2 - x) * Math.sqrt(2) * 2 / this.tall;
		var Y = (this.tall/2 - y) * Math.sqrt(2) * 2 / this.tall;

		var theta = Math.asin(Y / Math.sqrt(2));
		var dec = Math.asin((2 * theta + Math.sin(2 * theta)) / Math.PI);
		if (Math.abs(X) > 2 * Math.sqrt(2) * Math.cos(theta)) {
			// Out of bounds
			return undefined;
		}
		var ra = Math.PI - (this.d2r*this.az_off) + Math.PI * X / (2 * Math.sqrt(2) * Math.cos(theta));
		return {ra: ra, dec: dec};
	};

	this.draw = function(){
		// Redraw within 20ms. Used to avoid redraw pilling up, introducing vast lag
		if(this.pendingRefresh !== undefined) return;
		this.pendingRefresh = window.setTimeout(this.drawImmediate.bind(this), 20);
		return this;
	};

	this.drawImmediate = function(){
		
		this.drawBoundary();
		this.drawDetectors();
		this.drawGridSquares();
		return this;
	};

	this.drawBoundary = function(){
		
		// Draw border of the sky
		var path = svgEl('path');
		var d = 'M'+(this.wide/2)+','+(this.tall/2);
		
		var x = this.wide/2-this.tall;
		var y = 0;
		var w = this.tall*2;
		var h = this.tall;
		var kappa = 0.5522848;
		var ox = (w / 2) * kappa; // control point offset horizontal
		var oy = (h / 2) * kappa; // control point offset vertical
		var xe = x + w;           // x-end
		var ye = y + h;           // y-end
		var xm = x + w / 2;       // x-middle
		var ym = y + h / 2;       // y-middle

		d += 'M'+x+','+ym;
		d += 'C '+x+','+(ym - oy)+' '+(xm - ox)+','+y+' '+xm+','+y;
		d += 'C '+(xm + ox)+','+y+' '+xe+','+(ym - oy)+' '+xe+','+ym;
		d += 'C '+(xe)+','+(ym + oy)+' '+(xm + ox)+','+(ye)+' '+xm+','+ye;
		d += 'C '+(xm - ox)+','+(ye)+' '+(x)+','+(ym + oy)+' '+x+','+ym;
		
		setAttr(path,{'d':d,'fill':'#faebd7','stroke':'#444'});
		this.svg.appendChild(path);

		return this;
	};

	this.drawDetectors = function(){

		var i,d,pts,pos,path,d,g,str;
		this.detectors = {};

		g = svgEl('g');
		this.svg.appendChild(g);

		for(d in opt.detectors){
			pts = SmallCircle(opt.detectors[d].RA.value,opt.detectors[d].Dec.value,opt.detectors[d].Dec.uncertainty,50);
			this.detectors[d] = {'path':svgEl('path'),'label':svgEl('text')};
			str = '';
			for(i = 0; i < pts.length; i++){
				pos = this.radec2xy(pts[i][0]*this.d2r,pts[i][1]*this.d2r);
				str += (i==0 ? 'M':'L')+pos.x.toFixed(3)+','+pos.y.toFixed(3);
			}
			str += 'Z';
			setAttr(this.detectors[d].path,{'d':str,'fill':'rgba(165,158,150,0.3)','stroke':'rgb(165,158,150)','stroke-width':1,'data':d});
			g.appendChild(this.detectors[d].path);
			pos = this.radec2xy(opt.detectors[d].RA.value*this.d2r,opt.detectors[d].Dec.value*this.d2r);

			this.detectors[d].label.innerHTML = d;
			setAttr(this.detectors[d].label,{'x':pos.x,'y':pos.y,'text-anchor':'middle','dominant-baseline':'central','fill':'#8c8984'});
			g.appendChild(this.detectors[d].label);
		}

		return this;
	};


	// Make a 12x24 grid
	this.drawGridSquares = function(){
		
		var i,l,pos,path,dec,p;

		var letters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X'];
		var deltadec = 15;
		var deltara = 15;
		var dec_a,dec_b,ra_a,ra_b;
		var ndec = 12;
		var step = 1;
		
		var g = svgEl('g');
		this.svg.appendChild(g);

		this.grid = new Array(ndec);
		for(i = 0; i < ndec; i++){

			this.grid[i] = new Array(letters.length);

			dec_a = -90 + (i*deltadec);
			dec_b = dec_a + deltadec;
			

			for(l = 0; l < letters.length; l++){

				ra_a = l*deltara;
				ra_b = ra_a + deltara;

				this.grid[i][l] = {
					'id': letters[letters.length-1-l]+(i+1),	// Letters go in the opposite sense to RA
					'pos': {
						'se': {'ra':ra_a,'dec':dec_a,'xy':this.radec2xy(ra_a*this.d2r,dec_a*this.d2r)},
						'sw': {'ra':ra_b,'dec':dec_a,'xy':this.radec2xy(ra_b*this.d2r,dec_a*this.d2r)},
						'nw': {'ra':ra_b,'dec':dec_b,'xy':this.radec2xy(ra_b*this.d2r,dec_b*this.d2r)},
						'ne': {'ra':ra_a,'dec':dec_b,'xy':this.radec2xy(ra_a*this.d2r,dec_b*this.d2r)}
					},
					'cell': svgEl('path'),
					'selected': false
				};
				
				pos = this.grid[i][l].pos;
				
				path = 'M'+pos.se.xy.x.toFixed(3)+','+pos.se.xy.y.toFixed(3);
				path += 'L'+pos.sw.xy.x.toFixed(3)+','+pos.sw.xy.y.toFixed(3);
				// Move in declination in small steps
				for(dec = dec_a; dec <= dec_b; dec += step){
					p = this.radec2xy(ra_b*this.d2r,dec*this.d2r);
					path += 'L'+p.x.toFixed(3)+','+p.y.toFixed(3);
				}
				path += 'L'+pos.nw.xy.x.toFixed(3)+','+pos.nw.xy.y.toFixed(3);
				path += 'L'+pos.ne.xy.x.toFixed(3)+','+pos.ne.xy.y.toFixed(3);
				// Move in declination in small steps to SE corner
				for(dec = dec_b; dec >= dec_a; dec -= step){
					p = this.radec2xy(ra_a*this.d2r,dec*this.d2r);
					path += 'L'+p.x.toFixed(3)+','+p.y.toFixed(3);
				}
				
				this.grid[i][l].cell.classList.add('grid-cell');
				setAttr(this.grid[i][l].cell,{'d':path,'stroke':'#b2b2b2','stroke-width':0.5,'stroke-opacity':0.5,'fill':'transparent','data':ra_a+';'+dec_a+';'+ra_b+';'+dec_b,'style':'cursor:pointer'});
				g.appendChild(this.grid[i][l].cell);
				
				this.activateGridSquare(i,l);
			}
		}

		if(opt.locations){
			this.toggleGridSquares(opt.locations);
			opt.locations = "";
		}


		return;
	};

	this.toggleGridSquares = function(str){
		var sq = str.split(/, ?/);
		var i,j,s;
		for(i = 0; i < this.grid.length; i++){
			for(j = 0; j < this.grid[i].length; j++){
				ok = false;
				for(s = 0; s < sq.length; s++){
					if(sq[s] == this.grid[i][j].id){
						ok = true;
					}
				}
				if((ok && !this.grid[i][j].selected) || (!ok && this.grid[i][j].selected)){
					this.toggleSelection(i,j);
				}
			}
		}
		return this;
	};

	this.activateGridSquare = function(i,j){
		if(!this.grid[i][j].activated){
			var _obj = this;
			this.grid[i][j].cell.addEventListener('mouseover',function(e){
				//console.log(_obj.grid[i][j].id);
			});
			this.grid[i][j].cell.addEventListener('click',function(e){
				_obj.toggleSelection(i,j);
			});
			this.grid[i][j].activated = true;
		}
		return this;
	};

	this.toggleSelection = function(i,j){

		// Toggle the selection of this grid cell
		this.grid[i][j].selected = !this.grid[i][j].selected;

		// Set the style to reflect the selection
		var attr = { 'fill': (this.grid[i][j].selected) ? 'rgba(45, 155, 240,0.5)' : 'transparent' };
		setAttr(this.grid[i][j].cell,attr);

		// Build a string of selected cells
		var a,b,str;
		str = '';
		for(a = 0; a < this.grid.length; a++){
			for(b = 0; b < this.grid[a].length; b++){
				if(this.grid[a][b].selected) str += (str ? ', ' : '')+this.grid[a][b].id;
			}
		}

		// Trigger a callback function
		if(typeof opt.onSelect==="function") opt.onSelect.call(opt.this||this,str);

		return this;
	};

	this.svg = svgEl('svg');
	var svgopt = {'xmlns':'http://www.w3.org/2000/svg','version':'1.1','viewBox':'0 0 '+this.wide+' '+this.tall,'overflow':'visible','style':'max-width:100%;','preserveAspectRatio':'xMidYMid meet','style':'aspect-ratio:2 / 1'};
	setAttr(this.svg,svgopt);
	holder.appendChild(this.svg);
	
	this.draw();
	
	return this;
}

// Adapted from https://gis.stackexchange.com/questions/56584/how-to-calculate-smallcircle-on-sphere
function SmallCircle(clon,clat,smallrad,nrpoints){
	// clon = circle central longitude (deg)
	// clat = circle central latitude (deg)
	var radius = 1;		// radius of sphere (doesn't matter)
	var llon = clon;	// longitude of point on circle line (deg)
	var llat = clat + smallrad;	// latitude of point on circle line (deg) - we just offset by our small circle radius

	var dlat,dlon,a,c,d,y,x,brng,angle,circleradius,circlelength,list,nrpoints,i,lat,lon;

	dlat = radians(llat-clat)
	dlon = radians(llon-clon)
	clat = radians(clat)
	clon = radians(clon)
	llat = radians(llat)
	llon = radians(llon)

	a = Math.sin(dlat/2) * Math.sin(dlat/2) + Math.sin(dlon/2) * Math.sin(dlon/2) * Math.cos(clat) * Math.cos(llat);
	c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	d = radius * c;

	// bearing
	y = Math.sin(dlon) * Math.cos(llat);
	x = Math.cos(clat)*Math.sin(llat) - Math.sin(clat)*Math.cos(llat)*Math.cos(dlon);
	brng = Math.atan2(y, x);

	// circle
	angle = distance(clon,clat,llon,llat);
	circleradius = Math.sin(angle) * radius;
	circlelength = 2*Math.PI*circleradius;

	// loop circle
	list = []
	list.push([degrees(llon),degrees(llat)]);

	if(!nrpoints) nrpoints = 10;

	for(i = 0; i < nrpoints; i++){
		brng = (i / nrpoints)*2.0*Math.PI;
		lat = Math.asin( Math.sin(clat)*Math.cos(d/radius) + Math.cos(clat)*Math.sin(d/radius)*Math.cos(brng) );
		lon = clon + Math.atan2(Math.sin(brng)*Math.sin(d/radius)*Math.cos(clat), Math.cos(d/radius)-Math.sin(clat)*Math.sin(lat));
		list.push([degrees(lon),degrees(lat)]);
	}

	return list;
}
function distance(lon1, lat1, lon2, lat2){
	// http://code.activestate.com/recipes/576779-calculating-distance-between-two-geographic-points/
	// http://en.wikipedia.org/wiki/Haversine_formula
	var dlat = lat2 - lat1
	var dlon = lon2 - lon1
	var q = Math.pow(Math.sin(dlat/2),2) + (Math.cos(lat1) * Math.cos(lat2) * (Math.pow(Math.sin(dlon/2),2)));
    return 2 * Math.atan2(Math.sqrt(q), Math.sqrt(1-q));
}
function radians(v){ return v*Math.PI/180; }
function degrees(v){ return v*180/Math.PI; }


function clone(a){ return JSON.parse(JSON.stringify(a)); }
function svgEl(t){ return document.createElementNS('http://www.w3.org/2000/svg',t); }
function setAttr(el,prop){
	for(var p in prop) el.setAttribute(p,prop[p]);
	return el;
}

var scenario;
ready(function(){
	scenario = new Scenario('../scenario.json');
});
