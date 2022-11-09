function Scenario(file,opt,cb){
	if(!opt) opt = {};
	this.title = "Scenario";

	this.notification = new EventNotification({
		'queryString': function(extra){
			if(this.vals){
				q = '?event='+this.vals.event;
				if(this.vals.t0) q += '&t0='+this.vals.t0;
				if(this.vals.t90) q += '&t90='+this.vals.t90;
				if(this.vals.t100) q += '&t100='+this.vals.t100;
				if(this.vals.locations) q += '&locations='+this.vals.locations;
				if(this.vals.inc && !isNaN(this.vals.inc[0]) && this.vals.inc[0] != "") q += '&inc='+this.vals.inc.join(';');
				if(extra) q += '&extra='+extra;
				return q;
			}else{
				return '';
			}
		},
		'setAttr': function(selection,extra){
			//console.log('setAttr',selection,extra);
			var attr = {
				'name': selection.event||"",
				't0': selection.t0||"",
				't90': selection.t90||"",
				't100': selection.t100||"",
				'date': selection.ev.datetime||"",
				'locations': decodeURI(selection.locations)||"",
				'inclination': (selection.inc && selection.inc[1] ? selection.inc[0] + ' - ' + selection.inc[1] : ''),
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
		var vals = {
			'ev': json.events[query.event],
			'event': query.event,
			'locations': query.locations||"",
			't0': query.t0||"",
			't90': query.t90||"",
			't100': query.t100||"",
			'inc': (query.inc||";").split(/;/),
			'extra': query.extra
		};

		if(typeof Step==="function") _obj.step = new Step(json,{'notification':_obj.notification,'values':vals});

	}).catch(error => {
		errorMessage('Unable to load the data "'+file+'"',error);
	});

	return this;
}