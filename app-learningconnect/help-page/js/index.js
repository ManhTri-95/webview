(function() {
  class HelpPageController {
    #data = null;
    #searchResults = null;
    #currentSearchPage = 1;
    #itemsPerPage = 10;
    #searchQuery = '';

    constructor() {
      // Initialize without data - will be set via init() method
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
        this.setupEventListeners();
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

        <div id="searchResults" class="search-results"></div>

        <div class="section">
          <div class="section-title">ヘルプページトピック</div>
          <div class="section-container">
            ${this.#data.topics.map(item => `
              <div class="list-item" data-id="${item.id}" data-type="topic">${item.title}</div>
            `).join("")}
          </div>
        </div>

        <div class="section">
          <div class="section-title">よくある質問</div>
          <div class="section-container">
            ${this.#data.faqs.map(item => `
              <div class="faq-item" data-id="${item.id}" data-type="faq">${item.title}</div>
            `).join("")}
            <div class="view-all redirect-page" data-page="FAQ_list">[すべてのFAQを見る]</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">解決しない場合</div>
          <div class="section-container">
            <div class="contact-text">
              解決しない場合はこちらからお問い合わせください。
            </div>
            <div class="view-all redirect-page" data-page="inquiry_send">[お問い合わせする]</div>
          </div>
        </div>
      `;
    }

    /**
     * Renders search results
     * @private
     */
    renderSearchResults() {
      if (!this.#searchResults || !this.#searchResults.items) {
        return;
      }

      const resultsContainer = document.getElementById("searchResults");
      if (!resultsContainer) return;

      const items = this.#searchResults.items || [];
      const totalItems = this.#searchResults.total || 0;
      const pageCount = this.#searchResults.pageCount || 1;

      if (items.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">検索結果が見つかりません</div>';
        return;
      }

      let html = '<div class="section-container">';
      
      items.forEach(item => {
        const icon = item.type === 'topic' ? '📌' : '❓';
        html += `
          <div class="search-result-item" data-id="${item.id}" data-type="${item.type}">
            <span class="result-icon">${icon}</span>
            <div class="result-content">
              <div class="result-type">
                ${item.type === 'topic' ? 'トピック' : 'FAQ'}
              </div>
              <div class="result-title">${item.title}</div>
            </div>
          </div>
        `;
      });

      // Add "load more" button if not last page
      if (pageCount > this.#currentSearchPage) {
        html += `
          <div class="view-all search-load-more" data-page="${this.#currentSearchPage + 1}">
            [もっと見る (${this.#currentSearchPage}/${pageCount})]
          </div>
        `;
      }

      html += '</div>';
      resultsContainer.innerHTML = html;
    }

    /**
     * Appends more search results
     * @public
     */
    appendSearchResults(newResults) {
      if (!this.#searchResults) return;

      if (newResults.items) {
        this.#searchResults.items = [...this.#searchResults.items, ...newResults.items];
        this.#searchResults.pageCount = newResults.pageCount || this.#searchResults.pageCount;
        this.#currentSearchPage++;
      }

      this.renderSearchResults();
      this.setupEventListeners();
    }

    /**
     * Sets search results
     * @public
     */
    setSearchResults(results) {
      this.#searchResults = results;
      this.#currentSearchPage = 1;
      this.renderSearchResults();
      this.setupEventListeners();
    }

    /**
     * Sets up event listeners
     * @private
     */
    setupEventListeners() {
      // List item clicks
      document.querySelectorAll('.list-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = item.dataset.id;
          const title = item.textContent;
          this.postMessage('selectTopic', {
            type: 'topic',
            id: id,
            //title: title
          });
        });
      });

      // FAQ item clicks
      document.querySelectorAll('.faq-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = item.dataset.id;
          const title = item.textContent;
          this.postMessage('selectFaq', {
            type: 'faq',
            id: id,
            //title: title
          });
        });
      });

      // Search input
      const searchInput = document.getElementById("searchInput");
      if (searchInput) {
        // Handle input event (triggers on typing and when clicking clear button)
        searchInput.addEventListener('input', (e) => {
          const query = searchInput.value.trim();
          if (!query) {
            // Show all sections if search is cleared
            document.querySelectorAll('.section').forEach(section => {
              section.style.display = '';
            });
            // Clear search results
            document.getElementById("searchResults").innerHTML = '';
          }
        });

        // Handle Enter key for search
        searchInput.addEventListener('keydown', (e) => {
          if (e.key === "Enter") {
            const query = searchInput.value.trim();
            if (query) {
              this.#searchQuery = query;
              this.#currentSearchPage = 1;

              // Hide all sections when searching
              document.querySelectorAll('.section').forEach(section => {
                section.style.display = 'none';
              });

              console.log('query :', {
                query: query,
                page: 1
              });
              this.postMessage('search', {
                query: query,
                page: 1
              });

            }
          }
        });
      }

      // Search results - load more button
      document.querySelectorAll('.search-load-more').forEach(btn => {
        btn.addEventListener('click', () => {
          const page = parseInt(btn.dataset.page);
    
          this.postMessage('loadMore', {
            query: this.#searchQuery,
            page: page
          });
        });
      });

      // Search result items click
      document.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = item.dataset.id;
          const type = item.dataset.type;
          const title = item.querySelector('.result-title').textContent;
          
          const messageName = type === 'topic' ? 'selectTopic' : 'selectFaq';
          this.postMessage(messageName, {
            type: type,
            id: id,
            title: title
          });
        });
      });


      // Redirect page clicks
      document.querySelectorAll('.redirect-page').forEach(item => {
        item.addEventListener('click', () => {
          const page = item.dataset.page;

          this.postMessage('redirectPage', {
            page: page
          });
        });
      });
    }

    /**
     * Updates data with new structure
     * @public
     */
    setData(newData) {
      this.#data = newData;
      this.render();
      this.setupEventListeners();
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

  initHelpPage({
    topics: [
      { id: '1', title: 'トピック1' },
      { id: '2', title: 'トピック2' },  
      { id: '3', title: 'トピック3' }
    ],
    faqs: [ 
      { id: '1', title: 'FAQ 1' },
      { id: '2', title: 'FAQ 2' },
      { id: '3', title: 'FAQ 3' }
    ] 
  })
})();