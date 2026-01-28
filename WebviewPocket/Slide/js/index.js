(function () { 
  var slideElements = document.querySelectorAll('.swiper-slide');
  var slideIds = Array.from(slideElements).map(function(slide) {
    return slide.dataset.pageId;
  });

  var params = new URLSearchParams(document.location.search),
      typeActive = params.get('active') || 'check_test';
  var activeId = typeActive === 'career_consulting' ? 'career_consulting'
                : typeActive === 'diagnose' ? 'diagnose_start'
                : 'category_list';

  console.log('Active ID:', activeId);
  var isActive = slideIds.indexOf(activeId);
  if (isActive === -1) isActive = 0;

  var swiper = new Swiper(".swiper-container", {
	initialSlide: isActive,
    slidesPerView: 2,
    spaceBetween: 40,
    centeredSlides: true,
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    breakpoints: {
      992: {
        slidesPerView: 3,
      },
    },
    on: {
	    init: function(){
	    	document.querySelector('.swiper-container').classList.remove('hidden')
	    },
      slideChange: function(evt) {
        var slideElements = document.querySelectorAll('.swiper-slide');
        var slideIds = Array.from(slideElements).map(function(slide) {
          return slide.dataset.pageId;
        });

        var pageId = slideIds[this.realIndex] || slideIds[0];
        var value;
        switch(pageId) {
          case 'category_list':
            value = 'check_test';
            break;
          case 'career_consulting':
            value = 'career_consulting';
            break;
          case 'diagnose_start':
            value = 'diagnose';
            break;
          default:
            value = pageId;
        }
        console.log('Active slide changed to:', value);
        postMessage('toSlide', { "value": value });
      }
    }
  });
  function postMessage (fncName, msg){
    msg = JSON.stringify(msg);
    if( 'webkit' in window ){
      window.webkit.messageHandlers[fncName].postMessage(msg);
    }else if( 'Android' in window || 'android' in window ) {
      (window.android || window.Android)[fncName](msg);
    }
  }

  var slides = document.querySelectorAll('.swiper-slide'),
    btnNext = document.querySelector('.swiper-button-next'),
    btnPrev = document.querySelector('.swiper-button-prev');
  
    btnNext.style.right = 'calc(50% - ' + (slides[0].clientWidth/2 + 35) +'px)';
    btnPrev.style.left = 'calc(50% - ' + (slides[0].clientWidth/2 + 35) +'px)';
    for (var i = 0; i < slides.length; i++) {
      slides[i].addEventListener("click", function (evt) {
        console.log(evt.target)
        postMessage('backPage', { "value": this.dataset.pageId })
      })
    };

})()