(function() {
  class HelpListFAQ {
    #data = null;
    #searchManager = null;
    #categoryPagination = {}; // Track pagination state for each category
    #itemsPerPage = 5;

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
     * @param {Object} data - Data structure containing faq object
     */
    init(data) {
      try {
        this.#data = data;
        // Initialize pagination state for each category
        Object.keys(data.faq || {}).forEach(categoryId => {
          const category = data.faq[categoryId];
          this.#categoryPagination[categoryId] = {
            currentPage: 1,
            pageCount: category.pagination.page_count || 1,
            total: category.pagination.total_item_count || category.items.length
          };
        });
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
      if (!this.#data || !this.#data.faq) {
        console.warn('Data is not initialized. Call init() first.');
        return;
      }

      const app = document.getElementById("app");
      if (!app) {
        console.warn('App element not found in DOM');
        return;
      }

      const faqObj = this.#data.faq;
      const categoriesHtml = Object.keys(faqObj).map(categoryId => {
        const category = faqObj[categoryId];
        const pagination = this.#categoryPagination[categoryId];
        const itemsToDisplay = Math.min(this.#itemsPerPage, category.items.length);
        const hasMore = pagination.currentPage < pagination.pageCount;
        
        return `
          <div class="title-item" data-id="${categoryId}">${category.cate_name}</div>

          ${category.items.slice(0, itemsToDisplay).map(faq => `
            <div class="faq-item" data-id="${faq.id}">${faq.question}</div>
          `).join("")}
          
          ${hasMore ? `
            <div class="load-more-container">
              <span class="load-more-btn" data-category-id="${categoryId}">もっと見る</span>
            </div>
          ` : `
            <div class="end-of-results" style="padding: 20px; text-align: center; color: #aaa; font-size: 14px;">
              すべての結果を表示しました (${itemsToDisplay}/${pagination.total})
            </div>
          `}
        `;
      }).join("");

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
          <div class="section-title fixed" style="top: 73px;">よくある質問一覧</div>
        </div>
        <div class="section">
          <div class="section-container pb-2">
            ${categoriesHtml}
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
     * @param {Object} results - Search results containing items with fallback status
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
        
        // Reset pagination state for each category
        this.#categoryPagination = {};
        Object.keys(data.faq || {}).forEach(categoryId => {
          const category = data.faq[categoryId];
          this.#categoryPagination[categoryId] = {
            currentPage: 1,
            pageCount: category.pagination.page_count || 1,
            total: category.pagination.total_item_count || category.items.length
          };
        });

        // Reset search state
        this.#searchManager.reset();

        // Clear search input
        const searchInput = document.getElementById("searchInput");
        if (searchInput) {
          searchInput.value = '';
        }

        document.getElementById("searchResults").innerHTML = '';

        // Re-render and setup static event listeners only (they're reused)
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

      // Combined event delegation for FAQ items and load-more buttons
      const sectionContainer = document.querySelector('.section-container');
      if (sectionContainer) {
        sectionContainer.addEventListener('click', (e) => {
          // Handle FAQ item clicks
          const faqItem = e.target.closest('.faq-item');
          if (faqItem) {
            const id = faqItem.dataset.id;
            this.postMessage('selectFaq', {
              type: 'faq',
              id: id
            });
            return;
          }

          // Handle load-more button clicks
          const loadMoreBtn = e.target.closest('.load-more-btn');
          if (loadMoreBtn) {
            const categoryId = loadMoreBtn.getAttribute('data-category-id');
            const pagination = this.#categoryPagination[categoryId];
            
            if (pagination) {
              // Add loading state
              loadMoreBtn.classList.add('loading');
              
              const nextPage = pagination.currentPage + 1;
              console.log('Loading more FAQs for category:', {
                categoryId: categoryId,
                page: nextPage,
                limit: this.#itemsPerPage
              });
              
              this.postMessage('loadMoreCategory', {
                categoryId: categoryId,
                page: nextPage,
                limit: this.#itemsPerPage
              });
            }
          }
        });
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
              limit: 10,
              type: 'faq'
            });
            return;
          }

          // Handle search result items click
          const resultItem = e.target.closest('.search-result-item');
          if (resultItem) {
            const id = resultItem.dataset.id;
            console.log('Search result item clicked - id:', id);
            this.postMessage('selectFaq', {
              type: 'faq',
              id: id,
            });
          }
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
     * Adds more FAQs for a specific category
     * @public
     * @param {string} categoryId - The category ID
     * @param {Object} newFaqs - Object containing pagination, items, and html properties
     */
    addMoreFAQsForCategory(categoryId, newFaqs) {
      try {
        const categoryStr = String(categoryId);
        if (!this.#data.faq[categoryStr]) {
          console.warn(`Category with ID ${categoryId} not found`);
          return;
        }

        // Extract new FAQ items from the newFaqs object
        const faqItems = newFaqs.items || [];
        
        // Save old item count before adding new items
        const oldItemsCount = this.#data.faq[categoryStr].items.length;
        
        // Add new FAQs to existing array
        this.#data.faq[categoryStr].items.push(...faqItems);

        // Update pagination information
        if (newFaqs.pagination) {
          this.#data.faq[categoryStr].pagination = newFaqs.pagination;
        }

        // Store HTML if provided
        if (newFaqs.html) {
          this.#data.faq[categoryStr].html = newFaqs.html;
        }

        // Update pagination state
        if (this.#categoryPagination[categoryStr]) {
          this.#categoryPagination[categoryStr].currentPage += 1;
          this.#categoryPagination[categoryStr].pageCount = newFaqs.pagination?.page_count || this.#categoryPagination[categoryStr].pageCount;
          this.#categoryPagination[categoryStr].total = this.#data.faq[categoryStr].pagination.total_item_count || this.#data.faq[categoryStr].items.length;
        }

        // Re-render the specific category section with old item count reference
        this.renderCategorySection(categoryStr, oldItemsCount);
        
        // Remove loading state from the button
        this.removeLoadingState(categoryStr);

        console.log(`Added ${faqItems.length} more FAQs for category ${categoryId}`);
      } catch (error) {
        console.error('Error adding more FAQs:', error);
        // Remove loading state even on error
        this.removeLoadingState(categoryId);
      }
    }

    /**
     * Removes loading state from load-more button
     * @private
     * @param {string} categoryId - The category ID
     */
    removeLoadingState(categoryId) {
      const categoryStr = String(categoryId);
      const sectionContainer = document.querySelector('.section-container');
      if (!sectionContainer) return;
      
      const loadMoreBtn = sectionContainer.querySelector(`.load-more-btn[data-category-id="${categoryStr}"]`);
      if (loadMoreBtn) {
        loadMoreBtn.classList.remove('loading');
      }
    }

    /**
     * Re-renders a specific category section
     * @private
     * @param {string} categoryId - The category ID to re-render
     * @param {number} oldItemsCount - The number of items before adding new ones (optional)
     */
    renderCategorySection(categoryId, oldItemsCount = null) {
      const categoryStr = String(categoryId);
      const category = this.#data.faq[categoryStr];
      if (!category) return;

      const sectionContainer = document.querySelector('.section-container');
      if (!sectionContainer) return;

      const pagination = this.#categoryPagination[categoryStr];
      // Get all loaded items (will be displayed in full)
      const itemsToDisplay = category.items.length;
      // Check if there are more pages to load
      const shouldShowLoadMore = pagination.currentPage < pagination.pageCount;

      // Find current category items in DOM and replace them
      const titleItem = sectionContainer.querySelector(`[data-id="${categoryStr}"]`);
      if (!titleItem) return;

      // Find and remove old load-more button (if exists)
      let currentNode = titleItem.nextElementSibling;
      while (currentNode && currentNode.classList.contains('faq-item')) {
        currentNode = currentNode.nextElementSibling;
      }
      if (currentNode && currentNode.classList.contains('load-more-container')) {
        const oldLoadMoreBtn = currentNode;
        currentNode = currentNode.nextElementSibling;
        oldLoadMoreBtn.remove();
      }

      // Build HTML for new FAQ items (from previous loaded count to new loaded count)
      // Use oldItemsCount if provided (passed from addMoreFAQsForCategory), otherwise calculate it
      const startIndex = oldItemsCount !== null ? oldItemsCount : (this.#categoryPagination[categoryStr].currentLoaded - this.#itemsPerPage);
      const newFaqsHtml = category.items.slice(startIndex, itemsToDisplay).map(faq => `
        <div class="faq-item" data-id="${faq.id}">${faq.question}</div>
      `).join("");

      // Find the last faq-item and insert new items after it
      let lastFaqItem = titleItem;
      let checkNode = titleItem.nextElementSibling;
      while (checkNode && checkNode.classList.contains('faq-item')) {
        lastFaqItem = checkNode;
        checkNode = checkNode.nextElementSibling;
      }

      // Insert new FAQ items after the last faq-item
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = newFaqsHtml;
      while (tempDiv.firstChild) {
        lastFaqItem.parentNode.insertBefore(tempDiv.firstChild, lastFaqItem.nextSibling);
        lastFaqItem = lastFaqItem.nextSibling;
      }

      // Add load-more button or end-of-results message
      if (shouldShowLoadMore) {
        const loadMoreContainer = document.createElement('div');
        loadMoreContainer.className = 'load-more-container';
        
        const newLoadMoreBtn = document.createElement('span');
        newLoadMoreBtn.className = 'load-more-btn';
        newLoadMoreBtn.setAttribute('data-category-id', categoryStr);
        newLoadMoreBtn.textContent = 'もっと見る';
        
        loadMoreContainer.appendChild(newLoadMoreBtn);
        lastFaqItem.parentNode.insertBefore(loadMoreContainer, lastFaqItem.nextSibling);

        // Event listener is now handled by event delegation in #setupStaticEventListeners
      } else {
        // Show end-of-results message
        const endOfResultsDiv = document.createElement('div');
        endOfResultsDiv.className = 'end-of-results';
        endOfResultsDiv.style.cssText = 'padding: 20px; text-align: center; color: #aaa; font-size: 14px;';
        endOfResultsDiv.textContent = `すべての結果を表示しました (${itemsToDisplay}/${pagination.total})`;
        
        lastFaqItem.parentNode.insertBefore(endOfResultsDiv, lastFaqItem.nextSibling);
      }

      console.log(`Rendered category section for ${categoryId}, displaying ${itemsToDisplay} items`);
    }
  }

  // Initialize
  try {
    const helpPageController = new HelpListFAQ();
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
//   faq: {
//     "1": {
//       "cate_name": "おもちゃとゲーム",
//       "pagination": {
//         "page_count": 2,
//         "total_item_count": 8
//       },
//       "items": [
//         { "id": 107, "question": "ラジコンカーが動きません", "view_count": 0 },
//         { "id": 108, "question": "ボードゲームのルール説明", "view_count": 2 },
//         { "id": 109, "question": "パズルが完成しません", "view_count": 1 },
//         { "id": 110, "question": "おもちゃの修理方法", "view_count": 3 },
//         { "id": 111, "question": "新作ゲームの発売日", "view_count": 5 }
//       ]
//     },
//     "2": {
//       "cate_name": "映画およびテレビ用品",
//       "pagination": {
//         "page_count": 1,
//         "total_item_count": 4
//       },
//       "items": [
//         { "id": 102, "question": "アプリが起動しない場合の対処方法は？", "view_count": 0 },
//         { "id": 103, "question": "映画配信サービスの登録方法", "view_count": 2 },
//         { "id": 104, "question": "テレビの接続トラブル", "view_count": 1 },
//         { "id": 105, "question": "テレビの接続トラブル tttt", "view_count": 1 }
//       ]
//     },
//     "6": {
//       "cate_name": "アプリとゲーム",
//       "pagination": {
//         "page_count": 1,
//         "total_item_count": 5
//       },
//       "items": [
//         { "id": 202, "question": "アプリのダウンロード方法", "view_count": 4 },
//         { "id": 203, "question": "ゲームの操作方法", "view_count": 3 },
//         { "id": 204, "question": "アプリのアップデート手順", "view_count": 2 },
//         { "id": 205, "question": "クラッシュしたときの対処法", "view_count": 5 },
//         { "id": 206, "question": "パスワードをリセットしたい", "view_count": 1 }
//       ]
//     },
//     "11": {
//       "cate_name": "書籍",
//       "pagination": {
//         "page_count": 2,
//         "total_item_count": 7
//       },
//       "items": [
//         { "id": 301, "question": "書籍の注文方法", "view_count": 6 },
//         { "id": 302, "question": "配送日数はどのくらい？", "view_count": 4 },
//         { "id": 303, "question": "返品・交換について", "view_count": 3 },
//         { "id": 304, "question": "電子書籍のダウンロード手順", "view_count": 2 },
//         { "id": 305, "question": "本の在庫確認方法", "view_count": 1 }
//       ]
//     }
//   }
// });

// Mock data for testing addMoreFAQsForCategory
// Simulate loading more FAQs for category 1 after 8 seconds
// setTimeout(() => {
//   console.log('Simulating load more for category 1...');
//   window.helpPageController.addMoreFAQsForCategory('1', {
//     "pagination": {
//       "page_count": 2,
//       "total_item_count": 8
//     },
//     "items": [
//       { "id": 112, "question": "レゴセットの組み立て方", "view_count": 2 },
//       { "id": 113, "question": "ボードゲームの拡張版について", "view_count": 1 },
//       { "id": 114, "question": "おもちゃの対象年齢", "view_count": 0 }
//     ],
//     "html": "https://api.test.engibase.com/help-html/faq-list.html?is_mobile=1"
//   });
// }, 8000);

// Mock data for testing addMoreFAQsForCategory for category 2
// Simulate loading more FAQs for category 2 after 12 seconds
// setTimeout(() => {
//   console.log('Simulating load more for category 2...');
//   window.helpPageController.addMoreFAQsForCategory('2', {
//     "pagination": {
//       "page_count": 1,
//       "total_item_count": 4
//     },
//     "items": [
//       { "id": 105, "question": "リモコンが反応しない場合", "view_count": 2 },
//       { "id": 106, "question": "イヤホン接続トラブル", "view_count": 1 }
//     ],
//     "html": "https://api.test.engibase.com/help-html/faq-list.html?is_mobile=1"
//   });
// }, 12000);

// Mock data for testing setSearchResults with no results (fallback case)
// setTimeout(() => {
//   console.log('Testing setSearchResults with fallback data (no results)...');
//   window.helpPageController.setSearchResults({
//     zero_result: true,
//     zero_msg: "該当するヘルプが見つかりませんでした。別のキーワードや短い単語で検索すると見つかる場合があります。",
//     items: [
//       { id: 107, question: "ラジコンカーが動きません", view_count: 5 },
//       { id: 102, question: "アプリが起動しない場合の対処方法は？", view_count: 1 },
//       { id: 103, question: "ログイン時にエラーコードE001が表示されます", view_count: 0 },
//       { id: 104, question: "ゲームがフリーズする・動かない", view_count: 0 }
//     ],
//     fallback: true,
//     fallback_type: "popular"
//   });
// }, 15000);

// Mock data for testing setSearchResults with results (normal search) with pagination
// setTimeout(() => {
//   console.log('Testing setSearchResults with normal search results...');
  // window.helpPageController.setSearchResults({
  //   zero_result: false,
  //   zero_msg: null,
  //   pagination: {
  //     page_count: 3,
  //     total_item_count: 25
  //   },
  //   items: [
  //     { id: 103, question: "ログイン時にエラーコードE001が表示されます", type: "faq", title: "ログイン時にエラーコードE001が表示されます" },
  //     { id: 110, question: "ﾛｸﾞｲﾝできない（半角カタカナ）", type: "faq", title: "ﾛｸﾞｲﾝできない（半角カタカナ）" },
  //     { id: 111, question: "パスワードを忘れた場合の対処方法", type: "faq", title: "パスワードを忘れた場合の対処方法" },
  //     { id: 112, question: "アカウントがロックされました", type: "faq", title: "アカウントがロックされました" },
  //     { id: 113, question: "二段階認証の設定方法", type: "faq", title: "二段階認証の設定方法" },
  //     { id: 114, question: "メールアドレスを変更する方法", type: "faq", title: "メールアドレスを変更する方法" },
  //     { id: 115, question: "セッションが切断される問題の対処", type: "faq", title: "セッションが切断される問題の対処" },
  //     { id: 116, question: "表示が崩れる（CSS関連）", type: "faq", title: "表示が崩れる（CSS関連）" },
  //     { id: 117, question: "データのエクスポート方法", type: "faq", title: "データのエクスポート方法" },
  //     { id: 118, question: "インポート時にエラーが発生する", type: "faq", title: "インポート時にエラーが発生する" }
  //   ],
  //   fallback: false
  // });
//}, 20000);

// Mock data for testing updateDataAfterReset
// Simulate resetting and updating with fresh data after 15 seconds
// setTimeout(() => {
//   console.log('Simulating updateDataAfterReset...');
//   window.helpListFAQ.updateDataAfterReset({
//     faq: {
//       "1": {
//         "cate_name": "おもちゃとゲーム",
//         "pagination": {
//           "page_count": 1,
//           "total_item_count": 6
//         },
//         "items": [
//           { "id": 107, "question": "新作おもちゃの情報", "view_count": 5 },
//           { "id": 108, "question": "子ども向けゲーム推奨", "view_count": 3 },
//           { "id": 109, "question": "おもちゃのメンテナンス", "view_count": 2 },
//           { "id": 110, "question": "人気のボードゲーム", "view_count": 4 },
//           { "id": 111, "question": "プレゼント選びのコツ", "view_count": 1 }
//         ]
//       },
//       "2": {
//         "cate_name": "映画およびテレビ用品",
//         "pagination": {
//           "page_count": 1,
//           "total_item_count": 5
//         },
//         "items": [
//           { "id": 102, "question": "映画配信サービス比較", "view_count": 2 },
//           { "id": 103, "question": "テレビの最新モデル", "view_count": 3 },
//           { "id": 104, "question": "配信コンテンツ一覧", "view_count": 1 },
//           { "id": 105, "question": "字幕・吹替について", "view_count": 4 }
//         ]
//       },
//       "6": {
//         "cate_name": "アプリとゲーム",
//         "pagination": {
//           "page_count": 1,
//           "total_item_count": 7
//         },
//         "items": [
//           { "id": 202, "question": "アプリの推奨環境", "view_count": 3 },
//           { "id": 203, "question": "ゲームのコツ", "view_count": 2 },
//           { "id": 204, "question": "無料版と有料版の違い", "view_count": 5 },
//           { "id": 205, "question": "ユーザーサポート連絡先", "view_count": 1 },
//           { "id": 206, "question": "アカウント引き継ぎ方法", "view_count": 4 }
//         ]
//       },
//       "11": {
//         "cate_name": "書籍",
//         "pagination": {
//           "page_count": 1,
//           "total_item_count": 8
//         },
//         "items": [
//           { "id": 301, "question": "ベストセラー一覧", "view_count": 6 },
//           { "id": 302, "question": "新刊情報", "view_count": 4 },
//           { "id": 303, "question": "定期購読について", "view_count": 2 },
//           { "id": 304, "question": "電子版の特典", "view_count": 3 },
//           { "id": 305, "question": "著者サイン本予約", "view_count": 1 },
//           { "id": 306, "question": "本のギフト包装", "view_count": 2 }
//         ]
//       }
//     }
//   });
// }, 15000);

// Mock data for testing addMoreFAQsForCategory for category 3
// Simulate loading more FAQs for category 3 after 4 seconds
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
