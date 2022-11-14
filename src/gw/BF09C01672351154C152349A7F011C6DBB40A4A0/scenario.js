function Scenario(file,opt,cb){
	if(!opt) opt = {};
	//this.title = "Scenario";

	this.values = {
		'event': query.event,
		'toffset': query.toffset,
		'gridsquares': query.gridsquares,
		'timesA': (query.timesA),
		'timesB': (query.timesB),
		'mass': (query.mass),
		'dist': (query.dist||";").split(/;/),
		'massratio': (query.massratio||";").split(/;/),
		'inc': (query.inc),
		'extra': query.extra
	};

	// Create an Event Notification
	this.notification = new EventNotification({
		'queryString': function(extra){
			q = '?event='+this.vals.event;
			if(this.vals.gridsquares) q += '&gridsquares='+this.vals.gridsquares;
			if(this.vals.timesA) q += '&timesA='+this.vals.timesA;
			if(this.vals.timesB) q += '&timesB='+this.vals.timesB;
			if(this.vals.toffset) q += '&toffset='+this.vals.toffset;
			if(this.vals.mass) q += '&mass='+this.vals.mass;
			if(this.vals.dist && !isNaN(this.vals.dist[0])) q += '&dist='+this.vals.dist.join(';');
			if(this.vals.massratio && !isNaN(this.vals.massratio[0])) q += '&massratio='+this.vals.massratio.join(';');
			if(typeof this.vals.inc!=="undefined") q += '&inc='+this.vals.inc;
			if(extra) q += '&extra='+extra;
			return q;
		},
		'setAttr': function(selection,extra){
			var attr = {
				'name': selection.event||"",
				'date': selection.ev.datetime||"",
				'locations': decodeURI(selection.gridsquares),
				'timesA': decodeURI(selection.timesA||""),
				'timesB': decodeURI(selection.timesB||""),
				'mass': (selection.mass||""),
				'massratio': (selection.massratio && selection.massratio[1] ? selection.massratio[0] + ' - ' + selection.massratio[1] : ''),
				'distance': (selection.dist && selection.dist[1] ? selection.dist[0] + ' - ' + selection.dist[1] : ''),
				'inclination': (selection.inc),
				'extra': selection.extra||extra
			};
			return attr;
		}
	});
	this.json = {};
	fetch(file).then(response => {
		if(!response.ok) throw new Error('Network response was not OK');
		return response.json();
	}).then(json => {
		this.json = json;
		var _obj = this;
		if(typeof Step==="function"){
			
			if(query.event && json.events[query.event]) this.values.ev = json.events[query.event];

			_obj.step = new Step(json,{'notification':_obj.notification,'values':this.values});
		}
	}).catch(error => {
		errorMessage('Unable to load the data "'+file+'"',error);
	});

	return this;
}