$(document).ready(function(){
	initQuizSelects();
	initQuizCheckboxes();
	initCheckInput();

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

	function initQuizCheckboxes() {
		var radioBtns = $('.quiz__radio-btns').find('.quiz__radio-input'),
			checkboxes = $('.quiz__checkboxes').find('.quiz__checkbox-input'),
			uncheck = function(array,number) {
				array.each(function(iter,elem){
					if (iter !== number) {
						$(elem).parent('label').removeClass($(elem).parent('label')[0].classList[0]+'_checked');
					}
				});
			},
			iterate = function(array) {
				if (array.length > 0) {

					array.each(function(i,el){
						if ($(el).prop('checked')) {
							$(el).parent('label').addClass($(el).parent('label')[0].classList[0]+'_checked');
						}
					});

					array.each(function(i,el){
						$(el).on('change', function(){
							var inputParent   = $(el).parent('label'),
								parentClass   = inputParent[0].classList[0],
								checkedClass  = parentClass+'_checked';

							if (parentClass==='quiz__radio') {
								uncheck(array,i);
							}

							if ($(el).prop('checked')) {
								inputParent.addClass(checkedClass);
							} else {
								inputParent.removeClass(checkedClass);
							}

							if (parentClass==='quiz__radio') {
								var checkInput = $('.quiz__check-input');
								if (checkInput.hasClass('quiz__check-input_checked')) {
									checkInput.removeClass('quiz__check-input_checked');
									checkInput.find('.quiz__check-input-field').val('');
								}
							}
						});
					});
				}
			};
			
		iterate(radioBtns);
		iterate(checkboxes);
	}

	function initCheckInput() {
		var checkInput = $('.quiz__check-input'),
			checkInputParent = checkInput.parent('div'),
			btn = checkInput.find('.quiz__check-input-point'),
			field = checkInput.find('.quiz__check-input-field');


		btn.on('click', function(){
			if (field.val()==='') {
				field.focus();
			} else {
				field.val('');
				checkInput.removeClass('quiz__check-input_checked');
			}
		})

		field.on('keyup', function(evt){
			if (field.val()==='') {
				checkInput.removeClass('quiz__check-input_checked');
			} else if (field.val()!==''&&!checkInput.hasClass('quiz__check-input_checked')&&!checkInputParent.hasClass('quiz__radio-btns')) {
				checkInput.addClass('quiz__check-input_checked');
			} else if (field.val()!==''&&!checkInput.hasClass('quiz__check-input_checked')&&checkInputParent.hasClass('quiz__radio-btns')) {
				checkInputParent.find('.quiz__radio-input').each(function(i,el){
					if ($(el).prop('checked')) {
						$(el).prop('checked',false).change();
					}
				});
				checkInput.addClass('quiz__check-input_checked');
			}
		});
	}
});