(function() {
  class HelpPageController {
    #data = null;
    #searchManager = null;

    constructor() {
      // Initialize SearchManager
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
        this.render();
        this.#setupStaticEventListeners();
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
          <div class="section-title">ヘルプページトピック</div>
          <div class="section-container">
            ${this.#data.help?.map(item => `
              <div class="help-item" data-redirect="${item.help_redirect}" data-type="help" data-title="${item.title}">${item.title}</div>
            `).join("") || ""}
          </div>
        </div>

        <div class="section">
          <div class="section-title">よくある質問</div>
          <div class="section-container">
            ${this.#data.faq?.map(item => `
              <div class="faq-item" data-id="${item.id}" data-type="faq">${item.title}</div>
            `).join("") || ""}
            <div class="view-all redirect-page" data-page="faq_list">[すべてのFAQを見る]</div>
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

      // Update padding-bottom based on section-footer height
      this.#updateSectionFooterPadding();
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
     * Renders search results
     * @private
     */
    renderSearchResults() {
      const resultsContainer = document.getElementById("searchResults");
      if (!resultsContainer) return;

      // Get HTML from SearchManager
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
      console.log('Setting search results:', results);
      
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
      // HELP item clicks
      document.querySelectorAll('.help-item').forEach(item => {
        item.addEventListener('click', () => {
          const redirect = item.dataset.redirect;
          console.log({
            help_redirect: redirect,
            type: 'topic',
          })
          this.postMessage('selectTopic', {
            help_redirect: redirect,
            type: 'topic',
          });
        });
      });

      // FAQ item clicks
      document.querySelectorAll('.faq-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = item.dataset.id;
          this.postMessage('selectFaq', {
            type: 'faq',
            id: id
          });
        });
      });

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
            console.log('Load more button clicked - loading next page:', nextPage);
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
            const type = resultItem.dataset.type;
            const title = resultItem.querySelector('.result-title').textContent;
            
            if (type === 'help') {
              const redirect = resultItem.dataset.redirect;
              this.postMessage('selectTopic', {
                help_redirect: redirect
              });
            } else {
              const id = resultItem.dataset.id;
              this.postMessage('selectFaq', {
                type: 'faq',
                id: id,
                title: title
              });
            }
          }
        });
      }

      // Setup ResizeObserver to monitor section-footer height changes
      const sectionFooter = document.querySelector('.section-footer');
      if (sectionFooter) {
        const resizeObserver = new ResizeObserver(() => {
          this.#updateSectionFooterPadding();
        });
        resizeObserver.observe(sectionFooter);
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
     * Updates data with new structure
     * @public
     */
    setData(newData) {
      this.#data = newData;
      this.render();
      this.#setupStaticEventListeners();
    }

    /**
     * Gets current data
     * @public
     */
    getData() {
      return this.#data;
    }
  }

  // Initialize
  try {
    const helpPageController = new HelpPageController();
    window.helpPageController = helpPageController;

    // Initialize function to be called from Flutter
    window.initHelpPage = function (data) {
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
    };

    // Send notification that JavaScript is loaded
    helpPageController.postMessage('javascriptLoaded', { success: true });

  } catch (error) {
    console.error('Failed to initialize help page:', error);
  }

})();

// initHelpPage({
//   help: [
//     { title: 'ログインできない場合', help_redirect: 'daily_report' },
//     { title: 'パスワードを変更する方法', help_redirect: 'development' },
//     { title: 'アカウント設定について', help_redirect: 'current_address' },
//     { title: 'エラーコード一覧', help_redirect: 'inquiry_list' }
//   ],
//   faq: [
//     { id: 5, title: 'In other words, Navicat provides the ability for data in different databases and/or schemas to be ke' },
//     { id: 94, title: 'The reason why a great man is great is that he resolves to be a great man. I may not have gone where' },
//     { id: 80, title: 'Instead of wondering when your next vacation is, maybe you should set up a life you don\'t need to' },
//     { id: 62, title: 'Remember that failure is an event, not a person.' }
//   ]
// })

// Mock data for testing updateDataAfterReset
// Simulate resetting and updating with fresh data after 10 seconds
// setTimeout(() => {
//   console.log('Simulating updateDataAfterReset...');
//   window.helpPageController.updateDataAfterReset({
//     help: [
//       { title: 'ヘルプについて', help_redirect: 'help_about' },
//       { title: 'ご利用方法', help_redirect: 'help_usage' },
//       { title: 'トラブル対処', help_redirect: 'help_troubleshooting' },
//       { title: 'お問い合わせ', help_redirect: 'inquiry_send' }
//     ],
//     faq: [
//       { id: 1, title: 'ログインはどうするのですか？' },
//       { id: 2, title: 'パスワードを忘れたら？' },
//       { id: 3, title: '退会したい場合は？' },
//       { id: 4, title: 'アプリが起動しない場合は？' }
//     ]
//   });
// }, 10000);

// window.helpPageController.setSearchResults({
//   faq: {
//     pagination: {
//       page_count: 3,
//       total_item_count: 25
//     },
//     items: [
//       { id: 103, question: "ログイン時にエラーコードE001が表示されます", view_count: 0, score: 373.43835 },
//       { id: 110, question: "ﾛｸﾞｲﾝできない（半角カタカナ）", view_count: 0, score: 119.75978 },
//       { id: 111, question: "パスワードを忘れた場合の対処方法", view_count: 12, score: 98.12345 },
//       { id: 112, question: "アカウントがロックされました", view_count: 5, score: 87.65432 },
//       { id: 113, question: "二段階認証の設定方法", view_count: 3, score: 76.54321 },
//       { id: 114, question: "メールアドレスを変更する方法", view_count: 8, score: 65.43210 },
//       { id: 115, question: "セッションが切断される問題の対処", view_count: 2, score: 54.32109 },
//       { id: 116, question: "表示が崩れる（CSS関連）", view_count: 1, score: 43.21098 },
//       { id: 117, question: "データのエクスポート方法", view_count: 7, score: 32.10987 },
//       { id: 118, question: "インポート時にエラーが発生する", view_count: 4, score: 21.09876 }
//     ]
//   }
// });

// Demo code moved to #setupInfiniteScroll() method

// Mock data for testing setSearchResults with no results (fallback case)
// setTimeout(() => {
//   console.log('Testing setSearchResults with fallback data (no results)...');
//   window.helpPageController.setSearchResults({
//     type: "faq",
//     zero_result: true,
//     zero_msg: "該当するヘルプが見つかりませんでした。別のキーワードや短い単語で検索すると見つかる場合があります。",
//     faq: {
//       items: [
//         { id: 107, question: "ラジコンカーが動きません", view_count: 5 },
//         { id: 102, question: "アプリが起動しない場合の対処方法は？", view_count: 1 },
//         { id: 103, question: "ログイン時にエラーコードE001が表示されます", view_count: 0 },
//         { id: 104, question: "ゲームがフリーズする・動かない", view_count: 0 },
//         { id: 105, question: "電子レンジが加熱できない原因は？", view_count: 0 }
//       ],
//       fallback: true,
//       fallback_type: "popular"
//     },
//     helpCate: [],
//     html: "https://api.test.engibase.com/help-html/faq-list.html?is_mobile=1"
//   });
// }, 5000);

// Mock data for testing setSearchResults with results (normal search)
// setTimeout(() => {
//   console.log('Testing setSearchResults with normal search results...');
//   window.helpPageController.setSearchResults({
//     type: "faq",
//     zero_result: false,
//     zero_msg: null,
//     faq: {
//       pagination: {
//         page_count: 1,
//         total_item_count: 2
//       },
//       items: [
//         { id: 103, question: "ログイン時にエラーコードE001が表示されます", view_count: 0, score: 185.75394 },
//         { id: 110, question: "ﾛｸﾞｲﾝできない（半角カタカナ）", view_count: 0, score: 84.26331 }
//       ],
//       fallback: false
//     },
//     helpCate: [],
//     html: "https://api.test.engibase.com/help-html/faq-list.html?is_mobile=1"
//   });
// }, 10000);
