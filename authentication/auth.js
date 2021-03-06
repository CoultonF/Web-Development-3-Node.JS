var express = require('express'),

nJwt = require('njwt'),

bodyParser = require('body-parser'),

bcrypt = require('bcrypt'),

credentials = require('./info.json'),

otherCredentials = require('./info.json'),

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

removeUserRouter = express.Router(),

addAppRouter = express.Router(),

removeAppRouter = express.Router(),

generateTokenRouter = express.Router(),

renewTokenRouter = express.Router(),

apiRouter = express.Router(),

modifyRouter = express.Router(),

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

                console.log('COPY THIS SHIT: ' + jwt);

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

    credentials = JSON.parse(fs.readFileSync(__dirname + '/info.json'));

    var authtoken = req.headers.token;

    var secretKey = credentials[req.headers.permission].tokenSecret;

    nJwt.verify(authtoken, secretKey,function(err,verifiedJwt){

        if (err)

        return res.status(401).send('');

        else if(verifiedJwt.body.iss == req.headers.permission)

        return res.status(200).send('200 – OK.');

    });

});










logoutRouter.route('/').get(function(req, res){

    //RESET THE TOKEN THAT WAS BEING STORED IN THE APP

    token = "";

    customAuth.resetToken();

    //send to start page

    res.redirect('/');

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
apiRouter.route('/all-apps').get(function(req, res){
    var outputArr = [];
    var file = fs.readFileSync( __dirname + "/" + "info.json", 'utf8');
    var jsonObj = JSON.parse(file);
    console.log(jsonObj);
    for (var application in jsonObj) {
        console.log('FLAG1: '+ application);
        outputArr.push({"application":application, "count":jsonObj[application].users.length});
    }
    console.log(outputArr);
    res.json(outputArr);
    res.end();
});

apiRouter.route('/username').get(function(req,res){

    res.send(customAuth.getUsername());

});
//THE ADMIN USER WILL NOT BE REMOVED IF THERE IS ONLY ONE ADMIN

removeUserRouter.route('/').post(function(req, res){

    //IF NO SELECTION IS MADE GO BACK TO /SECURE
    if(!req.body.removeUserData)
    return res.redirect('/secure');
    try{
        var jsonObj = JSON.parse(req.body.removeUserData);
        var file = fs.readFileSync( __dirname + "/" + "info.json", 'utf8');
        var jsonFile = JSON.parse(file);
        for (var i = 0; i < jsonFile[jsonObj.permission].users.length; i++) {
            if(customAuth.decrypt(jsonFile[jsonObj.permission].users[i].username) == jsonObj.username){
                jsonFile[jsonObj.permission].users.splice(i,1);
                if(jsonFile.admin.users.length >= 1){
                    var data = JSON.stringify(jsonFile, null, 4);
                    try {

                        fs.writeFileSync(__dirname + '/info.json', data, 'utf-8');
                    }
                    catch(err) {
                        console.log(err);
                    }
                }
                return res.redirect('/secure');
            }
        }
    }
    catch(err){
        return res.redirect('/');
    }
});

addUserRouter.route('/').post(function(req, res){

    try{
        console.log('FLAG HERE--------------------------------------------');
        console.log(req.body.permission);
        console.log(req.body.username);
        console.log(req.body.password);

        otherCredentials = JSON.parse(fs.readFileSync( __dirname + "/" + "info.json", 'utf8'));

        otherCredentials[req.body.permission].users.push({'username':customAuth.encrypt(req.body.username),'password':bcrypt.hashSync(req.body.password, saltRounds)});


        //STRINGIFY PARAM: 4 – MEANS INDENT 4 SPACES TO ENSURE READABILITY
        var data = JSON.stringify(otherCredentials, null, 4);
        console.log('DATA: '+data);
        fs.writeFileSync(__dirname + '/../authentication/info.json', data, 'utf-8');
        // fs.writeFile(__dirname + '/../authentication/info.json', data, 'utf-8', function(err){
        //
        //     if (err)
        //
        //     return console.log(err);
        //
        //     console.log(data);

        res.redirect('/secure');

        //});
    }

    catch(err){
        console.log(err);
        return res.redirect('/');
    }

});

addAppRouter.route('/').post(function(req, res){

    try{
        console.log('FLAG HERER ------------------------------------------------'+req.body.application);
        var application = req.body.application;

        var _Credentials = JSON.parse(fs.readFileSync( __dirname + "/" + "info.json", 'utf8'));
        console.log(_Credentials);
        _Credentials[application]={"users":[],"tokenSecret":""};


        //STRINGIFY PARAM: 4 – MEANS INDENT 4 SPACES TO ENSURE READABILITY
        var data = JSON.stringify(_Credentials, null, 4);
        console.log('DATA: '+data);
        fs.writeFileSync(__dirname + '/../authentication/info.json', data, 'utf-8');
        // fs.writeFile(__dirname + '/../authentication/info.json', data, 'utf-8', function(err){
        //
        //     if (err)
        //
        //     return console.log(err);
        //
        //     console.log(data);

        res.redirect('/secure');

        //});
    }

    catch(err){
        console.log(err);
        return res.redirect('/');
    }


});

removeAppRouter.route('/').post(function(req, res){

    try{
        var application = req.body.removeAppData;

        var file = fs.readFileSync( __dirname + "/" + "info.json", 'utf8');
        var jsonFile = JSON.parse(file);
        console.log(jsonFile);
        console.log('LENGTH: '+Object.keys(jsonFile).length);
        for (var applicationObj in jsonFile) {
            var i = 0;
            if (jsonFile.hasOwnProperty(applicationObj) && applicationObj == application) {
                delete jsonFile[application];
                var data = JSON.stringify(jsonFile, null, 4);

                fs.writeFileSync(__dirname + '/info.json', data, 'utf-8');

            }
            i++;
        }
        // for (var i = 0; i < Object.keys(jsonFile).length; i++) {
        //     console.log(jsonFile[i] + ' =|= ' + application);
        //     if(jsonFile[i] == application){
        //         jsonFile.splice(i,1);
        //         var data = JSON.stringify(jsonFile, null, 4);
        //         try {
        //
        //             fs.writeFileSync(__dirname + '/info.json', data, 'utf-8');
        //
        //         }
        //         catch(err) {
        //             console.log(err);
        //         }
        //
        //         return res.redirect('/secure');
        //     }
        // }
    }
    catch(err){
        console.log(err);
        return res.redirect('/');
    }
    res.redirect('/');

});

generateTokenRouter.route('/').post(function(req, res){

    var tokenSecret = crypto.randomBytes(64).toString('hex');

    var infoJSON;

    infoJSON = JSON.parse(fs.readFileSync(__dirname + '/info.json', 'utf8'));

    infoJSON[req.body.application].tokenSecret = tokenSecret;

    infoJSON = JSON.stringify(infoJSON, null, 4);

    fs.writeFile(__dirname + '/../authentication/info.json', infoJSON, 'utf-8', function(err){

        if (err)

        return console.log(err);

        res.redirect('/secure');

    });

});

modifyRouter.route('/').post(function(req, res){
try{
    var old_username = JSON.parse(req.body.before_json).username,
    old_permission = JSON.parse(req.body.before_json).permission,
    new_username = req.body.username,
    new_password = req.body.password;

    var data_json = JSON.parse(fs.readFileSync( __dirname + "/" + "info.json", 'utf8'));
    console.log(data_json.admin.users);
    if (old_username != new_username && new_username) {
        for (var user in data_json[old_permission].users) {
            if (data_json[old_permission].users.hasOwnProperty(user) && customAuth.decrypt(data_json[old_permission].users[user].username) == old_username) {
                data_json[old_permission].users[user].username = customAuth.encrypt(new_username);
            }
        }
    }
    if (new_password) {
        for (var userp in data_json[old_permission].users) {
            if (data_json[old_permission].users.hasOwnProperty(userp) && customAuth.decrypt(data_json[old_permission].users[userp].username) == old_username) {
                data_json[old_permission].users[userp].password = bcrypt.hashSync(new_password, saltRounds);
            }
        }
    }

    var data = JSON.stringify(data_json, null, 4);
    try {

        fs.writeFileSync(__dirname + '/info.json', data, 'utf-8');
    }
    catch(err) {
        console.log(err);
    }

    console.log('--------------------------------------------------------------------------------------------------------');
    console.log(data_json.admin.users);

    res.redirect('/');
    }
    catch(err){
        console.log(err);
        res.redirect('/');
    }

});


app.use('/verify', verifyRouter);

app.use('/login', loginRouter);

app.use('/error', errorRouter);

app.use('/secure', secureRouter);

app.use('/logout', logoutRouter);

app.use('/secure/api', apiRouter);

app.use('/secure/remove-user', removeUserRouter);

app.use('/secure/add-user', addUserRouter);

app.use('/secure/add-app', addAppRouter);

app.use('/secure/remove-app', removeAppRouter);

app.use('/secure/generate-token', generateTokenRouter);

app.use('/secure/modify-user', modifyRouter);



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
