var languages = {
		'C':'c_cpp',
		'C++':'c_cpp',
		'CoffeeScript':'coffee',
		'C#':'csharp',
		'CSS':'css',
		'Go':'golang',
		'HTML':'html',
		'JavaScript':'javascript',
		'JSON':'json',
		'PHP':'php',
		'Python':'python',
		'Ruby':'ruby'
	}
function populateLangs() {
	for (var i in languages) {
		$('#languages').html($('#languages').html() + '<option>' + i + '</option>');
	}

}