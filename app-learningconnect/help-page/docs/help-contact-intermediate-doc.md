# Help Contact Intermediate Controller - Hướng dẫn Luồng Chạy

## 📋 Mục Lục
1. [Tổng Quan](#tổng-quan)
2. [Kiến Trúc](#kiến-trúc)
3. [Luồng Khởi Tạo](#luồng-khởi-tạo)
4. [Luồng Chọn FAQ](#luồng-chọn-faq)
5. [Luồng Search](#luồng-search)
6. [API & Methods](#api--methods)
7. [PostMessage Communication](#postmessage-communication)
8. [Event Listeners](#event-listeners)
9. [CSS & Layout](#css--layout)

---

## 🎯 Tổng Quan

**HelpContactIntermediate** là một class JavaScript xử lý trang FAQ/Contact với các chức năng:
- ✅ Hiển thị danh sách FAQ items
- ✅ Hiển thị view count cho mỗi FAQ item
- ✅ Chọn FAQ item để xem chi tiết
- ✅ Fixed search bar ở đầu trang
- ✅ Điều hướng tới trang inquiry/contact
- ✅ Giao tiếp 2 chiều với Flutter App
- ✅ Responsive layout với dynamic footer padding

---

## 🏗️ Kiến Trúc

### Private Properties
```javascript
#data              // Dữ liệu FAQ items ban đầu từ Flutter
```

### Public Methods
```javascript
init(data)                    // Khởi tạo với dữ liệu FAQ items
render()                      // Render UI với FAQ items
setupEventListeners()         // Attach event listeners
postMessage(fncName, msg)     // Gửi message tới Flutter
```

### Data Structure
```javascript
{
  items: [
    {
      id: number,
      question: string,
      view_count: number
    },
    ...
  ]
}
```

**Ví dụ:**
```javascript
{
  items: [
    {
      id: 74,
      question: "Navicat Cloud could not connect and access your databases...",
      view_count: 988
    },
    {
      id: 35,
      question: "There is no way to happiness. Happiness is the way...",
      view_count: 985
    }
  ]
}
```

---

## 🚀 Luồng Khởi Tạo

### Bước 1: Load JavaScript
```javascript
// JavaScript loaded
HelpContactIntermediate.postMessage('javascriptLoaded', { success: true });
```

### Bước 2: Flutter call `initHelpPage(data)`
```javascript
window.initHelpPage({
  items: [
    { id: 74, question: "Question 1", view_count: 988 },
    { id: 35, question: "Question 2", view_count: 985 }
  ]
});
```

### Bước 3: Khởi Tạo & Render
```
initHelpPage(data)
  ↓
HelpContactIntermediate.init(data)
  ↓
this.render()              // Hiển thị FAQ items, search bar, footer
  ↓
this.setupEventListeners() // Attach event listeners cho FAQ items
  ↓
postMessage('loadFinished', { error: null, success: true })
```

---

## 📌 Luồng Chọn FAQ

### Khi user click vào FAQ item:

```
User clicks .faq-item
  ↓
Event listener triggered
  ↓
Get item id & view_count from dataset
  ↓
postMessage('selectFaq', {
  type: 'faq',
  id: 74,
  viewCount: 988
})
  ↓
Flutter receives message & navigates to FAQ detail page
```

### Code Flow
```javascript
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
```

---

## 🔍 Luồng Search

### Search Bar Focus/Blur Behavior:

**Khi Search Input Focus:**
```javascript
searchInput.addEventListener('focus', (e) => { 
  const sectionFooter = document.querySelector('.section-footer');
  const app = document.getElementById("app");
  if (sectionFooter) {
    sectionFooter.style.position = 'relative';
    app.style.paddingBottom = '0';
  }
});
```
- Footer từ fixed → relative
- Padding-bottom = 0 (để keyboard có chỗ)

**Khi Search Input Blur:**
```javascript
searchInput.addEventListener('blur', (e) => { 
  const sectionFooter = document.querySelector('.section-footer');
  if (sectionFooter) {
    sectionFooter.style.position = 'fixed';
    app.style.paddingBottom = '140px';
  }
});
```
- Footer từ relative → fixed
- Padding-bottom = 140px (để nội dung không bị che)

---

## 📚 API & Methods

### `init(data)`
Khởi tạo controller với dữ liệu từ Flutter

**Parameters:**
```javascript
data: {
  items: Array<{
    id: number,
    question: string,
    view_count: number
  }>
}
```

**Flow:**
1. Validate data
2. Store trong #data
3. Call render()
4. Call setupEventListeners()

---

### `render()`
Render toàn bộ UI của trang

**HTML Structure:**
```html
<div class="search-wrapper">              <!-- Fixed search bar -->
  <div class="search-wrapper__input">
    <input class="search-input" />
  </div>
</div>

<div style="height: 196px;"></div>         <!-- Spacer để không bị cover -->

<div class="section">
  <h2 class="note-title">お問い合わせの前にご確認ください</h2>
  <div class="section-title fixed">ヘルプカテゴリー</div>
</div>

<div class="section">
  <div class="section-container">
    <!-- FAQ items rendered here -->
    <div class="faq-item" data-id="74" data-view-count="988">
      Question text...
    </div>
  </div>
</div>

<div class="section section-footer">
  <div class="section-title">不明点が解消しない場合</div>
  <button class="redirect-page" data-page="inquiry_send">
    [お問い合わせする]
  </button>
</div>
```

---

### `setupEventListeners()`
Attach tất cả event listeners

**Events:**
1. **FAQ Item Click** - Send selectFaq message với id & view_count
2. **Search Input Focus** - Remove fixed footer để keyboard có chỗ
3. **Search Input Blur** - Restore fixed footer

---

### `postMessage(fncName, msg)`
Gửi message tới Flutter app

**Parameters:**
```javascript
fncName: string   // JavaScript channel name (e.g., 'selectFaq')
msg: Object       // Message object
```

**Example:**
```javascript
this.postMessage('selectFaq', {
  type: 'faq',
  id: 74,
  viewCount: 988
});
```

---

## 💬 PostMessage Communication

### Messages Sent to Flutter

#### 1. `javascriptLoaded`
**Khi:** JavaScript tải xong
```javascript
{
  success: true
}
```

#### 2. `loadFinished`
**Khi:** Trang render & setup listener xong
```javascript
{
  error: null,           // hoặc error message
  success: true/false
}
```

#### 3. `selectFaq`
**Khi:** User click vào FAQ item
```javascript
{
  type: 'faq',
  id: number,
  viewCount: number
}
```

---

## 🎯 Event Listeners

### FAQ Item Click Listener
```javascript
document.querySelectorAll('.faq-item').forEach(item => {
  item.addEventListener('click', () => {
    // Extract id and viewCount from data attributes
    // Send message to Flutter
  });
});
```

**Triggered by:** User clicking on `.faq-item` element

**Action:** Send 'selectFaq' message to Flutter with item metadata

---

### Search Input Focus Listener
```javascript
searchInput.addEventListener('focus', (e) => { 
  // Change footer from fixed to relative
  // Remove app padding-bottom
});
```

**Triggered by:** User tapping on search input

**Action:** Adjust layout để keyboard không bị che

---

### Search Input Blur Listener
```javascript
searchInput.addEventListener('blur', (e) => { 
  // Change footer from relative to fixed
  // Restore app padding-bottom
});
```

**Triggered by:** User leaving search input (keyboard dismissed)

**Action:** Restore footer position & padding

---

## 🎨 CSS & Layout

### Fixed Search Bar
- `position: fixed` ở top
- `z-index` cao để nằm trên content
- Chiều cao: ~73px (tuỳ padding)

### Spacer (height: 196px)
- Để tránh content bị cover bởi fixed search bar
- Tính toán: search height + margin/padding

### FAQ Item
- Layout: Block display
- Click cursor
- Border-bottom separator

### Section Footer
- **Default:** `position: relative`
- **Khi search focus:** `position: fixed` để sticky ở bottom
- Padding: 140px khi fixed, 0 khi relative

### Dynamic Padding
- App element có `padding-bottom` dynamic
- Khi footer fixed: `140px`
- Khi footer relative: `0`
- Điều chỉnh dựa trên search input state

---

## 🔄 Full User Flow

```
1. Flutter loads HTML & JavaScript
   ↓
2. JavaScript ready → send 'javascriptLoaded'
   ↓
3. Flutter calls window.initHelpPage(data)
   ↓
4. HelpContactIntermediate.init(data)
   - Store data
   - Render UI
   - Setup listeners
   ↓
5. Send 'loadFinished' to Flutter
   ↓
6. Page ready for interaction
   ↓
7a. User clicks FAQ item
    → Send 'selectFaq' → Flutter navigates to detail
    ↓
7b. User clicks "お問い合わせする" button
    → Flutter navigates to inquiry page
    ↓
7c. User searches (optional)
    → Focus: Layout adjusts for keyboard
    → Blur: Layout restored
```

---

## 📝 Notes

- **Scrollbar:** Hidden via CSS on html/body/app
- **Search:** Fixed position at top with 196px spacer
- **Footer:** Sticky positioning with dynamic padding
- **Performance:** Single .forEach loop for event delegation
- **Error Handling:** Try-catch blocks in init & setupEventListeners
- **Accessibility:** Using semantic HTML for screen readers

---

## 🚨 Common Issues & Solutions

### Issue 1: Content covered by search bar
**Solution:** Increase spacer height or adjust search bar height

### Issue 2: Footer doesn't stick to bottom
**Solution:** Check `position: fixed` CSS and `padding-bottom` value

### Issue 3: Keyboard doesn't appear when focusing search
**Solution:** Ensure footer is `position: relative` during focus

### Issue 4: FAQ click not sending to Flutter
**Solution:** Verify `selectFaq` channel is registered in Flutter
