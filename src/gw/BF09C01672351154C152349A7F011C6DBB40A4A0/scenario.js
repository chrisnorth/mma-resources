function Scenario(file,opt,cb){
	if(!opt) opt = {};
	//this.title = "Scenario";
	// Create an Event Notification
	this.notification = new EventNotification({
		'queryString': function(extra){
			q = '?event='+this.vals.event;
			if(this.vals.gridsquares) q += '&gridsquares='+this.vals.gridsquares;
			if(this.vals.toffset) q += '&toffset='+this.vals.toffset;
			if(this.vals.mass && !isNaN(this.vals.mass[0])) q += '&mass='+this.vals.mass.join(';');
			if(this.vals.dist && !isNaN(this.vals.dist[0])) q += '&dist='+this.vals.dist.join(';');
			if(this.vals.massratio && !isNaN(this.vals.massratio[0])) q += '&massratio='+this.vals.massratio.join(';');
			if(this.vals.inc && !isNaN(this.vals.inc[0])) q += '&inc='+this.vals.inc.join(';');
			if(extra) q += '&extra='+extra;
			return q;
		},
		'setAttr': function(selection,extra){
			var attr = {
				'name': selection.event||"",
				'date': selection.ev.datetime||"",
				'locations': decodeURI(selection.gridsquares),
				'mass': (selection.mass && selection.mass[1] ? selection.mass[0] + ' - ' + selection.mass[1] : ''),
				'massratio': (selection.massratio && selection.massratio[1] ? selection.massratio[0] + ' - ' + selection.massratio[1] : ''),
				'distance': (selection.dist && selection.dist[1] ? selection.dist[0] + ' - ' + selection.dist[1] : ''),
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
		if(typeof Step==="function"){
			_obj.step = new Step(json,{'notification':_obj.notification});
		}
	}).catch(error => {
		errorMessage('Unable to load the data "'+file+'"',error);
	});

	return this;
}