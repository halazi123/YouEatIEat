var express = require('express');
var app = express();

/* client states */
var WN = 1;    /* waiting for name */
var WO = 2;    /* waiting for opponent */
var IF = 3;    /* in fight */

var clients = new Array(); 

function client(socket) {
	this.socket = socket;
	this.name;
	this.state;
	this.opponent;
	this.move;
	this.hp;
};

PORT = 31225;

app.engine('.html', require('ejs').__express);
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.use(express.bodyParser());

app.get('/', function(req, res){
	res.render('index', {title: 'You Eat, I Eat'});
});

app.get('/login', function(req, res){
	res.render('login', {title: ' - Login'});
});

app.get('/register', function(req, res){
	res.render('register', {title: ' - Registration'});
});

//var io = require('socket.io').listen(app.listen(PORT, '192.168.2.12'));
var io = require('socket.io').listen(app.listen(process.env.VCAP_APP_PORT || 3000));

//io.set('browser client minification', true);

io.sockets.on('connection', function (socket) {
	
	var player = new client(socket);
	player.name = '';
	player.state = WN;
	player.opponent = null;
	player.move = '';
	player.hp = 0;
	
	clients.push(player);
	
    socket.emit('message', { message: 'Connected! Welcome to You Eat I Eat, please enter your name. ' });
	
    socket.on('username', function (data) {
		var valid = true;
		for (var i=0; i<clients.length; i++) {
			if (clients[i].name === data.username) {
				valid = false;
				break;
			}
		}
		if (valid) {
			player.name = data.username;
			player.state = WO;
			socket.emit('reusername', { confirm: 'yes', message: "Your name is " + player.name + ", Please enter the name of your opponent." });
		}
		else {
			socket.emit('reusername', { confirm: 'no', message: "Invalid username, try again." });
		}		
        
    });
	
	socket.on('opname', function (data) {
		if (data.opname === player.name) {
			socket.emit('reopname', { confirm: 'no', message: "Your oppnent's name cannot be the same as your name." });
			return;
		}
		
		for (var i=0; i<clients.length; i++) {
			if (clients[i].name === data.opname && clients[i].state == WO) {
				var op = clients[i];
				break;
			}
		}
		
		if ( typeof op !== 'undefined' && op != null ) {
			player.opponent = op;
			op.opponent = player;
			player.state = IF;
			op.state = IF;
			player.hp = 3;
			op.hp = 3;
			socket.emit('reopname', { confirm: 'yes', myname: player.name, opname: op.name });
			op.socket.emit('reopname', { confirm: 'yes', myname: op.name, opname: player.name });
		}
		else {
			socket.emit('reopname', { confirm: 'no', message: "Cannot match up with your opponent. Try again." });
		}
        
    });
	
	socket.on('move', function (data) {
		if (player.move === '' && player.state === IF) {
			player.move = data.move;
			var op = player.opponent;
			
			if (op.move.length) {
				var combined = player.move + ' ' + op.move;
				switch(combined) {
					case 'youeat hamburger': case 'hamburger ieat':
						if (op.hp < 6) op.hp++;
						break;
					case 'hamburger youeat': case 'ieat hamburger':
						if (player.hp < 6) player.hp++;
						break;
					case 'youeat poop': case 'poop ieat':
						op.hp--;
						break;
					case 'poop youeat': case 'ieat poop':
						player.hp--;
						break;
					default:
						break;					
				}
				var playerresult = 'pending';
				var opresult = 'pending';
				if (player.hp <= 0) {
					playerresult = 'lose';
					opresult = 'win';
				}
				else if (op.hp <= 0) {
					playerresult = 'win';
					opresult = 'lose';
				}
				socket.emit('remove', {result: playerresult, mymove: player.move, opmove: op.move, myhp: player.hp, ophp: op.hp});
				op.socket.emit('remove', { result: opresult, mymove: op.move, opmove: player.move, myhp: op.hp, ophp: player.hp });
				player.move = '';
				op.move = '';
			}
		}        
    });
	
	socket.on('playagain', function (data) {
		var op = player.opponent;
		player.hp = 3;
		op.hp = 3;
		socket.emit('reopname', { confirm: 'yes', myname: player.name, opname: op.name });
		op.socket.emit('reopname', { confirm: 'yes', myname: op.name, opname: player.name });  
    });
	
	socket.on('disconnect', function () {
		if (player.opponent != null){
			player.opponent.opponent = null;
			player.opponent.state = WO;
			player.opponent.socket.emit('opdisconnect');
		}
		for (var i=0; i<clients.length; i++) {
			if (clients[i] === player) {
				clients.splice(i,1);
				break;
			}
		}
		player = null;
	});
});

console.log('Server running at http://127.0.0.1:' + PORT + '/');

