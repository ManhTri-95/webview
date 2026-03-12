# HelpListFAQ Controller - Hướng dẫn Luồng Chạy

## 📋 Mục Lục
1. [Tổng Quan](#tổng-quan)
2. [Kiến Trúc](#kiến-trúc)
3. [Luồng Khởi Tạo](#luồng-khởi-tạo)
4. [Luồng Load More FAQs](#luồng-load-more-faqs)
5. [Luồng Tìm Kiếm](#luồng-tìm-kiếm)
6. [Luồng Reset Search](#luồng-reset-search)
7. [API & Methods](#api--methods)
8. [PostMessage Communication](#postmessage-communication)
9. [Event Listeners](#event-listeners)

---

## 🎯 Tổng Quan

**HelpListFAQ** là một class JavaScript xử lý trang FAQ list với các chức năng:
- ✅ Hiển thị FAQs phân theo categories
- ✅ Pagination theo category (5 items/page mặc định)
- ✅ Load more FAQs cho mỗi category
- ✅ Tìm kiếm với phân trang
- ✅ Ghi tiếp dữ liệu khi load more
- ✅ Reset search & update data mới
- ✅ Giao tiếp 2 chiều với Flutter App

---

## 🏗️ Kiến Trúc

### Private Properties
```javascript
#data                      // Dữ liệu categories & faqs ban đầu
#searchResults             // Kết quả tìm kiếm hiện tại
#currentSearchPage         // Trang tìm kiếm hiện tại (bắt đầu từ 1)
#searchQuery               // Từ khóa tìm kiếm
#categoryPagination        // Theo dõi pagination state cho mỗi category
                          // Ví dụ: { '1': { currentPage, currentLoaded, total }, ... }
#itemsPerPage              // 5 items per page (mặc định)
```

### Public Methods
```javascript
init(data)                                  // Khởi tạo với dữ liệu
setSearchResults(results)                   // Set kết quả tìm kiếm
appendSearchResults(newResults)             // Append thêm kết quả
addMoreFAQsForCategory(categoryId, newFaqs) // Thêm FAQs cho category cụ thể
updateDataAfterReset(data)                  // Update dữ liệu sau reset search
postMessage(fncName, msg)                   // Gửi message tới Flutter
```

---

## 🚀 Luồng Khởi Tạo

### Bước 1: Load JavaScript
```javascript
// JavaScript loaded
helpListFAQ.postMessage('javascriptLoaded', { success: true });
```

### Bước 2: Flutter call `initializeHelpListFAQ(data)`
```javascript
window.initializeHelpListFAQ({
  data: [
    {
      id: '1',
      category: 'Category 1',
      total: 11,           // Tổng số FAQs (từ backend)
      faqs: [
        { id: '1-1', title: 'FAQ 1' },
        { id: '1-2', title: 'FAQ 2' },
        // ... max 5 items trong initial data
      ]
    },
    {
      id: '2',
      category: 'Category 2',
      total: 8,
      faqs: [ ... ]
    }
  ]
});
```

### Bước 3: Render UI & Initialize Pagination
```
initializeHelpListFAQ(data)
  ↓
helpListFAQ.init(data)
  ↓
Initialize #categoryPagination:
  {
    '1': { currentPage: 1, currentLoaded: 5, total: 11 },
    '2': { currentPage: 1, currentLoaded: 5, total: 8 }
  }
  ↓
this.render()              // Hiển thị categories + 5 FAQs/category + Load More button (nếu cần)
  ↓
this.setupEventListeners() // Attach event listener cho various elements
  ↓
postMessage('loadFinished', { error: null, success: true })
```

### Dữ liệu nhận được từ Flutter
```javascript
{
  data: [
    {
      id: string,
      category: string,
      total: number,        // Tổng số FAQs có sẵn
      faqs: [
        { id: string, title: string },
        ...
      ]
    },
    ...
  ]
}
```

---

## 📋 Luồng Load More FAQs

### Bước 1: User click "もっと見る" button

```
User click [もっと見る] (for Category 1)
  ↓
load-more-btn click event listener
  ↓
Get categoryId từ data-category-id attribute
  ↓
Get pagination state: { currentPage: 1, currentLoaded: 5, total: 11 }
  ↓
Calculate nextPage = 2
  ↓
postMessage('loadMoreFAQs', {
  categoryId: '1',
  page: 2,
  offset: 5         // Số items đã load
})
```

### Bước 2: Flutter xử lý & call API

```
App nhận postMessage('loadMoreFAQs', { categoryId, page, offset })
  ↓
Call backend API với categoryId, page, offset
  ↓
Get 5 items từ page 2 và trả về JS:
window.helpListFAQ.addMoreFAQsForCategory('1', [
  { id: '1-6', title: 'FAQ 6' },
  { id: '1-7', title: 'FAQ 7' },
  { id: '1-8', title: 'FAQ 8' },
  { id: '1-9', title: 'FAQ 9' },
  { id: '1-10', title: 'FAQ 10' }
])
```

### Bước 3: JavaScript xử lý & render

```javascript
addMoreFAQsForCategory(categoryId, newFaqs)
  ↓
Thêm newFaqs vào categoryItem.faqs array
  ↓
Update pagination: 
  {
    currentPage: 2,
    currentLoaded: 10,    // 5 + 5 items mới
    total: 11
  }
  ↓
this.renderCategorySection('1')
  ↓
Hiển thị 5 items mới (từ index 5 đến 9)
  ↓
Kiểm tra nếu còn items → Show Load More button
  ↓
Nếu hết items (10 >= 11) → Xóa Load More button
```

---

## 🔍 Luồng Tìm Kiếm

### Bước 1: User nhập text & nhấn Enter

```
User type "keyword" + Enter
  ↓
input event listener kích hoạt (keydown)
  ↓
Validate query khác rỗng
  ↓
Ẩn tất cả .section (Categories, Contact)
  ↓
postMessage('search', {
  query: 'keyword',
  page: 1
})
  ↓
Reset #currentSearchPage = 1
```

### Bước 2: Flutter xử lý & call API

```
App nhận postMessage('search', { query, page })
  ↓
Call backend API với query & page
  ↓
Get kết quả và trả về JS:
window.helpListFAQ.setSearchResults({
  items: [
    { id: '...', type: 'topic', title: '...' },
    { id: '...', type: 'faq', title: '...' }
  ],
  total: 25,
  pageCount: 3  // ceil(25 / 10) - 10 items per search page
})
```

### Bước 3: JavaScript render Search Results

```javascript
setSearchResults(results)
  ↓
this.renderSearchResults()  // Hiển thị 10 items + Load More button (nếu còn trang)
  ↓
this.setupEventListeners()  // Attach event cho các items
```

### Bước 4: Click "もっと見る" (Load More in Search)

```
User click [もっと見る (1/3)]
  ↓
search-load-more click event
  ↓
postMessage('loadMoreFAQs', {
  categoryId: undefined,
  page: 2,
  offset: 10
})
  ↓
Flutter call API page 2
  ↓
Return 10 items cho page 2
  ↓
JS call appendSearchResults(newResults)
  ↓
Append items + update #currentSearchPage
  ↓
Nếu còn trang → Show [もっと見る (2/3)]
  ↓
Nếu hết trang → Button biến mất
```

---

## 🔄 Luồng Reset Search

### Bước 1: User xóa search query (Click dấu X)

```
User click X button (clear input)
  ↓
input event listener kích hoạt
  ↓
searchInput.value = "" (empty)
  ↓
Clear searchResults container
  ↓
postMessage('resetSearch', {})
```

### Bước 2: Flutter fetch dữ liệu mới & return

```
App nhận postMessage('resetSearch', {})
  ↓
Call API để fetch dữ liệu mới (hoặc từ cache)
  ↓
Return:
window.helpListFAQ.updateDataAfterReset({
  data: [...] // Updated categories & FAQs
})
```

### Bước 3: JavaScript update & re-render

```javascript
updateDataAfterReset(data)
  ↓
Update #data = data
  ↓
Reset #categoryPagination cho tất cả categories
  ↓
Reset #searchResults = null
  ↓
Reset #currentSearchPage = 1
  ↓
Reset #searchQuery = ''
  ↓
Clear search input
  ↓
this.render()              // Re-render categories sections
  ↓
this.setupEventListeners() // Setup event listeners lại
```

---

## 📡 API & Methods

### `init(data)`
Khởi tạo controller với dữ liệu từ Flutter.

```javascript
const data = {
  data: [
    { id, category, total, faqs: [{id, title}, ...] },
    ...
  ]
};
helpListFAQ.init(data);
```

### `setSearchResults(results)`
Set kết quả tìm kiếm từ Flutter (page 1).

```javascript
window.helpListFAQ.setSearchResults({
  items: [
    { id: '...', type: 'topic' | 'faq', title: '...' },
    ...
  ],
  total: 25,
  pageCount: 3
});
```

**Lưu ý:** Tự động reset `#currentSearchPage = 1`

### `appendSearchResults(newResults)`
Append thêm items từ page tiếp theo trong search results.

```javascript
window.helpListFAQ.appendSearchResults({
  items: [ ... ],  // 10 items từ page tiếp theo
  pageCount: 3
});
```

**Lưu ý:** Auto increment `#currentSearchPage++`

### `addMoreFAQsForCategory(categoryId, newFaqs)`
Thêm FAQs mới cho category cụ thể & re-render category section.

```javascript
window.helpListFAQ.addMoreFAQsForCategory('1', [
  { id: '1-6', title: 'FAQ 6' },
  { id: '1-7', title: 'FAQ 7' },
  // ...
]);
```

**Lưu ý:** 
- Cập nhật `categoryItem.faqs` array
- Update pagination state cho category
- Re-render chỉ category section (không re-render toàn bộ trang)

### `updateDataAfterReset(data)`
Update toàn bộ dữ liệu & reset search state.

```javascript
window.helpListFAQ.updateDataAfterReset({
  data: [
    { id, category, total, faqs: [{id, title}, ...] },
    ...
  ]
});
```

**Lưu ý:** 
- Reset #categoryPagination
- Reset search state (results, query, page)
- Clear search input
- Re-render toàn bộ trang

---

## 💬 PostMessage Communication

### Messages từ JavaScript → Flutter

#### 1. JavaScript Loaded
```javascript
postMessage('javascriptLoaded', { success: true })
```
**Gửi khi:** File JS load xong  
**Mục đích:** Thông báo app JS đã sẵn sàng

#### 2. Load Finished
```javascript
postMessage('loadFinished', {
  error: null,
  success: true
})
```
**Gửi khi:** `initializeHelpListFAQ()` hoàn tất  
**Mục đích:** Thông báo app UI khởi tạo xong

#### 3. Search
```javascript
postMessage('search', {
  query: 'keyword',
  page: 1
})
```
**Gửi khi:** User nhấn Enter hoặc click Load More trong search  
**Mục đích:** Request app call API với query & page

#### 4. Load More FAQs
```javascript
postMessage('loadMoreFAQs', {
  categoryId: '1',      // category ID (undefined nếu trong search results)
  page: 2,
  offset: 5             // Số items đã load
})
```
**Gửi khi:** User click "もっと見る" button  
**Mục đích:** Request app call API để fetch FAQs tiếp theo

#### 5. Reset Search
```javascript
postMessage('resetSearch', {})
```
**Gửi khi:** User xóa hết search query (click X button)  
**Mục đích:** Request app fetch dữ liệu mới để update UI

### Messages từ Flutter → JavaScript

#### 1. Initialize
```javascript
window.initializeHelpListFAQ({
  data: [
    { id, category, total, faqs: [{id, title}, ...] },
    ...
  ]
})
```

#### 2. Set Search Results
```javascript
window.helpListFAQ.setSearchResults({
  items: [
    { id: '...', type: 'topic' | 'faq', title: '...' },
    ...
  ],
  total: 25,
  pageCount: 3
})
```

#### 3. Append Search Results
```javascript
window.helpListFAQ.appendSearchResults({
  items: [ ... ],
  pageCount: 3
})
```

#### 4. Add More FAQs For Category
```javascript
window.helpListFAQ.addMoreFAQsForCategory('1', [
  { id: '1-6', title: '...' },
  { id: '1-7', title: '...' },
  ...
])
```

#### 5. Update Data After Reset
```javascript
window.helpListFAQ.updateDataAfterReset({
  data: [
    { id, category, total, faqs: [{id, title}, ...] },
    ...
  ]
})
```

---

## 👂 Event Listeners

### Search Input Events

#### 1. `input` Event (Typing / Clear button)
```javascript
searchInput.addEventListener('input', (e) => {
  // Trigger khi:
  // - User type character
  // - User click X button (clear)
  
  if (!query) {
    // Clear search results
    // postMessage('resetSearch')
  }
});
```

#### 2. `keydown` Event (Enter key)
```javascript
searchInput.addEventListener('keydown', (e) => {
  if (e.key === "Enter") {
    // Hide sections
    // postMessage('search')
  }
});
```

### Click Events

#### 1. Load More Button Click (Category)
```javascript
document.querySelectorAll('.load-more-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    postMessage('loadMoreFAQs', {
      categoryId: btn.data-category-id,
      page: nextPage,
      offset: currentLoaded
    });
  });
});
```

#### 2. Search Result Item Click
```javascript
document.querySelectorAll('.search-result-item').forEach(item => {
  item.addEventListener('click', () => {
    const type = item.dataset.type;  // 'topic' or 'faq'
    // Navigate to detail page
  });
});
```

#### 3. FAQ Item Click
```javascript
document.querySelectorAll('.faq-item').forEach(item => {
  item.addEventListener('click', () => {
    // Navigate to FAQ detail
  });
});
```

---

## 📊 Workflow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   APP INITIALIZATION                     │
├─────────────────────────────────────────────────────────┤
│ JavaScript Load                                         │
│    ↓                                                    │
│ postMessage('javascriptLoaded', ...)                   │
│    ↓                                                    │
│ Flutter send initializeHelpListFAQ(data)               │
│    ↓                                                    │
│ Initialize #categoryPagination for each category       │
│    ↓ (currentPage: 1, currentLoaded: 5, total: X)     │
│ Render categories + 5 FAQs + Load More buttons         │
│    ↓                                                    │
│ postMessage('loadFinished', ...)                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              LOAD MORE FAQS FLOW (Per Category)         │
├─────────────────────────────────────────────────────────┤
│ User click [もっと見る] (Category 1)                    │
│    ↓                                                    │
│ postMessage('loadMoreFAQs',                            │
│   { categoryId: '1', page: 2, offset: 5 })             │
│    ↓                                                    │
│ Flutter: Call API with categoryId & page               │
│    ↓                                                    │
│ Return: 5 new FAQs                                      │
│    ↓                                                    │
│ JS: addMoreFAQsForCategory('1', newFaqs)              │
│    ↓                                                    │
│ Update pagination: currentLoaded: 10, currentPage: 2   │
│    ↓                                                    │
│ Render 5 new items for Category 1                      │
│    ↓                                                    │
│ Check: 10 < 11 (total) → Show Load More button         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  SEARCH FLOW                            │
├─────────────────────────────────────────────────────────┤
│ User type "keyword" + Enter                            │
│    ↓                                                    │
│ postMessage('search', { query, page: 1 })              │
│    ↓                                                    │
│ Flutter: Call API with query & page                    │
│    ↓                                                    │
│ Return: { items: [...], total, pageCount }            │
│    ↓                                                    │
│ JS: setSearchResults(data)                            │
│    ↓                                                    │
│ Render 10 items + Load More button                     │
│    ↓                                                    │
│ User interact:                                          │
│   • Click item → Navigate to detail                    │
│   • Click Load More → postMessage('loadMoreFAQs')      │
│                       append new items                  │
│   • Click X → postMessage('resetSearch')               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                RESET SEARCH FLOW                        │
├─────────────────────────────────────────────────────────┤
│ User click X (clear search)                            │
│    ↓                                                    │
│ postMessage('resetSearch', {})                         │
│    ↓                                                    │
│ Flutter: Fetch fresh data (API or cache)               │
│    ↓                                                    │
│ Return: updateDataAfterReset(newData)                  │
│    ↓                                                    │
│ JS: Reset all search state & pagination                │
│    ↓                                                    │
│ Re-render categories with fresh data                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing

### Test via Console

#### 1. Mock Search Results
```javascript
window.helpListFAQ.setSearchResults({
  items: [
    { id: '1', type: 'topic', title: 'Test Topic 1' },
    { id: '2', type: 'faq', title: 'Test FAQ 1' },
    { id: '3', type: 'faq', title: 'Test FAQ 2' }
  ],
  total: 25,
  pageCount: 3
});
```

#### 2. Mock Append Search Results
```javascript
window.helpListFAQ.appendSearchResults({
  items: [
    { id: '4', type: 'faq', title: 'Test FAQ 3' },
    { id: '5', type: 'topic', title: 'Test Topic 2' }
  ],
  pageCount: 3
});
```

#### 3. Mock Add More FAQs
```javascript
window.helpListFAQ.addMoreFAQsForCategory('1', [
  { id: '1-6', title: 'FAQ 6' },
  { id: '1-7', title: 'FAQ 7' },
  { id: '1-8', title: 'FAQ 8' },
  { id: '1-9', title: 'FAQ 9' },
  { id: '1-10', title: 'FAQ 10' }
]);
```

#### 4. Mock Update Data After Reset
```javascript
window.helpListFAQ.updateDataAfterReset({
  data: [
    {
      id: '1',
      category: 'New Category 1',
      total: 20,
      faqs: [
        { id: '1-1', title: 'New FAQ 1' },
        { id: '1-2', title: 'New FAQ 2' },
        // ...
      ]
    }
  ]
});
```

---

## ⚙️ Configuration

### Items Per Page
```javascript
#itemsPerPage = 5  // Mỗi category hiển thị 5 items ban đầu
```

### Search Page Configuration
```javascript
// Search results: 10 items per page (mặc định)
// Tính từ backend response
```

---

## 🔗 File References

- **HTML:** `help-page/help-faq-list.html` - FAQ list template
- **CSS:** `help-page/css/styles.css` - Styling
- **JS:** `help-page/js/faq-list.js` - Main controller
- **Doc:** `help-page/docs/help-faq-list-doc.md` - Documentation (file này)
