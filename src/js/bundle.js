$.mobile.ajaxEnabled = false; 
$("div.testimonial-container").on("swiperight", swiperightHandler);
$("a.dot-left").on("click", swiperightHandler);
$("div.testimonial-container").on("swipeleft", swipeleftHandler);
$("a.dot-right").on("click", swipeleftHandler);

function swiperightHandler( event ) {
    $("div.testimonial-container").animate({left: "0%"});
    $("div.testimonial-container").addClass("swipe-right");
    $("div.testimonial-container").removeClass("swipe-left");
    $("a.dot-left").addClass("selected");
    $("a.dot-right").removeClass("selected");
}

function swipeleftHandler( event ) {
    $("div.testimonial-container").animate({left: "-94.5%"});
    $("div.testimonial-container").addClass("swipe-left");
    $("div.testimonial-container").removeClass("swipe-right");   
    $("a.dot-right").addClass("selected");
    $("a.dot-left").removeClass("selected");
}

$(".scroll-to-top").on("click", function() {
    window.scrollTo({top: 0, behavior: 'smooth'});
});