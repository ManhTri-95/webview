(function() {
  class HelpContactIntermediate {
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
     * Renders search results
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
        this.#resetSearchSpacing();

        console.log('Data updated after reset');
      } catch (error) {
        console.error('Error updating data after reset:', error);
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
        <div style="height: 196px;" id="search-section-spacing"></div>

        <div id="searchResults" class="search-results"></div>

        <div class="section">
          <h2 class="note-title" style="top: 73px;">お問い合わせの前にご確認ください</h2>
          <div class="section-title fixed" style="top: 153px;">ヘルプカテゴリー</div>
        </div>

        <div class="section">
          <div class="section-container">
            ${this.#data.items.map(item => `
              <div class="faq-item" data-id="${item.id}" data-view-count="${item.view_count}">
                ${item.question}
              </div>
            `).join('')}
            <div class="view-all redirect-page" data-page="faq_list">[すべてのFAQを見る]</div>
          </div>

        </div>

        <div class="section section-footer">
          <div class="section-title">不明点が解消しない場合</div>
          <div class="section-container">
            <div class="contact-text">
              上記FAQで不明点が解消しない場合は、こちらからお問い合わせください。
            </div>
            <div class="view-all redirect-page" data-page="inquiry_send">[お問い合わせする]</div>
          </div>
        </div>
      `;

      this.#updateSectionFooterPadding();
    }

    /**
     * Updates search section spacing to match search-wrapper height
     * @private
     */
    #updateSearchSpacing() {
      const searchWrapper = document.querySelector('.search-wrapper');
      const spacingDiv = document.getElementById('search-section-spacing');
      
      if (searchWrapper && spacingDiv) {
        const wrapperHeight = searchWrapper.offsetHeight;
        spacingDiv.style.height = `${wrapperHeight}px`;
        console.log('Search spacing updated to:', wrapperHeight, 'px');
      }
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
     * Resets search section spacing to default height
     * @private
     */
    #resetSearchSpacing() {
      const spacingDiv = document.getElementById('search-section-spacing');
      if (spacingDiv) {
        spacingDiv.style.height = '196px';
        console.log('Search spacing reset to default: 196px');
      }
    }

    /**
     * Sets up static event listeners (called only once)
     * @private
     */
    #setupStaticEventListeners() {
      // FAQ item clicks
      document.querySelectorAll('.faq-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = item.dataset.id;
          const viewCount = item.dataset.viewCount;

          this.postMessage('selectFaq', {
            type: 'faq',
            id: id,
            viewCount: viewCount
          });
        });
      });

      // Search input
      const searchInput = document.getElementById("searchInput");
      if (searchInput) {
        // Setup search input events through SearchManager
        this.#searchManager.setupSearchInputEvents({
          searchType: 'faq',
          onSearchStart: () => this.#updateSearchSpacing(),
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
            console.log('Search result item clicked - id:', id);
            this.postMessage('selectFaq', {
              type: 'faq',
              id: id
            });
          }
        });
      }

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
  }

   // Initialize
  try {
    const helpContactIntermediate = new HelpContactIntermediate();
    window.helpPageController = helpContactIntermediate;

    // Initialize function to be called from Flutter
    window.initHelpPage = function (data) {
      let error = null;
      let isSuccess = false;
      try {
        helpContactIntermediate.init(data);
        isSuccess = true;
      } catch (err) {
        error = err.message;
      }
      
      helpContactIntermediate.postMessage('loadFinished', {
        error: error,
        success: isSuccess
      });
      
      return isSuccess;
    };

    // Send notification that JavaScript is loaded
    helpContactIntermediate.postMessage('javascriptLoaded', { success: true });

  } catch (error) {
    console.error('Failed to initialize help page:', error);
  }

})();

// initHelpPage({
//   "items": [
//     {
//       "id": 74,
//       "question": "Navicat Cloud could not connect and access your databases. By which it means, it could only store yo",
//       "view_count": 988
//     },
//     {
//       "id": 35,
//       "question": "There is no way to happiness. Happiness is the way. Navicat Data Modeler enables you to build high-q",
//       "view_count": 985
//     },
//     {
//       "id": 46,
//       "question": "Navicat Data Modeler enables you to build high-quality conceptual, logical and physical data models ",
//       "view_count": 974
//     },
//     {
//       "id": 60,
//       "question": "There is no way to happiness. Happiness is the way.",
//       "view_count": 965
//     }
//   ]
// })