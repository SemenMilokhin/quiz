$(document).ready(function(){
	loadJSON();
	initQuizSelects();
	// initQuizCheckboxes();
	initCheckInput();
	initSwiper();

	function loadJSON() {
		$.getJSON('../json/config.json', function(data){
			var objSize = function(object) {
					var size = 0;
					for (var key in object) {
						if (object.hasOwnProperty(key)) size++;
					}
					return size;
				},
				renderQuestion = function(obj) {
					$('.quiz__title').append(obj.title);
					$('.quiz__description').append(obj.description);
					switch(obj.type) {
						case 'radio':
							var block = $('<div>',{class: 'quiz__radio-btns'});
							for (var key in obj.poll) {
								block.append($('<label>',{
									class: 'quiz__radio',
									append: $('<input>',{
										class: 'quiz__hidden-input',
										type: 'radio',
										val: key,
										name: 'radio-group'
									})
									.add($('<span>',{class:'quiz__radio-point'}))
									.add($('<span>',{class:'quiz__radio-label',text:obj.poll[key]})),
								}));
							}
							block.appendTo('.quiz__body');
							initQuizCheckboxes('radio-btns');
							break;
						case 'checkbox':
							var block = $('<div>',{class: 'quiz__checkboxes'});
							for (var key in obj.poll) {
								block.append($('<label>',{
									class: 'quiz__checkbox',
									append: $('<input>',{
										class: 'quiz__hidden-input',
										type: 'checkbox',
										val: key,
										name: 'checkbox-group'
									})
									.add($('<span>',{class:'quiz__checkbox-point'}))
									.add($('<span>',{class:'quiz__checkbox-label',text:obj.poll[key]})),
								}));
							}
							block.appendTo('.quiz__body');
							initQuizCheckboxes('checkboxes');
							break;
						case 'select':
							var list = $('<ul>',{class: 'quiz__select-options-list'});
							for (var key in obj.poll) {
								list.append($('<li>',{
									class: 'quiz__select-option',
									'data-value': key,
									text: obj.poll[key]
								}));
							}
							var block = $('<div>',{
								class: 'quiz__select',
								append: $('<button>',{
									class: 'quiz__select-btn',
									append: $('<span>',{text:'Выберите значение из списка'})
										.add($('<svg>',{class: 'quiz__select-btn-svg',})),
								})
								.add(list)
								.add($('<input>',{
									class: 'quiz__hidden-input',
									type: 'text',
								})),
							});
							block.appendTo('.quiz__body');
							initQuizSelects();
							break;
						case 'pic':
							var pictures = $('<div>',{class: 'quiz__pictures swiper-wrapper'});
							for (var key in obj.poll) {
								pictures.append($('<label>',{
									class: 'quiz__pic swiper-slide',
									append: $('<input>',{
										class: 'quiz__hidden-input',
										type: 'radio',
										val: key,
										name: 'pictures-group'
									})
									.add($('<div>',{
										class: 'quiz__pic-img-wrapper',
										append: $('<img>',{
											class: 'quiz__pic-img',
											src: obj.pic[key],
											alt: obj.poll[key],
										}),
									}))
									.add($('<div>',{
										class:'quiz__pic-label',
										text: obj.poll[key],
									})),
								}));
							}
							var block = $('<div>',{
								class: 'swiper-container',
								append: pictures.add($('<div>',{
									class:'swiper-button-prev',
									append: $('<svg>',{class: 'swiper-button-svg'}),
								}))
								.add($('<div>',{
									class:'swiper-button-next',
									append: $('<svg>',{class: 'swiper-button-svg'}),
								}))
								.add($('<div>',{class:'swiper-scrollbar'})),
							});
							block.appendTo('.quiz__body');
							initQuizCheckboxes('pictures');
							initSwiper();
							break;
						case 'text':
							var block = $('<textarea>',{
								class: 'quiz__textarea',
								placeholder: 'Введите текст'
							});
							block.appendTo($('.quiz__body'));
							break;
						case 'num':
							var block = $('<input>',{
								class: 'quiz__number',
								type: 'number',
								pattern:'[0-9]*',
								placeholder: 'Число',
							});
							block.appendTo($('.quiz__body'));
							break;
						case 'message':
							var block = $('<div>',{
								class: 'quiz__output',
								text: obj.message,
							});
							block.appendTo($('.quiz__body'));
							break;
					}
					console.log(obj);
				};
			data.pollSize = objSize(data.poll);

			var order = [];
			for (var key in data.poll) {
				if (data.poll.hasOwnProperty(key)&&key.substr(0,1)==='p') {
					order.push(key);
				}
			}

			order.sort(function(a,b){
				return(Number(a.substr(1)) - Number(b.substr(1)));
			});

			// for (var i=0;i<order.length;i++) {
			// 	console.log(data.poll[order[i]].type);
			// }
			renderQuestion(data.poll[order[4]]);
			// 
			// Конец работы с JSON
			// 
		}).fail(function(){
			console.log('JSON не загрузился');
		});
		// JSONdata.pollSize = objSize;
		// console.log(JSONdata.pollSize);
	}
	function initQuizSelects() {
		var selects = $('.quiz__select'),
			closeAllSelects = function(count) {
				selects.each(function(i,el) {
					if(count !== i) {
						$(el).removeClass('quiz__select_opened');
					}
				});
			};

		selects.each(function(i,el){
			var select = $(el),
				input = select.find('.quiz__hidden-input'),
				options = select.find('.quiz__select-options-list').find('.quiz__select-option'),
				btn = select.find('.quiz__select-btn'),
				closeSelect = function() {
					select.removeClass('quiz__select_opened');
				},
				openSelect = function() {
					select.addClass('quiz__select_opened');
				};

			options.each(function(iter,elem) {
				$(elem).off('click.my').on('click.my', function(evt) {
					var value = $(elem).attr('data-value'),
						text  = $(elem).text();
					input.val(value);
					btn.find('span').text(text);
					closeSelect();
				})
			});

			btn.off('click.my').on('click.my', function(evt){
				evt.preventDefault();
				closeAllSelects(i);
				if (!select.hasClass('quiz__select_opened')) {
					openSelect();
				} else {
					closeSelect();
				};
			});
		});

		$(document).off('click.my').on('click.my', function (evt){
			if (!selects.is(evt.target) && selects.has(evt.target).length === 0) {
				closeAllSelects();
			}
		});
	}

	function initQuizCheckboxes(classPart) {
		var uncheck = function(array,number) {
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
						$(el).off('change.my').on('change.my', function(){
							var inputParent   = $(el).parent('label'),
								parentClass   = inputParent[0].classList[0],
								checkedClass  = parentClass+'_checked';

							if (parentClass==='quiz__radio'||parentClass==='quiz__pic') {
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
		iterate($('.quiz__'+classPart).find('.quiz__hidden-input'));
	}

	function initCheckInput() {
		var checkInput = $('.quiz__check-input'),
			checkInputParent = checkInput.parent('div'),
			btn = checkInput.find('.quiz__check-input-point'),
			field = checkInput.find('.quiz__check-input-field');


		btn.off('click.my').on('click.my', function(){
			if (field.val()==='') {
				field.focus();
			} else {
				field.val('');
				checkInput.removeClass('quiz__check-input_checked');
			}
		})

		field.off('keyup.my').on('keyup.my', function(evt){
			if (field.val()==='') {
				checkInput.removeClass('quiz__check-input_checked');
			} else if (field.val()!==''&&!checkInput.hasClass('quiz__check-input_checked')&&!checkInputParent.hasClass('quiz__radio-btns')) {
				checkInput.addClass('quiz__check-input_checked');
			} else if (field.val()!==''&&!checkInput.hasClass('quiz__check-input_checked')&&checkInputParent.hasClass('quiz__radio-btns')) {
				checkInputParent.find('.quiz__hidden-input').each(function(i,el){
					if ($(el).prop('checked')) {
						$(el).prop('checked',false).change();
					}
				});
				checkInput.addClass('quiz__check-input_checked');
			}
		});
	}

	function initSwiper() {
		if ($('.swiper-container').length>0) {
			var mySwiper = new Swiper ('.swiper-container', {
				slidesPerView: 'auto',
				spaceBetween: 21,
				direction: 'horizontal',
				navigation: {
					nextEl: '.swiper-button-next',
					prevEl: '.swiper-button-prev',
				},
				scrollbar: {
					el: '.swiper-scrollbar'
				},
			})
		}
	}
});