# Operation List Controller - Hướng dẫn Luồng Chạy

## 📋 Mục Lục
1. [Tổng Quan](#tổng-quan)
2. [Kiến Trúc](#kiến-trúc)
3. [Luồng Khởi Tạo](#luồng-khởi-tạo)
4. [Luồng Infinite Scroll](#luồng-infinite-scroll)
5. [API & Methods](#api--methods)
6. [PostMessage Communication](#postmessage-communication)
7. [Event Listeners](#event-listeners)

---

## 🎯 Tổng Quan

**HelpPageController (Operation List)** là một class JavaScript xử lý trang danh sách chi tiết các màn hình/tính năng với các chức năng:
- ✅ Hiển thị danh sách các màn hình/chức năng
- ✅ Hỗ trợ Infinite Scroll (load more items)
- ✅ Quản lý phân trang (10 items/page)
- ✅ Giao tiếp 2 chiều với Flutter App

---

## 🏗️ Kiến Trúc

### Private Properties
```javascript
#data              // Dữ liệu các item danh sách
#searchResults     // (Reserved) dành cho tìm kiếm
#currentSearchPage // Trang hiện tại (bắt đầu từ 1)
#itemsPerPage      // 10 items per page
#searchQuery       // (Reserved) từ khóa tìm kiếm
```

### Public Methods
```javascript
init(data)              // Khởi tạo với dữ liệu
appendItems(newItems)   // Append thêm items từ load more
postMessage(funcName, msg) // Gửi message tới Flutter
```

### Private Methods
```javascript
render()                    // Render UI với items và sentinel
setupEventListeners()       // Setup event listeners (click, scroll)
#setupInfiniteScroll()      // Setup IntersectionObserver cho infinite scroll
#hasMoreItemsToLoad()       // Kiểm tra còn items để load không
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
  pagination: {
    "page_count": 1,
    "total_item_count": 12
  },
  items: [
    {
      id: 4,
      title: '個人トレーナー',
      help_redirect: 'daily_report',
      cate: [1, 100, 6]
    },
    {
      id: 8,
      title: 'げいにん',
      help_redirect: 'daily_report',
      cate: [75]
    }
  ],
  html: 'https://api.test.engibase.com/help-html/manual-list.html?is_mobile=1'
});
```

### Bước 3: Render UI & Attach Events
```
initHelpPage(data)
  ↓
helpPageController.init(data)
  ↓
this.render()               // Hiển thị danh sách items + infinite scroll sentinel
  ↓
this.setupEventListeners()  // Attach event listener cho click items
  ↓
this.#setupInfiniteScroll() // Setup IntersectionObserver
  ↓
postMessage('loadFinished', { error: null, success: true })
```

### Dữ liệu nhận được từ Flutter
```javascript
{
  pagination: {
    page_count: number,        // Tổng số trang
    total_item_count: number   // Tổng số items
  },
  items: [
    {
      id: number,
      title: string,
      help_redirect: string,
      cate: number[]
    },
    ...
  ],
  html: string  // URL tới HTML content (optional)
}
```

---

## ♾️ Luồng Infinite Scroll

### Khi User Scroll Xuống Cuối
```
User scrolls down
  ↓
IntersectionObserver detects sentinel (100px từ bottom)
  ↓
#setupInfiniteScroll() trigger
  ↓
postMessage('loadMore', {
  page: nextPage,      // page 2, 3, 4...
  limit: 10            // items per page
})
  ↓
Flutter response với:
  postMessage('loadMore', {
    pagination { page_count, total_item_count },
    items: [...]  // items mới
  })
  ↓
JavaScript call:
  window.helpPageController.appendItems(newData)
  ↓
this.#data.items = [...currentItems, ...newItems]
this.#currentSearchPage++
this.render()          // Re-render UI
this.setupEventListeners()  // Re-attach events
```

### Cơ Chế Phát Hiện
- Sử dụng `IntersectionObserver` để phát hiện khi sentinel element vào viewport
- `rootMargin: '100px'` - trigger trước 100px từ bottom
- Tự động `disconnect()` sau khi trigger để tránh duplicate requests

---

## 📡 API & Methods

### init(data)
Khởi tạo controller với dữ liệu từ Flutter

**Parameters:**
```javascript
{
  pagination: { page_count, total_item_count },
  items: []
}
```

**Luồng:**
```
1. Lưu data vào #data
2. Gọi render()
3. Gọi setupEventListeners()
```

---

### appendItems(newItems)
Append thêm items khi load more

**Parameters:**
```javascript
{
  pagination: { page_count, total_item_count },
  items: []  // Mảng items mới
}
```

**Luồng:**
```
1. Merge items: #data.items = [...current, ...new]
2. Update pagination info
3. Increment #currentSearchPage
4. Gọi render() để hiển thị items mới
5. Gọi setupEventListeners() để attach events mới
```

**Lưu ý:** 
- Phương thức này được gọi từ Flutter nhằm `window.helpPageController.appendItems(data)`
- Sentinel sẽ tự động disappear nếu đã load hết items

---

### setupEventListeners()
Setup tất cả event listeners

**Events:**
1. **List Item Click** - `.list-item`
   ```javascript
   postMessage('selectManual', {
     page: item.help_redirect,
     id: item.id
   })
   ```

2. **Redirect Page Click** - `.redirect-page` (Contact button)
   ```javascript
   postMessage('redirectPage', {
     page: item.dataset.page  // usually 'inquiry_send'
   })
   ```

3. **Infinite Scroll** - Tự động trigger khi user scroll
   ```javascript
   postMessage('loadMore', {
     page: nextPage,
     limit: 10
   })
   ```

---

### render()
Render UI dựa trên #data

**Logic:**
```javascript
// Kiểm tra dữ liệu
if (!this.#data) return

// Tính toán có còn items để load
hasMoreItems = #data.items.length < #data.pagination.total_item_count

// Tạo items HTML
itemsHtml = items.map(item => `<div class="list-item">...</div>`)

// Tạo infinite scroll sentinel nếu có more items
sentinelHtml = hasMoreItems ? `<div id="scroll-sentinel">...</div>` : ''

// Render UI với items + sentinel
app.innerHTML = template
```

---

### #setupInfiniteScroll()
Setup IntersectionObserver để phát hiện infinite scroll

**Logic:**
```javascript
1. Lấy sentinel element (#scroll-sentinel)
2. Nếu không có hoặc không còn items → return
3. Tạo IntersectionObserver
4. Khi sentinel vào viewport:
   - Tính next page
   - Gửi postMessage('loadMore', { page, limit })
   - Disconnect observer
```

---

### #hasMoreItemsToLoad()
Kiểm tra còn items để load không

**Điều kiện:** Trả về `true` nếu:
- Current page < total pages, **HOẶC**
- Current loaded items < total items

```javascript
return (currentPage < pageCount) || (loadedItems < totalItems)
```

---

### postMessage(fncName, msg)
Gửi message tới Flutter via JavaScript bridge

**Parameters:**
- `fncName`: String - tên JavaScript channel (e.g., 'selectManual', 'loadMore')
- `msg`: Object - message data

**Ví dụ:**
```javascript
postMessage('selectManual', {
  page: 'daily_report',
  id: 4
})

// JSON được gửi tới Flutter
// {"page": "daily_report", "id": 4}
```

---

## 🌉 PostMessage Communication

### JavaScript → Flutter (postMessage)

| Channel | Message | Khi Nào |
|---------|---------|---------|
| `javascriptLoaded` | `{ success: true }` | JS file loaded |
| `loadFinished` | `{ error: null, success: true }` | Khởi tạo xong |
| `selectManual` | `{ page, id }` | User click item |
| `redirectPage` | `{ page }` | User click contact button |
| `loadMore` | `{ page, limit }` | User scroll đến cuối |

---

### Flutter → JavaScript (window.helpPageController methods)

| Method | Purpose |
|--------|---------|
| `initHelpPage(data)` | Khởi tạo page lần đầu |
| `appendItems(newItems)` | Append items khi load more |

---

## 🎯 Event Listeners

### List Item Click
```javascript
// DOM Element
<div class="list-item" data-id="4" data-redirect="daily_report">
  個人トレーナー
</div>

// Handler
postMessage('selectManual', {
  page: 'daily_report',
  id: 4
})
```

---

### Contact Button Click
```javascript
// DOM Element
<div class="redirect-page" data-page="inquiry_send">
  [お問い合わせする]
</div>

// Handler
postMessage('redirectPage', {
  page: 'inquiry_send'
})
```

---

### Infinite Scroll Detection
```javascript
// IntersectionObserver triggers khi sentinel vào view
// rootMargin: '100px' → trigger sớm 100px từ bottom

postMessage('loadMore', {
  page: 2,      // Next page
  limit: 10     // Items per page
})
```

---

## 📊 State Management

### #data Structure
```javascript
{
  pagination: {
    page_count: 1,
    total_item_count: 12
  },
  items: [
    {
      id: 4,
      title: '個人トレーナー',
      help_redirect: 'daily_report',
      cate: [1, 100, 6]
    },
    ...
  ]
}
```

### #currentSearchPage
- Bắt đầu từ 1
- Increment khi gọi `appendItems()`
- Dùng để tính next page cho `loadMore`

---

## 🔄 Render Flow Details

### Initial Render
```
Dữ liệu: 2 items, 12 total items
  ↓
hasMoreItems = 2 < 12 = true
  ↓
sentinelHtml = '<div id="scroll-sentinel">...</div>'
  ↓
HTML:
  - List container
  - 2 items
  - Sentinel element (loading indicator)
  - Contact section
```

### After Append (page 2)
```
Gọi appendItems({ items: [3 items], ... })
  ↓
#data.items = [item1, item2, item3, item4, item5]
#currentSearchPage = 2
  ↓
Re-render:
  - List container
  - 5 items
  - Sentinel element (still showing - còn 7 items)
  - Contact section
```

### After Final Append (page 2 - last page)
```
Gọi appendItems({ items: [7 items], ... })
  ↓
#data.items.length = 12
#data.pagination.total_item_count = 12
  ↓
Re-render:
  - List container
  - 12 items
  - NO Sentinel element (loadedItems === totalItems)
  - Contact section
```

---

## ⚠️ Error Handling

### Initialization Errors
```javascript
try {
  helpPageController.init(data);
} catch (error) {
  postMessage('loadFinished', {
    error: error.message,
    success: false
  })
}
```

### PostMessage Errors
```javascript
if (!window[fncName]?.postMessage) {
  console.warn(`JavaScript channel ${fncName} is not defined`);
}
```

---

## 📝 Testing Checklist

- [ ] Initial load with 2 items, 12 total
- [ ] Click on list item → selectManual postMessage
- [ ] Click contact button → redirectPage postMessage
- [ ] Scroll to bottom → loadMore postMessage triggered
- [ ] Append items (page 2) - verify render correctly
- [ ] Scroll again → load page 3
- [ ] Final append - verify sentinel disappears
- [ ] All items clickable after append
- [ ] Sentinel shows correct padding (100px trigger)

---

## 🐛 Common Issues

### Sentinel Not Triggering
- **Nguyên nhân:** Setup IntersectionObserver sau render
- **Giải pháp:** `setupEventListeners()` được gọi luôn sau `render()`

### Duplicate Load More Requests
- **Nguyên nhân:** Observer disconnect chậm
- **Giải pháp:** Gọi `observer.disconnect()` ngay sau trigger

### Items Not Rendering After Append
- **Nguyên nhân:** `setupEventListeners()` không được gọi sau append
- **Giải pháp:** `appendItems()` gọi `setupEventListeners()` cuối cùng

---

## 📚 Reference

### Dữ liệu từ mock data
```javascript
pagination: {
  "page_count": 1,
  "total_item_count": 12
},
items: [
  { id: 4, title: '個人トレーナー', help_redirect: 'daily_report', cate: [1, 100, 6] },
  { id: 8, title: 'げいにん', help_redirect: 'daily_report', cate: [75] },
  // ... 10 more items
]
```

### Các file liên quan
- `operation-list.js` - Chính file này
- `styles.css` - CSS styling
- `help-main.html` - Template HTML chính
