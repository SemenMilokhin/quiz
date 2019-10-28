$(document).ready(function(){
	loadJSON();

	function loadJSON() {
		$.getJSON('json/config.json', function(data){
			var shuffleArr = function(arr) {
					var j, temp;

					for(var i = arr.length - 1; i > 0; i--){
						j = Math.floor(Math.random()*(i + 1));
						temp = arr[j];
						arr[j] = arr[i];
						arr[i] = temp;
					}

					return arr;
				},
				initButtons = function() {
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
						case 'checkbox':
						case 'pic':
							if ($('.quiz__hidden-input:checked').length === 0) result = false;
							break;
						case 'select':
							if($('.quiz__hidden-input').val()==='') result = false;
							break;
						case 'text':
							if ($('.quiz__textarea').val()==='') result = false;
							break;
						case 'num':
							if ($('.quiz__number').val()==='') result = false;
							break;
						case 'sortable':
							if ($('.quiz__hidden-input:checked').length === 0 || $('.quiz__hidden-input').length !== $('.quiz__hidden-input:checked').length) result = false;
							break;
					}
					return result;
				},
				addAnswers = function(obj) {
					if (obj.textAnswer !== undefined) {
						delete obj.textAnswer;
					}
					switch (obj.type) {
						case 'radio':
						case 'checkbox':
						case 'pic':
							var answerFields = $('.quiz__hidden-input:checked');
							if (answerFields.length === 1) {
								obj.answer = {};
								obj.answer[answerFields.val()] = obj.poll[answerFields.val()];
							} else if (answerFields.length > 1) {
								obj.answer = [];
								answerFields.each(function(i,el){
									var object = {}
									object[$(el).val()] = obj.poll[$(el).val()];
									obj.answer.push(object);
								});
							}
							var textAnswer = $('.quiz__additional-field');
							if (textAnswer.length>0) {
								obj.textAnswer = textAnswer.val();
							}
							break;
						case 'select':
							var answerValue = $('.quiz__hidden-input').val();
							obj.answer = {};
							obj.answer[answerValue] = obj.poll[answerValue];

							var textAnswer = $('.quiz__additional-field');
							if (textAnswer.length>0) {
								obj.textAnswer = textAnswer.val();
							}
							break;
						case 'num':
							var answerValue = $('.quiz__number').val();
							obj.answer = answerValue;
							break;
						case 'text':
							var answerValue = $('.quiz__textarea').val();
							obj.answer = answerValue;
							break;
						case 'sortable':
							obj.answer = {};
							var answerFields = $('.quiz__hidden-input:checked');
							answerFields.each(function(i,el){
								obj.answer[$(el).val()] = $(el).parent('label').find('.quiz__order-item-number').text();
							});
							break;
						case 'slider':
							var inputs = $('.quiz__slider-field');
							obj.answer = {};
							inputs.each(function(i,el){
								obj.answer[$(el).parent('div').parent('.quiz__slider').attr('data-id')] = $(el).val();
							});
							break;
					}
				},
				changeOrder = function(obj) {
					switch(obj.type) {
						case 'radio':
						case 'pic':
						case 'select':
							for (var answerKey in obj.answer) {
								for (var i=data.currentChunk+1;i<data.order.length;i++) {
									if (data.order[i].substr(0,1)==='r') {
										data.order.splice(i, 1);
										i--;
									}
								}
								for (var i=0;i<data.subQuestions.length;i++) {
									if (answerKey.substr(2)===data.subQuestions[i].substr(1)) {
										var flag = true;
										for (var j = 0;j<data.order.length;j++) {
											if (data.order[j]===data.subQuestions[i]) {
												flag = false;
											}
										}
										if (flag) {
											data.order.splice(data.currentChunk+1, 0, data.subQuestions[i]);
										}
									}
								}
							}
							break;
						case 'num':
							if (obj.rule!==undefined) {
								for (var j = 0;j<data.slices.length;j++) {
									if (data.slices[j].start === data.order[data.currentChunk] && data.slices[j].end === data.order[data.currentChunk+1]) {
										for (var k = 0; k<data.slices[j].part.length; k++) {
											data.order.splice(data.currentChunk+1+k, 0, data.slices[j].part[k]);
										}
										data.slices.splice(j, 1);
									}
								}
								for (var questionKey in obj.rule) {
									if (obj.answer<Number(questionKey)) {
										var position = 0;
										for (var i = 0;i<data.order.length;i++) {
											if (obj.rule[questionKey]===data.order[i]) {
												position = i;
											}
										}
										if (data.currentChunk+1 < position) {
											var slice = {};
											slice.part = [];
											slice.start = data.order[data.currentChunk];
											slice.end = data.order[position];
											for (var j = data.currentChunk+1; j<position; j++) {
												slice.part.push(data.order[j]);
											}
											data.order.splice(data.currentChunk+1, position-data.currentChunk-1);
											data.slices.push(slice);
										}
										break;
									}
								}
							}
							break;
					}
				},
				renderQuestion = function(obj,direction) {
					var factor = 1;
					if (direction==='right') {
						factor = -1;
					}
					$('.quiz__btn').each(function(i,el){
						$(el).prop('disabled',true);
					});
					$('.quiz__body').css({
						opacity: 0,
						transform: 'translateX('+(-100*factor)+'px)',
						transition: 'all 0.2s ease'
					});
					setTimeout(function(){
						var title = $('.quiz__title'),
							description = $('.quiz__description'),
							body = $('.quiz__body'),
							footer = $('.quiz__footer'),
							processLabelValue = $('.quiz__process-label span'),
							processFieldStyle = $('.quiz__process-field span'),
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
								if (obj.answer !== undefined) {
									for (var key in obj.poll) {
										for (var answerKey in obj.answer) {
											if (answerKey === key) {
												block.append($('<label>',{
													class: 'quiz__radio',
													append: $('<input>',{
														class: 'quiz__hidden-input',
														type: 'radio',
														val: key,
														checked: 'checked',
														name: 'radio-group'
													})
													.add($('<span>',{class:'quiz__radio-point'}))
													.add($('<span>',{class:'quiz__radio-label',text:obj.poll[key]})),
												}));
											} else {
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
										}
									}
								} else {
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
								}
								block.appendTo('.quiz__body');
								if (obj.textAnswer !== undefined) {
									$('.quiz__body').append($('<input>',{
										class: 'quiz__additional-field',
										type: 'text',
										placeholder: 'Вы можете дополнить свой ответ',
										val: obj.textAnswer,
									}));
								}
								initQuizCheckboxes('radio-btns');
								break;
							case 'checkbox':
								var block = $('<div>',{class: 'quiz__checkboxes'});
								if (obj.answer !== undefined) {
									if (obj.answer.length===undefined) {
										for (var key in obj.poll) {
											for (var answerKey in obj.answer) {
												if (answerKey === key) {
													block.append($('<label>',{
														class: 'quiz__checkbox',
														append: $('<input>',{
															class: 'quiz__hidden-input',
															type: 'checkbox',
															checked: 'checked',
															val: key,
															name: 'checkbox-group'
														})
														.add($('<span>',{class:'quiz__checkbox-point'}))
														.add($('<span>',{class:'quiz__checkbox-label',text:obj.poll[key]})),
													}));
												} else {
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
											}
										}
									} else if (obj.answer.length>0) {
										for (var key in obj.poll) {
											var isChecked = false
											for (var i = 0; i < obj.answer.length; i++) {
												for (var answerKey in obj.answer[i]) {
													if (answerKey === key) {
														isChecked = true;
													}
												}
											}
											if (isChecked) {
												block.append($('<label>',{
													class: 'quiz__checkbox',
													append: $('<input>',{
														class: 'quiz__hidden-input',
														type: 'checkbox',
														checked: 'checked',
														val: key,
														name: 'checkbox-group'
													})
													.add($('<span>',{class:'quiz__checkbox-point'}))
													.add($('<span>',{class:'quiz__checkbox-label',text:obj.poll[key]})),
												}));
											} else {
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
										}
									}
								} else {
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
								}
								block.appendTo('.quiz__body');
								if (obj.textAnswer !== undefined) {
									$('.quiz__body').append($('<input>',{
										class: 'quiz__additional-field',
										type: 'text',
										placeholder: 'Вы можете дополнить свой ответ',
										val: obj.textAnswer,
									}));
								}
								initQuizCheckboxes('checkboxes');
								break;
							case 'select':
								var list = $('<ul>',{class: 'quiz__select-options-list'}),block;
								for (var key in obj.poll) {
									list.append($('<li>',{
										class: 'quiz__select-option',
										'data-value': key,
										text: obj.poll[key]
									}));
								}
								if (obj.answer !== undefined) {
									for (var answerKey in obj.answer) {
										block = $('<div>',{
											class: 'quiz__select',
											append: $('<button>',{
												class: 'quiz__select-btn',
												append: $('<span>',{text: obj.poll[answerKey]})
													.add($('<svg>',{class: 'quiz__select-btn-svg',})),
											})
											.add(list)
											.add($('<input>',{
												class: 'quiz__hidden-input',
												type: 'text',
												val: answerKey,
											})),
										});
									}
								} else {
									block = $('<div>',{
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
								}
								block.appendTo('.quiz__body');
								if (obj.textAnswer !== undefined) {
									$('.quiz__body').append($('<input>',{
										class: 'quiz__additional-field',
										type: 'text',
										placeholder: 'Вы можете дополнить свой ответ',
										val: obj.textAnswer,
									}));
								}
								initQuizSelects();
								break;
							case 'pic':
								var pictures = $('<div>',{class: 'quiz__pictures swiper-wrapper'});
								if (obj.answer !== undefined) {
									for (var key in obj.poll) {
										for (var answerKey in obj.answer) {
											if (answerKey === key) {
												pictures.append($('<label>',{
													class: 'quiz__pic swiper-slide',
													append: $('<input>',{
														class: 'quiz__hidden-input',
														type: 'radio',
														checked: 'checked',
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
											} else {
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
										} 
									}
								} else {
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
								if (obj.textAnswer !== undefined) {
									$('.quiz__body').append($('<input>',{
										class: 'quiz__additional-field',
										type: 'text',
										placeholder: 'Вы можете дополнить свой ответ',
										val: obj.textAnswer,
									}));
								}
								initQuizCheckboxes('pictures');
								initSwiper();
								break;
							case 'text':
								var block;
								if (obj.answer!==undefined) {
									block = $('<textarea>',{
										class: 'quiz__textarea',
										placeholder: 'Введите текст',
										val: obj.answer,
									});
								} else {
									block = $('<textarea>',{
										class: 'quiz__textarea',
										placeholder: 'Введите текст'
									});
								}
								block.appendTo($('.quiz__body'));
								break;
							case 'num':
								var block;
								if (obj.answer!==undefined) {
									block = $('<input>',{
										class: 'quiz__number',
										type: 'number',
										pattern:'[0-9]*',
										placeholder: 'Число',
										val: obj.answer,
									});
								} else {
									block = $('<input>',{
										class: 'quiz__number',
										type: 'number',
										pattern:'[0-9]*',
										placeholder: 'Число',
									});
								}
								block.appendTo($('.quiz__body'));
								break;
							case 'message':
								var block = $('<div>',{
									class: 'quiz__output',
									text: obj.message,
								});
								block.appendTo($('.quiz__body'));
								break;
							case 'end':
								var block = $('<div>',{
									class: 'quiz__end-btn-wrapper',
									append: $('<a>',{
										'href': obj.url,
										class: 'quiz__end-btn',
										text: obj.message,
									})
								});
								block.appendTo($('.quiz__body'));
								break;
							case 'sortable':
								var block = $('<div>',{class: 'quiz__order'});
								if (obj.answer !== undefined) {
									for (var key in obj.poll) {
										var isChecked = false;
										for (var answerKey in obj.answer) {
											if (key === answerKey) {
												isChecked = true;
											}
										}
										if (isChecked) {
											block.append($('<label>',{
												class: 'quiz__order-item',
												append: $('<input>',{
													class: 'quiz__hidden-input',
													type: 'checkbox',
													checked: 'checked',
													name: 'sortable-group',
													val: key
												})
												.add($('<span>',{
													class: 'quiz__order-item-number-part',
													append: $('<span>',{
														class: 'quiz__order-item-number',
														text: obj.answer[key]
													})
												}))
												.add($('<span>',{
													class: 'quiz__order-item-text-part',
													text: obj.poll[key]
												}))
											}));
										} else {
											block.append($('<label>',{
												class: 'quiz__order-item',
												append: $('<input>',{
													class: 'quiz__hidden-input',
													type: 'checkbox',
													name: 'sortable-group',
													val: key
												})
												.add($('<span>',{
													class: 'quiz__order-item-number-part',
													append: $('<span>',{
														class: 'quiz__order-item-number',
														text: '?'
													})
												}))
												.add($('<span>',{
													class: 'quiz__order-item-text-part',
													text: obj.poll[key]
												}))
											}));
										}
									}
								} else {
									for (var key in obj.poll) {
										block.append($('<label>',{
											class: 'quiz__order-item',
											append: $('<input>',{
												class: 'quiz__hidden-input',
												type: 'checkbox',
												name: 'sortable-group',
												val: key
											})
											.add($('<span>',{
												class: 'quiz__order-item-number-part',
												append: $('<span>',{
													class: 'quiz__order-item-number',
													text: '?'
												})
											}))
											.add($('<span>',{
												class: 'quiz__order-item-text-part',
												text: obj.poll[key]
											}))
										}));
									}
								}
								
								block.appendTo($('.quiz__body'));
								initOrder();
								break;
							case 'slider':
								var block = $('<ul>',{class: 'quiz__sliders-list'});
								if (obj.answer !== undefined) {
									for (var key in obj.poll) {
										block.append($('<li>',{
											class:'quiz__slider',
											'data-id': key,
											append: $('<h2>',{
												class: 'quiz__slider-title',
												text: obj.poll[key]
											})
											.add($('<div>',{
												class: 'quiz__slider-field-wrapper',
												append: $('<input>',{
													class: 'quiz__slider-field',
													type: 'range',
													min: '0',
													max: '10',
													val: obj.answer[key]
												})
												.add($('<div>',{class:'quiz__slider-value'}))
											}))
										}));
									}
								} else {
									for (var key in obj.poll) {
										block.append($('<li>',{
											class:'quiz__slider',
											'data-id': key,
											append: $('<h2>',{
												class: 'quiz__slider-title',
												text: obj.poll[key]
											})
											.add($('<div>',{
												class: 'quiz__slider-field-wrapper',
												append: $('<input>',{
													class: 'quiz__slider-field',
													type: 'range',
													min: '0',
													max: '10',
													val: '5'
												})
												.add($('<div>',{class:'quiz__slider-value'}))
											}))
										}));
									}
								}
								
								block.appendTo($('.quiz__body'));
								initSliders();
								break;
						}
						processLabelValue.empty().append(progressPercent+'%');
						processFieldStyle.css({width:progressPercent+'%'});

						$('.quiz__buttons').remove();
						var buttons = $('<div>',{class: 'quiz__buttons'});
						if (obj !== data.poll[data.order[0]] && obj.back === '1') {
							buttons.append(prevBtn);
						}
						if (obj.skip === '1') {
							buttons.append(skipBtn);
						}
						if (obj !== data.poll[data.order[data.order.length-1]]) {
							buttons.append(nextBtn);
						}
						if (!buttons.is(':empty')) {
							footer.append(buttons);
							initButtons();
						}
						if (obj.text !== undefined && obj.text.length>0) {
							switch(obj.type) {
								case 'checkbox':
								case 'radio':
								case 'pic':
									var inputs = $('.quiz__hidden-input');
									inputs.each(function(i,el){
										$(el).off('change.text').on('change.text',function(){
											var count = 0;
											$('.quiz__hidden-input:checked').each(function(iter,elem){
												for (var j=0;j<obj.text.length;j++) {
													if($(elem).val()===obj.text[j]) count++;
												}
											});
											if (count>0&&$('.quiz__additional-field').length===0) {
												$('.quiz__body').append($('<input>',{
													class: 'quiz__additional-field',
													type: 'text',
													placeholder: 'Вы можете дополнить свой ответ',
												}));
											} else if (count===0&&$('.quiz__additional-field').length>0) {
												$('.quiz__additional-field').remove();
											}
										});
									});
									break;
								case 'select':
									var input = $('.quiz__hidden-input');
									input.off('change.text').on('change.text', function(){
										var flag = false;
										for (var i=0;i<obj.text.length;i++) {
											if(input.val()===obj.text[i]) flag = true;
										}
										if (flag&&$('.quiz__additional-field').length===0) {
											$('.quiz__body').append($('<input>',{
												class: 'quiz__additional-field',
												type: 'text',
												placeholder: 'Вы можете дополнить свой ответ',
											}));
										} else if (!flag&&$('.quiz__additional-field').length>0) {
											$('.quiz__additional-field').remove();
										}
									});
									break;
							}
						}
						$('.quiz__body').scrollTop(0).css({
							transform: 'translateX('+(100*factor)+'px)',
							transition: 'all 0s'
						});
						setTimeout(function(){
							$('.quiz__body').css({
								transform: 'translateX(0px)',
								opacity: 1,
								transition: 'all 0.2s ease'
							});
						},100);
					},200);
				},
				sendAnswer = function() {
					var answer = {};
					answer.id_client = data.id_client;
					answer.id_poll = data.id_poll;
					answer.start = data.start;
					answer.end = Math.round(new Date() / 1000);
					answer.answers = {};
					for (var i=0;i<data.order.length;i++) {
						var q = {},
							flag = false;

						if (data.poll[data.order[i]].answer!==undefined) {
							switch (data.poll[data.order[i]].type) {
								case 'radio':
								case 'checkbox':
								case 'pic':
									if (data.poll[data.order[i]].answer.length===undefined) {
										for (var answerKey in data.poll[data.order[i]].answer) {
											q.id = answerKey;
										}
									} else if (data.poll[data.order[i]].answer.length>0) {
										q.id = [];
										for (var j=0;j<data.poll[data.order[i]].answer.length;j++) {
											for (var answerKey in data.poll[data.order[i]].answer[j]) {
												q.id.push(answerKey);
											}
										}
									}
									break;
								case 'select':
									for (var answerKey in data.poll[data.order[i]].answer) {
										q.id = answerKey;
									}
									break;
								case 'text':
								case 'num':
									q.text = data.poll[data.order[i]].answer;
									break;
								case 'sortable':
									var newArray = [];
									q.order = [];
									for (var key in data.poll[data.order[i]].answer) {
										if(data.poll[data.order[i]].answer.hasOwnProperty(key)) {
											var answerObject = {};
											answerObject[data.poll[data.order[i]].answer[key]] = key;
											newArray.push(answerObject);
										}
									}
									newArray.sort(function(a,b){
										for (var keyA in a) {
											for (var keyB in b) {
												return keyA - keyB;
											}
										}
									});
									for (var j=0;j<newArray.length;j++) {
										for (var key in newArray[j]) {
											q.order.push(newArray[j][key]);
										}
									}
									break;
								case 'slider':
									q.evaluation = {}
									for (var answerKey in data.poll[data.order[i]].answer) {
										q.evaluation[answerKey] = data.poll[data.order[i]].answer[answerKey];
									}
									break;
							}
							flag = true;
						}
						if (data.poll[data.order[i]].textAnswer!==undefined) {
							q.text = data.poll[data.order[i]].textAnswer;
							flag = true;
						}

						if (flag) {
							answer.answers[data.order[i]] = q;
						}
					}
					console.log(answer);
					console.log(JSON.stringify(answer));
				},
				renderPreviousChunk = function() {
					if (data.currentChunk >= 1) {
						data.currentChunk--;
						renderQuestion(data.poll[data.order[data.currentChunk]],'right');
					}
				},
				skipChunk = function() {
					if (data.currentChunk >= 0 && data.currentChunk < data.order.length-1) {
						data.currentChunk++;
						renderQuestion(data.poll[data.order[data.currentChunk]],'left');
						if (data.currentChunk===data.order.length-1) {
							sendAnswer();
						}
					}
				},
				renderNextChunk = function() {
					if (checkConditions(data.poll[data.order[data.currentChunk]]) && data.currentChunk < data.order.length-1) {
						addAnswers(data.poll[data.order[data.currentChunk]]);
						changeOrder(data.poll[data.order[data.currentChunk]]);
						data.currentChunk++;
						renderQuestion(data.poll[data.order[data.currentChunk]],'left');
						if (data.currentChunk===data.order.length-1) {
							sendAnswer();
						}
					} else {
						if ($('.popup-wrapper').length===0) {
							var closePopup = function () {
								$('.popup-wrapper').css({
									opacity: 0,
								});
								$('.popup').css({transform: 'translateY(100px)'});
								setTimeout(function(){
									$('.popup-wrapper').remove();
								},200);
							};
							$('body').append($('<div>', {
								class: 'popup-wrapper',
								append: $('<div>',{
									class: 'popup',
									append: $('<button>',{class: 'popup__close-btn'}).add($('<div>',{
										class: 'popup__text',
										text: 'Чтобы продолжить нужно выбрать/ввести значение или пропустить шаг.',
									}))
								}),
							}));
							setTimeout(function(){
								$('.popup-wrapper').css({opacity: 1});
								$('.popup').css({transform: 'translateY(0)'});
							},100);
							$('.popup').off('click.my').on('click.my',function(evt){
								evt.stopPropagation();
							});
							$('.popup__close-btn').off('click.my').on('click.my',closePopup);
							$('.popup-wrapper').off('click.my').on('click.my', closePopup);
						}
					}
				};
			data.currentChunk = 0;
			data.slices = [];
			data.order = [];
			data.subQuestions = [];
			for (var key in data.poll) {
				if (data.poll.hasOwnProperty(key)&&key.substr(0,1)==='p') {
					data.order.push(key);
				} else if (data.poll.hasOwnProperty(key)&&key.substr(0,1)==='r') {
					data.subQuestions.push(key);
				}
				if (data.poll[key].type === 'radio' ||
					data.poll[key].type === 'checkbox' ||
					data.poll[key].type === 'select' ||
					data.poll[key].type === 'sortable' ||
					data.poll[key].type === 'slider') {
					if (data.poll[key].random === 'true' || data.poll[key].random === true) {
						var tempArr = [];
						for (var pollKey in data.poll[key].poll) {
							var tempObj = {};
							tempObj[pollKey] = data.poll[key].poll[pollKey];
							tempArr.push(tempObj);
						}
						shuffleArr(tempArr);
						delete data.poll[key].poll;
						data.poll[key].poll = {};
						for (var i = 0; i < tempArr.length; i++) {
							for (var tempArrKey in tempArr[i]) {
								data.poll[key].poll[tempArrKey] = tempArr[i][tempArrKey];
							}
						}
					}
				}
			}
			data.order.sort(function(a,b){
				return(Number(a.substr(1)) - Number(b.substr(1)));
			});

			renderQuestion(data.poll[data.order[data.currentChunk]]);
			initButtons();
			


			// 
			// Конец работы с JSON
			// 
		}).fail(function(){
			alert('JSON не загрузился');
		});
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
					input.trigger('change');
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