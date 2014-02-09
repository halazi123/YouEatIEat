var client = require('mongodb').MongoClient;

exports.addNewUser = function(data, mongourl, callback){
    /* Connect to the DB and auth */
    client.connect(mongourl, function(err, conn){
		if(err) throw err;
		object_to_insert = { 'name': req.connection.remoteAddress, 'ts': new Date() };
        conn.collection('users').insert(object_to_insert, {safe:true}, function(err) {
			if (err) throw err;
			res.writeHead(200, {'Content-Type': 'text/plain'});
            res.write(JSON.stringify(object_to_insert));
            res.end('\n');
			conn.close();
        });
    });
}