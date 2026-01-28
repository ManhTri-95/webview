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
      console.log(this.destination)
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
  }j=keepAlive
   
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
    if(!typeDiagnose) return;

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
    console.log( { type: typeDiagnose });
    this.postMessage('toPage', { type: typeDiagnose });
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
    this.postMessage('backPage', { "value":"top"})
    document.querySelector('.modal').classList.remove("fadeinBottom");

    setTimeout(function() {
      self.restartDiagnose();
      console.log(self.dataDiagnose);
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

isDiagnose({
  "type":"ios",
  "device":"iPhone 8", 
  "destination": "", 
  "data":{
    "start_page": {
        "start_page": {
            "text_top": "あなたのキャリアを導く！性格・適職診断",
            "img": "https://d2p333gdzaltfu.cloudfront.net/diagnostic/first_page.png",
            "text_bottom": "あなたは、仕事でやりたいことはありますか？<br />\n        <br />\nこの診断では、仕事でやりたいことが決まっている方には「あなたの性格から導くステップアップ方法」を、決まっていない方には「あなたの適性」を診断します。あなたのキャリアイメージが少しでも明るくなり、よりマッチしたお仕事が見つかることを祈っています。"
        },
        "first_question": {
            "text": "今、仕事でやりたいことは決まっていますか？",
            "yes": "enneagram",
            "no": "career_anchor"
        }
    },
    "career_anchor": {
        "items": {
            "Q2": {
                "text": "得意分野があり、それについて周囲の人からよく聞かれることがある",
                "yes": "Q3",
                "no": "Q3",
                "group": "B"
            },
            "Q3": {
                "text": "チームを盛り上げて成果を得ることに、喜びや充実感を覚える",
                "yes": "Q4",
                "no": "Q4",
                "group": "A"
            },
            "Q4": {
                "text": "自分のペースを守りながら、仕事を進めていくことが好きなほうだ",
                "yes": "Q5",
                "no": "Q5",
                "group": "E"
            },
            "Q5": {
                "text": "目の前の自由よりも、将来的な安定や安心を選ぶタイプだと思う",
                "yes": "Q6",
                "no": "Q6",
                "group": "C"
            },
            "Q6": {
                "text": "独自のアイデアや新しい発想などを考えるのが得意なほうだ",
                "yes": "Q7",
                "no": "Q7",
                "group": "D"
            },
            "Q7": {
                "text": "仕事で最も良かったと思うのは、社会の役に立っていると実感できたときだ",
                "yes": "Q8",
                "no": "Q8",
                "group": "F"
            },
            "Q8": {
                "text": "急なトラブルや壁にぶつかったときこそ、逆に燃えてくるほうだ",
                "yes": "Q9",
                "no": "Q9",
                "group": "G"
            },
            "Q9": {
                "text": "家族やプライベートを犠牲にする仕事なら、断るのも仕方ないと思う",
                "yes": "Q10",
                "no": "Q10",
                "group": "H"
            },
            "Q10": {
                "text": "専門的なスキルや体験を積むことが着実な成功につながると信じている",
                "yes": "Q11",
                "no": "Q11",
                "group": "B"
            },
            "Q11": {
                "text": "多くの人に良い影響を与え、育成するポジションを目指している",
                "yes": "Q12",
                "no": "Q12",
                "group": "A"
            },
            "Q12": {
                "text": "自由であればあるほど、パワーに満ちて良い結果を出せると思う",
                "yes": "Q13",
                "no": "Q13",
                "group": "E"
            },
            "Q13": {
                "text": "肩書や給与体制の保証がしっかりしていないと落ち着いて仕事ができない",
                "yes": "Q14",
                "no": "Q14",
                "group": "C"
            },
            "Q14": {
                "text": "企業のトップを狙うよりも、自分で組織をつくることに興味がある",
                "yes": "Q15",
                "no": "Q15",
                "group": "D"
            },
            "Q15": {
                "text": "自分の働きによって周囲から感謝されることが何よりもうれしい",
                "yes": "Q16",
                "no": "Q16",
                "group": "F"
            },
            "Q16": {
                "text": "大きなチャンスや新しい目標を与えられると一気にテンションが上がる",
                "yes": "Q17",
                "no": "Q17",
                "group": "G"
            },
            "Q17": {
                "text": "自分ならプライベートでも仕事でもうまくやれる！と密かに思っている",
                "yes": "Q18",
                "no": "Q18",
                "group": "H"
            },
            "Q18": {
                "text": "管理職になるよりも、現場の一線にいるほうが幸せだと感じる",
                "yes": "Q19",
                "no": "Q19",
                "group": "B"
            },
            "Q19": {
                "text": "チームや組織を引っ張るようなポジションに強い憧れがある",
                "yes": "Q20",
                "no": "Q20",
                "group": "A"
            },
            "Q20": {
                "text": "独創的な考え方をもち、組織のルールに縛られるのが苦手なほうだ",
                "yes": "Q21",
                "no": "Q21",
                "group": "E"
            },
            "Q21": {
                "text": "変化が少ない平穏な環境が自分にとっての理想の職場だと思う",
                "yes": "Q22",
                "no": "Q22",
                "group": "C"
            },
            "Q22": {
                "text": "社会にまだないものやサービスを創りだせたとき、生きている喜びを感じる",
                "yes": "Q23",
                "no": "Q23",
                "group": "D"
            },
            "Q23": {
                "text": "自分が出世することよりも、今の社会が良くなることに興味がある",
                "yes": "Q24",
                "no": "Q24",
                "group": "F"
            },
            "Q24": {
                "text": "同じような毎日の繰り返しだと気持ちが沈んでくるのを感じる",
                "yes": "Q25",
                "no": "Q25",
                "group": "G"
            },
            "Q25": {
                "text": "仕事も家庭もうまくやるために準備を怠らないようにしている",
                "yes": "Q26",
                "no": "Q26",
                "group": "H"
            },
            "Q26": {
                "text": "次のうち、あなたが人生で不可欠だと思うものはどれ？",
                "TYPE1": "物事を見通せる視野の広さ",
                "TYPE2": "熱中してやり通せる集中力",
                "TYPE3": "自分を守ってくれる後ろ盾",
                "TYPE4": "ゼロから１を生みだす行動力",
                "TYPE5": "自分らしさを大切にする気持ち",
                "TYPE6": "人の想いに寄り添える共感力",
                "TYPE7": "決してあきらめない反骨精神",
                "TYPE8": "必要不要を見極められる調整力"
            }
        },
        "answers": [
            {
                "point": 6,
                "text": "まったくその通りだと思う"
            },
            {
                "point": 4,
                "text": "どちらかというとそう思う"
            },
            {
                "point": 2,
                "text": "どちらかというとそう思わない"
            },
            {
                "point": 0,
                "text": "まったくそう思わない"
            }
        ]
    },
    "enneagram": {
        "items": {
            "Q2": {
                "text": "自分は行動力があるほうだ ",
                "yes": "Q3",
                "no": "Q4",
                "group": 2
            },
            "Q3": {
                "text": "人についていくより引っ張っていきたいほうだ",
                "yes": "Q5",
                "no": "Q6",
                "group": 3
            },
            "Q4": {
                "text": "変化よりも安定を望むほうだ",
                "yes": "Q7",
                "no": "Q6",
                "group": 3
            },
            "Q5": {
                "text": "人前で話すのが得意なほうだ",
                "yes": "Q8",
                "no": "Q9",
                "group": 4
            },
            "Q6": {
                "text": "人と一緒に出かけるのが好きだ",
                "yes": "Q9",
                "no": "Q10",
                "group": 4
            },
            "Q7": {
                "text": "友達になるまでかなり時間がかかるほうだ",
                "yes": "Q11",
                "no": "Q10",
                "group": 4
            },
            "Q8": {
                "text": "資格を取るのが好きなほうだ",
                "yes": "Q12",
                "no": "Q13",
                "group": 5
            },
            "Q9": {
                "text": "本を読んだり、勉強系の動画をよく見たりする",
                "yes": "Q13",
                "no": "Q14",
                "group": 5
            },
            "Q10": {
                "text": "夢中になれる趣味や習い事がある",
                "yes": "Q14",
                "no": "Q15",
                "group": 5
            },
            "Q11": {
                "text": "休日は家でのんびり過ごすのが好きだ",
                "yes": "Q16",
                "no": "Q15",
                "group": 5
            },
            "Q12": {
                "text": "仕事で大きく成功したいと願っている",
                "yes": "Q17",
                "no": "Q18",
                "group": 6
            },
            "Q13": {
                "text": "人に目標や夢を語ることがある",
                "yes": "Q18",
                "no": "Q19",
                "group": 6
            },
            "Q14": {
                "text": "集中力があるほうだ",
                "yes": "Q19",
                "no": "Q20",
                "group": 6
            },
            "Q15": {
                "text": "思っていることの半分も言えないことが多い",
                "yes": "Q21",
                "no": "Q20",
                "group": 6
            },
            "Q16": {
                "text": "率直に言うと、転職には興味がないほうだ",
                "yes": "Q22",
                "no": "Q21",
                "group": 6
            },
            "Q17": {
                "text": "何事も絶対に失敗したくないと思う",
                "yes": "Q23",
                "no": "Q24",
                "group": 7
            },
            "Q18": {
                "text": "人に認められたいという気持ちが強い",
                "yes": "Q24",
                "no": "Q25",
                "group": 7
            },
            "Q19": {
                "text": "どちらかというとルーティーンワークは苦手だ",
                "yes": "Q25",
                "no": "Q26",
                "group": 7
            },
            "Q20": {
                "text": "人の気持ちをくみ取るのが苦手なほうだ",
                "yes": "Q26",
                "no": "Q27",
                "group": 7
            },
            "Q21": {
                "text": "寄付やボランティア活動をしたことがある",
                "yes": "Q27",
                "no": "Q28",
                "group": 7
            },
            "Q22": {
                "text": "出世や自己成長にはそれほど興味がないほうだ",
                "yes": "Q29",
                "no": "Q28",
                "group": 7
            },
            "Q23": {
                "text": "社会に影響をもつような成功者に憧れる",
                "yes": "Q30",
                "no": "Q31",
                "group": 8
            },
            "Q24": {
                "text": "やるなら何事もトップを目指したいと思う",
                "yes": "Q31",
                "no": "Q32",
                "group": 8
            },
            "Q25": {
                "text": "成功するには必死に努力しないとダメだと思う",
                "yes": "Q32",
                "no": "Q33",
                "group": 8
            },
            "Q26": {
                "text": "何かを決断するときは直感よりデータを重視する",
                "yes": "Q34",
                "no": "Q33",
                "group": 8
            },
            "Q27": {
                "text": "仕事は個人よりチームで進めていきたいほうだ",
                "yes": "Q35",
                "no": "Q34",
                "group": 8
            },
            "Q28": {
                "text": "人に何かを教えてあげることが得意なほうだ",
                "yes": "Q35",
                "no": "Q36",
                "group": 8
            },
            "Q29": {
                "text": "うまく言葉にできず我慢してしまうことがある",
                "yes": "Q37",
                "no": "Q36",
                "group": 8
            },
            "Q30": {
                "text": "誰からも認められる理想の自分を目指している",
                "yes": "TYPE1",
                "no": "TYPE3",
                "group": 9
            },
            "Q31": {
                "text": "実現しない目標はないと強く信じている",
                "yes": "TYPE3",
                "no": "TYPE8",
                "group": 9
            },
            "Q32": {
                "text": "どんなことでも粘り強く頑張れるほうだ",
                "yes": "TYPE8",
                "no": "TYPE7",
                "group": 9
            },
            "Q33": {
                "text": "たいていのことは明るく乗り越えられる自信がある",
                "yes": "TYPE7",
                "no": "TYPE4",
                "group": 9
            },
            "Q34": {
                "text": "ものづくりやクリエイティブなことが好きだ",
                "yes": "TYPE4",
                "no": "TYPE5",
                "group": 9
            },
            "Q35": {
                "text": "仕事は知的好奇心を満たされるかどうかで選ぶ",
                "yes": "TYPE5",
                "no": "TYPE2",
                "group": 9
            },
            "Q36": {
                "text": "自分より周りの幸せを優先してしまうことが多い ",
                "yes": "TYPE2",
                "no": "TYPE6",
                "group": 9
            },
            "Q37": {
                "text": "仕事では、経済的な安定が何より大切だと思う",
                "yes": "TYPE6",
                "no": "TYPE9",
                "group": 9
            }
        },
        "answers": [
            {
                "point": "yes",
                "text": "はい"
            },
            {
                "point": "no",
                "text": "いいえ"
            }
        ]
    },
    "html": "https://www.test.learningpocket.com/diagnostic_new/diagnose.html",
    "p16_types": {
        "title": "―上―上―上―上―上―上―上―上―上―上―上―上―上―上―上",
        "img": "https://test.learningpocket.com/uploads/diagnostic/images/i0FgZtTncttix1Jl.jpg",
        "description": "―相性の良い上司・同僚のタイプもわかる！― di test",
        "mode": "TREE",
        "question_max": 10,
        "question_count": 4,
        "option_max": 1,
        "result_total": 1,
        "items": {
            "10": {
                "text": "",
                "order": 10,
                "max_option": 1,
                "count_option": 1,
                "answers": {
                    "h595Z03t6IwNeYUGbcX": {
                        "text": "1",
                        "point": 0,
                        "order": 0,
                        "next": ""
                    }
                }
            },
            "9": {
                "text": "9",
                "order": 9,
                "max_option": 1,
                "count_option": 1,
                "answers": {
                    "X515Q3I7bwsU2kMOAiN": {
                        "text": "1",
                        "point": 0,
                        "order": 0,
                        "next": ""
                    }
                }
            },
            "8": {
                "text": "",
                "order": 8,
                "max_option": 1,
                "count_option": 1,
                "answers": {
                    "u5G5kBpfRMHgrF9v483": {
                        "text": "1",
                        "point": 0,
                        "order": 0,
                        "next": "9"
                    }
                }
            },
            "7": {
                "text": "",
                "order": 7,
                "max_option": 1,
                "count_option": 1,
                "answers": {
                    "b5s5lPg3O18S9zTpZX7": {
                        "text": "1",
                        "point": 0,
                        "order": 0,
                        "next": "8"
                    }
                }
            },
            "6": {
                "text": "",
                "order": 6,
                "max_option": 1,
                "count_option": 1,
                "answers": {
                    "u5l56QZU8T9G4bOp5MK": {
                        "text": "1",
                        "point": 0,
                        "order": 0,
                        "next": "7"
                    }
                }
            },
            "5": {
                "text": "5",
                "order": 5,
                "max_option": 1,
                "count_option": 1,
                "answers": {
                    "c5P57DQSuiM4qnY8wbG": {
                        "text": "1",
                        "point": 0,
                        "order": 0,
                        "next": "9"
                    }
                }
            },
            "4": {
                "text": "",
                "order": 4,
                "max_option": 1,
                "count_option": 1,
                "answers": {
                    "N5a5J4I2tvYFQT3CxwH": {
                        "text": "1",
                        "point": 0,
                        "order": 0,
                        "next": "5"
                    }
                }
            },
            "3": {
                "text": "3",
                "order": 3,
                "max_option": 1,
                "count_option": 1,
                "answers": {
                    "z595W754xmraZkoXRB1": {
                        "text": "1",
                        "point": 0,
                        "order": 0,
                        "next": "5"
                    }
                }
            },
            "2": {
                "text": "2",
                "order": 2,
                "max_option": 1,
                "count_option": 1,
                "answers": {
                    "U5G5tFDkfE3IrnwPH6T": {
                        "text": "1",
                        "point": 0,
                        "order": 0,
                        "next": ""
                    }
                }
            },
            "1": {
                "text": "1",
                "order": 1,
                "max_option": 1,
                "count_option": 1,
                "answers": {
                    "Z5e5LWTctQnsI0VaCSh": {
                        "text": "1",
                        "point": 2,
                        "order": 0,
                        "next": "3"
                    }
                }
            }
        }
    },
}})

  //isResult({"type":"android","version":32,"device_name":"Pixel 3a","data":{"text":"生活様式タイプ","img":"https://d2p333gdzaltfu.cloudfront.net/diagnostic/career-anchor/type_8.png","aptitude":"あなたは、日々をバランスよく楽しみたいと願っている人です。一見、おっとりしているよ\nうに見えても、仕事とプライベートを上手に両立させながら、どちらの幸せもつかみたいと\nいうしっかり者でもあります。ハードすぎない仕事を長く続けていきたいあなたには、大手\n企業の会社員や残業の少ないデスクワークなどが適しています。育児休暇、有給休暇などの\n制度が整った組織に守られながら、家庭や子育ての時間をもつことが人生を輝かせるでし\nょう。","advice":"あなたがオンでもオフでも笑顔でいられるキーワードは、「両立」「家庭的」「充足感」。仕事\nもプライベートも大切にして両立させることで、キャリアアップしつつも家庭的な幸せを\n得ることができます。きっと年を重ねるごとに自らの人生が充足感に満ちてくることでし\nょう。これは、平凡な幸せのように見えて現代ではハードルの高い理想的な人生でもありま\nす。しっかりと計画性をもって資格取得や人生設計などに取り組むなど、準備することが重\n要です。","customer_comment":[{"text":"現状をお話ししたところ優しく受け止めていただき、これから目指す方向や自分に必要なことを的確に示してもらえました。（30代/女性）","img":"https://d2p333gdzaltfu.cloudfront.net/diagnostic/ctm_comment/voice_01.png"},{"text":"とてもフレンドリーに話してくださり、ポジティブな気持ちになれました。（60代/女性）","img":"https://d2p333gdzaltfu.cloudfront.net/diagnostic/ctm_comment/voice_02.png"},{"text":"世の中のキャリアコンサルタントにはこちらの相談をきちんと聞かずに一方的に話すような方もいますが、スタッフサービスのコンサルタントは共感し、励まし、解決の糸口を見つけてくれました。（40代/女性）","img":"https://d2p333gdzaltfu.cloudfront.net/diagnostic/ctm_comment/voice_03.png"}],"top_rc":{},"bottom_rc":{"doc_id":"129","doc_code":"bdghrkvri8lho1VKCRF","doc_title":"test document 45 new","doc_type":"YOUTUBE","doc_thumb":"https://test-lac.learningpocket.com/uploads/teacher/EvVbU9pomcFgD1JlSt/oi53yrc6gt2f/mt_1253922500_v1_khAi1h8rk.PNG","memo":"このページでは、診断コンテンツ結果ページに表示される動画と紹介文を設定するページです"},"type":"CAREER_ANCHOR","result_type":"TYPE8","user_type":"STAFF","html":"https://test-lac.learningpocket.com/diagnostic/result.html"}})

