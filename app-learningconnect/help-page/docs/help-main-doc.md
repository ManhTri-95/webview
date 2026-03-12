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
- ✅ Hiển thị HELP & FAQ
- ✅ Tìm kiếm với phân trang (10 items/page)
- ✅ Ghi tiếp dữ liệu khi load more
- ✅ Giao tiếp 2 chiều với Flutter App

---

## 🏗️ Kiến Trúc

### Private Properties
```javascript
#data              // Dữ liệu HELP & FAQ ban đầu
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
updateDataAfterReset(data)              // Update dữ liệu sau reset search
postMessage(fncName, msg)               // Gửi message tới Flutter
```

**Lưu ý:** 
- Method `render()` sẽ kiểm tra liệu element `#app` có tồn tại trong DOM trước khi render
- Render sẽ hiển thị HELP items (với help_redirect) và FAQ items (với id)

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
  help: [
    { title: 'ログインできない場合', help_redirect: 'daily_report' },
    { title: 'パスワードを変更する方法', help_redirect: 'development' }
  ],
  faq: [
    { id: 5, title: 'FAQ 1' },
    { id: 94, title: 'FAQ 2' }
  ]
});
```

### Bước 3: Render UI & Attach Events
```
initHelpPage(data)
  ↓
helpPageController.init(data)
  ↓
this.render()              // Hiển thị HELP, FAQ, Contact sections
  ↓
this.setupEventListeners() // Attach event listener cho các elements
  ↓
postMessage('loadFinished', { error: null, success: true })
```

### Dữ liệu nhận được từ Flutter
```javascript
{
  help: [
    { title: string, help_redirect: string },
    ...
  ],
  faq: [
    { id: number|string, title: string },
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
  faq: {
    items: [
      { id: '...', title: '...', view_count: ... },
      { id: '...', title: '...', view_count: ... }
    ],
    pagination: {
      page_count: 11,
      total_item_count: 105
    }
  }
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
  faq: {
    items: [
      {
        id: number|string,
        title: string,
        view_count: number  // Số lần xem
      },
      ...
    ],
    pagination: {
      page_count: number,      // Tổng số trang
      total_item_count: number // Tổng số kết quả
    }
  }
}
```

### Bước 4: Infinite Scroll (Load More)

```
User scroll tới bottom (sentinel trong view)
  ↓
IntersectionObserver kích hoạt
  ↓
postMessage('loadMore', {
  query: 'keyword',
  page: 2,
  limit: 10
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
Nếu còn items → Hiển thị loading indicator
  ↓
Nếu hết items → Hiển thị 'end of results' message
```

### Bước 5: Clear Search (Click dấu X)

```
User click X button (clear input)
  ↓
input event listener kích hoạt
  ↓
searchInput.value = "" (empty)
  ↓
Clear searchResults container
  ↓
postMessage('search', { query: ""})
  ↓
Flutter: Call API để fetch dữ liệu mới
  ↓
Return: { HELP: [...], FAQ: [...] }
  ↓
JS: updateDataAfterReset(data)
  ↓
Reset search state & re-render sections
```

---

## 📡 API & Methods

### `init(data)`
Khởi tạo controller với dữ liệu từ Flutter.

```javascript
const data = {
  help: [ { title, help_redirect }, ... ],
  faq: [ { id, title }, ... ]
};
helpPageController.init(data);
```

### `setSearchResults(results)`
Set kết quả tìm kiếm từ Flutter (page 1).

```javascript
window.helpPageController.setSearchResults({
  faq: {
    items: [
      { id: 103, question: 'ログイン時にエラーコードE001が表示されます', view_count: 0, score: 373.43835 },
      { id: 110, question: 'ﾛｸﾞｲﾝできない（半角カタカナ）', view_count: 0, score: 119.75978 },
      ...
    ],
    pagination: {
      page_count: 3,
      total_item_count: 25
    }
  }
});
```

**Lưu ý:** 
- Tự động reset `#currentSearchPage = 1`
- `question` để hiển thị nội dung, `view_count` để hiển thị số lần xem FAQ

### `appendSearchResults(newResults)`
Append thêm items từ page tiếp theo.

```javascript
window.helpPageController.appendSearchResults({
  faq: {
    items: [
      { id: 119, question: 'バックアップはどのように取るのか', view_count: 6, score: 15.98765 },
      { id: 120, question: '自動更新を無効にする方法', view_count: 9, score: 14.87654 },
      ...
    ],
    pagination: {
      page_count: 3,
      total_item_count: 25
    }
  }
});
```

**Lưu ý:** 
- Auto increment `#currentSearchPage++`
- Merge items từ page hiện tại với items mới

### `setData(newData)`
Update toàn bộ dữ liệu HELP & FAQ.

```javascript
helpPageController.setData({
  help: [ { title, help_redirect }, ... ],
  faq: [ { id, title }, ... ]
});
```

### `getData()`
Lấy dữ liệu hiện tại.

```javascript
const data = helpPageController.getData();
```

### `updateDataAfterReset(data)`
Update dữ liệu & reset toàn bộ search state (được gọi từ Flutter sau khi user xóa search).

```javascript
window.helpPageController.updateDataAfterReset({
  help: [ { title, help_redirect }, ... ],
  faq: [ { id, title }, ... ]
});
```

**Lưu ý:** Method này sẽ:
- Update `#data` với dữ liệu mới
- Reset `#searchResults = null`
- Reset `#currentSearchPage = 1`
- Reset `#searchQuery = ''`
- Xóa search input
- Re-render toàn bộ trang
- Setup event listeners lại

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
**Gửi khi:** User nhấn Enter  
**Mục đích:** Request app call API với query & page

#### 4. Load More
```javascript
postMessage('loadMore', {
  query: 'keyword',
  page: 2,
  limit: 10
})
```
**Gửi khi:** User scroll gần bottom (IntersectionObserver kích hoạt)  
**Mục đích:** Request app load page tiếp theo

#### 5. Select Topic
```javascript
postMessage('selectTopic', {
  page: 'daily_report',
  type: 'topic'
})
```
**Gửi khi:** User click HELP item  
**Mục đích:** Navigate tới trang help

#### 6. Select FAQ
```javascript
postMessage('selectFaq', {
  type: 'faq',
  id: 'faq-1',
  title: 'FAQ Title'
})
```
**Gửi khi:** User click FAQ item  
**Mục đích:** Navigate tới chi tiết FAQ

#### 7. Reset Search
```javascript
postMessage('resetSearch', { query: "" })
```
**Gửi khi:** User xóa hết search query (click X button hoặc input trống)  
**Mục đích:** Request app fetch dữ liệu mới để update UI

### Messages từ Flutter → JavaScript

#### 1. Initialize
```javascript
window.initHelpPage({
  help: [ { title, help_redirect }, ... ],
  faq: [ { id, title }, ... ]
})
```

#### 2. Set Search Results
```javascript
window.helpPageController.setSearchResults({
  faq: {
    items: [ ... ],
    pagination: {
      page_count: 11,
      total_item_count: 105
    }
  }
})
```

#### 3. Append Search Results
```javascript
window.helpPageController.appendSearchResults({
  faq: {
    items: [ ... ],
    pagination: {
      page_count: 11,
      total_item_count: 105
    }
  }
})
```

#### 4. Update Data After Reset
```javascript
window.helpPageController.updateDataAfterReset({
  help: [ { title, help_redirect }, ... ],
  faq: [ { id, title }, ... ]
})
```
**Gửi khi:** App fetch dữ liệu mới sau khi JS gọi postMessage('search')  
**Mục đích:** Update data & reset toàn bộ search state

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

#### 1. HELP Item / FAQ Item Click
```javascript
document.querySelectorAll('.help-item').forEach(item => {
  item.addEventListener('click', () => {
    const redirect = item.dataset.redirect;
    postMessage('redirectPage', { page: redirect });
  });
});

document.querySelectorAll('.faq-item').forEach(item => {
  item.addEventListener('click', () => {
    const id = item.dataset.id;
    postMessage('selectFaq', { type: 'faq', id: id });
  });
});
```

#### 2. Search Result Item Click
```javascript
document.querySelectorAll('.search-result-item').forEach(item => {
  item.addEventListener('click', () => {
    const type = item.dataset.type;
    
    if (type === 'help') {
      postMessage('redirectPage', { page: item.dataset.redirect });
    } else {
      postMessage('selectFaq', { type: 'faq', id: item.dataset.id });
    }
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
│ Render HELP, FAQ, Contact sections                     │
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
│ postMessage('search', { query, page: 1 , limit: 10})    │
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
│   • Click HELP item → postMessage('redirectPage')      │
│   • Click FAQ item → postMessage('selectFaq')          │
│   • Click Load More → postMessage('search', page: 2)   │
│   • Click X → Clear search results UI                  │
│              → postMessage('search', { query: "" })     │
│              → Flutter fetch fresh data                 │
│              → updateDataAfterReset(data)               │
│              → Show sections again                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing

### Test via Console

#### 1. Mock Search Results
```javascript
window.helpPageController.setSearchResults({
  faq: {
    items: [
      { id: 103, question: 'ログイン時にエラーコードE001が表示されます', view_count: 15, score: 373.43835 },
      { id: 110, question: 'ﾛｸﾞｲﾝできない（半角カタカナ）', view_count: 8, score: 119.75978 },
      { id: 111, question: 'パスワードを忘れた場合の対処方法', view_count: 12, score: 98.12345 }
    ],
    pagination: {
      page_count: 3,
      total_item_count: 25
    }
  }
});
```

#### 2. Mock Append Results
```javascript
window.helpPageController.appendSearchResults({
  faq: {
    items: [
      { id: 112, question: 'アカウントがロックされました', view_count: 5, score: 87.65432 },
      { id: 113, question: '二段階認証の設定方法', view_count: 3, score: 76.54321 },
      { id: 114, question: 'メールアドレスを変更する方法', view_count: 8, score: 65.43210 }
    ],
    pagination: {
      page_count: 3,
      total_item_count: 25
    }
  }
});
```

#### 3. Mock Search Results with Many Items
```javascript
window.helpPageController.setSearchResults({
  faq: {
    items: [
      { id: 103, question: 'ログイン時にエラーコードE001が表示されます', view_count: 0, score: 373.43835 },
      { id: 110, question: 'ﾛｸﾞｲﾝできない（半角カタカナ）', view_count: 0, score: 119.75978 },
      { id: 111, question: 'パスワードを忘れた場合の対処方法', view_count: 12, score: 98.12345 },
      { id: 112, question: 'アカウントがロックされました', view_count: 5, score: 87.65432 },
      { id: 113, question: '二段階認証の設定方法', view_count: 3, score: 76.54321 },
      { id: 114, question: 'メールアドレスを変更する方法', view_count: 8, score: 65.43210 },
      { id: 115, question: 'セッションが切断される問題の対処', view_count: 2, score: 54.32109 },
      { id: 116, question: '表示が崩れる（CSS関連）', view_count: 1, score: 43.21098 },
      { id: 117, question: 'データのエクスポート方法', view_count: 7, score: 32.10987 },
      { id: 118, question: 'インポート時にエラーが発生する', view_count: 4, score: 21.09876 }
    ],
    pagination: {
      page_count: 9,
      total_item_count: 85
    }
  }
});
```

#### 4. Mock Update Data After Reset
```javascript
window.helpPageController.updateDataAfterReset({
  help: [
    { title: 'ログインできない場合', help_redirect: 'daily_report' },
    { title: 'パスワードを変更する方法', help_redirect: 'development' },
    { title: 'アカウント設定について', help_redirect: 'current_address' },
    { title: 'エラーコード一覧', help_redirect: 'inquiry_list' }
  ],
  faq: [
    { id: 5, title: 'In other words, Navicat provides the ability' },
    { id: 94, title: 'The reason why a great man is great is that' },
    { id: 80, title: 'Instead of wondering when your next vacation is' },
    { id: 62, title: 'Remember that failure is an event' }
  ]
});
```

#### 5. Get Current Data
```javascript
console.log(window.helpPageController.getData());
```

---

## ⚙️ Configuration

### Items Per Page
```javascript
#itemsPerPage = 10  // Mỗi trang hiển thị 10 items
```

### Infinite Scroll Sentinel
```javascript
// Sentinel element at bottom of search results
<div class="infinite-scroll-sentinel" id="scroll-sentinel" style="padding: 20px; text-align: center;">
  <div class="loading-spinner">読み込み中...</div>
</div>
```

**Kích hoạt khi:** Sentinel đó là 100px từ bottom của viewport  
**Tác dụng:** Trigger load more items tự động

### Data Structure
```javascript
// HELP Item Structure (Initial)
{ title: string, help_redirect: string }

// FAQ Item Structure (Initial)
{ id: number|string, title: string }

// Search Result Item Structure
{
  id: number|string,
  title: string,          // (optional) Tiêu đề
  question: string,       // (optional) Câu hỏi
  view_count: number,     // Số lần xem
  score: number           // Điểm ranking của kết quả
}

// Full Response Structure from Search
{
  faq: {
    items: [ ... ],
    pagination: {
      page_count: number,
      total_item_count: number
    }
  }
}
```

---

## 🔗 File References

- **HTML:** `help-page/index.html` - Template container
- **CSS:** `help-page/css/styles.css` - Styling
- **JS:** `help-page/js/index.js` - Main controller

