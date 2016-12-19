
// jQuery
// require('jquery');
window.$ = window.jQuery = require('./js/jquery.js');

// Bootstrap
require('./js/bootstrap.min.js');

//Swiper JS
require('./js/swiper.jquery.min.js');

//Single Page Nav JS
require('./js/jquery.singlePageNav.js');

//Count Down JS
require('./js/jquery.downCount.js');

//Owl Carousel JS
require('./js/owl.carousel.js');

//Number Count (Waypoint) JS
require('./js/waypoints-min.js');

//Filter able JS
require('./js/jquery-filterable.js');

//Contact Form Validation JS
require('./js/pluginse209.js');

//Custom JS
require('./js/custom.js');

    /*
      ==============================================================
           Sticky Navigation Script
      ==============================================================
    */
    if($('.gt_top3_menu').length){
        // grab the initial top offset of the navigation 
        var stickyNavTop = $('.gt_top3_menu').offset().top;
        // our function that decides weather the navigation bar should have "fixed" css position or not.
        var stickyNav = function(){
            var scrollTop = $(window).scrollTop(); // our current vertical position from the top
            // if we've scrolled more than the navigation, change its position to fixed to stick to top,
            // otherwise change it back to relative
            if (scrollTop > stickyNavTop) { 
                $('.gt_top3_menu').addClass('gt_sticky');
            } else {
                $('.gt_top3_menu').removeClass('gt_sticky'); 
            }
        };
        stickyNav();
        // and run it again every time you scroll
        $(window).scroll(function() {
            stickyNav();
        });
    }
    if($('.single-page').length){
        $('.single-page').singlePageNav({
            offset: $('.kode_pet_navigation').outerHeight(),
            filter: ':not(.external)',
            updateHash: true,
            beforeStart: function() {
                console.log('begin scrolling');
            },
            onComplete: function() {
                console.log('done scrolling');
            }
        });
    }
