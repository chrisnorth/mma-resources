function Step(data,opt){
	if(!opt) opt = {};
	var el = {
		'event': document.getElementById('select-event'),
		'content': document.getElementById('content'),
		'prev': document.getElementById('prev'),
		'next': document.getElementById('next'),
	};

	var _obj = this;

	el.prev.addEventListener('click',function(e){
		e.preventDefault();
		location.href = e.target.getAttribute('href')+opt.notification.queryString();
	});

	this.init = function(e){

		if(opt.notification) opt.notification.set(opt.values);

	};

	this.init();

	return this;
}

var scenario;
ready(function(){
	scenario = new Scenario('../scenario.json');
});
