import $ from 'jquery/dist/jquery.min.js';
window.$ = $;
window.jQuery = $;
$(document).ready(function(){
    initSliders();

    function initSliders() {
        var sliders = $('.quiz__slider');
        sliders.each(function(i,el){
            var input = $(el).find('.quiz__slider-field'),
                output = $(el).find('.quiz__slider-value');
            output.text(input.val());
            input.off('input.my').on('input.my',function(){
                output.text(input.val());
            });
            input.off('change.my').on('change.my',function(){
                output.text(input.val());
            });
        });
    }
});