function Step(data,opt){
	if(!opt) opt = {};
	var el = {
		'event': document.getElementById('select-event'),
		'waveformA': document.getElementById('waveform-a'),
		'waveformB': document.getElementById('waveform-b'),
		'none': document.getElementById('no-event'),
		'prev': document.getElementById('prev'),
		'next': document.getElementById('next'),
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
		opt.values.event = e;
		opt.values.ev = {};
		opt.values.gridsquares = '';
		opt.values.mass = '';
		opt.values.dist = '';
		opt.values.massratio = '';
		opt.values.inc = '';

		if(e){
			if(data.events[e]){
				opt.values.ev = data.events[e];
				el.next.removeAttribute('disabled');
				el.none.style.display = 'none';
				el.waveformA.style.display = '';
				el.waveformB.style.display = '';
				if(!this.graphA){
					this.graphA = new Graph(el.waveformA.querySelector('.waveform'),{
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
					this.graphA.update();
				}
				if(!this.graphB){
					this.graphB = new Graph(el.waveformB.querySelector('.waveform'),{
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
					this.graphB.update();
				}
				ev = data.events[e];
				dt = ev.datetime;
				

				// Get waveform data for the first graph
				file = (ev) ? (ev.GW.files['waveform_csv'] ? '../../waveform-fitter/waveforms/'+ev.GW.files['waveform_csv'] : "") : '';
				fetch(file).then(response => {
					if(!response.ok) throw new Error('Network response was not OK');
					return response.text();
				}).then(txt => {
					var wfdata,t0,lbl;

					wfdata = parseCSV(txt);
					t0 = ev.GW.t0_ms;
					lbl = "{{ site.translations.waveform.legend.data }}";

					if(this.graphA.series.wf){
						this.graphA.updateSeries("wf",wfdata,{
							'id':'line-data',
							'text':lbl,
							'class':'data',
							'line':{
								'stroke':'rgba(0,150,200,1)'
							}
						});
					}else{
						this.graphA.setSeries("wf",wfdata,{
							'id':'line-data',
							'text':lbl,
							'class':'data',
							'line':{
								'stroke':'rgba(0,150,200,1)'
							}
						});
					}

					// Update the ranges
					this.graphA.setDataRanges({'x':[wfdata[0][0],wfdata[wfdata.length-1][0]],'y':[-1.5,1.5]});

					// Update the scales and domains
					this.graphA.updateData();

					this.graphA.update();

				}).catch(error => {
					errorMessage('Unable to load the data "'+file+'"',error);
				});



				// Get waveform data for the first graph
				file = (ev) ? (ev.GW.files['waveform_csv_0.5s'] ? '../../waveform-fitter/waveforms/'+ev.GW.files['waveform_csv_0.5s'] : "") : '';
				fetch(file).then(response => {
					if(!response.ok) throw new Error('Network response was not OK');
					return response.text();
				}).then(txt => {
					var wfdata,t0,lbl;

					wfdata = parseCSV(txt);
					t0 = ev.GW.t0_ms;
					lbl = "{{ site.translations.waveform.legend.data }}";

					if(this.graphB.series.wf){
						this.graphB.updateSeries("wf",wfdata,{
							'id':'line-data',
							'text':lbl,
							'class':'data',
							'line':{
								'stroke':'rgba(0,150,200,1)'
							}
						});
					}else{
						this.graphB.setSeries("wf",wfdata,{
							'id':'line-data',
							'text':lbl,
							'class':'data',
							'line':{
								'stroke':'rgba(0,150,200,1)'
							}
						});
					}

					// Update the ranges
					this.graphB.setDataRanges({'x':[wfdata[0][0],wfdata[wfdata.length-1][0]],'y':[-1.5,1.5]});

					// Update the scales and domains
					this.graphB.updateData();

					this.graphB.update();

				}).catch(error => {
					errorMessage('Unable to load the data "'+file+'"',error);
				});
				

			}else{
				errorMessage('Invalid event '+ev,data);
			}
		}else{
			el.none.style.display = '';
			el.waveformA.style.display = 'none';
			el.waveformB.style.display = 'none';
			el.next.setAttribute('disabled','disabled');
			console.warn('No event set');
		}

		document.querySelectorAll('.event-name').forEach(function(el){ el.innerHTML = e||'?'; });
		document.querySelectorAll('.event-date').forEach(function(el){ el.innerHTML = dt||'?'; });

		if(opt.notification) opt.notification.set(opt.values);

	};

	if(query.event) el.event.value = query.event;
	this.setEvent(el.event.value);
	return this;
}
