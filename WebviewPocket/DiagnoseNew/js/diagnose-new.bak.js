(function (){
  function extend (base, constructor) {
    var prototype = new Function();
    prototype.prototype = base.prototype;
    constructor.prototype = new prototype();
    constructor.prototype.constructor = constructor;
  }
  
  window.baseQuestion = function(){}
  
  baseQuestion.prototype.dataDiagnose = {
    currentQuestion: 0,
    numberQuestion: 1,
    startQuestion: 2,
    maxDiagnose: 0,
    maxDiagnoseNew: 0,
    listQuestion: {},
    optionAnswer: {},
    //isType: null,
    postData: {
      type: null,
      result_type: null,
      data: "",
    }
  }
  const dataAnswer = new Map();

  baseQuestion.prototype.isParamsDiagonse = function (obj) {
    return 'career_anchor' in obj && 
      'enneagram' in obj && 
      'start_page' in obj;
  }
  
  baseQuestion.prototype.init = function(params) {
    if (this.checkObjNotEmpty(params)) {
      this.response = params;
      this.data = this.response.data;
      this.destination = this.response.destination || null;
      this.dataEnneagram = this.data.enneagram;
      this.dataCareer = this.data.career_anchor;
      this.dataP16Types = this.data.p16_types;
      this.startPage = this.data.start_page.start_page;
      this.baseUrl = 'https://' + location.host;
      this.createUIPageDiagnose();      
      this.createUIPageStart();
      if (this.destination) {
        const typeDiagnose = this.destination;

        switch (typeDiagnose) {
          case 'enneagram':
            const enneagrame = new Enneagrame();
            enneagrame.initEnneagrame(this.dataEnneagram, typeDiagnose);
            break;
          case 'career_anchor':
            const career = new Career();
            career.initCareer(this.dataCareer, typeDiagnose);
            break;
          case 'p16_types':
            const diagnosis = new Diagnosis();
            diagnosis.init(this.dataP16Types, typeDiagnose);
            break;
        }

        document.querySelector('body').appendChild(this.ComponentModal());
        document.getElementById("diagnose").classList.remove('hide');
        document.getElementById("start_diagnose").classList.add('hide');
        this.fadeInRight(document.getElementById("diagnose"));
      }
     
    } else {
      this.postMessage('logError', { error: 'Data passed in is correct' });
    }
  }
  
  baseQuestion.prototype.createComponent = function(tag, className, textContent, attributes = {}) {
    const element = document.createElement(tag);
    element.className = className || "";
    element.innerHTML = textContent || "";
  
    for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, value);
    }
  
    return element;
  }

  baseQuestion.prototype.baseMatchStringUrl = function (str) {
    const tempBrPlaceholder = "__TEMP_BR_PLACEHOLDER__";
    const stringWithoutBr = str.replace(/<br\s*\/?>/gi, tempBrPlaceholder);
    
    function removeBrFromHref(href) {
      return href.replace(/__TEMP_BR_PLACEHOLDER__/g, "");
    }

    window.onClick = (elem) => {
      const url = elem.getAttribute("data-url");
      this.postMessage('toLinkBrowser', { "value": url })
    }
    // Tiến hành tìm kiếm và thay thế URL
    const regex = /http[s]?:\/\/\S+/gi;
    const result = stringWithoutBr.replace(regex, (match) => {
      const hrefWithoutBr = removeBrFromHref(match);
      const anchorTag = document.createElement("a");
      anchorTag.setAttribute("onclick", "onClick(this)");
      anchorTag.setAttribute("href",  "javascript:void(0)");
      anchorTag.setAttribute("data-url", hrefWithoutBr);
      //anchorTag.setAttribute("target", "_blank");
      anchorTag.textContent = match;
      return anchorTag.outerHTML;
    });

    // Đặt lại thẻ <br> sau khi đã xử lý URL
    const finalResult = result.replace(new RegExp(tempBrPlaceholder, "g"), "<br>");

    return finalResult;
  }

  baseQuestion.prototype.createUIPageStart = function () {
    const { title: title_p16type, sub_title ,description, img: dataP16Img } = this.dataP16Types;
    const { text_top, img: startPageImg , text_bottom } = this.startPage; 

    var textLabel = "診断コンテンツ",
      isPage = "start_diagnose";
      //body = document.getElementsByTagName('body')[0];
    const body = document.body;

    const container = document.createElement("div");
    container.className = "container start-diagnose";
    container.setAttribute("id", "start_diagnose");
  
    const main = document.createElement("section");
    main.className = "main-container";
  
    const elNewTitlle = this.createComponent('div', 'header-title', title_p16type);
    const elNewSubTitle = this.createComponent('div', 'text-center', sub_title);
    const elNewBanner = this.createComponent('div', 'banner mt-15 text-center', null);
    elNewBanner.appendChild(this.createComponent('img', '', null, { src: dataP16Img }));
    const elNewContent = this.createComponent('div', 'p-15', this.baseMatchStringUrl(description));
    const elNewBtnStartDiagnose =  this.createComponent('div', 'p-15 text-center', null);
    elNewBtnStartDiagnose.appendChild(this.ComponentButton({ 
      text: `<small class="mr-7px">${title_p16type}</small></br>診断スタート！`, 
      isClass: "btn--primary btn-start w-100", 
      additionalAttributes: {
        'data-type': 'p16_types'
      },
      pressHandler: this.evtNextPageDiagnose.bind(this) 
    }));

    const elTitle = this.createComponent('div', 'header-title text-truncate', text_top);
    const elBanner = this.createComponent('div', 'banner mt-15 text-center', null, { id: 'banner' });
    elBanner.appendChild(this.createComponent('img', '', null, { src: startPageImg }));
    const elContent = this.createComponent('div', 'p-15', text_bottom);
  
    const elBtnStartEnneagram = this.createComponent('div', 'p-15 text-center', null);
    elBtnStartEnneagram.appendChild(this.ComponentButton({ 
      text: '<small class="mr-7px">やりたいことが決まっている方</small><br/>診断スタート！', 
      isClass: "btn--primary btn-start w-100", 
      additionalAttributes: {
        'data-type': 'enneagram'
      },
      pressHandler: this.evtNextPageDiagnose.bind(this) 
    }));

    
    const elBtnStartCarrierAnchor = this.createComponent('div', 'p-15 text-center', null);
    elBtnStartCarrierAnchor.appendChild(this.ComponentButton({ 
      text: '<small class="mr-7px">やりたいことが決まっていない方</small><br/>診断スタート！',  
      isClass: "btn--primary btn-start w-100",
      additionalAttributes: {
        'data-type': 'career_anchor'
      },
      pressHandler: this.evtNextPageDiagnose.bind(this) 
    }));

    main.prepend(elNewTitlle, elNewSubTitle ,elNewBanner, elNewContent,elNewBtnStartDiagnose, elTitle, elBanner, elContent);
    container.prepend(this.ComponentHeader(textLabel, isPage), main,  elBtnStartEnneagram, elBtnStartCarrierAnchor)
    body.prepend(container);
  }
  
  baseQuestion.prototype.createUIPageDiagnose = function () { 
    var isPage = "diagnose",
      textLabel = "",
      body = document.getElementsByTagName('body')[0];
  
    const container = document.createElement("div");
    container.className ="container hide";
    container.setAttribute("id", "diagnose");
  
    // Create UI Body
    const main = document.createElement("section");
    main.className = "main-container"
  
    const wrapperQs = document.createElement("div");
    wrapperQs.className = "wrapper-qs";
  
    const qsItem = document.createElement("div");
    qsItem.className = "qs-item";
  
    const qsItemTop = document.createElement("div");
    qsItemTop.className = "qs-item__top";
    
    const qsNumber = document.createElement("div");
    qsNumber.className = "qs-number";
  
    const textNumber =  document.createElement("span");
    textNumber.setAttribute("id", "number-question");
  
    const qsItemBody = document.createElement("div");
    qsItemBody.className = "qs-item__body";
  
    const qsQuestion = document.createElement("div");
    qsQuestion.className = "qs-question";
    qsQuestion.setAttribute("id", "question");
  
    const qsAnswer = document.createElement("div");
    qsAnswer.className = "qs-answer";
  
    qsNumber.appendChild(textNumber);
    qsItemTop.appendChild(qsNumber);
  
    qsItemBody.prepend(qsQuestion, qsAnswer, this.ComponentProgress());
  
    qsItem.prepend(qsItemTop, qsItemBody);
    wrapperQs.appendChild(qsItem);
    main.appendChild(wrapperQs);
  
   
    // add groot body
    container.prepend(this.ComponentHeader(textLabel, isPage), main);
    body.prepend(container)
    //body.prepend(container, this.ComponentModal());
  }
  
  /**
   * create component Header
   * @returns HTML
   */
  baseQuestion.prototype.ComponentHeader = function(text, typePage) {
    var header = document.createElement("herder");
    header.className ="header-container";
  
    var headerTop =  document.createElement("div"),
      btnTop = document.createElement("a"),
      icon = document.createElement("img"),
      headerLabel = document.createElement("div");
      headerLabel.className = "header-label text-truncate";
      headerLabel.textContent = text || "";
    switch(typePage) {
      case "start_diagnose":
        headerTop.className = "header-top";
        btnTop.className ="btn-top";
        icon.setAttribute("src", this.baseUrl + '/assets/images/ic_arrow_back.png');
        btnTop.addEventListener("click", this.evtBackHomPage.bind(this))
        break;
      case "diagnose":
        headerTop.className = "header-top text-right";
        btnTop.className ="btn-top btn-open";
        icon.setAttribute("src",  this.baseUrl + '/assets/images/icon-close.png');
        icon.setAttribute("width","33");
        btnTop.addEventListener("click", this.evtOpenModal.bind(this))
        break;
    }
    btnTop.appendChild(icon);
    headerTop.appendChild(btnTop);
    header.prepend(headerTop, headerLabel);
  
    return header;
  }
  
  /**
   * create component progress bar
   * @returns HTML
   */
  baseQuestion.prototype.ComponentProgress = function () {
    var progressWrapper = document.createElement("div"),
      textProgressLeft = document.createElement("span"),
      textProgressRight = document.createElement("span"),
      progressBar = document.createElement("div"),
      progressBarInner = document.createElement("div");
  
    progressWrapper.className = "qs-progress"
  
    textProgressLeft.className = "progress-bar-text left";
    textProgressLeft.textContent = "0%";
  
    textProgressRight.className = "progress-bar-text right";
    textProgressRight.textContent = "100%";
  
    progressBar.className = "progress-bar";
  
    progressBarInner.className = "progress-bar__inner";
    progressBarInner.setAttribute("id", "progressMeter")
    
    progressBar.appendChild(progressBarInner);
    progressWrapper.prepend(textProgressLeft, textProgressRight, progressBar)
   
    return progressWrapper;
  }
  
  /**
   * create component Button
   * @returns HTML
   */
  baseQuestion.prototype.ComponentButton = function({text, isClass, pressHandler, additionalAttributes}) { 
    const button = document.createElement("button");
      button.className = 'btn ' + isClass;
      button.innerHTML = text;

    if (additionalAttributes) {
      for (var attribute in additionalAttributes) {
        button.setAttribute(attribute, additionalAttributes[attribute]);
      }
    }

    button.addEventListener("click", pressHandler);
  
    return button;
  }
  
  baseQuestion.prototype.ComponentOptionAnswer = function ({id, name, value, data_text, data_point = "", data_group = "", data_type = "", data_next="", data_question_order = ""  ,text_label, evtCheckHandler}) {
    const answerItemDiv = this.createComponent("div", "qs-answer__option");
    
    const answerCheckInput = this.createComponent("input", "", "", {
      type: "radio",
      value: value,
      id: id,
      name: name,
      "data-point": data_point,
      "data-group": data_group,
      "data-type": data_type,
      "data_text": data_text,
      "data_next": data_next,
      "data_question_order": data_question_order
    });
  
    answerCheckInput.addEventListener("change", evtCheckHandler);
  
    const answerLabel = this.createComponent("label", "qs-answer-item text-center", text_label, {
      for: id
    });
  
    answerItemDiv.appendChild(answerCheckInput);
    answerItemDiv.appendChild(answerLabel);
  
    return answerItemDiv;
  };
  
  /**
   * create component Modal
   * @returns HTML
   */
  baseQuestion.prototype.ComponentModal = function() {
    var modal = document.createElement("div"),
      modalDialog = document.createElement("div"),
      modalBody = document.createElement("div"),
      modalFooter = document.createElement("div"),
      textTitle = document.createElement("p");
      footerInner = document.createElement("div");
  
    modal.className = "modal";
    modalDialog.className = "modal-dialog";
    modalBody.className = "modal-body";
    textTitle.className = "text-center modal-title fs-16";
    textTitle.textContent = "診断を続けますか？";
    modalFooter.className = "modal-footer text-center";
    footerInner.className = "group-btn";
  
    footerInner.prepend(
      this.ComponentButton({
        text: "やめる", 
        isClass: "btn--light", 
        pressHandler: this.evtBackStartPage.bind(this)}),
      this.ComponentButton({
        text: "続ける", 
        isClass: "btn--success", 
        pressHandler: this.evtCloseModal
      })
    );
    modalFooter.appendChild(footerInner);
    modalBody.prepend(textTitle);
    modalDialog.prepend(modalBody, modalFooter);
    modal.appendChild(modalDialog);
  
    return modal;
  }
   
  baseQuestion.prototype.createDiagnoseQs = function(diagnoseQuestion) {
    if (this.checkObjNotEmpty(diagnoseQuestion)) {
      this.createQuestion(diagnoseQuestion);
      this.createAnswerOption(diagnoseQuestion)
    }
  }
  baseQuestion.prototype.createDiagnoseQsNew = function(diagnoseQuestion, keyQs, orderQs) { 
    if (this.checkObjNotEmpty(diagnoseQuestion)) {
      this.createQuestion(diagnoseQuestion);
      this.createAnswerOptionDiagnosisNew(diagnoseQuestion, keyQs, orderQs)
    }
  }
  
  baseQuestion.prototype.createQuestion = function(diagnoseQuestion) {  
  
    if (this.keyExistInObj(diagnoseQuestion, key = 'text')) {
      var questionNumber = document.getElementById("number-question"),
        questionsText = document.getElementById("question");
      questionsText.textContent = diagnoseQuestion.text;
      questionNumber.textContent = this.dataDiagnose.numberQuestion;
    }
  }

  baseQuestion.prototype.createAnswerOptionDiagnosisNew = function(diagnoseQuestion, keyQs, orderQs) {
    const answerOptionList = diagnoseQuestion.answers;
    // Sort option answer when render
    const sortedAnswerOptionList = Object.keys(answerOptionList)
      .sort((a, b) => answerOptionList[a].order - answerOptionList[b].order);

    const elAnswerList = document.querySelector('.qs-answer');
    elAnswerList.innerHTML = "";
    for (const key of sortedAnswerOptionList) { 
      const evtCheckHandler = (e) => {
        const toDiagnose = e.target.getAttribute("data_next");
        const orderQs = e.target.getAttribute("data_question_order");
       
        if (toDiagnose == '' || toDiagnose == null) {
          //this.dataDiagnose.postData.data[key] = e.target.value;
          dataAnswer.set(keyQs, e.target.value)
          this.disableOptionAnswer();
          
          this.showProgressNew(
            orderQs,
            toDiagnose);
          this.dataDiagnose.postData.data = this.mapToString(dataAnswer);
          setTimeout(() => {
            this.postMessage("postData", this.dataDiagnose.postData)
          }, 500);
          return;
        } 
        this.dataDiagnose.currentQuestion += 1;
        this.dataDiagnose.numberQuestion += 1;
        
        dataAnswer.set(keyQs, e.target.value)
        this.evtNextDiagnoseQsNew(toDiagnose);
      };

      if (answerOptionList.hasOwnProperty(key)) { 
        const option = answerOptionList[key];
        elAnswerList.appendChild(
          this.ComponentOptionAnswer({
            id: 'diagnose-'+this.dataDiagnose.numberQuestion+'-' + key, 
            name: 'diagnose['+ this.dataDiagnose.numberQuestion + '][]',
            value: key,
            data_text: option.text, 
            data_point: option.point, 
            data_group: option.group, 
            text_label: option.text, 
            data_next: option.next,
            data_question_order: orderQs,
            evtCheckHandler: evtCheckHandler
          })
        )
      }
 
    }
  }
  
  baseQuestion.prototype.createAnswerOption = function(diagnoseQuestion) {
    const self = this,
      answerList = document.querySelector('.qs-answer');

    answerList.innerHTML = "";

    for (var option in this.dataDiagnose.optionAnswer) {
      
      function evtCheckHandler(e) {
        var toDiagnose, 
        data_point = e.target.getAttribute("data-point");
       
        if (self.dataDiagnose.numberQuestion < self.dataDiagnose.maxDiagnose) {
          self.dataDiagnose.currentQuestion += 1;
          self.dataDiagnose.numberQuestion += 1;
          self.dataDiagnose.startQuestion +=1
          if (self.dataDiagnose.postData.type == "enneagram") {
            toDiagnose = diagnoseQuestion[data_point];
           
            /** 
             * add answer to object
             * @type enneagram
             * @examble data: {"2":"Q3","3":"Q4","4":"Q6",...}
             */
            dataAnswer.set(self.dataDiagnose.currentQuestion, toDiagnose);
            //self.dataDiagnose.postData.data[self.dataDiagnose.currentQuestion] = toDiagnose;

          } else if (self.dataDiagnose.postData.type == "career_anchor") {
            toDiagnose = 'Q'+self.dataDiagnose.startQuestion;
            self.argolithmCareer(data_point, e.target.getAttribute("data-group"));

            /** 
             * add answer to object
             * @type Career anchor
             * @examble data: {"2":"0","3":"3","4":"2",...}
            */
            dataAnswer.set(self.dataDiagnose.currentQuestion, e.target.value);
            //self.dataDiagnose.postData.data[self.dataDiagnose.currentQuestion] = e.target.value;
          }
          self.evtNextDiagnoseQs(toDiagnose);
        } else {
          switch(self.dataDiagnose.postData.type) {
            case "enneagram": 
               //add answer to object
              //self.dataDiagnose.postData.data[self.dataDiagnose.numberQuestion] = diagnoseQuestion[data_point];
              dataAnswer.set(self.dataDiagnose.numberQuestion, diagnoseQuestion[data_point]);

              self.dataDiagnose.postData.result_type = diagnoseQuestion[data_point];
              self.disableOptionAnswer();
              document.querySelector(".progress-bar__inner").style.width = "100%";
              self.dataDiagnose.postData.data = self.mapToString(dataAnswer);
              self.postMessage("postData", self.dataDiagnose.postData)
              break;
            case "career_anchor":
              self.argolithmCareer(data_point, e.target.getAttribute("data-group"));
              //add answer to object
              var selectOption = e.target.getAttribute("data_text");
              dataAnswer.set(self.dataDiagnose.numberQuestion, e.target.value);
              //self.dataDiagnose.postData.data[self.dataDiagnose.numberQuestion] = e.target.value;
              self.compareCareer();

              break;
          }
        }
      }
      answerList.appendChild(
        this.ComponentOptionAnswer({
          id: 'diagnose-'+this.dataDiagnose.numberQuestion+'-'+option, 
          name: 'diagnose['+ this.dataDiagnose.numberQuestion + '][]',
          value: option,
          data_text: this.dataDiagnose.optionAnswer[option].text, 
          data_point: this.dataDiagnose.optionAnswer[option].point, 
          data_group: diagnoseQuestion.group, 
          text_label: this.dataDiagnose.optionAnswer[option].text, 
          evtCheckHandler: evtCheckHandler })
          );
    }
  }
  
  baseQuestion.prototype.handleFirstDiagnose = function(firstDiagnose) {
    var self = this,
      isType,
      answerList = document.querySelector('.qs-answer');
    answerList.innerHTML = "";
    if (firstDiagnose.yes) { 
      function evtCheckEnneagrame (e) {
        isType = e.target.getAttribute("data-type");
        self.dataDiagnose.currentQuestion += 1;
        self.dataDiagnose.numberQuestion += 1;
        var enneagrame = new Enneagrame();
        enneagrame.initEnneagrame(self.dataEnneagram, isType);
      }
  
      answerList.appendChild(
        this.ComponentOptionAnswer({
          id: 'diagnose-' + this.dataDiagnose.numberQuestion + '-0', 
          name: 'diagnose[' + this.dataDiagnose.numberQuestion + '][]', 
          value: 0, 
          data_type: firstDiagnose.yes, 
          text_label: "決まっている",
          evtCheckHandler: evtCheckEnneagrame} )
          );
    }
  
    if (firstDiagnose.no) {
      function evtCheckCareer (e) {
        isType = e.target.getAttribute("data-type");
        self.dataDiagnose.currentQuestion += 1;
        self.dataDiagnose.numberQuestion += 1;
        var career = new Career();
        career.initCareer(self.dataCareer, isType);
      }
    
      answerList.appendChild(
        this.ComponentOptionAnswer({
          id: 'diagnose-' + this.dataDiagnose.numberQuestion + '-1', 
          name: 'diagnose[' + this.dataDiagnose.numberQuestion + '][]', 
          value: 1, 
          data_type: firstDiagnose.no, 
          text_label: "決まっていない",
          evtCheckHandler: evtCheckCareer} )
          );
      }
  }
  
  baseQuestion.prototype.disableOptionAnswer = function () {
    var answerOption = document.querySelectorAll(".qs-answer__option");
    for (var i = 0;i < answerOption.length; i++) {
      answerOption[i].classList.add("disabled", "not-allow");
    }
  }
  
  baseQuestion.prototype.restartDiagnose = function () {
    this.dataDiagnose.currentQuestion = 0;
    this.dataDiagnose.numberQuestion = 1;
    this.dataDiagnose.startQuestion = 2;
    this.dataDiagnose.maxDiagnose = 0;
    this.dataDiagnose.maxDiagnoseNew = 0;
    this.dataDiagnose.listQuestion = {}  
    this.dataDiagnose.optionAnswer = {}
    this.dataDiagnose.postData.type = null;
    this.dataDiagnose.postData.result_type = null;
    this.dataDiagnose.postData.data = "";
    //this.dataDiagnose.listQuestion = this.dataFirstDiagnose || null;
    //this.handleFirstDiagnose(this.dataDiagnose.listQuestion);
    this.createQuestion(this.dataDiagnose.listQuestion);
    document.querySelector(".progress-bar__inner").style.width = "0%";
  }

  baseQuestion.prototype.mapToString = function (map) {
    let stringData = '{';

    map.forEach((value, key) => {
      stringData += `"${key}": "${value}", `;
    });
  
    if (stringData.length > 1) {
      stringData = stringData.slice(0, -2);
    }
    stringData += '}';
  
    return stringData;
  }
  
  baseQuestion.prototype.evtBackHomPage = function() {
    this.postMessage('backPage', { "value":"home"} );
  }
  
  baseQuestion.prototype.evtNextPageDiagnose = function (e) {
    document.getElementById("start_diagnose").classList.add('hide');
    document.querySelector('body').appendChild(this.ComponentModal());
    document.getElementById("diagnose").classList.remove('hide');
    this.fadeInRight(document.getElementById("diagnose"));

    const typeDiagnose = e.target.getAttribute('data-type');
    switch (typeDiagnose) {
      case 'enneagram':
        const enneagrame = new Enneagrame();
        enneagrame.initEnneagrame(this.dataEnneagram, typeDiagnose);
        break;
      case 'career_anchor':
        const career = new Career();
        career.initCareer(this.dataCareer, typeDiagnose);
        break;
      case "p16_types":
        const diagnosis = new Diagnosis();
        diagnosis.init(this.dataP16Types, typeDiagnose);
        break;
    }
  }
  
  baseQuestion.prototype.evtNextDiagnoseQs = function(key) {
    if (this.keyExistInObj(this.dataDiagnose.listQuestion, key)) {
      this.createDiagnoseQs(this.dataDiagnose.listQuestion[key]);
      this.showProgress();
    }
  }

  baseQuestion.prototype.evtNextDiagnoseQsNew = function(key) {
    if (this.keyExistInObj(this.dataDiagnose.listQuestion, key)) {
      const orderCurentQuestion =  this.dataDiagnose.listQuestion[key].order;
      this.showProgressNew(orderCurentQuestion, key);
      this.createDiagnoseQsNew(this.dataDiagnose.listQuestion[key], key, orderCurentQuestion);
    }
  }
  
  baseQuestion.prototype.evtOpenModal = function() {
    document.querySelector('.modal').classList.add("fadeinBottom");
  }
  
  baseQuestion.prototype.evtCloseModal = function() {
    document.querySelector('.modal').classList.remove("fadeinBottom");
  }
  
  baseQuestion.prototype.evtBackStartPage= function() {
    var self = this;
    //this.postMessage('backPage', { "value":"start_diagnose"})
    document.querySelector('.modal').classList.remove("fadeinBottom");
    setTimeout(function() {
      self.restartDiagnose();
      document.getElementById("diagnose").classList.add('hide');
      document.getElementById("start_diagnose").classList.remove('hide');
      document.querySelector('.modal').remove();
  }, 500);
  }
  
  baseQuestion.prototype.showProgress = function() {
    var increment = Math.ceil((this.dataDiagnose.currentQuestion) / (this.dataDiagnose.maxDiagnose) * 100);
      progressMeter = document.getElementById("progressMeter");
      progressMeter.style.width = (increment) + '%';
  } 

  baseQuestion.prototype.showProgressNew = function(orderQs, nextQs) { 
    const progressMeter = document.getElementById("progressMeter");
    const totalQuestion = this.dataDiagnose.maxDiagnoseNew;
    const percentPerQuestion = (1 / totalQuestion) * 100;
    if (nextQs == "" || nextQs == null || nextQs == undefined) { 
      progressMeter.style.width = '100%';
    } else {
      progressMeter.style.width = (orderQs - 1) * percentPerQuestion + '%';
    }
  }
  
  baseQuestion.prototype.findSecondQuestion = function () {
    return this.dataDiagnose.listQuestion.Q2;
  }
  
  baseQuestion.prototype.fadeInRight = function(elem) {
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

  /**
   * Check key in object exist or not exist 
   * @param {*} obj 
   * @param {*} key 
   */
  baseQuestion.prototype.keyExistInObj = function (obj, key) {
    var isCheckKey = false;
    if (!obj.hasOwnProperty(key)) {
      this.postMessage('logError', { error: 'key ' + key + ' does not exist' })
      isCheckKey = false;
    } else {
      isCheckKey = true;
    }
    return isCheckKey
  }

  /**
   * Check type and object empty
   * @param {*} obj 
   * @returns boolean
   */
  baseQuestion.prototype.checkObjNotEmpty = function (obj) {
    var isCheckObject = false;
    if (Object.keys(obj).length === 0 ) {
      isCheckObject = false;
      this.postMessage('logError', { error: 'Object is empty' });
    } else if (obj.constructor !== Object) {
      isCheckObject = false;
      this.postMessage('logError', { error: 'Parameter is not a object' });
    } else {
      isCheckObject = true;
    }

    return isCheckObject;
  }
  
  baseQuestion.prototype.postMessage = function(fncName, msg){
    msg = JSON.stringify(msg);
    
    if( 'webkit' in window ){
      window.webkit.messageHandlers[fncName].postMessage(msg);
    }else if( 'android' in window ) {
      (window.android || window.Android)[fncName](msg);
    }
  }
  
  /**
   * Enneagrame argolithm
   */
  window.Enneagrame = function(){
    baseQuestion.call(this);
  }
  
  extend(baseQuestion, Enneagrame);
  
  Enneagrame.prototype.initEnneagrame = function(params, isType) {
    this.isType = isType;
    this.params = params;
    this.objEenneagram();
  }
  
  Enneagrame.prototype.objEenneagram = function() {
    this.dataDiagnose.listQuestion = this.params.items;
    this.dataDiagnose.optionAnswer = this.params.answers;
    this.dataDiagnose.postData.type = this.isType;
    this.dataDiagnose.maxDiagnose = 8;
    //this.createDiagnoseQs(Object.values(this.params.items)[0]);
  
    //Render first question when select type Enneagrame;
    if (this.keyExistInObj(this.dataDiagnose.listQuestion, 
      key = 'Q' + this.dataDiagnose.numberQuestion + 1)
    ) {
      this.createDiagnoseQs(this.findSecondQuestion());
      this.showProgress();
    }
  }
  
  
  
  //Enneagrame.prototype = baseQuestion.prototype;
  
  
  /**
   * Career anchor argolithm
   */
  window.Career = function() {
    baseQuestion.call(this);
  }
  
  extend(baseQuestion, Career);
  
  Career.prototype.initCareer = function(params, isType) {
    this.isType = isType;
    this.params = params;
    this.optScores = {};
    this.listType = [];
    this.objCareer();
  }
  
  Career.prototype.objCareer = function() {
    this.dataDiagnose.listQuestion = this.params.items;
    this.dataDiagnose.optionAnswer = this.params.answers;
    this.dataDiagnose.postData.type = this.isType;
    this.dataDiagnose.maxDiagnose = Object.keys(this.params.items).length - 1;
    //this.createDiagnoseQs(Object.values(this.params.items)[0], this.isType);
    //Render first question when select type Career_anchor
    if ( this.keyExistInObj(this.dataDiagnose.listQuestion, 
      key = 'Q' + this.dataDiagnose.numberQuestion + 1)
    ) {
      this.createDiagnoseQs(this.findSecondQuestion());
      this.showProgress();
    }  
    this.assignObjScore();
  }
  
  Career.prototype.assignObjScore = function () {
    var self = this,
    listCareer = Object.values(this.dataDiagnose.listQuestion),
    listGroup = [],
    uniqueGroup = [];
    
    for (var item of listCareer) {
      if (item.group) {
        listGroup.push(item.group)
      }
    }
  
    // Remove group duplicate
    listGroup.forEach(function(c) {
      if (!uniqueGroup.includes(c)) {
        uniqueGroup.push(c);
        self.listType =  uniqueGroup.sort();
      }
    });
    // assign object with group type with value = 0
    uniqueGroup.forEach(function(element) {
      self.optScores[element] = 0;
    })
  }
  
  Career.prototype.argolithmCareer = function (point, group) {
    var self = this;
    Object.keys(this.optScores).forEach((item) => {
      if (item == group && typeof this.optScores[item] == "number") {
        self.optScores[item] += Number(point);  
      }
    })
  }
  
  //compare value of object
  Career.prototype.compareCareer = function () { 
    var self = this;
    var max = Math.max(...Object.values(this.optScores)),
      getKeyMax = Object.keys(this.optScores).filter(function(key) {
        return self.optScores[key]==max;
      });

      if (getKeyMax.length == 1) {
      var isNumberType = this.listType.findIndex(function(item) {
        return item == getKeyMax[0];
      });
  
      this.dataDiagnose.postData.result_type = 'TYPE'+(isNumberType+1);
      document.querySelector(".progress-bar__inner").style.width = "100%";
      this.disableOptionAnswer();
      this.dataDiagnose.postData.data = this.mapToString(dataAnswer);
      this.postMessage('postData', this.dataDiagnose.postData);
    } else if (getKeyMax.length > 1) {
      var keyLastCareer = 'Q26';
      if (this.keyExistInObj(this.dataDiagnose.listQuestion, keyLastCareer)) {
        this.createLastQsCareer(keyLastCareer);
      }
    } 
  }
  
  Career.prototype.createLastQsCareer = function (key) {
    var self = this,  
      lastQsCareer = this.dataDiagnose.listQuestion[key];
    
    /**
     *  @description Fix bug object return order random
     *  Random sort key key object
     */ 
    var orderedLastQsCareer = Object.keys(lastQsCareer).sort().reduce(
      function(obj, key) { 
        obj[key] =lastQsCareer[key]; 
        return obj;
      }, 
      {}
    );

    var filterOptionLastCareer = Object.fromEntries(
        Object.entries(orderedLastQsCareer).filter(function([key, value]) {
          return key !== "text";
        })),
      answerList = document.querySelector('.qs-answer');
    
    self.dataDiagnose.maxDiagnose +=1;
    self.dataDiagnose.numberQuestion +=1;
    if (self.checkObjNotEmpty(lastQsCareer)) {
      this.createQuestion(lastQsCareer);
    }
  
    answerList.innerHTML = "";
    if (self.checkObjNotEmpty(filterOptionLastCareer)) {
      for (var option in filterOptionLastCareer) { 
        function evtCheckHandler(e) {
          var type =  e.target.value;

          self.dataDiagnose.postData.result_type = type;
          self.disableOptionAnswer();
          document.querySelector(".progress-bar__inner").style.width = "100%";

          // add option select to obj
          //self.dataDiagnose.postData.data[self.dataDiagnose.numberQuestion] = e.target.value;
          dataAnswer.set(self.dataDiagnose.numberQuestion, e.target.value);
          self.dataDiagnose.postData.data = self.mapToString(dataAnswer);
          self.postMessage('postData', self.dataDiagnose.postData);
        }
    
        answerList.appendChild(
          this.ComponentOptionAnswer({
            id: option,
            name: "", 
            value: option, 
            data_text: filterOptionLastCareer[option],
            text_label: filterOptionLastCareer[option], 
            evtCheckHandler: evtCheckHandler })
            );
      }
    }
  }

    /**
   * Career anchor argolithm
   */
  window.Diagnosis = function() {
    baseQuestion.call(this);
  }
    
  extend(baseQuestion, Diagnosis);

  Diagnosis.prototype.init = function(params, isType) { 
    this.isType = isType;
    this.params = params;
    this.objDiagnosis()
  }

  Diagnosis.prototype.objDiagnosis = function () {
    this.dataDiagnose.listQuestion = this.params.items;
    this.dataDiagnose.postData.type = this.isType;
    this.dataDiagnose.maxDiagnose = this.params.question_count;
    this.dataDiagnose.maxDiagnoseNew = this.params.question_max;

    const arrayFromObject = Object.values(this.dataDiagnose.listQuestion);

    const elementWithOrder1 = arrayFromObject.find(item => item.order === 1);
    const keyWithOrder1 = Object.keys(this.dataDiagnose.listQuestion).find(key => this.dataDiagnose.listQuestion[key] === elementWithOrder1);

    this.createDiagnoseQs(this.dataDiagnose.listQuestion[keyWithOrder1]);
    this.createDiagnoseQsNew(this.dataDiagnose.listQuestion[keyWithOrder1], keyWithOrder1, elementWithOrder1.order)
    this.showProgressNew(keyWithOrder1, elementWithOrder1.order);  
  }
  
  var isBaseQs = new baseQuestion();
  
  window.isDiagnose = function(params) { 
    var e = null, isSuccess = false;
    try { 
      switch((params.type||'').toLowerCase()) {
        case "ios":
          var ios = new iOS();
           break;
        case "android": 
          var android = new Android();
          break;
        default:
      }
      isBaseQs.init(params);
      isSuccess = true;
    } catch (error) {
      e = error.message;
    }
    isBaseQs.postMessage('loadFinished', {error: e, "success": isSuccess});
    return isSuccess;
  }
  isBaseQs.postMessage('javascriptLoaded', {"success": true});
})()