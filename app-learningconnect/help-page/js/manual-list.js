(function() {
class HelpPageController {
  #data = null;
  #searchManager = null;
  #itemsPerPage = 5;
  #currentPage = 1; // Track current page for list pagination

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
   * @param {Object} data - Data structure containing screens and faqs
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
   * Appends more items for list pagination
   * @public
   */
  appendItems(newItems) {
    if (!this.#data?.items || !newItems?.items) return;

    const currentItems = this.#data.items;
    const newItemsArray = newItems.items;
    
    // Merge items
    this.#data.items = [...currentItems, ...newItemsArray];
    this.#data.pagination.page_count = newItems.pagination?.page_count || 
                                                       this.#data.pagination.page_count;
    this.#data.pagination.total_item_count = newItems.pagination?.total_item_count || 
                                                            this.#data.pagination.total_item_count;

    this.#currentPage++;
    this.render();
    this.#setupStaticEventListeners();
    
    // Remove loading state from load-more button
    this.removeLoadMoreButtonLoadingState();
  }

  /**
   * Updates data after resetSearch and re-renders the page
   * @public
   * @param {Object} data - New data structure from app
   */
  updateDataAfterReset(data) {
    try {
      this.#data = data;
      this.#currentPage = 1;

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
   * Renders the help page UI
   * @private
   */
  render() { 
    if (!this.#data) {
      console.warn('Data is not initialized. Call init() first.');
      return;
    }

    const app = document.getElementById("app");

    let itemsHtml = '';
    const hasMoreItems = this.#hasMoreItemsToLoad();
    
    if (this.#data.items && this.#data.items.length > 0) {
      itemsHtml = this.#data.items.map(item => `
        <div class="list-item" data-id="${item.id}" data-redirect="${item.help_redirect}">${item.title}</div>
      `).join("");
    }

    // Add load-more button if more items available
    const loadMoreHtml = hasMoreItems ? `
      <div class="load-more-container">
        <span class="load-more-btn" data-page="list">もっと見る</span>
      </div>
    ` : '';

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
        <div class="section-title fixed" style="top: 73px;">画面・機能名</div>
      </div>
      <div class="section">
        <div class="section-container">
          ${itemsHtml}
          ${loadMoreHtml}
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
    `

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
   * Sets up static event listeners (called only once)
   * @private
   */
  #setupStaticEventListeners() {
    // Search input
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      // Setup search input events through SearchManager
      this.#searchManager.setupSearchInputEvents({
        searchType: 'manual',
        onSearch: (params) => this.postMessage('search', params),
        updateSectionFooterPadding: () => this.#updateSectionFooterPadding()
      });
    }

    // Combined event delegation for list items and load-more button
    const sectionContainer = document.querySelector('.section-container');
    if (sectionContainer) {
      sectionContainer.addEventListener('click', (e) => {
        // Handle list item clicks
        const listItem = e.target.closest('.list-item');
        if (listItem) {
          const id = listItem.dataset.id;
          const redirect = listItem.dataset.redirect;

          this.postMessage('selectManual', {
            page: redirect,
            id
          });
          return;
        }

        // Handle load-more button clicks
        const loadMoreBtn = e.target.closest('.load-more-btn');
        if (loadMoreBtn) {
          // Add loading state
          loadMoreBtn.classList.add('loading');
          
          const nextPage = this.#currentPage + 1;
          
          console.log(`Loading page ${nextPage}...`, {
            page: nextPage,
            limit: this.#itemsPerPage
          });

          // Send loadMore message to Flutter
          this.postMessage('loadMore', {
            page: nextPage,
            limit: this.#itemsPerPage
          });
        }
      });
    }

    // Redirect page clicks
    document.querySelectorAll('.redirect-page').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        this.postMessage('redirectPage', {
          page
        });
      });
    });

    // Search results container with event delegation
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
            type: 'manual'
          });
          return;
        }

        // Handle search result items click
        const resultItem = e.target.closest('.search-result-item');
        if (resultItem) {
          const id = resultItem.dataset.id;
          console.log('Search result item clicked - id:', id);
          this.postMessage('selectManual', {
            type: 'manual',
            id: id
          });
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
   * Removes loading state from load-more button
   * @private
   */
  removeLoadMoreButtonLoadingState() {
    const sectionContainer = document.querySelector('.section-container');
    if (!sectionContainer) return;
    
    const loadMoreBtn = sectionContainer.querySelector('.load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.classList.remove('loading');
    }
  }

  /**
   * Check if there are more items to load
   * @private
   */
  #hasMoreItemsToLoad() {
    if (!this.#data?.pagination) return false;

    const pageCount = this.#data.pagination.page_count || 1;
    const totalItemCount = this.#data.pagination.total_item_count || 0;
    const currentLoadedItems = this.#data.items?.length || 0;

    // More items available if:
    // 1. Current page < total pages, OR
    // 2. Current loaded items < total items
    return (this.#currentPage < pageCount) || (currentLoadedItems < totalItemCount);
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
//   pagination: {
//     "page_count": 1,
//     "total_item_count": 12
//   },
//   items: [
//     {
//       id: 4,
//       title: '個人トレーナー',
//       help_redirect: 'daily_report',
//       cate: [1, 100, 6]
//     },
//     {
//       id: 8,
//       title: 'げいにん',
//       help_redirect: 'daily_report',
//       cate: [75]
//     },
//       {
//       id: 8,
//       title: 'げいにん',
//       help_redirect: 'daily_report',
//       cate: [75]
//     },
//       {
//       id: 8,
//       title: 'げいにん',
//       help_redirect: 'daily_report',
//       cate: [75]
//     },
//     {
//       id: 8,
//       title: 'げいにん',
//       help_redirect: 'daily_report',
//       cate: [75]
//     },
//         {
//       id: 8,
//       title: 'げいにん',
//       help_redirect: 'daily_report',
//       cate: [75]
//     },
//         {
//       id: 8,
//       title: 'げいにん',
//       help_redirect: 'daily_report',
//       cate: [75]
//     },
//         {
//       id: 8,
//       title: 'げいにん',
//       help_redirect: 'daily_report',
//       cate: [75]
//     },
//     {
//       id: 8,
//       title: 'げいにん',
//       help_redirect: 'daily_report',
//       cate: [75]
//     },
//      {
//       id: 8,
//       title: 'げいにん',
//       help_redirect: 'daily_report',
//       cate: [75]
//     }
//   ],
//   html: 'https://api.test.engibase.com/help-html/manual-list.html?is_mobile=1'
// })

