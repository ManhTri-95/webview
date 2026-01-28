(function (){
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
    this.dataAnswer = new Map();
  }

  isParamsDiagonse(obj) {
    return 'career_anchor' in obj && 'enneagram' in obj && 'start_page' in obj;
  }

  init(params) {
    if (!this.checkObjNotEmpty(params)) {
      this.postMessage('logError', { error: 'Data passed in is correct' });
      return;
    }

    this.response = params;
    this.data = this.response.data;
    this.destination = this.response.destination || null;
    this.dataEnneagram = this.data.enneagram;
    this.dataCareer = this.data.career_anchor;
    this.dataP16Types = this.data.p16_types;
    this.startPage = this.data.start_page.start_page;
    this.baseUrl = 'https://' + location.host;
    console.log(this.destination);

    this.createUIPageDiagnose();      
    this.createUIPageStart();

    if (this.destination) {
      const diagnoseMap = {
        'enneagram': () => new Enneagrame().initEnneagrame(this.dataEnneagram, 'enneagram'),
        'career_anchor': () => new Career().initCareer(this.dataCareer, 'career_anchor'),
        'p16_types': () => new Diagnosis().init(this.dataP16Types, 'p16_types')
      };
      if (diagnoseMap[this.destination]) {
        diagnoseMap[this.destination]();
      }
      
      document.querySelector('body').appendChild(this.ComponentModal());
      document.getElementById("diagnose").classList.remove('hide');
      document.getElementById("start_diagnose").classList.add('hide');
      this.fadeInRight(document.getElementById("diagnose"));
    }
  }

  createComponent(tag, className = "", textContent = "", attributes = {}) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (textContent) el.innerHTML = textContent;
    Object.entries(attributes).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  baseMatchStringUrl(str) {
    const tempBrPlaceholder = "__TEMP_BR_PLACEHOLDER__";
    const stringWithoutBr = str.replace(/<br\s*\/?>(?=http)/gi, tempBrPlaceholder);
    window.onClick = elem => this.postMessage('toLinkBrowser', { value: elem.getAttribute("data-url") });
    const result = stringWithoutBr.replace(/http[s]?:\/\/\S+/gi, match => {
      const anchorTag = document.createElement("a");
      anchorTag.setAttribute("onclick", "onClick(this)");
      anchorTag.setAttribute("href", "javascript:void(0)");
      anchorTag.setAttribute("data-url", match.replace(/__TEMP_BR_PLACEHOLDER__/g, ""));
      anchorTag.textContent = match;
      return anchorTag.outerHTML;
    });
    return result.replace(new RegExp(tempBrPlaceholder, "g"), "<br>");
  }

  createUIPageStart() {
    const { title: titleP16Type, sub_title: subTitle, description, img: p16Image } = this.dataP16Types;
    const { text_top: textTop, img: startPageImage, text_bottom: textBottom } = this.startPage;
    const body = document.body;
    const container = this.createComponent("div", "container start-diagnose", "", { id: "start_diagnose" });
    const main = this.createComponent("section", "main-container");
    main.prepend(
      this.createComponent("div", "header-title", titleP16Type),
      this.createComponent("div", "text-center", subTitle),
      (() => {
        const bannerP16 = this.createComponent("div", "banner mt-15 text-center");
        bannerP16.appendChild(this.createComponent("img", "", "", { src: p16Image }));
        return bannerP16;
      })(),
      this.createComponent("div", "p-15", this.baseMatchStringUrl(description)),
      (() => {
        const buttonP16 = this.createComponent("div", "p-15 text-center");
        buttonP16.appendChild(this.ComponentButton({
          text: `診断スタート！`,
          isClass: "btn--primary btn-start",
          additionalAttributes: { 'data-type': 'p16_types' },
          pressHandler: this.evtNextPageDiagnose.bind(this)
        }));
        return buttonP16;
      })(),
      this.createComponent("div", "header-title text-truncate", textTop),
      (() => {
        const bannerStart = this.createComponent("div", "banner mt-15 text-center", "", { id: "banner" });
        bannerStart.appendChild(this.createComponent("img", "", "", { src: startPageImage }));
        return bannerStart;
      })(),
      this.createComponent("div", "p-15 text-center", textBottom)
    );


    const buttonWrapper = this.createComponent("div", "d-flex p-10 gap-2");
    const buttonEnneagram = this.createComponent("div", "text-center btn-area-large");
    buttonEnneagram.appendChild(this.ComponentButton({
      text: "<small>決まっている方<br>─ 性格から導くステップアップ方法 ─</small><br/>診断スタート！",
      isClass: "btn--primary btn-start w-100",
      additionalAttributes: { 'data-type': 'enneagram' },
      pressHandler: this.evtNextPageDiagnose.bind(this)
    }));
    const buttonCareerAnchor = this.createComponent("div", "text-center btn-area-small");
    buttonCareerAnchor.appendChild(this.ComponentButton({
      text: "<small>決まっていない方<br>─ あなたの適職診断 ─</small><br/>診断スタート！",
      isClass: "btn--primary btn-start w-100",
      additionalAttributes: { 'data-type': 'career_anchor' },
      pressHandler: this.evtNextPageDiagnose.bind(this)
    }));
    buttonWrapper.append(buttonEnneagram, buttonCareerAnchor);
    container.prepend(
      //this.ComponentHeader("診断コンテンツ", "start_diagnose"),
      main,
      buttonWrapper
    );
    body.prepend(container);
  }
  
  createUIPageDiagnose() {
    const container = this.createComponent("div", "container hide", "", { id: "diagnose" });
    const main = this.createComponent("section", "main-container");
    const wrapperQs = this.createComponent("div", "wrapper-qs");
    const qsItem = this.createComponent("div", "qs-item");
    const qsItemTop = this.createComponent("div", "qs-item__top");
    const qsNumber = this.createComponent("div", "qs-number");
    qsNumber.appendChild(this.createComponent("span", "", "", { id: "number-question" }));
    qsItemTop.appendChild(qsNumber);
    const qsItemBody = this.createComponent("div", "qs-item__body");
    qsItemBody.append(
      this.createComponent("div", "qs-question", "", { id: "question" }),
      this.createComponent("div", "qs-answer"),
      this.ComponentProgress()
    );
    qsItem.append(qsItemTop, qsItemBody);
    wrapperQs.appendChild(qsItem);
    main.appendChild(wrapperQs);
    container.append(this.ComponentHeader("", "diagnose"), main);
    document.body.appendChild(container);
  }
  
  /**
   * create component Header
   * @returns HTML
   */
  ComponentHeader(text, typePage) {
    const header = this.createComponent("herder", "header-container");
    const headerTop = this.createComponent("div");
    const btnTop = this.createComponent("a");
    const icon = this.createComponent("img");
    const headerLabel = this.createComponent("div", "header-label text-truncate", text || "");
    if (typePage === "start_diagnose") {
      headerTop.className = "header-top";
      btnTop.className = "btn-top";
      icon.src = `${this.baseUrl}/assets/images/ic_arrow_back.png`;
      btnTop.onclick = this.evtBackHomPage.bind(this);
    } else if (typePage === "diagnose") {
      headerTop.className = "header-top text-right";
      btnTop.className = "btn-top btn-open";
      icon.src = `${this.baseUrl}/assets/images/icon-close.png`;
      icon.width = 33;
      btnTop.onclick = this.evtOpenModal.bind(this);
    }
    btnTop.appendChild(icon);
    headerTop.appendChild(btnTop);
    header.append(headerTop, headerLabel);
    return header;
  }
  
  /**
   * create component progress bar
   * @returns HTML
   */
  ComponentProgress() {
    const progressWrapper = this.createComponent("div", "qs-progress");
    progressWrapper.append(
      this.createComponent("span", "progress-bar-text left", "0%"),
      this.createComponent("span", "progress-bar-text right", "100%"),
      (() => {
        const bar = this.createComponent("div", "progress-bar");
        bar.appendChild(this.createComponent("div", "progress-bar__inner", "", { id: "progressMeter" }));
        return bar;
      })()
    );
    return progressWrapper;
  }
  
  /**
   * create component Button
   * @returns HTML
   */
  ComponentButton({ text, isClass = "", pressHandler, additionalAttributes = {} }) {
    const button = this.createComponent("button", `btn ${isClass}`, text, additionalAttributes);
    button.addEventListener("click", pressHandler);
    return button;
  }
  
  ComponentOptionAnswer({ id, name, value, data_text, data_point = "", data_group = "", data_type = "", data_next = "", data_question_order = "", text_label, evtCheckHandler }) {
    const answerItemDiv = this.createComponent("div", "qs-answer__option");
    const answerCheckInput = this.createComponent("input", "", "", {
      type: "radio",
      value,
      id,
      name,
      "data-point": data_point,
      "data-group": data_group,
      "data-type": data_type,
      "data_text": data_text,
      "data_next": data_next,
      "data_question_order": data_question_order
    });
    answerCheckInput.addEventListener("change", evtCheckHandler);
    const answerLabel = this.createComponent("label", "qs-answer-item text-center", text_label, { for: id });
    answerItemDiv.append(answerCheckInput, answerLabel);
    return answerItemDiv;
  }
  
  /**
   * create component Modal
   * @returns HTML
   */
  ComponentModal() {
    const modal = this.createComponent("div", "modal");
    const modalDialog = this.createComponent("div", "modal-dialog");
    const modalBody = this.createComponent("div", "modal-body");
    const modalFooter = this.createComponent("div", "modal-footer text-center");
    const textTitle = this.createComponent("p", "text-center modal-title fs-16", "診断を続けますか？");
    const footerInner = this.createComponent("div", "group-btn");
    footerInner.prepend(
      this.ComponentButton({ text: "やめる", isClass: "btn--light", pressHandler: this.evtBackStartPage.bind(this) }),
      this.ComponentButton({ text: "続ける", isClass: "btn--success", pressHandler: this.evtCloseModal })
    );
    modalFooter.appendChild(footerInner);
    modalBody.prepend(textTitle);
    modalDialog.prepend(modalBody, modalFooter);
    modal.appendChild(modalDialog);
    return modal;
  }
   
  createDiagnoseQsGeneric({ diagnoseQuestion, keyQs = null, orderQs = null, isNew = false }) {
    if (!this.checkObjNotEmpty(diagnoseQuestion)) return;
    this.createQuestion(diagnoseQuestion);
    if (isNew) {
      this.createAnswerOptions({ diagnoseQuestion, keyQs, orderQs, isNew: true });
    } else {
      this.createAnswerOptions({ diagnoseQuestion });
    }
  }

  // Backward compatibility
  createDiagnoseQs(diagnoseQuestion) {
    this.createDiagnoseQsGeneric({ diagnoseQuestion });
  }

  createDiagnoseQsNew(diagnoseQuestion, keyQs, orderQs) {
    this.createDiagnoseQsGeneric({ diagnoseQuestion, keyQs, orderQs, isNew: true });
  }
  
  createQuestion(diagnoseQuestion) {  
  
    if (this.keyExistInObj(diagnoseQuestion, 'text')) {
      const questionNumber = document.getElementById("number-question");
      const questionsText = document.getElementById("question");
      questionsText.textContent = diagnoseQuestion.text;
      questionNumber.textContent = this.dataDiagnose.numberQuestion;
    }
  }

  createAnswerOptions({
    diagnoseQuestion,
    keyQs = null,
    orderQs = null,
    isNew = false
  }) {
    // Determine source of options and sorting
    let optionsList, sortedKeys;
    if (isNew) {
      optionsList = diagnoseQuestion.answers;
      sortedKeys = Object.keys(optionsList).sort((a, b) => optionsList[a].order - optionsList[b].order);
    } else {
      optionsList = this.dataDiagnose.optionAnswer;
      sortedKeys = Object.keys(optionsList);
    }

    const answerListElement = document.querySelector('.qs-answer');
    answerListElement.innerHTML = "";
    const fragment = document.createDocumentFragment();

    sortedKeys.forEach(optionKey => {
      const optionValue = optionsList[optionKey];
      fragment.appendChild(
        this.ComponentOptionAnswer({
          id: `diagnose-${this.dataDiagnose.numberQuestion}-${optionKey}`,
          name: `diagnose[${this.dataDiagnose.numberQuestion}][]`,
          value: optionKey,
          data_text: optionValue.text,
          data_point: optionValue.point,
          data_group: optionValue.group || diagnoseQuestion.group,
          text_label: optionValue.text,
          data_next: isNew ? optionValue.next : undefined,
          data_question_order: isNew ? orderQs : undefined,
          evtCheckHandler: (event) => {
            if (isNew) {
              const toDiagnose = event.target.getAttribute("data_next");
              const orderQsValue = event.target.getAttribute("data_question_order");
              this.dataAnswer.set(keyQs, event.target.value);
              if (!toDiagnose) {
                this.disableOptionAnswer();
                this.showProgressNew(orderQsValue, toDiagnose);
                this.dataDiagnose.postData.data = this.mapToString(this.dataAnswer);
                setTimeout(() => {
                  this.postMessage("postData", this.dataDiagnose.postData);
                }, 500);
              } else {
                this.dataDiagnose.currentQuestion += 1;
                this.dataDiagnose.numberQuestion += 1;
                this.evtNextDiagnoseQsNew(toDiagnose);
              }
            } else {
              const dataPoint = event.target.getAttribute("data-point");
              const dataGroup = event.target.getAttribute("data-group");
              let nextDiagnoseKey;
              if (this.dataDiagnose.numberQuestion < this.dataDiagnose.maxDiagnose) {
                this.dataDiagnose.currentQuestion += 1;
                this.dataDiagnose.numberQuestion += 1;
                this.dataDiagnose.startQuestion += 1;
                if (this.dataDiagnose.postData.type === "enneagram") {
                  nextDiagnoseKey = diagnoseQuestion[dataPoint];
                  this.dataAnswer.set(this.dataDiagnose.currentQuestion, nextDiagnoseKey);
                } else if (this.dataDiagnose.postData.type === "career_anchor") {
                  nextDiagnoseKey = 'Q' + this.dataDiagnose.startQuestion;
                  this.argolithmCareer(dataPoint, dataGroup);
                  this.dataAnswer.set(this.dataDiagnose.currentQuestion, event.target.value);
                }
                this.evtNextDiagnoseQs(nextDiagnoseKey);
              } else {
                switch (this.dataDiagnose.postData.type) {
                  case "enneagram":
                    this.dataAnswer.set(this.dataDiagnose.numberQuestion, diagnoseQuestion[dataPoint]);
                    this.dataDiagnose.postData.result_type = diagnoseQuestion[dataPoint];
                    this.disableOptionAnswer();
                    document.querySelector(".progress-bar__inner").style.width = "100%";
                    this.dataDiagnose.postData.data = this.mapToString(this.dataAnswer);
                    this.postMessage("postData", this.dataDiagnose.postData);
                    break;
                  case "career_anchor":
                    this.argolithmCareer(dataPoint, dataGroup);
                    this.dataAnswer.set(this.dataDiagnose.numberQuestion, event.target.value);
                    this.compareCareer();
                    break;
                }
              }
            }
          }
        })
      );
    });
    answerListElement.appendChild(fragment);
  }

  // Backward compatibility
  createAnswerOptionDiagnosisNew(diagnoseQuestion, keyQs, orderQs) {
    this.createAnswerOptions({ diagnoseQuestion, keyQs, orderQs, isNew: true });
  }

  createAnswerOption(diagnoseQuestion) {
    this.createAnswerOptions({ diagnoseQuestion });
  }
  
  disableOptionAnswer() {
    const answerOption = document.querySelectorAll(".qs-answer__option");
    for (let i = 0; i < answerOption.length; i++) {
      answerOption[i].classList.add("disabled", "not-allow");
    }
  }
  
  restartDiagnose() {
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

  mapToString(map) {
    return JSON.stringify(Object.fromEntries(map));
  }
  
  evtBackHomPage() {
    this.postMessage('backPage', { "value":"home"} );
  }
  
  evtNextPageDiagnose(e) {
    // document.getElementById("start_diagnose").classList.add('hide');
    // document.querySelector('body').appendChild(this.ComponentModal());
    // document.getElementById("diagnose").classList.remove('hide');
    //this.fadeInRight(document.getElementById("diagnose"));

    const typeDiagnose = e.target.getAttribute('data-type');
    if (!typeDiagnose) return;

    // const diagnoseHandlers = {
    //   'enneagram': () => new Enneagrame().initEnneagrame(this.dataEnneagram, typeDiagnose),
    //   'career_anchor': () => new Career().initCareer(this.dataCareer, typeDiagnose),
    //   'p16_types': () => new Diagnosis().init(this.dataP16Types, typeDiagnose)
    // };
    // if (diagnoseHandlers[typeDiagnose]) {
    //   diagnoseHandlers[typeDiagnose]();
    // }
    console.log({ type: typeDiagnose });
    this.postMessage('toPage', { type: typeDiagnose });
  }
  
  nextDiagnoseStep(key, options = {}) {
    if (!this.keyExistInObj(this.dataDiagnose.listQuestion, key)) return;
    const questionData = this.dataDiagnose.listQuestion[key];
    if (options.isNew) {
      const orderCurrentQuestion = questionData.order;
      this.showProgressNew(orderCurrentQuestion, key);
      this.createDiagnoseQsNew(questionData, key, orderCurrentQuestion);
    } else {
      this.createDiagnoseQs(questionData);
      this.showProgress();
    }
  }

  // Backward compatibility for existing calls
  evtNextDiagnoseQs(key) {
    this.nextDiagnoseStep(key);
  }

  evtNextDiagnoseQsNew(key) {
    this.nextDiagnoseStep(key, { isNew: true });
  }
  
  evtOpenModal() {
    document.querySelector('.modal').classList.add("fadeinBottom");
  }
  
  evtCloseModal() {
    document.querySelector('.modal').classList.remove("fadeinBottom");
  }
  
  evtBackStartPage() {
    var self = this;
    document.querySelector('.modal').classList.remove("fadeinBottom");

    setTimeout(function() {
      self.restartDiagnose();
      console.log(self.dataDiagnose);
      document.getElementById("diagnose").classList.add('hide');
      document.getElementById("start_diagnose").classList.remove('hide');
      document.querySelector('.modal').remove();
    }, 500);
    this.postMessage('backPage', { value: "top" });
  }
  
  showProgress() {
    const increment = Math.ceil((this.dataDiagnose.currentQuestion) / (this.dataDiagnose.maxDiagnose) * 100);
    const progressMeter = document.getElementById("progressMeter");
      progressMeter.style.width = (increment) + '%';
  } 

  showProgressNew(orderQs, nextQs) { 
    const progressMeter = document.getElementById("progressMeter");
    const totalQuestion = this.dataDiagnose.maxDiagnoseNew;
    const percentPerQuestion = (1 / totalQuestion) * 100;
    if (nextQs == "" || nextQs == null || nextQs == undefined) { 
      progressMeter.style.width = '100%';
    } else {
      progressMeter.style.width = (orderQs - 1) * percentPerQuestion + '%';
    }
  }
  
  findSecondQuestion() {
    return this.dataDiagnose.listQuestion.Q2;
  }
  
  fadeInRight(elem) {
    const styleElem = window.getComputedStyle(elem);
    const matrix = new WebKitCSSMatrix(styleElem.transform);
    const widthDevice = window.innerWidth > 0 ? window.innerWidth : screen.width;
    let step = widthDevice >= 768 ? 50 : 15;
    let currentX = matrix.m41;
    if (currentX <= 0) {
      elem.style.transform = "translateX(0px)";
      return;
    }
    elem.style.transform = `translateX(${currentX - step}px)`;
    window.requestAnimationFrame(() => this.fadeInRight(elem));
  }

  /**
   * Check key in object exist or not exist 
   * @param {*} obj 
   * @param {*} key 
   */
  keyExistInObj(obj, key) {
    if (!obj || !(key in obj)) {
      this.postMessage('logError', { error: `key ${key} does not exist` });
      return false;
    }
    return true;
  }

  /**
   * Check type and object empty
   * @param {*} obj 
   * @returns boolean
   */
  checkObjNotEmpty(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      this.postMessage('logError', { error: 'Parameter is not a valid object' });
      return false;
    }
    if (Object.keys(obj).length === 0) {
      this.postMessage('logError', { error: 'Object is empty' });
      return false;
    }
    return true;
  }
  
  postMessage(fncName, msg){
    msg = JSON.stringify(msg);
    
    if( 'webkit' in window ){
      window.webkit.messageHandlers[fncName].postMessage(msg);
    }else if( 'android' in window ) {
      (window.android || window.Android)[fncName](msg);
    }
  }
}
  
/**
 * Enneagrame argolithm
 */
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
    if (this.keyExistInObj(this.dataDiagnose.listQuestion, 'Q' + this.dataDiagnose.numberQuestion + 1)) {
      this.createDiagnoseQs(this.findSecondQuestion());
      this.showProgress();
    }
  }
}
  
//Enneagrame.prototype = baseQuestion.prototype;

/**
 * Career anchor argolithm
 */
class Career extends BaseQuestion {
  constructor() {
    super();
    this.optScores = {};
    this.listType = [];
  }
  initCareer(params, isType) {
    this.isType = isType;
    this.params = params;
    this.optScores = {};
    this.listType = [];
    this.objCareer();
  }
  objCareer() {
    this.dataDiagnose.listQuestion = this.params.items;
    this.dataDiagnose.optionAnswer = this.params.answers;
    this.dataDiagnose.postData.type = this.isType;
    this.dataDiagnose.maxDiagnose = Object.keys(this.params.items).length - 1;
    if (this.keyExistInObj(this.dataDiagnose.listQuestion, 'Q' + this.dataDiagnose.numberQuestion + 1)) {
      this.createDiagnoseQs(this.findSecondQuestion());
      this.showProgress();
    }
    this.assignObjScore();
  }
  assignObjScore() {
    // Lấy tất cả group, lọc duy nhất, sắp xếp và khởi tạo điểm số
    const groups = [...new Set(Object.values(this.dataDiagnose.listQuestion).map(item => item.group).filter(Boolean))].sort();
    this.listType = groups;
    groups.forEach(g => { this.optScores[g] = 0; });
  }
  argolithmCareer(point, group) {
    if (group in this.optScores && typeof this.optScores[group] === "number") {
      this.optScores[group] += Number(point);
    }
  }
  compareCareer() {
    console.log(this.optScores);
    const max = Math.max(...Object.values(this.optScores));

    const getKeyMax = Object.keys(this.optScores).filter(key => this.optScores[key] == max);
    if (getKeyMax.length == 1) {
      const isNumberType = this.listType.findIndex(item => item == getKeyMax[0]);
      this.dataDiagnose.postData.result_type = 'TYPE' + (isNumberType + 1);
      document.querySelector(".progress-bar__inner").style.width = "100%";
      this.disableOptionAnswer();
      this.dataDiagnose.postData.data = this.mapToString(this.dataAnswer);
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
    // Lấy các đáp án, loại bỏ key 'text', giữ nguyên thứ tự
    const filterOptionLastCareer = Object.fromEntries(
      Object.entries(lastQsCareer).filter(([k]) => k !== "text")
    );
    const answerList = document.querySelector('.qs-answer');
    this.dataDiagnose.maxDiagnose += 1;
    this.dataDiagnose.numberQuestion += 1;
    if (this.checkObjNotEmpty(lastQsCareer)) this.createQuestion(lastQsCareer);
    answerList.innerHTML = "";
    if (this.checkObjNotEmpty(filterOptionLastCareer)) {
      Object.entries(filterOptionLastCareer).forEach(([option, label]) => {
        const evtCheckHandler = (e) => {
          this.dataDiagnose.postData.result_type = e.target.value;
          this.disableOptionAnswer();
          document.querySelector(".progress-bar__inner").style.width = "100%";
          this.dataAnswer.set(this.dataDiagnose.numberQuestion, e.target.value);
          this.dataDiagnose.postData.data = this.mapToString(this.dataAnswer);
          this.postMessage('postData', this.dataDiagnose.postData);
        };
        answerList.appendChild(
          this.ComponentOptionAnswer({
            id: option,
            name: "",
            value: option,
            data_text: label,
            text_label: label,
            evtCheckHandler
          })
        );
      });
    }
  }
}

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
    const keyWithOrder1 = Object.keys(this.dataDiagnose.listQuestion).find(key => this.dataDiagnose.listQuestion[key] === elementWithOrder1);
    this.createDiagnoseQs(this.dataDiagnose.listQuestion[keyWithOrder1]);
    this.createDiagnoseQsNew(this.dataDiagnose.listQuestion[keyWithOrder1], keyWithOrder1, elementWithOrder1.order);
    this.showProgressNew(keyWithOrder1, elementWithOrder1.order);
  }
}
  
const isBaseQs = new BaseQuestion();

window.isDiagnose = (params) => { 
  let e = null, isSuccess = false;
  try { 
    switch((params.type||'').toLowerCase()) {
      case "ios":
        const ios = new iOS();
          break;
      case "android": 
        const android = new Android();
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

isDiagnose({
  "type":"ios",
  "device":"iPhone 8", 
  "destination": "",
  "is_page_top": true,
  "data": {
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
    "html": "https://www.test.learningpocket.com/diagnostic_new/diagnose_top.html",
    "p16_types": {
        "title": "16タイプ 性格×適職診断",
        "sub_title": "─ 相性の良い上司・同僚のタイプもわかる！─<br>今話題の「16タイプ診断」で適職を探してみませんか？",
        "img": "https://test.learningpocket.com/uploads/diagnostic/images/tm9l86Yai6Ekh1xp.jpg",
        "description": "紹介文",
        "mode": "POINT",
        "question_max": 1,
        "question_count": 1,
        "option_max": 1,
        "result_total": 1,
        "items": {
            "1": {
                "text": "1",
                "order": 1,
                "max_option": 1,
                "count_option": 1,
                "answers": {
                    "XgfUtNocHTA3j2WeKli": {
                        "text": "AAAA",
                        "point": 5,
                        "order": 0,
                        "next": ""
                    }
                }
            }
        }
    }
}})
})()