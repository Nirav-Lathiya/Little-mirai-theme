function enhanceProductDetails(column) {
  if (!column || column.dataset.miraiEnhanced === 'true') return;

  const detailsContent = column.querySelector('.product-details .group-block-content');
  const template = column.querySelector('[data-product-detail-template]');

  if (!detailsContent || !template) return;

  const fragment = template.content.cloneNode(true);
  const rating = fragment.querySelector('[data-product-rating-placeholder]');
  const shipping = fragment.querySelector('[data-product-shipping-info]');

  const price = detailsContent.querySelector('product-price');
  const buyButtons = detailsContent.querySelector('.buy-buttons-block');
  const descriptions = detailsContent.querySelectorAll('.text-block.rte');
  const description = descriptions[descriptions.length - 1];

  if (rating) {
    if (price) {
      price.insertAdjacentElement('afterend', rating);
    } else {
      detailsContent.prepend(rating);
    }
  }

  if (shipping) {
    if (description) {
      description.insertAdjacentElement('afterend', shipping);
    } else if (buyButtons) {
      buyButtons.insertAdjacentElement('afterend', shipping);
    } else {
      detailsContent.append(shipping);
    }
  }

  column.dataset.miraiEnhanced = 'true';
}

function initMiraiProductPage() {
  document.querySelectorAll('[data-product-details-column]').forEach(enhanceProductDetails);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMiraiProductPage);
} else {
  initMiraiProductPage();
}

document.addEventListener('shopify:section:load', (event) => {
  event.target.querySelectorAll('[data-product-details-column]').forEach(enhanceProductDetails);
});
