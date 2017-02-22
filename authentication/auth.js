var express = require('express'),

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

apiRouter = express.Router(),

//USERNAME AND PASSWORD HASHING SALT ROUNDS

saltRounds = 10,

port = 3002,

application = 'admin',

//AUTH TOKEN SECRET

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

app.get('/', function(req, res){

//IF IS VALID AUTH TOKEN DONT MAKE THE USER LOGIN AGAIN, JUST SEND TO /SECURE

    if(customAuth.getToken())

        res.redirect('/secure');

    else

        res.sendFile(__dirname + '/index.html');

});

secureRouter.route('/').get(function(req, res, next){

    if(token)

    {

        customAuth.verifyToken(req, res, token, 'admin', __dirname + '/secure.html', '/error');

    }

    else

    {

        next();

    }

});

secureRouter.route('/').post(function(req,res){

    if(token)

    {
        console.log('SECURE VERIFY TOKEN');
        customAuth.verifyToken(req, res, token, 'admin', __dirname + '/secure.html', '/error');

    }

    else

    {

        customAuth.resetToken();

        token = customAuth.authorize(req, res, req.body.username, req.body.password, 'admin', __dirname + '/secure.html', '/error');

        token = customAuth.getToken();
        console.log('username: ' + customAuth.encrypt(req.body.username));
        console.log('RETURN VALUE: '+ token);

    }

});

errorRouter.route('/').get(function(req, res){

    if(customAuth.getToken()){

        customAuth.resetToken();

        res.redirect('/');

    }

    else

    {

        res.sendFile(__dirname + '/error.html');

    }

});

addUserRouter.route('/').post(function(req, res){

    credentials.admin.users.push({'username':bcrypt.customAuth.encrypt(req.body.username),'password':bcrypt.hashSync(req.body.password, saltRounds)});

    //STRINGIFY PARAM: 4 – MEANS INDENT 4 SPACES TO ENSURE READABILITY

    var data = JSON.stringify(credentials, null, 4);

    fs.writeFile(__dirname + '/info.json', data, 'utf-8', function(err){

        if (err)

            return console.log(err);

        res.redirect('/secure');

    });

});

//loginRouter USED FOR ADMIN LOGIN THROUGH THE '/' ROUTE

loginRouter.route('/').post(function(req, res, next){

    var username = req.headers.username;

    var password = req.headers.password;

    console.log(customAuth.encrypt(username));

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
            console.log('FLAG HERE: '+username);
            if(bcrypt.compareSync(password, credentials[permission].users[i].password) && username == customAuth.decrypt(credentials[permission].users[i].username))

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

            res.status(401).send('/error.html');

    });

});




//verifyRouter USED TO CHECK IF THE AUTH TOKEN THAT IS SENT IN POST REQ IS VALID
//IF NOT VALID, 401 REPONSE CODE IS SENT
//OTHERWISE RESPONSE STATUS IS 200 – OK

verifyRouter.route('/').post(function(req, res, next){

    //re-read info.json as file structure may have been modified

    fs.readFile(__dirname + '/info.json', function(err, data){

        if(err)

        {

            res.send('No authentication data found.');

            console.log(err);

        }

        credentials = JSON.parse(data);

    });

    var authtoken = req.headers.token;

    var secretKey = credentials[req.headers.permission].tokenSecret;

    nJwt.verify(authtoken, secretKey,function(err,verifiedJwt){

        if (err)

            return res.status(401).send('');

        else if(verifiedJwt.body.iss == req.headers.permission)

            return res.status(200).send('200 – OK.');

    });

});





addUserRouter.route('/').post(function(req, res){

    res.send('/secure');

});




logoutRouter.route('/').get(function(req, res){

    //RESET THE TOKEN THAT WAS BEING STORED IN THE APP

    token = "";

    customAuth.resetToken();

    //send to start page

    res.redirect('/');

});



tokenRouter.route('/').post(function(req, res){

    var tokenSecret = crypto.randomBytes(64).toString('hex');

    var infoJSON;

    infoJSON = JSON.parse(fs.readFileSync(__dirname + '/info.json', 'utf8'));

    infoJSON[req.headers.permission].tokenSecret = tokenSecret;

    infoJSON = JSON.stringify(infoJSON, null, 4);

    fs.writeFile(__dirname + '/../authentication/info.json', infoJSON, 'utf-8', function(err){

        if (err)

            return console.log(err);

        res.redirect('/secure');

    });

});

apiRouter.route('/all').get(function(req, res){
    var outputArr = [];
    var file = fs.readFileSync( __dirname + "/" + "info.json", 'utf8');
    var jsonObj = JSON.parse(file);
    console.log(jsonObj);
    for (var application in jsonObj) {
        console.log('FLAG1: '+ application);
        if (jsonObj.hasOwnProperty(application)) {
            console.log(jsonObj[application]);
            var appObj = jsonObj[application];
            for (var i = 0; i < jsonObj[application].users.length; i++) {
                console.log('FLAG2');
                console.log(jsonObj[application].users[i].username);
                var uname = customAuth.decrypt(jsonObj[application].users[i].username);
                outputArr.push({"username":uname, "permission": application});
            }
        }
    }
    console.log("OUTPUT: "+outputArr[0].username);
   res.json(outputArr);
   res.end();
});

apiRouter.route('/username').get(function(req,res){

    res.send(customAuth.getUsername());

});






app.use('/verify', verifyRouter);

app.use('/login', loginRouter);

app.use('/error', errorRouter);

app.use('/secure', secureRouter);

app.use('/secure/add-user', addUserRouter);

app.use('/logout', logoutRouter);

app.use('/token', tokenRouter);

app.use('/secure/api', apiRouter);




app.listen(port, function(err){

    if(err)

        console.log('Error: ' + err);

    else

        console.log('Server started at localhost: ' + port);

});




app.use(function(req, res) {

    res.status(404).send('404: Page not Found');

});

//HANDLE ALL OTHER ERRORS AS A SERVER ERROR


app.use(function(error, req, res, next) {

    res.status(500).send('500: Internal Server Error');

});
