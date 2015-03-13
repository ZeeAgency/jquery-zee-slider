(function($) {
  $.fn.zeeSlider = function(params) {

    // Configuration
    params = $.extend({
      currentClass:       'current',
      nextClass:          'next',
      prevClass:          'prev',

      controlsSelector:   '.controls a',
      slidesSelector:     '.slides li',
      pagerSelector:      '.pager li a',
      captionsSelector:   '.captions li',

      slideSelectEvent:   'slide-select',
      slideMoveEvent:     'slide-move',
      controlsEvent:      'fake-click',
      pagerEvent:         '',

      endEventName:       'slide-end',
      currentSlideData:   'current-slide',

      selectInside:       true,
      loop:               true,
      auto:               false,
      interval:           1000,
      smartAuto:          true,
      autorun:            false,

      // this = $slides
      getCurrent: function() {
        return this.filter('.'+params.currentClass);
      },

      // this = $slides
      // Starts at 1
      getById: function(id) {
        return this.filter(':nth-child('+id+')');
      },

      // this = current slide
      getFuture: function(direction, loop) {
        var $future = this[direction]();

        if(!$future.length && loop) {
          $future = this.siblings((direction === 'next' ? ':first' : ':last')+'-child');
        }

        return $future;
      },

      // this = current slide
      getSiblings: function(direction) {
        return this[!direction ? 'siblings' : direction+'All']();
      },

      // this = a
      getPagerId: function() {
        return this.parent().prevAll().length + 1;
      },

      // this = $pager
      pagerCallback: function($current) {
        this.parent()
          .filter(':nth-child('+($current.prevAll().length+1)+')')
          .activate();
      },

      // this = $captions
      captionCallback: function($current) {
        this.filter(':nth-child('+($current.prevAll().length+1)+')')
          .activate();
      },

      // this = $controls
      checkArrow: function($current, direction) {
        direction = direction || 'next';
        this.filter('.'+params[direction+'Class'])
          [params.getSiblings.call($current, direction).length ? 'enable' : 'disable']();
      },

      // this = $slideshow
      callback: function($current) {
        // console.log('callback');
      }
    }, params);


    return this.each(function() {

      // Caching
      var slideshow = this,
          $slideshow = $(slideshow),

          timer,
          direction,
          $a,
          $future,

          context =   params.selectInside ? slideshow : 0,
          $controls = $(params.controlsSelector, context),
          $slides =   $(params.slidesSelector, context),
          $pager =    $(params.pagerSelector, context),
          $captions = $(params.captionsSelector, context),

          antiPrevClass =    params.currentClass+' '+params.nextClass,
          antiNextClass =    params.currentClass+' '+params.prevClass,
          antiCurrentClass = params.nextClass+' '+params.prevClass,

          auto =        $slideshow.hasClass('auto') || params.auto,
          zIndex =      1000,
          $current =    params.getCurrent.call($slides),
          autoNext = function(e) {
            clearTimeout(timer);
            timer = setTimeout(function() {
              if($.data(slideshow, 'auto')) {
                $controls.filter('.'+params.nextClass).trigger(params.controlsEvent);
              }
            }, $.data(slideshow, 'interval'));
          };

      /** /
      console.log('interval', $.data(slideshow, 'interval'));
      console.log('controls', $controls);
      console.log('slides', $slides);
      console.log('pager', $pager);
      console.log('captions', $captions);
      /**/




      // Public
      $.data(slideshow, {
        'loop': !$slideshow.hasClass('no-loop') && params.loop,
        'auto': auto,
        'real-auto': auto,
        'interval': $slideshow.attr('data-interval') || params.interval
      });


      // Reorder slides
      /** /
      if(!$slideshow.hasClass('sheet-left')
        && !$slideshow.hasClass('sheet-down')
        && !$slideshow.hasClass('sheet-up'))
      {
        $slides.each(function() {
          $(this).css('z-index', zIndex--);
        });
      }
      /**/

      // Do What BackEnd Dev Didn't
      if(!$current.length) {
        $current = $slides.filter(':first-child').addClass(params.currentClass);
      }

      $current.nextAll().removeClass(antiNextClass).addClass(params.nextClass);

      if(params.smartAuto) {
        $slideshow
          .on('mouseenter', function() {
            $.data(this, 'auto', false);
          })
          .on('mouseleave', function() {
            $.data(this, 'auto', $.data(this, 'real-auto'));
            autoNext();
          });
      }

      // Controls
      $controls.on('click ' + params.controlsEvent, function(e) {
        e.preventDefault();

        $a = $(this);
        // Je dois lever cette limitation...
        if(!$a.hasClass('disabled') || 1) {
          direction = $a.hasClass(params.nextClass) ? 'next' : 'prev';
          $current = params.getCurrent.call($slides);
          $future = params.getFuture.call($current, direction, $.data(slideshow, 'loop'));

          if(!$future.length) {
            $slideshow.trigger(params.endEventName, {direction: direction});
          // Mais je remets la limite ici
          } else if(!$a.hasClass('disabled')) {
            $future.trigger(params.slideMoveEvent, {direction: direction});
          }
        }
      });

      // Auto Next
      if($.data(slideshow, 'auto')) {
        $controls.on('click ' + params.controlsEvent, autoNext);
        autoNext();
      }

      // Slide Event

      // console.log('$slides', $slides);
      // console.log('$captions', $captions);

      $slides.on(params.slideMoveEvent, function(e) {
        e.preventDefault();
/*
        e.stopPropagation();
        e.stopImmediatePropagation();
*/

        $current = $(this);

        // Before current
        params.getSiblings.call($current, 'prev')
          .removeClass(antiPrevClass)
          .addClass(params.prevClass);

        // After current
        params.getSiblings.call($current, 'next')
          .removeClass(antiNextClass)
          .addClass(params.nextClass);

        // Current
        $current
          .removeClass(antiCurrentClass)
          .addClass(params.currentClass);

        // Could be useful Info
        $.data(slideshow, params.currentSlideData, $current.prevAll().length+1);

        /* Prototype of JS animation fallback * /
        params.getSiblings.call($current, 'prev')
          .removeClass(antiPrevClass)
          .addClass(params.prevClass)
          .animate({left: '-100%'}, 500);

        params.getSiblings.call($current, 'next')
          .removeClass(antiNextClass)
          .addClass(params.nextClass)
          .animate({left: '100%'}, 500);


        // Future becomes Current
        $current.removeClass(antiCurrentClass)
            .addClass(params.currentClass)
            .animate({left: 0}, 500);
        /**/

        params.pagerCallback.call($pager, $current);

        params.captionCallback.call($captions, $current);

        if(!$.data(slideshow, 'loop')) {
          params.checkArrow.call($controls, $current, 'prev');
          params.checkArrow.call($controls, $current, 'next');
        }

        params.callback.call($slideshow, $current);
      });

      $slideshow.on(params.slideSelectEvent, function(e, slideId) {
        e.preventDefault();
        console.log('slideId', slideId);
        if(slideId) {
          params.getById.call($slides, slideId).trigger(params.slideMoveEvent);
        }
      });

      if(params.autorun) {
        // Do what BackEnd Dev didn't
        $slides.filter('.'+params.currentClass).trigger(params.slideMoveEvent);
      }

      // Paging
      $pager.on('click ' + params.pagerEvent, function(e) {
        e.preventDefault();

        params.getById.call($slides, params.getPagerId.call($(this))).trigger(params.slideMoveEvent);
      });
    });
  };
})(jQuery);
