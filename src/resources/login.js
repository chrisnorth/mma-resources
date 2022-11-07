// Adapted from https://github.com/chrissy-dev/protected-github-pages
"use strict"
var button = document.getElementById('submit');
var pass = document.getElementById('password');
var user = document.getElementById('username');

var wrong = "{{ site.translations.main.login.wrong }}";

function login(secret) {
	var hash = sha1(secret);
	var url = '../' + hash.toUpperCase() + "/index.html";
	var msg = document.getElementById('alert');

	var request = new XMLHttpRequest();
	request.open('GET', url, true);

	request.onload = function(){
		if(request.status >= 200 && request.status < 400) {
			window.location = url;
		}else{
			parent.location.hash = hash.toUpperCase();
			msg.style.display = 'block';
			msg.innerHTML = wrong+' '+hash;
			pass.value = '';
		}
	}
	request.onerror = function(){
		parent.location.hash = hash;
		msg.style.display = 'block';
		msg.innerHTML = wrong;
		pass.value = '';
	}
	request.send();
}

button.addEventListener("click", function(){
	login(user.value+'_'+pass.value);
});

document.onkeydown = function(e){
	e = e || window.event
	if(e.keyCode == 13) login(user.value+'_'+pass.value);
}
