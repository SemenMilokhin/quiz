import $ from 'jquery/dist/jquery.min.js';
window.$ = $;
window.jQuery = $;

var poll = {},
	appData = {
		order: [],
		currentChunk: 0
	},
	mainSelectConfig = {
	defaultLabel: 'Выберите тип задаваемого вопроса',
	options: [{
		slug: 'radio',
		text: 'радио с 1 ответом'
	},
	{
		slug: 'checkbox',
		text: 'чекбокс с множественным ответом'
	},
	{
		slug: 'num',
		text: 'вопрос с вводом цифр'
	},
	{
		slug: 'select',
		text: 'выпадающий список'
	},
	{
		slug: 'text',
		text: 'текстовое поле'
	},
	{
		slug: 'message',
		text: 'вывод сообщения'
	},
	{
		slug: 'pic',
		text: 'вопрос с картинкой'
	},
	{
		slug: 'sortable',
		text: 'расстановка приоритетов'
	},
	{
		slug: 'slider',
		text: 'шкальный вопрос с «бегунком»'
	},
	{
		slug: 'end',
		text: 'конец опроса'
	}]
};

$(document).ready(function(){
	var quizBody = $('.quiz__body');
	init();

	function sendResult(){
		$.ajax({
			url: '',
			type: "POST",
			data: JSON.stringify(poll),
			cache: false,
			timeout: 30000,
			dataType: 'json',
			success: function(){
				generatePopup('Успешно!');
				console.log(poll);
				console.log(JSON.stringify(poll));
			},
			error: function(){
				generatePopup('Ошибка!');
				console.log(poll);
				console.log(JSON.stringify(poll));
			}
		});
	}
	function initMainSelect() {
		var select = $('#main-select');

		select.append($('<button>',{
			class: 'quiz__select-btn',
			append: $('<span>',{
				class: 'quiz__select-field',
				text: mainSelectConfig.defaultLabel
			})
			.add('<svg>',{
				class: 'quiz__select-btn-svg'
			})
		})
		.add('<ul>',{
			class: 'quiz__select-options-list'
		})
		.add('<input>',{
			class: 'quiz__hidden-input',
			name: 'type',
			type: 'text'
		}));

		var selectBtn = select.find('.quiz__select-btn'),
			selectField = selectBtn.find('.quiz__select-field'),
			selectOptionsList = select.find('.quiz__select-options-list'),
			selectHiddenInput = select.find('.quiz__hidden-input');

		var optionsSettings = mainSelectConfig.options;

		for (var i = 0; i < optionsSettings.length; i++) {
			selectOptionsList.append($('<li>',{
				class: 'quiz__select-option',
				'data-value': optionsSettings[i].slug,
				text: ' – '+ optionsSettings[i].text,
				prepend: $('<span>',{
					class: 'quiz__select-accent',
					text: optionsSettings[i].slug
				})
			}));
		}

		var options = selectOptionsList.find('.quiz__select-option'),
			lastValue = '',
			closeSelect = function() {
				select.removeClass('quiz__select_opened');
			},
			openSelect = function() {
				select.addClass('quiz__select_opened');
			};

		options.each(function(i,el) {
			$(el).on('click', function() {
				var value = $(el).attr('data-value');
				selectHiddenInput.val(value);
				selectHiddenInput.trigger('change');
				closeSelect();
			})
		});

		selectHiddenInput.on('change', function(){
			var value = selectHiddenInput.val(),
				slug,text;

			if (value!=='') {
				selectField.empty();
				lastValue = '';
				for (var i = 0; i < optionsSettings.length; i++) {
					if (value === optionsSettings[i].slug) {
						slug = optionsSettings[i].slug;
						text = optionsSettings[i].text;
						break;
					}
				}
				selectField.text(' – '+text).prepend($('<span>',{
					class: 'quiz__select-accent',
					text: slug
				}));
			} else {
				selectField.empty();
				selectField.text(mainSelectConfig.defaultLabel);
			}

			if (lastValue!==value && value!=='') {
				quizBody.empty();
				lastValue = value;
				renderFields(value);
			}
		});

		selectBtn.on('click', function(evt){
			evt.preventDefault();
			if (!select.hasClass('quiz__select_opened')) {
				openSelect();
			} else {
				closeSelect();
			};
		});

		$(document).on('click', function(evt){
			if (!select.is(evt.target) && select.has(evt.target).length === 0) {
				closeSelect();
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

						var inputs = $(el).find('.quiz__hidden-input');
						inputs.each(function(iter,elem){
							if ($(elem).prop('checked')) {
								$(elem).parent('label').addClass($(elem).parent('label')[0].classList[0]+'_checked');
							}

							$(elem).off('change.my').on('change.my', function(){
								var inputParent   = $(elem).parent('label'),
									parentClass   = inputParent[0].classList[0],
									checkedClass  = parentClass+'_checked';

								if (parentClass==='quiz__radio-label') {
									uncheck(inputs,iter);
								}

								if ($(elem).prop('checked')) {
									inputParent.addClass(checkedClass);
								} else {
									inputParent.removeClass(checkedClass);
								}
							});
						});
						
					});
				}
			};
		iterate($('.quiz__'+classPart));
	}
	function initAnswers() {
		var answersLists = $('.quiz__answers-list'),
			addAnswer = function(block,firstPlaceholder,lastPlaceholder) {
				block.append($('<li>',{
					class: 'quiz__answer',
					append: $('<input>',{
						class: 'quiz__field quiz__field_first',
						type: 'text',
						placeholder: firstPlaceholder
					}).add($('<input>',{
						class: 'quiz__field quiz__field_last',
						type: 'text',
						placeholder: lastPlaceholder
					})).add($('<button>',{
						class: 'quiz__answer-btn'
					}))
				}));
			},
			removeAnswer = function(block,quale = -1) {
				block.find('.quiz__answer').eq(quale).remove();
			},
			initAnswerListeners = function(list,object,children,btn,firstPlaceholder,lastPlaceholder) {
				children.off('keyup.my').on('keyup.my', function() {
					if (children.eq(0).val()==='' && children.eq(1).val()==='') {
						if (object.next('.quiz__answer').length !== 0) {
							object.remove();
						}
					}
					if (children.eq(0).val()!=='' && children.eq(1).val()!=='') {
						if (object.next('.quiz__answer').length === 0) {
							addAnswer(list,firstPlaceholder,lastPlaceholder);

							var newAnswer = list.find('.quiz__answer').eq(-1),
								newAnswerChildren = newAnswer.children('.quiz__field'),
								newCloseBtn = newAnswer.find('.quiz__answer-btn');

							initAnswerListeners(list,newAnswer,newAnswerChildren,newCloseBtn,firstPlaceholder,lastPlaceholder);
						}
					}
				});
				btn.off('click.my').on('click.my', function() {
					if (object.next('.quiz__answer').length === 0) {
						addAnswer(list,firstPlaceholder,lastPlaceholder);

						var newAnswer = list.find('.quiz__answer').eq(-1),
							newAnswerChildren = newAnswer.children('.quiz__field'),
							newCloseBtn = newAnswer.find('.quiz__answer-btn');

						initAnswerListeners(list,newAnswer,newAnswerChildren,newCloseBtn,firstPlaceholder,lastPlaceholder);
					} else {
						object.remove();
					}
					
				});
			};

		if (answersLists.length>0) {
			answersLists.each(function(i,el){
				var fp = $(el).find('.quiz__field_first').eq(0).prop('placeholder'),
					lp = $(el).find('.quiz__field_last').eq(0).prop('placeholder');
				$(el).find('.quiz__answer').each(function(iter,elem){
					var answerChildren = $(elem).children('.quiz__field'),
						answerBtn = $(elem).find('.quiz__answer-btn');

					initAnswerListeners($(el),$(elem),answerChildren,answerBtn,fp,lp);
				});
			});
		}
	}
	function renderFields(type) {
		var answersBlock = $('<p>',{
				class: 'quiz__label',
				text: 'Варианты ответов'
			})
			.add($('<ul>',{
				class: 'quiz__answers-list',
				'data-name': 'poll',
				append: $('<li>',{
					class: 'quiz__answer',
					append: $('<input>',{
						class: 'quiz__field quiz__field_first',
						type: 'text',
						placeholder: 'цифра ответа'
					})
					.add($('<input>',{
						class: 'quiz__field quiz__field_last',
						type: 'text',
						placeholder: 'текст ответа'
					}))
					.add($('<button>',{
						class: 'quiz__answer-btn'
					}))
				})
			})),
			skipBlock = $('<div>',{
				class: 'quiz__column',
				append: $('<p>',{
					class: 'quiz__label',
					text: 'Можно ли пропустить вопрос?'
				})
				.add($('<div>',{
					class: 'quiz__radio-btns',
					append: $('<label>',{
						class: 'quiz__radio-label',
						text: 'Да',
						append: $('<input>',{
							type: 'radio',
							name: 'question-skip',
							class: 'quiz__hidden-input',
							val: 'y'
						})
					})
					.add($('<label>',{
						class: 'quiz__radio-label',
						text: 'Нет',
						append: $('<input>',{
							type: 'radio',
							name: 'question-skip',
							class: 'quiz__hidden-input',
							val: 'n',
							checked: 'checked'
						})
					}))
				}))
			}),
			backBlock = $('<div>',{
				class: 'quiz__column',
				append: $('<p>',{
					class: 'quiz__label',
					text: 'Можно ли вернуться на шаг назад?'
				})
				.add($('<div>',{
					class: 'quiz__radio-btns',
					append: $('<label>',{
						class: 'quiz__radio-label',
						text: 'Да',
						append: $('<input>',{
							type: 'radio',
							name: 'question-back',
							class: 'quiz__hidden-input',
							val: 'y'
						})
					})
					.add($('<label>',{
						class: 'quiz__radio-label',
						text: 'Нет',
						append: $('<input>',{
							type: 'radio',
							name: 'question-back',
							class: 'quiz__hidden-input',
							val: 'n',
							checked: 'checked'
						})
					}))
				}))
			});
		quizBody.append($('<div>',{
			class: 'quiz__row',
			append: $('<div>',{
				class: 'quiz__column',
				append: $('<p>',{
					class: 'quiz__label',
					text: 'Тип вопроса'
				})
				.add('<div>',{
					class: 'quiz__radio-btns',
					append: $('<label>',{
						class: 'quiz__radio-label',
						text: 'p',
						append: $('<input>',{
							class: 'quiz__hidden-input',
							type: 'radio',
							name: 'question-type',
							value: 'p',
							checked: 'checked'
						})
					})
					.add('<label>',{
						class: 'quiz__radio-label',
						text: 'r',
						append: $('<input>',{
							class: 'quiz__hidden-input',
							type: 'radio',
							name: 'question-type',
							value: 'r'
						})
					})
				})
			})
			.add('<div>',{
				class: 'quiz__column quiz__column_stretchy',
				append: $('<p>',{
					class: 'quiz__label',
					text: 'Номер вопроса'
				})
				.add('<input>',{
					class: 'quiz__field',
					type: 'text',
					name: 'question-number'
				})
			})
		})
		.add($('<p>',{
			class: 'quiz__label',
			text: 'Заголовок вопроса'
		}))
		.add($('<input>',{
			class: 'quiz__field',
			type: 'text',
			name: 'question-title',
			placeholder: 'title'
		}))
		.add($('<p>',{
			class: 'quiz__label',
			text: 'Описание вопроса'
		}))
		.add($('<input>',{
			class: 'quiz__field',
			type: 'text',
			name: 'question-description',
			placeholder: 'description'
		})));
		switch (type) {
			case 'radio': 
			case 'checkbox': 
			case 'select': 
				quizBody.append(answersBlock.add($('<div>',{
					class: 'quiz__row quiz__row_sb',
					'data-name': 'radio-btns',
					append: skipBlock.add(backBlock)
					.add($('<div>',{
						class: 'quiz__column',
						append: $('<p>',{
							class: 'quiz__label',
							text: 'Перемешать варианты ответов?'
						})
						.add($('<div>',{
							class: 'quiz__radio-btns',
							append: $('<label>',{
								class: 'quiz__radio-label',
								text: 'Да',
								append: $('<input>',{
									type: 'radio',
									name: 'question-random',
									class: 'quiz__hidden-input',
									val: 'y'
								})
							})
							.add($('<label>',{
								class: 'quiz__radio-label',
								text: 'Нет',
								append: $('<input>',{
									type: 'radio',
									name: 'question-random',
									class: 'quiz__hidden-input',
									val: 'n',
									checked: 'checked'
								})
							}))
						}))
					}))
				}))
				.add($('<p>',{
					class: 'quiz__label',
					text: 'ID ответов для которых нужно дополнительное текстовое поле'
				}))
				.add($('<input>',{
					class: 'quiz__field',
					type: 'text',
					name: 'question-text'
				})));
				initAnswers();
				break;
			case 'sortable': 
			case 'slider': 
				quizBody.append(answersBlock.add($('<div>',{
					class: 'quiz__row quiz__row_sb',
					'data-name': 'radio-btns',
					append: skipBlock.add(backBlock)
					.add($('<div>',{
						class: 'quiz__column',
						append: $('<p>',{
							class: 'quiz__label',
							text: 'Перемешать варианты ответов?'
						})
						.add($('<div>',{
							class: 'quiz__radio-btns',
							append: $('<label>',{
								class: 'quiz__radio-label',
								text: 'Да',
								append: $('<input>',{
									type: 'radio',
									name: 'question-random',
									class: 'quiz__hidden-input',
									val: 'y'
								})
							})
							.add($('<label>',{
								class: 'quiz__radio-label',
								text: 'Нет',
								append: $('<input>',{
									type: 'radio',
									name: 'question-random',
									class: 'quiz__hidden-input',
									val: 'n',
									checked: 'checked'
								})
							}))
						}))
					}))
				})));
				initAnswers();
				break;
			case 'num':
				quizBody.append($('<p>',{
					class: 'quiz__label',
					text: 'Правила ответов'
				})
				.add($('<ul>',{
					class: 'quiz__answers-list',
					'data-name': 'rule',
					append: $('<li>',{
						class: 'quiz__answer',
						append: $('<input>',{
							class: 'quiz__field quiz__field_first',
							type: 'text',
							placeholder: 'число'
						})
						.add($('<input>',{
							class: 'quiz__field quiz__field_last',
							type: 'text',
							placeholder: 'id вопроса'
						}))
						.add($('<button>',{
							class: 'quiz__answer-btn'
						}))
					})
				}))
				.add($('<div>',{
					class: 'quiz__row quiz__row_sb',
					'data-name': 'radio-btns',
					append: skipBlock.add(backBlock)
				})));
				initAnswers();
				break;
			case 'text':
				quizBody.append($('<div>',{
					class: 'quiz__row quiz__row_sb',
					'data-name': 'radio-btns',
					append: skipBlock.add(backBlock)
				}));
				break;
			case 'message':
				quizBody.append($('<p>',{
					class: 'quiz__label',
					text: 'Текст сообщения'
				})
				.add($('<input>',{
					class: 'quiz__field',
					type: 'text',
					name: 'question-message',
					placeholder: 'message'
				}))
				.add($('<div>',{
					class: 'quiz__row quiz__row_sb',
					'data-name': 'radio-btns',
					append: skipBlock.add(backBlock)
				})));
				break;
			case 'pic':
				quizBody.append(answersBlock
					.add($('<p>',{
						class: 'quiz__label',
						text: 'Картинки ответов'
					})
					.add($('<ul>',{
						class: 'quiz__answers-list',
						'data-name': 'pic',
						append: $('<li>',{
							class: 'quiz__answer',
							append: $('<input>',{
								class: 'quiz__field quiz__field_first',
								type: 'text',
								placeholder: 'цифра ответа'
							})
							.add($('<input>',{
								class: 'quiz__field quiz__field_last',
								type: 'text',
								placeholder: 'ссылка на картинку ответа'
							}))
							.add($('<button>',{
								class: 'quiz__answer-btn'
							}))
						})
					}))
					.add($('<div>',{
						class: 'quiz__row quiz__row_sb',
						'data-name': 'radio-btns',
						append: skipBlock.add(backBlock)
					}))
					)
				);
				initAnswers();
				break;
			case 'end':
				quizBody.append($('<p>',{
					class: 'quiz__label',
					text: 'Текст кнопки'
				})
				.add($('<input>',{
					class: 'quiz__field',
					type: 'text',
					name: 'question-message',
					placeholder: 'message'
				}))
				.add($('<p>',{
					class: 'quiz__label',
					text: 'Ссылка кнопки'
				})
				.add($('<input>',{
					class: 'quiz__field',
					type: 'text',
					name: 'question-url',
					placeholder: 'url'
				})))
				.add($('<div>',{
					class: 'quiz__row quiz__row_sb',
					'data-name': 'radio-btns',
					append: skipBlock.add(backBlock)
				})));
				break;
		}
		initQuizCheckboxes('radio-btns');
	}
	function formPart() {
		var tempObj = {},
			workData = {},
			type = $('input[name="type"]').val();

		workData.status = 'success';
		workData.errors = [];

		if (type!==''&&type!==undefined) {
			var questionTypeInput = quizBody.find('input[name="question-type"]:checked'),
				questionNumber = quizBody.find('input[name="question-number"]').val().replace(/\D/g, ''),
				questionType;

			if (questionTypeInput.length!==1) {
				workData.status = 'error';
				workData.errors.push('Тип вопроса выбран с ошибкой, или не выбран вовсе');
			} else {
				questionType = questionTypeInput.val();
			}

			if (questionNumber.length<1) {
				workData.status = 'error';
				workData.errors.push('Номер вопроса указан неверно');
			}

			tempObj.type = type;
			tempObj.title = quizBody.find('input[name="question-title"]').val();
			tempObj.description = quizBody.find('input[name="question-description"]').val();


			switch (type) {
				case 'radio':
				case 'checkbox':
				case 'select':
					var questionsList = quizBody.find('.quiz__answers-list[data-name="poll"]'),
						questions = questionsList.find('.quiz__answer'),
						tempPoll = {},
						tempText = [],

						radioBtns = quizBody.find('div[data-name="radio-btns"]'),
						skip = radioBtns.find('input[name="question-skip"]:checked'),
						back = radioBtns.find('input[name="question-back"]:checked'),
						random = radioBtns.find('input[name="question-random"]:checked'),

						text = quizBody.find('input[name="question-text"]').val();

					questions.each(function(i,el){
						var firstVal = $(el).find('.quiz__field_first').val().replace(/\D/g, ''),
							lastVal = $(el).find('.quiz__field_last').val();
						if (firstVal!==''&&lastVal!=='') {
							tempPoll['id'+firstVal] = lastVal;
						}
					});

					var counter = 0;
					for (var key in tempPoll) {
						counter++;
					}
					if (counter === 0) {
						workData.status = 'error';
						workData.errors.push('Должен быть хотя бы один вариант ответа');
					} else {
						tempObj.poll = tempPoll;
					}

					if (skip.length!==1) {
						workData.status = 'error';
						workData.errors.push('Возможность пропустить вопрос выбрана с ошибкой, или не выбрана вовсе');
					} else {
						if (skip.val()==='y') {tempObj.skip = '1';} else {tempObj.skip = '0';}
					}
					if (back.length!==1) {
						workData.status = 'error';
						workData.errors.push('Возможность вернуться назад выбрана с ошибкой, или не выбрана вовсе');
					} else {
						if (back.val()==='y') {tempObj.back = '1';} else {tempObj.back = '0';}
					}
					if (random.length!==1) {
						workData.status = 'error';
						workData.errors.push('Возможность перемешать варианты ответов выбрана с ошибкой, или не выбрана вовсе');
					} else {
						if (random.val()==='y') {tempObj.random = 'true';} else {tempObj.random = 'false';}
					}
					
					var tempArr = text.match(/id\d{1,}/g);
					if (tempArr !== null) {
						tempText = tempArr;
					}
					tempObj.text = tempText;
					break;
				case 'sortable':
				case 'slider':
					var questionsList = quizBody.find('.quiz__answers-list[data-name="poll"]'),
						questions = questionsList.find('.quiz__answer'),
						tempPoll = {},
						tempText = [],

						radioBtns = quizBody.find('div[data-name="radio-btns"]'),
						skip = radioBtns.find('input[name="question-skip"]:checked'),
						back = radioBtns.find('input[name="question-back"]:checked'),
						random = radioBtns.find('input[name="question-random"]:checked');

					questions.each(function(i,el){
						var firstVal = $(el).find('.quiz__field_first').val().replace(/\D/g, ''),
							lastVal = $(el).find('.quiz__field_last').val();
						if (firstVal!==''&&lastVal!=='') {
							tempPoll['id'+firstVal] = lastVal;
						}
					});

					var counter = 0;
					for (var key in tempPoll) {
						counter++;
					}
					if (counter === 0) {
						workData.status = 'error';
						workData.errors.push('Должен быть хотя бы один вариант ответа');
					} else {
						tempObj.poll = tempPoll;
					}

					if (skip.length!==1) {
						workData.status = 'error';
						workData.errors.push('Возможность пропустить вопрос выбрана с ошибкой, или не выбрана вовсе');
					} else {
						if (skip.val()==='y') {tempObj.skip = '1';} else {tempObj.skip = '0';}
					}
					if (back.length!==1) {
						workData.status = 'error';
						workData.errors.push('Возможность вернуться назад выбрана с ошибкой, или не выбрана вовсе');
					} else {
						if (back.val()==='y') {tempObj.back = '1';} else {tempObj.back = '0';}
					}
					if (random.length!==1) {
						workData.status = 'error';
						workData.errors.push('Возможность перемешать варианты ответов выбрана с ошибкой, или не выбрана вовсе');
					} else {
						if (random.val()==='y') {tempObj.random = 'true';} else {tempObj.random = 'false';}
					}
					break;
				case 'num':
					var rulesList = quizBody.find('.quiz__answers-list[data-name="rule"]'),
						rules = rulesList.find('.quiz__answer'),
						tempRule = {},

						radioBtns = quizBody.find('div[data-name="radio-btns"]'),
						skip = radioBtns.find('input[name="question-skip"]:checked'),
						back = radioBtns.find('input[name="question-back"]:checked');

					rules.each(function(i,el){
						var firstVal = $(el).find('.quiz__field_first').val().replace(/\D/g, ''),
							lastVal = $(el).find('.quiz__field_last').val().match(/p\d{1,}/g);
						if (firstVal!==''&&lastVal!==null) {
							tempRule[firstVal] = lastVal[0];
						}
					});

					var counter = 0;
					for (var key in tempRule) {
						counter++;
					}
					if (counter === 0) {
						workData.status = 'error';
						workData.errors.push('Должно быть хотя бы одно правило');
					} else {
						tempObj.rule = tempRule;
					}
					
					if (skip.length!==1) {
						workData.status = 'error';
						workData.errors.push('Возможность пропустить вопрос выбрана с ошибкой, или не выбрана вовсе');
					} else {
						if (skip.val()==='y') {tempObj.skip = '1';} else {tempObj.skip = '0';}
					}
					if (back.length!==1) {
						workData.status = 'error';
						workData.errors.push('Возможность вернуться назад выбрана с ошибкой, или не выбрана вовсе');
					} else {
						if (back.val()==='y') {tempObj.back = '1';} else {tempObj.back = '0';}
					}
					break;
				case 'text':
					var radioBtns = quizBody.find('div[data-name="radio-btns"]'),
						skip = radioBtns.find('input[name="question-skip"]:checked'),
						back = radioBtns.find('input[name="question-back"]:checked');

					if (skip.length!==1) {
						workData.status = 'error';
						workData.errors.push('Возможность пропустить вопрос выбрана с ошибкой, или не выбрана вовсе');
					} else {
						if (skip.val()==='y') {tempObj.skip = '1';} else {tempObj.skip = '0';}
					}
					if (back.length!==1) {
						workData.status = 'error';
						workData.errors.push('Возможность вернуться назад выбрана с ошибкой, или не выбрана вовсе');
					} else {
						if (back.val()==='y') {tempObj.back = '1';} else {tempObj.back = '0';}
					}
					break;
				case 'message':
					var message = quizBody.find('input[name="question-message"]').val(),

						radioBtns = quizBody.find('div[data-name="radio-btns"]'),
						skip = radioBtns.find('input[name="question-skip"]:checked'),
						back = radioBtns.find('input[name="question-back"]:checked');

					if (message === '') {
						workData.status = 'error';
						workData.errors.push('Сообщение должно быть непустым');
					} else {
						tempObj.message = message;
					}

					if (skip.length!==1) {
						workData.status = 'error';
						workData.errors.push('Возможность пропустить вопрос выбрана с ошибкой, или не выбрана вовсе');
					} else {
						if (skip.val()==='y') {tempObj.skip = '1';} else {tempObj.skip = '0';}
					}
					if (back.length!==1) {
						workData.status = 'error';
						workData.errors.push('Возможность вернуться назад выбрана с ошибкой, или не выбрана вовсе');
					} else {
						if (back.val()==='y') {tempObj.back = '1';} else {tempObj.back = '0';}
					}
					break;
				case 'pic':
					var questionsList = quizBody.find('.quiz__answers-list[data-name="poll"]'),
						questions = questionsList.find('.quiz__answer'),
						picsList = quizBody.find('.quiz__answers-list[data-name="pic"]'),
						pics = picsList.find('.quiz__answer'),
						tempPoll = {},
						tempPic = {},

						radioBtns = quizBody.find('div[data-name="radio-btns"]'),
						skip = radioBtns.find('input[name="question-skip"]:checked'),
						back = radioBtns.find('input[name="question-back"]:checked');

					questions.each(function(i,el){
						var firstVal = $(el).find('.quiz__field_first').val().replace(/\D/g, ''),
							lastVal = $(el).find('.quiz__field_last').val();
						if (firstVal!==''&&lastVal!=='') {
							tempPoll['id'+firstVal] = lastVal;
						}
					});
					pics.each(function(i,el){
						var firstVal = $(el).find('.quiz__field_first').val(),
							lastVal = $(el).find('.quiz__field_last').val();
						if (firstVal!==''&&lastVal!=='') {
							tempPic['id'+firstVal] = lastVal;
						}
					});

					var qCounter = 0;
					for (var key in tempPoll) {
						qCounter++;
					}
					if (qCounter === 0) {
						workData.status = 'error';
						workData.errors.push('Должен быть хотя бы один вариант ответа');
					} else {
						tempObj.poll = tempPoll;
					}

					tempObj.pic = tempPic;

					if (skip.length!==1) {
						workData.status = 'error';
						workData.errors.push('Возможность пропустить вопрос выбрана с ошибкой, или не выбрана вовсе');
					} else {
						if (skip.val()==='y') {tempObj.skip = '1';} else {tempObj.skip = '0';}
					}
					if (back.length!==1) {
						workData.status = 'error';
						workData.errors.push('Возможность вернуться назад выбрана с ошибкой, или не выбрана вовсе');
					} else {
						if (back.val()==='y') {tempObj.back = '1';} else {tempObj.back = '0';}
					}
					break;
				case 'end':
					var message = quizBody.find('input[name="question-message"]').val(),
						url = quizBody.find('input[name="question-url"]').val(),

						radioBtns = quizBody.find('div[data-name="radio-btns"]'),
						skip = radioBtns.find('input[name="question-skip"]:checked'),
						back = radioBtns.find('input[name="question-back"]:checked');

					if (message === '') {
						workData.status = 'error';
						workData.errors.push('Поле с сообщением не должно быть пустым');
					} else {
						tempObj.message = message;
					}

					if (url === '') {
						workData.status = 'error';
						workData.errors.push('Поле с ссылкой не должно быть пустым');
					} else {
						tempObj.url = url;
					}

					if (skip.length!==1) {
						workData.status = 'error';
						workData.errors.push('Возможность пропустить вопрос выбрана с ошибкой, или не выбрана вовсе');
					} else {
						if (skip.val()==='y') {tempObj.skip = '1';} else {tempObj.skip = '0';}
					}
					if (back.length!==1) {
						workData.status = 'error';
						workData.errors.push('Возможность вернуться назад выбрана с ошибкой, или не выбрана вовсе');
					} else {
						if (back.val()==='y') {tempObj.back = '1';} else {tempObj.back = '0';}
					}
					break;
			}
		} else {
			workData.status = 'empty';
		}

		if (questionType!==undefined&&questionNumber!==undefined) {
			workData.slug = questionType+questionNumber;
		}

		for (var i=0; i<appData.order.length; i++) {
			if (appData.order[i]===workData.slug&&appData.order[appData.currentChunk]!==appData.order[i]) {
				workData.status = 'error';
				workData.errors.push('Вопрос '+workData.slug+' уже был Вами сформирован');
				break;
			}
		}

		if (workData.status === 'success') {
			if (appData.order[appData.currentChunk]!==undefined) {
				delete poll[appData.order[appData.currentChunk]];
				poll[workData.slug] = tempObj;
				appData.order.splice(appData.currentChunk,1,workData.slug);
			} else {
				poll[workData.slug] = tempObj;
				appData.order.push(workData.slug);
			}
		}
		
		return workData;
	}
	function fillFields() {
		var questionSlug = appData.order[appData.currentChunk],
			questionType = questionSlug.substr(0,1),
			questionNumber = questionSlug.substr(1),
			chunkData = poll[questionSlug];

		if (questionType==='r') {
			$('input[name="question-type"][value="r"]').prop('checked', 'checked').trigger('change');
		} else if (questionType==='p') {
			$('input[name="question-type"][value="p"]').prop('checked', 'checked').trigger('change');
		}

		$('input[name="question-number"]').val(questionNumber);
		$('input[name="question-title"]').val(chunkData.title);
		$('input[name="question-description"]').val(chunkData.description);

		switch(chunkData.type) {
			case 'radio':
			case 'checkbox':
			case 'select':
				var answers = $('ul[data-name="poll"]'),
					generatedAnswer = answers.find('.quiz__answer'),
					generatedAnswerFirstPlaceholder = generatedAnswer.find('.quiz__field_first').prop('placeholder'),
					generatedAnswerLastPlaceholder = generatedAnswer.find('.quiz__field_last').prop('placeholder');

				for (var key in chunkData.poll) {
					generatedAnswer.before($('<li>',{
						class: 'quiz__answer',
						append: $('<input>',{
							class: 'quiz__field quiz__field_first',
							type: 'text',
							placeholder: generatedAnswerFirstPlaceholder,
							val: key.substr(2)
						})
						.add('<input>',{
							class: 'quiz__field quiz__field_last',
							type: 'text',
							placeholder: generatedAnswerLastPlaceholder,
							val: chunkData.poll[key]
						})
						.add('<button>',{
							class: 'quiz__answer-btn'
						})
					}));
				}
				initAnswers();

				var skip = chunkData.skip,
					back = chunkData.back,
					random = chunkData.random;

				if (skip==='1') {
					$('input[name="question-skip"][value="y"]').prop('checked', 'checked').trigger('change');
				} else if (skip==='0') {
					$('input[name="question-skip"][value="n"]').prop('checked', 'checked').trigger('change');
				}

				if (back==='1') {
					$('input[name="question-back"][value="y"]').prop('checked', 'checked').trigger('change');
				} else if (back==='0') {
					$('input[name="question-back"][value="n"]').prop('checked', 'checked').trigger('change');
				}

				if (random==='true') {
					$('input[name="question-random"][value="y"]').prop('checked', 'checked').trigger('change');
				} else if (random==='false') {
					$('input[name="question-random"][value="n"]').prop('checked', 'checked').trigger('change');
				}

				var textArray = chunkData.text,
					textString = '';

				for (var i=0;i<textArray.length;i++) {
					if (i!==textArray.length-1) {
						textString+=textArray[i]+', ';
					} else {
						textString+=textArray[i];
					}
				}

				$('input[name="question-text"]').val(textString);
				break;
			case 'sortable':
			case 'slider':
				var answers = $('ul[data-name="poll"]'),
					generatedAnswer = answers.find('.quiz__answer'),
					generatedAnswerFirstPlaceholder = generatedAnswer.find('.quiz__field_first').prop('placeholder'),
					generatedAnswerLastPlaceholder = generatedAnswer.find('.quiz__field_last').prop('placeholder');

				for (var key in chunkData.poll) {
					generatedAnswer.before($('<li>',{
						class: 'quiz__answer',
						append: $('<input>',{
							class: 'quiz__field quiz__field_first',
							type: 'text',
							placeholder: generatedAnswerFirstPlaceholder,
							val: key.substr(2)
						})
						.add('<input>',{
							class: 'quiz__field quiz__field_last',
							type: 'text',
							placeholder: generatedAnswerLastPlaceholder,
							val: chunkData.poll[key]
						})
						.add('<button>',{
							class: 'quiz__answer-btn'
						})
					}));
				}
				initAnswers();

				var skip = chunkData.skip,
					back = chunkData.back,
					random = chunkData.random;

				if (skip==='1') {
					$('input[name="question-skip"][value="y"]').prop('checked', 'checked').trigger('change');
				} else if (skip==='0') {
					$('input[name="question-skip"][value="n"]').prop('checked', 'checked').trigger('change');
				}

				if (back==='1') {
					$('input[name="question-back"][value="y"]').prop('checked', 'checked').trigger('change');
				} else if (back==='0') {
					$('input[name="question-back"][value="n"]').prop('checked', 'checked').trigger('change');
				}

				if (random==='true') {
					$('input[name="question-random"][value="y"]').prop('checked', 'checked').trigger('change');
				} else if (random==='false') {
					$('input[name="question-random"][value="n"]').prop('checked', 'checked').trigger('change');
				}
				break;
			case 'num':
				var rules = $('ul[data-name="rule"]'),
					generatedAnswer = rules.find('.quiz__answer'),
					generatedAnswerFirstPlaceholder = generatedAnswer.find('.quiz__field_first').prop('placeholder'),
					generatedAnswerLastPlaceholder = generatedAnswer.find('.quiz__field_last').prop('placeholder');

				for (var key in chunkData.rule) {
					generatedAnswer.before($('<li>',{
						class: 'quiz__answer',
						append: $('<input>',{
							class: 'quiz__field quiz__field_first',
							type: 'text',
							placeholder: generatedAnswerFirstPlaceholder,
							val: key
						})
						.add('<input>',{
							class: 'quiz__field quiz__field_last',
							type: 'text',
							placeholder: generatedAnswerLastPlaceholder,
							val: chunkData.rule[key]
						})
						.add('<button>',{
							class: 'quiz__answer-btn'
						})
					}));
				}
				initAnswers();

				var skip = chunkData.skip,
					back = chunkData.back;

				if (skip==='1') {
					$('input[name="question-skip"][value="y"]').prop('checked', 'checked').trigger('change');
				} else if (skip==='0') {
					$('input[name="question-skip"][value="n"]').prop('checked', 'checked').trigger('change');
				}

				if (back==='1') {
					$('input[name="question-back"][value="y"]').prop('checked', 'checked').trigger('change');
				} else if (back==='0') {
					$('input[name="question-back"][value="n"]').prop('checked', 'checked').trigger('change');
				}
				break;
			case 'text':
				var skip = chunkData.skip,
					back = chunkData.back;

				if (skip==='1') {
					$('input[name="question-skip"][value="y"]').prop('checked', 'checked').trigger('change');
				} else if (skip==='0') {
					$('input[name="question-skip"][value="n"]').prop('checked', 'checked').trigger('change');
				}

				if (back==='1') {
					$('input[name="question-back"][value="y"]').prop('checked', 'checked').trigger('change');
				} else if (back==='0') {
					$('input[name="question-back"][value="n"]').prop('checked', 'checked').trigger('change');
				}
				break;
			case 'message':
				$('input[name="question-message"]').val(chunkData.message);
				var skip = chunkData.skip,
					back = chunkData.back;

				if (skip==='1') {
					$('input[name="question-skip"][value="y"]').prop('checked', 'checked').trigger('change');
				} else if (skip==='0') {
					$('input[name="question-skip"][value="n"]').prop('checked', 'checked').trigger('change');
				}

				if (back==='1') {
					$('input[name="question-back"][value="y"]').prop('checked', 'checked').trigger('change');
				} else if (back==='0') {
					$('input[name="question-back"][value="n"]').prop('checked', 'checked').trigger('change');
				}
				break;
			case 'pic':
				var answers = $('ul[data-name="poll"]'),
					generatedAnswer = answers.find('.quiz__answer'),
					generatedAnswerFirstPlaceholder = generatedAnswer.find('.quiz__field_first').prop('placeholder'),
					generatedAnswerLastPlaceholder = generatedAnswer.find('.quiz__field_last').prop('placeholder'),
					pics = $('ul[data-name="pic"]'),
					generatedPic = pics.find('.quiz__answer'),
					generatedPicFirstPlaceholder = generatedPic.find('.quiz__field_first').prop('placeholder'),
					generatedPicLastPlaceholder = generatedPic.find('.quiz__field_last').prop('placeholder');

				for (var key in chunkData.poll) {
					generatedAnswer.before($('<li>',{
						class: 'quiz__answer',
						append: $('<input>',{
							class: 'quiz__field quiz__field_first',
							type: 'text',
							placeholder: generatedAnswerFirstPlaceholder,
							val: key.substr(2)
						})
						.add('<input>',{
							class: 'quiz__field quiz__field_last',
							type: 'text',
							placeholder: generatedAnswerLastPlaceholder,
							val: chunkData.poll[key]
						})
						.add('<button>',{
							class: 'quiz__answer-btn'
						})
					}));
				}
				for (var key in chunkData.pic) {
					generatedPic.before($('<li>',{
						class: 'quiz__answer',
						append: $('<input>',{
							class: 'quiz__field quiz__field_first',
							type: 'text',
							placeholder: generatedPicFirstPlaceholder,
							val: key.substr(2)
						})
						.add('<input>',{
							class: 'quiz__field quiz__field_last',
							type: 'text',
							placeholder: generatedPicLastPlaceholder,
							val: chunkData.pic[key]
						})
						.add('<button>',{
							class: 'quiz__answer-btn'
						})
					}));
				}
				initAnswers();
				var skip = chunkData.skip,
					back = chunkData.back;

				if (skip==='1') {
					$('input[name="question-skip"][value="y"]').prop('checked', 'checked').trigger('change');
				} else if (skip==='0') {
					$('input[name="question-skip"][value="n"]').prop('checked', 'checked').trigger('change');
				}

				if (back==='1') {
					$('input[name="question-back"][value="y"]').prop('checked', 'checked').trigger('change');
				} else if (back==='0') {
					$('input[name="question-back"][value="n"]').prop('checked', 'checked').trigger('change');
				}
				break;
				break;
			case 'end':
				$('input[name="question-message"]').val(chunkData.message);
				$('input[name="question-url"]').val(chunkData.url);
				var skip = chunkData.skip,
					back = chunkData.back;

				if (skip==='1') {
					$('input[name="question-skip"][value="y"]').prop('checked', 'checked').trigger('change');
				} else if (skip==='0') {
					$('input[name="question-skip"][value="n"]').prop('checked', 'checked').trigger('change');
				}

				if (back==='1') {
					$('input[name="question-back"][value="y"]').prop('checked', 'checked').trigger('change');
				} else if (back==='0') {
					$('input[name="question-back"][value="n"]').prop('checked', 'checked').trigger('change');
				}
				break;
		}
	}
	function generatePopup(message) {
		var messages = '';
		if (typeof message === 'string') {
			messages = message
		} else if (typeof message === 'object') {
			for (var i=0; i<message.length; i++) {
				messages+=message[i]
				if (i!==message.length-1) {
					messages+='<br>'
				}
			}
		}
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
						html: messages,
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
	function bodyOut(direction) {
		if (direction==='down') {
			quizBody.css({
				opacity: 0,
				transform: 'translate(0,100px)',
				transition: 'all 0.2s ease'
			});
		} else if (direction==='up') {
			quizBody.css({
				opacity: 0,
				transform: 'translate(0,-100px)',
				transition: 'all 0.2s ease'
			});
		} else if (direction==='left') {
			quizBody.css({
				opacity: 0,
				transform: 'translate(-100px,0)',
				transition: 'all 0.2s ease'
			});
		} else if (direction==='right') {
			quizBody.css({
				opacity: 0,
				transform: 'translate(100px,0)',
				transition: 'all 0.2s ease'
			});
		}
		setTimeout(function(){
			quizBody.css({
				transition: 'unset'
			});
		},200);
	}
	function bodyIn(direction) {
		if (direction==='down') {
			quizBody.css({
				transform: 'translate(0,-100px)'
			});
		} else if(direction==='up') {
			quizBody.css({
				transform: 'translate(0,100px)'
			});
		} else if(direction==='left') {
			quizBody.css({
				transform: 'translate(100px,0)'
			});
		} else if(direction==='right') {
			quizBody.css({
				transform: 'translate(-100px,0)'
			});
		}
		setTimeout(function(){
			quizBody.css({
				opacity: 1,
				transition: 'all 0.2s ease',
				transform: 'translate(0)'
			});
			setTimeout(function(){
				quizBody.removeAttr('style');
			},200);
		}, 200)
	}
	function disableButtons(timing) {
		var btns = $('.quiz__footer .quiz__buttons .quiz__btn');
		btns.each(function(i,el){
			$(el).prop('disabled',true);
		});
		setTimeout(function(){
			btns.each(function(i,el){
				$(el).prop('disabled',false);
			});
		},timing);
	}
	function clearBody() {
		var selectHiddenInput = $('#main-select').find('.quiz__hidden-input');
		quizBody.empty();
		selectHiddenInput.val('');
		selectHiddenInput.trigger('change');
	}
	function renderChunk(direction) {
		var chunkType = '',
			selectHiddenInput = $('#main-select').find('.quiz__hidden-input');
		if (appData.order[appData.currentChunk] !== undefined) {
			chunkType = poll[appData.order[appData.currentChunk]].type;
		}

		bodyOut(direction);
		setTimeout(function(){
			quizBody.empty().scrollTop(0);
			selectHiddenInput.val(chunkType);
			selectHiddenInput.trigger('change');
			if (chunkType !== '') {
				fillFields();
			}
			bodyIn(direction);
		}, 200);
	}
	function init() {
		initMainSelect();

		var buttons = $('.quiz__buttons'),
			prevBtn = buttons.find('.quiz__btn_prev'),
			nextBtn = buttons.find('.quiz__btn_next'),
			deleteBtn = buttons.find('.quiz__btn_delete'),
			saveBtn = buttons.find('.quiz__btn_save');

		nextBtn.on('click', function(){
			var returnedValue = formPart();
			if (returnedValue.status==='success') {
				appData.currentChunk++;
				renderChunk('left');
				disableButtons(600);
			} else if (returnedValue.status==='empty') {
				generatePopup('Чтобы продолжить заполните информацию по вопросу');
			} else if (returnedValue.status==='error') {
				generatePopup(returnedValue.errors);
			}
		});
		prevBtn.on('click', function(){
			if (appData.currentChunk > 0) {
				var returnedValue = formPart();

				if (returnedValue.status==='success'||returnedValue.status==='empty') {
					appData.currentChunk--;
					renderChunk('right');
					disableButtons(600);
				} else if (returnedValue.status==='error') {
					generatePopup(returnedValue.errors);
				}
			} else {
				generatePopup('Вы находитесь на начальном вопросе');
			}
		});
		deleteBtn.on('click',function(){
			if (appData.currentChunk!==0) {
				if (appData.order[appData.currentChunk]!==undefined) {
					delete poll[appData.order[appData.currentChunk]];
					appData.order.splice(appData.currentChunk,1);
					appData.currentChunk--;
					renderChunk('right');
					disableButtons(600);
				} else {
					appData.currentChunk--;
					renderChunk('right');
					disableButtons(600);
				}
			} else {
				if (appData.order[appData.currentChunk]!==undefined) {
					delete poll[appData.order[appData.currentChunk]];
					appData.order.splice(appData.currentChunk,1,undefined);
					clearBody();
				} else {
					clearBody();
				}
			}
		});
		saveBtn.on('click', function(){
			var returnedValue = formPart();
			if (returnedValue.status==='success'||returnedValue.status==='empty') {
				sendResult();
			} else if (returnedValue.status==='error') {
				generatePopup(returnedValue.errors);
			}
		});
	}
});