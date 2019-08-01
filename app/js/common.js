$(document).ready(function(){
	initQuizSelects(); 

	function initQuizSelects() {
		var selects = $('.quiz__select');

		selects.each(function(i,el){
			var select = $(el),
				input = select.find('.quiz__select-input'),
				options = select.find('.quiz__select-options-list').find('.quiz__select-option'),
				btn = select.find('.quiz__select-btn'),
				closeSelect = function() {
					select.removeClass('quiz__select_opened');
				},
				openSelect = function() {
					select.addClass('quiz__select_opened');
				},
				closeAllSelects = function(count) {
					selects.each(function(c,elem) {
						if(count !== c) {
							$(elem).removeClass('quiz__select_opened');
						}
					});
				};

			options.each(function(i,el) {
				$(el).on('click', function(evt) {
					var value = $(el).attr('data-value'),
						text  = $(el).text();
					evt.preventDefault();
					input.val(value);
					btn.text(text);
					closeSelect();
				})
			});

			btn.on('click', function(evt){
				evt.preventDefault();
				closeAllSelects(i);
				if (!select.hasClass('quiz__select_opened')) {
					openSelect();
				} else {
					closeSelect();
				};
			});
			$(document).mouseup(function (evt){
				if (!select.is(evt.target) && select.has(evt.target).length === 0) { // и не по его дочерним элементам
					closeSelect();
				}
			});
		});
	}
});