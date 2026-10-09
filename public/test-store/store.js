/* Pack Test Store client script: filters, sort, cart in localStorage. Mock only. */
(function () {
  var KEY = 'pack-test-store-cart';
  function read() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
  function write(items) { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* storage blocked */ } }
  function count() { return read().reduce(function (n, i) { return n + i.qty; }, 0); }
  function add(item) {
    var items = read();
    var hit = items.filter(function (i) { return i.sku === item.sku && i.size === item.size && i.color === item.color; })[0];
    if (hit) { hit.qty += 1; } else { item.qty = 1; items.push(item); }
    write(items);
  }
  function paint() {
    var c = document.querySelector('[data-ts-cart-count]');
    if (c) { c.textContent = String(count()); }
  }
  var params = new URLSearchParams(location.search);
  var base = document.body.getAttribute('data-ts-base') || '/test-store';
  // filters on any list page
  var list = document.querySelector('[data-ts-list]');
  if (list) {
    var q = (params.get('q') || params.get('keyword') || '').toLowerCase().trim();
    var color = params.get('color'); var size = params.get('size'); var sort = params.get('sort');
    var items = Array.prototype.slice.call(list.querySelectorAll('[data-ts-item]'));
    var shown = 0;
    items.forEach(function (el) {
      var ok = true;
      if (q) { ok = ok && (el.getAttribute('data-name') + ' ' + el.getAttribute('data-category') + ' ' + el.getAttribute('data-color')).indexOf(q) >= 0; }
      if (color) { ok = ok && (' ' + el.getAttribute('data-color') + ' ').indexOf(' ' + color + ' ') >= 0; }
      if (size) { ok = ok && (' ' + el.getAttribute('data-size') + ' ').indexOf(' ' + size + ' ') >= 0; }
      el.hidden = !ok; if (ok) { shown += 1; }
    });
    if (sort) {
      items.sort(function (a, b) { var d = Number(a.getAttribute('data-price')) - Number(b.getAttribute('data-price')); return sort === 'price-desc' ? -d : d; })
        .forEach(function (el) { list.appendChild(el); });
    }
    var summary = document.querySelector('[data-ts-search-summary]');
    if (summary) { summary.textContent = shown + ' results' + (q ? ' for ' + q : ''); }
  }
  // add to cart on a product page
  var btn = document.querySelector('[data-ts-add]');
  if (btn) {
    btn.addEventListener('click', function () {
      var s = document.querySelector('[data-ts-size]'); var c = document.querySelector('[data-ts-color]');
      add({sku: btn.getAttribute('data-sku'), name: btn.getAttribute('data-name'), price: Number(btn.getAttribute('data-price')), size: s ? s.value : '', color: c ? c.value : ''});
      location.href = base + '/cart?added=' + encodeURIComponent(btn.getAttribute('data-sku'));
    });
  }
  // cart and checkout summaries
  var box = document.querySelector('[data-ts-cart]');
  if (box) {
    var rows = read();
    if (rows.length) {
      var total = 0;
      box.innerHTML = '<ul class="cart-lines">' + rows.map(function (i) {
        total += i.price * i.qty;
        return '<li data-ts-line data-sku="' + i.sku + '">' + i.name + ' (' + i.color + ', ' + i.size + ') x' + i.qty + ' - $' + (i.price * i.qty).toFixed(2) + '</li>';
      }).join('') + '</ul><p class="cart-total" data-ts-total>Total: $' + total.toFixed(2) + '</p>';
    }
  }
  paint();
})();
