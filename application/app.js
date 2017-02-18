var express = require('express'),

credentials = require('../authentication/info.json'),

bodyParser = require('body-parser'),

bcrypt = require('bcrypt'),

fs = require('fs'),

http = require('http'),

jwt = require('jsonwebtoken'),

app = express(),

secureRouter = express.Router(),

errorRouter = express.Router(),

addUserRouter = express.Router(),

saltRounds = 10,

authenticated = false,

port = 3001;



app.use(express.static(__dirname + '/public'));

app.use(function(error, req, res, next) {

    res.send('500: Internal Server Error', 500);

});

app.use(bodyParser.urlencoded({extended:false}));

secureRouter.all(function(){



});




secureRouter.route('/').post(function(req, res){

    var authData = {

        'username': req.body.username,

        'password': req.body.password,

        'permisison': 'application1'

    };

    var route = '';

    var options = {

        host:"localhost",

        port:'3002',

        path:'/login',

        method:'POST',

        headers: authData,

        json:true

    };

    var request = http.request(options, function(req){

        console.log('STATUS: ' + req.statusCode);

        console.log('HEADERS: ' + JSON.stringify(req.headers));

        req.setEncoding('utf8');

        req.on('data', function(chunk){

            if(req.statusCode == 200)
            {

                route = '/secure';


                res.sendFile(__dirname + '/secure.html');

            }
            else{

                route = '/error';
                res.redirect(route);
            }

            console.log('BODY: ' + chunk);

        });

        req.on('error', function(err){

            console.log('error: ' + err);

        });

    });

    request.end();



    // if(!authenticated){res.redirect('/error');}
    // else{res.redirect('/secure');}


});

errorRouter.route('/').get(function(req, res){


    res.sendFile(__dirname + '/error.html');


});

addUserRouter.route('/').post(function(req, res){

    credentials.application1.users.push({'username':bcrypt.hashSync(req.body.username, saltRounds),'password':bcrypt.hashSync(req.body.password, saltRounds)});
    var data = JSON.stringify(credentials, null, 4);
    console.log(data);
    console.log(__dirname);
    fs.writeFile(__dirname + '/../authentication/info.json', data, 'utf-8', function(err){
        if (err) {
            return console.log(err);
        }
        console.log(data);
        res.send(data);
    });
    //res.send(credentials);


});

app.use('/secure/add-user', addUserRouter);

app.use('/error', errorRouter);

app.use('/secure', secureRouter);

app.set('views', './src/views');

var handlebars = require('express-handlebars');

app.engine('.hbs', handlebars({extname: '.hbs'}));

app.set('view engine', '.hbs');

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

    console.log('Server started at localhost:' + port);

});
