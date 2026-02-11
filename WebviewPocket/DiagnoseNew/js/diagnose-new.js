(function () {
  const dataAnswer = new Map();

  // Base Question Class
  class BaseQuestion {
    constructor() {
      this.dataDiagnose = {
        currentQuestion: 0,
        numberQuestion: 1,
        startQuestion: 2,
        maxDiagnose: 0,
        maxDiagnoseNew: 0,
        listQuestion: {},
        optionAnswer: {},
        postData: {
          type: null,
          result_type: null,
          data: "",
        }
      };
    }

    isParamsDiagonse = (obj) => 'career_anchor' in obj && 'enneagram' in obj && 'start_page' in obj && 'contents' in obj;

    init(params) {
      if (this.checkObjNotEmpty(params)) {
        this.response = params;
        this.data = this.response.data;
        this.destination = this.response.destination || null;
        this.dataEnneagram = this.data.enneagram;
        this.dataCareer = this.data.career_anchor;
        this.dataContents = this.data.contents || {};
        this.startPage = this.data.start_page.start_page;
        this.baseUrl = `https://${location.host}`;
        this.createUIPageDiagnose();      
        this.createUIPageStart();
        
        if (this.destination) {
          const typeDiagnose = this.destination;
          this.initDiagnoseByType(typeDiagnose);
          document.querySelector('body').appendChild(this.ComponentModal());
          document.getElementById("diagnose").classList.remove('hide');
          document.getElementById("start_diagnose").classList.add('hide');
          this.fadeInRight(document.getElementById("diagnose"));
        }
      } else {
        this.postMessage('logError', { error: 'Data passed in is correct' });
      }
    }

    initDiagnoseByType(typeDiagnose) {
      const diagnoseMap = {
        'enneagram': () => new Enneagrame().initEnneagrame(this.dataEnneagram, typeDiagnose),
        'career_anchor': () => new Career().initCareer(this.dataCareer, typeDiagnose)
      };
      
      // Check if typeDiagnose exists in contents
      if (this.dataContents.hasOwnProperty(typeDiagnose)) {
        new Diagnosis().init(this.dataContents[typeDiagnose], typeDiagnose);
      } else if (diagnoseMap[typeDiagnose]) {
        diagnoseMap[typeDiagnose]();
      }
    }

    createComponent(tag, className = "", textContent = "", attributes = {}) {
      const element = document.createElement(tag);
      element.className = className;
      element.innerHTML = textContent;
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
      return element;
    }

    baseMatchStringUrl(str) {
      const tempBrPlaceholder = "__TEMP_BR_PLACEHOLDER__";
      const stringWithoutBr = str.replace(/<br\s*\/?>/gi, tempBrPlaceholder);
      const removeBrFromHref = (href) => href.replace(/__TEMP_BR_PLACEHOLDER__/g, "");

      window.onClick = (elem) => {
        const url = elem.getAttribute("data-url");
        this.postMessage('toLinkBrowser', { value: url });
      };

      const regex = /http[s]?:\/\/\S+/gi;
      const result = stringWithoutBr.replace(regex, (match) => {
        const hrefWithoutBr = removeBrFromHref(match);
        const anchorTag = document.createElement("a");
        anchorTag.setAttribute("onclick", "onClick(this)");
        anchorTag.setAttribute("href", "javascript:void(0)");
        anchorTag.setAttribute("data-url", hrefWithoutBr);
        anchorTag.textContent = match;
        return anchorTag.outerHTML;
      });

      return result.replace(new RegExp(tempBrPlaceholder, "g"), "<br>");
    }

    createUIPageStart() {
      const { text_top, img: startPageImg, text_bottom } = this.startPage;
      const textLabel = "診断コンテンツ";
      const isPage = "start_diagnose";
      const body = document.body;

      const container = this.createComponent('div', 'container start-diagnose', '', { id: 'start_diagnose' });
      const main = this.createComponent('section', 'main-container');

      // Dynamically create components from contents (sorted by order)
      const sortedContents = Object.entries(this.dataContents).sort(([, a], [, b]) => {
        const orderA = a.order !== undefined ? a.order : Infinity;
        const orderB = b.order !== undefined ? b.order : Infinity;
        return orderA - orderB;
      });

      console.log(sortedContents);

      sortedContents.forEach(([contentKey, contentData]) => {
        // Handle career_enneagram as a group that renders startPage data + enneagram and career_anchor buttons together
        if (contentKey === 'career_enneagram') {
          // Render startPage data first
          const elTitle = this.createComponent('div', 'header-title text-truncate', text_top);
          const elBanner = this.createComponent('div', 'banner mt-15 text-center', '', { id: 'banner' });
          elBanner.appendChild(this.createComponent('img', '', '', { src: startPageImg }));
          const elContent = this.createComponent('div', 'p-15', text_bottom);
          
          main.appendChild(elTitle);
          main.appendChild(elBanner);
          main.appendChild(elContent);

          // Create container for both buttons
          const elBtnGroup = this.createComponent('div');
          
          // Enneagram button
          const elBtnStartEnneagram = this.createComponent('div', 'p-15 text-center');
          elBtnStartEnneagram.appendChild(this.ComponentButton({
            text: '<small class="mr-7px">やりたいことが決まっている方</small><br/>診断スタート！',
            isClass: "btn--primary btn-start w-100",
            additionalAttributes: { 'data-type': 'enneagram' },
            pressHandler: this.evtNextPageDiagnose.bind(this)
          }));

          // Career anchor button
          const elBtnStartCareerAnchor = this.createComponent('div', 'p-15 text-center');
          elBtnStartCareerAnchor.appendChild(this.ComponentButton({
            text: '<small class="mr-7px">やりたいことが決まっていない方</small><br/>診断スタート！',
            isClass: "btn--primary btn-start w-100",
            additionalAttributes: { 'data-type': 'career_anchor' },
            pressHandler: this.evtNextPageDiagnose.bind(this)
          }));

          elBtnGroup.appendChild(elBtnStartEnneagram);
          elBtnGroup.appendChild(elBtnStartCareerAnchor);
          main.appendChild(elBtnGroup);
        } else if (contentData) {
          // Render other content items - only render components if data exists
          if (contentData.title) {
            const elComponentTitle = this.createComponent('div', 'header-title', contentData.title);
            main.appendChild(elComponentTitle);
          }

          if (contentData.sub_title) {
            const elComponentSubTitle = this.createComponent('div', 'text-center', contentData.sub_title);
            main.appendChild(elComponentSubTitle);
          }

          if (contentData.img) {
            const elComponentBanner = this.createComponent('div', 'banner mt-15 text-center', '');
            elComponentBanner.appendChild(this.createComponent('img', '', '', { src: contentData.img }));
            main.appendChild(elComponentBanner);
          }

          if (contentData.description) {
            const elComponentContent = this.createComponent('div', 'p-15', this.baseMatchStringUrl(contentData.description));
            main.appendChild(elComponentContent);
          }

          const elComponentBtn = this.createComponent('div', 'p-15 text-center');
          elComponentBtn.appendChild(this.ComponentButton({
            text: `<small class="mr-7px">${contentData.title || ''}</small></br>診断スタート！`,
            isClass: "btn--primary btn-start w-100",
            additionalAttributes: { 'data-type': contentKey },
            pressHandler: this.evtNextPageDiagnose.bind(this)
          }));
          main.appendChild(elComponentBtn);
        }
      });

      container.prepend(this.ComponentHeader(textLabel, isPage), main);
      body.prepend(container);
    }

    createUIPageDiagnose() {
      const isPage = "diagnose";
      const textLabel = "";
      const body = document.body;

      const container = this.createComponent('div', 'container hide', '', { id: 'diagnose' });
      const main = this.createComponent('section', 'main-container');
      const wrapperQs = this.createComponent('div', 'wrapper-qs');
      const qsItem = this.createComponent('div', 'qs-item');
      const qsItemTop = this.createComponent('div', 'qs-item__top');
      const qsNumber = this.createComponent('div', 'qs-number');
      const textNumber = this.createComponent('span', '', '', { id: 'number-question' });
      const qsItemBody = this.createComponent('div', 'qs-item__body');
      const qsQuestion = this.createComponent('div', 'qs-question', '', { id: 'question' });
      const qsAnswer = this.createComponent('div', 'qs-answer');

      qsNumber.appendChild(textNumber);
      qsItemTop.appendChild(qsNumber);
      qsItemBody.prepend(qsQuestion, qsAnswer, this.ComponentProgress());
      qsItem.prepend(qsItemTop, qsItemBody);
      wrapperQs.appendChild(qsItem);
      main.appendChild(wrapperQs);
      container.prepend(this.ComponentHeader(textLabel, isPage), main);
      body.prepend(container);
    }

    ComponentHeader(text, typePage) {
      const header = this.createComponent('herder', 'header-container');
      const headerTop = this.createComponent('div');
      const btnTop = this.createComponent('a');
      const icon = this.createComponent('img');
      const headerLabel = this.createComponent('div', 'header-label text-truncate', text || '');

      const headerConfig = {
        'start_diagnose': {
          topClass: 'header-top',
          btnClass: 'btn-top',
          icon: 'ic_arrow_back.png',
          handler: this.evtBackHomPage.bind(this)
        },
        'diagnose': {
          topClass: 'header-top text-right',
          btnClass: 'btn-top btn-open',
          icon: 'icon-close.png',
          handler: this.evtOpenModal.bind(this),
          iconWidth: '33'
        }
      };

      const config = headerConfig[typePage];
      if (config) {
        headerTop.className = config.topClass;
        btnTop.className = config.btnClass;
        icon.setAttribute("src", `${this.baseUrl}/assets/images/${config.icon}`);
        if (config.iconWidth) icon.setAttribute("width", config.iconWidth);
        btnTop.addEventListener("click", config.handler);
      }

      btnTop.appendChild(icon);
      headerTop.appendChild(btnTop);
      header.prepend(headerTop, headerLabel);
      return header;
    }

    ComponentProgress() {
      const progressWrapper = this.createComponent('div', 'qs-progress');
      const textProgressLeft = this.createComponent('span', 'progress-bar-text left', '0%');
      const textProgressRight = this.createComponent('span', 'progress-bar-text right', '100%');
      const progressBar = this.createComponent('div', 'progress-bar');
      const progressBarInner = this.createComponent('div', 'progress-bar__inner', '', { id: 'progressMeter' });

      progressBar.appendChild(progressBarInner);
      progressWrapper.prepend(textProgressLeft, textProgressRight, progressBar);
      return progressWrapper;
    }

    ComponentButton({ text, isClass, pressHandler, additionalAttributes = {} }) {
      const button = this.createComponent('button', `btn ${isClass}`, text);
      Object.entries(additionalAttributes).forEach(([key, value]) => {
        button.setAttribute(key, value);
      });
      button.addEventListener("click", pressHandler);
      return button;
    }

    ComponentOptionAnswer({ id, name, value, data_text, data_point = "", data_group = "", data_type = "", data_next = "", data_question_order = "", text_label, evtCheckHandler }) {
      const answerItemDiv = this.createComponent('div', 'qs-answer__option');
      const answerCheckInput = this.createComponent('input', '', '', {
        type: 'radio',
        value: value,
        id: id,
        name: name,
        'data-point': data_point,
        'data-group': data_group,
        'data-type': data_type,
        'data_text': data_text,
        'data_next': data_next,
        'data_question_order': data_question_order
      });

      answerCheckInput.addEventListener("change", evtCheckHandler);
      const answerLabel = this.createComponent('label', 'qs-answer-item text-center', text_label, { for: id });
      answerItemDiv.appendChild(answerCheckInput);
      answerItemDiv.appendChild(answerLabel);
      return answerItemDiv;
    }

    ComponentModal() {
      const modal = this.createComponent('div', 'modal');
      const modalDialog = this.createComponent('div', 'modal-dialog');
      const modalBody = this.createComponent('div', 'modal-body');
      const modalFooter = this.createComponent('div', 'modal-footer text-center');
      const textTitle = this.createComponent('p', 'text-center modal-title fs-16', '診断を続けますか？');
      const footerInner = this.createComponent('div', 'group-btn');

      footerInner.prepend(
        this.ComponentButton({
          text: "やめる",
          isClass: "btn--light",
          pressHandler: this.evtBackStartPage.bind(this)
        }),
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

    createDiagnoseQs(diagnoseQuestion) {
      if (this.checkObjNotEmpty(diagnoseQuestion)) {
        this.createQuestion(diagnoseQuestion);
        this.createAnswerOption(diagnoseQuestion);
      }
    }

    createDiagnoseQsNew(diagnoseQuestion, keyQs, orderQs) {
      if (this.checkObjNotEmpty(diagnoseQuestion)) {
        this.createQuestion(diagnoseQuestion);
        this.createAnswerOptionDiagnosisNew(diagnoseQuestion, keyQs, orderQs);
      }
    }

    createQuestion(diagnoseQuestion) {
      if (this.keyExistInObj(diagnoseQuestion, 'text')) {
        const questionNumber = document.getElementById("number-question");
        const questionsText = document.getElementById("question");
        questionsText.textContent = diagnoseQuestion.text;
        questionNumber.textContent = this.dataDiagnose.numberQuestion;
      }
    }

    createAnswerOptionDiagnosisNew(diagnoseQuestion, keyQs, orderQs) {
      const answerOptionList = diagnoseQuestion.answers;
      const elAnswerList = document.querySelector('.qs-answer');
      elAnswerList.innerHTML = "";
      const fragment = document.createDocumentFragment();

      Object.keys(answerOptionList)
        .sort((a, b) => answerOptionList[a].order - answerOptionList[b].order)
        .forEach(key => {
          const option = answerOptionList[key];
          fragment.appendChild(
            this.ComponentOptionAnswer({
              id: `diagnose-${this.dataDiagnose.numberQuestion}-${key}`,
              name: `diagnose[${this.dataDiagnose.numberQuestion}][]`,
              value: key,
              data_text: option.text,
              data_point: option.point,
              data_group: option.group,
              text_label: option.text,
              data_next: option.next,
              data_question_order: orderQs,
              evtCheckHandler: (e) => this.handleAnswerSelection(e, keyQs, orderQs)
            })
          );
        });
      
      elAnswerList.appendChild(fragment);
    }

    handleAnswerSelection(e, keyQs, orderQs) {
      const toDiagnose = e.target.getAttribute("data_next");

      dataAnswer.set(keyQs, e.target.value);

      if (!toDiagnose) {
        this.disableOptionAnswer();
        this.showProgressNew(orderQs, toDiagnose);
        this.dataDiagnose.postData.data = this.mapToString(dataAnswer);
        setTimeout(() => {
          this.postMessage("postData", this.dataDiagnose.postData);
        }, 500);
        return;
      }

      this.dataDiagnose.currentQuestion += 1;
      this.dataDiagnose.numberQuestion += 1;
      this.evtNextDiagnoseQsNew(toDiagnose);
    }

    createAnswerOption(diagnoseQuestion) {
      const answerList = document.querySelector('.qs-answer');
      answerList.innerHTML = "";
      const fragment = document.createDocumentFragment();

      Object.keys(this.dataDiagnose.optionAnswer).forEach(option => {
        const optionData = this.dataDiagnose.optionAnswer[option];
        fragment.appendChild(
          this.ComponentOptionAnswer({
            id: `diagnose-${this.dataDiagnose.numberQuestion}-${option}`,
            name: `diagnose[${this.dataDiagnose.numberQuestion}][]`,
            value: option,
            data_text: optionData.text,
            data_point: optionData.point,
            data_group: diagnoseQuestion.group,
            text_label: optionData.text,
            evtCheckHandler: (e) => this.handleTraditionalAnswerSelection(e, diagnoseQuestion)
          })
        );
      });
      
      answerList.appendChild(fragment);
    }

    handleTraditionalAnswerSelection(e, diagnoseQuestion) {
      const data_point = e.target.getAttribute("data-point");

      if (this.dataDiagnose.numberQuestion < this.dataDiagnose.maxDiagnose) {
        this.dataDiagnose.currentQuestion += 1;
        this.dataDiagnose.numberQuestion += 1;
        this.dataDiagnose.startQuestion += 1;

        if (this.dataDiagnose.postData.type === "enneagram") {
          const toDiagnose = diagnoseQuestion[data_point];
          dataAnswer.set(this.dataDiagnose.currentQuestion, toDiagnose);
        } else if (this.dataDiagnose.postData.type === "career_anchor") {
          const toDiagnose = `Q${this.dataDiagnose.startQuestion}`;
          this.argolithmCareer(data_point, e.target.getAttribute("data-group"));
          dataAnswer.set(this.dataDiagnose.currentQuestion, e.target.value);
        }
        this.evtNextDiagnoseQs(diagnoseQuestion[data_point] || `Q${this.dataDiagnose.startQuestion}`);
      } else {
        this.handleFinalAnswer(e, diagnoseQuestion, data_point);
      }
    }

    handleFinalAnswer(e, diagnoseQuestion, data_point) {
      switch (this.dataDiagnose.postData.type) {
        case "enneagram":
          dataAnswer.set(this.dataDiagnose.numberQuestion, diagnoseQuestion[data_point]);
          this.dataDiagnose.postData.result_type = diagnoseQuestion[data_point];
          this.disableOptionAnswer();
          document.querySelector(".progress-bar__inner").style.width = "100%";
          this.dataDiagnose.postData.data = this.mapToString(dataAnswer);
          this.postMessage("postData", this.dataDiagnose.postData);
          break;
        case "career_anchor":
          this.argolithmCareer(data_point, e.target.getAttribute("data-group"));
          dataAnswer.set(this.dataDiagnose.numberQuestion, e.target.value);
          this.compareCareer();
          break;
      }
    }

    disableOptionAnswer() {
      const answerOptions = document.querySelectorAll(".qs-answer__option");
      answerOptions.forEach(option => {
        option.classList.add("disabled", "not-allow");
      });
    }

    restartDiagnose() {
      this.dataDiagnose = {
        currentQuestion: 0,
        numberQuestion: 1,
        startQuestion: 2,
        maxDiagnose: 0,
        maxDiagnoseNew: 0,
        listQuestion: {},
        optionAnswer: {},   
        postData: {
          type: null,
          result_type: null,
          data: "",
        }
      };
      this.createQuestion(this.dataDiagnose.listQuestion);
      document.querySelector(".progress-bar__inner").style.width = "0%";
    }

    mapToString(map) {
      return `{${Array.from(map.entries()).map(([key, value]) => `"${key}": "${value}"`).join(', ')}}`;
    }

    evtBackHomPage() {
      this.postMessage('backPage', { value: "home" });
    }

    evtNextPageDiagnose(e) {
      const startPage = document.getElementById("start_diagnose");
      const diagnosePage = document.getElementById("diagnose");
      
      startPage.classList.add('hide');
      document.body.appendChild(this.ComponentModal());
      diagnosePage.classList.remove('hide');
      this.fadeInRight(diagnosePage);

      this.initDiagnoseByType(e.target.getAttribute('data-type'));
    }

    evtNextDiagnoseQs(key) {
      if (this.keyExistInObj(this.dataDiagnose.listQuestion, key)) {
        this.createDiagnoseQs(this.dataDiagnose.listQuestion[key]);
        this.showProgress();
      }
    }

    evtNextDiagnoseQsNew(key) {
      if (this.keyExistInObj(this.dataDiagnose.listQuestion, key)) {
        const question = this.dataDiagnose.listQuestion[key];
        this.showProgressNew(question.order, key);
        this.createDiagnoseQsNew(question, key, question.order);
      }
    }

    evtOpenModal() {
      document.querySelector('.modal').classList.add("fadeinBottom");
    }

    evtCloseModal() {
      document.querySelector('.modal').classList.remove("fadeinBottom");
    }

    evtBackStartPage() {
      const modal = document.querySelector('.modal');
      modal.classList.remove("fadeinBottom");
      
      setTimeout(() => {
        this.restartDiagnose();
        document.getElementById("diagnose").classList.add('hide');
        document.getElementById("start_diagnose").classList.remove('hide');
        modal.remove();
      }, 500);
      
      this.postMessage('backPage', { value: "top" });
    }

    showProgress() {
      const increment = Math.ceil((this.dataDiagnose.currentQuestion) / (this.dataDiagnose.maxDiagnose) * 100);
      const progressMeter = document.getElementById("progressMeter");
      progressMeter.style.width = `${increment}%`;
    }

    showProgressNew(orderQs, nextQs) {
      const progressMeter = document.getElementById("progressMeter");
      const totalQuestion = this.dataDiagnose.maxDiagnoseNew;
      const percentPerQuestion = (1 / totalQuestion) * 100;

      if (!nextQs) {
        progressMeter.style.width = '100%';
      } else {
        progressMeter.style.width = `${(orderQs - 1) * percentPerQuestion}%`;
      }
    }

    fadeInRight(elem) {
      const styleElem = window.getComputedStyle(elem);
      const matrix = new WebKitCSSMatrix(styleElem.transform);
      const widthDevice = window.innerWidth > 0 ? window.innerWidth : screen.width;

      if (matrix.m41 <= 0) {
        elem.style.transform = "translateX(0px)";
        return;
      }

      const offset = widthDevice >= 768 ? 50 : 15;
      elem.style.transform = `translateX(${Number(matrix.m41 - offset)}px)`;
      setTimeout(() => this.fadeInRight(elem), 10);
    }

    keyExistInObj(obj, key) {
      if (!obj.hasOwnProperty(key)) {
        this.postMessage('logError', { error: `key ${key} does not exist` });
        return false;
      }
      return true;
    }

    checkObjNotEmpty(obj) {
      if (Object.keys(obj).length === 0) {
        this.postMessage('logError', { error: 'Object is empty' });
        return false;
      }
      if (obj.constructor !== Object) {
        this.postMessage('logError', { error: 'Parameter is not a object' });
        return false;
      }
      return true;
    }

    postMessage(fncName, msg) {
      const msgStr = JSON.stringify(msg);
      if ('webkit' in window) {
        window.webkit.messageHandlers[fncName].postMessage(msgStr);
      } else if ('android' in window) {
        (window.android || window.Android)[fncName](msgStr);
      }
    }
  }

  // Enneagrame Class
  class Enneagrame extends BaseQuestion {
    constructor() {
      super();
    }

    initEnneagrame(params, isType) {
      this.isType = isType;
      this.params = params;
      this.objEenneagram();
    }

    objEenneagram() {
      this.dataDiagnose.listQuestion = this.params.items;
      this.dataDiagnose.optionAnswer = this.params.answers;
      this.dataDiagnose.postData.type = this.isType;
      this.dataDiagnose.maxDiagnose = 8;

      if (this.keyExistInObj(this.dataDiagnose.listQuestion, `Q${this.dataDiagnose.numberQuestion + 1}`)) {
        this.createDiagnoseQs(this.dataDiagnose.listQuestion.Q2);
        this.showProgress();
      }
    }
  }

  // Career Class
  class Career extends BaseQuestion {
    constructor() {
      super();
      this.optScores = {};
      this.listType = [];
    }

    initCareer(params, isType) {
      this.isType = isType;
      this.params = params;
      this.objCareer();
    }

    objCareer() {
      this.dataDiagnose.listQuestion = this.params.items;
      this.dataDiagnose.optionAnswer = this.params.answers;
      this.dataDiagnose.postData.type = this.isType;
      this.dataDiagnose.maxDiagnose = Object.keys(this.params.items).length - 1;

      if (this.keyExistInObj(this.dataDiagnose.listQuestion, `Q${this.dataDiagnose.numberQuestion + 1}`)) {
        this.createDiagnoseQs(this.dataDiagnose.listQuestion.Q2);
        this.showProgress();
      }
      this.assignObjScore();
    }

    assignObjScore() {
      const listCareer = Object.values(this.dataDiagnose.listQuestion);
      const uniqueGroup = [...new Set(listCareer.map(item => item.group).filter(Boolean))].sort();
      this.listType = uniqueGroup;
      uniqueGroup.forEach(element => {
        this.optScores[element] = 0;
      });
    }

    argolithmCareer(point, group) {
      if (this.optScores.hasOwnProperty(group)) {
        this.optScores[group] += Number(point);
      }
    }

    compareCareer() {
      const max = Math.max(...Object.values(this.optScores));
      const getKeyMax = Object.keys(this.optScores).filter(key => this.optScores[key] === max);

      if (getKeyMax.length === 1) {
        const isNumberType = this.listType.findIndex(item => item === getKeyMax[0]);
        this.dataDiagnose.postData.result_type = `TYPE${isNumberType + 1}`;
        document.querySelector(".progress-bar__inner").style.width = "100%";
        this.disableOptionAnswer();
        this.dataDiagnose.postData.data = this.mapToString(dataAnswer);
        this.postMessage('postData', this.dataDiagnose.postData);
      } else if (getKeyMax.length > 1) {
        const keyLastCareer = 'Q26';
        if (this.keyExistInObj(this.dataDiagnose.listQuestion, keyLastCareer)) {
          this.createLastQsCareer(keyLastCareer);
        }
      }
    }

    createLastQsCareer(key) {
      const lastQsCareer = this.dataDiagnose.listQuestion[key];
      const orderedLastQsCareer = Object.keys(lastQsCareer).sort().reduce((obj, k) => {
        obj[k] = lastQsCareer[k];
        return obj;
      }, {});

      const filterOptionLastCareer = Object.fromEntries(
        Object.entries(orderedLastQsCareer).filter(([k]) => k !== "text")
      );

      const answerList = document.querySelector('.qs-answer');
      this.dataDiagnose.maxDiagnose += 1;
      this.dataDiagnose.numberQuestion += 1;

      if (this.checkObjNotEmpty(lastQsCareer)) {
        this.createQuestion(lastQsCareer);
      }

      answerList.innerHTML = "";
      if (this.checkObjNotEmpty(filterOptionLastCareer)) {
        Object.entries(filterOptionLastCareer).forEach(([option, value]) => {
          const evtCheckHandler = (e) => {
            const type = e.target.value;
            this.dataDiagnose.postData.result_type = type;
            this.disableOptionAnswer();
            document.querySelector(".progress-bar__inner").style.width = "100%";
            dataAnswer.set(this.dataDiagnose.numberQuestion, e.target.value);
            this.dataDiagnose.postData.data = this.mapToString(dataAnswer);
            this.postMessage('postData', this.dataDiagnose.postData);
          };

          answerList.appendChild(
            this.ComponentOptionAnswer({
              id: option,
              name: "",
              value: option,
              data_text: value,
              text_label: value,
              evtCheckHandler: evtCheckHandler
            })
          );
        });
      }
    }
  }

  // Diagnosis Class
  class Diagnosis extends BaseQuestion {
    constructor() {
      super();
    }

    init(params, isType) {
      this.isType = isType;
      this.params = params;
      this.objDiagnosis();
    }

    objDiagnosis() {
      this.dataDiagnose.listQuestion = this.params.items;
      this.dataDiagnose.postData.type = this.isType;
      this.dataDiagnose.maxDiagnose = this.params.question_count;
      this.dataDiagnose.maxDiagnoseNew = this.params.question_max;

      const arrayFromObject = Object.values(this.dataDiagnose.listQuestion);
      const elementWithOrder1 = arrayFromObject.find(item => item.order === 1);
      const keyWithOrder1 = Object.keys(this.dataDiagnose.listQuestion)
        .find(key => this.dataDiagnose.listQuestion[key] === elementWithOrder1);

      if (keyWithOrder1) {
        this.createDiagnoseQs(this.dataDiagnose.listQuestion[keyWithOrder1]);
        this.createDiagnoseQsNew(this.dataDiagnose.listQuestion[keyWithOrder1], keyWithOrder1, elementWithOrder1.order);
        this.showProgressNew(keyWithOrder1, elementWithOrder1.order);
      }
    }
  }

  const isBaseQs = new BaseQuestion();

  window.isDiagnose = function(params) {
    let e = null;
    let isSuccess = false;

    try {
      const type = (params.type || '').toLowerCase();
      if (type === "ios" || type === "android") {
        // Platform detection if needed
      }
      isBaseQs.init(params);
      isSuccess = true;
    } catch (error) {
      e = error.message;
    }

    isBaseQs.postMessage('loadFinished', { error: e, success: isSuccess });
    return isSuccess;
  };

  isBaseQs.postMessage('javascriptLoaded', { success: true });
})();

// isDiagnose({
//     "success": true,
//     "code": "GET_DATA_SUCCESS",
//     "data": {
//         "start_page": {
//             "start_page": {
//                 "text_top": "あなたのキャリアを導く！性格・適職診断",
//                 "img": "https://d2p333gdzaltfu.cloudfront.net/diagnostic/first_page.png",
//                 "text_bottom": "あなたは、仕事でやりたいことはありますか？<br />\n        <br />\nこの診断では、仕事でやりたいことが決まっている方には「あなたの性格から導くステップアップ方法」を、決まっていない方には「あなたの適性」を診断します。あなたのキャリアイメージが少しでも明るくなり、よりマッチしたお仕事が見つかることを祈っています。"
//             },
//             "first_question": {
//                 "text": "今、仕事でやりたいことは決まっていますか？",
//                 "yes": "enneagram",
//                 "no": "career_anchor"
//             }
//         },
//         "career_anchor": {
//             "items": {
//                 "Q2": {
//                     "text": "得意分野があり、それについて周囲の人からよく聞かれることがある",
//                     "yes": "Q3",
//                     "no": "Q3",
//                     "group": "B"
//                 },
//                 "Q3": {
//                     "text": "チームを盛り上げて成果を得ることに、喜びや充実感を覚える",
//                     "yes": "Q4",
//                     "no": "Q4",
//                     "group": "A"
//                 },
//                 "Q4": {
//                     "text": "自分のペースを守りながら、仕事を進めていくことが好きなほうだ",
//                     "yes": "Q5",
//                     "no": "Q5",
//                     "group": "E"
//                 },
//                 "Q5": {
//                     "text": "目の前の自由よりも、将来的な安定や安心を選ぶタイプだと思う",
//                     "yes": "Q6",
//                     "no": "Q6",
//                     "group": "C"
//                 },
//                 "Q6": {
//                     "text": "独自のアイデアや新しい発想などを考えるのが得意なほうだ",
//                     "yes": "Q7",
//                     "no": "Q7",
//                     "group": "D"
//                 },
//                 "Q7": {
//                     "text": "仕事で最も良かったと思うのは、社会の役に立っていると実感できたときだ",
//                     "yes": "Q8",
//                     "no": "Q8",
//                     "group": "F"
//                 },
//                 "Q8": {
//                     "text": "急なトラブルや壁にぶつかったときこそ、逆に燃えてくるほうだ",
//                     "yes": "Q9",
//                     "no": "Q9",
//                     "group": "G"
//                 },
//                 "Q9": {
//                     "text": "家族やプライベートを犠牲にする仕事なら、断るのも仕方ないと思う",
//                     "yes": "Q10",
//                     "no": "Q10",
//                     "group": "H"
//                 },
//                 "Q10": {
//                     "text": "専門的なスキルや体験を積むことが着実な成功につながると信じている",
//                     "yes": "Q11",
//                     "no": "Q11",
//                     "group": "B"
//                 },
//                 "Q11": {
//                     "text": "多くの人に良い影響を与え、育成するポジションを目指している",
//                     "yes": "Q12",
//                     "no": "Q12",
//                     "group": "A"
//                 },
//                 "Q12": {
//                     "text": "自由であればあるほど、パワーに満ちて良い結果を出せると思う",
//                     "yes": "Q13",
//                     "no": "Q13",
//                     "group": "E"
//                 },
//                 "Q13": {
//                     "text": "肩書や給与体制の保証がしっかりしていないと落ち着いて仕事ができない",
//                     "yes": "Q14",
//                     "no": "Q14",
//                     "group": "C"
//                 },
//                 "Q14": {
//                     "text": "企業のトップを狙うよりも、自分で組織をつくることに興味がある",
//                     "yes": "Q15",
//                     "no": "Q15",
//                     "group": "D"
//                 },
//                 "Q15": {
//                     "text": "自分の働きによって周囲から感謝されることが何よりもうれしい",
//                     "yes": "Q16",
//                     "no": "Q16",
//                     "group": "F"
//                 },
//                 "Q16": {
//                     "text": "大きなチャンスや新しい目標を与えられると一気にテンションが上がる",
//                     "yes": "Q17",
//                     "no": "Q17",
//                     "group": "G"
//                 },
//                 "Q17": {
//                     "text": "自分ならプライベートでも仕事でもうまくやれる！と密かに思っている",
//                     "yes": "Q18",
//                     "no": "Q18",
//                     "group": "H"
//                 },
//                 "Q18": {
//                     "text": "管理職になるよりも、現場の一線にいるほうが幸せだと感じる",
//                     "yes": "Q19",
//                     "no": "Q19",
//                     "group": "B"
//                 },
//                 "Q19": {
//                     "text": "チームや組織を引っ張るようなポジションに強い憧れがある",
//                     "yes": "Q20",
//                     "no": "Q20",
//                     "group": "A"
//                 },
//                 "Q20": {
//                     "text": "独創的な考え方をもち、組織のルールに縛られるのが苦手なほうだ",
//                     "yes": "Q21",
//                     "no": "Q21",
//                     "group": "E"
//                 },
//                 "Q21": {
//                     "text": "変化が少ない平穏な環境が自分にとっての理想の職場だと思う",
//                     "yes": "Q22",
//                     "no": "Q22",
//                     "group": "C"
//                 },
//                 "Q22": {
//                     "text": "社会にまだないものやサービスを創りだせたとき、生きている喜びを感じる",
//                     "yes": "Q23",
//                     "no": "Q23",
//                     "group": "D"
//                 },
//                 "Q23": {
//                     "text": "自分が出世することよりも、今の社会が良くなることに興味がある",
//                     "yes": "Q24",
//                     "no": "Q24",
//                     "group": "F"
//                 },
//                 "Q24": {
//                     "text": "同じような毎日の繰り返しだと気持ちが沈んでくるのを感じる",
//                     "yes": "Q25",
//                     "no": "Q25",
//                     "group": "G"
//                 },
//                 "Q25": {
//                     "text": "仕事も家庭もうまくやるために準備を怠らないようにしている",
//                     "yes": "Q26",
//                     "no": "Q26",
//                     "group": "H"
//                 },
//                 "Q26": {
//                     "text": "次のうち、あなたが人生で不可欠だと思うものはどれ？",
//                     "TYPE1": "物事を見通せる視野の広さ",
//                     "TYPE2": "熱中してやり通せる集中力",
//                     "TYPE3": "自分を守ってくれる後ろ盾",
//                     "TYPE4": "ゼロから１を生みだす行動力",
//                     "TYPE5": "自分らしさを大切にする気持ち",
//                     "TYPE6": "人の想いに寄り添える共感力",
//                     "TYPE7": "決してあきらめない反骨精神",
//                     "TYPE8": "必要不要を見極められる調整力"
//                 }
//             },
//             "answers": [
//                 {
//                     "point": 6,
//                     "text": "まったくその通りだと思う"
//                 },
//                 {
//                     "point": 4,
//                     "text": "どちらかというとそう思う"
//                 },
//                 {
//                     "point": 2,
//                     "text": "どちらかというとそう思わない"
//                 },
//                 {
//                     "point": 0,
//                     "text": "まったくそう思わない"
//                 }
//             ]
//         },
//         "enneagram": {
//             "items": {
//                 "Q2": {
//                     "text": "自分は行動力があるほうだ ",
//                     "yes": "Q3",
//                     "no": "Q4",
//                     "group": 2
//                 },
//                 "Q3": {
//                     "text": "人についていくより引っ張っていきたいほうだ",
//                     "yes": "Q5",
//                     "no": "Q6",
//                     "group": 3
//                 },
//                 "Q4": {
//                     "text": "変化よりも安定を望むほうだ",
//                     "yes": "Q7",
//                     "no": "Q6",
//                     "group": 3
//                 },
//                 "Q5": {
//                     "text": "人前で話すのが得意なほうだ",
//                     "yes": "Q8",
//                     "no": "Q9",
//                     "group": 4
//                 },
//                 "Q6": {
//                     "text": "人と一緒に出かけるのが好きだ",
//                     "yes": "Q9",
//                     "no": "Q10",
//                     "group": 4
//                 },
//                 "Q7": {
//                     "text": "友達になるまでかなり時間がかかるほうだ",
//                     "yes": "Q11",
//                     "no": "Q10",
//                     "group": 4
//                 },
//                 "Q8": {
//                     "text": "資格を取るのが好きなほうだ",
//                     "yes": "Q12",
//                     "no": "Q13",
//                     "group": 5
//                 },
//                 "Q9": {
//                     "text": "本を読んだり、勉強系の動画をよく見たりする",
//                     "yes": "Q13",
//                     "no": "Q14",
//                     "group": 5
//                 },
//                 "Q10": {
//                     "text": "夢中になれる趣味や習い事がある",
//                     "yes": "Q14",
//                     "no": "Q15",
//                     "group": 5
//                 },
//                 "Q11": {
//                     "text": "休日は家でのんびり過ごすのが好きだ",
//                     "yes": "Q16",
//                     "no": "Q15",
//                     "group": 5
//                 },
//                 "Q12": {
//                     "text": "仕事で大きく成功したいと願っている",
//                     "yes": "Q17",
//                     "no": "Q18",
//                     "group": 6
//                 },
//                 "Q13": {
//                     "text": "人に目標や夢を語ることがある",
//                     "yes": "Q18",
//                     "no": "Q19",
//                     "group": 6
//                 },
//                 "Q14": {
//                     "text": "集中力があるほうだ",
//                     "yes": "Q19",
//                     "no": "Q20",
//                     "group": 6
//                 },
//                 "Q15": {
//                     "text": "思っていることの半分も言えないことが多い",
//                     "yes": "Q21",
//                     "no": "Q20",
//                     "group": 6
//                 },
//                 "Q16": {
//                     "text": "率直に言うと、転職には興味がないほうだ",
//                     "yes": "Q22",
//                     "no": "Q21",
//                     "group": 6
//                 },
//                 "Q17": {
//                     "text": "何事も絶対に失敗したくないと思う",
//                     "yes": "Q23",
//                     "no": "Q24",
//                     "group": 7
//                 },
//                 "Q18": {
//                     "text": "人に認められたいという気持ちが強い",
//                     "yes": "Q24",
//                     "no": "Q25",
//                     "group": 7
//                 },
//                 "Q19": {
//                     "text": "どちらかというとルーティーンワークは苦手だ",
//                     "yes": "Q25",
//                     "no": "Q26",
//                     "group": 7
//                 },
//                 "Q20": {
//                     "text": "人の気持ちをくみ取るのが苦手なほうだ",
//                     "yes": "Q26",
//                     "no": "Q27",
//                     "group": 7
//                 },
//                 "Q21": {
//                     "text": "寄付やボランティア活動をしたことがある",
//                     "yes": "Q27",
//                     "no": "Q28",
//                     "group": 7
//                 },
//                 "Q22": {
//                     "text": "出世や自己成長にはそれほど興味がないほうだ",
//                     "yes": "Q29",
//                     "no": "Q28",
//                     "group": 7
//                 },
//                 "Q23": {
//                     "text": "社会に影響をもつような成功者に憧れる",
//                     "yes": "Q30",
//                     "no": "Q31",
//                     "group": 8
//                 },
//                 "Q24": {
//                     "text": "やるなら何事もトップを目指したいと思う",
//                     "yes": "Q31",
//                     "no": "Q32",
//                     "group": 8
//                 },
//                 "Q25": {
//                     "text": "成功するには必死に努力しないとダメだと思う",
//                     "yes": "Q32",
//                     "no": "Q33",
//                     "group": 8
//                 },
//                 "Q26": {
//                     "text": "何かを決断するときは直感よりデータを重視する",
//                     "yes": "Q34",
//                     "no": "Q33",
//                     "group": 8
//                 },
//                 "Q27": {
//                     "text": "仕事は個人よりチームで進めていきたいほうだ",
//                     "yes": "Q35",
//                     "no": "Q34",
//                     "group": 8
//                 },
//                 "Q28": {
//                     "text": "人に何かを教えてあげることが得意なほうだ",
//                     "yes": "Q35",
//                     "no": "Q36",
//                     "group": 8
//                 },
//                 "Q29": {
//                     "text": "うまく言葉にできず我慢してしまうことがある",
//                     "yes": "Q37",
//                     "no": "Q36",
//                     "group": 8
//                 },
//                 "Q30": {
//                     "text": "誰からも認められる理想の自分を目指している",
//                     "yes": "TYPE1",
//                     "no": "TYPE3",
//                     "group": 9
//                 },
//                 "Q31": {
//                     "text": "実現しない目標はないと強く信じている",
//                     "yes": "TYPE3",
//                     "no": "TYPE8",
//                     "group": 9
//                 },
//                 "Q32": {
//                     "text": "どんなことでも粘り強く頑張れるほうだ",
//                     "yes": "TYPE8",
//                     "no": "TYPE7",
//                     "group": 9
//                 },
//                 "Q33": {
//                     "text": "たいていのことは明るく乗り越えられる自信がある",
//                     "yes": "TYPE7",
//                     "no": "TYPE4",
//                     "group": 9
//                 },
//                 "Q34": {
//                     "text": "ものづくりやクリエイティブなことが好きだ",
//                     "yes": "TYPE4",
//                     "no": "TYPE5",
//                     "group": 9
//                 },
//                 "Q35": {
//                     "text": "仕事は知的好奇心を満たされるかどうかで選ぶ",
//                     "yes": "TYPE5",
//                     "no": "TYPE2",
//                     "group": 9
//                 },
//                 "Q36": {
//                     "text": "自分より周りの幸せを優先してしまうことが多い ",
//                     "yes": "TYPE2",
//                     "no": "TYPE6",
//                     "group": 9
//                 },
//                 "Q37": {
//                     "text": "仕事では、経済的な安定が何より大切だと思う",
//                     "yes": "TYPE6",
//                     "no": "TYPE9",
//                     "group": 9
//                 }
//             },
//             "answers": [
//                 {
//                     "point": "yes",
//                     "text": "はい"
//                 },
//                 {
//                     "point": "no",
//                     "text": "いいえ"
//                 }
//             ]
//         },
//         "contents": {
//               "career_enneagram": {
//                 "title": "エニアグラムタイプ + キャリアアンカータイプ",
//                 "sub_title": "",
//                 "img": "",
//                 "description": "",
//                 "mode": "POINT",
//                 "question_max": 0,
//                 "question_count": 0,
//                 "option_max": 0,
//                 "result_total": 0,
//                 "order": 6
//             },
//             "di_type": {
//                 "title": "di",
//                 "sub_title": "1",
//                 "img": "https://test.learningpocket.com/uploads/diagnostic/images/fjNp2k13SoQkD18k.jpg",
//                 "description": "",
//                 "mode": "TREE",
//                 "question_max": 1,
//                 "question_count": null,
//                 "option_max": 1,
//                 "result_total": 50,
//                 "order": 2,
//                 "items": {
//                     "1": {
//                         "text": "1",
//                         "order": 1,
//                         "max_option": 1,
//                         "count_option": 1,
//                         "answers": {
//                             "1bnhJ2EI6lGHbRULi3T": {
//                                 "text": "1",
//                                 "point": 1,
//                                 "order": 0,
//                                 "next": ""
//                             }
//                         }
//                     }
//                 }
//             },
//             "type_test_diagnostic": {
//                 "title": "test new type",
//                 "sub_title": "diagnostic",
//                 "img": "https://test.learningpocket.com/uploads/diagnostic/images/k1QbfkboInCkA1R5.png",
//                 "description": "test diagnostic test diagnostic test diagnostic test diagnostic test diagnostic test diagnostic test diagnostic test diagnostic test diagnostic test diagnostic test diagnostic test diagnostic test dia",
//                 "mode": "POINT",
//                 "question_max": 2,
//                 "question_count": null,
//                 "option_max": 2,
//                 "result_total": 1,
//                 "order": 3,
//                 "items": {
//                     "2": {
//                         "text": "test 2 ",
//                         "order": 2,
//                         "max_option": 2,
//                         "count_option": 2,
//                         "answers": {
//                             "25d5KbVZw1aIsuirHzL": {
//                                 "text": "1",
//                                 "point": 8,
//                                 "order": 0,
//                                 "next": ""
//                             },
//                             "r5W5KIC6AqaYbkNVQJi": {
//                                 "text": "2",
//                                 "point": 4,
//                                 "order": 1,
//                                 "next": ""
//                             }
//                         }
//                     },
//                     "1": {
//                         "text": "test 1 ",
//                         "order": 1,
//                         "max_option": 2,
//                         "count_option": 2,
//                         "answers": {
//                             "o5j5KwD6NWm8PX2kpCO": {
//                                 "text": "1",
//                                 "point": 2,
//                                 "order": 0,
//                                 "next": "2"
//                             },
//                             "05N5aYCs5ERtfy1mDdB": {
//                                 "text": "2",
//                                 "point": 1,
//                                 "order": 1,
//                                 "next": "2"
//                             }
//                         }
//                     }
//                 }
//             },
//             "type_test": {
//                 "title": "【テスト】16タイプ",
//                 "sub_title": "テスト",
//                 "img": "https://test.learningpocket.com/uploads/diagnostic/images/olXgpaPiduuiE1f0.jpg",
//                 "description": "プリン食べたい",
//                 "mode": "TREE",
//                 "question_max": 1,
//                 "question_count": null,
//                 "option_max": 2,
//                 "result_total": 2,
//                 "order": 4,
//                 "items": {
//                     "1": {
//                         "text": "テスト　お休みの日の過ごし方は？",
//                         "order": 1,
//                         "max_option": 2,
//                         "count_option": 2,
//                         "answers": {
//                             "9dQ74brCquoMHDmheUP": {
//                                 "text": "うちにいたいなぁ",
//                                 "point": 0,
//                                 "order": 0,
//                                 "next": ""
//                             },
//                             "gdE1Feh2HBLy3r6SXWt": {
//                                 "text": "出かけたいなぁ。",
//                                 "point": 0,
//                                 "order": 1,
//                                 "next": ""
//                             }
//                         }
//                     }
//                 }
//             },
//             "p16_types": {
//                 "title": "16タイプ 性格×適職診断",
//                 "sub_title": "―相性の良い上司・同僚のタイプもわかる！―",
//                 "img": "https://test.learningpocket.com/uploads/diagnostic/images/vcV105lmHnZkL1et.png",
//                 "description": "今話題の「16タイプ診断」で適職を探してみませんか?<br />\r\n<br />\r\n「16タイプ診断」とは、私たちの日常の興味関心や感じ方、思考のパターンを基に、16種類のタイプに分類される診断です。診断を通じて自分のクセや強みを知り、日々の生活やお仕事探しにお役立てください。<br />\r\n<br />\r\n監修：所長P<br />\r\nhttps://x.com/100yen_bunko",
//                 "mode": "TREE",
//                 "question_max": 20,
//                 "question_count": 12,
//                 "option_max": 2,
//                 "result_total": 16,
//                 "order": 5,
//                 "items": {
//                     "20": {
//                         "text": "有給をとって旅行に♪プランはどうする？",
//                         "order": 20,
//                         "max_option": 2,
//                         "count_option": 2,
//                         "answers": {
//                             "Z7011BIeFdWVP342hwE": {
//                                 "text": "特に決めず現地に着いてから考える",
//                                 "point": 0,
//                                 "order": 1,
//                                 "next": ""
//                             },
//                             "77c1h6bESgoMU8VDjeR": {
//                                 "text": "事前に計画を立てておく",
//                                 "point": 0,
//                                 "order": 0,
//                                 "next": ""
//                             }
//                         }
//                     },
//                     "19": {
//                         "text": "会議でメモをする時に、どっちを重視する?",
//                         "order": 19,
//                         "max_option": 2,
//                         "count_option": 2,
//                         "answers": {
//                             "77e1EYIjvXyAaRlLdoU": {
//                                 "text": "大事なポイントだけメモする",
//                                 "point": 0,
//                                 "order": 1,
//                                 "next": ""
//                             },
//                             "U7B1slLZqt3RwEc6I4h": {
//                                 "text": "漏れが無いように全てメモする",
//                                 "point": 0,
//                                 "order": 0,
//                                 "next": ""
//                             }
//                         }
//                     },
//                     "18": {
//                         "text": "上司から突然新しい業務を頼まれた！どう進める？",
//                         "order": 18,
//                         "max_option": 2,
//                         "count_option": 2,
//                         "answers": {
//                             "37V1ZyQeqRfvd8BEzTK": {
//                                 "text": "計画を立てて、計画通りに進める",
//                                 "point": 0,
//                                 "order": 1,
//                                 "next": "20"
//                             },
//                             "57g1FyDf2tNBin4kplG": {
//                                 "text": "柔軟に対応し、状況に応じて仕事する",
//                                 "point": 0,
//                                 "order": 0,
//                                 "next": "19"
//                             }
//                         }
//                     },
//                     "17": {
//                         "text": "待ち合わせ、あなたはどっち派？",
//                         "order": 17,
//                         "max_option": 2,
//                         "count_option": 2,
//                         "answers": {
//                             "t711zhMOaBmuDdIlbxj": {
//                                 "text": "余裕を持って早めに出る",
//                                 "point": 0,
//                                 "order": 1,
//                                 "next": "20"
//                             },
//                             "d7b1sYZt06CQM9NyROS": {
//                                 "text": "ギリギリまで家にいる",
//                                 "point": 0,
//                                 "order": 0,
//                                 "next": "19"
//                             }
//                         }
//                     },
//                     "16": {
//                         "text": "明日は大事な打ち合わせ！前日の準備はどうする？",
//                         "order": 16,
//                         "max_option": 2,
//                         "count_option": 2,
//                         "answers": {
//                             "B7E1i2tPLKrFG4gob8h": {
//                                 "text": "ポイントだけ見直しをする",
//                                 "point": 0,
//                                 "order": 1,
//                                 "next": "18"
//                             },
//                             "C721fLRWTyI9KtDAazG": {
//                                 "text": "全て見直しをする",
//                                 "point": 0,
//                                 "order": 0,
//                                 "next": "17"
//                             }
//                         }
//                     },
//                     "15": {
//                         "text": "学生時代の友人と久しぶりにランチ♪お店選びは・・・",
//                         "order": 15,
//                         "max_option": 2,
//                         "count_option": 2,
//                         "answers": {
//                             "Y7b1GSrTEZUPIcDwBKN": {
//                                 "text": "予算や移動時間を1番に考える",
//                                 "point": 0,
//                                 "order": 1,
//                                 "next": "16"
//                             },
//                             "x7m1uI2FBlseSvcYZd6": {
//                                 "text": "みんなの好みを1番に考える",
//                                 "point": 0,
//                                 "order": 0,
//                                 "next": "16"
//                             }
//                         }
//                     },
//                     "14": {
//                         "text": "プレゼンの準備ではどっちを意識する?",
//                         "order": 14,
//                         "max_option": 2,
//                         "count_option": 2,
//                         "answers": {
//                             "I7M1rRLXgDScbsW6ah5": {
//                                 "text": "話す内容の流れ・論理",
//                                 "point": 0,
//                                 "order": 1,
//                                 "next": "16"
//                             },
//                             "P7a1kVOcD3FjTJ4pg2r": {
//                                 "text": "聞き手の反応や感情",
//                                 "point": 0,
//                                 "order": 0,
//                                 "next": "16"
//                             }
//                         }
//                     },
//                     "13": {
//                         "text": "もしチームのリーダーになったら1番大切にするのは？",
//                         "order": 13,
//                         "max_option": 2,
//                         "count_option": 2,
//                         "answers": {
//                             "o7W1sEhiwzRfmkjc8pA": {
//                                 "text": "職場の雰囲気や人間関係",
//                                 "point": 0,
//                                 "order": 1,
//                                 "next": "15"
//                             },
//                             "b7S1VLBfNRzodTia0xm": {
//                                 "text": "売上や業績のアップ",
//                                 "point": 0,
//                                 "order": 0,
//                                 "next": "14"
//                             }
//                         }
//                     },
//                     "12": {
//                         "text": "職場に新人が入った時、1番どこに注目する?",
//                         "order": 12,
//                         "max_option": 2,
//                         "count_option": 2,
//                         "answers": {
//                             "W7b1nkazVNCZIRmwEL1": {
//                                 "text": "その人の態度や表情",
//                                 "point": 0,
//                                 "order": 1,
//                                 "next": "15"
//                             },
//                             "V781SZ0JcifrIktYsD6": {
//                                 "text": "その人の話す内容や考え方",
//                                 "point": 0,
//                                 "order": 0,
//                                 "next": "14"
//                             }
//                         }
//                     },
//                     "11": {
//                         "text": "職場で同僚同士のトラブル発生！あなたはどう動く？",
//                         "order": 11,
//                         "max_option": 2,
//                         "count_option": 2,
//                         "answers": {
//                             "r73158YVGquMLHQgbIS": {
//                                 "text": "解決策を一緒に考えてあげる",
//                                 "point": 0,
//                                 "order": 1,
//                                 "next": "13"
//                             },
//                             "q7B1z5WI8VoQgy41rnA": {
//                                 "text": "まずはお互いの話をしっかり聞く",
//                                 "point": 0,
//                                 "order": 0,
//                                 "next": "12"
//                             }
//                         }
//                     },
//                     "10": {
//                         "text": "ミーティングで発言するとき、重視するのは？",
//                         "order": 10,
//                         "max_option": 2,
//                         "count_option": 2,
//                         "answers": {
//                             "J7Y1EV0avqd6UiOXxz5": {
//                                 "text": "未来や長期的なビジョン",
//                                 "point": 0,
//                                 "order": 1,
//                                 "next": "11"
//                             },
//                             "07k1AbGBgLoDvV5UQrZ": {
//                                 "text": "目の前の結果やデータ",
//                                 "point": 0,
//                                 "order": 0,
//                                 "next": "11"
//                             }
//                         }
//                     },
//                     "9": {
//                         "text": "集中している時に同僚に声をかけられたら?",
//                         "order": 9,
//                         "max_option": 2,
//                         "count_option": 2,
//                         "answers": {
//                             "07G1kld1zBmFXsr7e6p": {
//                                 "text": "過去の企画を分析する",
//                                 "point": 0,
//                                 "order": 1,
//                                 "next": "11"
//                             },
//                             "H7F1wo4faG35znrLmES": {
//                                 "text": "企画のアイデアをとにかく出す",
//                                 "point": 0,
//                                 "order": 0,
//                                 "next": "11"
//                             }
//                         }
//                     },
//                     "8": {
//                         "text": "新プロジェクトのリーダーを任された！まず何をする？",
//                         "order": 8,
//                         "max_option": 2,
//                         "count_option": 2,
//                         "answers": {
//                             "U7P1xDuJKaNZdoFRGW3": {
//                                 "text": "過去の企画を分析する",
//                                 "point": 0,
//                                 "order": 1,
//                                 "next": "10"
//                             },
//                             "97G1Jrc4nTo5PSfU6Mu": {
//                                 "text": "企画のアイデアをとにかく出す",
//                                 "point": 0,
//                                 "order": 0,
//                                 "next": "9"
//                             }
//                         }
//                     },
//                     "7": {
//                         "text": "気分転換に部屋の模様替え！どちらを重視？",
//                         "order": 7,
//                         "max_option": 2,
//                         "count_option": 2,
//                         "answers": {
//                             "e7W1fi2naEz1YKNAL4l": {
//                                 "text": "実際の見た目や流行を重視",
//                                 "point": 0,
//                                 "order": 1,
//                                 "next": "10"
//                             },
//                             "K7V18pIAwc3FTi7ox4f": {
//                                 "text": "雰囲気や空気感を重視",
//                                 "point": 0,
//                                 "order": 0,
//                                 "next": "9"
//                             }
//                         }
//                     },
//                     "6": {
//                         "text": "お仕事を探すとき大切にするのは？",
//                         "order": 6,
//                         "max_option": 2,
//                         "count_option": 2,
//                         "answers": {
//                             "t7f1biZdSylE7rhjHMB": {
//                                 "text": "会社の未来やビジョン",
//                                 "point": 0,
//                                 "order": 1,
//                                 "next": "8"
//                             },
//                             "p7W1EJ0z7IybOSqDntk": {
//                                 "text": "会社の歴史や実績",
//                                 "point": 0,
//                                 "order": 0,
//                                 "next": "7"
//                             }
//                         }
//                     },
//                     "5": {
//                         "text": "職場に新人が入ってきたら？",
//                         "order": 5,
//                         "max_option": 2,
//                         "count_option": 2,
//                         "answers": {
//                             "Q7H1JzgltkCIdK43GV0": {
//                                 "text": "相手から話しかけてくるのを待つ",
//                                 "point": 0,
//                                 "order": 1,
//                                 "next": "6"
//                             },
//                             "E7H1p8SZ9AsXiOlqrjR": {
//                                 "text": "自分から話しかけてみる",
//                                 "point": 0,
//                                 "order": 0,
//                                 "next": "6"
//                             }
//                         }
//                     },
//                     "4": {
//                         "text": "職場や学校でのあなたはどっち派？",
//                         "order": 4,
//                         "max_option": 2,
//                         "count_option": 2,
//                         "answers": {
//                             "r7U15nxLJ4pecgRWiYs": {
//                                 "text": "サポート役",
//                                 "point": 0,
//                                 "order": 1,
//                                 "next": "6"
//                             },
//                             "n7B1H7dZO0vTuKl4JPr": {
//                                 "text": "リーダーやまとめ役",
//                                 "point": 0,
//                                 "order": 0,
//                                 "next": "6"
//                             }
//                         }
//                     },
//                     "3": {
//                         "text": "お仕事のスタイルはどっちが好き？",
//                         "order": 3,
//                         "max_option": 2,
//                         "count_option": 2,
//                         "answers": {
//                             "g751lu0P6dBeYHS8R3V": {
//                                 "text": "誰かしらとやり取りしながら進める",
//                                 "point": 0,
//                                 "order": 1,
//                                 "next": "5"
//                             },
//                             "v7W1uY9zemJGtaq201E": {
//                                 "text": "1人で黙々と進める",
//                                 "point": 0,
//                                 "order": 0,
//                                 "next": "4"
//                             }
//                         }
//                     },
//                     "2": {
//                         "text": "お仕事でお客様や同僚、上司にメールで連絡するときは?",
//                         "order": 2,
//                         "max_option": 2,
//                         "count_option": 2,
//                         "answers": {
//                             "c731AP0l5Svsf1n4ME7": {
//                                 "text": "特に問題なく行える",
//                                 "point": 0,
//                                 "order": 1,
//                                 "next": "5"
//                             },
//                             "f7z1qMb4tIYgrw1OA6U": {
//                                 "text": "いつもドキドキする",
//                                 "point": 0,
//                                 "order": 0,
//                                 "next": "4"
//                             }
//                         }
//                     },
//                     "1": {
//                         "text": "お休みの日の過ごし方は？",
//                         "order": 1,
//                         "max_option": 2,
//                         "count_option": 2,
//                         "answers": {
//                             "W7j1Tf3ok1Xz7dyxstM": {
//                                 "text": "家にいることが多い",
//                                 "point": 0,
//                                 "order": 1,
//                                 "next": "3"
//                             },
//                             "Y7Z1dMEnVDpqhCU1Ivj": {
//                                 "text": "外に出かけることが多い",
//                                 "point": 0,
//                                 "order": 0,
//                                 "next": "2"
//                             }
//                         }
//                     }
//                 }
//             }
//         },
//         "html": "https://www.test.learningpocket.com/diagnostic_new/diagnose.html",
//         "html_top": "https://www.test.learningpocket.com/diagnostic_new/diagnose_top.html"
//     },
//     "app_update_mode": ""
// });
