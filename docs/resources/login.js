// Adapted from https://github.com/chrissy-dev/protected-github-pages
"use strict"
var button = document.getElementById('submit');
var password = document.getElementById('password');
var username = document.getElementById('username');

function login(secret) {
	var hash = sha1(secret);
	var url = '../' + hash.toUpperCase() + "/index.html";
	var alert = document.getElementById('alert');

	var request = new XMLHttpRequest();
	request.open('GET', url, true);

	request.onload = function(){
		if(request.status >= 200 && request.status < 400) {
			window.location = url;
		}else{
			parent.location.hash = hash;
			alert.style.display = 'block';
			password.value = '';
		}
	}
	request.onerror = function(){
		parent.location.hash = hash;
		alert.style.display = 'block';
		password.value = '';
	}
	request.send();
}

button.addEventListener("click", function(){
	login(password.value);
});

document.onkeydown = function(e){
	e = e || window.event
	if(e.keyCode == 13) login(username.value+'_'+password.value);
}
