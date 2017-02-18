$(function(){

    $('#add-app').click(function(){

        changeActive(this);
        $('.ui.sidebar').sidebar('toggle');

    });

    $('#remove-app').click(function(){

        changeActive(this);
        $('.ui.sidebar').sidebar('toggle');

    });

    $('#gen-app-token').click(function(){

        changeActive(this);
        $('.ui.sidebar').sidebar('toggle');

    });

    $('#add-user').click(function(){

        changeActive(this);
        $('.add-user').show();
        $('.ui.sidebar').sidebar('toggle');

    });

    $('#remove-user').click(function(){

        changeActive(this);
        $('.remove-user').show();
        $('.ui.sidebar').sidebar('toggle');

    });

    $('#modify-user').click(function(){

        changeActive(this);

    });

    var changeActive = function(current){

        $('.menu>.active').removeClass('active');

        $(current).addClass('active');

        $('#admin-container>*').hide();

        $('#admin-container>*').removeClass('hide');



    };

    setDefaultView = function(){

        changeActive('#add-user');
        $('.add-user').show();

    }();

    $('.menu-icon').click(function(){

        $('.ui.sidebar').sidebar('toggle');

    });


});
