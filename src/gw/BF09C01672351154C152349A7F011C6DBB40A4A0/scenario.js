
function Scenario(file,opt,cb){
	if(!opt) opt = {};
	this.title = "Scenario";
	this.notification = new Notification();
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