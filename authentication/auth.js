var express = require('express'),

auth = require('express-jwt-token'),

nJwt = require('njwt'),

bodyParser = require('body-parser'),

bcrypt = require('bcrypt'),

http = require('http'),

credentials = require('./info.json'),

jwt = require('jsonwebtoken'),

fs = require('fs'),

app = express(),

loginRouter = express.Router(),

secureRouter = express.Router(),

verifyRouter = express.Router(),

errorRouter = express.Router(),

addUserRouter = express.Router(),

saltRounds = 10,

port = 3002,

secretKey = 'secret';

app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({extended:false}));

app.post('/', function(req,res){

    var username = req.body.username;

    var password = req.body.password;

    var authenticated = false;

    for(var i = 0; i < credentials.application1.users.length; i++){

        if(bcrypt.compareSync(password, credentials.application1.users[i].password) && username === credentials.application1.users[i].username)

        {

            res.sendFile(__dirname + '/secure.html');

            authenticated = true;

        }

    }

    if(!authenticated)

    res.redirect('/error');

});

loginRouter.route('/').post(function(req, res){

    var username = req.headers.username;

    //console.log('Login router: ' + username);

    var password = req.headers.password;

    var permisison = req.headers.permisison || 'admin';

    var jwt = false;

    //re-request info.json as file structure may have been modified

    //credentials = require('./info.json');

    console.log(__dirname + '/info.json');

    fs.readFile(__dirname + '/info.json', function(err, data){

        if(err){

            res.send('No authentication data found.');
            console.log(err);
            next();

        }
        credentials = JSON.parse(data);
        console.log('JSON Credentials ' + JSON.stringify(credentials));

        for(var i = 0; i < credentials[permisison].users.length; i++){

            if(bcrypt.compareSync(password, credentials[permisison].users[i].password) && bcrypt.compareSync( username, credentials[permisison].users[i].username))

            {

                var claims = {

                    sub: username,

                    iss: permisison,

                    permissions: permisison

                };

                jwt = nJwt.create(claims, secretKey);

                jwt = jwt.compact();

            }

        }

        if(jwt)

        res.status(200).send(jwt);

        else

        res.status(401).send('Authentication Failed');

    });

    //console.log('Second');



});

verifyRouter.use(function(req, res, next){

    //re-request info.json as file structure may have been modified

    credentials = require('./info.json');

    console.log(credentials);

    var token = req.headers.token;

    nJwt.verify(token,secretKey,function(err,verifiedJwt){

        if (err) {

            return res.status(401).send('Failed to authenticate token.');

        }

        else

        {

            req.decoded = verifiedJwt;

            return next();

        }

    });

});

secureRouter.route('/').post(function(req,res){

    var username = req.body.username;

    console.log('login: ' + username);

    var password = req.body.password;

    var authenticated = false;

    for(var i = 0; i < credentials.admin.length; i++){

        if(bcrypt.compareSync(password, credentials.admin[i].password) && bcrypt.compareSync(username, credentials.admin[i].username))

        {

            res.sendFile(__dirname + '/secure/secure.html');

            authenticated = true;

        }

    }

    if(!authenticated)

    res.redirect('/error');

});

addUserRouter.route('/').post(function(req, res){

    console.log(req.body.username);
    res.send('/secure');

});

errorRouter.route('/').get(function(req, res){

    res.sendFile(__dirname + '/error.html');

});

app.use('/verify', verifyRouter);

app.use('/login', loginRouter);

app.use('/error', errorRouter);

app.use('/secure', secureRouter);

app.use('/secure/add-user', addUserRouter);

app.get('/', function(req, res){

    res.sendFile(__dirname + '/index.html');

});

app.use(function(req, res) {

    res.status(404).send('404: Page not Found');

});

app.use(function(error, req, res, next) {

    res.status(500).send('500: Internal Server Error');

});

app.listen(port, function(err){

    console.log('Server started at localhost: ' + port);

});
