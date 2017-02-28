$(function(){
    $('.menu-icon').click(function(){

        $('.ui.sidebar').sidebar('toggle');

    });

    $('.ui.dropdown').dropdown();

    $("input.modify-user").click(function() {
        if(this.checked) {
            console.log(this.value);
            var obj = JSON.parse(this.value);
            console.log(obj.username);
            console.log(obj.permission);
            $('input[name="username"].modify-user').val(obj.username);

        }
    });

    $('#add-app').click(function(){

        changeActive(this);
        $('.add-app').show();
        $('.ui.sidebar').sidebar('toggle');

    });

    $('#remove-app').click(function(){

        changeActive(this);
        $('.remove-app').show();
        $('.ui.sidebar').sidebar('toggle');

    });

    $('#generate-token').click(function(){

        changeActive(this);
        $('.generate-token').show();
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
        $('.modify-user').show();
        $('.ui.sidebar').sidebar('toggle');

    });

    var changeActive = function(current){

        $('.menu>.active').removeClass('active');

        $(current).addClass('active');

        $('#admin-container>*').hide();

        $('#admin-container>*').removeClass('hide');

    };

    setDefaultView = function(){

        changeActive('#add-app');
        $('.add-app').show();

    }();




});
