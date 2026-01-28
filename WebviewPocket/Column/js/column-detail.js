class ColumnDetail {
  constructor() {
    this.data = {};
    this.isAppCall = false;
  }

  setDataColumn (data) {
    this.data = data;
    const loadingImg = ' data-lazy-web-view-$1';
    const patternImg = new RegExp('\\s(src\="|\')', 'g');
    this.data.content = (document.getElementById('column-content').innerText || '')
        .replace(patternImg, loadingImg);

    let tocContents = document.querySelectorAll('.column-toc-content');
    if ( tocContents.length > 0 ){
      tocContents.forEach( (text, idx) => {
        if (!this.data.tocs[idx]) {
          this.data.tocs[idx] = { content: '', childs: [] };
        }
        this.data.tocs[idx].content = (text.innerText||'')
            .replace(patternImg, loadingImg);
    
        const childs = document.querySelectorAll(
            '.column-toc-content-child[data-p-id="'+this.data.tocs[idx].id+'"]'
        );
        if (childs.length){
          childs.forEach( (child) => {
            let level = child.getAttribute('data-p-idx') || '';
            if (!this.data.tocs[idx].childs[level]) {
              this.data.tocs[idx].childs[level] = { content: '' };
            }
        
            //if (this.data.tocs[idx].childs[level] || false)
            this.data.tocs[idx].childs[level].content = (child.innerText||'')
              .replace(patternImg, loadingImg);
          });
        }
      });
    }

    tocContents = null;

    this.isAppCall = data.isAppCall;
    columnDetail.render();
  }

  createToc() {
    return this.data.tocs.map(item => {
      const childrenHtml = item.childs ? Object.values(item.childs).map(child => `
        <li>
          <a href="javascript:void(0)" class="btn-arrow">
            <i class="ph-bold ph-caret-down"></i>
          </a>
          <a href="#heading-${child.id}" class="toc-link" data-id="${child.id}">
              ${child.title}
          </a>
        </li>
      `).join('') : '';
      return `
        <li class="mb-15">
          <a href="javascript:void(0)" class="btn-arrow btn-arrow--gray">
            <i class="ph-bold ph-caret-down"></i>
          </a>
          <a href="#heading-${item.id}" class="toc-link" data-id="${item.id}">${item.title}</a>
          ${childrenHtml ? `<ul class="toc-submenu open">${childrenHtml}</ul>` : ''}
        </li>
      `;
    }).join('');
  }

  createContentToc () {
    const isContentEmpty = (html) => {
      // Remove all HTML tags and trim the content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
    
      // Get all text content from the temporary element
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
      // Remove all whitespace and check if it's empty
      return textContent.trim() === '';
    };
    return this.data.tocs.map(content => {
      const childrenContent = content.childs ? Object.values(content.childs).map(child => `
          <div class="title-doc title-doc--h3" id="heading-${child.id}">
            ${child.title}
          </div>
          ${isContentEmpty(child.content) ? '' : `<div class="content">${child.content}</div>`}
        `).join('') : '';

      return `
        ${ content.title
        ?  `<div class="parent-content">
            <div class="title-doc title-doc--main" id="heading-${content.id}">${content.title}</div>
              ${isContentEmpty(content.content) 
                ? '' 
                : `<div class="content">${content.content}</div>` }
              ${childrenContent 
                ? `<div class="child-content">${childrenContent}</div>` 
                : ''}
          </div>`
          : ''
         }
      `;
    }).join('')
  }

  async render() { 
    try {

      let { scate, date, title, image, content, tocs} = this.data;

      document.body.innerHTML = '';

      let container = document.createElement("div");
      container.className = "page-content";
      container.id = 'top-page-content';
      //console.log(Object.values(toc.child));
      // let isShowTableOfContent = toc && toc.length >= 1 && toc.map(p => {
      //   return p.childs && Object.values(p.childs).length > 0
      // });
      let isShowTableOfContent = tocs && (tocs.length > 1 ||
        tocs.some(function(p) {
          return p.childs && Object.values(p.childs).length > 0;
        }));
   
      container.innerHTML = `
        <div class="header-container">
            <a href="javascript:void(0)" class="btn-top" id="btn-top"></a>
        </div>
        <section class="content-inner">
          <div class="d-flex justify-content-between">
            <span class="badge badge-style" id="btn-cate" data-id="${scate.id}" data-title="${scate.title}" style="--badge-background: ${scate.bg_color || 'pink'}; --badge-color:${scate.txt_color || '#000'}">${scate.title || ''}</span>
            <span class="date">${date}</span>
          </div>
          <div class="fs-lg my-3">${title}</div>
          <div class="text-center content-img">
            <img data-lazy-web-view-src="${image}" src="/assets/images/loading.gif" alt="" />
          </div>
          <div class="content-text mb-15">${content}</div>

          <div class="toc_container ${isShowTableOfContent ? '' : 'd-none' }">
            <span class="fs-md">目次</span>
            <ul class="toc_list">${isShowTableOfContent ? this.createToc() : ''}</ul>
          </div>
          <div class="toc-content">${this.createContentToc()}</div>
        </section>
      `;

      const btnBackToTop = document.createElement("a");
      btnBackToTop.setAttribute("href", "#top-page-content");
      btnBackToTop.className = "btn-back-top";
      btnBackToTop.id = "scrollToTopBtn";
      btnBackToTop.innerHTML = "<i class='ph-bold ph-caret-double-up'></i>";
 
      if (!this.isAppCall) {
        let UIFakeMobile = document.createElement("div");
        UIFakeMobile.className = "faker-phone";

        let pageLoader = document.createElement("div");
        pageLoader.className = "page-loader";
  
        UIFakeMobile.innerHTML = `
          <a href="javascript:void(0)" class="btn-back-top-custom" id="scrollToTopBtn">
            <i class="ph-bold ph-caret-double-up"></i>
          </a>
          <div class="faker-phone--screen">
            ${container.outerHTML}
          </div>`;

        document.body.className= 'd-flex justify-content-center align-items-center';
        document.body.prepend(UIFakeMobile);
        document.body.prepend(pageLoader);

      } else {
        document.body.prepend(container);
  
        // Remove all elements with the class 'btn-back-top'
        document.querySelectorAll('.btn-back-top').forEach(element => element.remove());

        // Remove the element with the ID 'scrollToTopBtn' if it exists
        const scrollToTopBtn = document.getElementById('scrollToTopBtn');
        if (scrollToTopBtn) {
          scrollToTopBtn.remove();
        }

        document.body.append(btnBackToTop);
  
      }

      const DOMAIN_DEFAULT = {'www.staffservice.co.jp': true};

      //Block default behavior of all tags a
      document.querySelectorAll('.content-inner a[href]').forEach(anchor => {

        let dataLink = anchor.getAttribute('href') || '';
      
        if ( dataLink &&
            dataLink.indexOf('#') !== 0 &&
            dataLink.toLowerCase() !== 'javascript:void(0)'
        ) {

          let url = false;
          try{
            url = new URL(dataLink);
          }catch(e){ url= false; }

          if ( url && url.host ) {
            let isInnerURL = false;
            // If the URL matches the default domain and has a hash, update the href to only the hash
            if ( DOMAIN_DEFAULT.hasOwnProperty(url.host) &&
                1 < (url.hash || '').length
            ) {
              try {
                if (document.querySelector(url.hash)) {
                  anchor.setAttribute('href', url.hash);
                  isInnerURL = true;
                }
              } catch (e) {}
            }

            // Add event listener for valid URLs
            isInnerURL || anchor.addEventListener('click', (e) => {
              let target = e.target;
              if( e.target.nodeName != 'A' ) target = target.parentElement;

              // Validate the URL again before calling postMessage
              //if (this.validURL(href)) {
              e.preventDefault();

              this.postMessage('toLinkBrowser', {
                value: target.getAttribute('href')
              });
              //}
            });
          }
        }
      });

      let iframePlayers = {'www.youtube.com': true};

	  if( this.isAppCall ) document.querySelectorAll('iframe')
	  .forEach(iframe => {
		  let src = iframe.getAttribute('data-lazy-web-view-src');
		  if( src.indexOf('http') === 0 ){
			let url = new URL(src);
			
			if( iframePlayers.hasOwnProperty(url.hostname) ){

				let div = document.createElement('a');
                div.setAttribute('style', 'width:100%;height:100%;position:absolute;top:0;bottom:0;z-index:10');
                div.setAttribute('href', 'javascript:void(0)');
				iframe.after(div);

				iframe.style.zIndex = '-1';
				iframe.style.position = 'relative';
				
				div.addEventListener('click', (e) => {
					e.preventDefault();  e.stopPropagation();
					
					this.postMessage('toLinkBrowser', { "value": src });
					
					return false;
				});

                div.append(iframe);

                let wrapDiv = document.createElement('div');
                wrapDiv.className = 'web-view-iframe-player';

                if ( iframe.getAttribute('height') )
                  wrapDiv.style.height = iframe.getAttribute('height') + 'px';

                div.after(wrapDiv);

                wrapDiv.append(div);
			}
		  }
	  });
	  
      // Add event listeners after the DOM is added to the body
      this.addHandleEvent();

      logMsg('loadFinished');

      const lazyItems = document.querySelectorAll('[data-lazy-web-view-src]'),
            totalLazy = lazyItems.length;
      if ( totalLazy ){
        let timeout = 0;
        lazyItems.forEach((item) => {
          setTimeout(() => {
            item.setAttribute('src', item.getAttribute('data-lazy-web-view-src'));
          }, timeout || 50);
          timeout += 100;
        });

        setTimeout(() => {
          this.postMessage('loadFinished', {success: true})
        }, Math.min(1000, totalLazy * 200) );
      }else{
        this.postMessage('loadFinished', { success: true });
      }
    } catch (error) {
      const msg = error.message;
      this.postMessage('loadFail', {error:  msg, "success":  false });

      this.postMessage('loadFinished', { success: false });

      logMsg('loadFail: ' + msg);
    }
  }

  addHandleEvent() {
    /**
     * Event click send id cate
     */
    const btnCate = document.getElementById("btn-cate");
    if (btnCate) {
      btnCate.addEventListener('click', (e) => {
        e.preventDefault();
        const cateId = e.target.getAttribute("data-id");
        const cateTitle = e.target.getAttribute("data-title");

        this.postMessage('searchCate', { id: cateId, title: cateTitle });
      });
    } else {
      console.error('btn-cate element not found');
    }
    /**
    * Event click scroll to .... 
    */
    const tocLinks = document.querySelectorAll('.toc-link');
    if (tocLinks.length > 0) {
      tocLinks.forEach(tocLink => {
        tocLink.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = e.target.getAttribute('href').substring(1);  // Get the target id
          const targetElement = document.getElementById(targetId);

          if (targetElement) {
            const scrollOptions = {
              top: targetElement.offsetTop - 20, // Adjust scroll position
              behavior: 'smooth' // Smooth scroll
            };
          
            if(!this.isAppCall) {
              const container = document.querySelector('.faker-phone--screen');
              container.scrollTo(scrollOptions);
            } else {
              // Scroll to the target element
              window.scrollTo(scrollOptions)
            }
          } else {
            console.error(`Element with ID ${targetId} not found`);
          }
        });
      });
    } else {
      console.error('No .toc-link elements found');
    }

    /**
    * Event click collapse table of content
    */
    const btnArrows = document.querySelectorAll('.btn-arrow');
    if (btnArrows.length > 0) {
      // Add click event listener to each btn-arrow
      btnArrows.forEach(btnArrow => {
        btnArrow.addEventListener('click', function() {
          const submenu = this.parentElement.querySelector('.toc-submenu');
      
          // Check if submenu exists
          if (!submenu) return;
          submenu.classList.toggle('open');
          this.classList.toggle('open');
      
          if (submenu.classList.contains('open')) {
            // Calculate the height of the submenu
            submenu.style.display = 'block';
            const height = submenu.scrollHeight + 'px';
            submenu.style.height = '0';
      
            setTimeout(() => {
              submenu.style.height = height;
            }, 10);
      
          } else {
            // Close the submenu
            submenu.style.height = submenu.scrollHeight + 'px';
      
            // Set timeout to delay height change for transition
            setTimeout(() => {
              submenu.style.height = '0';
              // Hide submenu after transition ends
              setTimeout(() => {
                submenu.style.display = 'none';
              }, 350);
            }, 10);
          }
        });
      });
    } else {
      console.error('No .btn-arrow elements found');
    }

    const scrollToTopBtn = document.getElementById('scrollToTopBtn');

    if (scrollToTopBtn) {
      const handleScrollTop = (scrollContainer) => {
        if(!scrollContainer) {
          return
        }
        scrollContainer.scrollTo({
          top: 0,
          behavior: 'smooth' // Smooth scroll
        });
      };

      if(!this.isAppCall) {
        const container = document.querySelector('.faker-phone--screen');
        scrollToTopBtn.addEventListener('click', () => handleScrollTop(container)); 
      } else {
        scrollToTopBtn.addEventListener('click', () => handleScrollTop(document.querySelector('body')));
      }
    }
  }

  validURL(str){
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?' + // port
      '(\\/[-a-z\\d%_.~+]*)*' + // path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
  }

  postMessage(fncName, msg) {
    msg = JSON.stringify(msg);

    if ('webkit' in window) {
      window.webkit.messageHandlers[fncName].postMessage(msg);
    } else if ('android' in window) {
      (window.android || window.Android)[fncName](msg);
    }
  }
}

const columnDetail = new ColumnDetail();
const logMsg = (arguments) => {
  if (window.debug) console.log(arguments);
}

window.initColumn = function(data) {
  try {
    columnDetail.setDataColumn(data);
  } catch (error) {
    logMsg('Error in initColumn: ' + error.message);
  }
  //columnDetail.setDataColumn(data)
}



//initColumn(jsonData)





// const jsonData = {
//   "data": {
//     "date": "2024/06/20",
//     "title": "bai viet 1",
//     "scate": {
//       "id": 2,
//       "title": "cate tthai con 1"
//     },
//     "image": "https://manager.learningpocket.local/uploads/column/m4Mo8ln7t7Vj117X.jpg",
//     "content": "noi dung bài viết",
//     "toc": [
//         {
//             "cp_id": 1,
//             "cp_level": "1",
//             "cp_title": "muc 1 lớn",
//             "cp_content": "<p>aaaaaaaaaaaa</p>",
//             "childs": {
//                 "1-1": {
//                     "cp_id": 2,
//                     "cp_level": "1-1",
//                     "cp_title": "Mục 1 nhỏ",
//                     "cp_content": "<p>bfgbdfb</p>"
//                 },
//                 "1-2": {
//                     "cp_id": 3,
//                     "cp_level": "1-2",
//                     "cp_title": "mục 1 nhỏ 2",
//                     "cp_content": "<p>fdgfdgsdfgsdfg</p>"
//                 }
//             }
//         },
//         {
//             "cp_id": 4,
//             "cp_level": "2",
//             "cp_title": "mục 2 lớn",
//             "cp_content": "<p>dfdgfgdfasgasd</p>",
//             "childs": {
//                 "2-1": {
//                     "cp_id": 5,
//                     "cp_level": "2-1",
//                     "cp_title": "mục 2 nhỏ",
//                     "cp_content": "<p>dfghjdghghdfjdfghj</p>"
//                 }
//             }
//         }
//     ]
//   },
//   "isAppCall": false
// }



