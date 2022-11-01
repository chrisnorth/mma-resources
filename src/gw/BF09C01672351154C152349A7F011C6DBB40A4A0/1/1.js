function Step(data,opt){
	if(!opt) opt = {};
	var el = {
		'event': document.getElementById('select-event'),
		'waveform': document.getElementById('waveform'),
		'none': document.getElementById('no-event'),
		'prev': document.getElementById('prev'),
		'next': document.getElementById('next'),
	};
	var vals = {
		'ev': data.events[query.event],
		'event': query.event,
		'toffset': query.toffset,
		'gridsquares': query.gridsquares,
		'mass': (query.mass||";").split(/;/),
		'dist': (query.dist||";").split(/;/),
		'massratio': (query.massratio||";").split(/;/),
		'inc': (query.inc||";").split(/;/),
		'extra': query.extra
	};

	var _obj = this;

	el.event.addEventListener('change',function(e){
		_obj.setEvent(e.target.value);
	});
	el.next.addEventListener('click',function(e){
		e.preventDefault();
		if(e.target.getAttribute('disabled')!="disabled") location.href = e.target.getAttribute('href')+opt.notification.queryString();
	});

	this.setEvent = function(e){
		var file,ev,dt;
		dt = '';
		vals.event = e;
		vals.ev = {};
		vals.gridsquares = '';
		vals.mass = '';
		vals.dist = '';
		vals.massratio = '';
		vals.inc = '';

		if(e){
			if(data.events[e]){
				vals.ev = data.events[e];
				el.next.removeAttribute('disabled');
				el.none.style.display = 'none';
				el.waveform.style.display = '';
				if(!this.graph){
					this.graph = new Graph(el.waveform,{
						'axes':{
							'x':{
								'title': {
									'label':'{{ site.translations.waveform.axis.time }}'
								}
							},
							'y':{
								'title': {
									'label':'{{ site.translations.waveform.axis.strain }}'
								}
							}
						}
					});
					this.graph.update();
					this.graph.on('mousemove',{this:this},function(e,d){
						// If the mouse montoring is active we update the value
						//if(this.mouseactive) p.innerHTML = updateFromTemplate('{{ site.translations.main.observatory.gw.step2.timediff }}',{'dt':(d.x*1000).toFixed(2)});
					}).on('click',{this:this},function(e,d){
						// Toggle montioring of mouse position
						this.mouseactive = !this.mouseactive;
					});

				}
				ev = data.events[e];
				dt = ev.datetime;
				file = (ev) ? (ev.GW.files.waveform_csv ? '../../waveform-fitter/waveforms/'+ev.GW.files.waveform_csv : "") : '';
				
				// Get waveform data
				fetch(file).then(response => {
					if(!response.ok) throw new Error('Network response was not OK');
					return response.text();
				}).then(txt => {
					var wfdata,t0,lbl;

					wfdata = parseCSV(txt);
					t0 = ev.GW.t0_ms;
					lbl = "{{ site.translations.waveform.legend.data }}";

					this.graph.setSeries(0,wfdata,{
						'id':'line-data',
						'text':lbl,
						'class':'data',
						'line':{
							'stroke':'rgba(0,150,200,1)'
						}
					});

					// Update the ranges
					this.graph.setDataRanges({'x':[wfdata[0][0],wfdata[wfdata.length-1][0]],'y':[-1.5,1.5]});

					// Update the scales and domains
					this.graph.updateData();

					this.graph.update();

				}).catch(error => {
					errorMessage('Unable to load the data "'+file+'"',error);
				});
				
			}else{
				errorMessage('Invalid event '+ev,data);
			}
		}else{
			el.none.style.display = '';
			el.waveform.style.display = 'none';
			el.next.setAttribute('disabled','disabled');
			console.warn('No event set');
		}

		document.querySelectorAll('.event-name').forEach(function(el){ el.innerHTML = e||'?'; });
		document.querySelectorAll('.event-date').forEach(function(el){ el.innerHTML = dt||'?'; });

		if(opt.notification) opt.notification.set(vals);

	};

	if(query.event) el.event.value = query.event;
	this.setEvent(el.event.value);
	return this;
}
