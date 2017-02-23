var express = require('express'),

auth = require('express-jwt-token'),

nJwt = require('njwt'),

bodyParser = require('body-parser'),

bcrypt = require('bcrypt'),

credentials = require('./info.json'),

fs = require('fs'),

customAuth = require('./customAuth.js'),

crypto = require('crypto'),

app = express(),

loginRouter = express.Router(),

logoutRouter = express.Router(),

secureRouter = express.Router(),

verifyRouter = express.Router(),

errorRouter = express.Router(),

addUserRouter = express.Router(),

tokenRouter = express.Router(),

//USERNAME AND PASSWORD HASHING SALT ROUNDS

saltRounds = 10,

port = 3002,

//AUTH TOKEN SECRET

token = "";




app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({extended:false}));

//DEFAULT ROUTE OF '/'

app.get('/', function(req, res){

    console.log('ROOT: '+token);

    res.sendFile(__dirname + '/index.html');

});

secureRouter.route('/').get(function(req, res, next){

    if(token)

    {

        customAuth.verifyToken(req, res, token, 'application1', __dirname + '/secure.html', '/error');

    }

    else

    {

        //next();

    }

});

errorRouter.route('/').get(function(req, res){

    res.sendFile(__dirname + '/error.html');

});




//loginRouter USED FOR ADMIN LOGIN THROUGH THE '/' ROUTE

loginRouter.route('/').post(function(req, res, next){

    console.log('LOGIN ROUTER');

    var username = req.headers.username;

    var password = req.headers.password;

    //IF LOGGING IN THROUGH THE AUTH SERVER IT CAN BE ASSUMED THAT THE USER IS ADMIN

    var permission = req.headers.permission || 'admin';

    var jwt = '';

    //RE-READ THE INFO.JSON FILE TO ENSURE THE LATEST LOGIN CREDENTIALS ARE BEING USED



    fs.readFile(__dirname + '/info.json', function(err, data){

        if(err)

        {

            res.status(500).send('500 – Unable to read authentication data found.');

            next();

        }

        //PUT INFO.JSON INTO CREDENTIALS

        credentials = JSON.parse(data);

        //ASSIGN THE SECRET KEY TO
        var secretKey = credentials[permission].tokenSecret;

        for(var i = 0; i < credentials[permission].users.length; i++){

            if(bcrypt.compareSync(password, credentials[permission].users[i].password) && bcrypt.compareSync( username, credentials[permission].users[i].username))

            {

                //SETUP THE CLAIMS FOR THE TOKEN

                //THE TOKEN IS MADE FOR THE APPLICATION AUTH NOT USER
                //THEREFORE, ONLY THE ISSUER OF 'APPLICATION1' NEEDS TO BE USED

                //THIS TOKEN IS USED FOR ALL APP USERS OF ONE APPLICAITON

                var claims = {

                    iss: permission,

                };

                //PREPARE AUTH TOKEN FOR RESPONSE

                jwt = nJwt.create(claims, secretKey);

                jwt = jwt.compact();

            }

        }

        if(jwt)

        res.status(200).send(jwt);

        else
        {

        res.status(401).send('/error.html');
    }
    });

});




//verifyRouter USED TO CHECK IF THE AUTH TOKEN THAT IS SENT IN POST REQ IS VALID
//IF NOT VALID, 401 REPONSE CODE IS SENT
//OTHERWISE RESPONSE STATUS IS 200 – OK

verifyRouter.route('/').post(function(req, res, next){

    //re-read info.json as file structure may have been modified
    console.log('VERIFY L1');
    fs.readFile(__dirname + '/info.json', function(err, data){

        if(err){

            res.send('No authentication data found.');

            console.log(err);

            next();

        }

        credentials = JSON.parse(data);
        console.log('VERIFY L2');
    });


    console.log('VERIFY L3');

    var authtoken = req.headers.token;

    var secretKey = credentials[req.headers.permission].tokenSecret;

    nJwt.verify(authtoken, secretKey,function(err,verifiedJwt){

        console.log('VERIFY L5');

        //var tempJSON = JSON.parse(verifiedJwt);

        console.log(verifiedJwt);

        //console.log(verifiedJwt.body.iss + ' | '+  req.headers.permission);

        if (err)

        return res.status(401).send('');

        else if(verifiedJwt.body.iss == req.headers.permission)
        {

            console.log('Token Claims: '+JSON.stringify(verifiedJwt) +'\n');
            //res.end();
            return res.status(200).send('200 – OK.');

        }
    });
    console.log('VERIFY L5');
});




//secureRouter USED TO MANAGE THE SECURE PAGE ROUTE AND LOG THE ADMIN IN

secureRouter.route('/').post(function(req,res){

    if(token)

    {

        customAuth.verifyToken(req, res, token, 'admin', __dirname + '/secure.html', '/error');

    }

    else

    {

        customAuth.resetToken();

        customAuth.authorize(req, res, req.body.username, req.body.password, 'admin', __dirname + '/secure.html', '/error');

        token = customAuth.getToken();

        console.log('RETURN VALUE: '+ token);

    }

});



addUserRouter.route('/').post(function(req, res){


    res.send('/secure');

});

function saveUsertoJson(username, password, app){

    var obj = JSON.parse(fs.readFileSync('file', 'utf8'));

    credentials[app].users.push({'username':bcrypt.hashSync(username, saltRounds),'password':bcrypt.hashSync(password, saltRounds)});


}




logoutRouter.route('/').get(function(req, res){

    //RESET THE TOKEN THAT WAS BEING STORED IN THE APP

    token = "";

    customAuth.resetToken();

    //send to start page

    res.redirect('/');

});



tokenRouter.route('/').post(function(req, res){

    console.log('TOKEN ROUTE: '+req.headers.permission);

    var tokenSecret = crypto.randomBytes(64).toString('hex');

    var infoJSON;

    infoJSON = JSON.parse(fs.readFileSync(__dirname + '/info.json', 'utf8'));



    console.log(infoJSON);

    console.log('TOKEN: '+tokenSecret);

    console.log();

    infoJSON[req.headers.permission].tokenSecret = tokenSecret;

    infoJSON = JSON.stringify(infoJSON, null, 4);

    fs.writeFile(__dirname + '/../authentication/info.json', infoJSON, 'utf-8', function(err){

        if (err)

        return console.log(err);

        //console.log(data);

        res.redirect('/secure');

    });
res.send('done.');
});




app.use('/secure*', function(req, res, next){
    console.log('SECURE* L1 ');

    var authToken;

    if(customAuth.getToken()){

        authToken = customAuth.getToken();
        console.log('GET TOKEN: '+authToken);

    }

    console.log('SECURE*: '+authToken);
    if(authToken)
    {

        console.log('TOKEN TOKEN');
        customAuth.verifyToken(req, res, authToken, 'application1', __dirname + '/secure.html', '/error');
        authToken = "";
    }else {

        return next();
    }

});



app.use('/verify', verifyRouter);

app.use('/login', loginRouter);

app.use('/error', errorRouter);

app.use('/secure', secureRouter);

app.use('/secure/add-user', addUserRouter);

app.use('/logout', logoutRouter);

app.use('/token', tokenRouter);




app.listen(port, function(err){

    if(err){

        console.log('Error: ' + err);

    }

    else

    console.log('Server started at localhost: ' + port);

    console.log(customAuth.getToken());

});





app.use(function(req, res) {

    res.status(404).send('404: Page not Found');

});

//HANDLE ALL OTHER ERRORS AS A SERVER ERROR


app.use(function(error, req, res, next) {

    res.status(500).send('500: Internal Server Error');

});
