//CREATED BY COULTON FRASER FOR WEB 3, MOUNT ROYAL UNIVERSITY
var http = require('http'),

token = '';



module.exports = {
    getToken: function(){return token;},

    resetToken: function(){token = '';},

    verifyToken: function(req, res, authtoken, permission, successFile, failureRoute){

        options = {

            host:"localhost",

            port:'3002',

            path:'/verify',

            method:'POST',

            headers: {'token':authtoken},

            json:true

        };

        function verify(callback) {

            http.request(options).on('response', function(response) {
                var data = '';
                response.on("data", function (chunk) {
                    data += chunk;
                });
                response.on('end', function () {
                    if (response.statusCode == 200)
                    res.status(200).sendFile(successFile);
                    else{
                        res.status(404).redirect('/error');
                        data = '';
                    }

                    callback(data);
                });
            }).end();
        }


        verify(function (retToken){

            //console.log('CUSTOM TOKEN: '+ token);

        });

    },

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
                    res.status(200).sendFile(successFile);
                    else{

                        res.status(404).redirect(failureRoute);
                        data = false;

                    }

                    callback(data);
                });
            }).end();
        }


        return auth(function(retToken)
        {

            token = retToken;
            console.log('CUSTOM TOKEN: '+ token);
            return token;

        });

    }
};
