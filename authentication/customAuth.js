//CREATED BY COULTON FRASER FOR WEB 3, MOUNT ROYAL UNIVERSITY


//VERIFY TOKEN:

//      REQ, RES    -> FROM THE CALLING ROUTER
//      AUTHTOKEN   -> THE TOKEN TO BE VERIFIED
//      PERMISSION  -> THE APPLICATION THAT THE TOKEN IS BEING VERIFIED AGAINST
//      SUCCESSFILE -> FILE TO BE SENT UPON VERIFY SUCCES
//      FAILUREROUTE-> ROUTE TO BE REDIRECTED TO UPON VERIFY FAILURE

//WHEN CALLED, THIS FUNCTION WILL SEND A RESPONSE OF:

//      200 STATUS  -> THE TOKEN PROVIDED WAS VERIFIED | SENDFILE(SUCCESSFILE)
//      404 STATUS  -> THE TOKEN PROVIDED WAS UNAUTHORIZED | REDIRECT(FAILUREROUTE)



var http = require('http'),

crypto = require('crypto'),

algorithm = 'aes-256-ctr',

password = 'd6F3Efeq',

token = '',

username = "";

module.exports = {

    getToken: function(){return token;},

    resetToken: function(){token = '';},

    getUsername: function(){return username;},

    encrypt: function encrypt(text){

        var cipher = crypto.createCipher(algorithm,password);

        var crypted = cipher.update(text,'utf8','hex');

        crypted += cipher.final('hex');

        return crypted;

    },

    decrypt: function decrypt(text){

        var decipher = crypto.createDecipher(algorithm,password);

        var dec = decipher.update(text,'hex','utf8');

        dec += decipher.final('utf8');

        return dec;

    },

    verifyToken: function(req, res, authtoken, permission, successFile, failureRoute, next){

        options = {

            host:"localhost",

            port:'3002',

            path:'/verify',

            method:'POST',

            headers: {'token':authtoken, 'permission':permission},

            json:true

        };

        function verify(callback) {

            http.request(options).on('response', function(response) {

                var data = '';

                response.on("data", function (chunk) {

                    data += chunk;

                    console.log(data);

                });

                response.on('end', function () {

                    if (response.statusCode == 200 && successFile)

                    res.status(200).sendFile(successFile);

                    else if (next)
                    {
                        res.status(200);
                        next();
                    }
                    else

                    {

                        res.status(404).redirect(failureRoute);

                        data = '';

                    }

                    callback(data);

                });

            }).end();

        }

        return verify(function (retToken){

            return '';

        });

    },



    //AUTHORIZE CREDENTIALS

    //      REQ, RES     -> FROM THE CALLING ROUTER
    //      USERNAME     -> THE USERS USERNAME IN PLAIN TEXT
    //      PASSWORD     -> THE USERS PASSWORD IN PLAIN TEXT
    //      PERMISSION   -> THE APPLICATION THAT THE TOKEN IS BEING VERIFIED AGAINST
    //      SUCCESSFILE  -> FILE TO BE SENT UPON VERIFY SUCCES
    //      FAILUREROUTE -> ROUTE TO BE REDIRECTED TO UPON VERIFY FAILURE

    //WHEN CALLED, THIS FUNCTION WILL SEND A RESPONSE OF:

    //      200 STATUS  -> THE CREDENTIALS PROVIDED WERE VERIFIED | SENDFILE(SUCCESSFILE)
    //      404 STATUS  -> THE CREDENTIALS PROVIDED WERE UNAUTHORIZED | REDIRECT(FAILUREROUTE)

    authorize: function(req, res, username, password, permission, successFile, failureRoute){

        var authData = {

            'username': username,

            'password': password,

            'permission': permission

        },

        options = {

            host:"localhost",

            port:'3002',

            path:'/login',

            method:'POST',

            headers: authData,

            json:true

        };

        function auth(callback) {

            http.request(options).on('response', function(response) {

                var data = '';

                response.on("data", function (chunk) {

                    data += chunk;

                });

                response.on('end', function () {

                    if (response.statusCode == 200)

                    {

                        res.status(200).sendFile(successFile);

                        this.username = username;

                    }

                    else

                    {

                        res.status(404).redirect(failureRoute);

                        this.username = '';

                        data = '';

                    }

                    callback(data);
                });

            }).end();

        }

        return auth(function(retToken)

        {

            token = retToken;

            return token;

        });

    }

};
