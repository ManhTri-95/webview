(function () {
  class ManualDetail {
    constructor() {
      this.appData = {};
      this.data = {};
      this.faqData = [];

      const search = (window.location.search || '').toLowerCase();
      this.isAppCall = search.indexOf('is_mobile=1') > 0;
      this.isGuest = search.indexOf('is_guest=1') > 0;

      this.paramsDOMLoaded = {success: true};

      this.isWebviewBrowser = this.isCalledByWebview();

      // Initialize SearchManager
      this.searchManager = new SearchManager({
        postMessage: this.postMessage.bind(this),
        renderCallback: this.renderSearchResults.bind(this),
        itemsPerPage: 10
      });
    }

    isCalledByWebview() {
      // Check if running in debug mode
      if (window.location.search.indexOf('debug=1') > 0) return true;

      // Check for WKWebView on iOS
      if (window.webkit && window.webkit.messageHandlers) {
        return true;
      }

      // Check for UIWebView on iOS (older versions)
      if (window.navigator.userAgent.match(/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i)) {
        return true;
      }

      const rules = [
        'okhttp/',
        'WebView',
        // Updated iOS WebView detection
        '(iPhone|iPod|iPad)(?!.*Safari)',
        'Android.*(;\\s+wv|Version/\\d.\\d\\s+Chrome/\\d+(\\.0){3})',
        'Linux; U; Android'
      ];

      return !!(navigator.userAgent || '').match(
          new RegExp('(' + rules.join('|') + ')', 'ig')
      );
    }
    setDataManual (data) {
      console.log('Received data for manual detail:', data);
      this.isWebviewBrowser = data.isWebviewBrowser || this.isWebviewBrowser;
      if ( this.isGuest || !this.isWebviewBrowser ){

        this.paramsDOMLoaded = {success: false, error: 'Not allow guest'};
        window.document.body.innerHTML = '';
        return ;
      }

      
      this.data = data;
      
      // Extract FAQ data if provided
      if (data.dataFaq && Array.isArray(data.dataFaq)) {
        this.faqData = data.dataFaq;
        console.log('FAQ data extracted from setDataManual:', this.faqData);
      }
      
      console.log('Initial manual data:', this.data);

      const loadingImg = ' data-lazy-web-view-$1';
      const patternImg = new RegExp('\\s(src\="|\')', 'g');
      
      // Check if manual-content element exists in DOM
      const manualContentElement = document.getElementById('manual-content');
      this.data.content = manualContentElement 
        ? (manualContentElement.innerHTML || '').replace(patternImg, loadingImg)
        : (data.content || '').replace(patternImg, loadingImg);

      let tocContents = document.querySelectorAll('.manual-toc-content');

      if ( tocContents.length > 0 ){
        tocContents.forEach( (text, idx) => {
          this.data.tocs[idx].content = (text.innerText||'')
              .replace(patternImg, loadingImg);

          const childs = document.querySelectorAll(
              '.manual-toc-content-child[data-p-id="'+this.data.tocs[idx].id+'"]'
          );

          if (childs.length){
            childs.forEach( (child) => {
              let level = child.getAttribute('data-p-idx') || '';
              if (this.data.tocs[idx].childs && this.data.tocs[idx].childs[level])
                this.data.tocs[idx].childs[level].content = (child.innerText||'')
                    .replace(patternImg, loadingImg);
            });
          }
        });
      } else {
        // If DOM elements don't exist, use data directly from input
        if (this.data.tocs && Array.isArray(this.data.tocs)) {
          this.data.tocs.forEach((toc, idx) => {
            if (!toc.content) {
              toc.content = '';
            }
            if (!toc.childs) {
              toc.childs = {};
            }
          });
        }
      }

      tocContents = null;

      this.isAppCall = this.isAppCall || data.isAppCall;

      manualDetail.render();
    }

    createToc() {
      if (!this.data.tocs || !Array.isArray(this.data.tocs)) {
        return '';
      }
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

    /**
     * Updates app padding-bottom based on section-footer height
     * @private
     */
    updateSectionFooterPadding() {
      // Use requestAnimationFrame to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        const app = document.getElementById("app");
        const sectionFooter = document.querySelector(".section-footer");
        
        if (!app || !sectionFooter) return;
        
        // Get the height of section-footer
        const footerHeight = sectionFooter.offsetHeight;
        
        // Set padding-bottom of app to match footer height
        app.style.paddingBottom = `${footerHeight}px`;
        
        console.log('Footer height:', footerHeight, 'px');
      });

      console.log('vvvv')
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
      if (!this.data.tocs || !Array.isArray(this.data.tocs)) {
        return '';
      }
      
      const isContentEmpty = (html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const hasVisibleContent = doc.body.textContent.trim() !== '' || doc.body.querySelector('img, video, audio, iframe, object, embed, picture') !== null;
        
        return !hasVisibleContent;
      };
      return this.data.tocs.map(content => {
        const childrenContent = content.childs ? Object.values(content.childs).map(child => `
              <div class="section-title section-title-h3" style="border-bottom: 0; padding: 10px 16px 0px;" id="heading-${child.id}">
                ${child.title}
              </div>
              ${isContentEmpty(child.content) ? '' : `<div class="section-container" style="padding: 15px;">${this.removeEmptyTagsAtEnd(child.content)}</div>`}
            `).join('') : '';
        return `
            ${ content.title
            ?  `<div class="parent-content">
                <div class="section-title" style="font-size: 18px;" id="heading-${content.id}">${content.title}</div>
                  ${isContentEmpty(content.content)
                ? ''
                : `<div class="section-container" style="padding: 15px;">${this.removeEmptyTagsAtEnd(content.content)}</div>` }
                  ${childrenContent
                ? `<div class="child-content" style="background: #fff;">${childrenContent}</div>`
                : ''}
              </div>`
            : ''
        }
          `;
      }).join('');
    }

    renderFaqItems() {
      if (!this.faqData || !Array.isArray(this.faqData) || this.faqData.length === 0) {
        return '<div style="text-align: center; color: #999; padding: 20px;">FAQデータがありません</div>';
      }

      return this.faqData.map(item => `
        <div class="faq-item" data-id="${item.id}" data-type="faq">
          <div>${item.question || ''}</div>
        </div>
      `).join('');
    }

    async render() {
      try {

        let { scate, date, title, image, content, tocs} = this.data;

        // Provide default values for missing properties
        scate = scate || { id: '', title: '', bg_color: 'pink', txt_color: '#000' };
        image = image || 'data:image/gif;base64,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';
        content = content || '';
        tocs = tocs || [];

        document.body.innerHTML = '';

        let container = document.createElement("div");
        container.className = "page-content";
        container.id = 'top-page-content';
        
        // Show TOC if there's at least 1 item AND either:
        // - More than 1 item, OR
        // - At least 1 item has childs (sub-items)
        console.log('TOCs:', tocs.length);
        let isShowTableOfContent = tocs && (tocs.length >= 1 &&
            (tocs.length >= 1 || tocs.some(function(p) {
              return p.childs && Object.values(p.childs).length > 0;
            })));

        container.innerHTML = `
          <div id="app">
            <div class="search-wrapper">
              <div class="search-wrapper__input">
                <label for="searchInput" class="search-icon">
                  <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" class="DocSearch-Search-Icon"><path d="M14.386 14.386l4.0877 4.0877-4.0877-4.0877c-2.9418 2.9419-7.7115 2.9419-10.6533 0-2.9419-2.9418-2.9419-7.7115 0-10.6533 2.9418-2.9419 7.7115-2.9419 10.6533 0 2.9419 2.9418 2.9419 7.7115 0 10.6533z" stroke="currentColor" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                </label>
                <input 
                  type="search"
                  class="search-input"
                  placeholder="知りたい内容についてご記入ください"
                  id="searchInput"
                />
              </div>
            </div>
            <div style="height: 73px;"></div>
            <div id="searchResults" class="search-results"></div>
            <section class="content-inner" style="padding: 0;">
              <div class="toc_container ${isShowTableOfContent ? '' : 'd-none' }" style="margin: 0px;">
                <div class="section-title">
                  <span class="fs-md">目次</span>
                </div>
                <ul class="toc_list px-15px" style="padding-top: 15px; padding-bottom: 15px; background-color: #fff;">${isShowTableOfContent ? this.createToc() : ''}</ul>
              </div>
              <div class="toc-content">${this.createContentToc()}</div>
            </section>

            <div class="section section-faq">
              <div class="section-title">よくある質問</div>
              <div class="section-container" id="faq-container">
                ${this.renderFaqItems()}
              </div>
            </div>

            <div class="section section-footer">
              <div class="section-title">解決しない場合</div>
              <div class="section-container">
                <div class="contact-text">
                  解決しない場合はこちらからお問い合わせください。
                </div>
                <div class="view-all redirect-page" data-page="inquiry_send">[お問い合わせする]</div>
              </div>
            </div>
          `;

        const btnBackToTop = document.createElement("a");
        btnBackToTop.setAttribute("href", "#top-page-content");
        btnBackToTop.className = "btn-back-top";
        btnBackToTop.id = "scrollToTopBtn";
        btnBackToTop.innerHTML = "<i class='ph-bold ph-caret-double-up'></i>";


        document.body.prepend(container);

        // Remove all elements with the class 'btn-back-top'
        document.querySelectorAll('.btn-back-top').forEach(element => element.remove());

        // Remove the element with the ID 'scrollToTopBtn' if it exists
        const scrollToTopBtn = document.getElementById('scrollToTopBtn');
        if (scrollToTopBtn) {
          scrollToTopBtn.remove();
        }

        document.body.append(btnBackToTop);


        const DOMAIN_DEFAULT = {'engibase.com': true, 'www.engibase.com': true};

        //Block default behavior of all tags a
        document.querySelectorAll('.content-inner a[href]:not(.download-confirm)').forEach(anchor => {

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

        // Setup search results listener (only once)
        this.setupSearchResultsListener();

        // Setup search input events using SearchManager
        this.searchManager.setupSearchInputEvents({
          searchType: 'manual',
          onSearch: (params) => {
            if (params.query && params.query.length > 0) {
              // Hide content sections, show search results
              document.querySelectorAll('.toc_container, .toc-content').forEach(section => {
                section.style.display = 'none';
              });

              // Request search from native side
              this.postMessage('search', {
                query: params.query,
                page: params.page || 1,
                limit: params.limit,
                type: 'manual'
              });
            } else {
              // Show content sections, hide search results
              document.querySelectorAll('.toc_container, .toc-content').forEach(section => {
                section.style.display = '';
              });
              document.getElementById('searchResults').innerHTML = '';
              this.searchManager.reset();
              // console.log('Search query is empty, reset search results and show content');
              this.postMessage('search', {
                query: '',
              });
            }
          },
          onSearchStart: () => {
            // Clear previous results
            document.getElementById('searchResults').innerHTML = '';
          },
          onFooterPositionChange: (position) => {
            // Handle footer position changes if needed
            console.log('Footer position changed to:', position);
          },
          updateSectionFooterPadding: () => this.updateSectionFooterPadding()
        });

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
        
        // Update FAQ container after render if FAQ data is available
        if (this.faqData && this.faqData.length > 0) {
          console.log('Updating FAQ container after render with', this.faqData.length, 'items');
          setTimeout(() => {
            this.updateFaqContainer();
          }, 100);
        }

        const sectionFooter = document.querySelector('.section-footer');
        if (sectionFooter) {
          const resizeObserver = new ResizeObserver(() => {
            this.updateSectionFooterPadding();
          });
          resizeObserver.observe(sectionFooter);
        }
      } catch (error) {
        const msg = error.message;

        this.postMessage('loadFinished', { success: false, error:  msg });

        this.logMsg('loadFail: ' + msg);
      }
    }

    renderSearchResults() {
      const searchResultsDiv = document.getElementById('searchResults');
      if (!searchResultsDiv) return;

      const state = this.searchManager.getState();
      
      if (state.items.length === 0 && !state.isFallback) {
        searchResultsDiv.innerHTML = '';
        return;
      }

      // Render search results using SearchManager's built-in renderer
      const html = this.searchManager.renderSearchResultsHTML();
      searchResultsDiv.innerHTML = html;

      // Event listeners for search results are set up only once in setupSearchResultsListener()
      // No need to recreate them on each renderSearchResults() call
    }

    setupSearchResultsListener() {
      // Set up event delegation for search results (only once)
      const searchResultsDiv = document.getElementById('searchResults');
      if (!searchResultsDiv) return;

      searchResultsDiv.addEventListener('click', (e) => {
        // Handle load-more button clicks
        const loadMoreBtn = e.target.closest('.load-more-btn[data-page="search"]');
        if (loadMoreBtn) {
          // Add loading state
          loadMoreBtn.classList.add('loading');
          
          const nextPage = this.searchManager.getCurrentSearchPage() + 1;
          
          this.postMessage('search', {
            page: nextPage,
            query: this.searchManager.getSearchQuery(),
            type: 'manual',
            limit: '10'
          });
          return;
        }

        // Handle search result items click
        const resultItem = e.target.closest('.search-result-item');
        if (resultItem) {
          const id = resultItem.getAttribute('data-id');
          const type = resultItem.getAttribute('data-type');
          
          console.log('Search result clicked:', { id, type });
          this.postMessage('selectTopic', {
            id: id,
            type: type,
          });
        }
      });
    }

    setSearchResults(results) {
      console.log('Search results received:', results);
      
      // Auto-detect: if we have existing results, this is an append operation
      const hasExistingResults = this.searchManager.getItems().length > 0;
      const page = hasExistingResults ? this.searchManager.getCurrentSearchPage() + 1 : 1;
      
      this.searchManager.setSearchResults(results, page);
      this.renderSearchResults();
      
      // Remove loading state when appending (page > 1)
      if (page > 1) {
        this.removeLoadMoreButtonLoadingState();
      }
    }

    /**
     * Removes loading state from search load-more button
     * @private
     */
    removeLoadMoreButtonLoadingState() {
      const searchResults = document.getElementById('searchResults');
      if (!searchResults) return;
      
      const loadMoreBtn = searchResults.querySelector('.load-more-btn[data-page="search"]');
      if (loadMoreBtn) {
        loadMoreBtn.classList.remove('loading');
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
       * Event click download confirm links
       */
      const downloadConfirmLinks = document.querySelectorAll('.content-inner a.download-confirm');
      if (downloadConfirmLinks.length > 0) {
        downloadConfirmLinks.forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const href = link.getAttribute('href');
            const fileName = link.getAttribute('data-name') || 'Unknown';
           
            // console.log('Download confirmed:', {
            //   fileName: fileName,
            //   href: href,
            //   url: href
            // });
            
            this.postMessage('toDownload', {
               fileName: fileName,
               url: href   
            });
          });
        });
      }

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
      }

      /**
       * Event click FAQ items
       */
      const faqItems = document.querySelectorAll('.faq-item[data-type="faq"]');
      if (faqItems.length > 0) {
        faqItems.forEach(item => {
          item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = item.getAttribute('data-id');
            const type = item.getAttribute('data-type');

            this.postMessage('selectFaq', {
              id: id,
              type: type,
            });
          });
        });
      }

      /**
       * Event click scroll to ....
       */
      const tocLinks = document.querySelectorAll('.toc-link');
      if (tocLinks.length > 0) {
        tocLinks.forEach(tocLink => {
          tocLink.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get the href from the toc-link element, not from e.target
            const href = tocLink.getAttribute('href');
            if (!href || !href.startsWith('#')) {
              return; // Skip if no valid href
            }
            
            const targetId = href.substring(1);  // Get the target id
            const targetElement = document.getElementById(targetId);
            
            console.log('TOC link clicked:', { href, targetId, found: !!targetElement });

            if (targetElement) {
              // The #app element is the scroll container (it has overflow-y: auto)
              const appContainer = document.getElementById('app');
              
              // App mode - scroll window
              const scrollPosition = targetElement.offsetTop - 73;
              appContainer.scrollTo({
                top: Math.max(0, scrollPosition),
                behavior: 'smooth'
              });
              
            } else {
              console.warn('Target element not found:', targetId);
            }
          });
        });
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
      }

      const scrollToTopBtn = document.getElementById('scrollToTopBtn');

      if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', (e) => {
          e.preventDefault();
          
          // The #app element is the scroll container
          const appContainer = document.getElementById('app');
          if (appContainer) {
            appContainer.scrollTo({
              top: 0,
              behavior: 'smooth'
            });
          }
        });
      }

      document.querySelectorAll('.redirect-page').forEach(item => {
      item.addEventListener('click', () => {
        console.log('Redirect page clicked:', item.dataset.page);
        const page = item.dataset.page;
        this.postMessage('redirectPage', {
          page
        });
      });
    });
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
      console.log('Attempting to post message:', { fncName, msg });
      try {
        if (window[fncName]?.postMessage) {
          window[fncName].postMessage(JSON.stringify(msg));
        }
      } catch (error) {
        console.error('An error occurred while calling the postMessage function:', error);
      }
    }

    updateFaqContainer() {
      const faqContainer = document.getElementById('faq-container');
      console.log('updateFaqContainer called - faqContainer exists:', !!faqContainer);
      console.log('Current faqData:', this.faqData);
      
      if (!faqContainer) {
        console.warn('FAQ container not found! Did you forget to call render() first?');
        return;
      }
      
      if (faqContainer) {
        faqContainer.innerHTML = this.renderFaqItems();
        console.log('FAQ container innerHTML updated');
        
        // Re-attach event listeners to FAQ items
        const faqItems = faqContainer.querySelectorAll('.faq-item');
        console.log('FAQ items found:', faqItems.length);
        
        if (faqItems.length > 0) {
          faqItems.forEach(item => {
            item.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              const id = item.getAttribute('data-id');
              const type = item.getAttribute('data-type');

              console.log('FAQ item clicked:', { id, type });
              this.postMessage('selectFaq', {
                id: id,
                type: type,
              });
            });
          });
        }
      }
    }

    logMsg () {
      if (window.debug ||
          window.location.search.indexOf('debug=1') > 0) {
        console.log(performance.now(), arguments[0] || '');
      }
    }
  }

  let manualDetail = new ManualDetail();

  window.setDataManual = function(data, isDebug) {

    // mobile device
    if (manualDetail.isWebviewBrowser){
      window.setDataApp = function(data) {
        manualDetail.appData = data;
        
        // Extract and update FAQ data - handle both faq and dataFaq properties
        const faqData = data.faq || data.dataFaq;
        if (faqData && Array.isArray(faqData)) {
          manualDetail.faqData = faqData;
          console.log('FAQ data updated from setDataApp:', manualDetail.faqData);
          
          // Update FAQ container if it exists
          manualDetail.updateFaqContainer();

          manualDetail.updateSectionFooterPadding();
        }
      };

      window.postDOMContentLoaded = function( ) {
        window.postLoadFinished = function( data) {
          manualDetail.postMessage(
              'loadFinished', {success: true}
          );

          delete window.initManual;
          delete window.setDataManual;
          delete window.setDataApp;
          delete window.postLoadFinished;
        };

        setTimeout(function() {
            manualDetail.postMessage(
              'javascriptLoaded', manualDetail.paramsDOMLoaded
            );

            const loading = document.getElementById('img-loading');
            if( loading ) loading.remove();

        }, 100);

        delete window.postDOMContentLoaded;
      };
    }

    if( isDebug === true ) {
      manualDetail.isWebviewBrowser = isDebug;
    }

    manualDetail.setDataManual(data);

  };

  window.setSearchResults = function(results) {
    manualDetail.setSearchResults(results);
  };

  window.appendSearchResults = function(newResults) {
    manualDetail.appendSearchResults(newResults);
  };

  window.updateDataAfterReset = function(newData) {
    console.log('updateDataAfterReset called with data:', newData);
    
    // Update FAQ data
    if (Array.isArray(newData)) {
      manualDetail.faqData = newData;

      // Update FAQ container with new data
      manualDetail.updateFaqContainer();

      document.querySelectorAll('.toc_container, .toc-content, .section-faq').forEach(section => {
        section.style.display = '';
      });

      manualDetail.updateSectionFooterPadding();
    } else {
      console.warn('newData is not an array:', newData);
    }
  }

})();
