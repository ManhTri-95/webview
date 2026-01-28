(function (){
  window.resultPage = function(){}
  resultPage.prototype.init = function(response) {
    if (this.isNotEmptyObject(response)) {
      this.response = response;
      this.data = this.response.data;
      this.baseUrl = 'https://' + location.host;
      this.createUI();
    } else {
      this.postMessage('logError', { error: 'Data passed in is correct' });
    }
  }

  resultPage.prototype.createUI = function () {
    var body = document.getElementsByTagName('body')[0];
    
    var container = document.createElement("div");
    container.className ="container";

    container.prepend(this.ComponentHeader("診断結果"), this.ComponentMain())
    body.prepend(container);
  }

  /**
 * create component Header
 * @returns HTML
 */
  resultPage.prototype.ComponentHeader = function(text) {
    var header = document.createElement("herder");
    header.className ="header-container";

    var headerTop =  document.createElement("div"),
    headerLabel = document.createElement("div");
    headerLabel.className = "header-label text-truncate";
    headerLabel.textContent = text || "";
    
    const elBtnBackTop = document.createElement("div");
    elBtnBackTop.className = "btn-top";
    const iconBackTop = document.createElement("img");
    iconBackTop.setAttribute("src", this.baseUrl + '/assets/images/ic_arrow_back.png');
    iconBackTop.addEventListener("click", this.evtBackPage.bind(this));
    elBtnBackTop.appendChild(iconBackTop);


    headerTop.appendChild(elBtnBackTop);
    headerTop.className = "header-top";
    header.prepend(headerTop, headerLabel);

    return header;
  }

  resultPage.prototype.ComponentMain = function() {
    var main = document.createElement("section");
    main.className = "main-container"
  
    main.prepend(this.ComponentTitle(), this.ComponentContent());

    return main;
  }

  resultPage.prototype.ComponentTitle = function() { 
    var title = document.createElement("div");
    title.className = "header-title text-center text-truncate";
    
    var text = document.createElement("span");
    text.className = "fs-16";
    text.textContent = "あなたは";

    var textType = document.createElement("span");
    textType.className = "fs-20";
    textType.textContent = this.data.text;

    title.prepend(text, textType);

    return title;
  }

  resultPage.prototype.ComponentContent = function () {
    var content = document.createElement("div");
    content.className = "result-content";
    divBtn =  document.createElement("div");
    divBtn.className = "text-center result-button";
    divBtnBackHome = document.createElement("div");
    divBtnBackHome.className = "text-center result-button mt-20px";
    divChangeUI = document.createElement("div");
  
    if (this.data.hasOwnProperty('img') && (this.data.img ||'') !== null) {
      content.appendChild(this.LayoutFisrtImg());
    }
  
    if (this.data.hasOwnProperty('aptitude') && (this.data.aptitude || '') !== null) {
      var titleAptitude = 'あなたの適性';
      content.appendChild(this.ComponentIsContent(titleAptitude, this.data.aptitude));
    }

    if (this.data.hasOwnProperty('strength') && (this.data.strength || '') !== null ) {
      var titleStrength = 'あなたの強み';
      content.appendChild(this.ComponentIsContent(titleStrength, this.data.strength));
    }

    if (this.data.hasOwnProperty('advice') && (this.data.advice || '') !== null) {
      var titleAdvice = this.data.type == 'ENNEAGRAM' 
        ? 'ステップアップのアドバイス' 
        : '活躍するためのポイント';
      content.appendChild(this.ComponentIsContent(titleAdvice, this.data.advice));
    }

    
    //divChangeUI.className = this.data.type == "CAREER_ANCHOR" ? "anreer-anchor" : "enneagram";
    
    if(this.isNotEmptyObject(this.data.bottom_rc) || this.isNotEmptyObject(this.data.top_rc)) {
      divChangeUI.appendChild(this.LayoutContentSupport());
    }

    if (this.data.hasOwnProperty('customer_comment') && this.data.customer_comment.length !== 0) {
      divChangeUI.appendChild(this.LayoutCustomerComment(this.data.customer_comment));
    }

    content.appendChild(divChangeUI);

    var divGroupBtn = document.createElement("div");
    divGroupBtn.appendChild(
      this.ComponentLabel({
        isClass: "content-label yellow fs-14",
        text: "あなたにマッチしそうな</br>お仕事を見てみませんか？"
      })
    );


    var link_job = (this.data.user_type ||'').toUpperCase() === 'STAFF' 
      ? 'https://www.022022.net/sp/?vos=pocket_check01'
      : 'https://www.staffservice.co.jp/?vos=pocket_check3',
        divJobSearch = document.createElement("div");
    divJobSearch.className = "text-center result-button mb-15";
    divJobSearch.appendChild(this.ComponentButton({
        text: "お仕事検索はこちら",
        icon: this.baseUrl + '/assets/images/icon_search.png',
        isClass: "btn--large btn--blue1",
        data_link: link_job,
        pressHandler: this.evtToLinkBrowser.bind(this)
      }),
    );

    /**Create button login my page */
    var divLoginMyPage = document.createElement("div");
    divLoginMyPage.className = "text-center result-button mb-15";
    divLoginMyPage.prepend(this.ComponentButton({
        text: "マイページにログイン",
        icon: this.baseUrl + '/assets/images/icon_lock.png',
        isClass: "btn--large btn--pink",
        data_link: "https://mypage.022022.net/user/sp/sa09020?vos=pocket_check2",
        pressHandler: this.evtToLinkBrowser.bind(this)
      }),
    );

    /**Create button login service my page */
    var divLoginService = document.createElement("div");
    divLoginService.className = "text-center result-button mb-15";
    divLoginService.appendChild(
      this.ComponentButton({
        text: "スタッフサービスに派遣登録する",
        icon: this.baseUrl + '/assets/images/icon_edit.png',
        isClass: "btn--large btn--blue",
        data_link: "https://www.022022.net/service/sp/sc11040?vos=pocket_check4",
        pressHandler: this.evtToLinkBrowser.bind(this)
      })
    );

    switch((this.data.user_type ||'').toUpperCase()) { 
      case "STAFF": 
        divGroupBtn.appendChild(divJobSearch);
        divGroupBtn.appendChild(divLoginMyPage);
        content.appendChild(divGroupBtn);
        break;
      
      case "GUEST":
        divGroupBtn.appendChild(divLoginService);
        divGroupBtn.appendChild(divJobSearch);
        content.appendChild(divGroupBtn);
        break;
      default: 
        break;
    }

    
    content.appendChild(this.ComponentLabel({
      isClass: "content-label fs-14 mb-0 light", 
      text: "＼もう一度診断したい方はこちら！！／"})
    );

    divBtn.appendChild(this.ComponentButton({
      text: "もう一度診断する", 
      isClass: "btn--large btn--primary", 
      pressHandler: this.evtBackStartPage.bind(this)
    }));

    divBtnBackHome.appendChild(this.ComponentButton({
      text: "ホームへ戻る",
      isClass:"btn--large text-black",
      pressHandler: this.evtBackHomePage.bind(this)
    }))
    content.appendChild(divBtn);
    content.appendChild(divBtnBackHome);

    return content;
  }

  resultPage.prototype.LayoutFisrtImg = function () {
    var divImg = document.createElement("div");
    divImg.classList = "text-center";

    var img = document.createElement("img");
    img.classList = "result-content__img";
    img.setAttribute("src", this.data.img)

    divImg.appendChild(img);

    return divImg;
  }

  resultPage.prototype.LayoutContentSupport = function () {
    var contentSupport = document.createElement("div");
    
      contentSupport.appendChild(this.ComponentLabel({
        isClass:  "content-label blue",
        text: "あなたのステップアップを</br>＼サポートするコンテンツをチェック！／"
      }));
      
      if (this.data.hasOwnProperty("top_rc") && this.isNotEmptyObject(this.data.top_rc)) {
        contentSupport.appendChild( this.LayoutItemSupport(this.data.top_rc));
      }
      if (this.data.hasOwnProperty("bottom_rc") && this.isNotEmptyObject(this.data.bottom_rc)) {
        contentSupport.appendChild( this.LayoutItemSupport(this.data.bottom_rc));
      }
   
    return contentSupport;
  }

  resultPage.prototype.LayoutItemSupport = function (params) {
    var item = document.createElement("div"),
      item_img = document.createElement("div"),
      img = document.createElement("img"),
      item_btn = document.createElement("div"),
      btn = document.createElement("button"),
      item_content = document.createElement("p");

    item.className = "content-item";
    item_img.className = "text-center mb-15";
    img.setAttribute("doc_id", params.doc_id);
    img.setAttribute("doc_code", params.doc_code);
    img.setAttribute("doc_title", params.doc_title);
    img.setAttribute("doc_type", params.doc_type);
    img.addEventListener("click", this.evtToMaterials.bind(this));
    img.setAttribute("src", params.doc_thumb);
    item_img.appendChild(img);

 
    item_btn.className = "result-button text-center mb-15";
    item_btn.appendChild(btn);
    btn.className = "btn btn--large btn--error";
    btn.textContent = "この教材を見る";
    btn.setAttribute("doc_id", params.doc_id);
    btn.setAttribute("doc_code", params.doc_code);
    btn.setAttribute("doc_title", params.doc_title);
    btn.setAttribute("doc_type", params.doc_type);
    btn.addEventListener("click", this.evtToMaterials.bind(this));

    item_content.innerHTML = params.memo;
    item.prepend(item_img, item_btn, item_content);
    return item;
  }

  resultPage.prototype.LayoutCustomerComment = function (params) {
    var compCustomerComment = document.createElement("div"),
      divCenter = document.createElement("div"),
      compComment = document.createElement("div");
    compCustomerComment.className = "mb-15";
    divCenter.className = "text-center";
    divCenter.appendChild(this.ComponentButton({
      text:'キャリアコンサルティング申し込み', 
      isClass: 'btn--large btn--warning', 
      pressHandler: this.evtBackCounsutingPage.bind(this)
    }));

    for (var item of params) {
      var commentItem = document.createElement("div"),
        commentImage = document.createElement("div"),
        imgItem = document.createElement("img"),
        commentText = document.createElement("div");
      
      commentItem.className = "comment-item";
      commentImage.className = "comment__image";
      imgItem.setAttribute("src", item.img);

      commentText.className = "comment__text";
      commentText.innerHTML = item.text;

      commentImage.appendChild(imgItem);
      commentItem.prepend( commentImage, commentText);
      compComment.appendChild(commentItem);
    }

    if ((this.data.user_type ||'').toUpperCase() === 'STAFF' ||
    (this.data.user_type ||'').toUpperCase() === 'GUEST'){
      compCustomerComment.appendChild(this.ComponentLabel({
        isClass: "content-label fs-14 mb-0 light",
        text: "もし道に迷ったら</br>キャリアカウンセリングを受講しませんか？"
      }))

      compCustomerComment.appendChild(divCenter)
    }

    compCustomerComment.appendChild(
      this.ComponentLabel({
        isClass: "content-label fs-14 mt-15 success", 
        text: "キャリアコンサルティング<br>受講者の声" }),
    );
    compCustomerComment.appendChild(compComment);
    return compCustomerComment;
  }

  resultPage.prototype.ComponentButton = function({text, isClass, data_link, icon, pressHandler}) { 
    data_link = (typeof data_link === 'undefined') ? '' : data_link;
    icon = (typeof icon === 'undefined') ? '' : icon;
    text = (typeof text === 'undefined') ? '' : text;
    var button = document.createElement("button"),
      innerButton = document.createElement("div");
      button.className = 'btn ' + isClass;
      button.setAttribute("data_link", data_link);

      innerButton.className = 'inner-btn'

      if(icon != '') {
        console.log(icon)
        var iconImg = document.createElement('img');
        iconImg.setAttribute('src', icon);
        iconImg.setAttribute('width', 17);
        iconImg.style.marginRight = '5px';
        innerButton.appendChild(iconImg)
      }

      if(text != '') {
        var spanText = document.createElement('span')
        spanText.textContent = text;
        innerButton.appendChild(spanText)
      }
      //button.textContent = text;
    button.appendChild(innerButton)
    button.addEventListener("click", pressHandler);
  
    return button;
  }

  resultPage.prototype.ComponentLabel = function({isClass, text}) {
    var divLabel = document.createElement("div");
    divLabel.className = isClass;
    divLabel.innerHTML = text;

    return divLabel;
  }

  resultPage.prototype.ComponentIsContent = function (title, isContent) { 
    var CompContent= document.createElement("div");
    CompContent.className = "content-item";

    var titleItem = document.createElement("p");
    titleItem.className = "tite-cate";
    titleItem.textContent = title;

    var content = document.createElement("p");
    content.textContent = isContent;

    CompContent.prepend(titleItem, content);

    return CompContent;
  }
  
  resultPage.prototype.isNotEmptyObject = function(obj) {
    //return Object.keys(value).length === 0 && value.constructor === Object;
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

  resultPage.prototype.postMessage = function(fncName, msg){
		msg = JSON.stringify(msg);
		
		if( 'webkit' in window ){
			window.webkit.messageHandlers[fncName].postMessage(msg);
		}else if('android' in window ) {
			(window.android || window.Android)[fncName](msg);
		}
	}

  resultPage.prototype.evtBackStartPage = function () {
    this.postMessage('backPage', { "value":"start_diagnose" })
  }

  resultPage.prototype.evtToMaterials = function (e) {
    this.postMessage('toDetails', { "id": e.target.getAttribute("doc_id") })
  }

  resultPage.prototype.evtBackCounsutingPage = function() {
    this.postMessage('backPage', { "value": "booking_counsuting" })
  }

  resultPage.prototype.evtToLinkBrowser = function (e) {
    this.postMessage('toLinkBrowser', { "value": e.target.getAttribute("data_link") })
  }

  resultPage.prototype.evtBackHomePage = function () {
    this.postMessage('backPage', { "value": "home" })
  }

  resultPage.prototype.evtBackPage = function () {
    console.log('ok tess')
    this.postMessage('backPage', { "value":"back_page" })
  }


  var result = new resultPage();
  window.isResult = function(data) {
    var e = null, isSuccess = false;
    try { 
      result.init(data)
      isSuccess = true;
    }catch (error){
      e = error.message;
    }
    result.postMessage('loadFinished', {error: e, "success": isSuccess});
    return isSuccess;
  }
  result.postMessage('javascriptLoaded', {"success": true});
  isResult({"type":"android","version":32,"device_name":"Pixel 3a","data":{"text":"生活様式タイプ","img":"https://d2p333gdzaltfu.cloudfront.net/diagnostic/career-anchor/type_8.png","aptitude":"あなたは、日々をバランスよく楽しみたいと願っている人です。一見、おっとりしているよ\nうに見えても、仕事とプライベートを上手に両立させながら、どちらの幸せもつかみたいと\nいうしっかり者でもあります。ハードすぎない仕事を長く続けていきたいあなたには、大手\n企業の会社員や残業の少ないデスクワークなどが適しています。育児休暇、有給休暇などの\n制度が整った組織に守られながら、家庭や子育ての時間をもつことが人生を輝かせるでし\nょう。","advice":"あなたがオンでもオフでも笑顔でいられるキーワードは、「両立」「家庭的」「充足感」。仕事\nもプライベートも大切にして両立させることで、キャリアアップしつつも家庭的な幸せを\n得ることができます。きっと年を重ねるごとに自らの人生が充足感に満ちてくることでし\nょう。これは、平凡な幸せのように見えて現代ではハードルの高い理想的な人生でもありま\nす。しっかりと計画性をもって資格取得や人生設計などに取り組むなど、準備することが重\n要です。","customer_comment":[{"text":"現状をお話ししたところ優しく受け止めていただき、これから目指す方向や自分に必要なことを的確に示してもらえました。（30代/女性）","img":"https://d2p333gdzaltfu.cloudfront.net/diagnostic/ctm_comment/voice_01.png"},{"text":"とてもフレンドリーに話してくださり、ポジティブな気持ちになれました。（60代/女性）","img":"https://d2p333gdzaltfu.cloudfront.net/diagnostic/ctm_comment/voice_02.png"},{"text":"世の中のキャリアコンサルタントにはこちらの相談をきちんと聞かずに一方的に話すような方もいますが、スタッフサービスのコンサルタントは共感し、励まし、解決の糸口を見つけてくれました。（40代/女性）","img":"https://d2p333gdzaltfu.cloudfront.net/diagnostic/ctm_comment/voice_03.png"}],"top_rc":{},"bottom_rc":{"doc_id":"129","doc_code":"bdghrkvri8lho1VKCRF","doc_title":"test document 45 new","doc_type":"YOUTUBE","doc_thumb":"https://test-lac.learningpocket.com/uploads/teacher/EvVbU9pomcFgD1JlSt/oi53yrc6gt2f/mt_1253922500_v1_khAi1h8rk.PNG","memo":"このページでは、診断コンテンツ結果ページに表示される動画と紹介文を設定するページです"},"type":"CAREER_ANCHOR","result_type":"TYPE8","user_type":"GUEST","html":"https://test-lac.learningpocket.com/diagnostic/result.html"}})

})()