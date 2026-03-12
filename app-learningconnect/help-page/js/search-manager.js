/**
 * SearchManager - Centralized search functionality handler
 * Manages search state and infinite scroll for help pages
 */
class SearchManager {
  #searchResults = null;
  #currentSearchPage = 1;
  #isFallback = false;
  #zeroMessage = null;
  #postMessage = null;
  #renderCallback = null;
  #itemsPerPage = 10;
  #searchQuery = '';

  /**
   * Initialize SearchManager
   * @param {Object} config - Configuration object
   * @param {Function} config.postMessage - Function to send messages to Flutter
   * @param {Function} config.renderCallback - Function to render search results
   * @param {number} config.itemsPerPage - Items per page (default 10)
   */
  constructor(config = {}) {
    this.#postMessage = config.postMessage || (() => {});
    this.#renderCallback = config.renderCallback || (() => {});
    this.#itemsPerPage = config.itemsPerPage || 10;
  }

  /**
   * Sets or appends search results
   * @public
   * @param {Object} results - Search results (can have type: 'faq' or 'manual')
   * @param {number} page - Page number (default 1). If page === 1, resets and sets new results. If page > 1, appends results.
   */
  setSearchResults(results, page = 1) {
    console.log('Setting search results - page:', page, 'results:', results);
    
    // Normalize results based on type
    let normalizedResults = results;
    
    // Check if results has a type property and extract the data structure
    if (results.type === 'faq' && results.faq) {
      normalizedResults = results.faq;
      normalizedResults.type = results.type;
      normalizedResults.zero_result = results.zero_result;
      normalizedResults.zero_msg = results.zero_msg;
      normalizedResults.fallback = results.faq.fallback;
    } else if (results.type === 'manual' && results.manual) {
      normalizedResults = results.manual;
      normalizedResults.type = results.type;
      normalizedResults.zero_result = results.zero_result;
      normalizedResults.zero_msg = results.zero_msg;
      normalizedResults.fallback = results.manual.fallback;
    }
    
    // If page === 1, reset and set new results
    if (page === 1) {
      this.#searchResults = normalizedResults;
      this.#currentSearchPage = 1;
      console.log('Search results reset and set:', normalizedResults);
    } else {
      // If page > 1, append results
      if (!this.#searchResults) return;

      // Normalize newResults based on type
      let normalizedNewResults = results;
      
      if (results.type === 'faq' && results.faq) {
        normalizedNewResults = results.faq;
      } else if (results.type === 'manual' && results.manual) {
        normalizedNewResults = results.manual;
      }

      // Handle both data structures:
      // faq-list/manual: items directly in results
      // index: items in results.faq.items
      const currentItems = this.#searchResults.faq?.items || this.#searchResults.items || [];
      const newItems = normalizedNewResults.faq?.items || normalizedNewResults.items || [];

      if (newItems.length === 0) return;

      // Merge items based on structure
      if (this.#searchResults.faq) {
        // index.js structure
        this.#searchResults.faq.items = [...currentItems, ...newItems];
        if (normalizedNewResults.faq?.pagination) {
          this.#searchResults.faq.pagination = normalizedNewResults.faq.pagination;
        }
      } else {
        // faq-list.js / manual structure
        this.#searchResults.items = [...currentItems, ...newItems];
        if (normalizedNewResults.pagination) {
          this.#searchResults.pagination = normalizedNewResults.pagination;
        }
      }

      this.#currentSearchPage = page;
      console.log('Search results appended, page:', this.#currentSearchPage);
    }
    
    // Check if this is a fallback (no results) case
    this.#isFallback = normalizedResults?.fallback || normalizedResults?.zero_result || false;
    this.#zeroMessage = normalizedResults?.zero_msg || null;
    
    console.log('Fallback mode:', this.#isFallback, 'Message:', this.#zeroMessage);
    
    // Call render callback
    this.#renderCallback();
  }

  /**
   * Check if there are more items to load
   * @public
   */
  hasMoreItemsToLoad() {
    // Handle both data structures
    const pagination = this.#searchResults?.faq?.pagination || this.#searchResults?.pagination;
    if (!pagination) return false;

    const pageCount = pagination.page_count || 1;
    const totalItemCount = pagination.total_item_count || 0;
    
    // Get items based on structure
    const currentLoadedItems = this.#searchResults?.faq?.items?.length || this.#searchResults?.items?.length || 0;

    // More items available if:
    // 1. Current page < total pages, OR
    // 2. Current loaded items < total items
    return (this.#currentSearchPage < pageCount) || (currentLoadedItems < totalItemCount);
  }

  /**
   * Gets current search state
   * @public
   */
  getState() {
    return {
      searchResults: this.#searchResults,
      currentSearchPage: this.#currentSearchPage,
      isFallback: this.#isFallback,
      zeroMessage: this.#zeroMessage,
      items: this.#searchResults?.faq?.items || this.#searchResults?.items || [],
      pagination: this.#searchResults?.faq?.pagination || this.#searchResults?.pagination,
      searchQuery: this.#searchQuery
    };
  }

  /**
   * Sets search query
   * @public
   */
  setSearchQuery(query) {
    this.#searchQuery = query;
  }

  /**
   * Resets search state
   * @public
   */
  reset() {
    this.#searchResults = null;
    this.#currentSearchPage = 1;
    this.#isFallback = false;
    this.#zeroMessage = null;
    this.#searchQuery = '';
  }

  /**
   * Gets current search page
   * @public
   */
  getCurrentSearchPage() {
    return this.#currentSearchPage;
  }

  /**
   * Gets search query
   * @public
   */
  getSearchQuery() {
    return this.#searchQuery;
  }

  /**
   * Gets items per page
   * @public
   */
  getItemsPerPage() {
    return this.#itemsPerPage;
  }

  /**
   * Gets fallback status
   * @public
   */
  isFallbackMode() {
    return this.#isFallback;
  }

  /**
   * Gets zero message
   * @public
   */
  getZeroMessage() {
    return this.#zeroMessage;
  }

  /**
   * Gets items from search results
   * @public
   */
  getItems() {
    return this.#searchResults?.faq?.items || this.#searchResults?.items || [];
  }

  /**
   * Gets pagination info
   * @public
   */
  getPagination() {
    return this.#searchResults?.faq?.pagination || this.#searchResults?.pagination;
  }

  /**
   * Post message to Flutter
   * @public
   */
  postMessageToFlutter(fncName, msg) {
    this.#postMessage(fncName, msg);
  }

  /**
   * Setup search input event listeners (keydown, blur, focus)
   * @public
   * @param {Object} config - Configuration object
   * @param {string} config.searchType - Type of search ('manual' or 'faq')
   * @param {Function} config.onSearch - Callback when search is triggered
   * @param {Function} config.onSearchStart - Optional callback triggered before search query submission
   * @param {Function} config.onFooterPositionChange - Optional callback for footer position changes (blur/focus)
   * @param {Function} config.updateSectionFooterPadding - Optional callback to update footer padding
   */
  setupSearchInputEvents(config = {}) {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    const searchType = config.searchType || 'manual';
    const onSearch = config.onSearch || (() => {});
    const onSearchStart = config.onSearchStart || (() => {});
    const onFooterPositionChange = config.onFooterPositionChange || (() => {});
    const updateSectionFooterPadding = config.updateSectionFooterPadding || (() => {});

    // Handle Enter key for search
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        
        // Only allow search if query is not empty
        if (query && query.length > 0) {
          // Call onSearchStart callback
          onSearchStart();

          // Reset search state for new search (ensures currentSearchPage is 1 and old results are cleared)
          this.reset();

          this.setSearchQuery(query);

          // Hide all sections except footer when searching
          document.querySelectorAll('.section:not(.section-footer)').forEach(section => {
            section.style.display = 'none';
          });

          // Call onSearch callback with search parameters
          onSearch({
            query: query,
            page: 1,
            type: searchType,
            limit: this.#itemsPerPage
          });
        } else {
          onSearch({ query: '' });
        }

        searchInput.blur();
      }
    });

    // Handle blur event - fix footer position
    searchInput.addEventListener('blur', (e) => {
      const sectionFooter = document.querySelector('.section-footer');
      if (sectionFooter) {
        sectionFooter.style.position = 'fixed';
        updateSectionFooterPadding();
        onFooterPositionChange('fixed');
      }
    });

    // Handle focus event - make footer relative
    searchInput.addEventListener('focus', (e) => {
      const sectionFooter = document.querySelector('.section-footer');
      const app = document.getElementById('app');
      if (sectionFooter) {
        sectionFooter.style.position = 'relative';
        if (app) {
          app.style.paddingBottom = '0';
        }
        onFooterPositionChange('relative');
      }
    });
  }

  /**
   * Renders search results HTML
   * @public
   * @returns {string} HTML string for search results
   */
  renderSearchResultsHTML() {
    // Get state
    const items = this.#searchResults?.faq?.items || this.#searchResults?.items || [];
    const pagination = this.#searchResults?.faq?.pagination || this.#searchResults?.pagination;
    const type = this.#searchResults?.type || 'faq';
    const classTitle = type === 'faq' ? '' : 'text-green';
    const pageCount = pagination?.page_count || 1;
    const totalItemCount = pagination?.total_item_count || items.length;

    // Handle fallback case (zero results)
    if (this.#isFallback) {
      let html = `
        <div class="section-title">検索結果</div>
         <div class="section-container">`;
      
      // Show zero message
      if (this.#zeroMessage) {
        html += `
          <div class="zero-message" style="padding: 20px; text-align: center;">${this.#zeroMessage}</div>
        </div>`;
      }

      // Show recommended section title
      html += `
        <div class="section-title">おすすめのヘルプ</div>
        <div class="section-container">`;
      
      // Show recommended items
      if (items.length === 0) {
        html += '<div class="no-recommended" style="padding: 20px; text-align: center;">おすすめのFAQがありません</div>';
      } else {
        items.forEach(item => {
          const displayText = item.title || item.question || '';
          html += `
            <div class="search-result-item" data-id="${item.id || ''}" data-type="${type}" style="border-bottom: 1px solid #f0f0f0;">
              <div class="result-content">
                <div class="result-title ${classTitle}">${displayText}</div>
              </div>
            </div>
          `;
        });
      }

      html += '</div>';
      return html;
    }

    // Handle normal search results
    if (items.length === 0) {
      return '<div class="no-results">検索結果が見つかりません</div>';
    }

    let html = `
      <div class="section-title">検索結果</div>
      <div class="section-container">`;
    
    items.forEach(item => {
      // Handle both 'title' and 'question' fields
      const displayText = item.title || item.question || '';
      
      html += `
        <div class="search-result-item" data-id="${item.id || ''}" data-redirect="${item.help_redirect || ''}" data-type="${type}">
          <div class="result-content">
            <div class="result-title ${classTitle}">${displayText}</div>
          </div>
        </div>
      `;
    });

    // Add load-more button if more items available
    if (this.hasMoreItemsToLoad()) {
      html += `
        <div class="load-more-container">
          <span class="load-more-btn" data-page="search">もっと見る</span>
        </div>
      `;
    } else if (totalItemCount > 0) {
      // Show "end of results" message
      html += `
        <div class="end-of-results" style="padding: 20px; text-align: center; color: #aaa; font-size: 14px;">
          すべての結果を表示しました (${items.length}/${totalItemCount})
        </div>
      `;
    }

    html += '</div>';
    return html;
  }
}
