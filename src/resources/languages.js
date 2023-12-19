(function(root){
	
	if(!root.ready){
		root.ready = function(fn){
			// Version 1.1
			if(document.readyState != 'loading') fn();
			else document.addEventListener('DOMContentLoaded', fn);
		};
	}

	var lang = {{ site.language }};
	var code = "{{ site.lang }}";

	root.ready(function(){
		var el = document.getElementById('language-switcher');
		if(el){
			var l,selector,selected,opt,added,fm,lbl;

			fm = document.createElement('form');
			fm.setAttribute('action','');
			selector = document.createElement('select');
			selector.setAttribute('id','language-picker-select');
			added = 0;
			for(l in lang.languages){
				if(lang.languages[l].enabled || lang.default == l){
					opt = document.createElement('option');
					opt.innerHTML = lang.languages[l].label;
					opt.setAttribute('lang',l);
					opt.setAttribute('value',l);
					if(code == l){
						selected = l;
						opt.setAttribute('selected','selected');
					}
					selector.appendChild(opt);
					added++;
				}
			}
			if(added > 1){
				lbl = document.createElement('label');
				lbl.setAttribute('for','language-picker-select');
				lbl.innerHTML = '<svg width="1em" height="1em" viewBox="0 0 16 16" class="icon"><path d="M8,0C3.6,0,0,3.6,0,8s3.6,8,8,8s8-3.6,8-8S12.4,0,8,0z M13.9,7H12c-0.1-1.5-0.4-2.9-0.8-4.1 C12.6,3.8,13.6,5.3,13.9,7z M8,14c-0.6,0-1.8-1.9-2-5H10C9.8,12.1,8.6,14,8,14z M6,7c0.2-3.1,1.3-5,2-5s1.8,1.9,2,5H6z M4.9,2.9 C4.4,4.1,4.1,5.5,4,7H2.1C2.4,5.3,3.4,3.8,4.9,2.9z M2.1,9H4c0.1,1.5,0.4,2.9,0.8,4.1C3.4,12.2,2.4,10.7,2.1,9z M11.1,13.1 c0.5-1.2,0.7-2.6,0.8-4.1h1.9C13.6,10.7,12.6,12.2,11.1,13.1z"><text>'+lang.languages[selected].text+'</text></path></svg>';
				fm.appendChild(lbl);
				fm.appendChild(selector);
				el.appendChild(fm);
				selector.addEventListener('change',function(e){ updateURL(e.target.value); });
				selector.focus();
			}
		}
	});
	
	function updateURL(l){
		if(l != code){
			// Need to change to new language
			var regex = new RegExp("\/"+code+"\/");
			var url;
			if(location.href.match(regex)){
				if(l == lang.default) url = location.href.replace(regex,"/");
				else url = location.href.replace(regex,"/"+l+"/");
			}else{
				url = location.href.replace(/\/index\.html$/,"")+'/'+l+'/index.html';
			}
			location.href = url;
		}
	}

})(window || this);
