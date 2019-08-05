$(document).ready(function(){
	loadJSON();
	initQuizSelects();
	initCheckInput();

	function loadJSON() {
		$.getJSON('../json/config.json', function(data){
			var initButtons = function() {
					var buttons = $('.quiz__buttons'),
						prevBtn = buttons.find('.quiz__btn_prev'),
						skipBtn = buttons.find('.quiz__btn_skip'),
						nextBtn = buttons.find('.quiz__btn_next');

					prevBtn.off('click.my').on('click.my', renderPreviousChunk);
					skipBtn.off('click.my').on('click.my', skipChunk);
					nextBtn.off('click.my').on('click.my', renderNextChunk);
				},
				checkConditions = function(obj) {
					var result = true;
					switch (obj.type) {
						case 'radio':
							if ($('.quiz__hidden-input:checked').length > 0) {
								console.log($('.quiz__hidden-input:checked'));
								console.log($('.quiz__hidden-input:checked').length);
								result = false;
							}
							break;
						case 'checkbox':
							//
							break;
						case 'select':
							//
							break;
						case 'pic':
							//
							break;
						case 'text':
							//
							break;
						case 'num':
							//
							break;
						case 'message':
							//
							break;
					}
					return result;
				}
				renderQuestion = function(obj) {
					var title = $('.quiz__title'),
						description = $('.quiz__description'),
						body = $('.quiz__body'),
						processLabelValue = $('.quiz__process-label span'),
						processFieldStyle = $('.quiz__process-field span'),
						buttons = $('.quiz__buttons'),
						prevBtn = $('<button>',{
							class: 'quiz__btn quiz__btn_prev quiz__btn_fill',
							text: 'Назад',
							prepend: $('<svg>',{class:'quiz__btn-svg quiz__btn-svg_inverted'}),
						}),
						skipBtn = $('<button>',{
							class: 'quiz__btn quiz__btn_skip',
							text: 'Пропустить',
						}),
						nextBtn = $('<button>',{
							class: 'quiz__btn quiz__btn_next quiz__btn_fill quiz__btn_blicked',
							text: 'Далее',
							append: $('<svg>',{class: 'quiz__btn-svg'}),
						}),
						progressPercent = Math.round(100/(data.order.length-1)*(data.currentChunk));

					title.empty().append(obj.title);
					description.empty().append(obj.description);

					body.empty();
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

					processLabelValue.empty().append(progressPercent+'%');
					processFieldStyle.css({width:progressPercent+'%'});

					buttons.empty();
					if (obj.back === '1') {
						buttons.append(prevBtn);
					}
					if (obj.skip === '1') {
						buttons.append(skipBtn);
					}
					buttons.append(nextBtn);
					initButtons();
				},
				renderPreviousChunk = function() {
					if (data.currentChunk >= 1 && data.currentChunk < data.order.length) {
						data.currentChunk-=1;
						renderQuestion(data.poll[order[data.currentChunk]]);	
					}
				}
				skipChunk = function() {
					if (data.currentChunk >= 0 && data.currentChunk < data.order.length-1) {
						data.currentChunk+=1;
						renderQuestion(data.poll[order[data.currentChunk]]);
					}
				}
				renderNextChunk = function() {
					if (checkConditions(data.poll[order[data.currentChunk]]) && data.currentChunk >= 0 && data.currentChunk < data.order.length-1) {
						data.currentChunk+=1;
						renderQuestion(data.poll[order[data.currentChunk]]);
					} else {
						console.log('Условия для продолжения не соблюдены');
					}
				};
			data.currentChunk = 0;

			var order = [];
			for (var key in data.poll) {
				if (data.poll.hasOwnProperty(key)&&key.substr(0,1)==='p') {
					order.push(key);
				}
			}
			order.sort(function(a,b){
				return(Number(a.substr(1)) - Number(b.substr(1)));
			});
			data.order = order;

			renderQuestion(data.poll[order[data.currentChunk]]);
			initButtons();

			
			


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