# Help Page Controller - Hướng dẫn Luồng Chạy

## 📋 Mục Lục
1. [Tổng Quan](#tổng-quan)
2. [Kiến Trúc](#kiến-trúc)
3. [Luồng Khởi Tạo](#luồng-khởi-tạo)
4. [Luồng Tìm Kiếm](#luồng-tìm-kiếm)
5. [API & Methods](#api--methods)
6. [PostMessage Communication](#postmessage-communication)
7. [Event Listeners](#event-listeners)

---

## 🎯 Tổng Quan

**HelpPageController** là một class JavaScript xử lý trang trợ giúp với các chức năng:
- ✅ Hiển thị Topics & FAQs
- ✅ Tìm kiếm với phân trang (10 items/page)
- ✅ Ghi tiếp dữ liệu khi load more
- ✅ Giao tiếp 2 chiều với Flutter App

---

## 🏗️ Kiến Trúc

### Private Properties
```javascript
#data              // Dữ liệu topics & faqs ban đầu
#searchResults     // Kết quả tìm kiếm hiện tại
#currentSearchPage // Trang tìm kiếm hiện tại (bắt đầu từ 1)
#itemsPerPage      // 10 items per page
#searchQuery       // Từ khóa tìm kiếm
```

### Public Methods
```javascript
init(data)                              // Khởi tạo với dữ liệu
setSearchResults(results)               // Set kết quả tìm kiếm
appendSearchResults(newResults)         // Append thêm kết quả
setData(newData)                        // Update dữ liệu
getData()                               // Lấy dữ liệu hiện tại
postMessage(fncName, msg)              // Gửi message tới Flutter
```

---

## 🚀 Luồng Khởi Tạo

### Bước 1: Load JavaScript
```javascript
// JavaScript loaded
helpPageController.postMessage('javascriptLoaded', { success: true });
```

### Bước 2: Flutter call `initHelpPage(data)`
```javascript
window.initHelpPage({
  topics: [
    { id: '1', title: 'Topic 1' },
    { id: '2', title: 'Topic 2' }
  ],
  faqs: [
    { id: '1', title: 'FAQ 1' },
    { id: '2', title: 'FAQ 2' }
  ]
});
```

### Bước 3: Render UI & Attach Events
```
initHelpPage(data)
  ↓
helpPageController.init(data)
  ↓
this.render()              // Hiển thị Topics, FAQs, Contact sections
  ↓
this.setupEventListeners() // Attach event listener cho các elements
  ↓
postMessage('loadFinished', { error: null, success: true })
```

### Dữ liệu nhận được từ Flutter
```javascript
{
  topics: [
    { id: string, title: string },
    ...
  ],
  faqs: [
    { id: string, title: string },
    ...
  ]
}
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
Ẩn tất cả .section (Topics, FAQs, Contact)
  ↓
postMessage('search', {
  query: 'keyword',
  page: 1
})
```

### Bước 2: Flutter xử lý & call API

```
App nhận postMessage('search', { query, page })
  ↓
Call backend API với query & page
  ↓
Get kết quả và trả về JS:
window.helpPageController.setSearchResults({
  items: [
    { id: '...', type: 'topic', title: '...' },
    { id: '...', type: 'faq', title: '...' }
  ],
  total: 105,
  pageCount: 11  // ceil(105 / 10)
})
```

### Bước 3: JavaScript render Search Results

```javascript
setSearchResults(results)
  ↓
this.renderSearchResults()  // Hiển thị 10 items + Load More button
  ↓
this.setupEventListeners()  // Attach event cho các items
```

### Kết quả tìm kiếm trả về từ App

```javascript
{
  items: [
    {
      id: string,
      type: 'topic' | 'faq',
      title: string
    },
    ...
  ],
  total: number,      // Tổng số kết quả
  pageCount: number   // Tổng số trang
}
```

### Bước 4: Click "もっと見る" (Load More)

```
User click [もっと見る (1/11)]
  ↓
search-load-more click event
  ↓
postMessage('loadMore', {
  query: 'keyword',
  page: 2
})
  ↓
Flutter call API page 2
  ↓
Return 10 items cho page 2
  ↓
JS call appendSearchResults(newResults)
  ↓
Append items + update UI
  ↓
Nếu còn trang → Show [もっと見る (2/11)]
  ↓
Nếu hết trang → Button biến mất
```

### Bước 5: Clear Search (Click dấu X)

```
User click X button (clear input)
  ↓
input event listener kích hoạt
  ↓
searchInput.value = "" (empty)
  ↓
Show all .section (Topics, FAQs, Contact)
  ↓
Clear searchResults container
```

---

## 📡 API & Methods

### `init(data)`
Khởi tạo controller với dữ liệu từ Flutter.

```javascript
const data = {
  topics: [ { id, title }, ... ],
  faqs: [ { id, title }, ... ]
};
helpPageController.init(data);
```

### `setSearchResults(results)`
Set kết quả tìm kiếm từ Flutter (page 1).

```javascript
window.helpPageController.setSearchResults({
  items: [ ... ],
  total: 105,
  pageCount: 11
});
```

**Lưu ý:** Tự động reset `#currentSearchPage = 1`

### `appendSearchResults(newResults)`
Append thêm items từ page tiếp theo.

```javascript
window.helpPageController.appendSearchResults({
  items: [ ... ],  // 10 items từ page 2
  pageCount: 11
});
```

**Lưu ý:** Auto increment `#currentSearchPage++`

### `setData(newData)`
Update toàn bộ dữ liệu topics & faqs.

```javascript
helpPageController.setData({
  topics: [ ... ],
  faqs: [ ... ]
});
```

### `getData()`
Lấy dữ liệu hiện tại.

```javascript
const data = helpPageController.getData();
```

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
**Gửi khi:** `initHelpPage()` hoàn tất  
**Mục đích:** Thông báo app UI khởi tạo xong

#### 3. Search
```javascript
postMessage('search', {
  query: 'keyword',
  page: 1
})
```
**Gửi khi:** User nhấn Enter hoặc click Load More  
**Mục đích:** Request app call API với query & page

#### 4. Select Topic / Select FAQ
```javascript
postMessage('selectTopic', {
  type: 'topic',
  id: 'topic-1',
  title: 'Topic Title'
})

postMessage('selectFaq', {
  type: 'faq',
  id: 'faq-1',
  title: 'FAQ Title'
})
```
**Gửi khi:** User click topic hoặc faq  
**Mục đích:** Navigate tới chi tiết topic/faq

### Messages từ Flutter → JavaScript

#### 1. Initialize
```javascript
window.initHelpPage({
  topics: [ { id, title }, ... ],
  faqs: [ { id, title }, ... ]
})
```

#### 2. Set Search Results
```javascript
window.helpPageController.setSearchResults({
  items: [ ... ],
  total: 105,
  pageCount: 11
})
```

#### 3. Append Search Results
```javascript
window.helpPageController.appendSearchResults({
  items: [ ... ],
  pageCount: 11
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
    // Show sections
    // Clear searchResults
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

#### 1. List Item / FAQ Item Click
```javascript
document.querySelectorAll('.list-item').forEach(item => {
  item.addEventListener('click', () => {
    postMessage('selectTopic', { ... });
  });
});
```

#### 2. Search Result Item Click
```javascript
document.querySelectorAll('.search-result-item').forEach(item => {
  item.addEventListener('click', () => {
    postMessage('selectTopic' | 'selectFaq', { ... });
  });
});
```

#### 3. Load More Button Click
```javascript
document.querySelectorAll('.search-load-more').forEach(btn => {
  btn.addEventListener('click', () => {
    postMessage('search', { query, page: nextPage });
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
│ Flutter send initHelpPage(data)                         │
│    ↓                                                    │
│ Render Topics, FAQs, Contact sections                  │
│    ↓                                                    │
│ postMessage('loadFinished', ...)                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   SEARCH FLOW                            │
├─────────────────────────────────────────────────────────┤
│ User type "keyword" + Enter                            │
│    ↓                                                    │
│ Hide all sections                                       │
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
│   • Click item → postMessage('selectTopic'|'selectFaq')│
│   • Click Load More → postMessage('search', page: 2)   │
│   • Click X → Show sections, clear results             │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing

### Test via Console

#### 1. Mock Search Results
```javascript
window.helpPageController.setSearchResults({
  items: [
    { id: '1', type: 'topic', title: 'Test Topic 1' },
    { id: '2', type: 'faq', title: 'Test FAQ 1' },
    { id: '3', type: 'topic', title: 'Test Topic 2' }
  ],
  total: 25,
  pageCount: 3
});
```

#### 2. Mock Append Results
```javascript
window.helpPageController.appendSearchResults({
  items: [
    { id: '4', type: 'faq', title: 'Test FAQ 2' },
    { id: '5', type: 'topic', title: 'Test Topic 3' }
  ],
  pageCount: 3
});
```

#### 3. Get Current Data
```javascript
console.log(window.helpPageController.getData());
```

---

## ⚙️ Configuration

### Items Per Page
```javascript
#itemsPerPage = 10  // Mỗi trang hiển thị 10 items
```

### Page Counter Display
```javascript
[もっと見る (1/11)]  // Format: (currentPage/pageCount)
```

---

## 🔗 File References

- **HTML:** `help-page/index.html` - Template container
- **CSS:** `help-page/css/styles.css` - Styling
- **JS:** `help-page/js/index.js` - Main controller

