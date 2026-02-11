(function (){

  window.resultPage = function(){}

  resultPage.prototype.debug = function(data){
    if( location.search.indexOf('debug=1') !== false ){
        console.log(data);
    }
  }

  resultPage.prototype.init = function(response) {
    this.response = response;
    this.data = this.response.data;
    this.baseUrl = 'https://' + location.host;
    this.imgDefault = '/assets/banner_image.png';
    this.firstResult = this.response.first_result;
    if (this.data) {
      this.createUI();
    }
  }

  resultPage.prototype.isEmptyObject = function(obj) {
    return Object.keys(obj).length === 0;
  }

  resultPage.prototype.createComponent = function(tag, className, textContent, attributes = {}) {
    const element = document.createElement(tag);
    element.className = className || "";
    element.innerHTML = textContent || "";
  
    for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, value);
    }
  
    return element;
  }

  resultPage.prototype.createUI = function () {
    const body = document.body;
    body.innerHTML = ""; 
    const container = document.createElement("div");
    container.className ="container";

    container.prepend(this.ComponentHeader(), this.ComponentMain())
    body.prepend(container);

    window.scrollTo(0, 0);
  }

  /**
   * create component Header
   * @returns HTML
   */
  resultPage.prototype.ComponentHeader = function() { 
    const elHeader = this.createComponent("header", "header-container", "", {});
    const elHeaderTop = this.createComponent("div", "header-top", "", {});
    const elHeaderLabel = this.createComponent("div", "header-label text-truncate", "診断結果", {});
    
    const elBtnBackTop = this.createComponent("div", "btn-top", "", {});
    elBtnBackTop.appendChild(this.createComponent("img", "", "", { src : this.baseUrl + '/assets/images/ic_arrow_back.png'}));
    elBtnBackTop.addEventListener('click', () => {
      if (!this.firstResult) {
        this.evtReviousResult();
      } else {
        this.evtBackPage();
      }
    });

    // if (!this.firstResult) {
      elHeaderTop.appendChild(elBtnBackTop);
    // }
    
    elHeader.prepend(elHeaderTop, elHeaderLabel)
    return elHeader;
  };

  resultPage.prototype.ComponentMain = function() { 
    const { title, label } = this.data;

    const elMain = this.createComponent("section", "main-container");
    const elTitle =  this.createComponent("div", "header-title text-center", "", {});
    const elTextTitle = this.createComponent("span", "fs-16", label);
    const elTextType = this.createComponent("span", "fs-20", title, {}); 

    elTitle.prepend(elTextTitle, elTextType)

    elMain.prepend(elTitle, this.ComponentContent(), this.LayoutGroupButton());
    
    return elMain;
  }

  resultPage.prototype.ComponentContent = function() { 
    const { img, detail_top, detail_bot, customer_comment, doc_rc, user_type } = this.data;

    const elContent = this.createComponent("div", "result-content", "", {});

    if (this.data.hasOwnProperty('img') && (img ||'') !== null) {
      elContent.appendChild(this.LayoutTopResult(img))
    }

    if (this.data.hasOwnProperty('detail_top')  && detail_top.length > 0) {
      elContent.appendChild(this.LayoutContent(detail_top))
    }

    if (this.data.hasOwnProperty('detail_bot')  && detail_bot.length > 0) {
      elContent.appendChild(this.LayoutContent(detail_bot, false))
    }

    if(this.data.hasOwnProperty('doc_rc') && !this.isEmptyObject(doc_rc)) {
      elContent.appendChild(this.LayoutSupportContent(doc_rc))
    }

    if(this.data.hasOwnProperty('customer_comment') && customer_comment.length > 0) {
      elContent.appendChild(this.LayoutCustomerComment(customer_comment));
    }

    elContent.appendChild(this.LayoutContentBottom(user_type));

    return elContent;
  }

  resultPage.prototype.LayoutTopResult = function(img) {
    const elDivImage = this.createComponent("div", "text-center content-item");
    const elImage = this.createComponent("img", "result-content__img", "", {
      src: img,
    });

    // const eLTopDesc = this.createComponent("div", "", );
    elDivImage.appendChild(elImage);
    return elDivImage;
  };

  resultPage.prototype.loadImage = function(item, defaultSrc, successCallback, errorCallback, eventHandlers = []) {
    const img = new Image();
    let errorOccurred = false;

    img.onload = function() {
      if (typeof successCallback === 'function') {
        successCallback(img);
      }
    };

    img.onerror = function() {
      if (!errorOccurred) {
        errorOccurred = true;
        img.src = defaultSrc;
        img.onerror = null;
        if (typeof errorCallback === 'function') {
          errorCallback(img);
        }
      }
    };

    img.setAttribute('alt', '');
    img.setAttribute('data_next', item.next_result || '');

    if (eventHandlers.length > 0) {
      eventHandlers.forEach(eventHandler => {
          const { eventName, handler } = eventHandler;
          img.addEventListener(eventName, handler);
      });
    }

    if (item.img && item.img.length > 0) {
      img.src = item.img;
    } else {
      img.src = defaultSrc;
    }

    return img;
  }


  resultPage.prototype.LayoutContent = function(contents, isDetailTop = true) {
    const elBlockContent = this.createComponent("div", "mt-15", "" , {});
    for (const item of contents) {
      const elItemContent = this.createComponent("div", "content-item", "");
      const elTitle = this.createComponent("div", "tite-cate mb-15 mt-15", item.title, isDetailTop ? {} : { data_next: item.next_result });
      if (elTitle || !isDetailTop) {
        elTitle.addEventListener('click', (e) => {
          const nextId = e.target.getAttribute("data_next") || false;
          if (nextId && nextId != "") {
            this.evtNextResult(nextId)
          }
        });
      }
      
      let elImage = '';

      elImage = this.createComponent("div", "text-center mb-15");
      this.loadImage(
        item,
        this.imgDefault,
        function(successImg) {
          elImage.appendChild(successImg);
        },
        function(errorImg) {
          elImage.appendChild(errorImg);
        },
        [
          {
            eventName: 'click',
            handler: function(e) { 
              const nextId = e.target.getAttribute("data_next");
              if (nextId != "") {
                this.evtNextResult(nextId)
              }
            }.bind(this)
          }
        ]
      );
      

      let elDesc = '';
      if (item.detail.length > 0) {
        elDesc = this.createComponent("div", "", item.detail, isDetailTop ? {} : { data_next: item.next_result });

        if (elDesc || !isDetailTop) {
          elDesc.addEventListener('click', (e) => {
            const nextId = e.target.getAttribute("data_next") || false;

            if (nextId && nextId != "") {
              this.evtNextResult(nextId)
            }
          });
        }
      }
     
      elItemContent.appendChild(elTitle);
      if (elImage && !isDetailTop) {
        elItemContent.appendChild(elImage);
      }
      if (elDesc) {
        elItemContent.appendChild(elDesc);
      }
      elBlockContent.appendChild(elItemContent)
    }
   
    return elBlockContent;
  };

  resultPage.prototype.LayoutCustomerComment = function (data) {
    const elBlockComment = this.createComponent("div", "mb-15");
    const elTitle = this.createComponent("div", "content-label fs-14 mb-0 light", "もし道に迷ったら</br>キャリアカウンセリングを受講しませんか？", {});
    const elBlockButton = this.createComponent("div", "text-center", "", {});
    const elLabel = this.createComponent("div", "content-label fs-14 mt-15 success", "キャリアコンサルティング<br>受講者の声", {});
    
    elBlockButton.appendChild(this.ComponentButton({
      text:'キャリアコンサルティング申し込み', 
      isClass: 'btn--large btn--warning', 
      pressHandler: this.evtBackCounsutingPage.bind(this)
    }));

    const elListComment = this.createComponent("div", "");

    for(const item of data) {
      const elCommentItem = this.createComponent('div', "comment-item", "", {});
      const elBlockImage = this.createComponent('div', 'comment__image', '',  {});
      const elImage = this.createComponent('img', '', '', {src: item.img, alt: 'Image' });
      const elText = this.createComponent('div', 'comment__text', item.text, {});

      elBlockImage.appendChild(elImage);
      elCommentItem.prepend(elBlockImage, elText);

      elListComment.appendChild(elCommentItem)
    }
    
    elBlockComment.append(elTitle, elBlockButton, elLabel, elListComment);
    return elBlockComment;
  };

  resultPage.prototype.LayoutSupportContent = function(data) {
    const elBlockContent = this.createComponent("div", "mt-20px");
    const elItemContent = this.createComponent("div", "content-item", "", {});

    const elBlockImage = this.createComponent("div", "text-center mb-15", "", {});
    const elImage = this.createComponent("img", "", "", {
      doc_id: data.doc_id,
      doc_code: data.doc_code,
      doc_title: data.doc_title,
      doc_type: data.doc_type,
      src: data.doc_thumb
    });

    const elBlockBtn = this.createComponent("div", "result-button text-center mb-15");
    const elBtn = this.createComponent("button", "btn btn--large btn--error", "この教材を見る", {
      doc_id: data.doc_id,
      doc_code: data.doc_code,
      doc_title: data.doc_title,
      doc_type: data.doc_type,
    });
    elBlockBtn.appendChild(elBtn);

    const elText = this.createComponent("p", "", data.memo);

    elImage.addEventListener("click", this.evtToMaterials.bind(this));
    elBtn.addEventListener("click", this.evtToMaterials.bind(this));

    elBlockImage.appendChild(elImage);
    elItemContent.append(elBlockImage, elBlockBtn, elText);
    elBlockContent.appendChild(this.createComponent("div", "content-label blue", "あなたのステップアップを</br>＼サポートするコンテンツをチェック！／", {}));
    elBlockContent.appendChild(elItemContent);

    return elBlockContent;
  }

  resultPage.prototype.LayoutContentBottom = function (userType) {
    const elBlockBottom = this.createComponent("div", "", "", {});
    const elLabel = this.createComponent("div", "content-label yellow fs-14", "あなたにマッチしそうな</br>お仕事を見てみませんか？", {});
    
    const link_job = (userType || '').toUpperCase() === 'STAFF'
      ? 'https://www.022022.net/sp/?vos=pocket_check01'
      : 'https://www.staffservice.co.jp/?vos=pocket_check3';

    const elBlockBtnLoginService = this.createComponent("div", "text-center result-button mb-15","", {});
    elBlockBtnLoginService.appendChild(
      this.ComponentButton({
        text: "スタッフサービスに派遣登録する",
        icon: this.baseUrl + '/assets/images/icon_edit.png',
        isClass: "btn--large btn--blue",
        data_link: "https://www.022022.net/service/sp/sc11040?vos=pocket_check4",
        pressHandler: this.evtToLinkBrowser.bind(this)
      })
    );

    const elBlockBtnJobSearch = this.createComponent("div", "text-center result-button mb-15","", {});
    elBlockBtnJobSearch.appendChild(
      this.ComponentButton({ 
        text: "お仕事検索はこちら",
        icon: this.baseUrl + '/assets/images/icon_search.png',
        isClass: "btn--large btn--blue1",
        data_link: link_job,
        pressHandler: this.evtToLinkBrowser.bind(this)
      })
    );

    const elBlockBtnLoginMyPage = this.createComponent("div", "text-center result-button mb-15","", {});
    elBlockBtnLoginMyPage.appendChild(this.ComponentButton({
      text: "マイページにログイン",
      icon: this.baseUrl + '/assets/images/icon_lock.png',
      isClass: "btn--large btn--pink",
      data_link: "https://mypage.022022.net/user/sp/sa09020?vos=pocket_check2",
      pressHandler: this.evtToLinkBrowser.bind(this)
    }),
    );

    switch((userType ||'').toUpperCase()) { 
      case "STAFF": 
        elBlockBottom.prepend(elBlockBtnJobSearch, elBlockBtnLoginMyPage);
        break;
      case "GUEST":
        elBlockBottom.prepend(elBlockBtnLoginService, elBlockBtnJobSearch);
        break;
    };
    elBlockBottom.prepend(elLabel);

    return elBlockBottom;
  };

  resultPage.prototype.LayoutGroupButton = function() { 
    const elLabel = this.createComponent("div", "content-label fs-14 mb-0 light", "＼もう一度診断したい方はこちら！！／", {})
    const elGroupButton = this.createComponent("div", "result-content", "", {});

    const elBlockBackStartDiagnose = this.createComponent("div", "text-center result-button mt-20px", "" , {});
    const elBlockBackHome = this.createComponent("div", "text-center result-button mt-20px", "" , {});


    


    elBlockBackStartDiagnose.appendChild(this.ComponentButton({
      text: "もう一度診断する", 
      isClass: "btn--large btn--primary", 
      pressHandler: this.evtBackStartPage.bind(this)
    }));

    elBlockBackHome.appendChild(this.ComponentButton({
      text: "ホームへ戻る",
      isClass:"btn--large text-black",
      pressHandler: this.evtBackHomePage.bind(this)
    }));

    elGroupButton.appendChild(elLabel);
    elGroupButton.appendChild(elBlockBackStartDiagnose);
    elGroupButton.appendChild(elBlockBackHome);
    //elGroupButton.prepend(elLabel, elPreviousResults, elBlockBackStartDiagnose, elBlockBackHome);
    return elGroupButton;
  }


  resultPage.prototype.ComponentButton = function({ text = '', isClass = '', data_link = '', icon= '', pressHandler }) {
    const elButton = this.createComponent("button", `btn ${isClass}`, '', { data_link: data_link });
    const elInnerButton = this.createComponent("div", "inner-btn", "", {});

    if(icon !== '') {
      const elIcon  = this.createComponent('img', '', '', {
        src: icon,
        alt: "Image",
        width: 17,
        style: "margin-right: 5px"
      });

      elInnerButton.appendChild(elIcon);
    }

    if (text !== '') { 
      const elText = this.createComponent("span","" , text, {});
      elInnerButton.appendChild(elText);
    }

    elButton.appendChild(elInnerButton);
    elButton.addEventListener("click", pressHandler);

    return elButton;
  };

  resultPage.prototype.evtBackStartPage = function () {
    this.postMessage('backPage', { "value":"start_diagnose" })
  }

  resultPage.prototype.evtReviousResult = function () {
    this.postMessage('backPage', { "value":"prev_result" })
  }

  resultPage.prototype.evtBackPage = function () {
    console.log('ok tess')
    this.postMessage('backPage', { "value":"back_page" })
  }


  resultPage.prototype.evtBackHomePage = function () {
    this.postMessage('backPage', { "value": "home" })
  }

  resultPage.prototype.evtNextResult = function (id) {
    this.postMessage('toResult', { "value": id })
  }

  resultPage.prototype.evtBackCounsutingPage = function() {
    this.postMessage('backPage', { "value": "booking_counsuting" })
  }

  resultPage.prototype.evtToMaterials = function (e) {
    this.postMessage('toDetails', { "id": e.target.getAttribute("doc_id") })
  }

  resultPage.prototype.evtToLinkBrowser = function (e) {
    this.postMessage('toLinkBrowser', { "value": e.target.getAttribute("data_link") })
  }

  resultPage.prototype.postMessage = function(fncName, msg){
		msg = JSON.stringify(msg);
		
		if( 'webkit' in window ){
			window.webkit.messageHandlers[fncName].postMessage(msg);
		}else if('android' in window ) {
			(window.android || window.Android)[fncName](msg);
		}
	}

  resultPage.prototype.evtResetResult = function () {
    this.response = null;
    this.data = null;
    document.body.innerHTML = "";
    this.postMessage('resetDataFininshed', { "success": true })
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

  window.resetData = function() {
    result.evtResetResult()
  }
})();
isResult({
  "type": "Android",
  "version": 34,
  "device_name": "Pixel 5a",
  "first_result": false,
  "data": {
    "type": "DI_TYPE",
    "user_type": "STAFF",
    "title": "di2",
    "label": "di1",
    "code": "xb2HuSQsZKb5hmTOjyo",
    "id": "28",
    "img": "https://test.learningpocket.com/uploads/diagnostic/result_images/Nf83T1CjwoYkx1Em.jpg",
    "detail_top": [
        {
            "id": "1233",
            "title": "di3",
            "img": "",
            "detail": "di4",
            "position": "TOP",
            "next_result": null
        }
    ],
    "detail_bot": [
        {
            "id": "1232",
            "title": "di5",
            "img": "https://test.learningpocket.com/uploads/diagnostic/result_images/RfQ3l1JjHo7kd1Ik.jpg",
            "detail": "di6",
            "position": "BOT",
            "next_result": "25"
        }
    ],
    "doc_rc": {
        "doc_id": "914",
        "doc_code": "03opivV0uo8kf1t5GAy",
        "doc_title": "Material 0202",
        "doc_type": "YOUTUBE",
        "doc_thumb": "https://test.learningpocket.com/uploads/teacher/r9DlHvQhilup31Pd9/M9XkUc9n1m31/mt_1769189015_v1_XkHp1ko0v.jpg%22",
        "memo": "di7"
    },
    "customer_comment": [
        {
            "text": "現状をお話ししたところ優しく受け止めていただき、これから目指す方向や自分に必要なことを的確に示してもらえました。（30代/女性）",
            "img": "https://d2p333gdzaltfu.cloudfront.net/diagnostic/ctm_comment/voice_01.png"
        },
        {
            "text": "とてもフレンドリーに話してくださり、ポジティブな気持ちになれました。（60代/女性）",
            "img": "https://d2p333gdzaltfu.cloudfront.net/diagnostic/ctm_comment/voice_02.png"
        },
        {
            "text": "世の中のキャリアコンサルタントにはこちらの相談をきちんと聞かずに一方的に話すような方もいますが、スタッフサービスのコンサルタントは共感し、励まし、解決の糸口を見つけてくれました。（40代/女性）",
            "img": "https://d2p333gdzaltfu.cloudfront.net/diagnostic/ctm_comment/voice_03.png"
        }
    ],
    "html": "https://www.test.learningpocket.com/diagnostic_new/result.html"
  }
  // "data": {
  //   "type": "P16_TYPES",
  //   "user_type": "STAFF",
  //   "title": "tính cách hướng nội",
  //   "code": "pbg66HZmeL1AJ78Y0Q5",
  //   "id": "4",
  //   "img": "https://test-lac.learningpocket.com/uploads/diagnostic/result_images/roBbYkjjFrxii1P9.png",
  //   "detail_top": [
  //     {
  //       "id": "324",
  //       "title": "Dolor minim omnis la",
  //       "img": "",
  //       "detail": "Ad labore facere sequi recusandae Mollitia et ex exercitation enim explicabo",
  //       "position": "TOP",
  //       "next_result": null
  //     },
  //     {
  //       "id": "323",
  //       "title": "Quibusdam vero labor",
  //       "img": "",
  //       "detail": "Id amet quo nihil laboriosam nulla ut dolor",
  //       "position": "TOP",
  //       "next_result": null
  //     }
  //   ],
  //   "detail_bot": [
  //     {
  //       "id": "322",
  //       "title": "Iste est et rerum po",
  //       "img": "https://test-lac.learningpocket.com/uploads/diagnostic/result_images/4rqtf2e42raiQ1Uv.jpg",
  //       "detail": "Nihil rerum exercitationem fugiat qui nihil a non culpa ducimus debitis quisquam quia aut iste proident",
  //       "position": "BOT",
  //       "next_result": "3"
  //     },
  //     {
  //       "id": "321",
  //       "title": "Sint exercitation be",
  //       "img": "https://test-lac.learningpocket.com/uploads/diagnostic/result_images/toCbdkPjorBim1Hx.png",
  //       "detail": "Voluptas animi dolore voluptatibus qui",
  //       "position": "BOT",
  //       "next_result": "2"
  //     }
  //   ],
  //   "doc_rc": {
  //     "doc_id": "262",
  //     "doc_code": "Vubbc3lnBh1in18ILa2",
  //     "doc_title": "material_youtube_10",
  //     "doc_type": "YOUTUBE",
  //     "doc_thumb": "https://test-lac.learningpocket.com/uploads/teacher/79wkFcdn8mN1P3tEWf6/O9Pk2cAngm71l3ba/mt_3896766131_v1_Vfjc1ihn3.jpg",
  //     "memo": "Commodo laborum Et deserunt aliqua Ea ipsum corporis sed qui distinctio Praesentium eu ut nisi qui aute"
  //   },
  //   "customer_comment": [
  //     {
  //       "text": "現状をお話ししたところ優しく受け止めていただき、これから目指す方向や自分に必要なことを的確に示してもらえました。（30代/女性）",
  //       "img": "https://d2p333gdzaltfu.cloudfront.net/diagnostic/ctm_comment/voice_01.png"
  //     },
  //     {
  //       "text": "とてもフレンドリーに話してくださり、ポジティブな気持ちになれました。（60代/女性）",
  //       "img": "https://d2p333gdzaltfu.cloudfront.net/diagnostic/ctm_comment/voice_02.png"
  //     },
  //     {
  //       "text": "世の中のキャリアコンサルタントにはこちらの相談をきちんと聞かずに一方的に話すような方もいますが、スタッフサービスのコンサルタントは共感し、励まし、解決の糸口を見つけてくれました。（40代/女性）",
  //       "img": "https://d2p333gdzaltfu.cloudfront.net/diagnostic/ctm_comment/voice_03.png"
  //     }
  //   ],
  //   "html": "https://www.test-lac.learningpocket.com/diagnostic_new/result.html"
  // }
}) 