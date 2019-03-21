/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal) {
  var ajax = Drupal.ajax,
      behaviors = Drupal.behaviors,
      debounce = Drupal.debounce,
      announce = Drupal.announce,
      formatPlural = Drupal.formatPlural;

  var layoutBuilderBlocksFiltered = false;

  behaviors.layoutBuilderBlockFilter = {
    attach: function attach(context) {
      var $categories = $('.js-layout-builder-categories', context);
      var $filterLinks = $categories.find('.js-layout-builder-block-link');

      var filterBlockList = function filterBlockList(e) {
        var query = $(e.target).val().toLowerCase();

        var toggleBlockEntry = function toggleBlockEntry(index, link) {
          var $link = $(link);
          var textMatch = $link.text().toLowerCase().indexOf(query) !== -1;
          $link.toggle(textMatch);
        };

        if (query.length >= 2) {
          $categories.find('.js-layout-builder-category:not([open])').attr('remember-closed', '');

          $categories.find('.js-layout-builder-category').attr('open', '');

          $filterLinks.each(toggleBlockEntry);

          $categories.find('.js-layout-builder-category:not(:has(.js-layout-builder-block-link:visible))').hide();

          announce(formatPlural($categories.find('.js-layout-builder-block-link:visible').length, '1 block is available in the modified list.', '@count blocks are available in the modified list.'));
          layoutBuilderBlocksFiltered = true;
        } else if (layoutBuilderBlocksFiltered) {
          layoutBuilderBlocksFiltered = false;

          $categories.find('.js-layout-builder-category[remember-closed]').removeAttr('open').removeAttr('remember-closed');
          $categories.find('.js-layout-builder-category').show();
          $filterLinks.show();
          announce(Drupal.t('All available blocks are listed.'));
        }
      };

      $('input.js-layout-builder-filter', context).once('block-filter-text').on('keyup', debounce(filterBlockList, 200));
    }
  };

  behaviors.layoutBuilderBlockDrag = {
    attach: function attach(context) {
      $(context).find('.layout-builder__region').sortable({
        items: '> .draggable',
        connectWith: '.layout-builder__region',
        placeholder: 'ui-state-drop',

        update: function update(event, ui) {
          var itemRegion = ui.item.closest('.layout-builder__region');
          if (event.target === itemRegion[0]) {
            var deltaTo = ui.item.closest('[data-layout-delta]').data('layout-delta');

            var deltaFrom = ui.sender ? ui.sender.closest('[data-layout-delta]').data('layout-delta') : deltaTo;
            ajax({
              url: [ui.item.closest('[data-layout-update-url]').data('layout-update-url'), deltaFrom, deltaTo, itemRegion.data('region'), ui.item.data('layout-block-uuid'), ui.item.prev('[data-layout-block-uuid]').data('layout-block-uuid')].filter(function (element) {
                return element !== undefined;
              }).join('/')
            }).execute();
          }
        }
      });
    }
  };

  behaviors.layoutBuilderDisableInteractiveElements = {
    attach: function attach() {
      var $blocks = $('#layout-builder [data-layout-block-uuid]');
      $blocks.find('input, textarea, select').prop('disabled', true);
      $blocks.find('a').not(function (index, element) {
        return $(element).closest('[data-contextual-id]').length > 0;
      }).on('click mouseup touchstart', function (e) {
        e.preventDefault();
        e.stopPropagation();
      });

      $blocks.find('button, [href], input, select, textarea, iframe, [tabindex]:not([tabindex="-1"]):not(.tabbable)').not(function (index, element) {
        return $(element).closest('[data-contextual-id]').length > 0;
      }).attr('tabindex', -1);
    }
  };

  $(window).on('dialog:aftercreate', function (event, dialog, $element) {
    if (Drupal.offCanvas.isOffCanvas($element)) {
      $('.is-layout-builder-highlighted').removeClass('is-layout-builder-highlighted');

      var id = $element.find('[data-layout-builder-target-highlight-id]').attr('data-layout-builder-target-highlight-id');
      if (id) {
        $('[data-layout-builder-highlight-id="' + id + '"]').addClass('is-layout-builder-highlighted');
      }
    }
  });

  if (document.querySelector('[data-off-canvas-main-canvas]')) {
    var mainCanvas = document.querySelector('[data-off-canvas-main-canvas]');

    mainCanvas.addEventListener('transitionend', function () {
      var $target = $('.is-layout-builder-highlighted');

      if ($target.length > 0) {
        var targetTop = $target.offset().top;
        var targetBottom = targetTop + $target.outerHeight();
        var viewportTop = $(window).scrollTop();
        var viewportBottom = viewportTop + $(window).height();

        if (targetBottom < viewportTop || targetTop > viewportBottom) {
          var viewportMiddle = (viewportBottom + viewportTop) / 2;
          var scrollAmount = targetTop - viewportMiddle;

          if ('scrollBehavior' in document.documentElement.style) {
            window.scrollBy({
              top: scrollAmount,
              left: 0,
              behavior: 'smooth'
            });
          } else {
            window.scrollBy(0, scrollAmount);
          }
        }
      }
    });
  }

  $(window).on('dialog:afterclose', function (event, dialog, $element) {
    if (Drupal.offCanvas.isOffCanvas($element)) {
      $('.is-layout-builder-highlighted').removeClass('is-layout-builder-highlighted');
    }
  });
})(jQuery, Drupal);