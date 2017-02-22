var express = require('express'),

credentials = require('../authentication/info.json'),

bodyParser = require('body-parser'),

bcrypt = require('bcrypt'),

fs = require('fs'),

http = require('http'),

handlebars = require('express-handlebars'),

customAuth = require('../authentication/customAuth.js'),

app = express(),

secureRouter = express.Router(),

errorRouter = express.Router(),

addUserRouter = express.Router(),

logoutRouter = express.Router(),

saltRounds = 10,

authenticated = false,

port = 3001,

application = 'application1',

//TOKEN – I ASSUME FROM THE ASSIGNMENT DOCUMENT THAT THE TOKEN IS FOR THE
//APPLICATION. "THE APP SHOULD GET AN AUTH TOKEN OTHERWISE BE FALSE."
//AN EMPTY STRING STORED IN THE APPLICATION IS EQUAL TO FALSE.

token = "";



app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({extended:false}));

//DEFAULT ROUTE OF '/'

app.use('/secure*', function(req, res, next){
    console.log('SECURE* L1 ');

    var authToken ='';

    if(customAuth.getToken()){

        authToken = customAuth.getToken();
        console.log('GET TOKEN: '+authToken);

    }

    console.log('SECURE*: '+authToken);
    console.log(req.originalUrl);
    if(authToken && req.originalUrl =='/secure')
    {

        console.log('TOKEN TOKEN');
        customAuth.verifyToken(req, res, authToken, application, __dirname + '/secure.html', '/error');
        authToken = "";

    }

    else if (authToken)

    {

        console.log('TOKEN TOKEN TOKEN');
        customAuth.verifyToken(req, res, authToken, application, '', '/error', next);
        authToken = "";

    }

    else

    {

        return next();
    }

});

app.get('/secure/username', function (req, res) {
    console.log('UN: ' + customAuth.getUsername());
   res.send(customAuth.getUsername());
});

app.get('/', function(req, res){

    if(customAuth.getToken())
        res.redirect('/secure');
    else
    res.sendFile(__dirname + '/index.html');

});

secureRouter.route('/').get(function(req, res, next){



    if(token)

    {

        customAuth.verifyToken(req, res, token, application, __dirname + '/secure.html', '/error');

    }

    else

    {

        next();

    }

});


//secureRouter MANAGES THE ROUTE FOR '/SECURE' POST ONLY
//CHECKS REQUEST POST OF USERNAME AND PASSWORD AND SENDS TO :3002 FOR AUTH
//RESPONSE FROM :3002 IS EITHER 200 – OK, OR 404 – UNAUTHORIZED, UNLESS SERVER IS
//UNAVAILABLE.

secureRouter.route('/').post(function(req,res){
    console.log('SECURE L1 ');

    if(token)

    {
        console.log('SECURE VERIFY TOKEN');
        customAuth.verifyToken(req, res, token, application, __dirname + '/secure.html', '/error');

    }

    else

    {

        customAuth.resetToken();

        token = customAuth.authorize(req, res, req.body.username, req.body.password, application, __dirname + '/secure.html', '/error');

        token = customAuth.getToken();
        console.log('username: ' + req.body.username);
        console.log('RETURN VALUE: '+ token);

    }

});




//

errorRouter.route('/').get(function(req, res){
    if(customAuth.getToken()){
        customAuth.resetToken();
        res.redirect('/');
    }else{
        res.sendFile(__dirname + '/error.html');
    }
    console.log('ERROR L1 ');


});




addUserRouter.route('/').post(function(req, res){
    console.log('ADD USER L1 ');

    credentials.application1.users.push({'username':customAuth.encrypt(req.body.username),'password':bcrypt.hashSync(req.body.password, saltRounds)});



    //STRINGIFY PARAM: 4 – MEANS INDENT 4 SPACES TO ENSURE READABILITY
    console.log(data);
    var data = JSON.stringify(credentials, null, 4);

    fs.writeFile(__dirname + '/../authentication/info.json', data, 'utf-8', function(err){

        if (err)

        return console.log(err);

        console.log(data);

        res.redirect('/secure');

    });

});




logoutRouter.route('/').get(function(req, res){
    console.log('LOGOUT L1 ');

    //RESET THE TOKEN THAT WAS BEING STORED IN THE APP

    token = "";

    customAuth.resetToken();

    //send to start page

    res.redirect('/');

});




//THIS IS USED TO ENSURE ALL REQUESTS TO A SECURE ROUTE ARE AUTHENTICATED FIRST.
//IF NO TOKEN IS FOUND THE USER WILL BE ASKED TO LOGIN






//EXPRESS ROUTES FOR APP

app.use('/secure/add-user', addUserRouter);

app.use('/error', errorRouter);

app.use('/secure', secureRouter);

app.use('/logout', logoutRouter);




//SETUP POLYMER HANDLEBARS

app.set('views', './src/views');

app.engine('.hbs', handlebars({extname: '.hbs'}));

app.set('view engine', '.hbs');


//HANDLE PAGE NAVIGATION TO UNKNOWN PAGES (404 ERRORS)


app.use(function(req, res) {


    res.status(404).send('404: Page not Found');

});

//HANDLE ALL OTHER ERRORS AS A SERVER ERROR

// app.use(function(error, req, res, next) {
//
//     res.status(500).send('500: Internal Server Error');
//
// });

//DEFAULT LISTEN USING EXPRESS

app.listen(port, function(err){

    if(err){

        console.log('Error: ' + err);

    }

    else

        console.log('Server started at localhost:' + port);

});
