(function() {
  class HelpFAQDetail {
    #data = null;
    #searchManager = null;
    #scrollTo = null;

    constructor() {
      // Initialize SearchManager with config
      this.#searchManager = new SearchManager({
        postMessage: (fncName, msg) => this.postMessage(fncName, msg),
        renderCallback: () => this.renderSearchResults(),
        itemsPerPage: 10
      });
    }

    /**
     * Initializes the help page with data from Flutter
     * @public
     * @param {Object} data - Data structure containing topics and faqs
     */
    init(data) {
      try {
        this.#data = data;
        this.#scrollTo = data.scroll_to || null;
      
        this.render();
        this.#setupStaticEventListeners();

        // Scroll to the target element if scroll_to is provided and not at top
        // Use setTimeout to ensure DOM is fully rendered before checking offsetTop
        if (this.#scrollTo) {
          setTimeout(() => {
            if (this.#shouldScroll()) {
              this.#scrollToElement();
            }
          }, 100);
        }

        console.log('height component id app:', document.getElementById("app").offsetHeight);
      } catch (error) {
        console.error('Failed to initialize help page:', error);
        throw error;
      }
    }

    /**
     * Sends message to Flutter app
     * @private
     */
    postMessage(fncName, msg) {
      try {
        if (window[fncName]?.postMessage) {
          window[fncName].postMessage(JSON.stringify(msg));
        } else {
          console.warn(`JavaScript channel ${fncName} is not defined`);
        }  
      } catch (error) {
        console.error('An error occurred while calling the postMessage function:', error);
      }
    }

    /**
     * Renders the help page UI
     * @private
     */
    render() { 
      if (!this.#data) {
        console.warn('Data is not initialized. Call init() first.');
        return;
      }

      const app = document.getElementById("app");
      if (!app) {
        console.warn('App element not found in DOM');
        return;
      }

      let categoriesHtml = '';
      
      // Loop through each category and render FAQs
      if (this.#data.faq && typeof this.#data.faq === 'object') {
        categoriesHtml = Object.keys(this.#data.faq).map((categoryId) => {
          const category = this.#data.faq[categoryId];
          return this.#renderCategory(categoryId, category);
        }).join('');
      }

      app.innerHTML = `
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
        <div class="section">
          <div style="height: 43px;"></div>
          <div class="section-title fixed" style="top: 73px;">よくある質問</div>
        </div>
        
        ${categoriesHtml}

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

      
      // Update padding-bottom based on section-footer height
      this.#updateSectionFooterPadding();
    }

    /**
     * Renders a category with FAQ items
     * @private
     * @param {string} categoryId - The category ID
     * @param {Object} category - The category object containing cate_name and items
     */
    #renderCategory(categoryId, category) {
      const items = category.items || [];

      const faqsHtml = items.map((faq, faqIndex) => {
        const faqId = faq.id;
        return `
          <div class="faq-item-detail" id="faq-${faqId}" data-faq-id="${faqId}">
            <div class="faq-question">
              <div class="faq-question-text">
                <span class="faq-number">Q.</span>
                <span class="faq-question-title">${faq.question}</span>
              </div>
            </div>
            <div class="faq-answer">
              <div class="faq-answer-content">
                <span class="answer-prefix">A.</span>
                <span class="answer-text">${faq.answer}</span>
              </div>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="section" data-category-id="${categoryId}">
          <div class="section-container pb-2">
            <div class="category-title">${category.cate_name}</div>
            <div class="faq-list">
              ${faqsHtml}
            </div>
          </div>
        </div>
      `;
    }

    /**
     * Updates app padding-bottom based on section-footer height
     * @private
     */
    #updateSectionFooterPadding() {
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
    }

    /**
     * Scrolls to the target element with smooth animation
     * @private
     */
    // #scrollToElement() {
    //   if (!this.#scrollTo) return;

    //   const targetId = `faq-${this.#scrollTo}`;
    //   const targetElement = document.getElementById(targetId);

    //   if (!targetElement) {
    //     console.warn(`Target element with id "${targetId}" not found`);
    //     return;
    //   }

    //   // Use requestAnimationFrame to ensure DOM is settled
    //   requestAnimationFrame(() => {
    //     const app = document.getElementById("app");
    //     if (app) {
    //       // Scroll with offset to account for fixed header
    //       const offsetTop = targetElement.offsetTop - 120;
    //       app.scrollTo({
    //         top: offsetTop,
    //         behavior: 'smooth'
    //       });
    //       console.log(`Scrolled to element: ${targetId}`);
    //     }
    //   });
    // }
    #scrollToElement() {
      if (!this.#scrollTo) return;

      const targetId = `faq-${this.#scrollTo}`;
      const targetElement = document.getElementById(targetId);

      if (!targetElement) {
        console.warn(`Target element with id "${targetId}" not found`);
        return;
      }

      requestAnimationFrame(() => {
        const app = document.getElementById("app");
        if (!app) return;

        const appRect = app.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();

        const offset = 120;

        const scrollTop =
          targetRect.top - appRect.top + app.scrollTop - offset;

        app.scrollTo({
          top: scrollTop,
          behavior: "smooth"
        });
      });
    }

    /**
     * Check if target element needs scrolling (not at top)
     * @private
     */
    #shouldScroll() {
      if (!this.#scrollTo) return false;

      // Get first category
      if (!this.#data.faq || typeof this.#data.faq !== 'object') return true;

      const categoryIds = Object.keys(this.#data.faq);
      if (categoryIds.length === 0) return true;

      const firstCategory = this.#data.faq[categoryIds[0]];
      const firstItems = firstCategory.items || [];

      if (firstItems.length === 0) return true;

      // If scroll_to is the first item of first category, don't scroll
      const firstItemId = String(firstItems[0].id);
      const scrollToId = String(this.#scrollTo);

      if (firstItemId === scrollToId) {
        console.log(`scroll_to (${scrollToId}) is the first item, skipping scroll`);
        return false;
      }

      return true;
    }


    /**
     * Renders search results HTML from SearchManager
     * @private
     */
    renderSearchResults() {
      const resultsContainer = document.getElementById("searchResults");
      if (!resultsContainer) return;
      const html = this.#searchManager.renderSearchResultsHTML();
      resultsContainer.innerHTML = html;
      
    }

    /**
     * Sets or appends search results
     * Automatically detects whether to reset (page 1) or append based on existing results
     * @public
     * @param {Object} results - Search results containing faq data with fallback status
     */
    setSearchResults(results) {
      // Auto-detect: if we have existing results, this is an append operation
      const hasExistingResults = this.#searchManager.getItems().length > 0;
      const page = hasExistingResults ? this.#searchManager.getCurrentSearchPage() + 1 : 1;
      
      this.#searchManager.setSearchResults(results, page);
      this.renderSearchResults();
      this.#setupDynamicEventListeners();
      
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

    /**
     * Updates data after resetSearch and re-renders the page
     * @public
     * @param {Object} data - New data structure from app
     */
    updateDataAfterReset(data) {
      try {
        this.#data = data;

        // Reset search state
        this.#searchManager.reset();

        // Clear search input
        const searchInput = document.getElementById("searchInput");
        if (searchInput) {
          searchInput.value = '';
        }

        document.getElementById("searchResults").innerHTML = '';

        // Re-render and setup static event listeners only
        this.render();
        this.#setupStaticEventListeners();

        console.log('Data updated after reset');
      } catch (error) {
        console.error('Error updating data after reset:', error);
      }
    }

    /**
     * Sets up static event listeners (called only once)
     * @private
     */
    #setupStaticEventListeners() {
      // Search input
      const searchInput = document.getElementById("searchInput");
      if (searchInput) {
        // Setup search input events through SearchManager
        this.#searchManager.setupSearchInputEvents({
          searchType: 'faq',
          onSearch: (params) => this.postMessage('search', params),
          updateSectionFooterPadding: () => this.#updateSectionFooterPadding()
        });
      }

      // Redirect page clicks
      document.querySelectorAll('.redirect-page').forEach(item => {
        item.addEventListener('click', () => {
          const page = item.dataset.page;
          this.postMessage('redirectPage', {
            page: page
          });
        });
      });

      const sectionFooter = document.querySelector('.section-footer');
      if (sectionFooter) {
        const resizeObserver = new ResizeObserver(() => {
          this.#updateSectionFooterPadding();
        });
        resizeObserver.observe(sectionFooter);
      }

      // Search results container with event delegation (set up only once)
      const searchResults = document.getElementById('searchResults');
      if (searchResults) {
        searchResults.addEventListener('click', (e) => {
          // Handle load-more button clicks
          const loadMoreBtn = e.target.closest('.load-more-btn[data-page="search"]');
          if (loadMoreBtn) {
            // Add loading state
            loadMoreBtn.classList.add('loading');
            
            const nextPage = this.#searchManager.getCurrentSearchPage() + 1;
            
            this.postMessage('search', {
              query: this.#searchManager.getSearchQuery(),
              page: nextPage,
              limit: this.#searchManager.getItemsPerPage(),
              type: 'faq'
            });
            return;
          }

          // Handle search result items click
          const resultItem = e.target.closest('.search-result-item');
          if (resultItem) {
            const id = resultItem.dataset.id;
            this.postMessage('selectFaq', {
              type: 'faq',
              id: id
            });
          }
        });
      }
    }

    /**
     * Sets up dynamic event listeners (setup/re-setup for search results)
     * Note: Event delegation listeners are set up only once in #setupStaticEventListeners()
     * This method is kept as a no-op for backwards compatibility but listeners won't be recreated
     * @private
     */
    #setupDynamicEventListeners() {
      // Listeners for search results are now set up once in #setupStaticEventListeners()
      // No need to recreate them on each setSearchResults() call
    }
  }

  // Initialize
  try {
    const helpPageController = new HelpFAQDetail();
    window.helpPageController = helpPageController; // Expose to global scope for Flutter to call init()

    // Initialize function to be called from Flutter
    window.initHelpPage = function(data) { 
      let error = null;
      let isSuccess = false;
      try {
        helpPageController.init(data);
        isSuccess = true;
      } catch (err) {
        error = err.message;
      }
      
      helpPageController.postMessage('loadFinished', {
        error: error,
        success: isSuccess
      });
      
      return isSuccess;
    }

    // Send notification that JavaScript is loaded
    helpPageController.postMessage('javascriptLoaded', { success: true });
  } catch (error) {
    console.error('An error occurred while initializing the FAQ list:', error);
  }
})();

// initHelpPage({
//   scroll_to: '102',
//   faq: {
//     "1": {
//       "cate_name": "おもちゃとゲーム",
//       "items": [
//         {
//           "id": 102,
//           "question": "アプリが起動しない場合の対処方法は？",
//           "answer": "<p data-start=\"449\" data-end=\"475\">アプリが起動しない場合、以下を確認してください。</p><p data-start=\"449\" data-end=\"475\">1. 端末を再起動する</p><p data-start=\"449\" data-end=\"475\">2. アプリを最新バージョンにアップデートする</p><p data-start=\"449\" data-end=\"475\">3. キャッシュを削除する</p><p data-start=\"449\" data-end=\"475\">それでも解決しない場合はサポートへお問い合わせください。</p>",
//           "view_count": 3
//         },
//         {
//           "id": 103,
//           "question": "ログイン時にエラーコードE001が表示されます",
//           "answer": "<p>エラーコードE001は、認証失敗を意味します。<br data-start=\"656\" data-end=\"659\">\r\nメールアドレスまたはパスワードをご確認ください。<br data-start=\"683\" data-end=\"686\">\r\n英数字の全角・半角の違いにもご注意ください。</p>",
//           "view_count": 0
//         },
//         {
//           "id": 104,
//           "question": "ゲームがフリーズする・動かない",
//           "answer": "<p>ゲームが途中でフリーズする場合は、<br data-start=\"867\" data-end=\"870\">\r\nバックグラウンドアプリを終了してください。<br data-start=\"891\" data-end=\"894\">\r\nストレージ容量不足も原因となる場合があります。</p>",
//           "view_count": 0
//         },
//         {
//           "id": 105,
//           "question": "電子レンジが加熱できない原因は？",
//           "answer": "<p>電子レンジが加熱しない場合は以下をご確認ください。<br data-start=\"1091\" data-end=\"1094\">\r\n・電源が正しく接続されているか<br data-start=\"1109\" data-end=\"1112\">\r\n・出力設定が適切か<br data-start=\"1121\" data-end=\"1124\">\r\n・ドアが完全に閉まっているか</p>",
//           "view_count": 0
//         },
//         {
//           "id": 106,
//           "question": "エアコンのリモコンが反応しない",
//           "answer": "<p>リモコンの電池残量をご確認ください。<br data-start=\"1269\" data-end=\"1272\">\r\n赤外線センサー部分に障害物がないか確認してください。</p>",
//           "view_count": 0
//         }
//       ]
//     },
//     "2": {
//       "cate_name": "映画およびテレビ用品",
//       "items": [
//         {
//           "id": 102,
//           "question": "アプリが起動しない場合の対処方法は？",
//           "answer": "<p data-start=\"449\" data-end=\"475\">アプリが起動しない場合、以下を確認してください。</p><p data-start=\"449\" data-end=\"475\">1. 端末を再起動する</p><p data-start=\"449\" data-end=\"475\">2. アプリを最新バージョンにアップデートする</p><p data-start=\"449\" data-end=\"475\">3. キャッシュを削除する</p><p data-start=\"449\" data-end=\"475\">それでも解決しない場合はサポートへお問い合わせください。</p>",
//           "view_count": 3
//         },
//         {
//           "id": 103,
//           "question": "ログイン時にエラーコードE001が表示されます",
//           "answer": "<p>エラーコードE001は、認証失敗を意味します。<br data-start=\"656\" data-end=\"659\">\r\nメールアドレスまたはパスワードをご確認ください。<br data-start=\"683\" data-end=\"686\">\r\n英数字の全角・半角の違いにもご注意ください。</p>",
//           "view_count": 0
//         },
//         {
//           "id": 104,
//           "question": "ゲームがフリーズする・動かない",
//           "answer": "<p>ゲームが途中でフリーズする場合は、<br data-start=\"867\" data-end=\"870\">\r\nバックグラウンドアプリを終了してください。<br data-start=\"891\" data-end=\"894\">\r\nストレージ容量不足も原因となる場合があります。</p>",
//           "view_count": 0
//         },
//         {
//           "id": 107,
//           "question": "ラジコンカーが動きません",
//           "answer": "<p>電池の向きを確認してください。<br data-start=\"1414\" data-end=\"1417\">\r\n送信機と受信機のペアリングが必要な場合があります。</p>",
//           "view_count": 7
//         },
//         {
//           "id": 108,
//           "question": "子供向けパズルの対象年齢は？",
//           "answer": "<p>本製品は3歳以上を対象としています。<br data-start=\"1525\" data-end=\"1528\">\r\n小さな部品がありますので誤飲にご注意ください。</p>",
//           "view_count": 0
//         }
//       ]
//     }
//   },
//   "html": "https://api.test.engibase.com/help-html/faq-detail.html?is_mobile=1"
// });

// //Simulate loading more FAQs for category 3 after 4 seconds
// setTimeout(() => {
//   console.log('Simulating load more for category 3...');
//   window.helpListFAQ.addMoreFAQsForCategory('3', [
//     {
//       id: '3-5',
//       title: 'データのバックアップ方法は？',
//     },
//     {
//       id: '3-6',
//       title: 'サーバーメンテナンスの予定は？',
//     },
//     {
//       id: '3-7',
//       title: 'セキュリティ対策について',
//     },
//     {
//       id: '3-8',
//       title: 'APIドキュメントはどこにありますか？',
//     }
//   ]);
// }, 10000);