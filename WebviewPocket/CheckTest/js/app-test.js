(function (){
	var Quiz = function() {}
	Quiz.prototype.opts = {}

	Quiz.prototype.data = {
		currentQuestion: 0,
		timeLimit: 0,
		timePassed: 0,
		timeLeft: 0,
		timerInterval: null,
		totalQuestion: 0,
		storedAnswers: {
			is_finished: false,
			answer: "-1",
			duration: 0
		},
		isStartTime: false,
		isCheckOSAndVer: null,
		isPauseTimer: true,
	}

	Quiz.prototype.elements = {}

	Quiz.prototype.init = function(opts){
		this.elements = {
			questions: document.querySelectorAll('.qs-item'),
			progressBar: document.getElementById('js-progress-bar'),
			btnNext: document.getElementById("js-btn-next-qs"),
			btnPause: document.getElementById("js-btn-pause-timer"),
			modalTimer: document.getElementById("modal-pause-timer"),
			btnResume: document.getElementById("js-btn-continue"),
			tooltips: document.getElementById("js-bubble"),
			btnCloseTooltips: document.getElementById("js-bubble__close"),
			btnClose: document.getElementById("js-btn-close"),
			btnBackTestListsPage:  document.getElementById("js-btn-back-list-page"),
		}
		
		this.data.totalQuestion = this.elements.questions.length;
	   
		//this.opts = Object.assign(this.opts,opts);

		this.opts = this.mergeObj(this.opts, opts)
		

		this.schema = {
			timer: function(value) {
				return !isNaN(value) && parseInt(value) == value && value >= 5;
			}
		}

		this.validateOpts(this.opts, this.schema);

		this.displayQuestion();
		
		this.initEventDOM();
	}
	Quiz.prototype.mergeObj = function(defaults, options) {
		var opts = {};
		for (var attrname in defaults) { opts[attrname] = defaults[attrname]; }
		for (var attrname in options) { opts[attrname] = options[attrname]; }
		return opts;
	} 
	Quiz.prototype.initEventDOM = function(){
		
		this.elements.btnNext.addEventListener('click', this.nextQuestion.bind(this));

		this.elements.btnPause.addEventListener("click", this.evtClickPause.bind(this));

		this.elements.btnResume.addEventListener("click", this.evtClickResume.bind(this));

		this.elements.btnCloseTooltips.addEventListener("click", this.evtClickCloseTooltips.bind(this));

		this.elements.btnClose.addEventListener("click", this.evtClickPause.bind(this));

		this.elements.btnBackTestListsPage.addEventListener("click", this.evtClickBackTestListsPage.bind(this))
		
		this.choicesAnswerEvt();
	}

	Quiz.prototype.evtClickPause = function(){
		this.displayModalPauseTimer();
	}

	Quiz.prototype.evtClickResume = function(){
		this.elements.modalTimer.classList.remove("fadeinBottom");
		if (this.data.isPauseTimer) {
			this.resumeTimer();
		}
	}

	Quiz.prototype.evtClickCloseTooltips = function() {
		this.fadeOut(this.elements.tooltips);
		this.opts.is_first = false;
	}

	Quiz.prototype.evtClickBackTestListsPage = function() {
		this.postMessage('backPage', { "value": "test_lists" });
	}

	Quiz.prototype.getQuestion = function(index){
		return this.elements.questions[index] || null;
	}

	Quiz.prototype.validateOpts = function(objects, schema) {
		var errors = Object.keys(schema).filter(function(key) {
			return !schema[key](objects[key]);
		}).map(function (key) {
			return new Error(key + " is invalid.");
		})
	
		if (errors.length > 0) {
			for(var i = 0; i < errors.length; i++) {
				this.postMessage('loadFinished', {error: errors[i].message, "success": false});
			}
		} else {
			console.log("Objects is valid");
		}
	}

	Quiz.prototype.displayModalPauseTimer = function () {
		this.elements.modalTimer.classList.add("fadeinBottom");
		this.pauseTimer();
	}

	Quiz.prototype.activeQuestionByIndex = function(index){
		if( index > 0 ){
			this.elements.questions[index-1].classList.add('hide');
		}
		if( this.elements.questions[index] )
			this.elements.questions[index].classList.remove('hide');
			this.fadeInRight(this.elements.questions[index]);
	}
	// Display question
	Quiz.prototype.displayQuestion = function () {
		
	   //document.getElementById("js-btn-next-qs").setAttribute('disabled', '');
		for(var i = 0; i < this.data.totalQuestion; i++) {
			this.elements.questions[i].classList.add('hide')
		}
		
		this.activeQuestionByIndex(this.data.currentQuestion);

		this.setText("qs-current", this.data.currentQuestion + 1);

		this.setText("qs-totals", this.data.totalQuestion + "問");

		this.elements.progressBar.children[0].style.transition = "";
		this.elements.progressBar.children[0].classList.remove("warning");
		this.elements.progressBar.children[0].classList.add("info");

		this.elements.btnNext.setAttribute("disabled", 'disabled');

		this.data.isCheckOSAndVer = (((this.opts.type||'').toLowerCase() == 'ios' && parseInt(this.opts.version) >= 9)
									|| ((this.opts.type||'').toLowerCase() == 'android' && parseInt(this.opts.version) >= 23))
									? true : false;

		switch((this.opts.type||'').toLowerCase()){
			case "ios":
				//this.elements.progressBar.children[0].style.width = this.elements.progressBar.offsetWidth + 'px';
				if( !this.data.isStartTime ) break;
			case "android":
			default:
				this.elements.progressBar.children[0].style.width = "100%";
				
				this.startTimer();
			
				this.loadImg();
				break;
		}
		
		this.setText("timer", "残り" +  this.opts.timer + "秒");

		if (this.data.currentQuestion == (this.data.totalQuestion - 1)) {
			this.elements.btnNext.innerText = "解答を見る"
		}
		
		document.querySelector('.container')
		.classList.remove('hide');

		delete window.startQuiz;
	}

	// event next question
	Quiz.prototype.nextQuestion = function (e) {
		e.target.setAttribute('disabled', 'disabled');

		this.resetTimer();

		setTimeout((function(){
			this.getAnswer();

			if(this.data.currentQuestion < this.data.totalQuestion - 1) { 
					this.elements.tooltips.classList.add("hide");
					this.data.currentQuestion++;
					this.displayQuestion();
			} else {
				// console.log('submit')	
			}
		}).bind(this), 100);
	}

	// Disabled answer when timeout
	Quiz.prototype.disabledQuestion = function () {
		disableListAnswer =  this.elements.questions[this.data.currentQuestion].querySelectorAll(".qs-answer__option");  
		for(var i = 0; i < disableListAnswer.length; i++) {
			disableListAnswer[i].classList.add("disabled", "not-allow");
		}
	}

	//render text
	Quiz.prototype.setText = function(id,text) { 
		return document.getElementById(id).innerText = text;
	}

	// Start timer question
	Quiz.prototype.startTimer = function() {
		this.clearInterval();
		this.elements.progressBar.children[0].style.transition = "0.99s linear width";

		this.data.timerInterval = setInterval((function(){
			this.data.timePassed =  this.data.timePassed += 1;
			this.data.timeLeft = this.opts.timer -  this.data.timePassed;
			
			this.changeProgress()
			.needShowTooltipSuggestion();
			
			if ( this.data.timeLeft < 1) {
				this.data.isPauseTimer = false;
				clearInterval(this.data.timerInterval);
				this.data.timerInterval = null;
			}
		}).bind(this), 1000)
	}

	Quiz.prototype.changeProgress = function(){
		var progressBarWidth = Math.round(
			(this.data.timeLeft / this.opts.timer * this.elements.progressBar.offsetWidth)
			* 1000
		)/1000;

		this.elements.progressBar.children[0].style.width = progressBarWidth + "px";
		
		this.setText("timer", "残り" +  this.data.timeLeft + "秒");
		
		if (this.data.timeLeft < (this.opts.timer*20/100) + 1) {
			this.elements.progressBar.children[0].classList.add("warning");
			this.elements.progressBar.children[0].classList.remove("info");
		}
		
		return this;
	}

	Quiz.prototype.needShowTooltipSuggestion = function(){
		if (this.opts.is_first && (this.data.timeLeft < (this.opts.timer*50/100))) {
			this.elements.tooltips.classList.remove('hide');
			this.fadeIn(this.elements.tooltips);
		} else if (this.opts.is_first && (this.data.timeLeft > (this.opts.timer*50/100 + 1))) {
			this.elements.tooltips.classList.add('hide');
			this.fadeOut(this.elements.tooltips);
		}
		return this;
	}

	//reset timer question
	Quiz.prototype.resetTimer = function () { 
		this.clearInterval();

		this.elements.progressBar.children[0].style.transition = "";
		this.elements.progressBar.children[0].style.width = "100%";
		this.elements.progressBar.children[0].classList.remove("warning");
		this.elements.progressBar.children[0].classList.add("info");

		this.data.timeLimit = this.opts.timer;
		this.data.timePassed = 0;
		this.data.timeLeft = this.opts.timer;
		this.data.isPauseTimer = true;
	}

	//resume timer question
	Quiz.prototype.clearInterval = function () {
		if( this.data.timerInterval !== null ){
			clearInterval(this.data.timerInterval);
			this.data.timerInterval = null;
		}
	}

	//resume timer question
	Quiz.prototype.resumeTimer = function () {
		this.startTimer();
	}

	//pause timer
	Quiz.prototype.pauseTimer = function () {
		clearInterval(this.data.timerInterval);
	}

	Quiz.prototype.choicesAnswerEvt = function () {
		var choices = document.querySelectorAll('input[type="radio"]');
		for (var i = 0; i < choices.length; i++) {
			choices[i].addEventListener("change", this.storeAnswer.bind(this)); 
		}   
	}

	Quiz.prototype.storeAnswer = function(e) { 
		
		this.data.storedAnswers = {
			is_finished: false,
			answer: e.target.value || "-1",
			duration: this.opts.timer - this.data.timeLeft,
			//id: this.getQuestion(this.data.currentQuestion).getAttribute('data-id') || ''
		}
		
		this.elements.btnNext.removeAttribute('disabled');
	}

	Quiz.prototype.getAnswer = function () {
		this.data.storedAnswers.id = this.getQuestion(this.data.currentQuestion).getAttribute('data-id') || '';

		this.data.storedAnswers.is_finished = (
			this.data.currentQuestion >= this.data.totalQuestion - 1
		); 
		
		if( this.data.storedAnswers.is_finished ) {
			this.pauseTimer();
			this.data.isPauseTimer = false;
		} 

		this.disabledQuestion();
		
		this.postDataToApp();
	}

	Quiz.prototype.postDataToApp = function(){
		this.postMessage('answerTest', this.data.storedAnswers);
		
		this.data.storedAnswers = {
			is_finished: false,
			answer: "-1",
			duration: 0
		}
	}

	Quiz.prototype.postMessage = function(fncName, msg){
		msg = JSON.stringify(msg);
		
		if( 'webkit' in window ){
			window.webkit.messageHandlers[fncName].postMessage(msg);
		}else if( 'Android' in window || 'android' in window ) {
			(window.android || window.Android)[fncName](msg);
		}
	}

	Quiz.prototype.evtCloseAppBackground = function(params) {
		if (params.is_pause) {
			this.displayModalPauseTimer();
		}
	}
	
	Quiz.prototype.loadImg = function() {
		document.querySelectorAll('img[data-src]')
		.forEach(function(item, idx){
			setTimeout(function(){
				item.setAttribute('src', item.getAttribute('data-src'));
				item.removeAttribute('data-src');
			}, 0);
		});
	}
	
	Quiz.prototype.evtIsStartTime = function(params) {
		if ( (this.opts.type || '') == "ios" 
			&& params.is_start_time
		) {
			this.data.isStartTime = true;
			this.elements.progressBar.children[0].style.transition = "";
			this.elements.progressBar.children[0].style.width = this.elements.progressBar.offsetWidth + 'px';
			this.startTimer();
			this.loadImg();
		}
	}

	//animation 
	Quiz.prototype.fadeIn = function (elem) { 
		var self = this,
			elementattr = Number(getComputedStyle(elem).opacity);
		if (elementattr >= 1) {
			return;
		}
		elem.style.opacity = elementattr + 0.01;
		setTimeout(function () {
			self.fadeIn(elem);
		}, 10);
	}

	Quiz.prototype.fadeOut = function (elem) { 
		var self = this,
			elementattr = Number(getComputedStyle(elem).opacity);
		if (elementattr <=  0) {
			return;
		}
		elem.style.opacity = elementattr - 0.01;

		setTimeout(function () {
			self.fadeOut(elem);
		}, 10);
	}

	Quiz.prototype.fadeInRight = function(elem) {
		var self = this,
			styleElem = window.getComputedStyle(elem),
			matrix = new WebKitCSSMatrix(styleElem.transform),
			widthDevice = (window.innerWidth > 0) ? window.innerWidth : screen.width;
		if (matrix.m41 <= 0) {
			elem.style.transform = "translateX(0px)"
			return; 
		}
		if(widthDevice >= 768) {
			elem.style.transform = "translateX(" +  Number(matrix.m41 - 50) + "px)";
		} else {
			elem.style.transform = "translateX(" +  Number(matrix.m41 - 15) + "px)";
		}
		setTimeout(function () {
			self.fadeInRight(elem);
		}, 10);
	}

	var quiz = new Quiz();

	window.startQuiz = function(opts) {
		var e = null, isSuccess = false;
		try {
			document.body.innerHTML = document
        	.getElementById('data_content')
        	.innerText || '';
			
			quiz.init(opts);
			isSuccess = true;
		} catch (error) {
			e = error.message;
		}
		
		quiz.postMessage('loadFinished', {error: e, "success": isSuccess});
		return isSuccess;
	}

	quiz.postMessage('javascriptLoaded', {"success": true});

	window.closeAppBackground = function(params) { 
		quiz.evtCloseAppBackground(params)
	}

	window.startTimeIOS = function(params) {
		quiz.evtIsStartTime(params)
	}
})()