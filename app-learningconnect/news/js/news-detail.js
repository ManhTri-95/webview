(function () {
  class NewsDetail {
    constructor() {
      this.appData = {};
      this.data = {};

      const search = (window.location.search || '').toLowerCase();
      this.isAppCall = search.indexOf('is_mobile=1') > 0;
      this.isGuest = search.indexOf('is_guest=1') > 0;

      this.paramsDOMLoaded = {success: true};

      this.isWebviewBrowser = this.isCalledByWebview();
    }

    isCalledByWebview () {
      if ( window.location.search.indexOf('debug=1') > 0 ) return true;
      const rules = [
        'okhttp/',
        // if it says it's a webview, let's go with that
        'WebView',
        // iOS webview will be the same as safari but missing "Safari"
        '(iPhone|iPod|iPad)(?!.*Safari)',
        // Android Lollipop and Above: webview will be the same as native but it will contain "wv"
        // Android KitKat to Lollipop webview will put Version/X.X Chrome/{version}.0.0.0
        'Android.*(;\\s+wv|Version/\\d.\\d\\s+Chrome/\\d+(\\.0){3})',
        // old chrome android webview agent
        'Linux; U; Android'
      ];

      return !!(navigator.userAgent || '').match(
          new RegExp('(' + rules.join('|') + ')', 'ig')
      );
    }
    setDataNews (data) {
      this.isWebviewBrowser = data.isWebviewBrowser || this.isWebviewBrowser;
      if ( !data.allow_guest && this.isGuest || !this.isWebviewBrowser ){

        this.paramsDOMLoaded = {success: false, error: 'Not allow guest'};
        window.document.body.innerHTML = '';
        return ;
      }
      console.log(data);
      this.data = data;

      const loadingImg = ' data-lazy-web-view-$1';
      const patternImg = new RegExp('\\s(src\="|\')', 'g');
      this.data.content = (document.getElementById('news-content').innerHTML || '')
          .replace(patternImg, loadingImg);

      let tocContents = document.querySelectorAll('.news-toc-content');

      if ( tocContents.length > 0 ){
        tocContents.forEach( (text, idx) => {
          this.data.tocs[idx].content = (text.innerText||'')
              .replace(patternImg, loadingImg);

          const childs = document.querySelectorAll(
              '.news-toc-content-child[data-p-id="'+this.data.tocs[idx].id+'"]'
          );

          if (childs.length){
            childs.forEach( (child) => {
              let level = child.getAttribute('data-p-idx') || '';
              if (this.data.tocs[idx].childs[level] || false)
                this.data.tocs[idx].childs[level].content = (child.innerText||'')
                    .replace(patternImg, loadingImg);
            });
          }
        });
      }

      tocContents = null;

      this.isAppCall = this.isAppCall || data.isAppCall;

      newsDetail.render();
    }

    createToc() {
      return this.data.tocs.map(item => {
        const childrenHtml = item.childs ? Object.values(item.childs).map(child => `
            <li>
              <a href="javascript:void(0)" class="btn-arrow">
                <i class="ph-bold ph-caret-down"></i>
              </a>
              <a href="#heading-${child.id}" class="toc-link" data-id="${child.id}">
                  ${child.title}
              </a>
            </li>
          `).join('') : '';
        return `
            <li class="mb-15">
              <a href="javascript:void(0)" class="btn-arrow btn-arrow--gray">
                <i class="ph-bold ph-caret-down"></i>
              </a>
              <a href="#heading-${item.id}" class="toc-link" data-id="${item.id}">${item.title}</a>
              ${childrenHtml ? `<ul class="toc-submenu open">${childrenHtml}</ul>` : ''}
            </li>
          `;
      }).join('');
    }

    removeEmptyTagsAtEnd = (html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      let total = doc.body.childNodes.length;

      while ( total > 0 ) {
        total--;
        let node = doc.body.childNodes[total];
        if ( ((node.nodeType === Node.ELEMENT_NODE &&
             node.querySelector('img, video, audio, iframe, object, embed, picture') == null) ||
             node.nodeType === Node.TEXT_NODE) &&
            (node.textContent ||'').trim() === ''
        ) {
          node.remove();
        }else break;
      }

      return doc.body.innerHTML;
    }

    createContentToc () {
      // const isContentEmpty = (html) => {
      //   // Remove all HTML tags and trim the content
      //   const tempDiv = document.createElement('div');
      //   tempDiv.innerHTML = html;

      //   // Get all text content from the temporary element
      //   const textContent = tempDiv.textContent || tempDiv.innerText || '';

      //   // Remove all whitespace and check if it's empty
      //   return textContent.trim() === '';
      // };

        
      const isContentEmpty = (html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const hasVisibleContent = doc.body.textContent.trim() !== '' || doc.body.querySelector('img, video, audio, iframe, object, embed, picture') !== null;
        
        return !hasVisibleContent;
      };
      return this.data.tocs.map(content => {
        const childrenContent = content.childs ? Object.values(content.childs).map(child => `
              <div class="title-doc title-doc--h3" id="heading-${child.id}">
                ${child.title}
              </div>
              ${isContentEmpty(child.content) ? '' : `<div class="content">${this.removeEmptyTagsAtEnd(child.content)}</div>`}
            `).join('') : '';
        return `
            ${ content.title
            ?  `<div class="parent-content">
                <div class="title-doc title-doc--main" id="heading-${content.id}">${content.title}</div>
                  ${isContentEmpty(content.content)
                ? ''
                : `<div class="content px-15px">${this.removeEmptyTagsAtEnd(content.content)}</div>` }
                  ${childrenContent
                ? `<div class="child-content px-15px">${childrenContent}</div>`
                : ''}
              </div>`
            : ''
        }
          `;
      }).join('');

      
    }

    async render() {
      try {

        let { scate, date, title, image, content, tocs} = this.data;

        document.body.innerHTML = '';

        let container = document.createElement("div");
        container.className = "page-content";
        container.id = 'top-page-content';
        
        // let isShowTableOfContent = toc && toc.length >= 1 && toc.map(p => {
        //   return p.childs && Object.values(p.childs).length > 0
        // });
        let isShowTableOfContent = tocs && (tocs.length > 1 ||
            tocs.some(function(p) {
              return p.childs && Object.values(p.childs).length > 0;
            }));

        container.innerHTML = `
            <div class="header-container">
                <a href="javascript:void(0)" class="btn-top" id="btn-top"></a>
            </div>
            <section class="content-inner">
              <div class="fs-lg my-3 title-post px-15px">${title}</div>
              <div class="text-center content-img px-15px">
                <img data-lazy-web-view-src="${image}" src="data:image/gif;base64,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" alt="" />
              </div>
              <div class="category-container mb-15">
                <div class="category-title">
                  <span class="fs-md">カテゴリ</span>
                </div>
                <ul class="unstyled m-0">
                  <li>
                    <span class="badge badge-style" id="btn-cate" data-id="${scate.id}" data-title="${scate.title}" style="--badge-background: ${scate.bg_color || 'pink'}; --badge-color:${scate.txt_color || '#000'}">${scate.title || ''}</span>
                  </li>
                </ul>
              </div>

              <div class="content-text mb-15 px-15px">${this.removeEmptyTagsAtEnd(content)}</div>
    
              <div class="toc_container ${isShowTableOfContent ? '' : 'd-none' }">
                <div class="toc-title">
                  <span class="fs-md">目次</span>
                </div>
                <ul class="toc_list px-15px">${isShowTableOfContent ? this.createToc() : ''}</ul>
              </div>
              <div class="toc-content">${this.createContentToc()}</div>
            </section>
          `;

        const btnBackToTop = document.createElement("a");
        btnBackToTop.setAttribute("href", "#top-page-content");
        btnBackToTop.className = "btn-back-top";
        btnBackToTop.id = "scrollToTopBtn";
        btnBackToTop.innerHTML = "<i class='ph-bold ph-caret-double-up'></i>";

        if (!this.isAppCall) {
          let UIFakeMobile = document.createElement("div");
          UIFakeMobile.className = "faker-phone";

          let pageLoader = document.createElement("div");
          pageLoader.className = "page-loader";

          UIFakeMobile.innerHTML = `
              <a href="javascript:void(0)" class="btn-back-top-custom" id="scrollToTopBtn">
                <i class="ph-bold ph-caret-double-up"></i>
              </a>
              <div class="faker-phone--screen">
                ${container.outerHTML}
              </div>`;

          document.body.className= 'd-flex justify-content-center align-items-center';
          document.body.prepend(UIFakeMobile);
          document.body.prepend(pageLoader);

        } else {
          document.body.prepend(container);

          // Remove all elements with the class 'btn-back-top'
          document.querySelectorAll('.btn-back-top').forEach(element => element.remove());

          // Remove the element with the ID 'scrollToTopBtn' if it exists
          const scrollToTopBtn = document.getElementById('scrollToTopBtn');
          if (scrollToTopBtn) {
            scrollToTopBtn.remove();
          }

          document.body.append(btnBackToTop);

        }

        const DOMAIN_DEFAULT = {'www.staffservice.co.jp': true};

        //Block default behavior of all tags a
        document.querySelectorAll('.content-inner a[href]').forEach(anchor => {

          let dataLink = anchor.getAttribute('href') || '';
          if ( dataLink &&
              dataLink.indexOf('#') !== 0 &&
              dataLink.toLowerCase() !== 'javascript:void(0)'
          ) {

            let fixedLink = this.fixMalformedUrl(dataLink);
            if (fixedLink !== dataLink) {
              anchor.setAttribute('href', fixedLink);
              dataLink = fixedLink;
            }

            let url = false;
            try{
              url = new URL( dataLink );
            }catch(e){ url= false; }

            if ( url && url.host ) {
              let isInnerURL = false;
              // If the URL matches the default domain and has a hash, update the href to only the hash
              if ( DOMAIN_DEFAULT.hasOwnProperty(url.host) &&
                  1 < (url.hash || '').length
              ) {
                try {
                  if (document.querySelector(url.hash)) {
                    anchor.setAttribute('href', url.hash);
                    isInnerURL = true;
                  }
                } catch (e) {}
              }

              // Add event listener for valid URLs
              isInnerURL || anchor.addEventListener('click', (e) => {
                let target = e.target;
                if( e.target.nodeName != 'A' ) target = target.closest('a');

                // Validate the URL again before calling postMessage
                //if (this.validURL(href)) {
                e.preventDefault();

                this.postMessage('toLinkBrowser', {
                  value: target.getAttribute('href')
                });
                //}
              });
            }
          }
        });

        let iframePlayers = {'www.youtube.com': true};

        if( this.isAppCall ) document.querySelectorAll('iframe')
            .forEach(iframe => {
              let src = this.fixMalformedUrl(
                  iframe.getAttribute('data-lazy-web-view-src') || iframe.getAttribute('src')
              );
              if( src.indexOf('http') === 0 ){
                let url = new URL( src );

                if( iframePlayers.hasOwnProperty(url.hostname) ){
                  let wrapDiv = document.createElement('div');
                  wrapDiv.className = 'web-view-iframe-player';

                  if ( iframe.getAttribute('height') )
                    wrapDiv.style.height = iframe.getAttribute('height') + 'px';

                  iframe.after(wrapDiv);
                  wrapDiv.append(iframe);

                  let tagA = document.createElement('a');
                  tagA.setAttribute('style', 'width:100%;height:100%;position:absolute;top:0;bottom:0;left:0;right:0;z-index:100');
                  tagA.setAttribute('href', 'javascript:void(0);');

                  iframe.style.zIndex = '0';
                  iframe.style.position = 'relative';

                  tagA.addEventListener('click', (e) => {

                    e.preventDefault();  e.stopPropagation();

                    this.postMessage('toLinkBrowser', { "value": src });

                    return false;
                  });

                  wrapDiv.append(tagA);
                }
              }
            });

        // Add event listeners after the DOM is added to the body
        this.addHandleEvent();

        const lazyItems = document.querySelectorAll('[data-lazy-web-view-src]'),
            totalLazy = lazyItems.length;
        if ( totalLazy ){
          let timeout = 0;
          lazyItems.forEach((item) => {
            setTimeout(() => {
              item.setAttribute('src', item.getAttribute('data-lazy-web-view-src'));
            }, timeout || 50);
            timeout += 100;
          });

          setTimeout(() => {
            //this.postMessage('loadFinished', {success: true});

            const tables = document.querySelectorAll('table');
            if (tables.length){
              tables.forEach((table) => {
                if( table.clientWidth > window.screen.width ){
                  table.style.width = '99vw';
                }
              });
            }
          }, Math.min(1200, totalLazy * 200) );
        }

        this.logMsg('loadFinished');
      } catch (error) {
        const msg = error.message;

        this.postMessage('loadFinished', { success: false, error:  msg });

        this.logMsg('loadFail: ' + msg);
      }
    }
    fixMalformedUrl (url) {
      url = url.trim();

      if (url.startsWith('http://https//')) {
        url = url.replace('http://https//', 'https://');
      } else if (url.startsWith('https//')) {
        url = url.replace('https//', 'https://');
      } else if (url.startsWith('http//')) {
        url = url.replace('http//', 'http://');
      }

      try {
        let fixedUrl = new URL(url);
        return fixedUrl.href;
      } catch (e) {
        this.logMsg('Error: ' + e.message);
        return url;
      }
    }

    addHandleEvent() {
      /**
       * Event click send id cate
       */
      const btnCate = document.getElementById("btn-cate");
      if (btnCate) {
        btnCate.addEventListener('click', (e) => {
          e.preventDefault();
          const cateId = e.target.getAttribute("data-id");
          const cateTitle = e.target.getAttribute("data-title");

          this.postMessage('searchCate', { id: cateId, title: cateTitle });
        });
      } else {
        console.error('btn-cate element not found');
      }
      /**
       * Event click scroll to ....
       */
      const tocLinks = document.querySelectorAll('.toc-link');
      if (tocLinks.length > 0) {
        tocLinks.forEach(tocLink => {
          tocLink.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = e.target.getAttribute('href').substring(1);  // Get the target id
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
              const scrollOptions = {
                top: targetElement.offsetTop - 20, // Adjust scroll position
                behavior: 'smooth' // Smooth scroll
              };

              if(!this.isAppCall) {
                const container = document.querySelector('.faker-phone--screen');
                container.scrollTo(scrollOptions);
              } else {
                // Scroll to the target element
                window.scrollTo(scrollOptions)
              }
            } else {
              console.error(`Element with ID ${targetId} not found`);
            }
          });
        });
      } else {
        console.error('No .toc-link elements found');
      }

      /**
       * Event click collapse table of content
       */
      const btnArrows = document.querySelectorAll('.btn-arrow');
      if (btnArrows.length > 0) {
        // Add click event listener to each btn-arrow
        btnArrows.forEach(btnArrow => {
          btnArrow.addEventListener('click', function() {
            const submenu = this.parentElement.querySelector('.toc-submenu');

            // Check if submenu exists
            if (!submenu) return;
            submenu.classList.toggle('open');
            this.classList.toggle('open');

            if (submenu.classList.contains('open')) {
              // Calculate the height of the submenu
              submenu.style.display = 'block';
              const height = submenu.scrollHeight + 'px';
              submenu.style.height = '0';

              setTimeout(() => {
                submenu.style.height = height;
              }, 10);

            } else {
              // Close the submenu
              submenu.style.height = submenu.scrollHeight + 'px';

              // Set timeout to delay height change for transition
              setTimeout(() => {
                submenu.style.height = '0';
                // Hide submenu after transition ends
                setTimeout(() => {
                  submenu.style.display = 'none';
                }, 350);
              }, 10);
            }
          });
        });
      } else {
        console.error('No .btn-arrow elements found');
      }

      const scrollToTopBtn = document.getElementById('scrollToTopBtn');

      if (scrollToTopBtn) {
        const handleScrollTop = (scrollContainer) => {
          if(!scrollContainer) {
            return
          }
          scrollContainer.scrollTo({
            top: 0,
            behavior: 'smooth' // Smooth scroll
          });
        };

        if(!this.isAppCall) {
          const container = document.querySelector('.faker-phone--screen');
          scrollToTopBtn.addEventListener('click', () => handleScrollTop(container));
        } else {
          scrollToTopBtn.addEventListener('click', () => handleScrollTop(document.querySelector('body')));
        }
      }
    }

    validURL(str){
      var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
          '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
          '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
          '(\\:\\d+)?' + // port
          '(\\/[-a-z\\d%_.~+]*)*' + // path
          '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
          '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
      return !!pattern.test(str);
    }

    // postMessage(fncName, msg) {
    //   msg = JSON.stringify(msg);
    //
    //   if ('webkit' in window) {
    //     window.webkit.messageHandlers[fncName].postMessage(msg);
    //   } else if ('android' in window) {
    //     (window.android || window.Android)[fncName](msg);
    //   }
    //
    //   this.logMsg(JSON.stringify(arguments || {}));
    // }

    postMessage (fncName, msg) {
      try {
        if (window[fncName]?.postMessage) {
          window[fncName].postMessage(JSON.stringify(msg));
        }
      } catch (error) {
        console.error('An error occurred while calling the postMessage function:', error);
      }
    }
    logMsg () {
      if (window.debug ||
          window.location.search.indexOf('debug=1') > 0) {
        console.log(performance.now(), arguments[0] || '');
      }
    }
  }

  let newsDetail = new NewsDetail();

  window.setDataNews = function(data, isDebug) {
    // mobile device
    if (newsDetail.isWebviewBrowser){
      window.setDataApp = function(data) {
        newsDetail.appData = data;
      };

      window.postDOMContentLoaded = function( ) {
        window.postLoadFinished = function( data) {
          newsDetail.postMessage(
              'loadFinished', {success: true}
          );

          delete window.initNews;
          delete window.setDataNews;
          delete window.setDataApp;
          delete window.postLoadFinished;
        };

        setTimeout(function() {
          newsDetail.postMessage(
              'javascriptLoaded', newsDetail.paramsDOMLoaded
          );
        }, 100);

        delete window.postDOMContentLoaded;
      };
    }

    if( isDebug === true ) {
      newsDetail.isWebviewBrowser = isDebug;
    }

    newsDetail.setDataNews(data);
  };
})();