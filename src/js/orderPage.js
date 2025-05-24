import $ from 'jquery/dist/jquery.min.js';
window.$ = $;
window.jQuery = $;
$(document).ready(function(){
    initOrder();

    function initOrder() {
        var orderItems = $('.quiz__order-item'),
            currentNumber = 1;
        orderItems.each(function(i,el){
            if ($(el).find('.quiz__hidden-input').prop('checked')) {
                currentNumber++;
            }
        });
        orderItems.each(function(i,el){
            var input = $(el).find('.quiz__hidden-input'),
                number = $(el).find('.quiz__order-item-number');
            if (input.prop('checked')) {
                $(el).addClass('quiz__order-item_checked');
            }
            input.off('change.my').on('change.my', function(){
                if (input.prop('checked')) {
                    $(el).addClass('quiz__order-item_checked');
                    number.text(currentNumber);
                    currentNumber++;
                } else {
                    $(el).removeClass('quiz__order-item_checked');
                    var clickedNumber = Number(number.text()); 
                    number.text('?');
                    orderItems.each(function(iter,elem){
                        var currentItemInput = $(elem).find('.quiz__hidden-input');
                        if (currentItemInput.prop('checked')) {
                            var currentItemNumber = $(elem).find('.quiz__order-item-number'),
                                currentItemNumberValue = Number(currentItemNumber.text());
                            if (currentItemNumberValue > clickedNumber) {
                                currentItemNumber.text(currentItemNumberValue-1);
                            }
                        }
                    });
                    currentNumber--;
                }
            });
        });
    }
});