var API_IP = "localhost:8888";
window.onload = function() {
	if (localStorage.getItem('user_name')) {
		let user_name = localStorage.getItem('user_name');
		let collab_name = localStorage.getItem('collab_name');
		if (checkSession(user_name, collab_name))
			return;
		$('._container').hide()
		setupAce();
		webSocket = new WebSocket("ws://" + API_IP + "/socket?user_name=" + user_name + "&collab_name=" + collab_name);
		webSocket.onmessage = receiveSocketMessage;
		var lines = JSON.parse(localStorage.getItem('doc'));
		if (lines)
			user_doc.insertFullLines(0, lines);
		lines = JSON.parse(localStorage.getItem('remote_doc'))
		if(lines)
			remote_doc.insertFullLines(0, lines);
	}
	else {
		setupAce();
	}
	$('#collab_details').html(localStorage.getItem("collab_name"))
	user_doc.on("change", send_changes)
}


function setupAce() {
	ace.require("src/ext-language_tools");
	user_editor = ace.edit("editor");
	user_editor.session.setMode("ace/mode/python");
	user_editor.setTheme("ace/theme/terminal");
	user_editor.setOptions({
		enableBasicAutocompletion: true,
		enableSnippets: true,
		enableLiveAutocompletion: true
	})

	remote_editor = ace.edit("editor_remote");
	remote_editor.setReadOnly(true);
	remote_editor.session.setMode("ace/mode/python");
	remote_editor.setTheme("ace/theme/terminal");

	user_doc = user_editor.session.getDocument();
	remote_doc = remote_editor.session.getDocument();
}

function checkSession(user_name, collab_name) {
	var route = "http://" + API_IP + "/check/collab";
	var method = "POST";

	var request = $.ajax({
		url : route,
		method : method,
		data : {
			"user_name": user_name,
			"collab_name": collab_name
		}
	});

	request.done(function(data){
		if( JSON.parse(data).connected ) {
			$('._container').show()
			$('#info').html('You have an open session.')
			$('#info').show()
			return true;
		}
	}); 
	return false;
}

function check() {
	collab_name = $('#collab_name').val();
	var route = "http://" + API_IP + "/check/collab";
	var method = "POST";

	var request = $.ajax({
		url : route,
		method : method,
		data : {
			"collab_name": collab_name
		}
	});

	request.done(function(data){
		if( JSON.parse(data).collab_check ) {
			$('#submit').html('Join Collab')
			$('#submit').css('background', 'rgb(38, 32, 216)');
		}
		else {
			$('#submit').html('Create Collab')
			$('#submit').css('background', 'rgb(42, 178, 51)');
		}
	});
}

function receiveSocketMessage(e) {
		var data = JSON.parse(e.data);
		if (data.user_name) {
			localStorage.setItem('socket_id', data.socket_id);
			localStorage.setItem('user_name', data.user_name);
			localStorage.setItem('collab_name', data.collab_name);
			$('._container').hide();
		}
		else {
			var delta = data.delta;
			remote_doc.applyDelta(delta);
			localStorage.setItem('remote_doc', JSON.stringify(remote_doc.$lines));
			$('._container').hide();
			return false;
		}
}

function setup() {
	var user_name = $('#user_name').val()
	var collab_name = $('#collab_name').val()
	webSocket = new WebSocket("ws://" + API_IP + "/socket?user_name=" + user_name + "&collab_name=" + collab_name);
	webSocket.onmessage = receiveSocketMessage;
	$('._container').hide()
	setupAce()
}

function send_changes(delta) {
	localStorage.setItem('doc', JSON.stringify(user_doc.$lines))
	var message = {
		'socket_id' : localStorage.getItem('socket_id'),
		'collab_name' : localStorage.getItem('collab_name'),
		'delta'   : delta
	};
	webSocket.send(JSON.stringify(message));
}

function setLanguage() {
	user_editor.session.setMode("ace/mode/" + languages[$('#languages').val()]);
}

function getCollabs(user_name, collab_name) {
	var route = "http://" + API_IP + "/list/collabs";
	var method = "POST";

	var request = $.ajax({
		url : route,
		method : method,
		data : {
			"user_name" : user_name,
			"collab_name": collab_name
		}
	});

	request.done(function(data){
		var collabs = JSON.parse(data).collabs;
		if( collabs ) {
			for(var user in collabs) {
				$('#collabs').html($('#collabs').html() + '<option>' + user + '</option>');
			}
		}
	}); 
}
