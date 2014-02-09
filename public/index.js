// JavaScript Document
var pics = {"youeat":"/img/youeat.png",
			"ieat":"/img/ieat.png",
			"hamburger":"/img/hamburger.png",
			"poop":"/img/poop.png"				
			};
				
var flash = function (element) {
	var $element = element;
	setInterval(function () {
		$element.fadeIn(1000, function () {
			$element.fadeOut(1500, function () {
				$element.fadeIn(1500)
			});
		});
	}, 2000);
};
				
$().ready(function () {

    $('#registerForm').validate({ // initialize the plugin
        rules: {
            name: {
                required: true
            },
            email: {
                required: true,
                email: true
            },
			pwd: {
                required: true,
                rangelength: [6, 10]
            },
			cpwd: {
                required: true,
                equalTo: "#pwd"
            }
		}
    });
	
	$("#registerForm").submit(function(event) {

		event.preventDefault();

		var $form = $( this ),
		n = $form.find( 'input[name="name"]' ).val(),
		e = $form.find( 'input[name="email"]' ).val(),
		p = $form.find( 'input[name="pwd"]' ).val(),
		url = $form.attr( 'action' );

		var posting = $.post( url, { name:n, email:e, pwd:p } );

		posting.done(function( data ) {
			alert("submit done!" + data);
		});
	});
	
	$("#username").keyup(function(e) {
        if(e.keyCode == 13) {
            $("#send").click();
        }
    });

});

window.onload = function() {

    //var socket = io.connect('http://192.168.2.12:31225/');
	//var socket = io.connect('http://youeatieat.aws.af.cm');
	var socket = io.connect();
	
    socket.on('message', function (data) {
        if(data.message) {
            var html = '';
            html += '<b>' + (data.username ? data.username : 'Server') + ': </b>';
            html += data.message + '<br />';
			$("#message_box").empty();
            $("#message_box").append(html);
        } else {
            console.log("There is a problem:", data);
        }
    });
	
	socket.on('reusername', function (data) {
        if(data.confirm) {
			var html = '';
			html += '<b>' + (data.username ? data.username : 'Server') + ': </b>';
			html += data.message + '<br />';
			$("#message_box").empty();
			$("#message_box").append(html);
				
			if (data.confirm === 'yes') {
				$("#controls").contents().first()[0].textContent = "Opponent's name:";
				$("#username").attr("id", "opname");
			}           
        } else {
            console.log("There is a problem:", data);
        }
    });
	
	socket.on('reopname', function (data) {
        if(data.confirm) {
			if (data.confirm === 'yes') {
				$("#content").empty();
				$("#content").append('<div id="players" class=ui-grid-b>' +
									 '<div id="user" class=ui-block-a><b>' + data.myname + '</b></div>' +
									 '<div id="mid" class=ui-block-b>' +
										'<div id="myhp"><img src="/img/hp3.png"></div> VS ' + 
										'<div id="ophp"><img src="/img/hp3.png"></div></div>' +
									 '<div id="op" class=ui-block-c><b>' + data.opname + '</b></div></div>' +
									 '<div id="boxandbuttons"><div id="message_box" ></div><br>' +
									 '<div id="play_buttons" ><a class="moves" id="youeat" ><img src="/img/youeat.png"></a>' +
									 '<a class="moves" id="ieat"><img src="/img/ieat.png"></a><a class="moves" id="hamburger" ><img src="/img/hamburger.png"></a>' +
									 '<a class="moves" id="poop"><img src="/img/poop.png"></a></div></div>'
									);
			}
			else {
				var html = '';
				html += '<b>' + (data.username ? data.username : 'Server') + ': </b>';
				html += data.message + '<br />';
				$("#message_box").empty();
				$("#message_box").append(html);
			}          
        } else {
            console.log("There is a problem:", data);
        }
    });
	
	socket.on('remove', function (data) {
        if(data.result) {
			var html = '';
			html += '<img src="' + pics[data.mymove] + '"> -VS- <img src="' + pics[data.opmove] + '"><br />';
			$("#message_box").empty();
			$("#message_box").append(html);
			$('#message_box').animate({"scrollTop": $('#message_box')[0].scrollHeight}, "fast");
			$("#myhp").empty();
			$("#myhp").append('<img src="/img/hp' + data.myhp + '.png">');
			$("#ophp").empty();
			$("#ophp").append('<img src="/img/hp' + data.ophp + '.png">');
			
			if (data.result === 'win') {
				$("#boxandbuttons").empty();
				$("#boxandbuttons").append('<h1 style="color:red;"> You Win! </h1><a id="playagain"><img src="/img/playagain.png"></a>');
				flash($('#playagain'));
			}
			else if (data.result === 'lose') {
				$("#boxandbuttons").empty();
				$("#boxandbuttons").append('<h1 style="color:#DAA520;"> You Died of Poop Overdose... </h1><a id="playagain"><img src="/img/playagain.png"></a>');
				flash($('#playagain'));
			}
        } else {
            console.log("There is a problem:", data);
        }
    });
	
	socket.on('opdisconnect', function (data) {
        location.reload(true);
    });
 
    $("#send").click(function() {
        if ($("#username").val() == "") {
            alert("Please enter your name!");
        }
		else if ($("#opname").val() == "") {
			alert("Please enter your opponent's name!");
		}
		else {
			if ($("#opname").length) {
				socket.emit('opname', { opname: $("#opname").val() });
				$("#opname").val("");
			}
			else if ($("#username").val().length > 7) {
				var html = '';
				html += '<b>Server: </b>Username is at most 7 characters long, please try again.<br />';
				$("#message_box").empty();
				$("#message_box").append(html);
			}
			else if ($("#username").length) {
				socket.emit('username', { username: $("#username").val() });
				$("#username").val("");
			}
        }
    });
	
	$(document).on('click', '.moves', function(event) { 
		$(this).children().fadeOut('fast');
		$(this).children().fadeIn('fast');
		socket.emit('move', { move: $(this).attr('id') });
	});
	
	$(document).on('click', '#playagain', function(event) { 
		socket.emit('playagain');
	});
}